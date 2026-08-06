import { getAll, put, uid } from './db.js';
import { BUILTIN_PICTURE_BOOKS, SAMPLE_READINGS } from './data/readings.js';

let speechRun = 0;

/** 初始化内置阅读资料，保留用户已有内容。 */
export async function ensureReadingSeeds() {
  const existing = await getAll('readings');
  if (existing.length) return existing;
  await Promise.all([...BUILTIN_PICTURE_BOOKS, ...SAMPLE_READINGS].map((item) => put('readings', { ...item, createdAt: Date.now() })));
  return getAll('readings');
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
