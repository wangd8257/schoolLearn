import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { toSimplifiedChinese } from '../src/data/knowledge/index.mjs';

const sourceRoot = process.argv[2];
const outputRoot = process.argv[3] || 'src/data/knowledge/poetry';
const shardSize = 1000;
const ignoredRootNames = new Set(['.github', 'images', 'loader', 'rank', 'strains']);
const dynastyByRoot = new Map([
  ['全唐诗', '唐/宋'], ['御定全唐詩', '唐'], ['宋词', '宋'], ['元曲', '元'], ['五代诗词', '五代'],
  ['楚辞', '先秦'], ['诗经', '先秦'], ['论语', '先秦'], ['四书五经', '先秦'], ['蒙学', '蒙学'],
  ['幽梦影', '清'], ['纳兰性德', '清'], ['水墨唐诗', '唐'], ['曹操诗集', '魏晋'], ['水墨宋词', '宋'],
]);

if (!sourceRoot) throw new Error('Usage: node scripts/build-poetry-index.mjs <chinese-poetry-root> [output-root]');

/**
 * 归一化古诗索引键，统一简繁、括号和空白。
 * @param {unknown} value 需要写入索引的文本。
 * @returns {string} 规范化索引键。
 */
function normalizePoetryIndexText(value) {
  return toSimplifiedChinese(value)
    .replace(/[（]/gu, '(')
    .replace(/[）]/gu, ')')
    .replace(/\s+/gu, '')
    .trim();
}

/**
 * 归一化作者索引键，兼容“（朝代）作者”和“朝代：作者”。
 * @param {unknown} value 作者文本。
 * @returns {string} 作者索引键。
 */
function normalizePoetryAuthorKey(value) {
  return normalizePoetryIndexText(value)
    .replace(/^\([^)]{1,8}\)/u, '')
    .replace(/^[\u3400-\u9fff]{1,8}[:：]/u, '');
}

/**
 * 向索引表写入分片编号和总数。
 * @param {Record<string, Record<string, Set<number>>>} shardIndexes 分片索引表。
 * @param {Record<string, Record<string, number>>} indexCounts 数量索引表。
 * @param {'collection'|'dynasty'|'author'|'character'} type 索引类型。
 * @param {string} key 索引键。
 * @param {number} shardIndex 分片编号。
 * @returns {void}
 */
function addIndexEntry(shardIndexes, indexCounts, type, key, shardIndex) {
  if (!key) return;
  shardIndexes[type][key] ||= new Set();
  shardIndexes[type][key].add(shardIndex);
  indexCounts[type][key] = (indexCounts[type][key] || 0) + 1;
}

/**
 * 写入组合条件数量索引，列表分页可直接读取总数，不需要扫描全部候选分片。
 * @param {Record<string, Record<string, number>>} compoundCounts 组合数量索引。
 * @param {'collectionDynasty'|'collectionAuthor'|'dynastyAuthor'|'collectionDynastyAuthor'} type 组合类型。
 * @param {string[]} keys 组合索引键片段。
 * @returns {void}
 */
function addCompoundCount(compoundCounts, type, keys) {
  if (keys.some((key) => !key)) return;
  const key = keys.join('\t');
  compoundCounts[type][key] = (compoundCounts[type][key] || 0) + 1;
}

/**
 * 将 Set 索引转换为可 JSON 序列化的排序数组。
 * @param {Record<string, Set<number>>} group 单类 Set 索引。
 * @returns {Record<string, number[]>} 排序后的数组索引。
 */
function serializeShardIndexGroup(group) {
  return Object.fromEntries(Object.entries(group).map(([key, value]) => [key, [...value].sort((a, b) => a - b)]));
}

/**
 * 将 collection 维度的联动筛选元数据转换为排序数组。
 * @param {Record<string, {authors:Set<string>,dynasties:Set<string>}>} meta 联动元数据。
 * @returns {Record<string, {authors:string[],dynasties:string[]}>} 可序列化元数据。
 */
function serializeCollectionMeta(meta) {
  return Object.fromEntries(Object.entries(meta).map(([collection, value]) => [collection, {
    authors: [...value.authors].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    dynasties: [...value.dynasties].sort((a, b) => a.localeCompare(b, 'zh-CN')),
  }]));
}

/**
 * 把古诗字符倒排索引按 Unicode 前缀拆分成小文件。
 * @param {string} indexRoot 古诗索引目录。
 * @param {Record<string, Set<number>>} characterPostings 字符到古诗绝对编号的倒排索引。
 * @returns {Record<string, string>} Unicode 桶到文件路径的映射。
 */
function writeCharacterPostingBuckets(indexRoot, characterPostings) {
  const buckets = {};
  for (const [character, values] of Object.entries(characterPostings)) {
    const bucket = Number(character.codePointAt(0) || 0).toString(16).padStart(5, '0').slice(0, 3);
    buckets[bucket] ||= {};
    buckets[bucket][character] = [...values].sort((left, right) => left - right);
  }
  const manifest = {};
  for (const [bucket, values] of Object.entries(buckets)) {
    const file = `characters/character-${bucket}.json`;
    mkdirSync(path.join(indexRoot, 'characters'), { recursive: true });
    writeFileSync(path.join(indexRoot, file), `${JSON.stringify(values)}\n`, 'utf8');
    manifest[bucket] = file;
  }
  writeFileSync(path.join(indexRoot, 'character-manifest.json'), `${JSON.stringify(manifest)}\n`, 'utf8');
  return manifest;
}

/**
 * 判断目录树中是否包含 JSON 文件，用于识别 chinese-poetry 的内容类型目录。
 * @param {string} directory 待检查目录。
 * @returns {boolean} 是否包含 JSON 内容。
 */
function hasJsonFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory() && hasJsonFiles(fullPath)) return true;
    if (entry.isFile() && entry.name.endsWith('.json')) return true;
  }
  return false;
}

/**
 * 自动兼容外层 chinese-poetry 目录和内层 chinese-poetry-master 目录。
 * @param {string} root 用户传入的源目录。
 * @returns {string} 实际包含内容分类的目录。
 */
function resolveSourceRoot(root) {
  const entries = readdirSync(root, { withFileTypes: true });
  const nested = entries.find((entry) => entry.isDirectory() && entry.name === 'chinese-poetry-master');
  if (nested && path.basename(root) !== 'chinese-poetry-master') {
    // 用户常传入外层解压目录，实际内容类型在 chinese-poetry-master 下。
    return resolveSourceRoot(path.join(root, nested.name));
  }
  const contentEntries = entries.filter((entry) => entry.isDirectory() && !ignoredRootNames.has(entry.name) && !entry.name.startsWith('.') && hasJsonFiles(path.join(root, entry.name)));
  if (contentEntries.length) return root;
  return root;
}

/**
 * 列出需要同步到页面“类型”筛选的内容目录。
 * @param {string} root 实际 chinese-poetry 内容根目录。
 * @returns {string[]} 内容类型目录名称。
 */
function listContentRoots(root) {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isDirectory() || entry.name.startsWith('.') || ignoredRootNames.has(entry.name)) return false;
      // 只有包含 JSON 的一级目录才作为古诗库类型，避免把图片、脚本、排行数据混入。
      return hasJsonFiles(path.join(root, entry.name));
    })
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

/**
 * 递归收集目录下的 JSON 文件。
 * @param {string} directory 当前扫描目录。
 * @returns {string[]} JSON 文件绝对路径列表。
 */
function collectJsonFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'error' || entry.name === 'rank') continue;
      files.push(...collectJsonFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('authors.') && entry.name !== '表面结构字.json') files.push(fullPath);
  }
  return files;
}

/**
 * 从记录中抽取可展示正文行，兼容 poetry 仓库多种 JSON 结构。
 * @param {Record<string, unknown>} record 原始诗词或典籍记录。
 * @returns {string[]} 正文行。
 */
function extractLines(record) {
  const source = record.paragraphs || record.lines || record.para || record.paragraph || record.content || [];
  if (Array.isArray(source)) {
    return source.filter((line) => typeof line === 'string').map((line) => line.trim()).filter(Boolean);
  }
  return String(source || '').split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
}

/**
 * 把源数据的段落字段统一为字符串数组。
 * @param {Record<string, unknown>} record 原始诗词记录。
 * @returns {string[]} 正文行。
 */
function normalizeLines(record) {
  return extractLines(record);
}

/**
 * 根据目录和文件名推断朝代，用于筛选下拉框。
 * @param {string} rootName 顶级集合名。
 * @param {string} fileName 文件名。
 * @param {Record<string, unknown>} record 原始诗词记录。
 * @returns {string} 朝代文本。
 */
function inferDynasty(rootName, fileName, record) {
  if (record.dynasty) return String(record.dynasty);
  if (String(record.tags || '').includes('清')) return '清';
  if (String(record.tags || '').includes('北宋') || String(record.tags || '').includes('南宋')) return '宋';
  if (fileName.includes('.tang.')) return '唐';
  if (fileName.includes('.song.')) return '宋';
  if (fileName.includes('yuan')) return '元';
  return dynastyByRoot.get(rootName) || rootName;
}

/**
 * 规范化单条诗词记录，丢弃非诗词结构的数据。
 * @param {Record<string, unknown>} record 原始记录。
 * @param {string} rootName 顶级集合名。
 * @param {string} fileName 来源文件名。
 * @returns {Record<string, unknown>|null} 应用内部诗词记录。
 */
function normalizePoem(record, rootName, fileName) {
  const lines = normalizeLines(record);
  const title = String(record.title || record.rhythmic || record.chapter || record.section || path.basename(fileName, '.json')).trim();
  if (!title || !lines.length) return null;
  return {
    title,
    author: String(record.author || record.section || '').trim() || '佚名',
    dynasty: inferDynasty(rootName, fileName, record),
    collection: rootName,
    lines,
  };
}

/**
 * 展开 chinese-poetry 中“整书、章节、数组”混合结构，输出可规范化记录。
 * @param {unknown} value 当前 JSON 节点。
 * @param {Record<string, unknown>} parent 从父级继承的标题、作者等元信息。
 * @param {Record<string, unknown>[]} records 收集到的记录。
 * @returns {Record<string, unknown>[]} 展开后的记录列表。
 */
function collectRecords(value, parent = {}, records = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectRecords(item, parent, records);
    return records;
  }
  if (!value || typeof value !== 'object') return records;
  const record = { ...parent, ...value };
  const lines = extractLines(record);
  if (lines.length) records.push(record);
  // 部分蒙学和四书五经文件会把章节放在 content 数组里，需要继承书名和作者继续展开。
  for (const key of ['content', 'chapters', 'sections']) {
    if (Array.isArray(value[key]) && value[key].some((item) => item && typeof item === 'object')) {
      collectRecords(value[key], {
        title: value.title || parent.title,
        author: value.author || parent.author,
        dynasty: value.dynasty || parent.dynasty,
        tags: value.tags || parent.tags,
      }, records);
    }
  }
  return records;
}

/**
 * 读取一个 JSON 文件并提取诗词记录。
 * @param {string} filePath JSON 文件路径。
 * @param {string} rootName 顶级集合名。
 * @returns {Record<string, unknown>[]} 规范化后的诗词记录。
 */
function readPoemsFromFile(filePath, rootName) {
  const json = JSON.parse(readFileSync(filePath, 'utf8'));
  const records = collectRecords(json, { title: path.basename(filePath, '.json') });
  return records.map((record) => normalizePoem(record, rootName, path.basename(filePath))).filter(Boolean);
}

const poems = [];
const resolvedSourceRoot = resolveSourceRoot(sourceRoot);
const contentRoots = listContentRoots(resolvedSourceRoot);
for (const rootName of contentRoots) {
  const rootPath = path.join(resolvedSourceRoot, rootName);
  let files;
  try {
    files = collectJsonFiles(rootPath);
  } catch (error) {
    continue;
  }
  for (const file of files) poems.push(...readPoemsFromFile(file, rootName));
}

rmSync(outputRoot, { recursive: true, force: true });
for (const name of ['catalog', 'shards', 'indexes']) mkdirSync(path.join(outputRoot, name), { recursive: true });

const authors = new Set();
const dynasties = new Set();
const collections = new Set();
const shardIndexes = {
  collection: {},
  dynasty: {},
  author: {},
  character: {},
};
const indexCounts = {
  collection: {},
  dynasty: {},
  author: {},
  character: {},
};
const compoundCounts = {
  collectionDynasty: {},
  collectionAuthor: {},
  dynastyAuthor: {},
  collectionDynastyAuthor: {},
};
const collectionMeta = {};
const characterPostings = {};

for (let start = 0; start < poems.length; start += shardSize) {
  const shardIndex = Math.floor(start / shardSize);
  const poemsInShard = poems.slice(start, start + shardSize).map((poem, offset) => ({ ...poem, id: start + offset }));
  const catalog = [];
  for (const poem of poemsInShard) {
    authors.add(poem.author);
    dynasties.add(poem.dynasty);
    collections.add(poem.collection);
    const collectionKey = normalizePoetryIndexText(poem.collection);
    const dynastyKey = normalizePoetryIndexText(poem.dynasty);
    const authorKey = normalizePoetryAuthorKey(poem.author);
    collectionMeta[collectionKey] ||= { authors: new Set(), dynasties: new Set() };
    collectionMeta[collectionKey].authors.add(toSimplifiedChinese(poem.author));
    collectionMeta[collectionKey].dynasties.add(toSimplifiedChinese(poem.dynasty));
    addIndexEntry(shardIndexes, indexCounts, 'collection', collectionKey, shardIndex);
    addIndexEntry(shardIndexes, indexCounts, 'dynasty', dynastyKey, shardIndex);
    addIndexEntry(shardIndexes, indexCounts, 'author', authorKey, shardIndex);
    addCompoundCount(compoundCounts, 'collectionDynasty', [collectionKey, dynastyKey]);
    addCompoundCount(compoundCounts, 'collectionAuthor', [collectionKey, authorKey]);
    addCompoundCount(compoundCounts, 'dynastyAuthor', [dynastyKey, authorKey]);
    addCompoundCount(compoundCounts, 'collectionDynastyAuthor', [collectionKey, dynastyKey, authorKey]);
    for (const character of new Set(Array.from(normalizePoetryIndexText([poem.title, poem.author, poem.dynasty, poem.collection, ...poem.lines].join(''))))) {
      addIndexEntry(shardIndexes, indexCounts, 'character', character, shardIndex);
      characterPostings[character] ||= new Set();
      characterPostings[character].add(poem.id);
    }
    catalog.push([poem.id, poem.title, poem.author, poem.dynasty, poem.collection, shardIndex, poem.id - start, poem.lines.slice(0, 2)]);
  }
  writeFileSync(path.join(outputRoot, 'catalog', `catalog-${String(shardIndex).padStart(4, '0')}.json`), `${JSON.stringify(catalog)}\n`, 'utf8');
  writeFileSync(path.join(outputRoot, 'shards', `poetry-${String(shardIndex).padStart(4, '0')}.json`), `${JSON.stringify(poemsInShard)}\n`, 'utf8');
}

const indexRoot = path.join(outputRoot, 'indexes');
writeFileSync(path.join(indexRoot, 'shard-collection.json'), `${JSON.stringify(serializeShardIndexGroup(shardIndexes.collection))}\n`, 'utf8');
writeFileSync(path.join(indexRoot, 'shard-dynasty.json'), `${JSON.stringify(serializeShardIndexGroup(shardIndexes.dynasty))}\n`, 'utf8');
writeFileSync(path.join(indexRoot, 'shard-author.json'), `${JSON.stringify(serializeShardIndexGroup(shardIndexes.author))}\n`, 'utf8');
writeCharacterPostingBuckets(indexRoot, characterPostings);
writeFileSync(path.join(indexRoot, 'indexCounts.json'), `${JSON.stringify(indexCounts)}\n`, 'utf8');
writeFileSync(path.join(indexRoot, 'compoundCounts.json'), `${JSON.stringify(compoundCounts)}\n`, 'utf8');
writeFileSync(path.join(indexRoot, 'collectionMeta.json'), `${JSON.stringify(serializeCollectionMeta(collectionMeta))}\n`, 'utf8');

const manifest = {
  version: '20260813-absolute-character-index',
  indexedVersion: '20260813-absolute-character-index',
  sourceRootTypes: contentRoots,
  shardSize,
  total: poems.length,
  shardCount: Math.ceil(poems.length / shardSize),
  authors: [...authors].sort((a, b) => a.localeCompare(b, 'zh-CN')),
  dynasties: [...dynasties].sort((a, b) => a.localeCompare(b, 'zh-CN')),
  collections: [...collections].sort((a, b) => a.localeCompare(b, 'zh-CN')),
  indexFiles: {
    shardCollection: 'indexes/shard-collection.json',
    shardDynasty: 'indexes/shard-dynasty.json',
    shardAuthor: 'indexes/shard-author.json',
    shardCharacterManifest: 'indexes/character-manifest.json',
    indexCounts: 'indexes/indexCounts.json',
    compoundCounts: 'indexes/compoundCounts.json',
    collectionMeta: 'indexes/collectionMeta.json',
  },
};
writeFileSync(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest)}\n`, 'utf8');
console.log(`source=${resolvedSourceRoot} types=${contentRoots.length} poems=${poems.length} shards=${manifest.shardCount}`);
