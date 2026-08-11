const seed = {
  idiom: [
    { word: '一心一意', pinyin: 'yī xīn yī yì', explanation: '只有一个心眼，形容专心专意。', example: '我们要一心一意做好这件事。' },
    { word: '井井有条', pinyin: 'jǐng jǐng yǒu tiáo', explanation: '形容整齐不乱，条理分明。', example: '他的书桌整理得井井有条。' },
    { word: '目不转睛', pinyin: 'mù bù zhuǎn jīng', explanation: '眼珠一动不动地盯着看。', example: '孩子目不转睛地看着故事书。' },
    { word: '守株待兔', pinyin: 'shǒu zhū dài tù', explanation: '比喻不主动努力，只想侥幸得到收获。', example: '学习不能守株待兔。' },
    { word: '胸有成竹', pinyin: 'xiōng yǒu chéng zhú', explanation: '比喻做事前已有充分把握。', example: '他胸有成竹地走上讲台。' },
    { word: '亡羊补牢', pinyin: 'wáng yáng bǔ láo', explanation: '出了问题以后想办法补救，可以防止继续受损失。', example: '现在改正还不晚，亡羊补牢。' },
  ],
  char: [
    { char: '光', pinyin: 'guāng', radical: '儿', strokes: 6, meaning: '明亮；照耀。' },
    { char: '明', pinyin: 'míng', radical: '日', strokes: 8, meaning: '明亮；清楚。' },
    { char: '学', pinyin: 'xué', radical: '子', strokes: 8, meaning: '学习；学问。' },
    { char: '习', pinyin: 'xí', radical: '乙', strokes: 3, meaning: '反复练习；学习。' },
    { char: '书', pinyin: 'shū', radical: '乛', strokes: 4, meaning: '装订成册的著作。' },
    { char: '读', pinyin: 'dú', radical: '讠', strokes: 10, meaning: '看着文字念出声音。' },
    { char: '写', pinyin: 'xiě', radical: '冖', strokes: 5, meaning: '用笔记录文字。' },
    { char: '友', pinyin: 'yǒu', radical: '又', strokes: 4, meaning: '朋友；友爱。' },
  ],
  xiehouyu: [
    { riddle: '八仙过海', answer: '各显神通', explanation: '比喻各自拿出本领。' },
    { riddle: '竹篮打水', answer: '一场空', explanation: '比喻白费力气，没有收获。' },
    { riddle: '小葱拌豆腐', answer: '一清二白', explanation: '比喻清清楚楚，明明白白。' },
    { riddle: '芝麻开花', answer: '节节高', explanation: '比喻不断进步，越来越好。' },
    { riddle: '老鼠过街', answer: '人人喊打', explanation: '比喻害人的东西，大家都痛恨。' },
  ],
  word: [
    { word: '认真', pinyin: 'rèn zhēn', meaning: '严肃对待，不马虎。' },
    { word: '努力', pinyin: 'nǔ lì', meaning: '把力量尽量使出来。' },
    { word: '阳光', pinyin: 'yáng guāng', meaning: '太阳发出的光。' },
    { word: '朋友', pinyin: 'péng you', meaning: '彼此有交情的人。' },
    { word: '阅读', pinyin: 'yuè dú', meaning: '看并领会文字内容。' },
    { word: '练习', pinyin: 'liàn xí', meaning: '反复学习，以求熟练。' },
  ],
  poetry: [
    { title: '静夜思', author: '李白', dynasty: '唐', lines: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'] },
    { title: '咏鹅', author: '骆宾王', dynasty: '唐', lines: ['鹅鹅鹅', '曲项向天歌', '白毛浮绿水', '红掌拨清波'] },
    { title: '春晓', author: '孟浩然', dynasty: '唐', lines: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'] },
    { title: '悯农', author: '李绅', dynasty: '唐', lines: ['锄禾日当午', '汗滴禾下土', '谁知盘中餐', '粒粒皆辛苦'] },
    { title: '山行', author: '杜牧', dynasty: '唐', lines: ['远上寒山石径斜', '白云生处有人家', '停车坐爱枫林晚', '霜叶红于二月花'] },
    { title: '元日', author: '王安石', dynasty: '宋', lines: ['爆竹声中一岁除', '春风送暖入屠苏', '千门万户曈曈日', '总把新桃换旧符'] },
  ],
};

const KNOWLEDGE_TYPES = Object.freeze(['idiom', 'char', 'xiehouyu', 'word', 'poetry']);
const RAW_SOURCES = Object.freeze({
  idiom: ['./src/data/knowledge/raw/idiom.json'],
  char: ['./src/data/knowledge/raw/word.json'],
  xiehouyu: ['./src/data/knowledge/raw/xiehouyu.json'],
  word: ['./src/data/knowledge/raw/ci.json'],
  poetry: [],
});
const rawCache = new Map();
const POETRY_BASE = './src/data/knowledge/poetry';
const poetryShardCache = new Map();
const poetryFilterCache = new Map();
let poetryManifestCache;

/**
 * 判断当前运行环境是否允许通过 fetch 读取同源静态 JSON。
 * @returns {boolean} 是否可以安全读取静态资源。
 */
function canFetchStaticAssets() {
  return typeof fetch === 'function' && globalThis.location?.protocol !== 'file:';
}

/**
 * 读取 JSON 静态资源，失败时返回 undefined 以便上层兜底。
 * @param {string} path 资源相对路径。
 * @returns {Promise<unknown|undefined>} JSON 内容。
 */
async function fetchJson(path) {
  if (!canFetchStaticAssets()) return undefined;
  try {
    const response = await fetch(path, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`资源加载失败：${response.status}`);
    return response.json();
  } catch (error) {
    return undefined;
  }
}

/**
 * 读取全量古诗 manifest，manifest 只包含总量和筛选枚举。
 * @returns {Promise<Record<string, unknown>|undefined>} 古诗 manifest。
 */
async function loadPoetryManifest() {
  if (poetryManifestCache) return poetryManifestCache;
  poetryManifestCache = await fetchJson(`${POETRY_BASE}/manifest.json`);
  return poetryManifestCache;
}

/**
 * 读取古诗指定类型的分片，并进行内存缓存。
 * @param {'catalog'|'search'|'shards'} kind 分片类型。
 * @param {number} shardIndex 分片编号。
 * @returns {Promise<unknown[]>} 分片内容。
 */
async function loadPoetryShard(kind, shardIndex) {
  const prefix = kind === 'catalog' ? 'catalog' : kind === 'search' ? 'search' : 'poetry';
  const key = `${kind}:${shardIndex}`;
  if (poetryShardCache.has(key)) return poetryShardCache.get(key);
  const data = await fetchJson(`${POETRY_BASE}/${kind}/${prefix}-${String(shardIndex).padStart(4, '0')}.json`);
  const list = Array.isArray(data) ? data : [];
  poetryShardCache.set(key, list);
  return list;
}

/**
 * 将紧凑 catalog 行恢复为页面可读的诗词条目。
 * @param {unknown[]} row catalog 紧凑行。
 * @returns {Record<string, unknown>} 诗词条目。
 */
function catalogRowToPoetry(row) {
  return { id: row[0], title: row[1], author: row[2], dynasty: row[3], collection: row[4], shard: row[5], offset: row[6], excerpt: row[7] || [], lines: row[7] || [] };
}

/**
 * 加载指定范围的 catalog 条目，避免空筛选时扫描全部古诗。
 * @param {number} start 起始条目索引。
 * @param {number} count 读取数量。
 * @returns {Promise<Record<string, unknown>[]>} catalog 条目。
 */
async function loadPoetryCatalogRange(start, count) {
  const manifest = await loadPoetryManifest();
  const shardSize = Number(manifest?.shardSize || 1000);
  const end = Math.min(Number(manifest?.total || 0), start + count);
  const items = [];
  for (let index = start; index < end;) {
    const shardIndex = Math.floor(index / shardSize);
    const offset = index % shardSize;
    const shard = await loadPoetryShard('catalog', shardIndex);
    const take = Math.min(end - index, shard.length - offset);
    items.push(...shard.slice(offset, offset + take).map(catalogRowToPoetry));
    index += take || 1;
  }
  return items;
}

/**
 * 筛选全量古诗 catalog，按需扫描 search 分片满足多字筛选。
 * @param {{query?:string,author?:string,dynasty?:string,collection?:string}} filters 筛选条件。
 * @returns {Promise<Record<string, unknown>[]>} 匹配的 catalog 条目。
 */
async function filterPoetryCatalog(filters = {}) {
  const manifest = await loadPoetryManifest();
  if (!manifest) return filterKnowledge('poetry', filters);
  const query = String(filters.query || '').trim();
  const author = String(filters.author || '').trim();
  const dynasty = String(filters.dynasty || '').trim();
  const collection = String(filters.collection || '').trim();
  const cacheKey = JSON.stringify({ query, author, dynasty, collection });
  if (poetryFilterCache.has(cacheKey)) return poetryFilterCache.get(cacheKey);
  const requiredCharacters = [...query].filter((item) => item.trim());
  let matchedIds;
  if (requiredCharacters.length) {
    matchedIds = new Set();
    for (let shardIndex = 0; shardIndex < Number(manifest.shardCount || 0); shardIndex += 1) {
      const shard = await loadPoetryShard('search', shardIndex);
      for (const [id, characters] of shard) {
        if (requiredCharacters.every((character) => String(characters).includes(character))) matchedIds.add(id);
      }
    }
  }
  const matched = [];
  for (let shardIndex = 0; shardIndex < Number(manifest.shardCount || 0); shardIndex += 1) {
    const shard = await loadPoetryShard('catalog', shardIndex);
    for (const row of shard) {
      if (matchedIds && !matchedIds.has(row[0])) continue;
      if (author && row[2] !== author) continue;
      if (dynasty && row[3] !== dynasty) continue;
      if (collection && row[4] !== collection) continue;
      matched.push(catalogRowToPoetry(row));
    }
  }
  poetryFilterCache.set(cacheKey, matched);
  return matched;
}

/**
 * 按数字编号读取古诗正文详情。
 * @param {number} id 古诗数字编号。
 * @returns {Promise<Record<string, unknown>|undefined>} 古诗正文详情。
 */
async function getPoetryById(id) {
  const manifest = await loadPoetryManifest();
  if (!manifest || !Number.isFinite(id)) return undefined;
  const shardIndex = Math.floor(id / Number(manifest.shardSize || 1000));
  const offset = id % Number(manifest.shardSize || 1000);
  const shard = await loadPoetryShard('shards', shardIndex);
  return shard[offset];
}

/**
 * 返回古诗筛选枚举，不加载正文分片。
 * @returns {Promise<{authors:string[],dynasties:string[],collections:string[]}>} 筛选枚举。
 */
export async function getPoetryMeta() {
  const manifest = await loadPoetryManifest();
  const collections = manifest?.sourceRootTypes || manifest?.collections || [];
  return { authors: manifest?.authors || [], dynasties: manifest?.dynasties || [], collections };
}

/**
 * 返回当前应用支持的知识库分类。
 * @returns {string[]} 知识库分类标识列表。
 */
export function listKnowledgeTypes() {
  return [...KNOWLEDGE_TYPES];
}

/**
 * 将数据中的可检索文本统一转换为字符串。
 * @param {Record<string, unknown>} item 知识条目。
 * @param {string} type 知识库分类。
 * @returns {string} 可用于筛选的文本。
 */
function searchableText(item, type) {
  if (type === 'poetry') return [item.title, item.author, item.dynasty, ...(item.lines || [])].join('');
  if (type === 'xiehouyu') return [item.riddle, item.answer, item.explanation].join('');
  if (type === 'char') return [item.char, item.pinyin, item.radical, item.meaning, item.more].join('');
  return [item.word, item.pinyin, item.explanation, item.example, item.meaning, item.derivation].join('');
}

/**
 * 把外部知识库原始记录转换为应用统一字段，屏蔽不同开源仓库的字段差异。
 * @param {string} type 知识库分类。
 * @param {Record<string, unknown>} item 原始知识条目。
 * @returns {Record<string, unknown>} 可被页面和试卷生成器直接使用的知识条目。
 */
function normalizeKnowledgeItem(type, item) {
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
  if (type === 'poetry') {
    return {
      title: item.title || '',
      author: item.author || '',
      dynasty: item.dynasty || '唐',
      collection: item.collection || '古诗',
      lines: Array.isArray(item.lines) ? item.lines : Array.isArray(item.paragraphs) ? item.paragraphs : [],
    };
  }
  if (type === 'xiehouyu') return { riddle: item.riddle || '', answer: item.answer || '', explanation: item.explanation || '' };
  return { word: item.word || '', pinyin: item.pinyin || '', explanation: item.explanation || '', example: item.example || '', derivation: item.derivation || '' };
}

/**
 * 读取本地 Git 静态目录里的知识库 JSON，并在失败时回退到内置种子数据。
 * @param {string} type 知识库分类。
 * @returns {Promise<Record<string, unknown>[]>} 已规范化的知识条目列表。
 */
export async function loadKnowledge(type) {
  if (!KNOWLEDGE_TYPES.includes(type)) return [];
  if (rawCache.has(type)) return rawCache.get(type);
  const loaded = [];
  if (canFetchStaticAssets()) {
    for (const path of RAW_SOURCES[type] || []) {
      try {
        // PWA 下依赖 Service Worker 的缓存兜底；网络失败时不阻断页面渲染。
        const response = await fetch(path, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`知识库加载失败：${response.status}`);
        const json = await response.json();
        if (Array.isArray(json)) {
          // 词语库超过二十万条，不能用展开参数一次性 push，避免触发浏览器参数数量上限。
          for (const item of json) loaded.push(normalizeKnowledgeItem(type, item));
        }
      } catch (error) {
        // 单个大文件失败时继续尝试其他文件，最后统一回退到 seed。
      }
    }
  }
  const source = loaded.length ? loaded : (seed[type] || []).map((item) => normalizeKnowledgeItem(type, item));
  rawCache.set(type, source);
  return source;
}

/**
 * 筛选知识库条目，字符条件按“全部包含”处理。
 * @param {string} type 知识库分类。
 * @param {{query?:string,author?:string,dynasty?:string,collection?:string}} filters 筛选条件。
 * @returns {Record<string, unknown>[]} 筛选后的条目。
 */
export function filterKnowledge(type, filters = {}) {
  const source = Array.isArray(seed[type]) ? seed[type] : [];
  const query = String(filters.query || '').trim();
  const requiredCharacters = [...query].filter((item) => item.trim());
  return source.filter((item) => {
    if (type === 'poetry') {
      if (filters.author && item.author !== filters.author) return false;
      if (filters.dynasty && item.dynasty !== filters.dynasty) return false;
      if (filters.collection && item.collection !== filters.collection) return false;
    }
    const normalized = normalizeKnowledgeItem(type, item);
    const text = searchableText(normalized, type);
    return requiredCharacters.every((character) => text.includes(character));
  }).map((item) => normalizeKnowledgeItem(type, item));
}

/**
 * 异步筛选完整知识库，支持大体量本地 JSON 的懒加载。
 * @param {string} type 知识库分类。
 * @param {{query?:string,author?:string,dynasty?:string,collection?:string}} filters 筛选条件。
 * @returns {Promise<Record<string, unknown>[]>} 符合条件的完整条目列表。
 */
export async function filterKnowledgeAsync(type, filters = {}) {
  if (type === 'poetry') return filterPoetryCatalog(filters);
  const source = await loadKnowledge(type);
  const query = String(filters.query || '').trim();
  const requiredCharacters = [...query].filter((item) => item.trim());
  return source.filter((item) => {
    if (type === 'poetry') {
      if (filters.author && item.author !== filters.author) return false;
      if (filters.dynasty && item.dynasty !== filters.dynasty) return false;
      if (filters.collection && item.collection !== filters.collection) return false;
    }
    const text = searchableText(item, type);
    return requiredCharacters.every((character) => text.includes(character));
  });
}

/**
 * 分页筛选知识库，列表只渲染当前页，避免几万条数据一次性压垮 PWA 页面。
 * @param {string} type 知识库分类。
 * @param {{query?:string,author?:string,dynasty?:string,collection?:string}} filters 筛选条件。
 * @param {number} page 页码，从 1 开始。
 * @param {number} pageSize 每页数量。
 * @returns {Promise<{items:Record<string, unknown>[],total:number,page:number,pageSize:number,pageCount:number}>} 分页结果。
 */
export async function pageKnowledge(type, filters = {}, page = 1, pageSize = 20) {
  if (type === 'poetry') {
    const manifest = await loadPoetryManifest();
    if (manifest) {
      const size = Math.max(1, Number(pageSize) || 20);
      const hasFilter = Boolean(String(filters.query || '').trim() || String(filters.author || '').trim() || String(filters.dynasty || '').trim() || String(filters.collection || '').trim());
      if (!hasFilter) {
        const total = Number(manifest.total || 0);
        const pageCount = Math.max(1, Math.ceil(total / size));
        const currentPage = Math.max(1, Math.min(pageCount, Number(page) || 1));
        const start = (currentPage - 1) * size;
        const items = await loadPoetryCatalogRange(start, size);
        return { items, total, page: currentPage, pageSize: size, pageCount };
      }
      const matched = await filterPoetryCatalog(filters);
      const pageCount = Math.max(1, Math.ceil(matched.length / size));
      const currentPage = Math.max(1, Math.min(pageCount, Number(page) || 1));
      const start = (currentPage - 1) * size;
      return { items: matched.slice(start, start + size), total: matched.length, page: currentPage, pageSize: size, pageCount };
    }
  }
  const matched = await filterKnowledgeAsync(type, filters);
  const size = Math.max(1, Number(pageSize) || 20);
  const pageCount = Math.max(1, Math.ceil(matched.length / size));
  const currentPage = Math.max(1, Math.min(pageCount, Number(page) || 1));
  const start = (currentPage - 1) * size;
  return { items: matched.slice(start, start + size), total: matched.length, page: currentPage, pageSize: size, pageCount };
}

/**
 * 根据稳定键查找知识条目详情，用于列表点击后的详情弹窗。
 * @param {string} type 知识库分类。
 * @param {string} key 条目的稳定键。
 * @returns {Promise<Record<string, unknown>|undefined>} 匹配的知识条目。
 */
export async function getKnowledgeDetail(type, key) {
  if (type === 'poetry') {
    const match = /^poetry:(\d+)$/u.exec(String(key || ''));
    if (match) return getPoetryById(Number(match[1]));
  }
  const source = await loadKnowledge(type);
  return source.find((item) => knowledgeKey(type, item) === key);
}

/**
 * 从指定知识库中随机抽取不重复条目。
 * @param {string} type 知识库分类。
 * @param {number} count 抽取数量。
 * @param {Set<string>} excluded 已学习或已抽取的条目键集合。
 * @returns {Record<string, unknown>[]} 不重复的随机条目。
 */
export function randomKnowledge(type, count = 1, excluded = new Set()) {
  const candidates = filterKnowledge(type).filter((item) => !excluded.has(knowledgeKey(type, item)));
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.max(1, Number(count) || 1));
}

/**
 * 从完整知识库随机抽取不重复内容，学习模式优先使用完整本地数据。
 * @param {string} type 知识库分类。
 * @param {number} count 抽取数量。
 * @param {Set<string>} excluded 已学习或已抽取的条目键集合。
 * @returns {Promise<Record<string, unknown>[]>} 不重复的随机条目。
 */
export async function randomKnowledgeAsync(type, count = 1, excluded = new Set()) {
  if (type === 'poetry') {
    const manifest = await loadPoetryManifest();
    if (manifest) {
      const targetCount = Math.max(1, Number(count) || 1);
      const total = Number(manifest.total || 0);
      const selectedIds = new Set();
      const selected = [];
      const maxAttempts = Math.min(total, targetCount * 20 + 100);
      for (let attempt = 0; attempt < maxAttempts && selected.length < targetCount; attempt += 1) {
        const id = Math.floor(Math.random() * total);
        if (selectedIds.has(id)) continue;
        selectedIds.add(id);
        const item = await getPoetryById(id);
        if (!item || excluded.has(knowledgeKey(type, item))) continue;
        selected.push(item);
      }
      for (let id = 0; id < total && selected.length < targetCount; id += 1) {
        if (selectedIds.has(id)) continue;
        const item = await getPoetryById(id);
        if (!item || excluded.has(knowledgeKey(type, item))) continue;
        selected.push(item);
      }
      return selected;
    }
  }
  const candidates = (await loadKnowledge(type)).filter((item) => !excluded.has(knowledgeKey(type, item)));
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.max(1, Number(count) || 1));
}

/**
 * 获取知识条目的稳定键。
 * @param {string} type 知识库分类。
 * @param {Record<string, unknown>} item 知识条目。
 * @returns {string} 稳定键。
 */
export function knowledgeKey(type, item) {
  if (type === 'poetry') {
    if (item.id !== undefined && item.id !== null) return `${type}:${item.id}`;
    return `${type}:${item.dynasty || ''}:${item.author || ''}:${item.title || ''}`;
  }
  if (type === 'xiehouyu') return `${type}:${item.riddle || ''}:${item.answer || ''}`;
  return `${type}:${item.word || item.char || item.title || item.riddle || ''}`;
}

export { seed as KNOWLEDGE_SEED };
