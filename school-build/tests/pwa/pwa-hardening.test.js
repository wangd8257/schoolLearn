import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(file) {
  return readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
}

function functionBody(sourceText, name) {
  const start = sourceText.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `${name} should exist`);
  const next = sourceText.indexOf('\n/**', start + 1);
  return next === -1 ? sourceText.slice(start) : sourceText.slice(start, next);
}

test('PWA 运行时新导入文件绘本保存为 Blob 并提示容量风险', () => {
  const app = source('src/app.js');
  const reading = source('src/reading.js');

  assert.match(app, /function readFileAsBlob/);
  assert.match(app, /function assertStorageForFiles/);
  assert.match(app, /navigator\.storage\.estimate/);
  assert.match(app, /blob:await readFileAsBlob\(file\)/);
  assert.match(reading, /sourceBlob: file\.blob/);
  assert.match(reading, /cacheMode: 'device'/);
  assert.doesNotMatch(app, /createFileBookReading\(values, \{ name:file\.name, type:file\.type, size:file\.size, dataUrl:await readFileAsDataUrl\(file\) \}\)/);
});

test('PDF 阅读器使用可视窗口懒渲染，不一次性渲染全部页面', () => {
  const app = source('src/app.js');
  const mount = functionBody(app, 'mountPdfJsReader');
  const rerender = functionBody(app, 'rerenderPdfDocument');

  assert.match(app, /function createPdfPagePlaceholders/);
  assert.match(app, /function scheduleVisiblePdfPages/);
  assert.match(app, /IntersectionObserver/);
  assert.doesNotMatch(mount, /for \(let pageNumber = 2; pageNumber <= pdf\.numPages; pageNumber \+= 1\)/);
  assert.doesNotMatch(rerender, /for \(let pageNumber = 1; pageNumber <= readerState\.pdf\.numPages; pageNumber \+= 1\)/);
});

test('Service Worker 使用分层缓存并排除 raw 大 JSON', () => {
  const sw = source('sw.js');

  assert.match(sw, /CORE_CACHE_NAME/);
  assert.match(sw, /DATA_CACHE_NAME/);
  assert.match(sw, /RUNTIME_CACHE_NAME/);
  assert.match(sw, /BOOK_CACHE_NAME/);
  assert.match(sw, /MAX_DATA_CACHE_ENTRIES/);
  assert.match(sw, /isRawKnowledgeRequest/);
  assert.match(sw, /cacheKnowledgeThenUpdate/);
  assert.match(sw, /knowledge\\\/raw/);
  assert.match(sw, /pruneCache/);
  assert.doesNotMatch(sw, /cache\.addAll\([\s\S]*?src\/data\/knowledge\/raw\//);
});
