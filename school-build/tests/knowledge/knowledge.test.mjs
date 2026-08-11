import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const originalFetch = globalThis.fetch;
const fetchedPaths = [];
globalThis.fetch = async (path) => {
  const relative = String(path).replace(/^\.\//u, '');
  fetchedPaths.push(relative);
  const fileUrl = new URL(`../../${relative}`, import.meta.url);
  return {
    ok: true,
    async json() {
      return JSON.parse(readFileSync(fileUrl, 'utf8'));
    },
  };
};

const knowledge = await import('../../src/data/knowledge/index.mjs');

test('成语库筛选只匹配成语标题，不匹配解释或例句', async () => {
  const page = await knowledge.pageKnowledge('idiom', { query: '好' }, 1, 20);

  assert.equal(page.page, 1);
  assert.equal(page.pageSize, 20);
  assert.ok(page.total > 0);
  assert.ok(page.items.length > 0);
  assert.ok(page.items.every((item) => String(item.word).includes('好')));
  assert.ok(!page.items.some((item) => item.word === '阿党比周'));
});

test('词语库和汉字库筛选只匹配标题字段', async () => {
  const wordPage = await knowledge.pageKnowledge('word', { query: '光' }, 1, 20);
  const charPage = await knowledge.pageKnowledge('char', { query: '光' }, 1, 20);

  assert.ok(wordPage.items.length > 0);
  assert.ok(wordPage.items.every((item) => String(item.word).includes('光')));
  assert.ok(charPage.items.length > 0);
  assert.ok(charPage.items.every((item) => String(item.char).includes('光')));
});

test('成语、词语、歇后语和汉字均对接 chinese-xinhua raw 数据', async () => {
  const freshKnowledge = await import(`../../src/data/knowledge/index.mjs?xinhua-raw=${Date.now()}`);
  const cases = [
    ['idiom', 'src/data/knowledge/raw/idiom.json', 30895],
    ['word', 'src/data/knowledge/raw/ci.json', 264434],
    ['xiehouyu', 'src/data/knowledge/raw/xiehouyu.json', 14032],
    ['char', 'src/data/knowledge/raw/word.json', 16142],
  ];

  for (const [type, expectedPath, expectedTotal] of cases) {
    fetchedPaths.length = 0;
    const page = await freshKnowledge.pageKnowledge(type, {}, 1, 1);

    assert.equal(page.total, expectedTotal);
    assert.equal(page.items.length, 1);
    assert.ok(fetchedPaths.includes(expectedPath));
  }
});

test('全量古诗使用 manifest 和 catalog 分页，不在空筛选时读取所有分片', async () => {
  fetchedPaths.length = 0;
  const manifest = JSON.parse(readFileSync(new URL('../../src/data/knowledge/poetry/manifest.json', import.meta.url), 'utf8'));
  const meta = await knowledge.getPoetryMeta();
  const page = await knowledge.pageKnowledge('poetry', {}, 1, 20);

  assert.ok(meta.authors.length > 1000);
  assert.ok(meta.dynasties.length > 1);
  assert.deepEqual(meta.collections, manifest.sourceRootTypes || manifest.collections);
  assert.ok(meta.collections.includes('全唐诗'));
  assert.ok(meta.collections.includes('宋词'));
  assert.ok(meta.collections.includes('论语'));
  assert.ok(meta.collections.includes('蒙学'));
  assert.equal(page.total, manifest.total);
  assert.equal(page.items.length, 20);
  assert.ok(fetchedPaths.some((path) => path.endsWith('poetry/manifest.json')));
  assert.ok(fetchedPaths.some((path) => path.endsWith('poetry/catalog/catalog-0000.json')));
  assert.ok(!fetchedPaths.some((path) => path.includes('poetry/search/search-')));
  assert.ok(!fetchedPaths.some((path) => path.includes('poetry/shards/poetry-')));
});

test('古诗库类型和 chinese-poetry 内容目录同步，并可按类型筛选', async () => {
  const page = await knowledge.pageKnowledge('poetry', { collection: '诗经' }, 1, 10);

  assert.ok(page.total > 0);
  assert.ok(page.items.length > 0);
  assert.ok(page.items.every((item) => item.collection === '诗经'));
});

test('古诗库支持按诗句精确查询并按类型联动作者朝代', async () => {
  const page = await knowledge.pageKnowledge('poetry', { query: '床前明月光' }, 1, 10);
  const meta = await knowledge.getPoetryMeta({ collection: '诗经' });

  assert.ok(page.total > 0);
  assert.ok(page.items.some((item) => String(item.title).includes('静夜思') || (item.lines || []).join('').includes('床前明月光')));
  assert.ok(meta.authors.length > 0);
  assert.ok(meta.dynasties.length > 0);
  assert.ok(meta.collections.includes('诗经'));
});

test('偏好加权抽样会优先保留喜欢内容并跳过不喜欢内容', () => {
  const candidates = [
    { word: '一心一意' },
    { word: '井井有条' },
    { word: '目不转睛' },
  ];
  const preferences = {
    'idiom:一心一意': 'like',
    'idiom:井井有条': 'dislike',
  };
  const selected = knowledge.weightedKnowledgeSample('idiom', candidates, 2, new Set(), preferences);

  assert.equal(selected[0].word, '一心一意');
  assert.ok(!selected.some((item) => item.word === '井井有条'));
});

test('知识库详情可通过稳定键从完整数据中查回', async () => {
  const page = await knowledge.pageKnowledge('poetry', {}, 1, 10);
  const target = page.items[0];

  assert.ok(target);
  const detail = await knowledge.getKnowledgeDetail('poetry', knowledge.knowledgeKey('poetry', target));
  assert.equal(detail.title, target.title);
  assert.equal(detail.author, target.author);
  assert.ok(detail.lines.length >= target.lines.length);
});

test('file 协议下不请求本地 JSON，避免浏览器 CORS 报错', async () => {
  const previousLocation = globalThis.location;
  const previousFetchCount = fetchedPaths.length;
  Object.defineProperty(globalThis, 'location', { value: { protocol: 'file:' }, configurable: true });

  const fileKnowledge = await import(`../../src/data/knowledge/index.mjs?file-mode=${Date.now()}`);
  const page = await fileKnowledge.pageKnowledge('idiom', { query: '一' }, 1, 20);

  assert.ok(page.items.length > 0);
  assert.equal(fetchedPaths.length, previousFetchCount);
  Object.defineProperty(globalThis, 'location', { value: previousLocation, configurable: true });
});

test.after(() => {
  globalThis.fetch = originalFetch;
});
