import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('应用壳包含移动端安装和 favicon 声明', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

  assert.match(html, /name="mobile-web-app-capable"\s+content="yes"/);
  assert.match(html, /rel="icon"\s+href="assets\/icon\.svg"/);
});

test('file 协议使用经典脚本入口避免浏览器 CORS 限制', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

  assert.doesNotMatch(html, /<link\s+rel="manifest"\s+href="manifest\.webmanifest"/);
  assert.doesNotMatch(html, /<script\s+type="module"\s+src="src\/app\.js"/);
  assert.match(html, /location\.protocol\s*===\s*'file:'/);
  assert.match(html, /dist\/app\.bundle\.js/);
  assert.match(html, /src\/app\.js/);
  assert.match(html, /manifest\.webmanifest/);
});

test('入口资源带版本参数，避免线上旧缓存继续加载旧文件', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

  assert.match(html, /styles\.css\?v=\d{8}-\d/);
  assert.match(html, /manifest\.webmanifest\?v=\d{8}-\d/);
  assert.match(html, /dist\/app\.bundle\.js\?v=\d{8}-\d/);
  assert.match(html, /src\/app\.js\?v=\d{8}-\d/);
});

test('Service Worker 升级缓存名并优先读取网络文件', () => {
  const source = readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');

  assert.match(source, /growth-desk-v32-20260811/);
  assert.match(source, /src\/data\/knowledge\/index\.mjs/);
  assert.doesNotMatch(source, /cache\.addAll\(\[[\s\S]*?src\/vendor\/chinese\/cnchar\.min\.js/);
  assert.doesNotMatch(source, /cache\.addAll\(\[[\s\S]*?src\/data\/knowledge\/poetry\/manifest\.json/);
  assert.doesNotMatch(source, /src\/data\/knowledge\/poetry\/catalog\/catalog-/);
  assert.doesNotMatch(source, /src\/data\/knowledge\/poetry\/search\/search-/);
  assert.doesNotMatch(source, /src\/data\/knowledge\/poetry\/shards\/poetry-/);
  assert.doesNotMatch(source, /cache\.addAll\(\[[\s\S]*?src\/vendor\/pdfjs\/pdf\.min\.mjs/);
  assert.doesNotMatch(source, /cache\.addAll\(\[[\s\S]*?src\/vendor\/epubjs\/epub\.min\.js/);
  assert.doesNotMatch(source, /cache\.addAll\(\[[\s\S]*?huiben\/manifest\.json/);
  assert.doesNotMatch(source, /dist\/app\.bundle\.js/);
  assert.match(source, /async function fetchFreshThenCache/);
  assert.match(source, /const response = await fetch\(request\)/);
  assert.match(source, /void cache\.put\(request, response\.clone\(\)\)\.catch/);
  assert.match(source, /\.\/src\/data\/huiben-manifest\.mjs/);
  assert.match(source, /function isBookBinaryRequest/);
  assert.match(source, /Range 请求必须保持原始响应/);
});


test('app.js statically imports math and supports local book cache fallback', () => {
  const source = readFileSync(new URL('../../src/app.js', import.meta.url), 'utf8');

  assert.match(source, /import \{ generateWorksheet \} from '\.\/math\/index\.mjs';/);
  assert.doesNotMatch(source, /import\('\.\/math\/index\.mjs'\)/);
  assert.doesNotMatch(source, /import \* as pdfjsLib from '\.\/vendor\/pdfjs\/pdf\.min\.mjs';/);
  assert.match(source, /function loadPdfJsLib/);
  assert.match(source, /import\('\.\/vendor\/pdfjs\/pdf\.min\.mjs'\)/);
  assert.match(source, /growth-desk-books-v1/);
  assert.match(source, /cache-storage/);
  assert.match(source, /falling back to IndexedDB Blob/);
  assert.match(source, /serviceWorker' in navigator[\s\S]*?register\('\.\/sw\.js\?v=20260811-10'\)/);
  assert.doesNotMatch(source, /sw\.js\?v=20260811-8/);
  assert.match(source, /function startPostBootTasks/);
  assert.match(source, /await navigate\('home'\);[\s\S]*?startPostBootTasks\(\)/);
  assert.match(source, /item\.sourceBlob instanceof Blob \|\| isBookCacheStorageRecord\(item\)[\s\S]*?await readBookArrayBuffer\(item\)[\s\S]*?canReaderRequestUrl\(item\)/);
});

test('EPUB 阅读包含同页离线解析兜底，不把超时直接留成空白页', () => {
  const source = readFileSync(new URL('../../src/app.js', import.meta.url), 'utf8');

  assert.match(source, /async function mountDirectEpubReader/);
  assert.match(source, /async function mountDirectEpubReader[\s\S]*?loadScriptOnce\('\.\/src\/vendor\/epubjs\/jszip\.min\.js',\s*'JSZip'\)/);
  assert.match(source, /data-epub-direct-content/);
  assert.match(source, /data-epub-link/);
  assert.match(source, /mountDirectEpubReader\(item, token/);
  assert.match(source, /if \(await mountDirectEpubReader\(item, token\)\) return;/);
  assert.match(source, /kind: 'epub-direct'/);
});

test('试卷状态切换不通过整页重渲染重建笔迹画布', () => {
  const source = readFileSync(new URL('../../src/app.js', import.meta.url), 'utf8');

  assert.match(source, /function syncPaperStatusView/);
  assert.match(source, /syncPaperStatusView\(paper\)/);
});
test('file 协议 bundle 不包含 import.meta 语法', () => {
  const bundle = readFileSync(new URL('../../dist/app.bundle.js', import.meta.url), 'utf8');

  assert.doesNotMatch(bundle, /import\.meta/);
});
