const APP_VERSION = '20260816-1';
const CORE_CACHE_NAME = `growth-desk-core-${APP_VERSION}`;
const DATA_CACHE_NAME = `growth-desk-data-${APP_VERSION}`;
const RUNTIME_CACHE_NAME = `growth-desk-runtime-${APP_VERSION}`;
const BOOK_CACHE_NAME = 'growth-desk-books-v1';
const MAX_DATA_CACHE_ENTRIES = 80;
const MAX_RUNTIME_CACHE_ENTRIES = 120;
const CORE = ['./','./index.html','./styles.css','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon.png','./src/app.js','./src/db.js','./src/drawing.js','./src/papers.js','./src/templates.js','./src/reading.js','./src/worksheet-render.js','./src/paper-controls.mjs','./src/games.js','./src/data/readings.js','./src/data/word-lists.js','./src/data/huiben-manifest.mjs','./src/games/chinese-word-game.js','./src/games/english-match-game.js','./src/games/game-session.js','./src/games/random.js','./src/math/index.mjs','./src/math/constants.mjs','./src/math/generators.mjs','./src/math/random.mjs','./src/math/validator.mjs','./src/math/worksheet.mjs','./src/data/knowledge/index.mjs'];
const PRESERVED_CACHE_NAMES = new Set([CORE_CACHE_NAME, DATA_CACHE_NAME, RUNTIME_CACHE_NAME, BOOK_CACHE_NAME]);

self.addEventListener('install', (event) => event.waitUntil(
  caches.open(CORE_CACHE_NAME).then((cache) => cache.addAll(CORE)),
));

self.addEventListener('activate', (event) => event.waitUntil(
  caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith('growth-desk-') && !PRESERVED_CACHE_NAMES.has(key)).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()),
));

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

/**
 * 将指定缓存控制在固定条目数量内，避免 iPad PWA Cache Storage 无限膨胀。
 * @param {string} cacheName 待清理的缓存名称。
 * @param {number} maxEntries 允许保留的最大请求条目数。
 * @returns {Promise<void>} 清理完成。
 */
async function pruneCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((request) => cache.delete(request)));
}

/**
 * 优先读取网络资源，并在成功后刷新指定离线缓存。
 * @param {Request} request 当前 fetch 请求。
 * @param {string} cacheName 缓存分层名称。
 * @param {number} maxEntries 当前缓存层最大条目数。
 * @returns {Promise<Response>} 网络响应或缓存兜底响应。
 */
async function fetchFreshThenCache(request, cacheName = RUNTIME_CACHE_NAME, maxEntries = MAX_RUNTIME_CACHE_ENTRIES) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      void cache.put(request, response.clone())
        .then(() => pruneCache(cacheName, maxEntries))
        .catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return caches.match('./index.html');
    throw error;
  }
}

/**
 * 先返回知识库缓存，再在后台更新网络副本，避免 GitHub Pages 网络延迟阻塞查询。
 * @param {Request} request 当前 fetch 请求。
 * @param {string} cacheName 知识库缓存名称。
 * @param {number} maxEntries 当前缓存层最大条目数。
 * @returns {Promise<Response>} 缓存响应、网络响应或请求失败。
 */
async function cacheKnowledgeThenUpdate(request, cacheName = DATA_CACHE_NAME, maxEntries = MAX_DATA_CACHE_ENTRIES) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const update = fetch(request).then((response) => {
    if (response.ok) {
      return cache.put(request, response.clone())
        .then(() => pruneCache(cacheName, maxEntries))
        .then(() => response);
    }
    return response;
  }).catch(() => null);
  if (cached) {
    void update;
    return cached;
  }
  const response = await update;
  if (response) return response;
  throw new Error('知识库资源暂时无法读取');
}

/**
 * 判断是否为绘本二进制文件请求，避免 Service Worker 改写 PDF.js 的 Range 流。
 * @param {Request} request 当前 fetch 请求。
 * @returns {boolean} 是否为 huiben 目录下的 PDF、EPUB 或 EQUB 文件。
 */
function isBookBinaryRequest(request) {
  const url = new URL(request.url);
  return /\/huiben\/.+\.(?:pdf|epub|equb)$/iu.test(url.pathname);
}

/**
 * 判断是否为知识库分片文件。
 * @param {URL} url 请求 URL。
 * @returns {boolean} 是否属于可按需缓存的知识库分片。
 */
function isKnowledgeShardRequest(url) {
  return /\/src\/data\/knowledge\/(?:xinhua|poetry)\//u.test(url.pathname);
}

/**
 * 判断是否为不应由 SW 缓存的大型原始知识库 JSON。
 * @param {URL} url 请求 URL。
 * @returns {boolean} 是否属于 raw 数据目录。
 */
function isRawKnowledgeRequest(url) {
  return /\/src\/data\/knowledge\/raw\//u.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (isBookBinaryRequest(event.request)) {
    // Range 请求必须保持原始响应，不能缓存 206 分片，否则后续页可能读到错误的字节范围。
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  if (isRawKnowledgeRequest(url)) {
    // raw/ 大 JSON 只作为构建源数据，不进入 PWA 运行时缓存。
    event.respondWith(fetch(event.request));
    return;
  }
  if (isKnowledgeShardRequest(url)) {
    event.respondWith(cacheKnowledgeThenUpdate(event.request, DATA_CACHE_NAME, MAX_DATA_CACHE_ENTRIES));
    return;
  }
  event.respondWith(fetchFreshThenCache(event.request, RUNTIME_CACHE_NAME, MAX_RUNTIME_CACHE_ENTRIES));
});

