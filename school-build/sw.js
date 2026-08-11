const CACHE_NAME = 'growth-desk-v28-20260811';
const CORE = ['./','./index.html','./styles.css','./manifest.webmanifest','./assets/icon.svg','./dist/app.bundle.js','./src/app.js','./src/db.js','./src/drawing.js','./src/papers.js','./src/templates.js','./src/reading.js','./src/worksheet-render.js','./src/paper-controls.mjs','./src/games.js','./src/data/readings.js','./src/data/word-lists.js','./src/data/huiben-manifest.mjs','./src/vendor/pdfjs/pdf.min.mjs','./src/vendor/pdfjs/pdf.worker.min.mjs','./src/vendor/pdfjs/cmaps/UniGB-UCS2-H.bcmap','./src/vendor/pdfjs/cmaps/UniGB-UCS2-V.bcmap','./src/vendor/pdfjs/cmaps/UniGB-UTF16-H.bcmap','./src/vendor/pdfjs/cmaps/UniGB-UTF16-V.bcmap','./src/vendor/pdfjs/cmaps/GB-EUC-H.bcmap','./src/vendor/pdfjs/cmaps/GB-EUC-V.bcmap','./src/vendor/pdfjs/cmaps/GBK-EUC-H.bcmap','./src/vendor/pdfjs/cmaps/GBK-EUC-V.bcmap','./src/vendor/pdfjs/standard_fonts/FoxitDingbats.pfb','./src/vendor/pdfjs/standard_fonts/FoxitFixed.pfb','./src/vendor/pdfjs/standard_fonts/FoxitFixedBold.pfb','./src/vendor/pdfjs/standard_fonts/FoxitFixedBoldItalic.pfb','./src/vendor/pdfjs/standard_fonts/FoxitFixedItalic.pfb','./src/vendor/pdfjs/standard_fonts/FoxitSerif.pfb','./src/vendor/pdfjs/standard_fonts/FoxitSerifBold.pfb','./src/vendor/pdfjs/standard_fonts/FoxitSerifBoldItalic.pfb','./src/vendor/pdfjs/standard_fonts/FoxitSerifItalic.pfb','./src/vendor/pdfjs/standard_fonts/FoxitSymbol.pfb','./src/vendor/pdfjs/standard_fonts/LiberationSans-Bold.ttf','./src/vendor/pdfjs/standard_fonts/LiberationSans-BoldItalic.ttf','./src/vendor/pdfjs/standard_fonts/LiberationSans-Italic.ttf','./src/vendor/pdfjs/standard_fonts/LiberationSans-Regular.ttf','./src/vendor/pdfjs/standard_fonts/LICENSE_FOXIT','./src/vendor/pdfjs/standard_fonts/LICENSE_LIBERATION','./src/vendor/epubjs/jszip.min.js','./src/vendor/epubjs/epub.min.js','./src/vendor/epub-reader/epub-reader.js','./src/vendor/epub-reader/epub.js','./src/vendor/epub-reader/range-utils.js','./src/vendor/epub-reader/storage.js','./src/vendor/epub-reader/zip.js','./src/vendor/epub-reader/inflate-raw.js','./src/games/chinese-word-game.js','./src/games/english-match-game.js','./src/games/game-session.js','./src/games/random.js','./src/math/index.mjs','./src/math/constants.mjs','./src/math/generators.mjs','./src/math/random.mjs','./src/math/validator.mjs','./src/math/worksheet.mjs','./huiben/manifest.json'];

const LANGUAGE_CORE = ['./src/data/knowledge/index.mjs','./src/data/knowledge/seed.json','./src/data/knowledge/poetry/manifest.json','./src/vendor/chinese/cnchar.min.js','./src/vendor/chinese/pinyin-pro.min.js'];

self.addEventListener('install', (event) => event.waitUntil(
  caches.open(CACHE_NAME)
    .then((cache) => cache.addAll([...CORE, ...LANGUAGE_CORE]))
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
    // 缓存写入不能阻塞页面拿到响应，否则大 PDF 会一直停在 arrayBuffer 等待。
    if (response.ok) void cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch (error) {
    // 离线时再回退到本机缓存，保留 PWA 可用性。
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return caches.match('./index.html');
    throw error;
  }
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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  if (isBookBinaryRequest(event.request)) {
    // Range 请求必须保持原始响应，不能缓存 206 分片，否则后续页可能读到错误的字节范围。
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(fetchFreshThenCache(event.request));
});
