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

/** 根据模板识别试卷整体版式。 */
export function worksheetLayoutClass(paper = {}) {
  const template = paper.config?.template || paper.problems?.[0]?.kind || paper.problems?.[0]?.type || 'horizontal';
  const normalized = {
    missing: 'horizontal', compare: 'horizontal', 'chain-add': 'chain-add', 'chain-sub': 'chain-sub',
    mixed: 'mixed', 'make-ten': 'make-ten', 'break-ten': 'break-ten', vertical: 'vertical',
    'carry-add': 'horizontal', 'borrow-sub': 'horizontal', multiply: 'multiply', divide: 'divide',
    currency: 'currency', unit: 'unit', 'hanzi-trace': 'hanzi-practice', 'hanzi-stroke': 'hanzi-practice', composition: 'hanzi-practice',
    control: 'hanzi-practice', 'pinyin-trace': 'english-practice', 'english-word': 'english-practice',
    'english-sentence': 'english-practice', 'english-lines': 'english-practice',
  }[template] || template;
  return `worksheet-layout-${normalized}`;
}

/** 根据版式给题目网格设置默认列数。 */
export function worksheetColumns(paper = {}) {
  const layout = worksheetLayoutClass(paper);
  if (layout.includes('make-ten') || layout.includes('break-ten') || layout.includes('vertical')) return 3;
  if (layout.includes('equation') || layout.includes('word-problem')) return 2;
  if (layout.includes('multiply') || layout.includes('divide')) return 5;
  if (layout.includes('currency') || layout.includes('unit')) return 2;
  if (layout.includes('hanzi-practice') || layout.includes('english-practice')) return 1;
  return paper.orientation === 'landscape' ? 5 : 4;
}

/** 按图片样式渲染姓名、日期、用时填写线。 */
export function renderWorksheetMetaHtml(paper = {}) {
  const layout = worksheetLayoutClass(paper);
  if (layout.includes('chain-add') || layout.includes('chain-sub') || layout.includes('mixed') || layout.includes('unit') || layout.includes('currency')) {
    return '';
  }
  return '<div class="worksheet-meta-line"><span>姓名 <i></i></span><span>日期 <i></i></span><span>用时 <i></i></span></div>';
}

/** 渲染凑十法过程图，保留两个拆分数字供孩子填写。 */
function renderMakeTenDiagram(problem) {
  const [left = '', right = ''] = problem.operands || [];
  return `<div class="problem ten-diagram make-ten-diagram"><div class="ten-formula"><span>${escapeHtml(left)}</span><span>+</span><span class="ten-target-number">${escapeHtml(right)}</span><span>=</span><span class="answer-box ten-answer-box"></span></div><div class="ten-tree"><div class="ten-branch-line ten-left-branch">/</div><div class="ten-branch-line ten-right-branch">\\</div><span class="answer-box ten-small-box ten-split-left"></span><span class="answer-box ten-small-box ten-split-right"></span></div></div>`;
}

/** 渲染破十法过程图，左侧拆成 10 与余数，右侧继续相减。 */
function renderBreakTenDiagram(problem) {
  const [left = '', right = ''] = problem.operands || [];
  return `<div class="problem ten-diagram break-ten-diagram"><div class="ten-formula"><span>${escapeHtml(left)}</span><span>-</span><span class="ten-target-number">${escapeHtml(right)}</span><span>=</span><span class="answer-box ten-answer-box"></span></div><div class="ten-tree break-ten-tree"><div class="ten-branch-line ten-left-branch">/</div><div class="ten-branch-line ten-right-branch">\\</div><span class="answer-box ten-small-box ten-split-left"></span><span class="answer-box ten-small-box ten-split-right"></span></div></div>`;
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
  const samples = source.length > 1 ? source : Array(3).fill(source[0]);
  const sampleCells = samples.map((character) => `<span class="mizi-cell mizi-sample-cell">${escapeHtml(character)}</span>`).join('');
  const cells = `${sampleCells}${Array.from({ length: Math.max(0, 12 - samples.length) }, () => '<span class="mizi-cell"></span>').join('')}`;
  const strokeHint = Array.isArray(problem.strokeSteps) && problem.strokeSteps.length
    ? `<div class="stroke-order-row">${problem.strokeSteps.map((step, index) => `<span>${index + 1}. ${escapeHtml(step)}</span>`).join('')}</div>`
    : '';
  return `<div class="problem writing-practice hanzi-writing"><div class="practice-label">${escapeHtml(text)}</div>${strokeHint}<div class="mizi-row">${cells}</div></div>`;
}

function renderHanziStrokePractice(problem) {
  const text = String(problem.prompt || '').trim();
  const character = Array.from(text).find((item) => item.trim()) || '';
  const steps = Array.isArray(problem.strokeSteps) ? problem.strokeSteps : [];
  const strokePaths = Array.isArray(problem.strokePaths) ? problem.strokePaths : [];
  const progress = Array.isArray(problem.strokeProgress) && problem.strokeProgress.length
    ? problem.strokeProgress
    : [character];
  const progressCount = Math.min(12, strokePaths.length || progress.length);
  const sampleCells = Array.from({ length: progressCount }, (_, index) => {
    const sample = progress[index] || character;
    const content = strokePaths.length
      ? `<svg class="stroke-progress-svg" viewBox="0 0 100 100" aria-label="${escapeHtml(character)}第${index + 1}笔">${strokePaths.slice(0, index + 1).map((path) => `<path d="${escapeHtml(path)}"></path>`).join('')}</svg>`
      : `<span>${escapeHtml(sample)}</span>`;
    return `<span class="mizi-cell mizi-sample-cell stroke-progress-cell">${content}<i>${index + 1}</i></span>`;
  }).join('');
  const cells = `${sampleCells}${Array.from({ length: Math.max(0, 12 - progressCount) }, () => '<span class="mizi-cell"></span>').join('')}`;
  const strokeHint = steps.length
    ? `<div class="stroke-order-row">${steps.map((step, index) => `<span>${index + 1}. ${escapeHtml(step)}</span>`).join('')}</div>`
    : '';
  return `<div class="problem writing-practice hanzi-writing hanzi-stroke-writing"><div class="practice-label">${escapeHtml(text)}</div>${strokeHint}<div class="mizi-row">${cells}</div></div>`;
}

/** 渲染英文四线三格练习行。 */
function renderEnglishPractice(problem) {
  const text = escapeHtml(problem.prompt || '');
  return `<div class="problem writing-practice english-writing"><div class="english-copybook-line"><span class="english-sample">${text}</span><span class="english-ghost">${text}</span><span class="english-ghost">${text}</span><span class="english-ghost">${text}</span></div></div>`;
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
    return `<div class="problem math-inline">${number}${escapeHtml(problem.prompt || '').replace('○', '<span class="comparison-circle">○</span>')}</div>`;
  }
  if (kind === 'vertical') {
    return renderVerticalCalculation(problem);
  }
  if (kind === 'equation') {
    const boxes = Math.max(1, problem.processBoxes?.length || 1);
    return `<div class="problem equation-calculation">${number}<p>${escapeHtml(problem.prompt || '')}</p><div class="equation-answer-row">${Array.from({ length:boxes }, () => '<span>列式：<span class="answer-box equation-box"></span></span>').join('')}<span>答：<span class="answer-box equation-answer-box"></span></span></div></div>`;
  }
  if (kind === 'word-problem') {
    const steps = Math.max(1, Number(problem.meta?.steps || problem.meta?.stepCount || problem.steps?.length || 1));
    return `<div class="problem word-problem"><p>${number}${escapeHtml(problem.prompt || '')}</p>${Array.from({ length:steps }, (_, step) => `<div class="word-answer-line">第 ${step + 1} 步列式：<span class="answer-box equation-box"></span></div>`).join('')}<div class="word-answer-line">答：<span class="answer-box equation-answer-box"></span></div></div>`;
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
