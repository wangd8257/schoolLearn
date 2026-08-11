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

const HANZI_PINYIN_MAP = Object.freeze({
  一: 'yi', 二: 'er', 三: 'san', 四: 'si', 五: 'wu', 六: 'liu', 七: 'qi', 八: 'ba', 九: 'jiu', 十: 'shi',
  人: 'ren', 口: 'kou', 日: 'ri', 月: 'yue', 山: 'shan', 水: 'shui', 火: 'huo', 土: 'tu', 木: 'mu', 禾: 'he',
  你: 'ni', 好: 'hao', 无: 'wu', 与: 'yu', 子: 'zi', 鸟: 'niao', 蒙: 'meng', 深: 'shen', 源: 'yuan', 百: 'bai', 黑: 'hei',
  天: 'tian', 地: 'di', 上: 'shang', 下: 'xia', 中: 'zhong', 大: 'da', 小: 'xiao', 多: 'duo', 少: 'shao', 来: 'lai', 去: 'qu',
  学: 'xue', 生: 'sheng', 老: 'lao', 师: 'shi', 爸: 'ba', 妈: 'ma', 哥: 'ge', 姐: 'jie', 弟: 'di', 妹: 'mei',
  春: 'chun', 夏: 'xia', 秋: 'qiu', 冬: 'dong', 风: 'feng', 雨: 'yu', 雪: 'xue', 花: 'hua', 草: 'cao', 虫: 'chong',
});

/**
 * 根据题目元数据返回安全的英语练习字体类名。
 * @param {Record<string, unknown>} problem 当前题目对象。
 * @returns {string} 已白名单校验的字体类名。
 */
function englishFontClass(problem) {
  return ENGLISH_FONT_CLASSES[problem.meta?.font] || ENGLISH_FONT_CLASSES.comic;
}

/**
 * 把数组按固定长度切分，供打印格子按行渲染。
 * @param {unknown[]} values 待切分的数组。
 * @param {number} size 每行最多容纳的元素数量。
 * @returns {unknown[][]} 按顺序切好的二维数组。
 */
function chunkList(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    // 按行切分字符，避免长文本使用一个大容器导致 A4 页面裁切。
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

/**
 * 获取汉字的离线拼音，未知字保留四线三格空行。
 * @param {string} character 单个汉字。
 * @returns {string} 拼音文本，未知时为空字符串。
 */
function getHanziPinyin(character) {
  const cnchar = globalThis.cnchar || globalThis.CnChar;
  if (cnchar?.spell) {
    try {
      const result = cnchar.spell(character, 'low');
      const normalized = Array.isArray(result) ? result.join(' ') : String(result || '');
      if (normalized.trim()) return normalized.trim();
    } catch (error) {
      // cnchar 在不支持的字符上可能抛错，继续使用本地小词典兜底。
    }
  }
  return HANZI_PINYIN_MAP[character] || '';
}

/**
 * 渲染指定数量的米字格单元。
 * @param {string[]} samples 需要展示的淡灰描红字。
 * @param {number} totalCells 本行总格数。
 * @returns {string} 米字格 HTML。
 */
function renderMiziCells(samples, totalCells) {
  const sampleCells = samples.map((character) => `<span class="mizi-cell mizi-sample-cell">${escapeHtml(character)}</span>`).join('');
  const blankCells = Array.from({ length: Math.max(0, totalCells - samples.length) }, () => '<span class="mizi-cell"></span>').join('');
  return `${sampleCells}${blankCells}`;
}

/**
 * 渲染半行拼音四线三格。
 * @param {string[]} characters 当前汉字行。
 * @returns {string} 拼音练习区域 HTML。
 */
function renderPinyinCopybook(characters) {
  const pinyin = characters.map(getHanziPinyin);
  const cells = pinyin.map((value) => `<span class="pinyin-sample">${escapeHtml(value)}</span>`).join('');
  return `<div class="pinyin-copybook" aria-label="拼音四线三格">${cells}</div>`;
}

/** 根据模板识别试卷整体版式。 */
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
    'idiom-fill': 'language-quiz', 'poetry-match': 'language-quiz', 'pinyin-write': 'language-quiz',
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
  if (layout.includes('language-quiz')) return 1;
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
  const columnStyle = `--ten-left-col:${Math.max(2, String(left).length)}ch;--ten-right-col:${Math.max(2, String(right).length)}ch;`;
  const expression = `<div class="ten-expression"><span class="ten-operand ten-left-operand">${escapeHtml(left)}</span><span class="ten-operator">${operator}</span><span class="ten-operand ten-right-operand">${escapeHtml(right)}</span><span class="ten-operator">=</span>${answer}</div>`;
  if (diagramClass === 'make-ten-diagram') {
    return `<div class="problem ten-diagram make-ten-diagram" style="${columnStyle}">${expression}<div class="ten-process make-ten-process"><div class="ten-anchor" data-ten-anchor="left-operand"><span class="ten-anchor-line"></span><span class="ten-target-number">10</span></div><div class="ten-split" data-ten-anchor="right-operand"><div class="ten-slashes"><span>/</span><span>\\</span></div><div class="ten-split-boxes"><span class="answer-box ten-small-box"></span><span class="answer-box ten-small-box"></span></div></div></div></div>`;
  }
  return `<div class="problem ten-diagram break-ten-diagram" style="${columnStyle}">${expression}<div class="ten-process break-ten-process"><div class="ten-split" data-ten-anchor="left-operand"><div class="ten-slashes"><span>/</span><span>\\</span></div><div class="ten-split-boxes"><span class="answer-box ten-small-box"></span><span class="answer-box ten-small-box"></span></div></div><div class="ten-result-tree" data-ten-anchor="right-operand"><span class="ten-result-operator">|</span><span class="ten-result-box-wrap"><span class="answer-box ten-result-box"></span></span></div></div></div>`;
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
  const strokeHint = Array.isArray(problem.strokeSteps) && problem.strokeSteps.length
    ? `<div class="stroke-order-row">${problem.strokeSteps.map((step, index) => `<span>${index + 1}. ${escapeHtml(step)}</span>`).join('')}</div>`
    : '';
  if (isBlankComposition) {
    return `<div class="problem writing-practice hanzi-writing hanzi-blank-writing ${hanziFontClass(problem)}">${strokeHint}<div class="mizi-row">${renderMiziCells([], 12)}</div></div>`;
  }
  const rows = chunkList(source, 12).map((row) => {
    const samples = row.length === 1 ? Array(3).fill(row[0]) : row;
    const miziRow = `<div class="mizi-row hanzi-copy-mizi">${renderMiziCells(samples.slice(0, 12), 12)}</div>`;
    const pinyinRow = renderPinyinCopybook(samples.slice(0, 12));
    return `<div class="hanzi-copy-row">${pinyinRow}${miziRow}</div>`;
  }).join('');
  return `<div class="problem writing-practice hanzi-writing hanzi-copy-writing ${hanziFontClass(problem)}">${strokeHint}${rows}</div>`;
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
  const text = renderEnglishText(problem.prompt || '');
  if (kind === 'english-lines') {
    return `<div class="problem writing-practice english-writing english-blank-writing ${englishFontClass(problem)}"><div class="english-copybook-line" aria-label="空白四线三格"></div></div>`;
  }
  const sampleCount = kind === 'english-word' ? 3 : 1;
  const samples = Array.from({ length: sampleCount }, () => `<span class="english-sample english-ghost">${text}</span>`).join('');
  return `<div class="problem writing-practice english-writing ${kind === 'english-word' ? 'english-word-writing' : 'english-sentence-writing'} ${englishFontClass(problem)}"><div class="english-copybook-line"><div class="english-copy-row">${samples}</div></div></div>`;
}

/**
 * 渲染成语填空题及四个选择项。
 * @param {Record<string, unknown>} problem 成语填空题对象。
 * @param {number} index 题号索引，从 0 开始。
 * @returns {string} 成语填空题 HTML。
 */
function renderIdiomFillProblem(problem, index) {
  const number = `<span class="problem-number">${index + 1}.</span>`;
  const options = Array.isArray(problem.options) ? problem.options : [];
  return `<div class="problem language-quiz idiom-fill-problem"><div class="language-quiz-prompt">${number}${escapeHtml(problem.prompt || '')}</div><div class="language-quiz-options">${options.map((option, optionIndex) => `<span class="language-option">${String.fromCharCode(65 + optionIndex)}. ${escapeHtml(option)}</span>`).join('')}</div></div>`;
}

/**
 * 渲染古诗上下文配对题，保留拖动所需的数据属性。
 * @param {Record<string, unknown>} problem 古诗配对题对象。
 * @param {number} index 题号索引，从 0 开始。
 * @returns {string} 古诗配对题 HTML。
 */
function renderPoetryMatchProblem(problem, index) {
  const number = `<span class="problem-number">${index + 1}.</span>`;
  return `<div class="problem language-quiz poetry-match-problem"><div class="poetry-fill-prompt">${number}${escapeHtml(problem.title || '')} · ${escapeHtml(problem.prompt || '请填写对应诗句')}</div><div class="poetry-slot single-poetry-slot"><span class="answer-box poetry-answer-box"></span></div></div>`;
}

/**
 * 渲染看拼音写汉字题，拼音在题面显示，汉字仅保留米字格供书写。
 * @param {Record<string, unknown>} problem 看拼音写汉字题对象。
 * @param {number} index 题号索引，从 0 开始。
 * @returns {string} 看拼音写汉字题 HTML。
 */
function renderPinyinWriteProblem(problem, index) {
  const number = `<span class="problem-number">${index + 1}.</span>`;
  const pinyin = String(problem.meta?.pinyin || '').trim();
  const count = Math.max(1, Array.from(String(problem.prompt || '')).length);
  return `<div class="problem language-quiz pinyin-write-problem"><div class="pinyin-write-prompt">${number}<span class="pinyin-write-text">${escapeHtml(pinyin)}</span></div><div class="mizi-row pinyin-write-mizi">${renderMiziCells([], Math.min(12, Math.max(6, count * 2)))}</div></div>`;
}

/**
 * 将英语文本转换为可保持环形 g 字形的描红 HTML。
 * @param {string} value 待渲染的英语文本。
 * @returns {string} 已转义且对小写 g 添加专用字体类的 HTML。
 */
function renderEnglishText(value) {
  return Array.from(String(value)).map((character) => (
    character === 'g'
      ? '<span class="english-loop-g">g</span>'
      : escapeHtml(character)
  )).join('');
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
  if (kind === 'idiom-fill') {
    return renderIdiomFillProblem(problem, index);
  }
  if (kind === 'poetry-match') {
    return renderPoetryMatchProblem(problem, index);
  }
  if (kind === 'pinyin-write') {
    return renderPinyinWriteProblem(problem, index);
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
