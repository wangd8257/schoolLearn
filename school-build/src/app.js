import { openDatabase, getAll, put, get, remove } from './db.js';
import { createDrawingLayer } from './drawing.js';
import {
  PAPER_STATUS,
  createPaperSnapshot,
  createWrongProblemPaper,
  duplicatePaper,
  getPaperStatusAfterAction,
  listPapers,
  markWrongProblemsByNumbers,
  savePaperStrokes,
  setProblemWrong,
} from './papers.js';
import {
  addPictureBookTextBox,
  createFileBookReading,
  createPictureBookReading,
  ensureReadingSeeds,
  movePictureBookPage,
  removePictureBookPage,
  removePictureBookTextBox,
  tokenizeForReading,
  speakWithProgress,
  stopSpeaking,
  createTextReading,
  updatePictureBookTextBox,
} from './reading.js';
import {
  createTemplateSnapshot,
  duplicateTemplateSnapshot,
  ensureDefaultTemplates,
  renameTemplateSnapshot,
} from './templates.js';
import { renderProblemHtml, renderWorksheetMetaHtml, worksheetColumns, worksheetLayoutClass } from './worksheet-render.js';
import { paperMoveDelta, paperScrollDelta } from './paper-controls.mjs';
import { generateWorksheet } from './math/index.mjs';
import { filterKnowledgeAsync, getKnowledgeDetail, getPoetryMeta, knowledgeKey, pageKnowledge, randomKnowledgeAsync, toSimplifiedChinese, weightedKnowledgeSample } from './data/knowledge/index.mjs';

const state = { route: 'home', paperFilter: 'all', activeReadingId: null, activePaperId: null, pictureBookDraft: null, paperTransform: null, paperStatus: null, bookObjectUrl: null, fileReader: null, fileReaderToken: 0, pdfZoom: 1, selectedBookIds: new Set(), bookCacheRun: 0, knowledgeType: 'idiom', knowledgeQuery: '', knowledgeAuthor: '', knowledgeDynasty: '', knowledgeCollection: '', knowledgePage: 1, knowledgeHasQueried: false, knowledgePreferences: {}, wrongType: 'all', learningItems: [], learningIndex: 0, learningCompleted: new Set() };
const main = document.querySelector('#mainContent');
const toast = document.querySelector('#toast');
const modalRoot = document.querySelector('#modalRoot');

const PDF_JS_OPTIONS = Object.freeze({
  cMapUrl: './src/vendor/pdfjs/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: './src/vendor/pdfjs/standard_fonts/',
});
const READER_LOAD_TIMEOUT_MS = 60000;
const BOOK_DEVICE_CACHE_NAME = 'growth-desk-books-v1';
let pdfjsLibPromise;

/**
 * 按需加载 PDF.js，避免首页为了未打开的 PDF 阅读功能提前下载和解析大模块。
 * @returns {Promise<Record<string, unknown>>} 已配置 worker 的 PDF.js 模块对象。
 */
async function loadPdfJsLib() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('./vendor/pdfjs/pdf.min.mjs').then((module) => {
      // iPad PWA 下自动 worker 推断不稳定，统一指定本地 worker 地址。
      module.GlobalWorkerOptions.workerSrc = './src/vendor/pdfjs/pdf.worker.min.mjs';
      return module;
    });
  }
  return pdfjsLibPromise;
}

/**
 * 把阅读器异常转换为用户可理解的短消息，并同步到当前阅读界面。
 * @param {unknown} error 浏览器事件或阅读器抛出的异常对象。
 * @param {string} source 发生异常的组件名称。
 * @returns {void}
 */
function reportReaderRuntimeError(error, source) {
  if (state.route !== 'reading' || !state.activeReadingId) return;
  const message = error instanceof Error ? error.message : String(error || '未知错误');
  if (!message || message === '未知错误') return;
  if (/ResizeObserver loop (?:completed with undelivered notifications|limit exceeded)/u.test(message)) return;
  const reader = document.querySelector('[data-pdf-reader], [data-epubjs-reader]');

  // 只在阅读器仍显示加载状态时覆盖状态栏，避免覆盖已经成功打开的阅读内容。
  const status = reader?.querySelector('[data-pdf-progress], [data-epub-status]');
  if (status && /正在|准备/u.test(status.textContent || '')) {
    status.textContent = `${source}加载失败：${message}`;
  }
  console.error(`[${source}] 阅读器运行时异常`, error);
  showToast(`${source}加载失败，请重试`);
}

/**
 * 安装 Safari/PWA 下的全局异常监听，避免异步渲染失败时只留下空白页面。
 * @returns {void}
 */
function installReaderDiagnostics() {
  if (globalThis.__growthDeskReaderDiagnosticsInstalled) return;
  globalThis.__growthDeskReaderDiagnosticsInstalled = true;
  window.addEventListener('error', (event) => {
    reportReaderRuntimeError(event.error || event.message, '阅读器');
  }, true);
  window.addEventListener('unhandledrejection', (event) => {
    reportReaderRuntimeError(event.reason, '阅读器');
  });
}

/** 将用户文本转为可安全插入页面的 HTML。 */
function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
}

/** 显示短暂操作反馈。 */
export function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/**
 * 打开通用弹窗。
 * @param {string} content 弹窗 HTML 内容。
 * @param {string} className 弹窗附加样式类名。
 * @returns {void}
 */
function openModal(content, className = '') {
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal ${className}" role="dialog" aria-modal="true">${content}</section></div>`;
  modalRoot.querySelector('.modal-backdrop').addEventListener('pointerdown', (event) => {
    if (event.target === event.currentTarget) closeModal();
  });
}

function closeModal() { modalRoot.innerHTML = ''; }

function pageHeader(title, subtitle, actions = '') {
  return `<div class="page-header"><div class="page-header-copy"><span class="page-kicker">光之进化 / COMMAND DECK</span><h1>${title}</h1><p>${subtitle}</p></div><div class="page-header-side"><div class="page-header-signal" aria-hidden="true"><span class="signal-ring"></span><span class="signal-core"></span><span class="signal-beam"></span></div><div class="header-actions">${actions}</div></div></div>`;
}

/** 切换工作区并同步侧栏状态。 */
export async function navigate(route, detail = null) {
  stopSpeaking();
  destroyActiveFileReader();
  if (route !== 'reading' && state.bookObjectUrl) {
    URL.revokeObjectURL(state.bookObjectUrl);
    state.bookObjectUrl = null;
  }
  const nextPaperId = detail?.paperId || null;
  if (route === 'paper' && state.activePaperId !== nextPaperId) {
    state.paperTransform = { paperId: nextPaperId, scale: 1, x: 0, y: 0, panMode: false };
  }
  state.route = route;
  state.activePaperId = nextPaperId;
  if (route === 'reading' && !detail?.readingId) state.activeReadingId = null;
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.route === route));
  document.querySelector('#sidebar').classList.remove('open');
  document.body.classList.remove('paper-focus-active');
  main.scrollTop = 0;
  await render();
  main.focus({ preventScroll: true });
}

async function render() {
  const renderers = { home: renderHome, papers: renderPapers, generator: renderGenerator, reading: renderReading, games: renderGames, templates: renderTemplates, knowledge: renderKnowledge, paper: renderPaper };
  try {
    await (renderers[state.route] || renderHome)();
  } catch (error) {
    console.error(error);
    main.innerHTML = `${pageHeader('暂时无法打开','本机数据没有被删除')}<div class="empty-state"><span class="emoji">🧰</span><h2>页面遇到一点问题</h2><p>${escapeHtml(error.message || '请稍后重试')}</p><button class="primary" data-route="home">返回首页</button></div>`;
  }
}

async function renderHome() {
  const papers = await listPapers();
  const readings = await ensureReadingSeeds();
  const records = await getAll('gameRecords');
  const statusCount = (status) => papers.filter((paper) => paper.status === status).length;
  const today = new Intl.DateTimeFormat('zh-CN', { month:'long', day:'numeric', weekday:'long' }).format(new Date());
  main.innerHTML = `
    ${pageHeader('你好，准备开始学习吧','试卷、阅读和小游戏都保存在这台 iPad 上','<button class="primary" data-route="generator">＋ 生成试卷</button>')}
    <section class="hero-band">
      <div class="hero-copy"><span class="today-date">${today}</span><span class="hero-kicker">ULTRA LEARNING CONSOLE · 01</span><h2>把每一次练习，变成看得见的成长</h2><p>家长配置内容，孩子专注作答。试卷、阅读与游戏都在这台设备上离线运行。</p><div class="hero-actions"><button class="primary" data-route="generator">开始生成</button><button class="hero-link" data-route="papers">查看试卷目录 <span aria-hidden="true">→</span></button></div></div>
      <div class="hero-geometry" aria-hidden="true"><div class="hero-orbit hero-orbit-outer"></div><div class="hero-orbit hero-orbit-inner"></div><div class="hero-timer"><span></span></div><div class="hero-beam hero-beam-one"></div><div class="hero-beam hero-beam-two"></div><div class="hero-energy"><span></span></div><div class="hero-sticker">光能<br><b>READY</b></div></div>
    </section>
    <section class="metric-rail">
      <div class="rail-intro"><span class="section-kicker">LIGHT CORE / LIVE</span><h3>学习能量</h3><p>所有内容都保存在这台设备上，随时可以继续。</p></div>
      <div class="rail-metrics">
        <div class="metric"><span class="metric-label">全部试卷</span><strong>${papers.length}</strong><small>本机已保存</small></div>
        <div class="metric metric-blue"><span class="metric-label">待批改</span><strong>${statusCount('review')}</strong><small>等待红笔标记</small></div>
        <div class="metric"><span class="metric-label">阅读资料</span><strong>${readings.length}</strong><small>书架与文字资料</small></div>
        <div class="metric"><span class="metric-label">游戏记录</span><strong>${records.length}</strong><small>最近完成的练习</small></div>
      </div>
    </section>
    <section class="mission-routes">
      <div class="section-heading"><div><span class="section-kicker">MISSION ROUTES</span><h3>今天从这里开始</h3></div><span class="route-sticker" aria-hidden="true">BETA<br><b>01</b></span></div>
      <div class="mission-list">
        <button class="mission-entry" data-route="papers"><span class="mission-index">01</span><span class="mission-icon">▤</span><span class="mission-copy"><strong>打开试卷目录</strong><small>按状态和生成时间管理全部试卷。</small></span><span class="mission-arrow">→</span></button>
        <button class="mission-entry" data-route="generator"><span class="mission-index">02</span><span class="mission-icon">✦</span><span class="mission-copy"><strong>配置生成试卷</strong><small>数学、汉字和英语模板自由配置。</small></span><span class="mission-arrow">→</span></button>
        <button class="mission-entry" data-route="reading"><span class="mission-index">03</span><span class="mission-icon">▥</span><span class="mission-copy"><strong>阅读与跟读</strong><small>按段点读，中文逐字、英文逐词高亮。</small></span><span class="mission-arrow">→</span></button>
        <button class="mission-entry" data-route="games"><span class="mission-index">04</span><span class="mission-icon">◇</span><span class="mission-copy"><strong>学习游戏</strong><small>汉字连线消消乐和英语实物配对。</small></span><span class="mission-arrow">→</span></button>
      </div>
    </section>`;
}

function paperStatusClass(status) {
  return { unstarted:'status-unstarted', writing:'status-writing', review:'status-review', done:'status-done' }[status] || '';
}

async function renderPapers() {
  const papers = await listPapers();
  const filtered = state.paperFilter === 'all' ? papers : papers.filter((paper) => paper.status === state.paperFilter);
  const tabs = [['all','全部'], ...Object.entries(PAPER_STATUS)];
  main.innerHTML = `${pageHeader('试卷目录','默认按生成时间倒序排列','<button class="secondary" data-batch-delete-papers>批量删除</button><button class="primary" data-route="generator">＋ 生成新试卷</button>')}
    <div class="tabs">${tabs.map(([key,label]) => `<button class="tab ${state.paperFilter === key ? 'active':''}" data-paper-filter="${key}">${label}${key === 'all' ? ` (${papers.length})` : ''}</button>`).join('')}</div>
    ${filtered.length ? `<section class="paper-grid">${filtered.map((paper) => `
      <article class="paper-card">
        <label class="paper-select no-print"><input type="checkbox" data-paper-select="${paper.id}"> 选择</label>
        <button class="paper-preview" data-open-paper="${paper.id}" aria-label="打开${escapeHtml(paper.title)}"><div class="paper-mini"><i></i><i></i><i></i><i></i><i></i><i></i></div></button>
        <div class="paper-meta"><h3>${escapeHtml(paper.title)}</h3><div class="paper-meta-row"><span class="status ${paperStatusClass(paper.status)}">${PAPER_STATUS[paper.status]}</span><time>${new Date(paper.createdAt).toLocaleString('zh-CN')}</time></div>
        <div class="card-actions"><button data-copy-paper="${paper.id}">复制</button><button data-rename-paper="${paper.id}">改名</button><button data-delete-paper="${paper.id}">删除</button></div></div>
      </article>`).join('')}</section>` : '<div class="empty-state"><span class="emoji">📄</span><h2>这里还没有试卷</h2><p>从配置生成一份练习，试卷会自动保存在这里。</p></div>'}`;
}

const TEMPLATE_GROUPS = {
  数学: [
    ['horizontal','横式计算'],['missing','缺项填数'],['vertical','竖式计算'],['compare','比较大小'],['equation','列式计算'],['word-problem','应用题'],
    ['chain-add','连加'],['chain-sub','连减'],['mixed','连续加减'],['make-ten','凑十法'],['break-ten','破十法'],
    ['carry-add','进位加法'],['borrow-sub','退位减法'],['multiply','乘法'],['divide','除法'],['currency','人民币换算'],['unit','单位换算'],['clock','钟表认知']
  ],
  语文: [['hanzi-trace','汉字描红'],['hanzi-stroke','按笔画练字'],['control','控笔训练'],['composition','田字格/作业纸'],['idiom-fill','成语填空（飞花令）'],['poetry-match','诗句上下文配对'],['pinyin-write','看拼音写汉字']],
  英语: [['english-word','单词描红'],['english-sentence','短句描红'],['english-lines','英语四线三格']]
};

function generatorFields(subject, template) {
  if (subject !== '数学') {
    const isBlankPractice = ['composition', 'english-lines'].includes(template);
    const countField = isBlankPractice
      ? `<div class="field"><label>练习行数</label><input name="count" type="number" min="1" max="100" value="${template === 'composition' ? '12' : '10'}"></div>`
      : '';
    const strokeFields = template === 'hanzi-stroke'
      ? '<div class="field"><label>按笔画生成字</label><select name="strokePreset"><option value="basic">基础笔画字</option><option value="numbers">数字汉字</option><option value="simple">简单常用字</option></select></div>'
      : '';
    const hanziFontFields = template === 'hanzi-trace'
      ? '<div class="field"><label>描红字体</label><select name="hanziFont"><option value="kaiti">楷体</option><option value="songti">宋体</option><option value="heiti">黑体</option><option value="fangsong">仿宋</option></select></div>'
      : '';
    const englishFontFields = subject === '英语' && ['english-word', 'english-sentence'].includes(template)
      ? '<div class="field"><label>英语描红字体</label><select name="englishFont"><option value="comic">儿童手写体</option><option value="print">印刷体</option><option value="serif">衬线体</option><option value="cursive">连写体</option></select></div>'
      : '';
    const contentField = isBlankPractice
      ? ''
      : '<div class="field"><label>练习内容（每行一项）</label><textarea name="customContent" placeholder="一行可输入多个字，例如：你好"></textarea></div>';
    const languageQuizFields = template === 'idiom-fill'
      ? '<div class="field"><label>成语筛选字（可留空）</label><input name="knowledgeQuery" placeholder="例如：目"></div><div class="field"><label>题目数量</label><input name="count" type="number" min="1" max="50" value="10"></div>'
      : template === 'poetry-match'
      ? '<div class="field"><label>诗句筛选字（可留空）</label><input name="knowledgeQuery" placeholder="例如：月"></div><div class="field"><label>难度</label><select name="poetryDifficulty"><option value="low">低难度：上下句</option><option value="high">高难度：逐字排序</option></select></div><div class="field"><label>题目数量</label><input name="count" type="number" min="1" max="20" value="6"></div>'
      : template === 'pinyin-write'
      ? '<div class="field"><label>词语（每行一项）</label><textarea name="customContent" placeholder="例如：认真&#10;努力"></textarea></div><div class="field"><label>题目数量</label><input name="count" type="number" min="1" max="50" value="10"></div>'
      : '';
    return `
    ${countField}${contentField}${languageQuizFields}${hanziFontFields}${englishFontFields}${strokeFields}`;
  }
  const operationTemplates = ['horizontal', 'missing', 'vertical', 'equation'];
  const chainTemplates = ['chain-add', 'chain-sub', 'mixed'];
  const showOperation = operationTemplates.includes(template);
  const showOperandCount = chainTemplates.includes(template);
  const tenFields = template === 'make-ten' || template === 'break-ten'
    ? `<div class="field-row"><div class="field"><label>${template === 'make-ten' ? '第一个数字' : '被减数'}</label><input name="leftNumber" type="number" min="0" max="100" placeholder="留空随机"></div><div class="field"><label>${template === 'make-ten' ? '第二个数字' : '减数'}</label><input name="rightNumber" type="number" min="0" max="100" placeholder="留空随机"></div></div>`
    : '';
  return `
    <div class="field-row"><div class="field"><label>题目数量</label><input name="count" type="number" min="1" max="100" value="30"></div><div class="field"><label>数值上限</label><input name="max" type="number" min="5" max="10000" value="20"></div></div>
    ${showOperandCount ? '<div class="field"><label>连续项数</label><input name="operandCount" type="number" min="3" max="10" value="3"></div>' : ''}
    ${showOperation ? '<div class="field"><label>运算类型</label><select name="operation"><option value="add">纯加</option><option value="subtract">纯减</option><option value="mixed">混合加减</option></select></div>' : ''}
    ${tenFields}
    ${template === 'divide' ? '<div class="field"><label>除法类型</label><select name="divisionMode"><option value="exact">无余数</option><option value="remainder">有余数</option><option value="mixed">混合</option></select></div>' : ''}
    ${template === 'unit' ? '<div class="field"><label>单位体系</label><select name="unitType"><option value="time">时间</option><option value="length">长度</option><option value="mass">质量</option><option value="area">面积</option><option value="capacity">容量</option></select></div>' : ''}
    ${template === 'word-problem' ? '<div class="field"><label>应用题步骤</label><input name="steps" type="number" min="1" max="3" value="1"></div>' : ''}`;
}

async function renderGenerator() {
  const subject = state.generatorSubject || '数学';
  const template = state.generatorTemplate || TEMPLATE_GROUPS[subject][0][0];
  main.innerHTML = `${pageHeader('生成试卷','选择模板和参数，生成后作为独立快照保存')}
    <section class="form-layout"><form id="generatorForm" class="panel">
      <div class="field"><label>学科</label><select name="subject" id="subjectSelect">${Object.keys(TEMPLATE_GROUPS).map((item) => `<option ${item === subject ? 'selected':''}>${item}</option>`).join('')}</select></div>
      <div class="field"><label>模板</label><select name="template" id="templateSelect">${TEMPLATE_GROUPS[subject].map(([key,label]) => `<option value="${key}" ${key === template ? 'selected':''}>${label}</option>`).join('')}</select></div>
      <div class="field"><label>试卷名称</label><input name="title" placeholder="留空则自动命名"></div>
      <div class="field"><span class="field-label">A4 方向</span><div class="segmented"><label><input type="radio" name="orientation" value="portrait" checked><span>纵向</span></label><label><input type="radio" name="orientation" value="landscape"><span>横向</span></label></div></div>
      <div id="dynamicFields">${generatorFields(subject, template)}</div>
      <button class="primary" type="submit">生成并保存试卷</button> <button class="secondary" type="button" id="previewWorksheetButton">生成预览</button> <button class="secondary" type="button" id="saveTemplateButton">保存为配置模板</button>
    </form>
    <div class="panel preview-panel"><h2>配置生成预览</h2><p>调整左侧配置后点击生成预览，预览不会保存试卷。</p><div id="worksheetPreview">${renderStaticPreview(subject, template)}</div></div></section>`;
  if (state.generatorConfig) applyConfigToForm(document.querySelector('#generatorForm'), state.generatorConfig);
}

/**
 * 将已保存模板配置填入当前生成表单。
 * @param {HTMLFormElement} form 当前试卷生成表单。
 * @param {Record<string, unknown>} config 已保存的模板配置。
 * @returns {void}
 */
function applyConfigToForm(form, config) {
  if (!form || !config) return;
  Object.entries(config).forEach(([name, value]) => {
    const controls = [...form.querySelectorAll(`[name="${CSS.escape(name)}"]`)];
    if (!controls.length) return;
    if (controls[0].type === 'radio') {
      controls.forEach((control) => { control.checked = control.value === String(value); });
      return;
    }
    controls[0].value = String(value ?? '');
  });
}

/**
 * 从生成表单读取当前配置。
 * @param {HTMLFormElement} form 当前生成表单。
 * @returns {Record<string, string>} 表单配置快照。
 */
function readGeneratorValues(form) {
  return Object.fromEntries(new FormData(form));
}

/**
 * 生成未保存的试卷预览 HTML。
 * @param {Record<string, unknown>} values 当前生成配置。
 * @returns {Promise<string>} 预览区域 HTML。
 */
async function renderGeneratedPreview(values) {
  const problems = await createProblemsFromForm({ ...values, count: String(Math.min(Number(values.count || 30), 100)) });
  const templateLabel = TEMPLATE_GROUPS[values.subject].find(([key]) => key === values.template)?.[1] || values.template;
  const paper = createPaperSnapshot({
    title: `${values.subject}·${templateLabel}·预览`,
    subject: values.subject,
    orientation: values.orientation || 'portrait',
    config: values,
    problems,
  });
  return `<div class="worksheet-wrap preview-wrap" tabindex="0" aria-label="试卷预览">${renderWorksheetPagesHtml(paper)}</div>`;
}

/**
 * 渲染首次进入生成器时的静态预览占位。
 * @param {string} subject 当前学科。
 * @param {string} template 当前模板。
 * @returns {string} 静态预览 HTML。
 */
function renderStaticPreview(subject, template) {
  return `<div class="empty-state"><span class="emoji">📄</span><h2>${escapeHtml(subject)}·${escapeHtml(template)}</h2><p>点击“生成预览”查看当前配置会生成的试卷样式。</p></div>`;
}

/**
 * 根据题型控制每页题量，避免题目挤压超出 A4 页面。
 * @param {Record<string, unknown>} paper 试卷快照。
 * @returns {number} 每页最多题量。
 */
function worksheetProblemsPerPage(paper) {
  const layout = worksheetLayoutClass(paper);
  const template = paper.config?.template || paper.problems?.[0]?.kind || paper.problems?.[0]?.type || '';
  if (template === 'composition') return paper.orientation === 'landscape' ? 24 : 16;
  if (template === 'english-lines') return paper.orientation === 'landscape' ? 20 : 14;
  if (layout.includes('vertical')) return 12;
  if (layout.includes('make-ten') || layout.includes('break-ten')) return paper.orientation === 'landscape' ? 4 : 6;
  if (layout.includes('clock')) return 8;
  if (template === 'idiom-fill') return paper.orientation === 'landscape' ? 18 : 12;
  if (template === 'poetry-match') return paper.orientation === 'landscape' ? 12 : 8;
  if (template === 'pinyin-write') return paper.orientation === 'landscape' ? 10 : 7;
  if (layout.includes('language-quiz')) return 8;
  if (layout.includes('word-problem')) return 2;
  if (layout.includes('equation')) return 3;
  if (layout.includes('hanzi-practice') || layout.includes('english-practice')) return 8;
  if (layout.includes('multiply') || layout.includes('divide')) return 24;
  if (layout.includes('currency') || layout.includes('unit')) return 20;
  if (layout.includes('chain-add') || layout.includes('chain-sub') || layout.includes('mixed')) return 30;
  return paper.orientation === 'landscape' ? 36 : 36;
}

/**
 * 将题目切分为多页。
 * @param {Array<Record<string, unknown>>} problems 试卷题目列表。
 * @param {number} size 每页题量。
 * @param {string} layout 当前试卷版式。
 * @returns {Array<Array<Record<string, unknown>>>} 分页后的题目。
 */
function paginateProblems(problems, size, layout = '', orientation = 'portrait') {
  const pages = [];
  let currentPage = [];
  let currentUnits = 0;
  for (const problem of problems) {
    // 多行笔画路径按实际占用的米字格行数计量，避免第二行被 A4 页面裁掉。
    const strokeUnits = layout.includes('hanzi-practice') && (problem.kind || problem.type) === 'hanzi-stroke'
      ? Math.max(1, Math.ceil((problem.strokePaths?.length || 1) / 11))
      : 1;
    const kind = problem.kind || problem.type;
    const textLength = String(problem.prompt || '').trim().length;
    const englishUnits = ['english-word', 'english-sentence'].includes(kind)
      ? Math.max(1, Math.ceil(textLength / (orientation === 'landscape' ? 24 : 18)))
      : 1;
    const problemUnits = Math.max(strokeUnits, englishUnits);
    if (currentPage.length && currentUnits + problemUnits > size) {
      pages.push(currentPage);
      currentPage = [];
      currentUnits = 0;
    }
    currentPage.push(problem);
    currentUnits += problemUnits;
  }
  if (currentPage.length) {
    pages.push(currentPage);
  }
  return pages.length ? pages : [[]];
}

/**
 * 渲染试卷的全部分页。
 * @param {Record<string, unknown>} paper 试卷快照。
 * @returns {string} 多页试卷 HTML。
 */
function renderWorksheetPagesHtml(paper) {
  const layoutClass = worksheetLayoutClass(paper);
  const columns = worksheetColumns(paper);
  const metaLine = renderWorksheetMetaHtml(paper);
  const pages = paginateProblems(paper.problems || [], worksheetProblemsPerPage(paper), layoutClass, paper.orientation);
  let offset = 0;
  return pages.map((pageProblems, pageIndex) => {
    const pageOffset = offset;
    offset += pageProblems.length;
    const pageTitle = pages.length > 1 ? `${escapeHtml(paper.title)}（第 ${pageIndex + 1}/${pages.length} 页）` : escapeHtml(paper.title);
    return `<article class="worksheet ${paper.orientation} ${layoutClass}"><div class="worksheet-content"><h2 class="worksheet-title">${pageTitle}</h2>${metaLine}<div class="worksheet-lines ${layoutClass}" style="--columns:${columns}">${pageProblems.map((problem, index) => renderProblemHtml(problem, pageOffset + index)).join('')}</div></div></article>`;
  }).join('');
}

function normalizeProblem(problem, index) {
  const typeMap = { 'missing-term':'missing','comparison':'compare','chain-addition':'chain-add','chain-subtraction':'chain-sub','mixed-operations':'mixed','carrying-addition':'carry-add','borrowing-subtraction':'borrow-sub','multiplication':'multiply','division':'divide','currency':'currency','unit-conversion':'unit','clock-reading':'clock' };
  return {
    ...structuredClone(problem),
    id: problem.id || `problem-${index + 1}`,
    kind: typeMap[problem.type] || problem.type || 'horizontal',
    prompt: problem.prompt || problem.expression || '',
    boxes: problem.processBoxes?.length || problem.blankCount || 1,
    meta: problem.meta || {},
  };
}

/**
 * 将可选数字表单项转换成生成器参数，留空时保持随机生成。
 * @param {unknown} value 表单原始值。
 * @returns {number|undefined} 整数参数或未指定。
 */
function optionalNumber(value) {
  const text = String(value ?? '').trim();
  return text === '' ? undefined : Number(text);
}

/**
 * 将笔画名称转换为按格逐步展示的笔画符号。
 * @param {string[]} steps 汉字笔画名称列表。
 * @param {string} finalCharacter 最终完整汉字。
 * @returns {string[]} 每一格要展示的累积笔画符号。
 */
function buildStrokeProgress(steps, finalCharacter) {
  const strokeGlyphs = {
    横: '一', 竖: '丨', 撇: '丿', 捺: '㇏', 点: '丶', 提: '㇀',
    横撇: '乛', 横钩: '乛', 横折: '𠃍', 横折钩: '𠃌', 横折提: '㇊',
    竖钩: '亅', 竖弯: '㇄', 竖弯钩: '乚', 竖折: '𠃍', 竖折折钩: '𠄎',
    撇点: 'ㄑ', 弯钩: '㇁', 斜钩: '㇂',
  };
  if (!Array.isArray(steps) || !steps.length) return [finalCharacter];
  let current = '';
  return steps.map((step, index) => {
    // 未配置真实字形路径的字，先用笔画符号累积展示，最后一格必须回到完整字。
    current += strokeGlyphs[step] || String(step).trim().slice(0, 1) || finalCharacter;
    return index === steps.length - 1 ? finalCharacter : current;
  });
}

const HANZI_STROKE_PRESETS = {
  basic: [
    { text:'一', steps:['横'], strokeProgress:['一'], strokePaths:['M18 50 H82'] },
    { text:'二', steps:['横', '横'], strokeProgress:['一', '二'], strokePaths:['M23 35 H77', 'M18 65 H82'] },
    { text:'三', steps:['横', '横', '横'], strokeProgress:['一', '二', '三'], strokePaths:['M28 25 H72', 'M22 50 H78', 'M16 75 H84'] },
    { text:'十', steps:['横', '竖'], strokeProgress:['一', '十'], strokePaths:['M18 50 H82', 'M50 18 V82'] },
  ],
  numbers: [
    { text:'一', steps:['横'], strokeProgress:['一'], strokePaths:['M18 50 H82'] },
    { text:'二', steps:['横', '横'], strokeProgress:['一', '二'], strokePaths:['M23 35 H77', 'M18 65 H82'] },
    { text:'三', steps:['横', '横', '横'], strokeProgress:['一', '二', '三'], strokePaths:['M28 25 H72', 'M22 50 H78', 'M16 75 H84'] },
    { text:'四', steps:['竖', '横折', '撇', '竖弯', '横'], strokeProgress:['丨', '冂', '儿', '四', '四'], strokePaths:['M28 20 V80', 'M28 20 H76 V78', 'M60 34 L45 55', 'M45 55 Q58 67 72 58', 'M22 80 H80'] },
    { text:'五', steps:['横', '竖', '横折', '横'], strokeProgress:['一', '十', '五', '五'], strokePaths:['M24 22 H76', 'M50 22 V46', 'M25 47 H74 V70', 'M22 72 H80'] },
  ],
  simple: [
    { text:'人', steps:['撇', '捺'], strokeProgress:['丿', '人'], strokePaths:['M48 22 Q38 48 20 76', 'M49 22 Q59 52 80 78'] },
    { text:'大', steps:['横', '撇', '捺'], strokeProgress:['一', 'ナ', '大'], strokePaths:['M18 40 H82', 'M50 20 Q42 51 22 78', 'M50 40 Q62 60 80 79'] },
    { text:'口', steps:['竖', '横折', '横'], strokeProgress:['丨', '冂', '口'], strokePaths:['M25 22 V78', 'M25 22 H76 V78', 'M25 78 H76'] },
    { text:'日', steps:['竖', '横折', '横', '横'], strokeProgress:['丨', '冂', '目', '日'], strokePaths:['M25 18 V82', 'M25 18 H76 V82', 'M25 50 H76', 'M25 82 H76'] },
  ],
};

const HANZI_STROKE_LIBRARY = Object.freeze({
  ...Object.fromEntries(Object.values(HANZI_STROKE_PRESETS).flat().map((item) => [item.text, item])),
  你: { text:'你', steps:['撇', '竖', '撇', '横撇', '竖钩', '撇', '点'], strokeProgress:['丿', '亻', '尔', '尔', '你', '你', '你'], strokePaths:['M39 18 Q32 40 20 61', 'M39 18 V80', 'M39 45 Q50 32 60 24', 'M60 24 Q51 48 62 54', 'M62 54 V80', 'M62 54 Q74 67 82 79', 'M65 30 L70 25'] },
  好: { text:'好', steps:['撇点', '撇', '横', '横撇', '竖钩', '横'], strokeProgress:['く', '女', '女', '子', '好', '好'], strokePaths:['M40 20 Q29 42 22 58', 'M40 20 Q48 37 57 49', 'M20 58 H60', 'M67 22 H82 Q73 39 65 45', 'M73 40 V80', 'M61 65 H84'] },
  无: { text:'无', steps:['横', '横', '撇', '竖弯钩'], strokeProgress:['一', '二', '尢', '无'], strokePaths:['M22 28 H78', 'M18 48 H82', 'M52 48 Q43 68 25 80', 'M52 48 Q65 63 75 80'] },
  与: { text:'与', steps:['横', '竖折折钩', '横'], strokeProgress:['一', '与', '与'], strokePaths:['M20 25 H80', 'M52 25 V45 H30 V70 H76 V82', 'M18 62 H82'] },
  子: { text:'子', steps:['横撇', '弯钩', '横'], strokeProgress:['了', '了', '子'], strokePaths:['M22 28 H78 Q68 40 55 43', 'M55 43 V75 Q55 82 65 82 H78', 'M18 60 H82'] },
  常: {
    text:'常',
    steps:['竖', '点', '撇', '点', '横钩', '竖', '横折', '横', '竖', '横折钩', '竖'],
    strokeProgress: buildStrokeProgress(['竖', '点', '撇', '点', '横钩', '竖', '横折', '横', '竖', '横折钩', '竖'], '常'),
    strokePaths:[
      'M50 8 L50 24', 'M33 13 L27 23', 'M67 13 L73 23', 'M49 26 L45 34',
      'M22 34 H78 L73 43', 'M34 45 V62', 'M34 45 H66 V62', 'M34 62 H66',
      'M28 70 V88', 'M28 70 H72 V88', 'M50 68 V93',
    ],
  },
  委: {
    text:'委',
    steps:['撇', '横', '竖', '撇', '捺', '撇点', '撇', '横'],
    strokeProgress: buildStrokeProgress(['撇', '横', '竖', '撇', '捺', '撇点', '撇', '横'], '委'),
    strokePaths:[
      'M52 8 L29 18', 'M27 25 H74', 'M50 21 V52', 'M50 34 L26 55',
      'M50 34 L74 55', 'M36 60 L55 74 L34 91', 'M69 62 L43 91', 'M24 82 H78',
    ],
  },
  我: {
    text:'我',
    steps:['撇', '横', '竖钩', '提', '斜钩', '撇', '点'],
    strokeProgress: buildStrokeProgress(['撇', '横', '竖钩', '提', '斜钩', '撇', '点'], '我'),
    strokePaths:[
      'M 350 571 Q 380 593 449 614 Q 465 615 468 623 Q 471 633 458 643 Q 439 656 396 668 Q 381 674 370 672 Q 363 668 363 657 Q 364 621 200 527 Q 196 518 201 516 Q 213 516 290 546 Q 303 550 316 556 L 350 571 Z',
      'M 584 466 Q 666 485 734 497 Q 746 496 754 511 Q 755 524 729 533 Q 693 554 622 527 Q 598 520 575 511 L 537 499 Q 518 495 500 488 Q 442 472 386 457 L 337 446 Q 327 446 179 416 Q 148 409 173 392 Q 212 365 241 376 Q 287 389 339 404 L 387 416 Q 460 438 545 457 L 584 466 Z',
      'M 386 457 Q 387 493 398 517 Q 405 535 390 548 Q 371 564 350 571 C 323 583 303 583 316 556 Q 315 556 316 555 Q 338 519 337 478 Q 337 462 337 446 L 339 404 Q 340 343 339 289 L 338 241 Q 337 180 334 133 Q 333 115 323 109 Q 317 105 250 119 Q 238 122 239 114 Q 240 108 249 100 Q 309 42 328 6 Q 341 -10 357 3 Q 390 36 390 126 Q 387 169 387 265 L 387 306 Q 387 355 387 416 L 386 457 Z',
      'M 339 289 Q 254 261 161 229 Q 139 222 101 221 Q 86 220 85 207 Q 84 192 94 184 Q 119 166 157 147 Q 169 144 182 154 Q 239 199 338 241 L 387 265 Q 477 314 484 318 Q 499 327 498 337 Q 492 343 479 340 Q 434 324 387 306 L 339 289 Z',
      'M 635 195 Q 690 75 797 -14 Q 876 -62 898 -47 Q 920 -37 914 3 Q 905 34 899 152 Q 900 174 894 178 Q 890 179 884 160 Q 857 75 838 60 Q 823 56 785 88 Q 710 155 670 226 L 644 279 Q 599 381 584 466 L 575 511 Q 547 659 576 752 Q 586 779 543 805 Q 509 827 489 825 Q 470 824 479 795 Q 503 752 507 707 Q 517 601 537 499 L 545 457 Q 573 334 612 245 L 635 195 Z',
      'M 612 245 Q 558 197 452 138 Q 442 132 448 128 Q 455 124 468 126 Q 523 135 574 160 Q 608 175 635 195 L 670 226 Q 706 260 747 317 Q 762 336 778 354 Q 788 361 785 374 Q 781 386 753 410 Q 734 428 723 428 Q 708 427 707 411 Q 701 354 644 279 L 612 245 Z',
      'M 687 669 Q 718 648 754 623 Q 770 613 786 615 Q 798 618 801 632 Q 802 648 789 678 Q 780 697 746 708 Q 665 726 651 715 Q 647 711 651 697 Q 655 687 687 669 Z',
    ],
    strokeDataSource:'hanzi-writer-data',
  },
});

const HANZI_WRITER_DATA_PATH = './assets/hanzi-writer-data';
const hanziWriterDataCache = new Map();

/**
 * 从 hanzi-writer-data 加载单个汉字的真实笔画路径。
 * @param {string} character 需要加载的单个汉字。
 * @returns {Promise<string[]|null>} 按书写顺序排列的 SVG 路径数组，加载失败时返回空值。
 */
async function loadHanziWriterStrokePaths(character) {
  const value = String(character || '').trim();
  if (!/^[\u3400-\u9fff]$/u.test(value)) return null;
  if (hanziWriterDataCache.has(value)) return hanziWriterDataCache.get(value);
  if (typeof fetch !== 'function' || globalThis.location?.protocol === 'file:') return null;

  try {
    const url = `${HANZI_WRITER_DATA_PATH}/${encodeURIComponent(value)}.json`;
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const paths = Array.isArray(data.strokes) ? data.strokes.filter((path) => typeof path === 'string' && path.trim()) : [];
    hanziWriterDataCache.set(value, paths);
    return paths;
  } catch (error) {
    // 本地字形资源缺失或读取失败时保留基础字路径，避免生成整份试卷失败。
    console.warn(`汉字“${value}”笔画数据加载失败`, error);
    hanziWriterDataCache.set(value, null);
    return null;
  }
}

/**
 * 根据按笔画预设和用户输入生成汉字练习题。
 * @param {Record<string, unknown>} values 当前生成配置。
 * @param {string[]} lines 用户输入行。
 * @returns {Promise<Array<Record<string, unknown>>>} 汉字笔画练习题。
 */
async function createStrokePracticeProblems(values, lines) {
  const preset = HANZI_STROKE_PRESETS[values.strokePreset] || HANZI_STROKE_PRESETS.basic;
  const source = lines.length
    ? lines.flatMap((text) => Array.from(text).filter((character) => character.trim()).map((character) => (
      HANZI_STROKE_LIBRARY[character] || { text: character, steps: [], strokeProgress: [character] }
    )))
    : preset;
  const enrichedSource = await Promise.all(source.map(async (item) => {
    const remotePaths = await loadHanziWriterStrokePaths(item.text);
    return remotePaths?.length
      ? { ...item, strokePaths: remotePaths, strokeDataSource: 'hanzi-writer-data' }
      : item;
  }));
  return enrichedSource.map((item, index) => ({
    id: `problem-${index + 1}`,
    kind: 'hanzi-stroke',
    prompt: item.text,
    answer: '',
    boxes: 0,
    strokeSteps: item.steps,
    strokeProgress: item.strokeProgress || buildStrokeProgress(item.steps, item.text),
    strokePaths: item.strokePaths || [],
    strokeDataSource: item.strokeDataSource || 'local-fallback',
  }));
}

/**
 * 将空白练习模板的题量限制在表单允许范围内。
 * @param {unknown} value 表单中的题量原始值。
 * @param {number} fallback 未填写时使用的默认题量。
 * @returns {number} 至少为 1 且不超过 100 的整数题量。
 */
function boundedPracticeCount(value, fallback) {
  const count = Number(value);
  if (!Number.isFinite(count)) return fallback;
  return Math.max(1, Math.min(100, Math.floor(count)));
}

/**
 * 将汉字描红输入按米字格行宽切分，避免连续文字在 A4 页面中被裁切。
 * @param {string[]} lines 用户输入的练习内容行。
 * @returns {string[]} 可逐行渲染的汉字练习内容。
 */
function splitHanziPracticeLines(lines) {
  return lines.flatMap((line) => {
    const characters = Array.from(line).filter((character) => character.trim());
    if (characters.length <= 8) return [line];
    const chunks = [];
    for (let index = 0; index < characters.length; index += 12) {
      // 长文本按 12 格一行拆成独立题目，分页时可独立换页。
      chunks.push(characters.slice(index, index + 12).join(''));
    }
    return chunks;
  });
}

/**
 * 将英文描红内容按四线三格可容纳宽度切分，避免长单词或短句超出试卷。
 * @param {string[]} lines 用户输入的英文练习内容行。
 * @param {'english-word'|'english-sentence'|string} template 当前英语模板。
 * @returns {string[]} 可逐行渲染的英文练习内容。
 */
function splitEnglishPracticeLines(lines, template) {
  const maxLength = template === 'english-word' ? 18 : 32;
  return lines.flatMap((line) => {
    const words = String(line).trim().split(/\s+/u).filter(Boolean);
    if (!words.length) return [];
    const chunks = [];
    let current = '';
    for (const word of words) {
      if (word.length > maxLength) {
        if (current) chunks.push(current);
        // 单个超长词继续按容量拆分，避免字母撑出 A4 页面。
        for (let index = 0; index < word.length; index += maxLength) chunks.push(word.slice(index, index + maxLength));
        current = '';
        continue;
      }
      const next = current ? `${current} ${word}` : word;
      if (current && next.length > maxLength) {
        // 超出单行容量时放到下一题行，保持四线三格不横向溢出。
        chunks.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  });
}

/**
 * 预热本地中文拼音工具，保证首次离线预览也能生成拼音。
 * @returns {Promise<void>} 两个本地脚本加载完成或失败后的 Promise。
 */
async function preloadLanguageTools() {
  const loaders = [
    loadScriptOnce('./src/vendor/chinese/cnchar.min.js', 'cnchar'),
    loadScriptOnce('./src/vendor/chinese/pinyin-pro.min.js', 'pinyinPro'),
  ];
  await Promise.allSettled(loaders);
}

/**
 * 使用本地 pinyin-pro 将中文词语转换为拼音。
 * @param {string} text 待转换的中文词语。
 * @returns {string} 带声调拼音，工具不可用时返回空字符串。
 */
function getPinyinText(text) {
  const pinyinPro = globalThis.pinyinPro;
  if (pinyinPro?.pinyin) {
    try {
      return String(pinyinPro.pinyin(text, { toneType: 'symbol', separator: ' ' }) || '').trim();
    } catch (error) {
      // PWA 首次离线脚本加载失败时由题目渲染器的本地拼音字典兜底。
    }
  }
  return '';
}

/**
 * 打乱数组并返回独立副本。
 * @param {unknown[]} values 待打乱数组。
 * @returns {unknown[]} 打乱后的数组。
 */
function shuffleValues(values) {
  return [...values].sort(() => Math.random() - 0.5);
}

/**
 * 读取知识库偏好设置，供随机学习和试卷生成共同使用。
 * @returns {Promise<Record<string, 'like'|'dislike'>>} 用户对知识条目的喜欢/不喜欢状态。
 */
async function loadKnowledgePreferences() {
  const record = await get('settings', 'knowledgePreferences');
  return record?.value && typeof record.value === 'object' ? record.value : {};
}

/**
 * 保存单条知识库偏好；再次点击同一状态会取消偏好。
 * @param {string} type 知识库分类。
 * @param {Record<string, unknown>} item 知识条目。
 * @param {'like'|'dislike'} preference 新偏好状态。
 * @returns {Promise<void>} 偏好持久化完成。
 */
async function saveKnowledgePreference(type, item, preference) {
  const key = knowledgeKey(type, item);
  const next = { ...(state.knowledgePreferences || {}) };
  if (next[key] === preference) delete next[key];
  else next[key] = preference;
  state.knowledgePreferences = next;
  // 偏好会影响后续生成试卷的抽样权重，因此写入 settings 表跨会话保留。
  await put('settings', { id: 'knowledgePreferences', value: next, updatedAt: Date.now() });
}

/**
 * 返回当前知识库页面筛选条件，避免列表、随机学习和试卷生成入口口径分裂。
 * @returns {{query:string,author:string,dynasty:string,collection:string}} 当前筛选条件。
 */
function currentKnowledgeFilters() {
  return {
    query: state.knowledgeQuery,
    author: state.knowledgeAuthor,
    dynasty: state.knowledgeDynasty,
    collection: state.knowledgeCollection,
  };
}

/**
 * 从知识库候选集中按偏好抽样，生成题目时喜欢项优先、不喜欢项尽量靠后。
 * @param {string} type 知识库分类。
 * @param {Record<string, unknown>[]} candidates 候选条目全集。
 * @param {number} count 需要抽取的数量。
 * @param {Set<string>} excluded 排除的知识条目键集合。
 * @returns {Promise<Record<string, unknown>[]>} 抽样后的候选条目。
 */
async function sampleKnowledgeForUse(type, candidates, count, excluded = new Set()) {
  if (!state.knowledgePreferences || !Object.keys(state.knowledgePreferences).length) {
    state.knowledgePreferences = await loadKnowledgePreferences();
  }
  return weightedKnowledgeSample(type, candidates, count, excluded, state.knowledgePreferences);
}

/**
 * 为不填写内容的语文试卷构造轻量候选池，喜欢项优先进入候选，随机项只取小池子。
 * @param {string} type 知识库分类。
 * @param {number} count 需要生成的题目数量。
 * @returns {Promise<Record<string, unknown>[]>} 带偏好倾向的候选池。
 */
async function buildPreferredRandomKnowledgePool(type, count) {
  if (!state.knowledgePreferences || !Object.keys(state.knowledgePreferences).length) {
    state.knowledgePreferences = await loadKnowledgePreferences();
  }
  const likedKeys = Object.entries(state.knowledgePreferences)
    .filter(([key, value]) => value === 'like' && key.startsWith(`${type}:`))
    .map(([key]) => key);
  const likedItems = (await Promise.all(likedKeys.map((key) => getKnowledgeDetail(type, key)))).filter(Boolean);
  const randomItems = await randomKnowledgeAsync(type, Math.max(Number(count) * 8, 40));
  return [...likedItems, ...randomItems];
}

/**
 * 生成成语填空题，确保同一份试卷不重复。
 * @param {Record<string, unknown>} values 生成配置。
 * @returns {Array<Record<string, unknown>>} 成语填空题列表。
 */
async function createIdiomFillProblems(values) {
  const count = boundedPracticeCount(values.count, 10);
  const query = String(values.knowledgeQuery || '').trim();
  const candidates = query
    ? await filterKnowledgeAsync('idiom', { query })
    : await buildPreferredRandomKnowledgePool('idiom', count);
  const selected = await sampleKnowledgeForUse('idiom', candidates, count);
  const allCharacters = [...new Set(candidates.flatMap((item) => Array.from(item.word)))];
  return selected.map((item, index) => {
    const word = String(item.word);
    const blankIndex = Math.floor(Math.random() * word.length);
    const answer = word[blankIndex];
    const options = shuffleValues([answer, ...shuffleValues(allCharacters.filter((character) => character !== answer)).slice(0, 3)]);
    return {
      id: `problem-${index + 1}`,
      kind: 'idiom-fill',
      prompt: `${word.slice(0, blankIndex)}___${word.slice(blankIndex + 1)}`,
      answer,
      options,
      meta: { word, explanation: item.explanation, example: item.example },
    };
  });
}

/**
 * 生成古诗上下文配对题，按题目数量截断且不重复。
 * @param {Record<string, unknown>} values 生成配置。
 * @returns {Array<Record<string, unknown>>} 古诗配对题列表。
 */
async function createPoetryMatchProblems(values) {
  const count = boundedPracticeCount(values.count, 6);
  const query = String(values.knowledgeQuery || '').trim();
  const candidates = query
    ? await filterKnowledgeAsync('poetry', { query })
    : await buildPreferredRandomKnowledgePool('poetry', count);
  const selected = await sampleKnowledgeForUse('poetry', candidates, count);
  return selected.map((poem, index) => {
    const lines = (poem.lines || []).map((line) => toSimplifiedChinese(line));
    const pairIndex = Math.floor(Math.random() * Math.max(1, Math.floor(lines.length / 2))) * 2;
    const pair = lines.slice(pairIndex, pairIndex + 2);
    const highDifficulty = values.poetryDifficulty === 'high';
    const target = highDifficulty ? [pair.join('')] : [pair[1] || ''];
    return {
      id: `problem-${index + 1}`,
      kind: 'poetry-match',
      title: `${toSimplifiedChinese(poem.title)} · ${toSimplifiedChinese(poem.author)}`,
      prompt: highDifficulty ? `请默写“${pair[0] || ''}”及下一句` : `请写出“${pair[0] || ''}”的下句`,
      target,
      options: [],
      answer: target,
      meta: { dynasty: toSimplifiedChinese(poem.dynasty), author: toSimplifiedChinese(poem.author) },
    };
  });
}

/**
 * 生成看拼音写汉字题，题面只显示拼音，答案保留在快照用于批改。
 * @param {Record<string, unknown>} values 生成配置。
 * @param {string[]} lines 用户输入词语。
 * @returns {Array<Record<string, unknown>>} 看拼音写汉字题列表。
 */
async function createPinyinWriteProblems(values, lines) {
  const count = boundedPracticeCount(values.count, lines.length || 10);
  const knowledgeWords = lines.length ? [] : await buildPreferredRandomKnowledgePool('word', count);
  const source = lines.length ? lines : knowledgeWords.map((item) => item.word);
  const selected = lines.length
    ? shuffleValues([...new Set(source)]).slice(0, count)
    : (await sampleKnowledgeForUse('word', knowledgeWords, count)).map((item) => item.word);
  return selected.map((word, index) => ({
    id: `problem-${index + 1}`,
    kind: 'pinyin-write',
    prompt: word,
    answer: word,
    boxes: 0,
    meta: { pinyin: getPinyinText(word) || knowledgeWords.find((item) => item.word === word)?.pinyin || '' },
  }));
}

async function createProblemsFromForm(values) {
  if (values.subject !== '数学') {
    const lines = String(values.customContent || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (values.template === 'idiom-fill') return createIdiomFillProblems(values);
    if (values.template === 'poetry-match') return createPoetryMatchProblems(values);
    if (values.template === 'pinyin-write') return createPinyinWriteProblems(values, lines);
    if (values.template === 'hanzi-stroke') return createStrokePracticeProblems(values, lines);
    if (['composition', 'english-lines'].includes(values.template)) {
      const count = boundedPracticeCount(values.count, values.template === 'composition' ? 12 : 10);
      return Array.from({ length: count }, (_, index) => ({
        id: `problem-${index + 1}`,
        kind: values.template,
        prompt: '',
        answer: '',
        boxes: 0,
        meta: values.subject === '英语' ? { font: values.englishFont || 'comic' } : {},
      }));
    }
    const meta = {};
    if (values.template === 'hanzi-trace') meta.font = values.hanziFont || 'kaiti';
    if (values.subject === '英语') meta.font = values.englishFont || 'comic';
    const sourceLines = lines.length ? lines : ['请在此描写'];
    const practiceLines = values.template === 'hanzi-trace'
      ? splitHanziPracticeLines(sourceLines)
      : values.subject === '英语'
      ? splitEnglishPracticeLines(sourceLines, values.template)
      : sourceLines;
    return practiceLines.map((line,index) => ({ id:`problem-${index+1}`, kind:values.template, prompt:line, answer:'', boxes:0, meta: { ...meta } }));
  }
  const templateMap = {
    horizontal:'horizontal', missing:'missing-term', vertical:'vertical', compare:'comparison',
    equation:'equation', 'word-problem':'word-problem', 'chain-add':'chain-addition', 'chain-sub':'chain-subtraction',
    mixed:'mixed-operations', 'make-ten':'make-ten', 'break-ten':'break-ten',
    'carry-add':'carrying-addition', 'borrow-sub':'borrowing-subtraction', multiply:'multiplication',
    divide:'division', currency:'currency', unit:'unit-conversion', clock:'clock-reading'
  };
  const operationMap = { add:'addition', subtract:'subtraction' };
  const remainderMap = { exact:'none', remainder:'required', mixed:'optional' };
  const config = {
    template: templateMap[values.template] || values.template,
    count: Number(values.count || 30), orientation: values.orientation,
    options: {
      limit: Number(values.max || 20), termCount: Number(values.operandCount || 3),
      operation: operationMap[values.operation], remainder: remainderMap[values.divisionMode],
      category: values.unitType, steps: Number(values.steps || 1),
      leftNumber: optionalNumber(values.leftNumber), rightNumber: optionalNumber(values.rightNumber)
    }
  };
  const result = generateWorksheet(config);
  return (result.problems || result).map(normalizeProblem);
}

/**
 * 保存当前笔迹并在首次作答后刷新试卷工具栏状态。
 * @param {Record<string, unknown>} paper 当前打开的试卷快照。
 * @param {'black'|'red'} layer 正在保存的笔迹颜色层。
 * @param {Array<Record<string, unknown>>} strokes 当前颜色层的全部笔迹。
 * @returns {Promise<void>}
 */
async function handlePaperStrokeChange(paper, layer, strokes) {
  const previousStatus = paper.status;
  const savedPaper = await savePaperStrokes(paper, layer, strokes);
  if (previousStatus !== savedPaper.status && state.activePaperId === savedPaper.id) {
    syncPaperStatusView(savedPaper);
  }
}

/**
 * 将当前试卷的缩放和平移状态应用到纸张舞台。
 * @param {{paperId:string,scale:number,x:number,y:number,panMode:boolean}} transform 纸张变换状态。
 * @returns {void}
 */
function applyPaperTransform(transform) {
  const worksheet = document.querySelector('#activeWorksheet');
  const wrap = worksheet?.parentElement;
  if (!transform || !worksheet || !wrap) return;

  const scale = Math.max(0.6, Math.min(2.4, Number(transform.scale) || 1));
  const viewportWidth = Math.max(1, wrap.clientWidth - 24);
  const viewportHeight = Math.max(1, wrap.clientHeight - 24);
  const scaledWidth = worksheet.offsetWidth * scale;
  const scaledHeight = worksheet.offsetHeight * scale;
  const minX = Math.min(0, viewportWidth - scaledWidth);
  const maxX = Math.max(0, (viewportWidth - scaledWidth) / 2);
  const minY = Math.min(0, viewportHeight - scaledHeight);
  const maxY = Math.max(0, (viewportHeight - scaledHeight) / 2);

  transform.scale = scale;
  transform.x = Math.max(minX, Math.min(maxX, Number(transform.x) || 0));
  transform.y = Math.max(minY, Math.min(maxY, Number(transform.y) || 0));
  worksheet.style.transformOrigin = 'top left';
  worksheet.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
  wrap.classList.toggle('paper-pan-enabled', Boolean(transform.panMode));

  const zoomLabel = document.querySelector('[data-paper-zoom-value]');
  if (zoomLabel) zoomLabel.textContent = `${Math.round(transform.scale * 100)}%`;
  const panButton = document.querySelector('[data-paper-pan-toggle]');
  if (panButton) {
    panButton.textContent = transform.panMode ? '结束移动' : '移动试卷';
    panButton.classList.toggle('active', Boolean(transform.panMode));
  }

  // 移动模式下禁用所有笔迹层，避免拖拽试卷误记录为书写。
  state.drawing?.black?.setEnabled(!transform.panMode && ['unstarted', 'writing'].includes(state.paperStatus));
  state.drawing?.red?.setEnabled(!transform.panMode && state.paperStatus === 'review');
}

/**
 * 为试卷外层绑定移动模式的拖拽。
 * @param {{paperId:string,scale:number,x:number,y:number,panMode:boolean}} transform 纸张变换状态。
 * @returns {void}
 */
function bindPaperPanGesture(transform) {
  const wrap = document.querySelector('.paper-view .worksheet-wrap');
  if (!wrap || wrap.dataset.panBound === 'true') return;
  wrap.dataset.panBound = 'true';
  let gesture = null;

  wrap.addEventListener('pointerdown', (event) => {
    if (!transform.panMode || event.target.closest('.paper-floating-toolbar')) return;
    gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: transform.x, startY: transform.y };
    wrap.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  wrap.addEventListener('pointermove', (event) => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    transform.x = gesture.startX + event.clientX - gesture.x;
    transform.y = gesture.startY + event.clientY - gesture.y;
    applyPaperTransform(transform);
    event.preventDefault();
  });
  const finish = (event) => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gesture = null;
    if (wrap.hasPointerCapture(event.pointerId)) wrap.releasePointerCapture(event.pointerId);
  };
  wrap.addEventListener('pointerup', finish);
  wrap.addEventListener('pointercancel', finish);
  wrap.addEventListener('lostpointercapture', finish);
}

/**
 * 渲染试卷操作工具栏。
 * @param {Record<string, unknown>} paper 当前试卷快照。
 * @param {boolean} focusView 是否处于全屏作答/批改模式。
 * @returns {string} 工具栏 HTML。
 */
function renderPaperToolbarHtml(paper, focusView) {
  const mode = paper.status === 'review' || paper.status === 'done' ? 'red' : 'black';
  const editable = paper.status !== 'done';
  const scrollButtons = '<button class="secondary" data-paper-scroll="-1">↑ 上移</button><button class="secondary" data-paper-scroll="1">↓ 下移</button>';
  const zoomControls = '<span class="paper-zoom-controls"><button class="secondary" data-paper-zoom="-1" aria-label="缩小试卷">−</button><span data-paper-zoom-value>100%</span><button class="secondary" data-paper-zoom="1" aria-label="放大试卷">＋</button><button class="secondary" data-paper-zoom-reset>复位</button><button class="secondary" data-paper-pan-toggle>移动试卷</button></span>';
  return `
    ${focusView ? '<button class="secondary" data-route="papers">退出</button>' : ''}
    ${zoomControls}
    ${editable ? `<button class="toolbar-button active ${mode}" data-ink-mode="pen">${mode === 'red' ? '🔴 红笔批改' : '⚫ 黑笔作答'}</button>${scrollButtons}
      <button class="toolbar-button" data-ink-mode="eraser">⌫ 擦除当前笔迹</button><button class="toolbar-button" data-ink-action="undo">↶ 撤销</button>` : ''}
    ${paper.status === 'writing' ? '<button class="primary" data-paper-submit>提交作答</button>' : ''}
    ${paper.status === 'review' ? '<button class="primary" data-paper-reviewed>完成批改</button>' : ''}
    ${paper.status === 'done' ? '<button class="secondary" data-reopen-review>修改批改</button>' : ''}
    ${focusView ? '' : '<select id="printVersion" class="toolbar-button"><option value="blank">打印空白版</option><option value="answer">打印黑笔作答版</option><option value="final">打印红笔最终版</option></select><button class="secondary" data-print-paper>打印</button>'}
  `;
}

/**
 * 在不重建试卷 DOM 和笔迹画布的情况下同步状态工具栏。
 * @param {Record<string, unknown>} paper 已保存的新试卷快照。
 * @returns {void}
 */
function syncPaperStatusView(paper) {
  state.paperStatus = paper.status;
  const mode = paper.status === 'review' || paper.status === 'done' ? 'red' : 'black';
  const editable = paper.status !== 'done';
  const focusView = Boolean(state.paperTransform?.focusMode);
  const toolbar = document.querySelector('.paper-toolbar');
  if (toolbar) toolbar.innerHTML = renderPaperToolbarHtml(paper, focusView);
  state.drawing.active = mode;
  state.drawing.black?.setEnabled(editable && !state.paperTransform?.panMode && ['unstarted', 'writing'].includes(paper.status));
  state.drawing.red?.setEnabled(editable && !state.paperTransform?.panMode && paper.status === 'review');
  applyPaperTransform(state.paperTransform);
}

async function renderPaper() {
  const paper = await get('papers', state.activePaperId);
  if (!paper) return navigate('papers');
  state.paperTransform ||= { paperId: paper.id, scale: 1, x: 0, y: 0, panMode: false, focusMode: false };
  if (state.paperTransform.paperId !== paper.id) state.paperTransform = { paperId: paper.id, scale: 1, x: 0, y: 0, panMode: false, focusMode: false };
  state.paperStatus = paper.status;
  const mode = paper.status === 'review' || paper.status === 'done' ? 'red' : 'black';
  const editable = paper.status !== 'done';
  const wrongIds = new Set(paper.wrongProblemIds || []);
  const wrongTools = ['review', 'done'].includes(paper.status) ? `<section class="panel wrong-book-panel no-print">
    <div><h2>错题标记</h2><p>逐题切换，或输入“1、3-5”批量标记。</p></div>
    <div class="wrong-problem-buttons">${paper.problems.map((problem,index)=>`<button class="${wrongIds.has(problem.id) ? 'active' : ''}" data-toggle-wrong="${problem.id}">${index + 1}</button>`).join('')}</div>
    <div class="header-actions"><button class="secondary" data-batch-wrong>按题号批量标记</button>${wrongIds.size ? '<button class="secondary" data-retry-wrong="original">原题重做</button><button class="primary" data-retry-wrong="similar">生成同类新题</button>' : ''}</div>
  </section>` : '';
  const focusWriting = mode === 'black' && editable;
  if (focusWriting && !state.paperTransform.focusMode) {
    // 首次进入黑笔作答时固定纸张舞台；提交后继续复用该舞台，避免笔迹坐标映射到另一套尺寸。
    state.paperTransform.scale = 1;
    state.paperTransform.x = 0;
    state.paperTransform.y = 0;
    state.paperTransform.panMode = false;
    state.paperTransform.focusMode = true;
  }
  const focusView = focusWriting || state.paperTransform.focusMode === true;
  document.body.classList.toggle('paper-focus-active', focusView);
  const headerHtml = focusView ? '' : pageHeader(escapeHtml(paper.title),`${PAPER_STATUS[paper.status]} · ${paper.subject}`,`<button class="secondary" data-route="papers">返回目录</button>`);
  main.innerHTML = `${headerHtml}<section class="paper-view ${focusView ? 'paper-writing-view' : ''}">
    <div class="paper-toolbar no-print ${focusView ? 'paper-floating-toolbar' : ''}">${renderPaperToolbarHtml(paper, focusView)}</div>
    ${wrongTools}
    <div class="worksheet-wrap"><div id="activeWorksheet" class="worksheet-pages">${renderWorksheetPagesHtml(paper)}</div></div></section>`;
  const worksheet = document.querySelector('#activeWorksheet');
  const blackLayer = createDrawingLayer(worksheet, { color:'#1e252b', enabled:['unstarted','writing'].includes(paper.status), strokes:paper.blackStrokes, onChange:(strokes)=>handlePaperStrokeChange(paper,'black',strokes) });
  const redLayer = createDrawingLayer(worksheet, { color:'#d93636', enabled:paper.status === 'review', strokes:paper.redStrokes, onChange:(strokes)=>handlePaperStrokeChange(paper,'red',strokes) });
  state.drawing = { black: blackLayer, red: redLayer, active: mode };
  bindPaperPanGesture(state.paperTransform);
  applyPaperTransform(state.paperTransform);
}

/**
 * 渲染阅读资料页面。
 * 先使用 IndexedDB 中已有的书目完成首屏，再后台同步 huiben 清单，避免清单或大文件读取阻塞点击反馈。
 * @returns {Promise<void>} 首屏结构完成渲染后的 Promise。
 */
async function renderReading() {
  const cachedReadings = (await getAll('readings')).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const active = cachedReadings.find((item)=>item.id === state.activeReadingId);
  if (active) {
    renderActiveReading(active);
    void ensureReadingSeeds().catch((error) => console.warn('阅读资料后台同步失败', error));
    return;
  }

  renderReadingShelf(cachedReadings);
  void ensureReadingSeeds().then((readings) => {
    if (state.route !== 'reading' || state.activeReadingId) return;
    renderReadingShelf(readings.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)));
  }).catch((error) => {
    console.warn('阅读资料后台同步失败', error);
  });
}

/**
 * 渲染书架列表。
 * @param {Array<Record<string, unknown>>} readings 当前设备已保存的阅读资料。
 * @returns {void}
 */
function renderReadingShelf(readings) {
  if (state.bookObjectUrl) {
    URL.revokeObjectURL(state.bookObjectUrl);
    state.bookObjectUrl = null;
  }
  const fileBooks = readings.filter((item) => item.type === 'file-book' && canReaderRequestUrl(item));
  const cachedCount = readings.filter((item) => isBookCached(item)).length;
  const selectableIds = new Set(fileBooks.map((item) => item.id));
  state.selectedBookIds.forEach((id) => { if (!selectableIds.has(id)) state.selectedBookIds.delete(id); });
  preloadReaderAssets(readings);
  main.innerHTML = `${pageHeader('绘本书架','读取 huiben 文件夹和已导入书籍','<button class="primary" data-new-picture-book>＋ 导入书籍</button><button class="secondary" data-new-text-reading>＋ 新建文字</button>')}
    <div class="book-cache-toolbar" data-book-cache-toolbar>
      <span data-book-cache-status>本地书库：${cachedCount} 本已下载</span>
      <button class="secondary" data-book-select-all>${fileBooks.length && state.selectedBookIds.size === fileBooks.length ? '取消全选' : '全选书籍'}</button>
      <button class="primary" data-book-batch-download ${fileBooks.length ? '' : 'disabled'}>下载选中</button>
      <button class="secondary" data-book-clear-cache ${cachedCount ? '' : 'disabled'}>清除本地缓存</button>
    </div>
    ${readings.length ? `<section class="bookshelf-grid">${readings.map((item)=>renderBookCard(item)).join('')}</section>` : '<div class="empty-state"><span class="emoji">📚</span><h2>书架正在准备</h2><p>正在读取 huiben 文件夹清单，请稍候。</p></div>'}`;
}

/**
 * 立即渲染已选中的阅读资料。
 * 文件绘本先显示阅读层，再异步挂载阅读器或缓存离线副本，避免大文件让点击看起来失效。
 * @param {Record<string, unknown>} item 当前选中的阅读资料。
 * @returns {void}
 */
function renderActiveReading(item) {
  destroyActiveFileReader();
  state.fileReaderToken += 1;
  state.pdfZoom = 1;
  const readerItem = item.type === 'file-book' ? createImmediateFileBook(item) : item;
  main.innerHTML = renderReader(readerItem);
  if (readerItem.type === 'file-book' && readerItem.fileAccessMode !== 'local-file') {
    const kind = String(readerItem.fileKind || '').toLowerCase();
    if (kind === 'pdf') void mountPdfJsReader(readerItem, state.fileReaderToken);
    if (['epub', 'equb'].includes(kind)) void mountEpubJsReader(readerItem, state.fileReaderToken);
  }
  if (item.type === 'file-book' && item.source !== 'huiben') void cacheFileBook(item);
}

function renderBookCard(item) {
  const badge = item.fileKind ? String(item.fileKind).toUpperCase() : (item.type === 'picture-book' ? '图片' : '文本');
  const source = item.source === 'huiben' ? 'huiben' : (item.source === 'imported' ? '已导入' : item.category || '阅读');
  const selectable = item.type === 'file-book' && canReaderRequestUrl(item);
  const cached = isBookCached(item);
  return `<article class="book-card-shell">${selectable ? `<label class="book-cache-select"><input type="checkbox" data-book-select="${item.id}" ${state.selectedBookIds.has(item.id) ? 'checked' : ''}><span>缓存到本地</span></label>` : ''}<button class="book-card" data-reading-id="${item.id}" aria-label="打开${escapeHtml(item.title)}"><span class="book-badge">${escapeHtml(badge)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(source)}</small>${cached ? '<small class="book-cache-state">已下载到本机</small>' : ''}</button></article>`;
}

function renderReader(item) {
  if (item.type === 'file-book') return renderFileBookReader(item);
  if (item.type === 'picture-book') {
    const page = item.pages?.[state.bookPage || 0] || item.pages?.[0];
    if (!page) return '<div class="empty-state">绘本暂无页面</div>';
    const background = page.illustration?.palette?.join(',') || '#f4f1e9,#ffffff';
    return `<article class="reader fullscreen-reader"><div class="reader-floating-toolbar"><button class="secondary" data-book-prev>←</button><strong>${escapeHtml(item.title)} · ${(state.bookPage || 0)+1}/${item.pages.length}</strong><button class="secondary" data-book-next>→</button><button class="secondary" data-speak-book>朗读</button>${item.source === 'huiben' || item.builtin ? '' : '<button class="secondary" data-edit-book>编辑</button>'}<button class="primary" data-exit-reader>退出阅读</button></div><div class="picture-page fullscreen-picture-page" style="background:linear-gradient(150deg,${background})">${page.imageDataUrl ? `<img src="${page.imageDataUrl}" alt="${escapeHtml(page.fileName || item.title)}">` : '<div class="picture-placeholder"></div>'}${(page.textBoxes || []).map((box)=>`<p class="reading-paragraph picture-reading-box" data-book-text data-text-box-id="${box.id}" style="left:${box.x}%;top:${box.y}%;width:${box.width}%">${tokenHtml(box.text,item.language)}</p>`).join('')}</div></article>`;
  }
  const paragraphs = item.content.split(/\n+/).filter(Boolean);
  return `<article class="reader fullscreen-reader text-reader"><div class="reader-floating-toolbar"><button class="primary" data-speak-all>▶ 连续朗读</button><button class="secondary" data-stop-speech>■ 停止</button><select id="traceMode"><option value="none">普通阅读</option><option value="overlay">覆盖原文描红</option><option value="practice">描红 + 仿写</option></select><button class="primary" data-exit-reader>退出阅读</button></div><h2>${escapeHtml(item.title)}</h2>${paragraphs.map((paragraph,index)=>`<div class="paragraph-wrap"><p class="reading-paragraph" data-paragraph-index="${index}" data-text="${escapeHtml(paragraph)}">${tokenHtml(paragraph,item.language)}</p><div class="trace-extra"></div></div>`).join('')}</article>`;
}

function renderFileBookReader(item) {
  const source = String(item.sourceUrl || '').trim();
  const sourceUrl = escapeHtml(source);
  const title = escapeHtml(item.title);
  const kind = String(item.fileKind || 'file').toUpperCase();
  const isEpub = ['EPUB', 'EQUB'].includes(kind);
  const localFileFallback = item.fileAccessMode === 'local-file'
    ? `<div class="book-file-fallback local-file-notice"><span class="ultra-notice-mark" aria-hidden="true"></span><h2>${title}</h2><p>${isEpub ? 'EPUB/EQUB' : 'PDF'} 不能在 file:// 页面内嵌阅读，浏览器会阻止本地资源加载。</p><p class="book-file-hint">请启动本地服务后打开本应用；也可以直接打开原文件，由系统阅读器负责显示。</p><div class="local-file-actions"><a class="primary" href="http://127.0.0.1:4173/" target="_blank" rel="noopener">打开本地阅读服务</a>${source ? `<a class="secondary" href="${sourceUrl}" target="_blank" rel="noopener">直接打开原文件</a>` : ''}</div></div>`
    : '';
  const fallback = source
    ? `<div class="book-file-fallback"><h2>${title}</h2><p>${kind === 'PDF' ? 'PDF 文件已载入。若内置查看器没有显示，请点击“打开原文件”。' : `${kind} 文件已载入。浏览器不保证直接排版显示此格式，请使用系统阅读器打开。`}</p><a class="primary" href="${sourceUrl}" target="_blank" rel="noopener">打开原文件</a></div>`
    : `<div class="book-file-fallback"><h2>${title}</h2><p>没有找到书籍文件地址，请重新导入或检查 huiben/manifest.json。</p></div>`;
  const body = localFileFallback
    ? localFileFallback
    : isEpub
    ? `<div class="file-reader-surface epubjs-reader-surface" data-epubjs-reader><div class="epubjs-status" data-epub-status>正在准备 EPUB 阅读器…</div><div class="epubjs-viewport" data-epub-viewport></div></div>`
    : kind === 'PDF' && source
    ? `<div class="file-reader-surface pdfjs-reader-surface" data-pdf-reader><div class="pdfjs-toolbar"><button class="secondary" data-pdf-page="-1" disabled>← 上一页</button><span data-pdf-progress>正在加载 PDF…</span><button class="secondary" data-pdf-page="1" disabled>下一页 →</button><button class="secondary" data-reader-zoom="-1" aria-label="缩小 PDF">−</button><button class="secondary" data-reader-zoom="1" aria-label="放大 PDF">＋</button></div><div class="pdfjs-viewport" data-pdf-viewport></div></div>`
    : fallback;
  return `<article class="reader fullscreen-reader file-book-reader"><div class="reader-floating-toolbar"><strong>${title}</strong><span>${kind}</span><button class="primary" data-exit-reader>退出阅读</button></div>${body}</article>`;
}

/**
 * 为当前阅读层准备可立即使用的文件来源。
 * @param {Record<string, unknown>} item 书架中的文件绘本记录。
 * @returns {Record<string, unknown>} 可直接交给 PDF iframe 或 EPUB 阅读器的记录。
 */
function createImmediateFileBook(item) {
  const sourceUrl = String(item.sourceUrl || '');
  const isLocalFileUrl = globalThis.location?.protocol === 'file:' || sourceUrl.startsWith('file:');
  if (isLocalFileUrl) return { ...item, fileAccessMode: 'local-file' };
  const isEpub = ['epub', 'equb'].includes(String(item.fileKind || '').toLowerCase());
  if (isEpub || !(item.sourceBlob instanceof Blob) || typeof URL?.createObjectURL !== 'function') return item;
  if (state.bookObjectUrl) URL.revokeObjectURL(state.bookObjectUrl);
  state.bookObjectUrl = URL.createObjectURL(item.sourceBlob);
  return { ...item, sourceUrl: state.bookObjectUrl };
}

/**
 * 后台缓存绘本文件，避免首次点击时等待完整文件下载。
 * @param {Record<string, unknown>} item 书架中的文件绘本记录。
 * @returns {Promise<void>} 缓存完成或失败后的 Promise。
 */
async function cacheFileBook(item) {
  return cacheFileBookWithOptions(item);
}

/**
 * 判断当前浏览器是否支持 Cache Storage 绘本缓存。
 * @returns {boolean} 当前环境是否可打开 Cache Storage。
 */
function canUseBookCacheStorage() {
  return typeof caches !== 'undefined' && typeof caches.open === 'function';
}

/**
 * 判断当前设备是否应优先使用同页 EPUB 解析器。
 * @returns {boolean} iOS 或独立 PWA 模式返回 true。
 */
function shouldPreferDirectEpubReader() {
  const standalone = globalThis.matchMedia?.('(display-mode: standalone)').matches || globalThis.navigator?.standalone === true;
  const isIos = /iPad|iPhone|iPod/u.test(globalThis.navigator?.userAgent || '')
    || (globalThis.navigator?.platform === 'MacIntel' && Number(globalThis.navigator?.maxTouchPoints || 0) > 1);
  return Boolean(standalone || isIos);
}

/**
 * 将单本绘本响应写入应用管理的 Cache Storage 缓存。
 * @param {string} sourceUrl 同源静态绘本地址。
 * @param {Response} response 已成功读取的绘本网络响应。
 * @returns {Promise<boolean>} Cache Storage 是否成功接收该响应。
 */
async function putBookResponseCache(sourceUrl, response) {
  if (!canUseBookCacheStorage() || !sourceUrl || !response?.ok) return false;
  try {
    const cache = await caches.open(BOOK_DEVICE_CACHE_NAME);
    await cache.put(new Request(sourceUrl), response.clone());
    return true;
  } catch (error) {
    // iPad PWA 在存储紧张时可能拒绝写入缓存，此时继续保留 IndexedDB 路径兜底。
    console.warn('Book Cache Storage write failed', error);
    return false;
  }
}

/**
 * 从应用管理的 Cache Storage 中读取单本静态绘本响应。
 * @param {string} sourceUrl 同源静态绘本地址。
 * @returns {Promise<Response|null>} 命中缓存时返回响应，否则返回 null。
 */
async function matchBookResponseCache(sourceUrl) {
  if (!canUseBookCacheStorage() || !sourceUrl) return null;
  try {
    const cache = await caches.open(BOOK_DEVICE_CACHE_NAME);
    return await cache.match(new Request(sourceUrl));
  } catch (error) {
    // 缓存读取失败时回退网络，避免只因缓存不可用导致阅读器空白。
    console.warn('Book Cache Storage read failed', error);
    return null;
  }
}

/**
 * 从应用管理的 Cache Storage 中删除单本静态绘本响应。
 * @param {string} sourceUrl 同源静态绘本地址。
 * @returns {Promise<void>} 删除尝试结束后的 Promise。
 */
async function deleteBookResponseCache(sourceUrl) {
  if (!canUseBookCacheStorage() || !sourceUrl) return;
  try {
    const cache = await caches.open(BOOK_DEVICE_CACHE_NAME);
    await cache.delete(new Request(sourceUrl));
  } catch (error) {
    // 缓存清理失败不阻塞书架元数据清理，下次下载会覆盖同一地址。
    console.warn('Book Cache Storage cleanup failed', error);
  }
}

/**
 * 判断书架记录是否标记为 Cache Storage 本地副本。
 * @param {Record<string, unknown>} item 需要检查的书架记录。
 * @returns {boolean} 是否可以尝试从 Cache Storage 读取。
 */
function isBookCacheStorageRecord(item) {
  return item?.type === 'file-book' && item?.cacheMode === 'cache-storage' && Boolean(item.sourceUrl);
}

async function cacheFileBookWithOptions(item, options = {}) {
  const sourceUrl = String(item.sourceUrl || '');
  const isLocalFileUrl = globalThis.location?.protocol === 'file:' || sourceUrl.startsWith('file:');
  const isInlineSource = /^(blob:|data:)/u.test(sourceUrl);
  if (isLocalFileUrl || isInlineSource || (!options.force && isBookCached(item)) || !sourceUrl) return { ok: false, skipped: true };
  try {
    const response = await fetch(sourceUrl, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`绘本文件读取失败：${response.status}`);
    if (canReaderRequestUrl(item)) {
      const cachedInStorage = await putBookResponseCache(sourceUrl, response);
      if (cachedInStorage) {
        const cacheStorageRecord = { ...item, cacheMode: 'cache-storage', cacheUpdatedAt: Date.now(), size: Number(response.headers.get('content-length') || item.size || 0), updatedAt: Date.now() };
        delete cacheStorageRecord.sourceBlob;
        await put('readings', cacheStorageRecord);
        return { ok: true, size: cacheStorageRecord.size };
      }
      // iPad PWA 可能拒绝 Cache Storage 写入大文件，继续退到 IndexedDB Blob，保证“下载”按钮有可用本地副本。
      console.warn('Cache Storage unavailable for book, falling back to IndexedDB Blob');
    }
    const blob = await response.blob();
    if (!blob.size) throw new Error('绘本文件为空');
    await put('readings', { ...item, sourceBlob: blob, cacheMode: 'device', cacheUpdatedAt: Date.now(), size: blob.size, updatedAt: Date.now() });
    return { ok: true, size: blob.size };
  } catch (error) {
    // 缓存兜底后仍下载失败时返回错误，由书架批量流程统一汇总。
    console.warn('绘本离线副本准备失败', error);
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * 判断书架记录是否包含可读取的本地绘本副本。
 * @param {Record<string, unknown>} item 需要检查的书架记录。
 * @returns {boolean} 是否存在 IndexedDB Blob 或 Cache Storage 副本。
 */
function isBookCached(item) {
  return item?.type === 'file-book' && ((item?.cacheMode === 'device' && item.sourceBlob instanceof Blob && item.sourceBlob.size > 0) || isBookCacheStorageRecord(item));
}

/**
 * 在用户进入书架后后台预热本地阅读器脚本，缩短首次打开等待时间。
 * @param {Array<Record<string, unknown>>} readings 当前书架记录。
 * @returns {void}
 */
function preloadReaderAssets(readings) {
  const hasEpub = readings.some((item) => ['epub', 'equb'].includes(String(item.fileKind || '').toLowerCase()));
  if (hasEpub) {
    // EPUB 默认使用同页解压直读，目录页只预热轻量 JSZip，重型阅读器和 PDF worker 延后到打开书籍时加载。
    void loadScriptOnce('./src/vendor/epubjs/jszip.min.js', 'JSZip').catch((error) => console.warn('EPUB 解压组件预热失败', error));
  }
}

/**
 * 下载用户选中的绘本，按顺序写入固定的应用本地缓存库。
 * @returns {Promise<void>} 批量下载完成后的 Promise。
 */
async function downloadSelectedBooks() {
  if (state.bookCacheRun) return;
  const readings = await getAll('readings');
  const selected = readings.filter((item) => state.selectedBookIds.has(item.id) && item.type === 'file-book' && canReaderRequestUrl(item));
  if (!selected.length) {
    showToast('请先勾选要下载的绘本');
    return;
  }
  const runId = Date.now();
  state.bookCacheRun = runId;
  const status = document.querySelector('[data-book-cache-status]');
  let successCount = 0;
  let failedCount = 0;
  try {
    for (let index = 0; index < selected.length; index += 1) {
      if (state.bookCacheRun !== runId) return;
      const item = selected[index];
      if (status) status.textContent = `正在下载 ${index + 1}/${selected.length}：${item.title}`;
      const result = await cacheFileBookWithOptions(item);
      if (result.ok || result.skipped) successCount += 1;
      else failedCount += 1;
    }
  } finally {
    state.bookCacheRun = 0;
  }
  showToast(failedCount ? `已下载 ${successCount} 本，失败 ${failedCount} 本` : `已下载 ${successCount} 本到本机`);
  state.selectedBookIds.clear();
  const refreshed = (await getAll('readings')).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  if (state.route === 'reading' && !state.activeReadingId) renderReadingShelf(refreshed);
}

/**
 * 清理应用本地缓存中的绘本文件，但保留书架记录和原始 huiben 地址。
 * @returns {Promise<void>} 清理完成后的 Promise。
 */
async function clearLocalBookCache() {
  const readings = await getAll('readings');
  const cached = readings.filter((item) => isBookCached(item));
  if (!cached.length) {
    showToast('没有可清理的本地绘本');
    return;
  }
  if (!confirm(`确定删除本机缓存的 ${cached.length} 本绘本吗？书架记录会保留。`)) return;
  await Promise.all(cached.map(async (item) => {
    await deleteBookResponseCache(String(item.sourceUrl || ''));
    const next = { ...item };
    delete next.sourceBlob;
    delete next.cacheMode;
    delete next.cacheUpdatedAt;
    await put('readings', next);
  }));
  state.selectedBookIds.clear();
  showToast(`已清除 ${cached.length} 本本地绘本`);
  if (state.route === 'reading' && !state.activeReadingId) {
    renderReadingShelf((await getAll('readings')).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)));
  }
}

/**
 * 判断绘本是否可以直接交给阅读器按 URL/Range 请求读取。
 * @param {Record<string, unknown>} item 书架中的文件绘本记录。
 * @returns {boolean} 是否为可直接请求的 HTTP(S) 地址。
 */
function canReaderRequestUrl(item) {
  const sourceUrl = String(item.sourceUrl || '').trim();
  return Boolean(sourceUrl) && !/^(blob:|data:|file:)/u.test(sourceUrl);
}

/**
 * 为异步阅读器增加明确的超时边界，避免网络或 Safari 内核异常时永久停留在加载提示。
 * @param {Promise<unknown>} promise 待读取的异步任务。
 * @param {string} message 超时后展示给用户的错误信息。
 * @param {number} timeoutMs 超时时间，单位为毫秒。
 * @returns {Promise<unknown>} 原任务结果或超时错误。
 */
function withReaderTimeout(promise, message, timeoutMs = READER_LOAD_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * 从 IndexedDB Blob、Cache Storage、Data URL 或静态 URL 读取绘本字节。
 * @param {Record<string, unknown>} item 文件绘本书架记录。
 * @returns {Promise<ArrayBuffer>} PDF.js 或 epub.js 使用的绘本字节。
 */
async function readBookArrayBuffer(item) {
  if (item.sourceBlob instanceof Blob) return item.sourceBlob.arrayBuffer();
  const sourceUrl = String(item.sourceUrl || '').trim();
  if (!sourceUrl) throw new Error('没有找到绘本文件地址');
  const cachedResponse = await matchBookResponseCache(sourceUrl);
  if (cachedResponse) return cachedResponse.arrayBuffer();
  const response = await fetch(sourceUrl, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`绘本文件读取失败：${response.status}`);
  return response.arrayBuffer();
}

/**
 * Load one local UMD reader script once and reuse its global object.
 * @param {string} sourceUrl Local script URL.
 * @param {string} globalName Global object name exported by the script.
 * @returns {Promise<unknown>} Loaded global object.
 */
function loadScriptOnce(sourceUrl, globalName) {
  const globalObject = globalThis[globalName];
  if (globalObject) return Promise.resolve(globalObject);
  const cacheKey = `__growthDeskScript_${globalName}`;
  if (globalThis[cacheKey]) return globalThis[cacheKey];
  globalThis[cacheKey] = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = sourceUrl;
    script.async = true;
    script.onload = () => {
      const loaded = globalThis[globalName];
      if (!loaded) {
        reject(new Error(`${globalName} 脚本已加载但没有提供阅读器对象`));
        return;
      }
      resolve(loaded);
    };
    script.onerror = () => reject(new Error(`阅读器脚本加载失败：${sourceUrl}`));
    document.head.appendChild(script);
  }).catch((error) => {
    delete globalThis[cacheKey];
    throw error;
  });
  return globalThis[cacheKey];
}

/**
 * 更新文件阅读器的状态提示。
 * @param {Element|null} reader 当前阅读器根节点。
 * @param {string} message 要显示的状态文本。
 * @returns {void}
 */
function setFileReaderStatus(reader, message) {
  const status = reader?.querySelector('[data-pdf-progress], [data-epub-status]');
  if (status) status.textContent = message;
}

/**
 * 销毁当前 PDF.js 或 epub.js 实例，防止退出阅读后异步任务回写旧页面。
 * @returns {void}
 */
function destroyActiveFileReader() {
  state.fileReaderToken += 1;
  const activeReader = state.fileReader;
  state.fileReader = null;
  if (!activeReader) return;
  disposeReaderState(activeReader);
}

/**
 * 释放阅读器实例及其创建的临时资源。
 * @param {Record<string, unknown>|null} readerState 当前阅读器实例状态。
 * @returns {void}
 */
function disposeReaderState(readerState) {
  if (!readerState) return;
  try {
    if (readerState.kind === 'pdf') {
      readerState.loadingTask?.destroy?.();
      readerState.pdf?.cleanup?.();
    }
    if (readerState.kind === 'epub') {
      readerState.rendition?.destroy?.();
      readerState.book?.destroy?.();
    }
    if (readerState.kind === 'epub-direct') {
      (readerState.objectUrls || []).forEach((url) => URL.revokeObjectURL(url));
    }
  } catch (error) {
    console.warn('阅读器销毁失败', error);
  }
}

/**
 * 更新 PDF.js 阅读器分页按钮和当前页提示。
 * @param {Record<string, unknown>} readerState 当前 PDF.js 状态。
 * @returns {void}
 */
function updatePdfReaderControls(readerState) {
  const reader = document.querySelector('[data-pdf-reader]');
  if (!reader || !readerState?.pdf) return;
  const page = Math.max(1, Math.min(readerState.pdf.numPages, readerState.currentPage || 1));
  readerState.currentPage = page;
  const progress = reader.querySelector('[data-pdf-progress]');
  if (progress) progress.textContent = `第 ${page} / ${readerState.pdf.numPages} 页`;
  reader.querySelector('[data-pdf-page="-1"]')?.toggleAttribute('disabled', page <= 1);
  reader.querySelector('[data-pdf-page="1"]')?.toggleAttribute('disabled', page >= readerState.pdf.numPages);
}

/**
 * 按当前阅读容器宽度渲染一个 PDF 页面。
 * @param {Record<string, unknown>} readerState 当前 PDF.js 状态。
 * @param {number} pageNumber 待渲染的页码，从 1 开始。
 * @returns {Promise<void>} 页面渲染完成。
 */
async function renderPdfPage(readerState, pageNumber, renderRun = readerState.renderRun) {
  const reader = document.querySelector('[data-pdf-reader]');
  const viewportElement = reader?.querySelector('[data-pdf-viewport]');
  if (!reader || !viewportElement || readerState.token !== state.fileReaderToken || renderRun !== readerState.renderRun) return;
  const page = await readerState.pdf.getPage(pageNumber);
  if (readerState.token !== state.fileReaderToken || renderRun !== readerState.renderRun || !reader.isConnected) return;
  const baseViewport = page.getViewport({ scale: 1 });
  const availableWidth = Math.max(240, viewportElement.clientWidth - 24);
  const scale = Math.max(.5, Math.min(3, availableWidth / baseViewport.width * state.pdfZoom));
  const viewport = page.getViewport({ scale });
  const pageElement = document.createElement('section');
  pageElement.className = 'pdfjs-page';
  pageElement.dataset.pdfPageNumber = String(pageNumber);
  const canvas = document.createElement('canvas');
  canvas.className = 'pdfjs-canvas';
  const deviceScale = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(viewport.width * deviceScale);
  canvas.height = Math.floor(viewport.height * deviceScale);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  pageElement.appendChild(canvas);
  viewportElement.appendChild(pageElement);
  await page.render({
    canvasContext: canvas.getContext('2d', { alpha: false }),
    viewport,
    transform: deviceScale === 1 ? undefined : [deviceScale, 0, 0, deviceScale, 0, 0],
  }).promise;
  page.cleanup();
}

/**
 * 按当前缩放比例重新渲染 PDF 全部页面。
 * @param {Record<string, unknown>} readerState 当前 PDF.js 状态。
 * @returns {Promise<void>} 所有页面重绘完成。
 */
async function rerenderPdfDocument(readerState) {
  const reader = document.querySelector('[data-pdf-reader]');
  const viewportElement = reader?.querySelector('[data-pdf-viewport]');
  if (!reader || !viewportElement || readerState.kind !== 'pdf') return;
  readerState.renderRun += 1;
  const renderRun = readerState.renderRun;
  viewportElement.replaceChildren();
  setFileReaderStatus(reader, '正在调整页面…');
  for (let pageNumber = 1; pageNumber <= readerState.pdf.numPages; pageNumber += 1) {
    if (renderRun !== readerState.renderRun || readerState.token !== state.fileReaderToken) return;
    await renderPdfPage(readerState, pageNumber, renderRun);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  updatePdfReaderControls(readerState);
  const currentPage = viewportElement.querySelector(`[data-pdf-page-number="${readerState.currentPage}"]`);
  currentPage?.scrollIntoView({ block: 'start' });
}

/**
 * 等待 epub.js 在当前视口中写入首章内容。
 * @param {Element} viewport EPUB 内容容器。
 * @param {number} timeoutMs 等待上限，单位为毫秒。
 * @returns {Promise<boolean>} 是否已经发现可读的首章内容。
 */
async function waitForEpubContent(viewport, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const frames = [...viewport.querySelectorAll('iframe')];
    const hasContent = frames.some((frame) => {
      try {
        const documentElement = frame.contentDocument;
        const text = documentElement?.body?.textContent?.trim() || '';
        const imageCount = documentElement?.images?.length || 0;
        return Boolean(text || imageCount);
      } catch (error) {
        // Safari 可能暂时不允许访问尚未完成加载的 iframe，下一轮继续检查。
        return false;
      }
    });
    if (hasContent) return true;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return false;
}

/**
 * 规范化 EPUB 压缩包内的相对路径。
 * @param {string} path 原始压缩包路径。
 * @returns {string} 不包含 . 和 .. 段的归一化路径。
 */
function normalizeEpubArchivePath(path) {
  const parts = String(path || '').split('/');
  const normalized = [];
  parts.forEach((part) => {
    if (!part || part === '.') return;
    if (part === '..') {
      normalized.pop();
      return;
    }
    normalized.push(part);
  });
  return normalized.join('/');
}

/**
 * 根据当前章节路径解析 EPUB 资源路径。
 * @param {string} currentPath 当前章节在压缩包内的路径。
 * @param {string} targetPath HTML 或 CSS 中引用的资源路径。
 * @returns {string} 资源在压缩包中的规范化路径。
 */
function resolveEpubArchivePath(currentPath, targetPath) {
  const cleanTarget = String(targetPath || '').split(/[?#]/u)[0].replace(/^\/+/u, '');
  if (!cleanTarget) return '';
  const basePath = String(currentPath || '').split('/').slice(0, -1).join('/');
  return normalizeEpubArchivePath(basePath ? `${basePath}/${cleanTarget}` : cleanTarget);
}

/**
 * 判断 EPUB 资源是否可以作为内嵌图片读取。
 * @param {string} source 原始图片地址。
 * @returns {boolean} data、blob 和网络外链之外的相对资源返回 true。
 */
function isEpubRelativeAsset(source) {
  return Boolean(source) && !/^(?:data:|blob:|https?:|file:|#)/iu.test(source);
}

/**
 * 解析 EPUB 内部目录链接，保留目标章节和锚点。
 * @param {string} href 原始链接地址。
 * @param {string} currentPath 当前章节路径。
 * @returns {{path:string,anchor:string}|null} EPUB 内部跳转目标。
 */
function resolveEpubInternalLink(href, currentPath) {
  const raw = String(href || '').trim();
  if (!raw || /^(?:https?:|mailto:|tel:|data:|blob:|file:|javascript:)/iu.test(raw)) return null;
  const hashIndex = raw.indexOf('#');
  const pathPart = (hashIndex >= 0 ? raw.slice(0, hashIndex) : raw).trim();
  const anchor = hashIndex >= 0 ? raw.slice(hashIndex + 1) : '';
  const path = pathPart ? resolveEpubArchivePath(currentPath, pathPart) : normalizeEpubArchivePath(currentPath);
  return path ? { path, anchor } : null;
}

/**
 * 将 EPUB 章节内目录链接改写为应用内跳转，避免相对 HTML 跳出阅读器。
 * @param {Element} body 章节正文节点。
 * @param {Array<{path:string}>} chapters EPUB 可阅读章节列表。
 * @param {string} currentPath 当前章节路径。
 * @returns {void}
 */
function prepareEpubInternalLinks(body, chapters, currentPath) {
  body.querySelectorAll('a[href]').forEach((anchorElement) => {
    const target = resolveEpubInternalLink(anchorElement.getAttribute('href'), currentPath);
    if (!target) return;
    const chapterIndex = chapters.findIndex((chapter) => normalizeEpubArchivePath(chapter.path) === target.path);
    if (chapterIndex < 0) return;
    // EPUB 目录只改变当前阅读容器内容，不能让浏览器跳出到站点根路径。
    anchorElement.dataset.epubLink = String(chapterIndex);
    anchorElement.dataset.epubAnchor = target.anchor || '';
    anchorElement.setAttribute('href', '#');
  });
}

/**
 * 解析 EPUB 的容器、目录和阅读顺序。
 * @param {ArrayBuffer} arrayBuffer EPUB 文件字节。
 * @returns {Promise<{zip:object,chapters:Array<{path:string,id:string}>,stylePaths:string[],title:string}>} 可逐章渲染的压缩包模型。
 */
async function parseEpubArchive(arrayBuffer) {
  const JSZip = globalThis.JSZip;
  if (!JSZip) throw new Error('EPUB 解压组件不可用');
  const zip = await JSZip.loadAsync(arrayBuffer);
  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) throw new Error('EPUB 缺少 META-INF/container.xml');
  const containerDocument = new DOMParser().parseFromString(await containerFile.async('string'), 'application/xml');
  const rootFilePath = containerDocument.querySelector('rootfile')?.getAttribute('full-path');
  if (!rootFilePath) throw new Error('EPUB 缺少内容目录');
  const opfFile = zip.file(rootFilePath);
  if (!opfFile) throw new Error('EPUB 内容目录不存在');
  const opfDocument = new DOMParser().parseFromString(await opfFile.async('string'), 'application/xml');
  const manifest = new Map([...opfDocument.querySelectorAll('manifest > item')].map((item) => [
    item.getAttribute('id'),
    {
      href: resolveEpubArchivePath(rootFilePath, item.getAttribute('href')),
      mediaType: item.getAttribute('media-type') || '',
      properties: item.getAttribute('properties') || '',
    },
  ]));
  const stylePaths = [...manifest.values()]
    .filter((item) => item.mediaType === 'text/css' && item.href)
    .map((item) => item.href);
  const chapters = [...opfDocument.querySelectorAll('spine > itemref')]
    .filter((item) => item.getAttribute('linear') !== 'no')
    .map((item) => {
      const id = item.getAttribute('idref');
      return { id, path: manifest.get(id)?.href };
    })
    .filter((item) => item.path && zip.file(item.path));
  const fallbackChapters = [...manifest.values()]
    .filter((item) => /(?:application\/xhtml\+xml|text\/html)/iu.test(item.mediaType) && item.href && zip.file(item.href))
    .map((item) => ({ id: item.href, path: item.href }));
  const title = opfDocument.querySelector('metadata title, metadata dc\\:title')?.textContent?.trim() || '';
  return { zip, chapters: chapters.length ? chapters : fallbackChapters, stylePaths, title };
}

/**
 * 先移除 EPUB 章节中的相对图片地址，避免章节插入页面后浏览器错误请求站点根路径。
 * @param {Element} body 章节正文节点。
 * @returns {void}
 */
function prepareEpubImagePlaceholders(body) {
  body.querySelectorAll('img, image').forEach((image) => {
    const source = image.getAttribute('src') || image.getAttribute('data-src') || image.getAttribute('href') || image.getAttribute('xlink:href') || '';
    if (!isEpubRelativeAsset(source)) return;
    image.setAttribute('data-epub-src', source);
    image.removeAttribute('src');
    image.removeAttribute('srcset');
    image.removeAttribute('href');
    image.removeAttribute('xlink:href');
    image.setAttribute('loading', 'lazy');
  });
}

/**
 * 将 EPUB 章节中的图片引用替换为同页可访问的临时 URL。
 * @param {Element} body 章节正文节点。
 * @param {object} zip EPUB 压缩包实例。
 * @param {string} chapterPath 当前章节路径。
 * @param {string[]} objectUrls 临时 URL 回收列表。
 * @returns {Promise<void>} 图片资源替换完成。
 */
async function hydrateEpubImages(body, zip, chapterPath, objectUrls) {
  const images = [...body.querySelectorAll('img[data-epub-src], image[data-epub-src]')];
  await Promise.allSettled(images.map(async (image) => {
    const source = image.getAttribute('data-epub-src') || '';
    if (!isEpubRelativeAsset(source)) return;
    const asset = zip.file(resolveEpubArchivePath(chapterPath, source));
    if (!asset) return;
    const blob = await asset.async('blob');
    const objectUrl = URL.createObjectURL(blob);
    objectUrls.push(objectUrl);
    if (image.tagName.toLowerCase() === 'image') image.setAttribute('href', objectUrl);
    else image.setAttribute('src', objectUrl);
    image.removeAttribute('data-epub-src');
  }));
}

/**
 * 将 EPUB 样式表中的相对资源地址改写为当前页面可访问的临时 URL。
 * @param {string} cssText 原始 CSS 文本。
 * @param {object} zip EPUB 压缩包实例。
 * @param {string} stylePath 当前 CSS 文件在压缩包内的路径。
 * @param {string[]} objectUrls 临时 URL 回收列表。
 * @returns {Promise<string>} 已完成相对 URL 改写的 CSS 文本。
 */
async function rewriteEpubCssUrls(cssText, zip, stylePath, objectUrls) {
  const replacements = [];
  const pattern = /url\((['"]?)([^'")]+)\1\)/giu;
  for (const match of cssText.matchAll(pattern)) {
    const source = String(match[2] || '').trim();
    if (!isEpubRelativeAsset(source)) continue;
    const asset = zip.file(resolveEpubArchivePath(stylePath, source));
    if (!asset) {
      replacements.push([match[0], 'url("")']);
      continue;
    }
    const blob = await asset.async('blob');
    const objectUrl = URL.createObjectURL(blob);
    objectUrls.push(objectUrl);
    replacements.push([match[0], `url("${objectUrl}")`]);
  }
  return replacements.reduce((nextCss, [from, to]) => nextCss.split(from).join(to), cssText);
}

/**
 * 在当前滚动容器中渲染一个 EPUB 章节。
 * @param {Record<string, unknown>} readerState 同页 EPUB 阅读器状态。
 * @param {{path:string,id:string}} chapter 章节压缩包路径。
 * @param {number} chapterIndex 章节序号。
 * @returns {Promise<void>} 章节插入完成。
 */
async function renderDirectEpubChapter(readerState, chapter, chapterIndex) {
  if (readerState.renderedChapters.has(chapter.path)) return;
  const archiveFile = readerState.zip.file(chapter.path);
  if (!archiveFile) return;
  const documentFragment = new DOMParser().parseFromString(await archiveFile.async('string'), 'text/html');
  const body = documentFragment.body;
  if (!body) return;
  body.querySelectorAll('script, iframe, object, embed, form').forEach((node) => node.remove());
  // 先插入章节骨架，再异步补图，避免 iPad PWA 因图片解压慢而长时间停在加载态。
  prepareEpubImagePlaceholders(body);
  prepareEpubInternalLinks(body, readerState.chapters, chapter.path);
  const section = document.createElement('article');
  section.className = 'epub-direct-chapter';
  section.dataset.chapterIndex = String(chapterIndex + 1);
  section.innerHTML = body.innerHTML || '<p>本章节没有可显示内容。</p>';
  readerState.content.appendChild(section);
  readerState.renderedChapters.add(chapter.path);
  void hydrateEpubImages(section, readerState.zip, chapter.path, readerState.objectUrls).catch((error) => console.warn('EPUB 图片渲染失败', error));
}

/**
 * 在同页 EPUB 阅读器中打开书内目录链接，并滚动到目标锚点。
 * @param {HTMLElement} linkElement 被点击的 EPUB 内链。
 * @returns {Promise<void>} 目标章节渲染和滚动完成。
 */
async function openDirectEpubLink(linkElement) {
  const readerState = state.fileReader;
  if (readerState?.kind !== 'epub-direct') return;
  const chapterIndex = Number(linkElement.dataset.epubLink);
  const chapter = readerState.chapters[chapterIndex];
  if (!chapter) return;
  await renderDirectEpubChapter(readerState, chapter, chapterIndex);
  const section = readerState.content.querySelector(`[data-chapter-index="${chapterIndex + 1}"]`);
  if (!section) return;
  const rawAnchor = linkElement.dataset.epubAnchor || '';
  const target = rawAnchor
    ? [...section.querySelectorAll('[id], a[name]')].find((element) => element.id === rawAnchor || element.getAttribute('name') === rawAnchor)
    : section;
  // 锚点缺失时仍滚动到章节开头，保证目录点击有明确反馈。
  (target || section).scrollIntoView({ block: 'start' });
}

/**
 * 使用 JSZip 直接在当前页面渲染 EPUB，绕开 iOS PWA 的 iframe 和布局超时。
 * @param {Record<string, unknown>} item 书架中的 EPUB/EQUB 记录。
 * @param {number} token 本次打开动作的令牌。
 * @returns {Promise<boolean>} 是否成功显示至少一个章节。
 */
async function mountDirectEpubReader(item, token) {
  const reader = document.querySelector('[data-epubjs-reader]');
  const viewport = reader?.querySelector('[data-epub-viewport]');
  if (!reader || !viewport) return false;
  try {
    setFileReaderStatus(reader, '正在读取 EPUB 文件…');
    // 首次点击可能早于书架后台预热完成，因此同页解析器必须自行等待 JSZip。
    const [arrayBuffer] = await withReaderTimeout(Promise.all([
      readBookArrayBuffer(item),
      loadScriptOnce('./src/vendor/epubjs/jszip.min.js', 'JSZip'),
    ]), 'EPUB 文件或解压组件读取超时，请检查网络或本地缓存');
    if (token !== state.fileReaderToken || !reader.isConnected) return false;
    const parsed = await withReaderTimeout(parseEpubArchive(arrayBuffer), 'EPUB 压缩包解析超时');
    if (!parsed.chapters.length) throw new Error('EPUB 没有可阅读章节');
    viewport.replaceChildren();
    const content = document.createElement('div');
    content.className = 'epubjs-direct-content';
    content.setAttribute('data-epub-direct-content', 'true');
    viewport.appendChild(content);
    const readerState = {
      kind: 'epub-direct',
      token,
      zip: parsed.zip,
      chapters: parsed.chapters,
      content,
      objectUrls: [],
      renderedChapters: new Set(),
    };
    state.fileReader = readerState;
    for (const stylePath of parsed.stylePaths) {
      const styleFile = parsed.zip.file(stylePath);
      if (!styleFile) continue;
      const style = document.createElement('style');
      // EPUB 内部 CSS 常使用相对图片或字体路径，必须改写后再插入页面，避免请求站点根路径。
      style.textContent = await rewriteEpubCssUrls(await styleFile.async('string'), parsed.zip, stylePath, readerState.objectUrls);
      content.appendChild(style);
    }
    await renderDirectEpubChapter(readerState, parsed.chapters[0], 0);
    if (token !== state.fileReaderToken || !reader.isConnected) return false;
    setFileReaderStatus(reader, `EPUB 已打开，共 ${parsed.chapters.length} 章`);
    for (let index = 1; index < parsed.chapters.length; index += 1) {
      if (token !== state.fileReaderToken || !reader.isConnected) return true;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await renderDirectEpubChapter(readerState, parsed.chapters[index], index);
    }
    return true;
  } catch (error) {
    if (token === state.fileReaderToken && reader.isConnected) {
      setFileReaderStatus(reader, `EPUB 同页阅读失败：${error?.message || '未知错误'}`);
      console.warn('EPUB 同页解析失败', error);
    }
    return false;
  }
}

/**
 * 使用 Mozilla PDF.js 在当前页面内渲染 PDF，并渐进式生成可滚动页面。
 * @param {Record<string, unknown>} item 书架中的 PDF 书籍记录。
 * @param {number} token 本次打开动作的令牌。
 * @returns {Promise<void>} PDF 首屏和后续页面渲染完成或显示错误。
 */
async function mountPdfJsReader(item, token) {
  const reader = document.querySelector('[data-pdf-reader]');
  const viewportElement = reader?.querySelector('[data-pdf-viewport]');
  if (!reader || !viewportElement) return;
  try {
    setFileReaderStatus(reader, '正在加载 PDF 阅读器…');
    const pdfjsLib = await withReaderTimeout(loadPdfJsLib(), 'PDF 阅读器加载超时，请检查网络后重试');
    setFileReaderStatus(reader, canReaderRequestUrl(item) ? '正在连接 PDF…' : '正在读取 PDF…');
    if (token !== state.fileReaderToken) return;
    const source = item.sourceBlob instanceof Blob || isBookCacheStorageRecord(item)
      ? { data: new Uint8Array(await readBookArrayBuffer(item)) }
      : canReaderRequestUrl(item)
      ? { url: String(item.sourceUrl).trim() }
      : { data: new Uint8Array(await readBookArrayBuffer(item)) };
    const loadingTask = pdfjsLib.getDocument({ ...source, ...PDF_JS_OPTIONS, disableStream: false, disableAutoFetch: false });
    const pdf = await withReaderTimeout(loadingTask.promise, 'PDF 连接超时，请检查网络后重试');
    if (token !== state.fileReaderToken || !reader.isConnected) {
      await loadingTask.destroy();
      return;
    }
    const readerState = { kind: 'pdf', token, loadingTask, pdf, currentPage: 1, renderRun: 0 };
    state.fileReader = readerState;
    setFileReaderStatus(reader, `共 ${pdf.numPages} 页`);
    reader.querySelectorAll('[data-pdf-page], [data-reader-zoom]').forEach((button) => { button.disabled = false; });
    // 先渲染第一页，让 iPad 首屏尽快出现，再顺序渲染其余页面。
    await renderPdfPage(readerState, 1, readerState.renderRun);
    updatePdfReaderControls(readerState);
    for (let pageNumber = 2; pageNumber <= pdf.numPages; pageNumber += 1) {
      if (token !== state.fileReaderToken) return;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await renderPdfPage(readerState, pageNumber, readerState.renderRun);
    }
    setFileReaderStatus(reader, `第 1 / ${pdf.numPages} 页`);
  } catch (error) {
    if (token !== state.fileReaderToken || !reader.isConnected) return;
    setFileReaderStatus(reader, `PDF 加载失败：${error?.message || '未知错误'}`);
    showToast('PDF 无法在当前页面打开');
    console.error('PDF.js 阅读失败', error);
  }
}

/**
 * 使用 epub.js 在当前页面内渲染 EPUB/EQUB，并把章节内容放入同一个滚动容器。
 * @param {Record<string, unknown>} item 书架中的 EPUB/EQUB 书籍记录。
 * @param {number} token 本次打开动作的令牌。
 * @returns {Promise<void>} EPUB 首章渲染完成或显示错误。
 */
async function mountEpubJsReader(item, token) {
  const reader = document.querySelector('[data-epubjs-reader]');
  const viewport = reader?.querySelector('[data-epub-viewport]');
  if (!reader || !viewport) return;
  try {
    if (await mountDirectEpubReader(item, token)) return;
    disposeReaderState(state.fileReader);
    state.fileReader = null;
    setFileReaderStatus(reader, '正在加载 EPUB 阅读器…');
    await withReaderTimeout(loadScriptOnce('./src/vendor/epubjs/jszip.min.js', 'JSZip'), 'EPUB 解压组件加载超时');
    const ePub = await withReaderTimeout(loadScriptOnce('./src/vendor/epubjs/epub.min.js', 'ePub'), 'EPUB 阅读器加载超时');
    if (token !== state.fileReaderToken) return;
    const source = item.sourceBlob instanceof Blob || isBookCacheStorageRecord(item)
      ? await readBookArrayBuffer(item)
      : canReaderRequestUrl(item)
      ? String(item.sourceUrl).trim()
      : await withReaderTimeout(readBookArrayBuffer(item), 'EPUB 文件读取超时，请检查网络后重试');
    const book = ePub(source);
    const rendition = book.renderTo(viewport, {
      width: '100%',
      height: Math.max(240, viewport.clientHeight || (globalThis.innerHeight || 800) - 58),
      flow: 'scrolled-doc',
      manager: 'continuous',
      method: 'write',
      spread: 'none',
    });
    const readerState = { kind: 'epub', token, book, rendition };
    state.fileReader = readerState;
    // iOS Safari 中 display() 的完成事件可能晚于 iframe 实际出现，二者任一成功即可进入阅读状态。
    const displayReady = rendition.display().then(() => true).catch(() => new Promise(() => {}));
    const contentReady = waitForEpubContent(viewport).then((ready) => ready ? true : new Promise(() => {}));
    await withReaderTimeout(Promise.race([displayReady, contentReady]), 'EPUB 首章渲染超时，请检查文件或网络');
    if (token !== state.fileReaderToken || !reader.isConnected) return;
    setFileReaderStatus(reader, 'EPUB 已打开，可在当前页面上下滚动阅读');
  } catch (error) {
    if (token !== state.fileReaderToken || !reader.isConnected) return;
    disposeReaderState(state.fileReader);
    state.fileReader = null;
    if (await mountDirectEpubReader(item, token)) return;
    setFileReaderStatus(reader, `EPUB 加载失败：${error?.message || '未知错误'}`);
    showToast('EPUB 无法在当前页面打开');
    console.error('epub.js 阅读失败', error);
  }
}
function tokenHtml(text, language) {
  return tokenizeForReading(text, language).map((token,index)=>`<span class="reading-token" data-token-index="${index}">${escapeHtml(token)}</span>`).join('');
}

function renderTemplates() {
  return getAll('templates').then((templates)=>{ main.innerHTML = `${pageHeader('配置模板','保存、复制、重命名或删除常用生成配置','<button class="primary" data-route="generator">＋ 新建配置</button>')}${templates.length ? `<section class="paper-grid">${templates.sort((a,b)=>b.createdAt-a.createdAt).map((template)=>`<article class="paper-card"><div class="paper-meta"><span class="status status-writing">${escapeHtml(template.subject)}</span><h3>${escapeHtml(template.title)}</h3><p>${escapeHtml(template.description || '可重复使用的生成配置')}</p><div class="card-actions"><button data-use-template="${template.id}">使用</button><button data-copy-template="${template.id}">复制</button><button data-rename-template="${template.id}">改名</button><button data-delete-template="${template.id}">删除</button></div></div></article>`).join('')}</section>` : '<div class="empty-state"><span class="emoji">🧩</span><h2>还没有保存配置</h2><p>在生成试卷页面保存一套常用参数。</p></div>'}`; });
}

async function renderGames() {
  const records = (await getAll('gameRecords')).sort((a,b)=>b.startedAt-a.startedAt).slice(0,8);
  main.innerHTML = `${pageHeader('学习游戏','游戏成绩只保存在当前设备')}
    <section class="entry-grid"><button class="entry-card" data-start-game="hanzi"><span class="emoji">🀄</span><h3>汉字组词消消乐</h3><p>9×9 方格，上下左右连线组成 2～4 字词。</p></button><button class="entry-card" data-start-game="english"><span class="emoji">🧸</span><h3>英语实物配对</h3><p>拖动儿童图卡到对应英文单词区域。</p></button></section>
    <div class="panel" style="margin-top:18px"><h2>最近游戏记录</h2>${records.length ? records.map((record)=>`<p><strong>${record.game === 'hanzi' ? '汉字消消乐':'英语配对'}</strong>　${new Date(record.startedAt).toLocaleString('zh-CN')}　用时 ${Math.round(record.duration/1000)} 秒　错误 ${record.errors} 次</p>`).join('') : '<p style="color:var(--muted)">完成一局后会显示开始时间、完成时间、用时和错误次数。</p>'}</div>`;
}

const KNOWLEDGE_LABELS = Object.freeze({
  idiom: '成语库',
  char: '汉字库',
  xiehouyu: '歇后语',
  word: '词语库',
  poetry: '古诗库',
});

/**
 * 渲染知识库、随机学习和错题库页面。
 * @returns {Promise<void>} 页面数据读取和 HTML 更新完成后的 Promise。
 */
async function renderKnowledge() {
  if (!state.knowledgePreferences || !Object.keys(state.knowledgePreferences).length) {
    state.knowledgePreferences = await loadKnowledgePreferences();
  }
  const poetryMeta = state.knowledgeType === 'poetry' ? await getPoetryMeta({ collection: state.knowledgeCollection }) : { authors: [], dynasties: [] };
  const page = state.knowledgeHasQueried
    ? await pageKnowledge(state.knowledgeType, currentKnowledgeFilters(), state.knowledgePage, 20)
    : { items: [], total: 0, page: 1, pageSize: 20, pageCount: 1 };
  state.knowledgePage = page.page;
  const authors = poetryMeta.authors || [];
  const dynasties = poetryMeta.dynasties || [];
  const collections = poetryMeta.collections || [];
  const wrongQuestions = (await getAll('wrongQuestions')).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const wrongTypes = [...new Set(wrongQuestions.map((item) => item.type).filter(Boolean))];
  const filteredWrong = state.wrongType === 'all' ? wrongQuestions : wrongQuestions.filter((item) => item.type === state.wrongType);
  const currentLearning = state.learningItems[state.learningIndex];
  const learningPanel = currentLearning
    ? `<section class="panel learning-card"><div class="knowledge-learning-kicker">随机学习 · ${escapeHtml(KNOWLEDGE_LABELS[state.knowledgeType])}</div>${renderKnowledgeSummary(state.knowledgeType, currentLearning)}<div class="header-actions"><button class="primary" data-learning-result="correct">学会了</button><button class="secondary" data-learning-result="wrong">标记为未掌握</button></div><small>第 ${state.learningIndex + 1}/${state.learningItems.length} 项</small></section>`
    : `<section class="panel learning-card"><div class="knowledge-learning-kicker">随机学习</div><h2>从${escapeHtml(KNOWLEDGE_LABELS[state.knowledgeType])}开始</h2><p>已学会的内容不会在本轮重复出现，未掌握内容会进入错题库。</p><button class="primary" data-learning-start>开始随机学习</button></section>`;
  const wrongPanel = filteredWrong.length
    ? `<section class="panel knowledge-wrong-panel"><div class="section-heading"><div><h2>错题库</h2><p>当前 ${filteredWrong.length} 条 / 全部 ${wrongQuestions.length} 条，可按类型复习或删除。</p></div>${renderWrongTypeFilter(wrongTypes)}</div><div class="knowledge-list">${filteredWrong.map((item) => `<article class="knowledge-item"><button class="knowledge-main">${renderWrongQuestionSummary(item)}</button><button class="secondary" data-delete-wrong="${escapeHtml(item.id)}">删除</button></article>`).join('')}</div></section>`
    : `<section class="panel knowledge-wrong-panel"><div class="section-heading"><div><h2>错题库</h2><p>${wrongQuestions.length ? '当前类型没有错题。' : '暂时没有错题。'}</p></div>${renderWrongTypeFilter(wrongTypes)}</div></section>`;
  main.innerHTML = `${pageHeader('知识库','离线学习成语、汉字、歇后语、词语与古诗','')}
    <section class="knowledge-toolbar panel">
      <div class="segmented knowledge-tabs">${Object.entries(KNOWLEDGE_LABELS).map(([type, label]) => `<label><input type="radio" name="knowledgeType" data-knowledge-type value="${type}" ${state.knowledgeType === type ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div>
      <div class="field-row knowledge-filters ${state.knowledgeType === 'poetry' ? 'knowledge-filters-poetry' : 'knowledge-filters-basic'}"><input data-knowledge-filter="query" value="${escapeHtml(state.knowledgeQuery)}" placeholder="${state.knowledgeType === 'poetry' ? '按作者、字、诗名或诗句筛选' : '按某个或某些字筛选'}">${state.knowledgeType === 'poetry' ? `<select data-knowledge-filter="collection"><option value="">全部类型</option>${collections.map((collection) => `<option value="${escapeHtml(collection)}" ${state.knowledgeCollection === collection ? 'selected' : ''}>${escapeHtml(collection)}</option>`).join('')}</select><select data-knowledge-filter="author"><option value="">全部作者</option>${authors.map((author) => `<option value="${escapeHtml(author)}" ${state.knowledgeAuthor === author ? 'selected' : ''}>${escapeHtml(author)}</option>`).join('')}</select><select data-knowledge-filter="dynasty"><option value="">全部朝代</option>${dynasties.map((dynasty) => `<option value="${escapeHtml(dynasty)}" ${state.knowledgeDynasty === dynasty ? 'selected' : ''}>${escapeHtml(dynasty)}</option>`).join('')}</select>` : ''}<button class="primary knowledge-search-button" data-knowledge-search>查询</button></div>
    </section>
    ${learningPanel}
    <section class="panel knowledge-list-panel"><div class="section-heading"><div><h2>${escapeHtml(KNOWLEDGE_LABELS[state.knowledgeType])}</h2><p>${state.knowledgeHasQueried ? `当前筛选 ${page.total} 条，第 ${page.page}/${page.pageCount} 页` : '请输入筛选条件后点击查询，列表会分页展示。'}</p></div><div class="header-actions"><button class="secondary" data-knowledge-page="${page.page - 1}" ${!state.knowledgeHasQueried || page.page <= 1 ? 'disabled' : ''}>上一页</button><button class="secondary" data-knowledge-page="${page.page + 1}" ${!state.knowledgeHasQueried || page.page >= page.pageCount ? 'disabled' : ''}>下一页</button></div></div><div class="knowledge-list">${state.knowledgeHasQueried ? page.items.map((item) => renderKnowledgeItem(state.knowledgeType, item)).join('') : '<div class="empty-state compact"><span class="emoji">⌕</span><h2>等待查询</h2><p>默认不加载全量知识库，避免 iPad/PWA 首屏变慢。</p></div>'}</div></section>
    ${wrongPanel}`;
}

/**
 * 渲染错题库类型筛选按钮。
 * @param {string[]} types 当前错题库里存在的类型。
 * @returns {string} 类型筛选按钮 HTML。
 */
function renderWrongTypeFilter(types) {
  const options = [['all', '全部'], ...types.map((type) => [type, KNOWLEDGE_LABELS[type] || type])];
  return `<div class="segmented wrong-tabs">${options.map(([type, label]) => `<label><input type="radio" name="wrongType" data-wrong-type value="${escapeHtml(type)}" ${state.wrongType === type ? 'checked' : ''}><span>${escapeHtml(label)}</span></label>`).join('')}</div>`;
}

/**
 * 渲染知识条目的摘要标题和说明。
 * @param {string} type 知识库分类。
 * @param {Record<string, unknown>} item 知识条目。
 * @returns {string} 摘要 HTML。
 */
function renderKnowledgeSummary(type, item) {
  if (type === 'poetry') return `<h3>${escapeHtml(item.title || '')}</h3><p>${escapeHtml(item.collection || '古诗')} · ${escapeHtml(item.dynasty || '')} · ${escapeHtml(item.author || '')}</p><p class="knowledge-lines">${(item.lines || []).slice(0, 4).map((line) => escapeHtml(line)).join('　')}</p>`;
  if (type === 'xiehouyu') return `<h3>${escapeHtml(item.riddle || '')} —— ${escapeHtml(item.answer || '')}</h3><p>${escapeHtml(item.explanation || '')}</p>`;
  if (type === 'char') return `<h3>${escapeHtml(item.char || '')}</h3><p>${escapeHtml(item.pinyin || '')}　部首：${escapeHtml(item.radical || '')}　笔画：${escapeHtml(item.strokes || '')}</p><p>${escapeHtml(item.meaning || '')}</p>`;
  return `<h3>${escapeHtml(item.word || '')}</h3><p>${escapeHtml(item.pinyin || '')}</p><p>${escapeHtml(item.meaning || item.explanation || '')}</p>`;
}

/**
 * 渲染单条错题摘要，兼容知识库错题和试卷题目错题。
 * @param {Record<string, unknown>} record 错题库记录。
 * @returns {string} 错题摘要 HTML。
 */
function renderWrongQuestionSummary(record) {
  const item = record.item || {};
  if (['idiom', 'char', 'xiehouyu', 'word', 'poetry'].includes(record.type)) return `<div><span class="status status-review">${escapeHtml(KNOWLEDGE_LABELS[record.type])}</span>${renderKnowledgeSummary(record.type, item)}</div>`;
  return `<div><span class="status status-review">${escapeHtml(record.type || '试卷错题')}</span><h3>${escapeHtml(record.title || item.prompt || '试卷错题')}</h3><p>${escapeHtml(item.prompt || item.expression || item.answer || '')}</p></div>`;
}

/**
 * 渲染单条知识库内容，按类型展示字段。
 * @param {string} type 知识库分类。
 * @param {Record<string, unknown>} item 知识条目。
 * @returns {string} 知识条目 HTML。
 */
function renderKnowledgeItem(type, item) {
  const key = knowledgeKey(type, item);
  const preference = state.knowledgePreferences?.[key] || '';
  const liked = preference === 'like';
  const disliked = preference === 'dislike';
  return `<article class="knowledge-item"><button class="knowledge-main" data-knowledge-detail-type="${escapeHtml(type)}" data-knowledge-detail-key="${escapeHtml(key)}">${renderKnowledgeSummary(type, item)}</button><div class="knowledge-preference-actions"><button class="secondary ${liked ? 'active' : ''}" aria-pressed="${liked ? 'true' : 'false'}" data-knowledge-preference="like" data-knowledge-preference-type="${escapeHtml(type)}" data-knowledge-preference-key="${escapeHtml(key)}">${liked ? '已喜欢' : '喜欢'}</button><button class="secondary ${disliked ? 'active dislike' : ''}" aria-pressed="${disliked ? 'true' : 'false'}" data-knowledge-preference="dislike" data-knowledge-preference-type="${escapeHtml(type)}" data-knowledge-preference-key="${escapeHtml(key)}">${disliked ? '已降低' : '不喜欢'}</button></div></article>`;
}

/**
 * 渲染知识库条目的详情弹窗。
 * @param {string} type 知识库分类。
 * @param {Record<string, unknown>} item 知识条目。
 * @returns {void}
 */
function openKnowledgeDetail(type, item) {
  const title = item.word || item.char || item.title || item.riddle || '详情';
  const body = type === 'poetry'
    ? `<p>${escapeHtml(item.collection || '古诗')} · ${escapeHtml(item.dynasty || '')} · ${escapeHtml(item.author || '')}</p><div class="knowledge-detail-lines">${(item.lines || []).map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</div>`
    : type === 'char'
    ? `<p>拼音：${escapeHtml(item.pinyin || '')}</p><p>部首：${escapeHtml(item.radical || '')}　笔画：${escapeHtml(item.strokes || '')}</p><p>${escapeHtml(item.meaning || '')}</p>${item.more ? `<pre>${escapeHtml(item.more)}</pre>` : ''}`
    : type === 'xiehouyu'
    ? `<p>答案：${escapeHtml(item.answer || '')}</p><p>${escapeHtml(item.explanation || '')}</p>`
    : `<p>${escapeHtml(item.pinyin || '')}</p><p>${escapeHtml(item.meaning || item.explanation || '')}</p>${item.example ? `<p>例：${escapeHtml(item.example)}</p>` : ''}${item.derivation ? `<p>出处：${escapeHtml(item.derivation)}</p>` : ''}`;
  openModal(`<h2>${escapeHtml(title)}</h2><div class="knowledge-detail">${body}</div><div class="header-actions"><button class="primary" data-close-modal>关闭</button></div>`, 'knowledge-detail-modal');
}

/**
 * 从知识库筛选控件读取当前条件并触发分页查询。
 * @returns {Promise<void>} 查询状态更新和页面刷新完成后的 Promise。
 */
async function submitKnowledgeSearch() {
  document.querySelectorAll('[data-knowledge-filter]').forEach((element) => {
    const field = element.dataset.knowledgeFilter;
    state[`knowledge${field.charAt(0).toUpperCase()}${field.slice(1)}`] = element.value;
  });
  state.knowledgePage = 1;
  state.knowledgeHasQueried = true;
  await renderKnowledge();
}
/**
 * 同步试卷错题到独立错题库。
 * @param {Record<string, unknown>} paper 当前试卷。
 * @param {string} problemId 题目标识。
 * @param {boolean} isWrong 是否标记为错题。
 * @returns {Promise<void>} 错题库写入完成后的 Promise。
 */
async function syncPaperWrongQuestion(paper, problemId, isWrong) {
  const problem = paper.problems?.find((item) => item.id === problemId);
  if (!problem) return;
  const id = `paper-wrong:${paper.id}:${problemId}`;
  if (isWrong) {
    await put('wrongQuestions', {
      id,
      type: paper.subject === '语文' ? 'chinese-paper' : paper.subject === '英语' ? 'english-paper' : 'math-paper',
      sourceId: paper.id,
      problemId,
      title: paper.title,
      item: structuredClone(problem),
      createdAt: Date.now(),
    });
    return;
  }
  await remove('wrongQuestions', id);
}

/**
 * 保存随机学习结果并推进学习进度。
 * @param {'correct'|'wrong'} result 用户对当前内容的判断。
 * @returns {Promise<void>} 结果保存和页面刷新完成后的 Promise。
 */
async function handleLearningResult(result) {
  const item = state.learningItems[state.learningIndex];
  if (!item) return;
  const type = state.knowledgeType;
  if (result === 'wrong') {
    await put('wrongQuestions', {
      id: `knowledge-wrong:${knowledgeKey(type, item)}`,
      type,
      sourceId: knowledgeKey(type, item),
      item: structuredClone(item),
      createdAt: Date.now(),
    });
  } else {
    state.learningCompleted.add(knowledgeKey(type, item));
  }
  state.learningIndex += 1;
  if (state.learningIndex >= state.learningItems.length) {
    state.learningItems = [];
    state.learningIndex = 0;
    showToast('本轮随机学习完成');
  }
  await renderKnowledge();
}

async function handleGeneratorSubmit(form) {
  const values = Object.fromEntries(new FormData(form));
  const problems = await createProblemsFromForm(values);
  const templateLabel = TEMPLATE_GROUPS[values.subject].find(([key])=>key === values.template)?.[1] || values.template;
  const title = values.title.trim() || `${values.subject}·${templateLabel}·${problems.length}题`;
  const paper = createPaperSnapshot({ title, subject:values.subject, orientation:values.orientation, config:values, problems });
  await put('papers', paper);
  showToast('试卷已生成并保存');
  navigate('paper', { paperId:paper.id });
}

async function saveTemplateFromForm(form) {
  const values = Object.fromEntries(new FormData(form));
  const label = TEMPLATE_GROUPS[values.subject].find(([key])=>key === values.template)?.[1] || values.template;
  await put('templates', createTemplateSnapshot(values, { title:values.title.trim() || `${values.subject}·${label}` }));
  showToast('配置模板已保存');
}

/**
 * 根据试卷当前错题标记创建并保存重做试卷。
 * @param {Record<string, unknown>} paper 来源试卷快照。
 * @param {'original'|'similar'} mode 原题重做或同类新题模式。
 * @returns {Promise<void>}
 */
async function createWrongRetryPaper(paper, mode) {
  let problems;
  if (mode === 'similar') {
    const count = paper.wrongProblemIds?.length || 0;
    if (paper.subject !== '数学') {
      showToast('自录内容没有随机规则，请使用原题重做');
      return;
    }
    problems = await createProblemsFromForm({ ...paper.config, count: String(count) });
  }
  const retry = createWrongProblemPaper(paper, { mode, problems });
  await put('papers', retry);
  showToast(mode === 'original' ? '已生成原题重做试卷' : '已生成同类新题试卷');
  await navigate('paper', { paperId: retry.id });
}

function speakParagraph(element, item, onEnd) {
  const text = element.dataset.text || element.textContent;
  const tokens = [...element.querySelectorAll('.reading-token')];
  speakWithProgress(text, item.language, (index)=>tokens.forEach((token,i)=>{ token.classList.toggle('spoken', i < index); token.classList.toggle('current', i === index); }), onEnd);
}

/**
 * 依次朗读绘本当前页的全部文本框，并同步各文本框高亮。
 * @param {Record<string, unknown>} item 当前绘本资料。
 * @returns {void}
 */
function speakPictureBookPage(item) {
  const boxes = [...document.querySelectorAll('[data-book-text]')];
  let index = 0;
  const next = () => {
    if (index >= boxes.length) return;
    const element = boxes[index++];
    const text = element.textContent;
    const tokens = [...element.querySelectorAll('.reading-token')];
    speakWithProgress(text, item.language, (tokenIndex) => tokens.forEach((token, currentIndex) => {
      token.classList.toggle('spoken', currentIndex < tokenIndex);
      token.classList.toggle('current', currentIndex === tokenIndex);
    }), next);
  };
  next();
}

async function createReadingModal() {
  openModal(`<h2>新建阅读资料</h2><p>选择资料类型后再输入内容。</p><div class="entry-grid reading-create-options"><button class="entry-card" data-new-text-reading><span class="emoji">📄</span><h3>纯文字资料</h3><p>古诗、汉字、拼音、故事或英语阅读。</p></button><button class="entry-card" data-new-picture-book><span class="emoji">📚</span><h3>导入书籍</h3><p>支持图片绘本、PDF、EPUB、EQUB。</p></button></div><div class="header-actions"><button type="button" class="secondary" data-close-modal>取消</button></div>`);
}

/** 打开纯文字阅读资料表单。 */
function createTextReadingModal() {
  openModal(`<h2>新建纯文字资料</h2><form id="readingForm"><div class="field-row"><div class="field"><label>标题</label><input name="title"></div><div class="field"><label>分类</label><input name="category" placeholder="古诗、成语故事、拼音…"></div></div><div class="field"><label>语言</label><select name="language"><option value="zh">中文</option><option value="en">英文</option></select></div><div class="field"><label>正文（每个段落换一行）</label><textarea name="content" required></textarea></div><div class="header-actions"><button type="button" class="secondary" data-close-modal>取消</button><button class="primary">保存</button></div></form>`);
}

/** 打开绘本图片上传表单。 */
function createPictureBookModal() {
  openModal(`<h2>导入书籍</h2><form id="pictureBookForm"><div class="field-row"><div class="field"><label>书名</label><input name="title" placeholder="留空则使用文件名"></div><div class="field"><label>语言</label><select name="language"><option value="zh">中文</option><option value="en">英文</option></select></div></div><div class="field"><label>选择文件</label><input name="pages" type="file" accept="image/*,.pdf,application/pdf,.epub,application/epub+zip,.equb" multiple required><small>多张图片会进入图片绘本编辑器；PDF、EPUB、EQUB 会直接进入书架。</small></div><div class="header-actions"><button type="button" class="secondary" data-close-modal>取消</button><button class="primary">导入</button></div></form>`);
}

/**
 * 将本地文件读取为可保存在 IndexedDB 的 Data URL。
 * @param {File} file 用户选择的文件。
 * @returns {Promise<string>} 文件 Data URL。
 */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/** 渲染当前绘本草稿的页面和文本框编辑器。 */
function renderPictureBookEditorModal() {
  const book = state.pictureBookDraft;
  if (!book) return;
  openModal(`<div class="picture-editor-heading"><div><h2>${escapeHtml(book.title)}</h2><p>拖动文字框调整位置；可添加多段文字。</p></div><label class="secondary file-button">＋ 添加页面<input type="file" accept="image/*" multiple data-add-book-pages></label></div><div class="picture-editor-pages">${book.pages.map((page,index)=>`<article class="picture-editor-page" data-editor-page="${page.id}"><div class="picture-editor-toolbar"><strong>第 ${index + 1} 页</strong><button data-move-book-page="-1" data-page-id="${page.id}" ${index === 0 ? 'disabled':''}>↑</button><button data-move-book-page="1" data-page-id="${page.id}" ${index === book.pages.length - 1 ? 'disabled':''}>↓</button><button data-add-book-text="${page.id}">＋ 文字</button><button class="danger" data-delete-book-page="${page.id}" ${book.pages.length === 1 ? 'disabled':''}>删除页</button></div><div class="picture-editor-canvas"><img src="${page.imageDataUrl}" alt="${escapeHtml(page.fileName || `第${index + 1}页`)}">${(page.textBoxes || []).map((box)=>`<div class="picture-editor-text" data-drag-text-box="${box.id}" data-page-id="${page.id}" style="left:${box.x}%;top:${box.y}%;width:${box.width}%"><span>${escapeHtml(box.text)}</span><div><button data-edit-book-text="${box.id}" data-page-id="${page.id}" aria-label="编辑文字">✎</button><button data-delete-book-text="${box.id}" data-page-id="${page.id}" aria-label="删除文字">×</button></div></div>`).join('')}</div></article>`).join('')}</div><div class="header-actions picture-editor-actions"><button type="button" class="secondary" data-close-modal>取消</button><button class="primary" data-save-picture-book>保存绘本</button></div>`, 'modal-wide');
  bindPictureBookTextDragging();
}

/** 为绘本文本框绑定手指和 Pencil 均可使用的拖动交互。 */
function bindPictureBookTextDragging() {
  modalRoot.querySelectorAll('[data-drag-text-box]').forEach((element) => {
    let start;
    element.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button')) return;
      const canvas = element.closest('.picture-editor-canvas');
      start = { pointerId:event.pointerId, x:event.clientX, y:event.clientY, left:parseFloat(element.style.left), top:parseFloat(element.style.top), canvas };
      element.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    element.addEventListener('pointermove', (event) => {
      if (!start || event.pointerId !== start.pointerId) return;
      const rect = start.canvas.getBoundingClientRect();
      const width = parseFloat(element.style.width);
      element.style.left = `${Math.max(0,Math.min(100-width,start.left+(event.clientX-start.x)/rect.width*100))}%`;
      element.style.top = `${Math.max(0,Math.min(92,start.top+(event.clientY-start.y)/rect.height*100))}%`;
    });
    const finish = (event) => {
      if (!start || event.pointerId !== start.pointerId) return;
      state.pictureBookDraft = updatePictureBookTextBox(state.pictureBookDraft, element.dataset.pageId, element.dataset.dragTextBox, { x:parseFloat(element.style.left), y:parseFloat(element.style.top) });
      start = null;
    };
    element.addEventListener('pointerup', finish);
    element.addEventListener('pointercancel', finish);
    element.addEventListener('lostpointercapture', finish);
  });
}

async function handleGlobalClick(event) {
  const epubLink = event.target.closest('[data-epub-link]');
  if (epubLink) {
    event.preventDefault();
    return openDirectEpubLink(epubLink);
  }
  const route = event.target.closest('[data-route]')?.dataset.route;
  if (route) return navigate(route);
  if (event.target.closest('[data-knowledge-search]')) {
    return submitKnowledgeSearch();
  }
  if (event.target.closest('[data-learning-start]')) {
    const queriedCandidates = state.knowledgeHasQueried ? await filterKnowledgeAsync(state.knowledgeType, currentKnowledgeFilters()) : [];
    state.learningItems = queriedCandidates.length
      ? await sampleKnowledgeForUse(state.knowledgeType, queriedCandidates, 8, state.learningCompleted)
      : await sampleKnowledgeForUse(state.knowledgeType, await randomKnowledgeAsync(state.knowledgeType, 40, state.learningCompleted), 8, state.learningCompleted);
    state.learningIndex = 0;
    if (!state.learningItems.length) {
      state.learningCompleted.clear();
      state.learningItems = await sampleKnowledgeForUse(state.knowledgeType, queriedCandidates.length ? queriedCandidates : await randomKnowledgeAsync(state.knowledgeType, 40), 8);
    }
    return renderKnowledge();
  }
  if (event.target.closest('[data-learning-result]')) {
    return handleLearningResult(event.target.closest('[data-learning-result]').dataset.learningResult);
  }
  const knowledgePageButton = event.target.closest('[data-knowledge-page]');
  if (knowledgePageButton) {
    state.knowledgePage = Number(knowledgePageButton.dataset.knowledgePage) || 1;
    return renderKnowledge();
  }
  const knowledgeDetailButton = event.target.closest('[data-knowledge-detail-key]');
  if (knowledgeDetailButton) {
    const type = knowledgeDetailButton.dataset.knowledgeDetailType;
    const item = await getKnowledgeDetail(type, knowledgeDetailButton.dataset.knowledgeDetailKey);
    if (!item) { showToast('没有找到详情'); return; }
    openKnowledgeDetail(type, item);
    return;
  }
  const knowledgePreferenceButton = event.target.closest('[data-knowledge-preference]');
  if (knowledgePreferenceButton) {
    const type = knowledgePreferenceButton.dataset.knowledgePreferenceType;
    const item = await getKnowledgeDetail(type, knowledgePreferenceButton.dataset.knowledgePreferenceKey);
    if (!item) { showToast('没有找到内容'); return; }
    await saveKnowledgePreference(type, item, knowledgePreferenceButton.dataset.knowledgePreference);
    showToast(state.knowledgePreferences[knowledgeKey(type, item)] ? '偏好已保存' : '偏好已取消');
    return renderKnowledge();
  }
  if (event.target.closest('[data-delete-wrong]')) {
    const id = event.target.closest('[data-delete-wrong]').dataset.deleteWrong;
    await remove('wrongQuestions', id);
    showToast('错题已删除');
    return renderKnowledge();
  }
  const filter = event.target.closest('[data-paper-filter]')?.dataset.paperFilter;
  if (filter) { state.paperFilter = filter; return renderPapers(); }
  const paperId = event.target.closest('[data-open-paper]')?.dataset.openPaper;
  if (paperId) return navigate('paper',{paperId});
  if (event.target.closest('[data-book-select-all]')) {
    const readings = await getAll('readings');
    const ids = readings.filter((item) => item.type === 'file-book' && canReaderRequestUrl(item)).map((item) => item.id);
    if (state.selectedBookIds.size === ids.length) state.selectedBookIds.clear();
    else ids.forEach((id) => state.selectedBookIds.add(id));
    return renderReadingShelf(readings.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)));
  }
  if (event.target.closest('[data-book-batch-download]')) return downloadSelectedBooks();
  if (event.target.closest('[data-book-clear-cache]')) return clearLocalBookCache();
  const readingId = event.target.closest('[data-reading-id]')?.dataset.readingId;
  if (readingId) { state.activeReadingId = readingId; state.bookPage = 0; return renderReading(); }
  if (event.target.closest('[data-exit-reader]')) { state.activeReadingId = null; state.bookPage = 0; return renderReading(); }
  if (event.target.closest('[data-close-modal]')) return closeModal();
  if (event.target.closest('[data-new-reading]')) return createReadingModal();
  if (event.target.closest('[data-new-text-reading]')) return createTextReadingModal();
  if (event.target.closest('[data-new-picture-book]')) return createPictureBookModal();
  if (event.target.closest('[data-copy-paper]')) { await duplicatePaper(event.target.closest('[data-copy-paper]').dataset.copyPaper); showToast('已复制试卷'); return renderPapers(); }
  if (event.target.closest('[data-batch-delete-papers]')) {
    const ids = [...document.querySelectorAll('[data-paper-select]:checked')].map((input) => input.dataset.paperSelect);
    if (!ids.length) { showToast('请先选择要删除的试卷'); return; }
    if (confirm(`确定删除选中的 ${ids.length} 份试卷吗？`)) {
      await Promise.all(ids.map((id) => remove('papers', id)));
      showToast('已批量删除');
      return renderPapers();
    }
    return;
  }
  if (event.target.closest('[data-delete-paper]')) {
    const id = event.target.closest('[data-delete-paper]').dataset.deletePaper;
    if (confirm('确定删除这份试卷吗？') && confirm('请再次确认：删除后无法恢复，是否继续？')) { await remove('papers',id); showToast('试卷已删除'); renderPapers(); }
    return;
  }
  if (event.target.closest('[data-rename-paper]')) {
    const id = event.target.closest('[data-rename-paper]').dataset.renamePaper; const paper = await get('papers',id); const name = prompt('输入新的试卷名称',paper.title);
    if (name?.trim()) { paper.title=name.trim(); paper.updatedAt=Date.now(); await put('papers',paper); renderPapers(); }
    return;
  }
  if (event.target.closest('[data-paper-submit]')) { const paper=await get('papers',state.activePaperId); paper.status=getPaperStatusAfterAction(paper.status,'submit'); paper.submittedAt=Date.now(); paper.updatedAt=Date.now(); await put('papers',paper); showToast('已提交，等待红笔批改'); syncPaperStatusView(paper); return; }
  if (event.target.closest('[data-paper-reviewed]')) { const paper=await get('papers',state.activePaperId); paper.status=getPaperStatusAfterAction(paper.status,'finish-review'); paper.reviewedAt=Date.now(); paper.updatedAt=Date.now(); await put('papers',paper); showToast('批改已保存'); syncPaperStatusView(paper); return; }
  if (event.target.closest('[data-reopen-review]')) { const paper=await get('papers',state.activePaperId); paper.status=getPaperStatusAfterAction(paper.status,'reopen-review'); paper.updatedAt=Date.now(); await put('papers',paper); syncPaperStatusView(paper); return; }
  if (event.target.closest('[data-toggle-wrong]')) {
    const id=event.target.closest('[data-toggle-wrong]').dataset.toggleWrong; const paper=await get('papers',state.activePaperId); const marked=paper.wrongProblemIds?.includes(id);
    await put('papers',setProblemWrong(paper,id,!marked));
    await syncPaperWrongQuestion(paper, id, !marked);
    return renderPaper();
  }
  if (event.target.closest('[data-batch-wrong]')) {
    const paper=await get('papers',state.activePaperId); const input=prompt(`输入错题题号（1～${paper.problems.length}），支持 1、3-5`, '');
    if (input === null) return; try {
      const nextPaper = markWrongProblemsByNumbers(paper,input);
      await put('papers',nextPaper);
      await Promise.all(nextPaper.wrongProblemIds.map((id) => syncPaperWrongQuestion(nextPaper, id, true)));
      return renderPaper();
    } catch(error) { showToast(error.message); return; }
  }
  if (event.target.closest('[data-retry-wrong]')) {
    const paper=await get('papers',state.activePaperId);
    try { return await createWrongRetryPaper(paper,event.target.closest('[data-retry-wrong]').dataset.retryWrong); } catch(error) { showToast(error.message); return; }
  }
  if (event.target.closest('[data-paper-zoom]')) {
    const button = event.target.closest('[data-paper-zoom]');
    const delta = Number(button.dataset.paperZoom || 0) * 0.1;
    const transform = state.paperTransform;
    if (!transform) return;

    // 缩放时以纸张中心附近为基准，减少放大后内容突然跳到左上角的感觉。
    const previousScale = transform.scale;
    const nextScale = Math.max(0.6, Math.min(2.4, previousScale + delta));
    const worksheet = document.querySelector('#activeWorksheet');
    if (worksheet && previousScale !== nextScale) {
      const centerX = worksheet.offsetWidth / 2;
      const centerY = worksheet.offsetHeight / 2;
      transform.x += centerX * (previousScale - nextScale);
      transform.y += centerY * (previousScale - nextScale);
    }
    transform.scale = nextScale;
    transform.panMode = false;
    applyPaperTransform(transform);
    return;
  }
  if (event.target.closest('[data-paper-zoom-reset]')) {
    const transform = state.paperTransform;
    if (!transform) return;
    transform.scale = 1;
    transform.x = 0;
    transform.y = 0;
    transform.panMode = false;
    applyPaperTransform(transform);
    return;
  }
  if (event.target.closest('[data-paper-pan-toggle]')) {
    const transform = state.paperTransform;
    if (!transform) return;
    transform.panMode = !transform.panMode;
    state.drawing?.black?.setErase(false);
    state.drawing?.red?.setErase(false);
    applyPaperTransform(transform);
    return;
  }
  if (event.target.closest('[data-ink-mode]')) {
    const button = event.target.closest('[data-ink-mode]');
    const erase = button.dataset.inkMode === 'eraser';
    state.paperTransform && (state.paperTransform.panMode = false);
    applyPaperTransform(state.paperTransform);
    state.drawing?.[state.drawing.active]?.setErase(erase);
    document.querySelectorAll('[data-ink-mode]').forEach((item) => item.classList.toggle('active', item === button || item.dataset.inkMode === (erase ? 'eraser' : 'pen')));
    return;
  }
  if (event.target.closest('[data-ink-action="undo"]')) return state.drawing?.[state.drawing.active]?.undo();
  if (event.target.closest('[data-print-paper]')) {
    const version=document.querySelector('#printVersion').value; const black=document.querySelectorAll('.ink-layer')[0]; const red=document.querySelectorAll('.ink-layer')[1];
    const previousBlackDisplay=black.style.display; const previousRedDisplay=red.style.display;
    black.style.display=version==='blank'?'none':'block'; red.style.display=version==='final'?'block':'none';
    const restore=()=>{black.style.display=previousBlackDisplay;red.style.display=previousRedDisplay;};
    window.addEventListener('afterprint',restore,{once:true}); window.print(); return;
  }
  if (event.target.closest('[data-speak-all]')) {
    const item=(await getAll('readings')).find((entry)=>entry.id===state.activeReadingId); const paragraphs=[...document.querySelectorAll('[data-paragraph-index]')]; let index=0; const next=()=>{ if(index>=paragraphs.length)return; paragraphs[index].scrollIntoView({behavior:'smooth',block:'center'}); speakParagraph(paragraphs[index++],item,next); }; next(); return;
  }
  if (event.target.closest('[data-stop-speech]')) return stopSpeaking();
  const paragraph=event.target.closest('[data-paragraph-index]'); if(paragraph){const item=(await getAll('readings')).find((entry)=>entry.id===state.activeReadingId); return speakParagraph(paragraph,item);}
  if (event.target.closest('[data-pdf-page]')) {
    const button = event.target.closest('[data-pdf-page]');
    const readerState = state.fileReader;
    if (readerState?.kind !== 'pdf') return;
    const nextPage = Math.max(1, Math.min(readerState.pdf.numPages, readerState.currentPage + Number(button.dataset.pdfPage || 0)));
    readerState.currentPage = nextPage;
    document.querySelector(`[data-pdf-page-number="${nextPage}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    updatePdfReaderControls(readerState);
    return;
  }
  if (event.target.closest('[data-reader-zoom]')) {
    const readerState = state.fileReader;
    if (readerState?.kind !== 'pdf') return;
    state.pdfZoom = Math.max(.75, Math.min(1.5, state.pdfZoom + Number(event.target.closest('[data-reader-zoom]').dataset.readerZoom || 0) * .1));
    await rerenderPdfDocument(readerState);
    return;
  }
  if (event.target.closest('[data-book-prev]')) { state.bookPage=Math.max(0,(state.bookPage||0)-1); return renderReading(); }
  if (event.target.closest('[data-book-next]')) { const item=(await getAll('readings')).find((entry)=>entry.id===state.activeReadingId); state.bookPage=Math.min(item.pages.length-1,(state.bookPage||0)+1); return renderReading(); }
  if (event.target.closest('[data-speak-book]')) { const item=(await getAll('readings')).find((entry)=>entry.id===state.activeReadingId); return speakPictureBookPage(item); }
  if (event.target.closest('[data-edit-book]')) {
    const item=await get('readings',state.activeReadingId); if(!item || item.builtin)return;
    state.pictureBookDraft=structuredClone(item); return renderPictureBookEditorModal();
  }
  if (event.target.closest('[data-move-book-page]')) {
    const button=event.target.closest('[data-move-book-page]'); state.pictureBookDraft=movePictureBookPage(state.pictureBookDraft,button.dataset.pageId,Number(button.dataset.moveBookPage)); return renderPictureBookEditorModal();
  }
  if (event.target.closest('[data-delete-book-page]')) {
    const pageId=event.target.closest('[data-delete-book-page]').dataset.deleteBookPage;
    try { state.pictureBookDraft=removePictureBookPage(state.pictureBookDraft,pageId); return renderPictureBookEditorModal(); } catch(error) { showToast(error.message); return; }
  }
  if (event.target.closest('[data-add-book-text]')) {
    const pageId=event.target.closest('[data-add-book-text]').dataset.addBookText; const text=prompt('输入这段文字');
    if(text === null)return; state.pictureBookDraft=addPictureBookTextBox(state.pictureBookDraft,pageId,text); return renderPictureBookEditorModal();
  }
  if (event.target.closest('[data-edit-book-text]')) {
    const button=event.target.closest('[data-edit-book-text]'); const page=state.pictureBookDraft.pages.find((item)=>item.id===button.dataset.pageId); const box=page?.textBoxes?.find((item)=>item.id===button.dataset.editBookText); const text=prompt('修改文字',box?.text || '');
    if(text === null)return; state.pictureBookDraft=updatePictureBookTextBox(state.pictureBookDraft,button.dataset.pageId,button.dataset.editBookText,{text}); return renderPictureBookEditorModal();
  }
  if (event.target.closest('[data-delete-book-text]')) {
    const button=event.target.closest('[data-delete-book-text]'); state.pictureBookDraft=removePictureBookTextBox(state.pictureBookDraft,button.dataset.pageId,button.dataset.deleteBookText); return renderPictureBookEditorModal();
  }
  if (event.target.closest('[data-save-picture-book]')) {
    const book=state.pictureBookDraft; await put('readings',book); state.pictureBookDraft=null; closeModal(); state.activeReadingId=book.id; state.bookPage=0; showToast('绘本已保存'); return renderReading();
  }
  if (event.target.closest('[data-start-game]')) { const game=event.target.closest('[data-start-game]').dataset.startGame; const module=await import('./games.js'); return game==='hanzi'?module.mountHanziGame(main,{onExit:()=>navigate('games'),showToast}):module.mountEnglishGame(main,{onExit:()=>navigate('games'),showToast}); }
  if (event.target.closest('[data-use-template]')) {
    const template=await get('templates',event.target.closest('[data-use-template]').dataset.useTemplate); if(!template)return;
    state.generatorConfig=structuredClone(template.config); state.generatorSubject=template.config.subject || template.subject || '数学'; state.generatorTemplate=template.config.template || TEMPLATE_GROUPS[state.generatorSubject][0][0]; return navigate('generator');
  }
  if (event.target.closest('[data-copy-template]')) {
    const template=await get('templates',event.target.closest('[data-copy-template]').dataset.copyTemplate); if(!template)return;
    await put('templates',duplicateTemplateSnapshot(template)); showToast('配置模板已复制'); return renderTemplates();
  }
  if (event.target.closest('[data-rename-template]')) {
    const id=event.target.closest('[data-rename-template]').dataset.renameTemplate; const template=await get('templates',id); if(!template)return;
    const name=prompt('输入新的模板名称',template.title); if(name === null)return; try { await put('templates',renameTemplateSnapshot(template,name)); return renderTemplates(); } catch(error) { showToast(error.message); return; }
  }
  if (event.target.closest('[data-delete-template]')) {
    const id=event.target.closest('[data-delete-template]').dataset.deleteTemplate;
    if(confirm('确定要删除这个配置模板吗？') && confirm('请再次确认：删除后无法恢复，是否继续？')){await remove('templates',id);showToast('配置模板已删除');renderTemplates();} return;
  }
}

let paperScrollTimer = null;

/** 按按钮方向移动当前试卷，避免手指直接拖拽导致书写误滚动。 */
function scrollActiveWorksheet(direction) {
  const wrap = document.querySelector('.paper-writing-view .worksheet-wrap, .paper-view .worksheet-wrap');
  if (!wrap) return;
  if (document.body.classList.contains('paper-focus-active') && state.paperTransform) {
    // 全屏作答时外层禁止自然滚动，使用受边界约束的纸张平移保持笔迹坐标一致。
    state.paperTransform.y += paperMoveDelta(direction, 90);
    applyPaperTransform(state.paperTransform);
    return;
  }
  wrap.scrollBy({ top: paperScrollDelta(direction, 90), behavior: 'auto' });
}

function stopPaperScrollTimer() {
  if (paperScrollTimer) clearInterval(paperScrollTimer);
  paperScrollTimer = null;
}

document.addEventListener('pointerdown', (event) => {
  const button = event.target.closest('[data-paper-scroll]');
  if (!button) return;
  event.preventDefault();
  scrollActiveWorksheet(button.dataset.paperScroll);
  stopPaperScrollTimer();
  paperScrollTimer = setInterval(() => scrollActiveWorksheet(button.dataset.paperScroll), 90);
});
['pointerup', 'pointercancel', 'pointerleave', 'visibilitychange'].forEach((eventName) => document.addEventListener(eventName, stopPaperScrollTimer));
document.addEventListener('click', handleGlobalClick);
document.addEventListener('submit', async (event) => {
  if (event.target.id === 'generatorForm') { event.preventDefault(); try { await handleGeneratorSubmit(event.target); } catch(error){ showToast(error.message); } }
  if (event.target.id === 'readingForm') { event.preventDefault(); const reading=createTextReading(Object.fromEntries(new FormData(event.target))); await put('readings',reading); closeModal(); state.activeReadingId=reading.id; renderReading(); }
  if (event.target.id === 'pictureBookForm') {
    event.preventDefault();
    try {
      const formData = new FormData(event.target);
      const values = Object.fromEntries(formData);
      const files = [...event.target.elements.pages.files];
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));
      if (imageFiles.length === files.length) {
        const pages = await Promise.all(files.map(async(file)=>({imageDataUrl:await readFileAsDataUrl(file),fileName:file.name})));
        state.pictureBookDraft = createPictureBookReading(values, pages);
        renderPictureBookEditorModal();
        return;
      }
      if (imageFiles.length) throw new Error('图片页和 PDF/EPUB/EQUB 请分开导入');
      const books = await Promise.all(files.map(async(file) => createFileBookReading(values, { name:file.name, type:file.type, size:file.size, dataUrl:await readFileAsDataUrl(file) })));
      await Promise.all(books.map((book) => put('readings', book)));
      closeModal();
      state.activeReadingId = books[0]?.id || null;
      state.bookPage = 0;
      showToast(`已导入 ${books.length} 本书`);
      return renderReading();
    } catch(error) { showToast(error.message); }
  }
});
document.addEventListener('change', async (event) => {
  if (event.target.matches('[data-knowledge-type]')) {
    state.knowledgeType = event.target.value;
    state.knowledgeQuery = '';
    state.knowledgeAuthor = '';
    state.knowledgeDynasty = '';
    state.knowledgeCollection = '';
    state.knowledgePage = 1;
    state.knowledgeHasQueried = false;
    state.learningItems = [];
    state.learningIndex = 0;
    return renderKnowledge();
  }
  if (event.target.matches('[data-knowledge-filter]')) {
    const field = event.target.dataset.knowledgeFilter;
    state[`knowledge${field.charAt(0).toUpperCase()}${field.slice(1)}`] = event.target.value;
    if (field === 'collection') {
      state.knowledgeAuthor = '';
      state.knowledgeDynasty = '';
    }
    state.knowledgePage = 1;
    state.knowledgeHasQueried = false;
    if (state.knowledgeType === 'poetry' && field === 'collection') return renderKnowledge();
    return;
  }
  if (event.target.matches('[data-wrong-type]')) {
    state.wrongType = event.target.value;
    return renderKnowledge();
  }
  if (event.target.matches('[data-book-select]')) {
    const id = event.target.dataset.bookSelect;
    if (event.target.checked) state.selectedBookIds.add(id);
    else state.selectedBookIds.delete(id);
    const status = document.querySelector('[data-book-cache-status]');
    if (status) status.textContent = `已选择 ${state.selectedBookIds.size} 本绘本`;
    return;
  }
  if (event.target.matches('[data-local-book-picker]')) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const current = await get('readings', state.activeReadingId);
      if (!current) throw new Error('当前绘本记录不存在，请返回书架后重试');
      const imported = createFileBookReading(
        { title: current.title, category: current.category, language: current.language },
        { name: file.name, type: file.type, size: file.size, dataUrl },
        { id: current.id },
      );
      await put('readings', imported);
      showToast('已载入绘本，正在打开');
      return renderReading();
    } catch (error) {
      showToast(error.message || '绘本载入失败');
    }
    return;
  }
  if (event.target.id === 'subjectSelect') { state.generatorConfig=null; state.generatorSubject=event.target.value; state.generatorTemplate=TEMPLATE_GROUPS[event.target.value][0][0]; return renderGenerator(); }
  if (event.target.id === 'templateSelect') { state.generatorConfig=null; state.generatorTemplate=event.target.value; return renderGenerator(); }
  if (event.target.id === 'traceMode') { const mode=event.target.value; document.querySelectorAll('.paragraph-wrap').forEach((wrap)=>{ const p=wrap.querySelector('.reading-paragraph'); p.classList.toggle('trace-text',mode==='overlay'); wrap.querySelector('.trace-extra').innerHTML=mode==='practice'?`<div class="trace-row">${p.innerHTML}</div><div class="practice-row"></div>`:''; }); }
  if (event.target.matches('[data-add-book-pages]')) {
    try {
      const files=[...event.target.files]; const extra=await Promise.all(files.map(async(file)=>({imageDataUrl:await readFileAsDataUrl(file),fileName:file.name})));
      const temporary=createPictureBookReading({title:state.pictureBookDraft.title,language:state.pictureBookDraft.language},extra);
      state.pictureBookDraft={...state.pictureBookDraft,pages:[...state.pictureBookDraft.pages,...temporary.pages],updatedAt:Date.now()}; renderPictureBookEditorModal();
    } catch(error) { showToast(error.message); }
  }
});
document.querySelector('#saveTemplateButton');
document.addEventListener('click',(event)=>{if(event.target.id==='saveTemplateButton')saveTemplateFromForm(document.querySelector('#generatorForm'));});
document.addEventListener('click', async (event) => {
  if (event.target.id !== 'previewWorksheetButton') return;
  const form = document.querySelector('#generatorForm');
  const preview = document.querySelector('#worksheetPreview');
  try {
    preview.innerHTML = await renderGeneratedPreview(readGeneratorValues(form));
  } catch (error) {
    preview.innerHTML = `<div class="empty-state"><span class="emoji">⚠️</span><h2>预览失败</h2><p>${escapeHtml(error.message)}</p></div>`;
  }
});

/**
 * 让右侧主内容区在鼠标滚轮操作时滚动整页。
 * @param {WheelEvent} event 右侧页面收到的滚轮事件。
 * @returns {void}
 */
function handleMainContentWheel(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target?.closest('#mainContent') || target.closest('.preview-panel')) return;
  if (document.body.classList.contains('paper-focus-active')) return;

  const mainScrollTarget = main.scrollHeight > main.clientHeight ? main : document.scrollingElement;
  if (!mainScrollTarget) return;

  // 统一把滚轮增量交给右侧页面，避免光标位于表单留白时滚动被吞掉。
  mainScrollTarget.scrollTop += event.deltaY;
  event.preventDefault();
}
document.addEventListener('wheel', handleMainContentWheel, { passive: false });
document.querySelector('#menuButton').addEventListener('click',()=>document.querySelector('#sidebar').classList.toggle('open'));

/**
 * 首屏完成后再启动非首页必需的后台任务，避免阅读清单和语言脚本阻塞导航点击。
 * @returns {void}
 */
function startPostBootTasks() {
  // 中文拼音工具只在生成语文试卷时需要，后台预热失败不影响首页可用。
  void preloadLanguageTools().catch((error) => console.warn('语言工具后台预热失败', error));
  // huiben 清单可能包含较多本地书籍，延后同步可以让首页和知识库先响应点击。
  void ensureReadingSeeds().catch((error) => console.warn('阅读资料后台同步失败', error));
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js?v=20260812-1').catch(console.warn);
  }
}

async function init() {
  const loading = document.querySelector('#appLoading');
  try {
    installReaderDiagnostics();
    await openDatabase();
    await ensureDefaultTemplates();
    await navigate('home');
    startPostBootTasks();
  } finally {
    loading?.classList.add('is-hidden');
    setTimeout(() => loading?.remove(), 360);
  }
}
init();
