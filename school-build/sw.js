const CACHE_NAME = 'growth-desk-v5-20260807';
const CORE = ['./','./index.html','./styles.css','./manifest.webmanifest','./assets/icon.svg','./dist/app.bundle.js','./src/app.js','./src/db.js','./src/drawing.js','./src/papers.js','./src/templates.js','./src/reading.js','./src/worksheet-render.js','./src/games.js','./src/data/readings.js','./src/data/word-lists.js','./src/games/chinese-word-game.js','./src/games/english-match-game.js','./src/games/game-session.js','./src/games/random.js','./src/math/index.mjs','./src/math/constants.mjs','./src/math/generators.mjs','./src/math/random.mjs','./src/math/validator.mjs','./src/math/worksheet.mjs','./huiben/manifest.json'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())));

/**
 * 优先读取网络资源，并在成功后刷新离线缓存。
 * @param {Request} request 当前 fetch 请求。
 * @returns {Promise<Response>} 网络响应或缓存兜底响应。
 */
async function fetchFreshThenCache(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    // 线上部署后优先拿 GitHub Pages 最新文件，避免旧缓存继续盖住新试卷样式。
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    // 离线时再回退到本机缓存，保留 PWA 可用性。
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return caches.match('./index.html');
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetchFreshThenCache(event.request));
});
