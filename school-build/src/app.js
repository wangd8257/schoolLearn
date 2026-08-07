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

const state = { route: 'home', paperFilter: 'all', activeReadingId: null, activePaperId: null, pictureBookDraft: null };
const main = document.querySelector('#mainContent');
const toast = document.querySelector('#toast');
const modalRoot = document.querySelector('#modalRoot');

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
  return `<div class="page-header"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="header-actions">${actions}</div></div>`;
}

/** 切换工作区并同步侧栏状态。 */
export async function navigate(route, detail = null) {
  stopSpeaking();
  state.route = route;
  state.activePaperId = detail?.paperId || null;
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.route === route));
  document.querySelector('#sidebar').classList.remove('open');
  main.scrollTop = 0;
  await render();
  main.focus({ preventScroll: true });
}

async function render() {
  const renderers = { home: renderHome, papers: renderPapers, generator: renderGenerator, reading: renderReading, games: renderGames, templates: renderTemplates, paper: renderPaper };
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
    <section class="hero-band"><div><span class="today-date">${today}</span><h2>把每一次练习，变成看得见的成长</h2><p>家长按需要生成试卷，孩子用 Apple Pencil 黑笔作答，提交后再用红笔批改。阅读与游戏也可以随时开始。</p></div></section>
    <section class="metric-grid">
      <div class="metric"><strong>${papers.length}</strong><span>全部试卷</span></div>
      <div class="metric"><strong>${statusCount('review')}</strong><span>待批改</span></div>
      <div class="metric"><strong>${readings.length}</strong><span>阅读资料</span></div>
      <div class="metric"><strong>${records.length}</strong><span>游戏记录</span></div>
    </section>
    <section class="entry-grid">
      <button class="entry-card" data-route="papers"><span class="emoji">📝</span><h3>打开试卷目录</h3><p>按状态和生成时间管理全部试卷。</p></button>
      <button class="entry-card" data-route="generator"><span class="emoji">🪄</span><h3>配置生成试卷</h3><p>数学、拼音、汉字和英语模板自由配置。</p></button>
      <button class="entry-card" data-route="reading"><span class="emoji">📚</span><h3>阅读与跟读</h3><p>按段点读，中文逐字、英文逐词高亮。</p></button>
      <button class="entry-card" data-route="games"><span class="emoji">🎮</span><h3>学习游戏</h3><p>汉字连线消消乐和英语实物配对。</p></button>
    </section>`;
}

function paperStatusClass(status) {
  return { unstarted:'status-unstarted', writing:'status-writing', review:'status-review', done:'status-done' }[status] || '';
}

async function renderPapers() {
  const papers = await listPapers();
  const filtered = state.paperFilter === 'all' ? papers : papers.filter((paper) => paper.status === state.paperFilter);
  const tabs = [['all','全部'], ...Object.entries(PAPER_STATUS)];
  main.innerHTML = `${pageHeader('试卷目录','默认按生成时间倒序排列','<button class="primary" data-route="generator">＋ 生成新试卷</button>')}
    <div class="tabs">${tabs.map(([key,label]) => `<button class="tab ${state.paperFilter === key ? 'active':''}" data-paper-filter="${key}">${label}${key === 'all' ? ` (${papers.length})` : ''}</button>`).join('')}</div>
    ${filtered.length ? `<section class="paper-grid">${filtered.map((paper) => `
      <article class="paper-card">
        <button class="paper-preview" data-open-paper="${paper.id}" aria-label="打开${escapeHtml(paper.title)}"><div class="paper-mini"><i></i><i></i><i></i><i></i><i></i><i></i></div></button>
        <div class="paper-meta"><h3>${escapeHtml(paper.title)}</h3><div class="paper-meta-row"><span class="status ${paperStatusClass(paper.status)}">${PAPER_STATUS[paper.status]}</span><time>${new Date(paper.createdAt).toLocaleString('zh-CN')}</time></div>
        <div class="card-actions"><button data-copy-paper="${paper.id}">复制</button><button data-rename-paper="${paper.id}">改名</button><button data-delete-paper="${paper.id}">删除</button></div></div>
      </article>`).join('')}</section>` : '<div class="empty-state"><span class="emoji">📄</span><h2>这里还没有试卷</h2><p>从配置生成一份练习，试卷会自动保存在这里。</p></div>'}`;
}

const TEMPLATE_GROUPS = {
  数学: [
    ['horizontal','横式计算'],['missing','缺项填数'],['vertical','竖式计算'],['compare','比较大小'],['equation','列式计算'],['word-problem','应用题'],
    ['chain-add','连加'],['chain-sub','连减'],['mixed','连续加减'],['make-ten','凑十法'],['break-ten','破十法'],
    ['carry-add','进位加法'],['borrow-sub','退位减法'],['multiply','乘法'],['divide','除法'],['currency','人民币换算'],['unit','单位换算']
  ],
  语文: [['hanzi-trace','汉字描红'],['hanzi-stroke','按笔画练字'],['pinyin-trace','拼音四线三格'],['control','控笔训练'],['composition','田字格/作文纸']],
  英语: [['english-word','单词描红'],['english-sentence','短句描红'],['english-lines','英语四线三格']]
};

function generatorFields(subject, template) {
  if (subject !== '数学') {
    const strokeFields = template === 'hanzi-stroke'
      ? '<div class="field"><label>按笔画生成字</label><select name="strokePreset"><option value="basic">基础笔画字</option><option value="numbers">数字汉字</option><option value="simple">简单常用字</option></select></div>'
      : '';
    const hanziFontFields = template === 'hanzi-trace'
      ? '<div class="field"><label>描红字体</label><select name="hanziFont"><option value="kaiti">楷体</option><option value="songti">宋体</option><option value="heiti">黑体</option><option value="fangsong">仿宋</option></select></div>'
      : '';
    return `
    <div class="field"><label>练习内容（每行一项）</label><textarea name="customContent" placeholder="一行可输入多个字，例如：你好"></textarea></div>
    ${hanziFontFields}${strokeFields}`;
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
    <div class="panel"><h2>配置生成预览</h2><p>调整左侧配置后点击生成预览，预览不会保存试卷。</p><div id="worksheetPreview">${renderStaticPreview(subject, template)}</div></div></section>`;
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
  const problems = await createProblemsFromForm({ ...values, count: String(Math.min(Number(values.count || 12), 12)) });
  const templateLabel = TEMPLATE_GROUPS[values.subject].find(([key]) => key === values.template)?.[1] || values.template;
  const paper = createPaperSnapshot({
    title: `${values.subject}·${templateLabel}·预览`,
    subject: values.subject,
    orientation: values.orientation || 'portrait',
    config: values,
    problems,
  });
  return `<div class="worksheet-wrap preview-wrap">${renderWorksheetPagesHtml(paper)}</div>`;
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
  if (layout.includes('vertical')) return 6;
  if (layout.includes('make-ten') || layout.includes('break-ten')) return 4;
  if (layout.includes('word-problem')) return 2;
  if (layout.includes('equation')) return 3;
  if (layout.includes('hanzi-practice') || layout.includes('english-practice')) return 4;
  return paper.orientation === 'landscape' ? 16 : 12;
}

/**
 * 将题目切分为多页。
 * @param {Array<Record<string, unknown>>} problems 试卷题目列表。
 * @param {number} size 每页题量。
 * @returns {Array<Array<Record<string, unknown>>>} 分页后的题目。
 */
function paginateProblems(problems, size) {
  const pages = [];
  for (let index = 0; index < problems.length; index += size) {
    pages.push(problems.slice(index, index + size));
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
  const pages = paginateProblems(paper.problems || [], worksheetProblemsPerPage(paper));
  return pages.map((pageProblems, pageIndex) => {
    const offset = pageIndex * worksheetProblemsPerPage(paper);
    const pageTitle = pages.length > 1 ? `${escapeHtml(paper.title)}（第 ${pageIndex + 1}/${pages.length} 页）` : escapeHtml(paper.title);
    return `<article class="worksheet ${paper.orientation} ${layoutClass}"><div class="worksheet-content"><h2 class="worksheet-title">${pageTitle}</h2>${metaLine}<div class="worksheet-lines ${layoutClass}" style="--columns:${columns}">${pageProblems.map((problem, index) => renderProblemHtml(problem, offset + index)).join('')}</div></div></article>`;
  }).join('');
}

function normalizeProblem(problem, index) {
  const typeMap = { 'missing-term':'missing','comparison':'compare','chain-addition':'chain-add','chain-subtraction':'chain-sub','mixed-operations':'mixed','carrying-addition':'carry-add','borrowing-subtraction':'borrow-sub','multiplication':'multiply','division':'divide','unit-conversion':'unit' };
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
    { text:'一', steps:['横'], strokeProgress:['一'] },
    { text:'二', steps:['横', '横'], strokeProgress:['一', '二'] },
    { text:'三', steps:['横', '横', '横'], strokeProgress:['一', '二', '三'] },
    { text:'十', steps:['横', '竖'], strokeProgress:['一', '十'] },
  ],
  numbers: [
    { text:'一', steps:['横'], strokeProgress:['一'] },
    { text:'二', steps:['横', '横'], strokeProgress:['一', '二'] },
    { text:'三', steps:['横', '横', '横'], strokeProgress:['一', '二', '三'] },
    { text:'四', steps:['竖', '横折', '撇', '竖弯', '横'], strokeProgress:['丨', '冂', '儿', '四', '四'] },
    { text:'五', steps:['横', '竖', '横折', '横'], strokeProgress:['一', '十', '五', '五'] },
  ],
  simple: [
    { text:'人', steps:['撇', '捺'], strokeProgress:['丿', '人'] },
    { text:'大', steps:['横', '撇', '捺'], strokeProgress:['一', 'ナ', '大'] },
    { text:'口', steps:['竖', '横折', '横'], strokeProgress:['丨', '冂', '口'] },
    { text:'日', steps:['竖', '横折', '横', '横'], strokeProgress:['丨', '冂', '目', '日'] },
  ],
};

const HANZI_STROKE_LIBRARY = Object.freeze({
  ...Object.fromEntries(Object.values(HANZI_STROKE_PRESETS).flat().map((item) => [item.text, item])),
  你: { text:'你', steps:['撇', '竖', '撇', '横撇', '竖钩', '撇', '点'], strokeProgress:['丿', '亻', '尔', '尔', '你', '你', '你'] },
  好: { text:'好', steps:['撇点', '撇', '横', '横撇', '竖钩', '横'], strokeProgress:['く', '女', '女', '子', '好', '好'] },
  无: { text:'无', steps:['横', '横', '撇', '竖弯钩'], strokeProgress:['一', '二', '尢', '无'] },
  与: { text:'与', steps:['横', '竖折折钩', '横'], strokeProgress:['一', '与', '与'] },
  子: { text:'子', steps:['横撇', '弯钩', '横'], strokeProgress:['了', '了', '子'] },
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
});

/**
 * 根据按笔画预设和用户输入生成汉字练习题。
 * @param {Record<string, unknown>} values 当前生成配置。
 * @param {string[]} lines 用户输入行。
 * @returns {Array<Record<string, unknown>>} 汉字笔画练习题。
 */
function createStrokePracticeProblems(values, lines) {
  const preset = HANZI_STROKE_PRESETS[values.strokePreset] || HANZI_STROKE_PRESETS.basic;
  const source = lines.length
    ? lines.flatMap((text) => Array.from(text).filter((character) => character.trim()).map((character) => (
      HANZI_STROKE_LIBRARY[character] || { text: character, steps: [], strokeProgress: [character] }
    )))
    : preset;
  return source.map((item, index) => ({
    id: `problem-${index + 1}`,
    kind: 'hanzi-stroke',
    prompt: item.text,
    answer: '',
    boxes: 0,
    strokeSteps: item.steps,
    strokeProgress: item.strokeProgress || buildStrokeProgress(item.steps, item.text),
    strokePaths: item.strokePaths,
  }));
}

async function createProblemsFromForm(values) {
  if (values.subject !== '数学') {
    const lines = String(values.customContent || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (values.template === 'hanzi-stroke') return createStrokePracticeProblems(values, lines);
    const meta = values.template === 'hanzi-trace' ? { font: values.hanziFont || 'kaiti' } : {};
    return (lines.length ? lines : ['请在此描写']).map((line,index) => ({ id:`problem-${index+1}`, kind:values.template, prompt:line, answer:'', boxes:0, meta }));
  }
  const module = await import('./math/index.mjs');
  const templateMap = {
    horizontal:'horizontal', missing:'missing-term', vertical:'vertical', compare:'comparison',
    equation:'equation', 'word-problem':'word-problem', 'chain-add':'chain-addition', 'chain-sub':'chain-subtraction',
    mixed:'mixed-operations', 'make-ten':'make-ten', 'break-ten':'break-ten',
    'carry-add':'carrying-addition', 'borrow-sub':'borrowing-subtraction', multiply:'multiplication',
    divide:'division', currency:'currency', unit:'unit-conversion'
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
  const result = module.generateWorksheet(config);
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
    await renderPaper();
  }
}

async function renderPaper() {
  const paper = await get('papers', state.activePaperId);
  if (!paper) return navigate('papers');
  const mode = paper.status === 'review' || paper.status === 'done' ? 'red' : 'black';
  const editable = paper.status !== 'done';
  const wrongIds = new Set(paper.wrongProblemIds || []);
  const wrongTools = ['review', 'done'].includes(paper.status) ? `<section class="panel wrong-book-panel no-print">
    <div><h2>错题标记</h2><p>逐题切换，或输入“1、3-5”批量标记。</p></div>
    <div class="wrong-problem-buttons">${paper.problems.map((problem,index)=>`<button class="${wrongIds.has(problem.id) ? 'active' : ''}" data-toggle-wrong="${problem.id}">${index + 1}</button>`).join('')}</div>
    <div class="header-actions"><button class="secondary" data-batch-wrong>按题号批量标记</button>${wrongIds.size ? '<button class="secondary" data-retry-wrong="original">原题重做</button><button class="primary" data-retry-wrong="similar">生成同类新题</button>' : ''}</div>
  </section>` : '';
  main.innerHTML = `${pageHeader(escapeHtml(paper.title),`${PAPER_STATUS[paper.status]} · ${paper.subject}`,`<button class="secondary" data-route="papers">返回目录</button>`)}
    <div class="paper-toolbar no-print">
      ${editable ? `<button class="toolbar-button active ${mode}" data-ink-mode="pen">${mode === 'red' ? '🔴 红笔批改' : '⚫ 黑笔作答'}</button>
      <button class="toolbar-button" data-ink-mode="eraser">⌫ 擦除当前笔迹</button><button class="toolbar-button" data-ink-action="undo">↶ 撤销</button>` : ''}
      ${paper.status === 'writing' ? '<button class="primary" data-paper-submit>提交作答</button>' : ''}
      ${paper.status === 'review' ? '<button class="primary" data-paper-reviewed>完成批改</button>' : ''}
      ${paper.status === 'done' ? '<button class="secondary" data-reopen-review>修改批改</button>' : ''}
      <select id="printVersion" class="toolbar-button"><option value="blank">打印空白版</option><option value="answer">打印黑笔作答版</option><option value="final">打印红笔最终版</option></select><button class="secondary" data-print-paper>打印</button>
    </div>
    ${wrongTools}
    <div class="worksheet-wrap"><div id="activeWorksheet" class="worksheet-pages">${renderWorksheetPagesHtml(paper)}</div></div>`;
  const worksheet = document.querySelector('#activeWorksheet');
  const blackLayer = createDrawingLayer(worksheet, { color:'#1e252b', enabled:['unstarted','writing'].includes(paper.status), strokes:paper.blackStrokes, onChange:(strokes)=>handlePaperStrokeChange(paper,'black',strokes) });
  const redLayer = createDrawingLayer(worksheet, { color:'#d93636', enabled:paper.status === 'review', strokes:paper.redStrokes, onChange:(strokes)=>handlePaperStrokeChange(paper,'red',strokes) });
  state.drawing = { black: blackLayer, red: redLayer, active: mode };
}

async function renderReading() {
  const readings = (await ensureReadingSeeds()).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const active = readings.find((item)=>item.id === state.activeReadingId) || readings[0];
  state.activeReadingId = active?.id;
  main.innerHTML = `${pageHeader('阅读资料','按段落点读，中文逐字、英文逐词跟随变色','<button class="primary" data-new-reading>＋ 新建阅读资料</button>')}
    <section class="reading-layout"><aside class="panel"><div class="field"><label>资料分类</label><select id="readingCategory"><option>全部</option>${[...new Set(readings.map((item)=>item.category))].map((item)=>`<option>${item}</option>`).join('')}</select></div><div class="reading-list">${readings.map((item)=>`<button class="reading-item ${item.id === active?.id ? 'active':''}" data-reading-id="${item.id}">${escapeHtml(item.title)}<small style="display:block;opacity:.7">${item.category}</small></button>`).join('')}</div></aside><div>${active ? renderReader(active) : '<div class="empty-state">暂无阅读资料</div>'}</div></section>`;
}

function renderReader(item) {
  if (item.type === 'picture-book') {
    const page = item.pages?.[state.bookPage || 0] || item.pages?.[0];
    if (!page) return '<div class="empty-state">绘本暂无页面</div>';
    const background = page.illustration?.palette?.join(',') || '#ffe3b0,#a7d8cf';
    return `<article class="reader"><div class="paper-toolbar"><button class="secondary" data-book-prev>← 上一页</button><strong>${escapeHtml(item.title)} · ${(state.bookPage || 0)+1}/${item.pages.length}</strong><button class="secondary" data-book-next>下一页 →</button><button class="primary" data-speak-book>朗读本页</button>${item.builtin ? '' : '<button class="secondary" data-edit-book>编辑绘本</button>'}</div><div class="picture-page" style="background:linear-gradient(150deg,${background})">${page.imageDataUrl ? `<img src="${page.imageDataUrl}" alt="${escapeHtml(page.fileName || item.title)}">` : '<div class="picture-placeholder"></div>'}${(page.textBoxes || []).map((box)=>`<p class="reading-paragraph picture-reading-box" data-book-text data-text-box-id="${box.id}" style="left:${box.x}%;top:${box.y}%;width:${box.width}%">${tokenHtml(box.text,item.language)}</p>`).join('')}</div></article>`;
  }
  const paragraphs = item.content.split(/\n+/).filter(Boolean);
  return `<article class="reader"><div class="paper-toolbar"><button class="primary" data-speak-all>▶ 连续朗读</button><button class="secondary" data-stop-speech>■ 停止</button><select id="traceMode"><option value="none">普通阅读</option><option value="overlay">覆盖原文描红</option><option value="practice">描红 + 仿写</option></select></div><h2>${escapeHtml(item.title)}</h2>${paragraphs.map((paragraph,index)=>`<div class="paragraph-wrap"><p class="reading-paragraph" data-paragraph-index="${index}" data-text="${escapeHtml(paragraph)}">${tokenHtml(paragraph,item.language)}</p><div class="trace-extra"></div></div>`).join('')}</article>`;
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

async function handleGeneratorSubmit(form) {
  const values = Object.fromEntries(new FormData(form));
  const problems = await createProblemsFromForm(values);
  const templateLabel = TEMPLATE_GROUPS[values.subject].find(([key])=>key === values.template)?.[1] || values.template;
  const title = values.title.trim() || `${values.subject}·${templateLabel}·${problems.length}题·${new Date().toLocaleString('zh-CN',{hour12:false})}`;
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
  openModal(`<h2>新建阅读资料</h2><p>选择资料类型后再输入内容。</p><div class="entry-grid reading-create-options"><button class="entry-card" data-new-text-reading><span class="emoji">📄</span><h3>纯文字资料</h3><p>古诗、汉字、拼音、故事或英语阅读。</p></button><button class="entry-card" data-new-picture-book><span class="emoji">🖼️</span><h3>上传绘本</h3><p>多张图片、多文本框，可拖动文字位置。</p></button></div><div class="header-actions"><button type="button" class="secondary" data-close-modal>取消</button></div>`);
}

/** 打开纯文字阅读资料表单。 */
function createTextReadingModal() {
  openModal(`<h2>新建纯文字资料</h2><form id="readingForm"><div class="field-row"><div class="field"><label>标题</label><input name="title"></div><div class="field"><label>分类</label><input name="category" placeholder="古诗、成语故事、拼音…"></div></div><div class="field"><label>语言</label><select name="language"><option value="zh">中文</option><option value="en">英文</option></select></div><div class="field"><label>正文（每个段落换一行）</label><textarea name="content" required></textarea></div><div class="header-actions"><button type="button" class="secondary" data-close-modal>取消</button><button class="primary">保存</button></div></form>`);
}

/** 打开绘本图片上传表单。 */
function createPictureBookModal() {
  openModal(`<h2>上传绘本图片</h2><form id="pictureBookForm"><div class="field-row"><div class="field"><label>绘本名称</label><input name="title" required></div><div class="field"><label>语言</label><select name="language"><option value="zh">中文</option><option value="en">英文</option></select></div></div><div class="field"><label>选择绘本页面</label><input name="pages" type="file" accept="image/*" multiple required><small>按选择顺序生成页面，进入编辑器后仍可调整。</small></div><div class="header-actions"><button type="button" class="secondary" data-close-modal>取消</button><button class="primary">进入编辑器</button></div></form>`);
}

/**
 * 将本地图片文件读取为可保存在 IndexedDB 的 Data URL。
 * @param {File} file 用户选择的图片文件。
 * @returns {Promise<string>} 图片 Data URL。
 */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('图片读取失败'));
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
  const route = event.target.closest('[data-route]')?.dataset.route;
  if (route) return navigate(route);
  const filter = event.target.closest('[data-paper-filter]')?.dataset.paperFilter;
  if (filter) { state.paperFilter = filter; return renderPapers(); }
  const paperId = event.target.closest('[data-open-paper]')?.dataset.openPaper;
  if (paperId) return navigate('paper',{paperId});
  const readingId = event.target.closest('[data-reading-id]')?.dataset.readingId;
  if (readingId) { state.activeReadingId = readingId; state.bookPage = 0; return renderReading(); }
  if (event.target.closest('[data-close-modal]')) return closeModal();
  if (event.target.closest('[data-new-reading]')) return createReadingModal();
  if (event.target.closest('[data-new-text-reading]')) return createTextReadingModal();
  if (event.target.closest('[data-new-picture-book]')) return createPictureBookModal();
  if (event.target.closest('[data-copy-paper]')) { await duplicatePaper(event.target.closest('[data-copy-paper]').dataset.copyPaper); showToast('已复制试卷'); return renderPapers(); }
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
  if (event.target.closest('[data-paper-submit]')) { const paper=await get('papers',state.activePaperId); paper.status=getPaperStatusAfterAction(paper.status,'submit'); paper.submittedAt=Date.now(); paper.updatedAt=Date.now(); await put('papers',paper); showToast('已提交，等待红笔批改'); return renderPaper(); }
  if (event.target.closest('[data-paper-reviewed]')) { const paper=await get('papers',state.activePaperId); paper.status=getPaperStatusAfterAction(paper.status,'finish-review'); paper.reviewedAt=Date.now(); paper.updatedAt=Date.now(); await put('papers',paper); showToast('批改已保存'); return renderPaper(); }
  if (event.target.closest('[data-reopen-review]')) { const paper=await get('papers',state.activePaperId); paper.status=getPaperStatusAfterAction(paper.status,'reopen-review'); paper.updatedAt=Date.now(); await put('papers',paper); return renderPaper(); }
  if (event.target.closest('[data-toggle-wrong]')) {
    const id=event.target.closest('[data-toggle-wrong]').dataset.toggleWrong; const paper=await get('papers',state.activePaperId); const marked=paper.wrongProblemIds?.includes(id);
    await put('papers',setProblemWrong(paper,id,!marked)); return renderPaper();
  }
  if (event.target.closest('[data-batch-wrong]')) {
    const paper=await get('papers',state.activePaperId); const input=prompt(`输入错题题号（1～${paper.problems.length}），支持 1、3-5`, '');
    if (input === null) return; try { await put('papers',markWrongProblemsByNumbers(paper,input)); return renderPaper(); } catch(error) { showToast(error.message); return; }
  }
  if (event.target.closest('[data-retry-wrong]')) {
    const paper=await get('papers',state.activePaperId);
    try { return await createWrongRetryPaper(paper,event.target.closest('[data-retry-wrong]').dataset.retryWrong); } catch(error) { showToast(error.message); return; }
  }
  if (event.target.closest('[data-ink-mode]')) { const erase=event.target.closest('[data-ink-mode]').dataset.inkMode === 'eraser'; state.drawing?.[state.drawing.active]?.setErase(erase); document.querySelectorAll('[data-ink-mode]').forEach((button)=>button.classList.toggle('active',button.dataset.inkMode === (erase?'eraser':'pen'))); return; }
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

document.addEventListener('click', handleGlobalClick);
document.addEventListener('submit', async (event) => {
  if (event.target.id === 'generatorForm') { event.preventDefault(); try { await handleGeneratorSubmit(event.target); } catch(error){ showToast(error.message); } }
  if (event.target.id === 'readingForm') { event.preventDefault(); const reading=createTextReading(Object.fromEntries(new FormData(event.target))); await put('readings',reading); closeModal(); state.activeReadingId=reading.id; renderReading(); }
  if (event.target.id === 'pictureBookForm') {
    event.preventDefault();
    try {
      const formData=new FormData(event.target); const files=[...event.target.elements.pages.files];
      const pages=await Promise.all(files.map(async(file)=>({imageDataUrl:await readFileAsDataUrl(file),fileName:file.name})));
      state.pictureBookDraft=createPictureBookReading(Object.fromEntries(formData),pages); renderPictureBookEditorModal();
    } catch(error) { showToast(error.message); }
  }
});
document.addEventListener('change', async (event) => {
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
document.querySelector('#menuButton').addEventListener('click',()=>document.querySelector('#sidebar').classList.toggle('open'));

async function init() {
  await openDatabase();
  await ensureDefaultTemplates();
  await ensureReadingSeeds();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(console.warn);
  await navigate('home');
}
init();
