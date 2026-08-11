import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { toSimplifiedChinese } from '../src/data/knowledge/index.mjs';

const poetryRoot = process.argv[2] || 'src/data/knowledge/poetry';
const manifestPath = path.join(poetryRoot, 'manifest.json');
const catalogRoot = path.join(poetryRoot, 'catalog');

/**
 * 归一化古诗索引文本，统一简繁、全半角括号和空白。
 * @param {unknown} value 原始索引文本。
 * @returns {string} 可稳定匹配的索引文本。
 */
function normalizePoetryIndexText(value) {
  return toSimplifiedChinese(value)
    .replace(/[（]/gu, '(')
    .replace(/[）]/gu, ')')
    .replace(/\s+/gu, '')
    .trim();
}

/**
 * 归一化作者索引键，去除朝代前缀。
 * @param {unknown} value 原始作者文本。
 * @returns {string} 作者索引键。
 */
function normalizePoetryAuthorKey(value) {
  return normalizePoetryIndexText(value)
    .replace(/^\([^)]{1,8}\)/u, '')
    .replace(/^[\u3400-\u9fff]{1,8}[:：]/u, '');
}

/**
 * 向 manifest 索引结构中写入一个条目的分片归属和总数。
 * @param {Record<string, Record<string, Set<number>>>} shardIndexes 分片索引。
 * @param {Record<string, Record<string, number>>} indexCounts 数量索引。
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
 * 写入组合条件数量索引，分页总数可从 manifest 直接读取。
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
 * 把 Set 分片索引转换成 JSON 可写入的升序数组。
 * @param {Record<string, Set<number>>} group 单类索引。
 * @returns {Record<string, number[]>} 可序列化索引。
 */
function serializeShardIndexGroup(group) {
  return Object.fromEntries(Object.entries(group).map(([key, value]) => [key, [...value].sort((a, b) => a - b)]));
}

/**
 * 把 collection 联动筛选元数据转换成排序数组。
 * @param {Record<string, {authors:Set<string>,dynasties:Set<string>}>} meta 联动筛选元数据。
 * @returns {Record<string, {authors:string[],dynasties:string[]}>} 可序列化元数据。
 */
function serializeCollectionMeta(meta) {
  return Object.fromEntries(Object.entries(meta).map(([collection, value]) => [collection, {
    authors: [...value.authors].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    dynasties: [...value.dynasties].sort((a, b) => a.localeCompare(b, 'zh-CN')),
  }]));
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const shardIndexes = { collection: {}, dynasty: {}, author: {}, character: {} };
const indexCounts = { collection: {}, dynasty: {}, author: {}, character: {} };
const compoundCounts = { collectionDynasty: {}, collectionAuthor: {}, dynastyAuthor: {}, collectionDynastyAuthor: {} };
const collectionMeta = {};

for (const fileName of readdirSync(catalogRoot).filter((name) => name.endsWith('.json')).sort()) {
  const shardIndex = Number(fileName.match(/(\d+)\.json$/u)?.[1] || 0);
  const rows = JSON.parse(readFileSync(path.join(catalogRoot, fileName), 'utf8'));
  for (const row of rows) {
    const title = row[1] || '';
    const author = row[2] || '';
    const dynasty = row[3] || '';
    const collection = row[4] || '';
    const lines = Array.isArray(row[7]) ? row[7] : [];
    const collectionKey = normalizePoetryIndexText(collection);
    const dynastyKey = normalizePoetryIndexText(dynasty);
    const authorKey = normalizePoetryAuthorKey(author);
    collectionMeta[collectionKey] ||= { authors: new Set(), dynasties: new Set() };
    collectionMeta[collectionKey].authors.add(toSimplifiedChinese(author));
    collectionMeta[collectionKey].dynasties.add(toSimplifiedChinese(dynasty));
    addIndexEntry(shardIndexes, indexCounts, 'collection', collectionKey, shardIndex);
    addIndexEntry(shardIndexes, indexCounts, 'dynasty', dynastyKey, shardIndex);
    addIndexEntry(shardIndexes, indexCounts, 'author', authorKey, shardIndex);
    addCompoundCount(compoundCounts, 'collectionDynasty', [collectionKey, dynastyKey]);
    addCompoundCount(compoundCounts, 'collectionAuthor', [collectionKey, authorKey]);
    addCompoundCount(compoundCounts, 'dynastyAuthor', [dynastyKey, authorKey]);
    addCompoundCount(compoundCounts, 'collectionDynastyAuthor', [collectionKey, dynastyKey, authorKey]);
    for (const character of new Set(Array.from(normalizePoetryIndexText([title, author, dynasty, collection, ...lines].join(''))))) {
      addIndexEntry(shardIndexes, indexCounts, 'character', character, shardIndex);
    }
  }
}

manifest.indexedVersion = '20260811-knowledge-shard-index';
manifest.authors = (manifest.authors || []).map((value) => toSimplifiedChinese(value)).sort((a, b) => a.localeCompare(b, 'zh-CN'));
manifest.dynasties = (manifest.dynasties || []).map((value) => toSimplifiedChinese(value)).sort((a, b) => a.localeCompare(b, 'zh-CN'));
manifest.collections = (manifest.collections || []).map((value) => toSimplifiedChinese(value)).sort((a, b) => a.localeCompare(b, 'zh-CN'));
manifest.sourceRootTypes = (manifest.sourceRootTypes || manifest.collections || []).map((value) => toSimplifiedChinese(value)).sort((a, b) => a.localeCompare(b, 'zh-CN'));
manifest.shardIndexes = {
  collection: serializeShardIndexGroup(shardIndexes.collection),
  dynasty: serializeShardIndexGroup(shardIndexes.dynasty),
  author: serializeShardIndexGroup(shardIndexes.author),
  character: serializeShardIndexGroup(shardIndexes.character),
};
manifest.indexCounts = indexCounts;
manifest.compoundCounts = compoundCounts;
manifest.collectionMeta = serializeCollectionMeta(collectionMeta);

writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`, 'utf8');
console.log(`updated ${manifestPath}: collections=${Object.keys(manifest.shardIndexes.collection).length} authors=${Object.keys(manifest.shardIndexes.author).length} characters=${Object.keys(manifest.shardIndexes.character).length}`);
