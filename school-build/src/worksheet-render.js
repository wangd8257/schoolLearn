/** 将用户或生成器文本安全编码为 HTML 文本。 */
function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[character]));
}

/** 将题目中的文字占位符统一转换为唯一可填写空格。 */
function replaceSingleBlank(text) {
  const source = escapeHtml(text || '');
  if (source.includes('□')) return source.replace('□', '<span class="answer-box"></span>').replace(/□/g, '');
  return `${source} <span class="answer-box"></span>`;
}

/** 生成指定数量的答题框。 */
function answerBoxes(count, className = '') {
  return Array.from({ length: count }, () => `<span class="answer-box ${className}"></span>`).join('');
}

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

const HANZI_FONT_CLASSES = Object.freeze({
  kaiti: 'hanzi-font-kaiti',
  songti: 'hanzi-font-songti',
  heiti: 'hanzi-font-heiti',
  fangsong: 'hanzi-font-fangsong',
});

/**
 * 根据题目元数据返回安全的汉字练习字体类名。
 * @param {Record<string, unknown>} problem 当前题目对象。
 * @returns {string} 已白名单校验的字体类名。
 */
function hanziFontClass(problem) {
  return HANZI_FONT_CLASSES[problem.meta?.font] || HANZI_FONT_CLASSES.kaiti;
}

const ENGLISH_FONT_CLASSES = Object.freeze({
  comic: 'english-font-comic',
  print: 'english-font-print',
  serif: 'english-font-serif',
  cursive: 'english-font-cursive',
});

/**
 * 根据题目元数据返回安全的英语练习字体类名。
 * @param {Record<string, unknown>} problem 当前题目对象。
 * @returns {string} 已白名单校验的字体类名。
 */
function englishFontClass(problem) {
  return ENGLISH_FONT_CLASSES[problem.meta?.font] || ENGLISH_FONT_CLASSES.comic;
}/** 根据模板识别试卷整体版式。 */
export function worksheetLayoutClass(paper = {}) {
  const template = paper.config?.template || paper.problems?.[0]?.kind || paper.problems?.[0]?.type || 'horizontal';
  const normalized = {
    missing: 'horizontal', compare: 'horizontal', 'chain-add': 'chain-add', 'chain-sub': 'chain-sub',
    mixed: 'mixed', 'make-ten': 'make-ten', 'break-ten': 'break-ten', vertical: 'vertical',
    'carry-add': 'horizontal', 'borrow-sub': 'horizontal', multiply: 'multiply', divide: 'divide',
    currency: 'currency', unit: 'unit', clock: 'clock', 'clock-reading': 'clock',
    'hanzi-trace': 'hanzi-practice', 'hanzi-stroke': 'hanzi-practice', composition: 'hanzi-practice',
    control: 'hanzi-practice', 'pinyin-trace': 'english-practice', 'english-word': 'english-practice',
    'english-sentence': 'english-practice', 'english-lines': 'english-practice',
  }[template] || template;
  return `worksheet-layout-${normalized}`;
}

/** 根据版式给题目网格设置默认列数。 */
export function worksheetColumns(paper = {}) {
  const layout = worksheetLayoutClass(paper);
  if (layout.includes('make-ten') || layout.includes('break-ten')) return 2;
  if (layout.includes('vertical')) return 3;
  if (layout.includes('equation') || layout.includes('word-problem')) return 1;
  if (layout.includes('multiply') || layout.includes('divide')) return 4;
  if (layout.includes('currency') || layout.includes('unit')) return 2;
  if (layout.includes('clock')) return 2;
  if (layout.includes('hanzi-practice') || layout.includes('english-practice')) return 1;
  return paper.orientation === 'landscape' ? 4 : 3;
}

/** 按图片样式渲染姓名、日期、用时填写线。 */
export function renderWorksheetMetaHtml(paper = {}) {
  return '';
}

/**
 * 渲染凑十法或破十法过程图。
 * @param {Record<string, unknown>} problem 当前题目对象。
 * @param {'+'|'-'} operator 当前运算符。
 * @param {'make-ten-diagram'|'break-ten-diagram'} diagramClass 题型样式类名。
 * @returns {string} 对齐后的过程图 HTML。
 */
function renderTenDiagram(problem, operator, diagramClass) {
  const [left = '', right = ''] = problem.operands || [];
  const answer = `<span class="answer-box ten-answer-box"></span>`;
  const expression = `<div class="ten-expression"><span class="ten-operand ten-left-operand">${escapeHtml(left)}</span><span class="ten-operator">${operator}</span><span class="ten-operand ten-right-operand">${escapeHtml(right)}</span><span class="ten-operator">=</span>${answer}</div>`;
  if (diagramClass === 'make-ten-diagram') {
    return `<div class="problem ten-diagram make-ten-diagram">${expression}<div class="ten-process make-ten-process"><div class="ten-anchor"><span class="ten-anchor-line"></span><span class="ten-target-number">10</span></div><div class="ten-split"><div class="ten-slashes"><span>/</span><span>\\</span></div><div class="ten-split-boxes"><span class="answer-box ten-small-box"></span><span class="answer-box ten-small-box"></span></div></div></div></div>`;
  }
  return `<div class="problem ten-diagram break-ten-diagram">${expression}<div class="ten-process break-ten-process"><div class="ten-split"><div class="ten-slashes"><span>/</span><span>\\</span></div><div class="ten-split-boxes"><span class="answer-box ten-small-box"></span><span class="answer-box ten-small-box"></span></div></div><div class="ten-result-tree"><span class="ten-result-box-wrap"><span class="answer-box ten-result-box"></span></span></div></div></div>`;
}
/** 渲染凑十法过程图，拆分框固定对准第二个数字。 */
function renderMakeTenDiagram(problem) {
  return renderTenDiagram(problem, '+', 'make-ten-diagram');
}

/** 渲染破十法过程图，拆分框固定对准第二个数字。 */
function renderBreakTenDiagram(problem) {
  return renderTenDiagram(problem, '-', 'break-ten-diagram');
}
/** 渲染竖式对齐格：数字右对齐，运算符固定在最左边一格。 */
function renderVerticalCalculation(problem) {
  const [left = '', right = ''] = problem.operands || [];
  const operator = problem.operators?.[0] || '+';
  const digitCount = Math.max(String(left).length, String(right).length, String(problem.answer ?? '').length, 2);
  const cells = (value) => String(value).padStart(digitCount, ' ').split('').map((digit) => `<span class="vertical-digit-cell">${digit === ' ' ? '' : escapeHtml(digit)}</span>`).join('');
  return `<div class="problem vertical-calculation"><div class="vertical-grid" style="--digits:${digitCount}"><span class="vertical-operator-cell"></span>${cells(left)}<span class="vertical-operator-cell">${escapeHtml(operator)}</span>${cells(right)}<span class="vertical-rule"></span><span class="vertical-result-cells">${answerBoxes(digitCount, 'vertical-digit-box')}</span></div></div>`;
}

/** 渲染语文米字格练习行。 */
function renderHanziPractice(problem) {
  const text = String(problem.prompt || '').trim();
  const characters = Array.from(text).filter((character) => character.trim());
  const source = characters.length ? characters : [''];
  const isBlankComposition = (problem.kind || problem.type) === 'composition';
  const samples = isBlankComposition ? [] : (source.length > 1 ? source : Array(3).fill(source[0]));
  const sampleCells = samples.map((character) => `<span class="mizi-cell mizi-sample-cell">${escapeHtml(character)}</span>`).join('');
  const cells = `${sampleCells}${Array.from({ length: Math.max(0, 12 - samples.length) }, () => '<span class="mizi-cell"></span>').join('')}`;
  const strokeHint = Array.isArray(problem.strokeSteps) && problem.strokeSteps.length
    ? `<div class="stroke-order-row">${problem.strokeSteps.map((step, index) => `<span>${index + 1}. ${escapeHtml(step)}</span>`).join('')}</div>`
    : '';
  return `<div class="problem writing-practice hanzi-writing ${hanziFontClass(problem)}">${strokeHint}<div class="mizi-row">${cells}</div></div>`;
}

function renderHanziStrokePractice(problem) {
  const text = String(problem.prompt || '').trim();
  const character = Array.from(text).find((item) => item.trim()) || '';
  const steps = Array.isArray(problem.strokeSteps) ? problem.strokeSteps : [];
  const strokePaths = Array.isArray(problem.strokePaths) ? problem.strokePaths : [];
  const isHanziWriterData = problem.strokeDataSource === 'hanzi-writer-data';
  const progress = Array.isArray(problem.strokeProgress) && problem.strokeProgress.length
    ? problem.strokeProgress
    : [character];
  const referenceCell = `<span class="mizi-cell mizi-sample-cell stroke-progress-cell stroke-reference-cell"><span>${escapeHtml(character)}</span></span>`;
  const pathCells = strokePaths.length
    ? Array.from({ length: strokePaths.length }, (_, index) => {
      const paths = strokePaths.slice(0, index + 1).map((path) => `<path d="${escapeHtml(path)}"></path>`).join('');
      const content = isHanziWriterData
        ? `<g transform="scale(1 -1) translate(0 -900)">${paths}</g>`
        : paths;
      return `<span class="mizi-cell mizi-sample-cell stroke-progress-cell"><svg class="stroke-progress-svg ${isHanziWriterData ? 'hanzi-writer-stroke' : ''}" viewBox="${isHanziWriterData ? '0 0 1024 900' : '0 0 100 100'}" aria-label="${escapeHtml(character)}第${index + 1}笔">${content}</svg></span>`;
    })
    : progress.slice(0, Math.max(1, progress.length - 1)).map((sample) => `<span class="mizi-cell mizi-sample-cell stroke-progress-cell"><span class="stroke-progress-fallback">${escapeHtml(sample)}</span></span>`);
  const cellList = [referenceCell, ...pathCells];
  const rowHtml = [];
  for (let index = 0; index < cellList.length; index += 12) {
    const rowCells = cellList.slice(index, index + 12);
    rowHtml.push(`<div class="mizi-row">${rowCells.join('')}${Array.from({ length: Math.max(0, 12 - rowCells.length) }, () => '<span class="mizi-cell"></span>').join('')}</div>`);
  }
  const strokeHint = steps.length
    ? `<div class="stroke-order-row stroke-order-hidden">${steps.map((step, index) => `<span>${index + 1}. ${escapeHtml(step)}</span>`).join('')}</div>`
    : '';
  return `<div class="problem writing-practice hanzi-writing hanzi-stroke-writing ${hanziFontClass(problem)}">${strokeHint}${rowHtml.join('')}</div>`;
}

/** 渲染英文四线三格练习行。 */
function renderEnglishPractice(problem) {
  const kind = problem.kind || problem.type;
  const text = escapeHtml(problem.prompt || '');
  if (kind === 'english-lines') {
    return `<div class="problem writing-practice english-writing english-blank-writing ${englishFontClass(problem)}"><div class="english-copybook-line" aria-label="空白四线三格"></div></div>`;
  }
  const sampleCount = kind === 'english-word' ? 5 : 1;
  const samples = Array.from({ length: sampleCount }, () => `<span class="english-sample english-ghost">${text}</span>`).join('');
  return `<div class="problem writing-practice english-writing ${kind === 'english-word' ? 'english-word-writing' : 'english-sentence-writing'} ${englishFontClass(problem)}"><div class="english-copybook-line"><div class="english-copy-row">${samples}</div></div></div>`;
}

/**
 * 渲染空白钟面和时间填写框。
 * @param {Record<string, unknown>} problem 当前钟表认知题。
 * @param {number} index 题号索引，从 0 开始。
 * @returns {string} 可打印的钟面题 HTML。
 */
function renderClockProblem(problem, index) {
  const number = `<span class="problem-number">${index + 1}.</span>`;
  const numbers = Array.from({ length: 12 }, (_, numberIndex) => {
    const value = numberIndex + 1;
    const angle = (value * 30 - 90) * Math.PI / 180;
    const x = 80 + Math.cos(angle) * 56;
    const y = 80 + Math.sin(angle) * 56 + 5;
    return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}">${value}</text>`;
  }).join('');
  const ticks = Array.from({ length: 12 }, (_, tickIndex) => {
    const angle = tickIndex * 30 * Math.PI / 180;
    const startX = 80 + Math.cos(angle) * 66;
    const startY = 80 + Math.sin(angle) * 66;
    const endX = 80 + Math.cos(angle) * 72;
    const endY = 80 + Math.sin(angle) * 72;
    return `<line x1="${startX.toFixed(2)}" y1="${startY.toFixed(2)}" x2="${endX.toFixed(2)}" y2="${endY.toFixed(2)}"></line>`;
  }).join('');
  const hour = Number(problem.meta?.hour || 1);
  const minute = Number(problem.meta?.minute || 0);
  const prompt = problem.prompt || '请写出钟面表示的时间';
  const handPoint = (angle, length) => ({
    x: 80 + Math.cos(angle * Math.PI / 180) * length,
    y: 80 + Math.sin(angle * Math.PI / 180) * length,
  });
  const hourPoint = handPoint(((hour % 12) + minute / 60) * 30 - 90, 38);
  const minutePoint = handPoint(minute * 6 - 90, 53);
  const hands = `<line class="clock-hour-hand" x1="80" y1="80" x2="${hourPoint.x.toFixed(2)}" y2="${hourPoint.y.toFixed(2)}"></line><line class="clock-minute-hand" x1="80" y1="80" x2="${minutePoint.x.toFixed(2)}" y2="${minutePoint.y.toFixed(2)}"></line>`;
  return `<div class="problem clock-problem"><div class="clock-heading">${number}${escapeHtml(prompt)}</div><svg class="clock-face-svg" viewBox="0 0 160 160" role="img" aria-label="带时针和分针的钟面">${ticks}<circle cx="80" cy="80" r="70"></circle>${numbers}${hands}<circle class="clock-center" cx="80" cy="80" r="3"></circle></svg><div class="clock-answer-line"><span>时间：</span><span class="answer-box clock-answer-box"></span><span>时</span><span class="answer-box clock-answer-box"></span><span>分</span></div></div>`;
}

/**
 * 渲染单道试卷题目，确保不同题型的空格数量和版式符合配置。
 * @param {Record<string, unknown>} problem 规范化后的题目对象。
 * @param {number} index 题号索引，从 0 开始。
 * @returns {string} 可插入试卷 DOM 的 HTML。
 */
export function renderProblemHtml(problem, index) {
  const number = `<span class="problem-number">${index + 1}.</span>`;
  const kind = problem.kind || problem.type || 'horizontal';
  if (['make-ten', 'break-ten'].includes(kind)) {
    return kind === 'make-ten' ? renderMakeTenDiagram(problem) : renderBreakTenDiagram(problem);
  }
  if (kind === 'compare') {
    return `<div class="problem math-inline">${number}${escapeHtml(problem.prompt || '').replace('○', '<span class="comparison-circle" aria-label="比较符号"></span>')}</div>`;
  }
  if (kind === 'vertical') {
    return renderVerticalCalculation(problem);
  }
  if (kind === 'equation') {
    const boxes = Math.max(1, problem.processBoxes?.length || 1);
    return `<div class="problem equation-calculation"><p>${number}${escapeHtml(problem.prompt || '')}</p>${Array.from({ length:boxes }, (_, step) => `<div class="word-answer-line"><span class="answer-label">${boxes > 1 ? `第 ${step + 1} 步列式：` : '列式：'}</span><span class="answer-box equation-box"></span></div>`).join('')}<div class="word-answer-line"><span class="answer-label">答：</span><span class="answer-box equation-answer-box"></span></div></div>`;
  }
  if (kind === 'word-problem') {
    const steps = Math.max(1, Number(problem.meta?.steps || problem.meta?.stepCount || problem.steps?.length || 1));
    return `<div class="problem word-problem"><p>${number}${escapeHtml(problem.prompt || '')}</p>${Array.from({ length:steps }, (_, step) => `<div class="word-answer-line"><span class="answer-label">第 ${step + 1} 步列式：</span><span class="answer-box equation-box"></span></div>`).join('')}<div class="word-answer-line"><span class="answer-label">答：</span><span class="answer-box equation-answer-box"></span></div></div>`;
  }
  if (kind === 'clock') {
    return renderClockProblem(problem, index);
  }
  if (kind === 'hanzi-stroke') {
    return renderHanziStrokePractice(problem);
  }
  if (['hanzi-trace', 'control', 'composition'].includes(kind)) {
    return renderHanziPractice(problem);
  }
  if (['pinyin-trace', 'english-word', 'english-sentence', 'english-lines'].includes(kind)) {
    return renderEnglishPractice(problem);
  }
  return `<div class="problem math-inline">${number}${replaceSingleBlank(problem.prompt || '')}</div>`;
}
