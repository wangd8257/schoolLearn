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
