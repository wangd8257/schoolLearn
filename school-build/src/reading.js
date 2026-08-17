import { getAll, put, remove, uid } from './db.js';

import { getEmbeddedHuibenBooks } from './data/huiben-manifest.mjs';

let speechRun = 0;
const READING_API_BASE = String(
  globalThis.__SCHOOL_BUILD_READING_API__
  || globalThis.__SCHOOL_BUILD_KNOWLEDGE_API__
  || 'https://learn-d0g10smkjc24144a1-1468989884.ap-shanghai.app.tcloudbase.com/api'
).replace(/\/+$/u, '');
const REMOTE_READING_TIMEOUT_MS = 2500;

/**
 * 初始化阅读资料，优先同步 CloudBase 私有云存储清单，并保留本地 huiben 回退。
 * @returns {Promise<Array<Record<string, unknown>>>} 当前设备可用的阅读资料。
 */
export async function ensureReadingSeeds() {
  const existing = await getAll('readings');
  const builtinItems = existing.filter((item) => item.builtin);
  if (builtinItems.length) await Promise.all(builtinItems.map((item) => remove('readings', item.id)));

  const keptItems = existing.filter((item) => !item.builtin);
  const knownHuibenFiles = new Set(keptItems.filter((item) => item.source === 'huiben').map((item) => item.fileName));
  const books = await loadReadingBooks();
  const booksByFileName = new Map(books.map((book) => [book.fileName, book]));
  const booksById = new Map(books.map((book) => [book.id, book]));
  const migratedItems = keptItems
    .filter((item) => item.source === 'huiben' && booksByFileName.has(item.fileName))
    .map((item) => refreshSyncedBookReading(item, booksByFileName.get(item.fileName)));
  const refreshedCloudBaseItems = keptItems
    .filter((item) => item.source === 'cloudbase' && booksById.has(item.id))
    .map((item) => refreshSyncedBookReading(item, booksById.get(item.id)));
  if (migratedItems.length) await Promise.all(migratedItems.map((book) => put('readings', book)));
  if (refreshedCloudBaseItems.length) await Promise.all(refreshedCloudBaseItems.map((book) => put('readings', book)));
  const knownIds = new Set(keptItems.map((item) => item.id));
  const newBooks = books.filter((book) => !knownIds.has(book.id) && !knownHuibenFiles.has(book.fileName));
  if (newBooks.length) await Promise.all(newBooks.map((book) => put('readings', book)));
  return getAll('readings');
}

/**
 * 用最新同步清单刷新本机已保存书籍，避免旧下载地址或元数据继续留在 IndexedDB。
 * @param {Record<string, unknown>} existing 本机已保存的阅读资料。
 * @param {Record<string, unknown>} current 最新清单生成的阅读资料。
 * @returns {Record<string, unknown>} 刷新后的阅读资料。
 */
export function refreshSyncedBookReading(existing, current) {
  return {
    ...existing,
    ...current,
    id: existing.id,
    createdAt: existing.createdAt || current.createdAt,
    updatedAt: current.updatedAt,
  };
}

/**
 * 读取 CloudBase 书籍清单，失败时回退到本地 huiben 清单。
 * @returns {Promise<Array<Record<string, unknown>>>} 规范化后的书目条目。
 */
async function loadReadingBooks() {
  const remoteBooks = await loadCloudBaseBooks();
  if (remoteBooks.length) return remoteBooks;
  return loadHuibenBooks();
}

/**
 * 从 CloudBase HTTP 接口读取私有云存储中的默认书目。
 * @returns {Promise<Array<Record<string, unknown>>>} CloudBase 书目，失败时为空数组。
 */
async function loadCloudBaseBooks() {
  if (typeof fetch !== 'function' || globalThis.location?.protocol === 'file:') return [];
  const controller = typeof AbortController === 'function' ? new AbortController() : undefined;
  const timer = setTimeout(() => controller?.abort(), REMOTE_READING_TIMEOUT_MS);
  try {
    const response = await fetch(`${READING_API_BASE}/reading/books`, {
      cache: 'force-cache',
      signal: controller?.signal,
    });
    if (!response.ok) return [];
    const payload = await response.json();
    const books = Array.isArray(payload.books) ? payload.books : [];
    return books.map((entry) => createCloudBaseBookReading(entry));
  } catch (error) {
    console.warn('CloudBase 阅读资料清单读取失败，将回退本地清单', error);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 读取 huiben 静态书籍清单。
 * @returns {Promise<Array<Record<string, unknown>>>} 规范化后的书目条目。
 */
async function loadHuibenBooks() {
  const embeddedBooks = () => getEmbeddedHuibenBooks().map((entry) => createHuibenBookReading(entry));
  if (typeof fetch !== 'function' || globalThis.location?.protocol === 'file:') {
    return embeddedBooks();
  }
  try {
    const response = await fetch('./huiben/manifest.json', { cache: 'no-store' });
    if (!response.ok) return embeddedBooks();
    const manifest = await response.json();
    const books = Array.isArray(manifest.books) ? manifest.books : [];
    return books.length ? books.map((entry) => createHuibenBookReading(entry)) : embeddedBooks();
  } catch (error) {
    console.warn('huiben 清单读取失败', error);
    return embeddedBooks();
  }
}

/** 为本地文件路径生成稳定短标识。 */
function stableBookId(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/** 根据文件名或 URL 判断绘本文件类型。 */
function bookFileKind(fileName = '') {
  const lowerName = String(fileName).toLowerCase();
  if (lowerName.endsWith('.pdf')) return 'pdf';
  if (lowerName.endsWith('.epub')) return 'epub';
  if (lowerName.endsWith('.equb')) return 'equb';
  return 'file';
}

/** 根据 huiben 清单条目创建只读书架书籍。 */
export function createHuibenBookReading(entry, options = {}) {
  const title = String(entry.title || entry.fileName || '未命名绘本').trim();
  const fileName = String(entry.fileName || title).trim();
  const sourceUrl = String(entry.url || `./huiben/${encodeURIComponent(fileName)}`);
  const now = options.now ?? Date.now();
  return {
    id: entry.id || `huiben-${stableBookId(sourceUrl)}`,
    type: 'file-book',
    category: entry.category || '绘本',
    title,
    language: entry.language === 'en' ? 'en' : 'zh',
    builtin: false,
    source: 'huiben',
    fileName,
    fileKind: entry.fileKind || bookFileKind(fileName || sourceUrl),
    sourceUrl,
    size: entry.size || 0,
    createdAt: entry.createdAt || now,
    updatedAt: entry.updatedAt || now,
  };
}

/**
 * 根据 CloudBase 书目元数据创建前端阅读记录。
 * @param {Record<string, unknown>} entry CloudBase 返回的书目条目。
 * @param {{now?: number}} options 可选时间配置。
 * @returns {Record<string, unknown>} 可保存到 IndexedDB 的阅读记录。
 */
export function createCloudBaseBookReading(entry, options = {}) {
  const fileKind = String(entry.fileKind || bookFileKind(entry.fileName || '')).toLowerCase();
  const now = options.now ?? Date.now();
  return {
    id: String(entry.id || `cloudbase-${stableBookId(String(entry.fileName || entry.title || now))}`),
    type: 'file-book',
    category: entry.category || '绘本',
    title: String(entry.title || entry.fileName || '未命名绘本').trim(),
    language: entry.language === 'en' ? 'en' : 'zh',
    builtin: false,
    source: 'cloudbase',
    fileName: String(entry.fileName || entry.title || '未命名绘本'),
    fileKind,
    sourceUrl: `${READING_API_BASE}/reading/file?id=${encodeURIComponent(String(entry.id || ''))}`,
    size: Number(entry.size || 0),
    createdAt: Number(entry.createdAt || now),
    updatedAt: Number(entry.updatedAt || now),
  };
}

/** 按中文逐字、英文逐词拆分朗读高亮单元。 @param {string} text 文本 @param {string} language 语言 */
export function tokenizeForReading(text, language) {
  if (language === 'en') return text.match(/\S+\s*/g) || [];
  return Array.from(text);
}

/** 停止当前朗读并使旧高亮任务失效。 */
export function stopSpeaking() {
  speechRun += 1;
  window.speechSynthesis?.cancel();
}

/**
 * 使用系统语音朗读并同步文本高亮；缺少边界事件时按语速估算。
 * @param {string} text 待读文本
 * @param {string} language zh 或 en
 * @param {(index:number)=>void} onProgress 高亮回调
 * @param {()=>void} onEnd 完成回调
 */
export function speakWithProgress(text, language, onProgress, onEnd = () => {}) {
  stopSpeaking();
  const runId = speechRun;
  const tokens = tokenizeForReading(text, language);
  if (!('speechSynthesis' in window) || !text.trim()) return onEnd();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'en' ? 'en-US' : 'zh-CN';
  utterance.rate = language === 'en' ? .82 : .72;
  let boundarySeen = false;
  utterance.onboundary = (event) => {
    boundarySeen = true;
    const prefix = text.slice(0, event.charIndex);
    const index = tokenizeForReading(prefix, language).length;
    onProgress(Math.min(index, tokens.length - 1));
  };
  utterance.onend = () => { if (runId === speechRun) { onProgress(tokens.length); onEnd(); } };
  utterance.onerror = () => { if (runId === speechRun) onEnd(); };
  window.speechSynthesis.speak(utterance);

  const totalMs = Math.max(1200, tokens.length * (language === 'en' ? 430 : 260));
  tokens.forEach((_, index) => setTimeout(() => {
    if (runId === speechRun && !boundarySeen) onProgress(index);
  }, totalMs * index / Math.max(tokens.length, 1)));
}

/** 从表单值构建纯文字阅读资料。 @param {object} values 阅读资料字段 */
export function createTextReading(values) {
  return {
    id: uid('reading'),
    type: 'text',
    category: values.category || '自定义',
    title: values.title?.trim() || '未命名阅读资料',
    language: values.language === 'en' ? 'en' : 'zh',
    content: values.content || '',
    traceMode: values.traceMode || 'overlay',
    createdAt: Date.now()
  };
}

/**
 * 从上传图片创建可持久化的绘本资料。
 * @param {Record<string, unknown>} values 绘本标题、分类和语言。
 * @param {Array<{id?:string,imageDataUrl:string,fileName?:string}>} uploadedPages 已读取为 Data URL 的图片页。
 * @param {{id?:string,now?:number}} options 可选的稳定标识和时间，便于测试与数据迁移。
 * @returns {Record<string, unknown>} 绘本独立快照。
 */
export function createPictureBookReading(values, uploadedPages, options = {}) {
  if (!Array.isArray(uploadedPages) || !uploadedPages.length) throw new Error('请至少上传一张绘本图片');
  const now = options.now ?? Date.now();
  const pages = uploadedPages.map((page, index) => {
    if (!String(page.imageDataUrl || '').startsWith('data:image/')) throw new Error(`第 ${index + 1} 页不是有效图片`);
    return {
      id: page.id || uid('page'),
      imageDataUrl: page.imageDataUrl,
      fileName: page.fileName || `第${index + 1}页`,
      textBoxes: [],
    };
  });
  return {
    id: options.id || uid('reading'),
    type: 'picture-book',
    category: values.category || '绘本',
    title: String(values.title || '').trim() || '未命名绘本',
    language: values.language === 'en' ? 'en' : 'zh',
    builtin: false,
    pages,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 从上传的 PDF、EPUB、EQUB 或单文件绘本创建书架记录。
 * @param {Record<string, unknown>} values 标题、分类和语言。
 * @param {{name:string,type?:string,size?:number,blob?:Blob,dataUrl?:string}} file 已读取的文件信息。
 * @param {{id?:string,now?:number}} options 稳定标识和时间配置。
 * @returns {Record<string, unknown>} 可保存到书架的文件绘本记录。
 */
export function createFileBookReading(values, file, options = {}) {
  if (!file?.blob && !file?.dataUrl) throw new Error('请先选择要导入的绘本文件');
  const now = options.now ?? Date.now();
  const title = String(values.title || '').trim() || String(file.name || '').replace(/\.[^.]+$/u, '') || '未命名绘本';
  const record = {
    id: options.id || uid('reading'),
    type: 'file-book',
    category: values.category || '绘本',
    title,
    language: values.language === 'en' ? 'en' : 'zh',
    builtin: false,
    source: 'imported',
    fileName: file.name || title,
    fileKind: bookFileKind(file.name || file.type || ''),
    size: file.size || 0,
    createdAt: now,
    updatedAt: now,
  };
  if (file.blob instanceof Blob) {
    // 文件绘本保存二进制 Blob，避免 Data URL 膨胀并降低 iPad PWA 的 IndexedDB 写入压力。
    return { ...record, sourceBlob: file.blob, cacheMode: 'device' };
  }
  // 兼容历史记录和旧测试数据，新的导入路径不再主动生成 Data URL。
  return { ...record, sourceUrl: file.dataUrl };
}
/**
 * 调整指定绘本页面的顺序。
 * @param {Record<string, unknown>} book 来源绘本快照。
 * @param {string} pageId 待移动页面标识。
 * @param {number} offset 移动步数，负数向前，正数向后。
 * @param {{now?:number}} options 更新时间配置。
 * @returns {Record<string, unknown>} 调整后的独立快照。
 */
export function movePictureBookPage(book, pageId, offset, options = {}) {
  const next = structuredClone(book);
  const index = next.pages?.findIndex((page) => page.id === pageId) ?? -1;
  if (index < 0) throw new Error('页面不存在');
  const target = Math.max(0, Math.min(next.pages.length - 1, index + Number(offset || 0)));
  if (target !== index) {
    const [page] = next.pages.splice(index, 1);
    next.pages.splice(target, 0, page);
  }
  next.updatedAt = options.now ?? Date.now();
  return next;
}

/**
 * 删除指定绘本页面并保证绘本至少保留一页。
 * @param {Record<string, unknown>} book 来源绘本快照。
 * @param {string} pageId 待删除页面标识。
 * @param {{now?:number}} options 更新时间配置。
 * @returns {Record<string, unknown>} 删除后的独立快照。
 */
export function removePictureBookPage(book, pageId, options = {}) {
  if (!Array.isArray(book.pages) || book.pages.length <= 1) throw new Error('绘本至少保留一页');
  const next = structuredClone(book);
  const before = next.pages.length;
  next.pages = next.pages.filter((page) => page.id !== pageId);
  if (next.pages.length === before) throw new Error('页面不存在');
  next.updatedAt = options.now ?? Date.now();
  return next;
}

/**
 * 为指定绘本页增加一个文本框。
 * @param {Record<string, unknown>} book 来源绘本快照。
 * @param {string} pageId 目标页面标识。
 * @param {string} text 文本框内容。
 * @param {{id?:string,now?:number}} options 文本框标识和更新时间配置。
 * @returns {Record<string, unknown>} 增加文本框后的独立快照。
 */
export function addPictureBookTextBox(book, pageId, text, options = {}) {
  const next = structuredClone(book);
  const page = next.pages?.find((item) => item.id === pageId);
  if (!page) throw new Error('页面不存在');
  page.textBoxes ||= [];
  page.textBoxes.push({ id: options.id || uid('text'), text: String(text || '').trim() || '请输入文字', x: 8, y: 72, width: 84 });
  next.updatedAt = options.now ?? Date.now();
  return next;
}

/**
 * 更新文本框内容或位置，并将坐标限制在当前页面内。
 * @param {Record<string, unknown>} book 来源绘本快照。
 * @param {string} pageId 目标页面标识。
 * @param {string} textBoxId 目标文本框标识。
 * @param {{text?:string,x?:number,y?:number,width?:number}} patch 待更新内容与百分比坐标。
 * @param {{now?:number}} options 更新时间配置。
 * @returns {Record<string, unknown>} 更新后的独立快照。
 */
export function updatePictureBookTextBox(book, pageId, textBoxId, patch, options = {}) {
  const next = structuredClone(book);
  const page = next.pages?.find((item) => item.id === pageId);
  const box = page?.textBoxes?.find((item) => item.id === textBoxId);
  if (!box) throw new Error('文本框不存在');
  const width = Math.max(20, Math.min(95, Number(patch.width ?? box.width)));
  box.width = width;
  box.x = Math.max(0, Math.min(100 - width, Number(patch.x ?? box.x)));
  box.y = Math.max(0, Math.min(92, Number(patch.y ?? box.y)));
  if (patch.text !== undefined) box.text = String(patch.text).trim() || '请输入文字';
  next.updatedAt = options.now ?? Date.now();
  return next;
}

/**
 * 删除指定绘本页中的文本框。
 * @param {Record<string, unknown>} book 来源绘本快照。
 * @param {string} pageId 目标页面标识。
 * @param {string} textBoxId 待删除文本框标识。
 * @param {{now?:number}} options 更新时间配置。
 * @returns {Record<string, unknown>} 删除文本框后的独立快照。
 */
export function removePictureBookTextBox(book, pageId, textBoxId, options = {}) {
  const next = structuredClone(book);
  const page = next.pages?.find((item) => item.id === pageId);
  if (!page) throw new Error('页面不存在');
  const before = page.textBoxes?.length || 0;
  page.textBoxes = (page.textBoxes || []).filter((item) => item.id !== textBoxId);
  if (page.textBoxes.length === before) throw new Error('文本框不存在');
  next.updatedAt = options.now ?? Date.now();
  return next;
}

