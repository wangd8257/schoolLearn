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

  assert.match(source, /growth-desk-v16-20260808/);
  assert.match(source, /dist\/app\.bundle\.js/);
  assert.match(source, /async function fetchFreshThenCache/);
  assert.match(source, /const response = await fetch\(request\)/);
  assert.match(source, /void cache\.put\(request, response\.clone\(\)\)\.catch/);
  assert.match(source, /\.\/huiben\/manifest\.json/);
  assert.match(source, /\.\/src\/data\/huiben-manifest\.mjs/);
  assert.match(source, /\.\/src\/vendor\/pdfjs\/pdf\.min\.mjs/);
  assert.match(source, /\.\/src\/vendor\/pdfjs\/pdf\.worker\.min\.mjs/);
  assert.match(source, /\.\/src\/vendor\/epubjs\/jszip\.min\.js/);
  assert.match(source, /\.\/src\/vendor\/epubjs\/epub\.min\.js/);
  assert.match(source, /function isBookBinaryRequest/);
  assert.match(source, /Range 请求必须保持原始响应/);
});
