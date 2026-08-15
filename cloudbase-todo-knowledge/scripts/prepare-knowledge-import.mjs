import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { toSimplifiedChinese } from "../../school-build/src/data/knowledge/index.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const MAX_BATCH_BYTES = Number(process.env.CLOUDBASE_IMPORT_BATCH_BYTES || 14 * 1024);
const SAMPLE_MODE = process.argv.includes("--sample");
const SAMPLE_LIMIT = 30;
const OUT_DIR = path.resolve(
  import.meta.dirname,
  "..",
  ".cloudbase-import",
  SAMPLE_MODE ? "batches-sample" : "batches",
);

const SOURCE_PATHS = {
  idioms: path.join(ROOT, "chinese-xinhua", "data", "idiom.json"),
  chars: path.join(ROOT, "chinese-xinhua", "data", "word.json"),
  xiehouyu: path.join(ROOT, "chinese-xinhua", "data", "xiehouyu.json"),
  words: path.join(ROOT, "chinese-xinhua", "data", "ci.json"),
  poetryRoot: path.join(ROOT, "chinese-poetry", "chinese-poetry-master")
};

const COLLECTIONS = {
  idioms: "kb_idioms",
  chars: "kb_chars",
  xiehouyu: "kb_xiehouyu",
  words: "kb_words",
  poems: "kb_poems"
};

/**
 * 将字符串限制到 CloudBase 文档字段的合理大小。
 * @param {unknown} value 原始字段值。
 * @param {number} maxLength 允许保存的最大字符数。
 * @returns {string} 截断后的字符串。
 */
function limitText(value, maxLength = 4000) {
  const text = toSimplifiedChinese(Array.isArray(value) ? value.join("\n") : String(value ?? ""));
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

/**
 * 生成标题查询使用的去重字符索引，供数据库 all 查询使用。
 * @param {unknown} value 需要建立索引的文本。
 * @returns {string[]} 去重后的非空字符列表。
 */
function uniqueCharacters(value) {
  return [...new Set(Array.from(toSimplifiedChinese(value)).filter((character) => /[\p{L}\p{N}]/u.test(character)))];
}

/**
 * 生成稳定文档 ID，便于重复导入时 upsert。
 * @param {string} type 知识库类型。
 * @param {string} key 能唯一代表资源的业务键。
 * @returns {string} CloudBase 文档 ID。
 */
function stableId(type, key) {
  const hash = crypto.createHash("sha1").update(`${type}:${key}`).digest("hex").slice(0, 32);
  return `${type}_${hash}`;
}

/**
 * 构造公共文档字段。
 * @param {string} collection CloudBase 集合名。
 * @param {object} doc 规范化后的业务字段。
 * @returns {object} CloudBase 文档。
 */
function makeDoc(collection, doc) {
  const searchSource = [doc.title, doc.author, doc.dynasty, doc.category, doc.content]
    .filter(Boolean)
    .join(" ");
  const titleChars = uniqueCharacters(doc.title);
  const searchChars = uniqueCharacters(searchSource);
  return {
    _id: doc._id,
    type: doc.type,
    title: limitText(doc.title, 160),
    titleChars,
    searchChars,
    pinyin: limitText(doc.pinyin, 240),
    answer: limitText(doc.answer, 300),
    author: limitText(doc.author, 120),
    dynasty: limitText(doc.dynasty, 80),
    category: limitText(doc.category, 120),
    meaning: limitText(doc.meaning, 4000),
    radical: limitText(doc.radical, 40),
    strokes: Number(doc.strokes || 0) || "",
    example: limitText(doc.example, 2000),
    derivation: limitText(doc.derivation, 3000),
    more: limitText(doc.more, 4000),
    detail: limitText(doc.detail, 4000),
    content: limitText(doc.content, 6000),
    sourcePath: limitText(doc.sourcePath, 500),
    updatedAt: new Date().toISOString(),
    collection
  };
}

/**
 * 安全读取 JSON 文件。
 * @param {string} filePath JSON 文件路径。
 * @returns {unknown} 解析后的 JSON 数据。
 */
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

/**
 * 输出一组文档批次，按字节大小切分以降低 CLI 命令长度风险。
 * @param {string} collection CloudBase 集合名。
 * @param {Iterable<object>} docs 待输出文档。
 * @returns {number} 输出文档数量。
 */
function writeBatches(collection, docs) {
  let batch = [];
  let batchBytes = 2;
  let index = 0;
  let total = 0;

  const flush = () => {
    if (!batch.length) return;
    const file = path.join(OUT_DIR, `${collection}-${String(index).padStart(5, "0")}.json`);
    fs.writeFileSync(file, JSON.stringify({ collection, documents: batch }), "utf8");
    index += 1;
    total += batch.length;
    batch = [];
    batchBytes = 2;
  };

  for (const doc of docs) {
    const bytes = Buffer.byteLength(JSON.stringify(doc), "utf8") + 1;
    if (batch.length && batchBytes + bytes > MAX_BATCH_BYTES) {
      flush();
    }
    batch.push(doc);
    batchBytes += bytes;
  }
  flush();
  return total;
}

/**
 * 规范化新华项目的 JSON 数组数据。
 * @param {string} type 数据类型。
 * @param {string} collection CloudBase 集合名。
 * @param {Array<object>} items 原始数组。
 * @param {(item: object, index: number) => object} mapper 字段映射函数。
 * @returns {object[]} 规范化文档数组。
 */
function normalizeArray(type, collection, items, mapper) {
  const limited = SAMPLE_MODE ? items.slice(0, SAMPLE_LIMIT) : items;
  return limited.map((item, index) => makeDoc(collection, {
    _id: stableId(type, `${mapper(item, index).title}:${index}`),
    type,
    sourcePath: SOURCE_PATHS[type] || "",
    ...mapper(item, index)
  }));
}

/**
 * 判断对象是否像一首诗词。
 * @param {unknown} value 待判断值。
 * @returns {boolean} 是否包含诗词常见字段。
 */
function isPoemLike(value) {
  return Boolean(value && typeof value === "object" && (
    value.title || value.rhythmic || value.author || value.paragraphs || value.strains || value.content
  ));
}

/**
 * 递归遍历古诗仓库，提取可查询的诗词文档。
 * @returns {object[]} 规范化古诗文档数组。
 */
function normalizePoems() {
  const docs = [];
  const ignoredDirs = new Set([".git", ".github", "images", "loader", "rank", "strains"]);
  const files = [];

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) {
          walk(path.join(dir, entry.name));
        }
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(path.join(dir, entry.name));
      }
    }
  };

  walk(SOURCE_PATHS.poetryRoot);
  const limitedFiles = SAMPLE_MODE ? files.slice(0, 8) : files;

  for (const file of limitedFiles) {
    let data;
    try {
      data = readJson(file);
    } catch (error) {
      console.warn(`跳过无法解析的古诗文件：${file}`, error.message);
      continue;
    }

    const arr = Array.isArray(data) ? data : [data];
    for (let index = 0; index < arr.length; index += 1) {
      const item = arr[index];
      if (!isPoemLike(item)) continue;
      const relative = path.relative(SOURCE_PATHS.poetryRoot, file);
      const category = relative.split(path.sep)[0] || "古诗";
      const lines = item.paragraphs || item.strains || item.content || item.chapter || [];
      const title = item.title || item.rhythmic || path.basename(file, ".json");
      const key = `${relative}:${title}:${item.author || ""}:${index}`;
      docs.push(makeDoc(COLLECTIONS.poems, {
        _id: stableId("poem", key),
        type: "poem",
        title,
        author: item.author || item.poet || "",
        dynasty: item.dynasty || item.dynastyName || category,
        category,
        content: limitText(lines, 3000),
        detail: limitText(item.notes || item.prologue || item.comment || item.intro || "", 1200),
        sourcePath: relative
      }));
      if (SAMPLE_MODE && docs.length >= SAMPLE_LIMIT) return docs;
    }
  }
  return docs;
}

/**
 * 主流程：生成所有知识库导入批次。
 */
function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const groups = [
    [COLLECTIONS.idioms, normalizeArray("idioms", COLLECTIONS.idioms, readJson(SOURCE_PATHS.idioms), (item) => ({
      title: item.word,
      pinyin: item.pinyin,
      meaning: item.explanation,
      derivation: item.derivation,
      example: item.example,
      detail: [item.explanation, item.derivation, item.example].filter(Boolean).join("\n")
    }))],
    [COLLECTIONS.chars, normalizeArray("chars", COLLECTIONS.chars, readJson(SOURCE_PATHS.chars), (item) => ({
      title: item.word,
      pinyin: item.pinyin,
      radical: item.radicals || item.radical,
      strokes: item.strokes,
      meaning: item.explanation || item.meaning,
      detail: [item.radicals ? `部首：${item.radicals}` : "", item.strokes ? `笔画：${item.strokes}` : "", item.explanation, item.more].filter(Boolean).join("\n")
    }))],
    [COLLECTIONS.xiehouyu, normalizeArray("xiehouyu", COLLECTIONS.xiehouyu, readJson(SOURCE_PATHS.xiehouyu), (item) => ({
      title: item.riddle,
      answer: item.answer,
      meaning: item.explanation,
      detail: item.answer
    }))],
    [COLLECTIONS.words, normalizeArray("words", COLLECTIONS.words, readJson(SOURCE_PATHS.words), (item) => ({
      title: item.ci,
      pinyin: item.pinyin,
      meaning: item.explanation,
      detail: item.explanation
    }))],
    [COLLECTIONS.poems, normalizePoems()]
  ];

  const poemDocs = groups.find(([collection]) => collection === COLLECTIONS.poems)?.[1] || [];
  const poetryMeta = makeDoc("kb_meta", {
    _id: "poetry",
    type: "meta",
    title: "poetry",
    authors: [...new Set(poemDocs.map((item) => item.author).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN")),
    dynasties: [...new Set(poemDocs.map((item) => item.dynasty).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN")),
    collections: [...new Set(poemDocs.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"))
  });
  poetryMeta.authors = [...new Set(poemDocs.map((item) => item.author).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  poetryMeta.dynasties = [...new Set(poemDocs.map((item) => item.dynasty).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  poetryMeta.collections = [...new Set(poemDocs.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  poetryMeta.collectionMeta = Object.fromEntries(
    poetryMeta.collections.map((collection) => {
      const items = poemDocs.filter((item) => item.category === collection);
      return [collection, {
        authors: [...new Set(items.map((item) => item.author).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN")),
        dynasties: [...new Set(items.map((item) => item.dynasty).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN")),
      }];
    }),
  );
  groups.push(["kb_meta", [poetryMeta]]);

  const summary = {};
  for (const [collection, docs] of groups) {
    summary[collection] = writeBatches(collection, docs);
  }

  fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify({ sample: SAMPLE_MODE, summary }, null, 2), "utf8");
  console.log(JSON.stringify({ outDir: OUT_DIR, sample: SAMPLE_MODE, summary }, null, 2));
}

main();
