import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const rawRoot = process.argv[2] || 'src/data/knowledge/raw';
const outputRoot = process.argv[3] || 'src/data/knowledge/xinhua';
const shardSize = 1000;
const characterBucketCount = 64;
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
 * @param {Record<string, Set<number>>} characterPostings 字符到全局序号的倒排索引。
 * @param {string} title 主标题。
 * @param {number} absoluteIndex 条目在当前知识库中的全局序号。
 * @returns {void}
 */
function indexTitleCharacters(characterPostings, title, absoluteIndex) {
  for (const character of new Set(Array.from(title).filter((item) => item.trim()))) {
    characterPostings[character] ||= new Set();
    characterPostings[character].add(absoluteIndex);
  }
}

/**
 * 把字符倒排索引拆成固定数量的小文件，避免首次进入知识库解析大 manifest。
 * @param {string} outputRoot 知识库输出目录。
 * @param {string} type 知识库类型。
 * @param {Record<string, Set<number>>} characterPostings 字符到全局序号的倒排索引。
 * @returns {string} 字符索引清单相对路径。
 */
function writeCharacterIndexes(outputRoot, type, characterPostings) {
  const indexRoot = path.join(outputRoot, 'indexes', `characters-${type}`);
  mkdirSync(indexRoot, { recursive: true });
  const buckets = Array.from({ length: characterBucketCount }, () => ({}));
  for (const [character, values] of Object.entries(characterPostings)) {
    const bucket = Number(character.codePointAt(0) || 0) % characterBucketCount;
    buckets[bucket][character] = [...values].sort((left, right) => left - right);
  }
  const files = [];
  buckets.forEach((bucket, index) => {
    const file = `characters-${type}/character-${String(index).padStart(2, '0')}.json`;
    files.push(file);
    writeFileSync(path.join(outputRoot, 'indexes', file), `${JSON.stringify(bucket)}\n`, 'utf8');
  });
  const manifest = { version: '20260813-xinhua-character-postings', type, bucketCount: characterBucketCount, files };
  const manifestFile = `indexes/character-manifest-${type}.json`;
  writeFileSync(path.join(outputRoot, manifestFile), `${JSON.stringify(manifest)}\n`, 'utf8');
  return manifestFile;
}

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });
const manifest = {
  version: '20260813-xinhua-index',
  shardSize,
  types: {},
};

for (const [type, fileName] of Object.entries(sources)) {
  const raw = JSON.parse(readFileSync(path.join(rawRoot, fileName), 'utf8'));
  const items = raw.map((item) => normalizeXinhuaItem(type, item)).filter((item) => titleOf(type, item));
  const typeRoot = path.join(outputRoot, type);
  mkdirSync(typeRoot, { recursive: true });
  const characterPostings = {};
  for (let start = 0; start < items.length; start += shardSize) {
    const shardIndex = Math.floor(start / shardSize);
    const shardItems = items.slice(start, start + shardSize);
    shardItems.forEach((item, offset) => {
      const title = titleOf(type, item);
      indexTitleCharacters(characterPostings, title, start + offset);
    });
    writeFileSync(path.join(typeRoot, `catalog-${String(shardIndex).padStart(4, '0')}.json`), `${JSON.stringify(shardItems)}\n`, 'utf8');
  }
  manifest.types[type] = {
    total: items.length,
    shardCount: Math.ceil(items.length / shardSize),
  };
  manifest.types[type].characterIndex = writeCharacterIndexes(outputRoot, type, characterPostings);
}

// 字符索引按知识类型独立保存，查询时只读取当前类型的倒排表。
writeFileSync(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest)}\n`, 'utf8');
console.log(`updated ${outputRoot}`);
