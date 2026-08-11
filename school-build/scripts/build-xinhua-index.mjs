import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const rawRoot = process.argv[2] || 'src/data/knowledge/raw';
const outputRoot = process.argv[3] || 'src/data/knowledge/xinhua';
const shardSize = 1000;
const sources = {
  idiom: 'idiom.json',
  word: 'ci.json',
  xiehouyu: 'xiehouyu.json',
  char: 'word.json',
};

/**
 * 把 chinese-xinhua 原始记录转换成页面和试卷需要的最小字段。
 * @param {string} type 知识库类型。
 * @param {Record<string, unknown>} item 原始知识库记录。
 * @returns {Record<string, unknown>} 可直接展示和抽题的记录。
 */
function normalizeXinhuaItem(type, item) {
  if (type === 'char') {
    return {
      char: item.word || item.char || '',
      pinyin: item.pinyin || '',
      radical: item.radicals || item.radical || '',
      strokes: Number(item.strokes || item.stroke || 0) || '',
      meaning: item.explanation || item.meaning || '',
      more: item.more || '',
    };
  }
  if (type === 'word') return { word: item.ci || item.word || '', pinyin: item.pinyin || '', meaning: item.explanation || item.meaning || '' };
  if (type === 'xiehouyu') return { riddle: item.riddle || '', answer: item.answer || '', explanation: item.explanation || '' };
  return { word: item.word || '', pinyin: item.pinyin || '', explanation: item.explanation || '', example: item.example || '', derivation: item.derivation || '' };
}

/**
 * 返回该知识类型用于标题筛选和详情定位的主标题。
 * @param {string} type 知识库类型。
 * @param {Record<string, unknown>} item 已规范化记录。
 * @returns {string} 主标题文本。
 */
function titleOf(type, item) {
  if (type === 'char') return String(item.char || '');
  if (type === 'xiehouyu') return String(item.riddle || '');
  return String(item.word || '');
}

/**
 * 写入一个标题字符到分片倒排索引。
 * @param {Record<string, Set<number>>} characterShards 字符到分片的索引表。
 * @param {Record<string, number>} characterCounts 字符命中数量。
 * @param {string} title 主标题。
 * @param {number} shardIndex 分片编号。
 * @returns {void}
 */
function indexTitleCharacters(characterShards, characterCounts, title, shardIndex) {
  for (const character of new Set(Array.from(title).filter((item) => item.trim()))) {
    characterShards[character] ||= new Set();
    characterShards[character].add(shardIndex);
    characterCounts[character] = (characterCounts[character] || 0) + 1;
  }
}

/**
 * 将 Set 索引序列化为升序数组，便于浏览器快速求交集。
 * @param {Record<string, Set<number>>} group Set 索引。
 * @returns {Record<string, number[]>} 可 JSON 序列化的索引。
 */
function serializeShardIndexGroup(group) {
  return Object.fromEntries(Object.entries(group).map(([key, value]) => [key, [...value].sort((a, b) => a - b)]));
}

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });
const manifest = {
  version: '20260811-xinhua-index',
  shardSize,
  types: {},
};

for (const [type, fileName] of Object.entries(sources)) {
  const raw = JSON.parse(readFileSync(path.join(rawRoot, fileName), 'utf8'));
  const items = raw.map((item) => normalizeXinhuaItem(type, item)).filter((item) => titleOf(type, item));
  const typeRoot = path.join(outputRoot, type);
  mkdirSync(typeRoot, { recursive: true });
  const characterShards = {};
  const characterCounts = {};
  for (let start = 0; start < items.length; start += shardSize) {
    const shardIndex = Math.floor(start / shardSize);
    const shardItems = items.slice(start, start + shardSize);
    shardItems.forEach((item, offset) => {
      const title = titleOf(type, item);
      indexTitleCharacters(characterShards, characterCounts, title, shardIndex);
    });
    writeFileSync(path.join(typeRoot, `catalog-${String(shardIndex).padStart(4, '0')}.json`), `${JSON.stringify(shardItems)}\n`, 'utf8');
  }
  manifest.types[type] = {
    total: items.length,
    shardCount: Math.ceil(items.length / shardSize),
    characterShards: serializeShardIndexGroup(characterShards),
    characterCounts,
  };
}

writeFileSync(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest)}\n`, 'utf8');
console.log(`updated ${outputRoot}`);
