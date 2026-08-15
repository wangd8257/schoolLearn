const http = require("node:http");
const { Readable } = require("node:stream");
const { URL } = require("node:url");
const cloudbase = require("@cloudbase/node-sdk");
const readingManifest = require("./reading-manifest.json");

const ENV_ID = process.env.TCB_ENV || "learn-d0g10smkjc24144a1";
const MAX_PAGE_SIZE = 100;
const MAX_RANDOM_COUNT = 50;
const DEFAULT_PAGE_SIZE = 20;
const READING_STORAGE_BUCKET = process.env.READING_STORAGE_BUCKET || "6c65-learn-d0g10smkjc24144a1-1468989884";
const READING_STORAGE_PREFIX = process.env.READING_STORAGE_PREFIX || "reading/books";
const COLLECTIONS = Object.freeze({
  idiom: "kb_idioms",
  char: "kb_chars",
  xiehouyu: "kb_xiehouyu",
  word: "kb_words",
  poetry: "kb_poems",
});
const ORIGINS = new Set(
  String(process.env.KNOWLEDGE_API_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

let database;
let cloudbaseApp;
const readingTempUrlCache = new Map();
const READING_TEMP_URL_TTL_MS = 50 * 60 * 1000;

/**
 * 返回已初始化的 CloudBase Node SDK 应用实例。
 * @returns {object} CloudBase 应用实例。
 */
function getCloudBaseApp() {
  if (!cloudbaseApp) {
    const options = { env: ENV_ID };
    if (process.env.CLOUDBASE_APIKEY) options.accessKey = process.env.CLOUDBASE_APIKEY;
    cloudbaseApp = cloudbase.init(options);
  }
  return cloudbaseApp;
}

/**
 * 返回已初始化的 CloudBase 文档数据库实例。
 * @returns {object} CloudBase 文档数据库实例。
 */
function getDatabase() {
  if (!database) {
    database = getCloudBaseApp().database();
  }
  return database;
}

/**
 * 根据阅读资料稳定 ID 查找云存储文件元数据。
 * @param {string} id 阅读资料稳定 ID。
 * @returns {object|undefined} 阅读资料元数据。
 */
function getReadingBook(id) {
  const normalizedId = String(id || "").trim();
  return Array.isArray(readingManifest.books)
    ? readingManifest.books.find((book) => book.id === normalizedId)
    : undefined;
}

/**
 * 构造传统 CloudBase 云存储的 fileID。
 * @param {object} book 阅读资料元数据。
 * @returns {string} CloudBase fileID。
 */
function getReadingFileId(book) {
  return `cloud://${ENV_ID}.${READING_STORAGE_BUCKET}/${READING_STORAGE_PREFIX}/${book.storageName}`;
}

/**
 * 返回阅读资料的轻量清单，不向浏览器暴露私有存储 fileID。
 * @returns {object} 阅读资料列表响应。
 */
function listReadingBooks() {
  const books = Array.isArray(readingManifest.books) ? readingManifest.books : [];
  return {
    status: 200,
    body: {
      ok: true,
      books: books.map(({ storageName, ...book }) => book),
    },
  };
}

/**
 * 获取阅读资料的短期临时 URL。
 * @param {string} id 阅读资料稳定 ID。
 * @returns {Promise<string>} CloudBase 临时访问地址。
 */
async function getReadingTempUrl(id) {
  const book = getReadingBook(id);
  if (!book) throw Object.assign(new Error("阅读资料不存在"), { statusCode: 404 });
  const cached = readingTempUrlCache.get(book.id);
  if (cached && cached.expiresAt > Date.now()) {
    return { book, url: cached.url };
  }
  const result = await getCloudBaseApp().getTempFileURL({
    fileList: [{ fileID: getReadingFileId(book), maxAge: 3600 }],
  });
  const file = result?.fileList?.[0];
  const url = file?.tempFileURL || file?.download_url;
  if (!url) throw new Error("无法获取阅读资料临时地址");
  readingTempUrlCache.set(book.id, {
    url,
    expiresAt: Date.now() + READING_TEMP_URL_TTL_MS,
  });
  return { book, url };
}

/**
 * 将私有云存储文件以带 Range 的流式响应转发给浏览器。
 * @param {object} req 当前 HTTP 请求。
 * @param {object} res 当前 HTTP 响应。
 * @param {URLSearchParams} params 请求查询参数。
 * @returns {Promise<void>} 文件代理响应完成。
 */
async function proxyReadingFile(req, res, params) {
  const id = readText(params, "id", 100);
  const { book, url } = await getReadingTempUrl(id);
  const requestHeaders = {};
  if (req.headers.range) requestHeaders.Range = req.headers.range;
  if (req.headers["if-range"]) requestHeaders["If-Range"] = req.headers["if-range"];
  const controller = new AbortController();
  const abortRequest = () => controller.abort();
  res.once("close", abortRequest);
  const upstream = await fetch(url, { headers: requestHeaders, signal: controller.signal });
  if (!upstream.ok && upstream.status !== 206) {
    res.writeHead(upstream.status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: false, error: "阅读资料文件读取失败" }));
    return;
  }
  const requestOrigin = String(req.headers.origin || "");
  const allowOrigin = ORIGINS.has(requestOrigin) ? requestOrigin : ORIGINS.size ? [...ORIGINS][0] : "*";
  const responseHeaders = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, Content-Type, If-Range",
    "Access-Control-Expose-Headers": "Accept-Ranges, Content-Length, Content-Range, Content-Type, ETag",
    "Accept-Ranges": upstream.headers.get("accept-ranges") || "bytes",
    "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    "Content-Type": upstream.headers.get("content-type") || (book.fileKind === "pdf" ? "application/pdf" : "application/epub+zip"),
    "Content-Disposition": "inline",
  };
  ["content-length", "content-range", "etag", "last-modified"].forEach((header) => {
    const value = upstream.headers.get(header);
    if (value) responseHeaders[header] = value;
  });
  res.writeHead(upstream.status, responseHeaders);
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  if (upstream.body) {
    Readable.fromWeb(upstream.body).pipe(res);
    return;
  }
  res.end(Buffer.from(await upstream.arrayBuffer()));
}

/**
 * 将查询文本转换为数据库字符倒排查询条件。
 * @param {string} type 知识库类型。
 * @param {string} query 用户输入的查询文本。
 * @returns {object|undefined} 可利用数组索引的查询条件。
 */
function buildCharacterQuery(type, query) {
  const characters = [...new Set(Array.from(String(query || "").trim()).filter((character) => /\S/u.test(character)))];
  if (!characters.length) return undefined;
  const field = type === "poetry" ? "searchChars" : "titleChars";
  return { [field]: getDatabase().command.all(characters) };
}

/**
 * 解析并限制分页参数，避免无界 skip/limit 查询拖慢数据库。
 * @param {URLSearchParams} params URL 查询参数。
 * @returns {{page: number, pageSize: number, skip: number}} 分页参数。
 */
function parsePagination(params) {
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.get("page") || "1", 10) || 1));
  const pageSize = Math.max(1, Math.min(MAX_PAGE_SIZE, Number.parseInt(params.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

/**
 * 读取并清洗字符串查询参数。
 * @param {URLSearchParams} params URL 查询参数。
 * @param {string} name 参数名。
 * @param {number} maxLength 最大长度。
 * @returns {string} 清洗后的参数值。
 */
function readText(params, name, maxLength = 120) {
  return String(params.get(name) || "").trim().slice(0, maxLength);
}

/**
 * 根据请求筛选条件构造 NoSQL 查询条件。
 * @param {string} type 知识库类型。
 * @param {URLSearchParams} params URL 查询参数。
 * @returns {{where: object, query: string, filters: object}} 查询条件和规范化筛选值。
 */
function buildQuery(type, params) {
  const query = readText(params, "q", type === "poetry" ? 80 : 40);
  const author = readText(params, "author", 80);
  const dynasty = readText(params, "dynasty", 40);
  const category = readText(params, "category", 80);
  const where = {};
  const filters = { query, author, dynasty, category };

  if (query) {
    // 非古诗只在标题字符索引中查询；古诗在标题、作者、正文等字符索引中查询。
    Object.assign(where, buildCharacterQuery(type, query));
  }
  if (type === "poetry") {
    if (author) where.author = author;
    if (dynasty) where.dynasty = dynasty;
    if (category) where.category = category;
  }
  return { where, query, filters };
}

/**
 * 将数据库文档转换成前端知识库统一字段，避免页面感知存储字段名。
 * @param {string} type 知识库类型。
 * @param {object} doc 数据库文档。
 * @returns {object} 前端统一知识条目。
 */
function normalizeDocument(type, doc) {
  const base = { _id: doc._id };
  if (type === "idiom") {
    const detailLines = String(doc.detail || "").split("\n");
    return {
      ...base,
      word: doc.title || "",
      pinyin: doc.pinyin || "",
      explanation: doc.meaning || detailLines[0] || "",
      example: doc.example || detailLines[2] || "",
      derivation: doc.derivation || detailLines[1] || "",
    };
  }
  if (type === "char") {
    return {
      ...base,
      char: doc.title || "",
      pinyin: doc.pinyin || "",
      radical: doc.radical || "",
      strokes: doc.strokes || "",
      meaning: doc.meaning || doc.detail || "",
      more: doc.more || "",
    };
  }
  if (type === "xiehouyu") {
    return {
      ...base,
      riddle: doc.title || "",
      answer: doc.answer || "",
      explanation: doc.meaning || doc.detail || "",
    };
  }
  if (type === "word") {
    return {
      ...base,
      word: doc.title || "",
      pinyin: doc.pinyin || "",
      meaning: doc.meaning || doc.detail || "",
    };
  }
  const lines = String(doc.content || "")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    ...base,
    id: doc.poetryId || doc._id,
    title: doc.title || "",
    author: doc.author || "",
    dynasty: doc.dynasty || "",
    collection: doc.category || "古诗",
    lines,
  };
}

/**
 * 返回适合列表和生成器的数据库字段投影。
 * @param {string} type 知识库类型。
 * @returns {object} NoSQL field 投影。
 */
function getFieldProjection(type) {
  const fields = {
    _id: 1,
    title: 1,
    pinyin: 1,
    answer: 1,
    author: 1,
    dynasty: 1,
    category: 1,
    detail: 1,
    content: 1,
    meaning: 1,
    example: 1,
    derivation: 1,
    radical: 1,
    strokes: 1,
    more: 1,
    poetryId: 1,
  };
  if (type !== "poetry") {
    delete fields.author;
    delete fields.dynasty;
    delete fields.category;
    delete fields.content;
    delete fields.poetryId;
  }
  return fields;
}

/**
 * 查询一页知识库数据，并用多取一条的方式判断是否还有下一页。
 * @param {string} type 知识库类型。
 * @param {URLSearchParams} params URL 查询参数。
 * @returns {Promise<object>} 分页结果。
 */
async function queryKnowledge(type, params) {
  const collectionName = COLLECTIONS[type];
  if (!collectionName) {
    return { status: 400, body: { ok: false, error: "不支持的知识库类型" } };
  }
  const { page, pageSize, skip } = parsePagination(params);
  const { where, filters } = buildQuery(type, params);
  const collection = getDatabase().collection(collectionName);
  let query = collection
    .where(where)
    .field(getFieldProjection(type));
  // 字符倒排查询优先走数组索引，避免与标题排序组成高成本的复合扫描。
  if (!filters.query) query = query.orderBy("title", "asc");
  const documents = await query
    .skip(skip)
    .limit(pageSize + 1)
    .get();
  const rows = Array.isArray(documents.data) ? documents.data : [];
  const hasMore = rows.length > pageSize;
  const items = rows.slice(0, pageSize).map((doc) => normalizeDocument(type, doc));
  let total = null;
  if (params.get("includeTotal") === "1") {
    const countResult = await collection.count();
    total = Number(countResult.total || 0);
  }
  const pageCount = total === null ? (hasMore ? page + 1 : page) : Math.max(1, Math.ceil(total / pageSize));
  return {
    status: 200,
    body: {
      ok: true,
      type,
      items,
      total,
      hasMore,
      page,
      pageSize,
      pageCount,
    },
  };
}

/**
 * 读取指定知识库条目详情。
 * @param {string} type 知识库类型。
 * @param {URLSearchParams} params URL 查询参数。
 * @returns {Promise<object>} 详情响应。
 */
async function getKnowledgeDetail(type, params) {
  const id = readText(params, "id", 80);
  const collectionName = COLLECTIONS[type];
  if (!collectionName || !id) {
    return { status: 400, body: { ok: false, error: "缺少合法的 type 或 id" } };
  }
  const doc = await getDatabase().collection(collectionName).doc(id).get();
  const item = Array.isArray(doc.data) ? doc.data[0] : doc.data;
  if (!item) return { status: 404, body: { ok: false, error: "知识条目不存在" } };
  return { status: 200, body: { ok: true, type, item: normalizeDocument(type, item) } };
}

/**
 * 随机抽取知识条目，按数据库主键随机跳过读取，避免拉取整个集合到函数内存。
 * @param {string} type 知识库类型。
 * @param {URLSearchParams} params URL 查询参数。
 * @returns {Promise<object>} 随机抽取响应。
 */
async function randomKnowledge(type, params) {
  const collectionName = COLLECTIONS[type];
  if (!collectionName) return { status: 400, body: { ok: false, error: "不支持的知识库类型" } };
  const count = Math.max(1, Math.min(MAX_RANDOM_COUNT, Number.parseInt(params.get("count") || "1", 10) || 1));
  const { where } = buildQuery(type, params);
  const collection = getDatabase().collection(collectionName);
  try {
    // 使用数据库原生 sample，避免 count + 多次 skip 在大集合上产生大量往返。
    const aggregation = collection.aggregate();
    if (Object.keys(where).length) aggregation.match(where);
    const sampled = await aggregation
      .sample({ size: count })
      .project(getFieldProjection(type))
      .end();
    const rows = Array.isArray(sampled) ? sampled : [];
    return {
      status: 200,
      body: {
        ok: true,
        type,
        items: rows.map((doc) => normalizeDocument(type, doc)),
        hasMore: rows.length >= count,
      },
    };
  } catch (error) {
    // 部分旧版文档数据库实例不支持 sample 时，退回单次分页读取，保证功能可用。
    console.warn("knowledge-api random sample fallback", {
      type,
      message: error instanceof Error ? error.message : String(error),
    });
    const fallback = await collection
      .where(where)
      .field(getFieldProjection(type))
      .orderBy("title", "asc")
      .limit(count)
      .get();
    const rows = Array.isArray(fallback.data) ? fallback.data : [];
    return { status: 200, body: { ok: true, type, items: rows.map((doc) => normalizeDocument(type, doc)), hasMore: rows.length >= count } };
  }
}

/**
 * 读取古诗库联动筛选元数据。
 * @param {URLSearchParams} params URL 查询参数。
 * @returns {Promise<object>} 古诗元数据响应。
 */
async function getPoetryMeta(params) {
  const requestedCategory = readText(params, "category", 80);
  const record = await getDatabase().collection("kb_meta").doc("poetry").get();
  const data = Array.isArray(record.data) ? record.data[0] : record.data;
  if (!data) return { status: 200, body: { ok: true, authors: [], dynasties: [], collections: [] } };
  const categories = Array.isArray(data.collections) ? data.collections : [];
  const collectionMeta = data.collectionMeta && typeof data.collectionMeta === "object"
    ? data.collectionMeta[requestedCategory]
    : undefined;
  const authors = Array.isArray(collectionMeta?.authors)
    ? collectionMeta.authors
    : Array.isArray(data.authors) ? data.authors : [];
  const dynasties = Array.isArray(collectionMeta?.dynasties)
    ? collectionMeta.dynasties
    : Array.isArray(data.dynasties) ? data.dynasties : [];
  return {
    status: 200,
    body: {
      ok: true,
      authors: authors.slice(0, 2000),
      dynasties: dynasties.slice(0, 200),
      collections: requestedCategory ? categories.filter((item) => item === requestedCategory) : categories,
    },
  };
}

/**
 * 写入 JSON 响应并设置跨域、缓存和安全头。
 * @param {object} req 当前请求。
 * @param {object} res 当前响应。
 * @param {number} statusCode HTTP 状态码。
 * @param {object} body 响应数据。
 * @returns {void}
 */
function sendJson(req, res, statusCode, body) {
  const requestOrigin = String(req.headers.origin || "");
  const allowOrigin = ORIGINS.has(requestOrigin) ? requestOrigin : ORIGINS.size ? [...ORIGINS][0] : "*";
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": statusCode === 200 ? "public, max-age=30, stale-while-revalidate=120" : "no-store",
    Vary: "Origin",
  });
  res.end(JSON.stringify(body));
}

/**
 * 处理浏览器跨域预检请求。
 * @param {object} req 当前请求。
 * @param {object} res 当前响应。
 * @returns {void}
 */
function sendOptions(req, res) {
  sendJson(req, res, 204, {});
}

/**
 * 根据路径和查询参数分派只读知识库 API。
 * @param {object} req 当前请求。
 * @param {object} res 当前响应。
 * @returns {Promise<void>} 请求处理完成。
 */
async function handleRequest(req, res) {
  if (req.method === "OPTIONS") {
    sendOptions(req, res);
    return;
  }
  const requestUrl = new URL(req.url || "/", "http://127.0.0.1");
  if (req.method === "GET" && requestUrl.pathname.endsWith("/health")) {
    sendJson(req, res, 200, { ok: true, service: "knowledge-api" });
    return;
  }
  if (req.method !== "GET") {
    sendJson(req, res, 405, { ok: false, error: "仅支持 GET 请求" });
    return;
  }

  const params = requestUrl.searchParams;
  const type = readText(params, "type", 20);
  try {
    if (requestUrl.pathname.endsWith("/reading/books")) {
      const result = listReadingBooks();
      sendJson(req, res, result.status, result.body);
      return;
    }
    if (requestUrl.pathname.endsWith("/reading/file")) {
      await proxyReadingFile(req, res, params);
      return;
    }
    if (requestUrl.pathname.endsWith("/meta")) {
      const result = type === "poetry"
        ? await getPoetryMeta(params)
        : { status: 200, body: { ok: true, authors: [], dynasties: [], collections: [] } };
      sendJson(req, res, result.status, result.body);
      return;
    }
    if (requestUrl.pathname.endsWith("/detail")) {
      const result = await getKnowledgeDetail(type, params);
      sendJson(req, res, result.status, result.body);
      return;
    }
    if (requestUrl.pathname.endsWith("/random")) {
      const result = await randomKnowledge(type, params);
      sendJson(req, res, result.status, result.body);
      return;
    }
    if (requestUrl.pathname.endsWith("/knowledge")) {
      const result = await queryKnowledge(type, params);
      sendJson(req, res, result.status, result.body);
      return;
    }
    sendJson(req, res, 404, { ok: false, error: "接口不存在" });
  } catch (error) {
    console.error("knowledge-api request failed", {
      path: requestUrl.pathname,
      type,
      message: error instanceof Error ? error.message : String(error),
    });
    sendJson(req, res, 500, { ok: false, error: "知识库服务暂时不可用" });
  }
}

/**
 * 启动 HTTP 云函数服务并监听 CloudBase 固定端口。
 * @returns {object} HTTP 服务实例。
 */
function main() {
  const server = http.createServer((req, res) => {
    handleRequest(req, res);
  });
  server.listen(9000);
  return server;
}

module.exports = { main };

if (require.main === module) {
  main();
}
