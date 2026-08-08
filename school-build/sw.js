const CACHE_NAME = 'growth-desk-v14-20260808';
const CORE = ['./','./index.html','./styles.css','./manifest.webmanifest','./assets/icon.svg','./dist/app.bundle.js','./src/app.js','./src/db.js','./src/drawing.js','./src/papers.js','./src/templates.js','./src/reading.js','./src/worksheet-render.js','./src/paper-controls.mjs','./src/games.js','./src/data/readings.js','./src/data/word-lists.js','./src/data/huiben-manifest.mjs','./src/vendor/pdfjs/pdf.min.mjs','./src/vendor/pdfjs/pdf.worker.min.mjs','./src/vendor/pdfjs/cmaps/UniGB-UCS2-H.bcmap','./src/vendor/pdfjs/cmaps/UniGB-UCS2-V.bcmap','./src/vendor/pdfjs/cmaps/UniGB-UTF16-H.bcmap','./src/vendor/pdfjs/cmaps/UniGB-UTF16-V.bcmap','./src/vendor/pdfjs/cmaps/GB-EUC-H.bcmap','./src/vendor/pdfjs/cmaps/GB-EUC-V.bcmap','./src/vendor/pdfjs/cmaps/GBK-EUC-H.bcmap','./src/vendor/pdfjs/cmaps/GBK-EUC-V.bcmap','./src/vendor/pdfjs/standard_fonts/FoxitDingbats.pfb','./src/vendor/pdfjs/standard_fonts/FoxitFixed.pfb','./src/vendor/pdfjs/standard_fonts/FoxitFixedBold.pfb','./src/vendor/pdfjs/standard_fonts/FoxitFixedBoldItalic.pfb','./src/vendor/pdfjs/standard_fonts/FoxitFixedItalic.pfb','./src/vendor/pdfjs/standard_fonts/FoxitSerif.pfb','./src/vendor/pdfjs/standard_fonts/FoxitSerifBold.pfb','./src/vendor/pdfjs/standard_fonts/FoxitSerifBoldItalic.pfb','./src/vendor/pdfjs/standard_fonts/FoxitSerifItalic.pfb','./src/vendor/pdfjs/standard_fonts/FoxitSymbol.pfb','./src/vendor/pdfjs/standard_fonts/LiberationSans-Bold.ttf','./src/vendor/pdfjs/standard_fonts/LiberationSans-BoldItalic.ttf','./src/vendor/pdfjs/standard_fonts/LiberationSans-Italic.ttf','./src/vendor/pdfjs/standard_fonts/LiberationSans-Regular.ttf','./src/vendor/pdfjs/standard_fonts/LICENSE_FOXIT','./src/vendor/pdfjs/standard_fonts/LICENSE_LIBERATION','./src/vendor/epubjs/jszip.min.js','./src/vendor/epubjs/epub.min.js','./src/vendor/epub-reader/epub-reader.js','./src/vendor/epub-reader/epub.js','./src/vendor/epub-reader/range-utils.js','./src/vendor/epub-reader/storage.js','./src/vendor/epub-reader/zip.js','./src/vendor/epub-reader/inflate-raw.js','./src/games/chinese-word-game.js','./src/games/english-match-game.js','./src/games/game-session.js','./src/games/random.js','./src/math/index.mjs','./src/math/constants.mjs','./src/math/generators.mjs','./src/math/random.mjs','./src/math/validator.mjs','./src/math/worksheet.mjs','./huiben/manifest.json'];

/**
 * 尽力预缓存 huiben 目录中的绘本文件，单本失败不影响应用安装。
 * @returns {Promise<void>} 预缓存完成。
 */
async function cacheHuibenBooks() {
  const cache = await caches.open(CACHE_NAME);
  let response = await fetch('./huiben/manifest.json', { cache: 'no-store' }).catch(() => null);
  if (!response?.ok) response = await cache.match('./huiben/manifest.json');
  if (!response) return;
  const manifest = await response.json().catch(() => null);
  const urls = Array.isArray(manifest?.books)
    ? manifest.books.map((book) => book.url).filter(Boolean)
    : [];
  await Promise.allSettled(urls.map((url) => cache.add(new URL(url, self.location.href).href)));
}

self.addEventListener('install', (event) => event.waitUntil(
  caches.open(CACHE_NAME)
    .then((cache) => cache.addAll(CORE))
    .then(() => cacheHuibenBooks().catch(() => {}))
    .then(() => self.skipWaiting()),
));
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
    if (response.ok) await cache.put(request, response.clone()).catch(() => {});
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
