import { getAll, put, get, remove, uid } from './db.js';

export const PAPER_STATUS = {
  unstarted: '未作答', writing: '作答中', review: '待批改', done: '已批改'
};

const PAPER_STATUS_ACTIONS = {
  unstarted: { write: 'writing' },
  writing: { submit: 'review' },
  review: { 'finish-review': 'done' },
  done: { 'reopen-review': 'review' },
};

/**
 * 解析家长输入的题号列表，支持逗号、顿号和连续范围。
 * @param {string|number[]} value 题号文本或题号数组。
 * @param {number} problemCount 试卷题目总数。
 * @returns {number[]} 去重并按升序排列的有效题号。
 */
export function parseProblemNumbers(value, problemCount) {
  if (!Number.isInteger(problemCount) || problemCount < 1) {
    throw new RangeError('题目总数必须是大于 0 的整数');
  }
  if (Array.isArray(value)) {
    const numbers = [...new Set(value.map(Number))].sort((left, right) => left - right);
    if (numbers.some((number) => !Number.isInteger(number) || number < 1 || number > problemCount)) {
      throw new RangeError(`题号必须在 1～${problemCount} 之间`);
    }
    return numbers;
  }

  const text = String(value ?? '').trim();
  if (!text) return [];
  const result = [];
  const parts = text.split(/[，,、\s]+/).filter(Boolean);

  for (const part of parts) {
    const range = part.match(/^(\d+)\s*[-～~]\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start > end) throw new RangeError('连续题号的起始值不能大于结束值');
      for (let number = start; number <= end; number += 1) result.push(number);
      continue;
    }
    if (!/^\d+$/.test(part)) throw new TypeError(`无法识别题号“${part}”`);
    result.push(Number(part));
  }

  const numbers = [...new Set(result)].sort((left, right) => left - right);
  if (numbers.some((number) => number < 1 || number > problemCount)) {
    throw new RangeError(`题号必须在 1～${problemCount} 之间`);
  }
  return numbers;
}

/**
 * 根据操作计算试卷的下一状态，拒绝跳过既定流程。
 * @param {string} currentStatus 当前试卷状态。
 * @param {'write'|'submit'|'finish-review'|'reopen-review'} action 状态操作。
 * @returns {string} 操作后的试卷状态。
 */
export function getPaperStatusAfterAction(currentStatus, action) {
  const nextStatus = PAPER_STATUS_ACTIONS[currentStatus]?.[action];
  if (!nextStatus) throw new Error(`当前状态“${currentStatus}”不能执行“${action}”操作`);
  return nextStatus;
}

/**
 * 标记或取消标记单道错题，并返回不修改原对象的新试卷快照。
 * @param {Record<string, unknown>} paper 原试卷快照。
 * @param {string} problemId 要处理的题目标识。
 * @param {boolean} [isWrong=true] true 表示标错，false 表示取消。
 * @param {number} [now=Date.now()] 更新时间戳。
 * @returns {Record<string, unknown>} 更新错题标记后的试卷快照。
 */
export function setProblemWrong(paper, problemId, isWrong = true, now = Date.now()) {
  if (!paper?.problems?.some((problem) => problem.id === problemId)) {
    throw new Error('题目不存在，无法标记错题');
  }
  const wrongIds = new Set(Array.isArray(paper.wrongProblemIds) ? paper.wrongProblemIds : []);
  if (isWrong) wrongIds.add(problemId);
  else wrongIds.delete(problemId);

  // 始终按原试卷题目顺序保存，保证展示和重做顺序稳定。
  const orderedIds = paper.problems
    .map((problem) => problem.id)
    .filter((id) => wrongIds.has(id));
  return { ...structuredClone(paper), wrongProblemIds: orderedIds, updatedAt: now };
}

/**
 * 按一组一基题号批量追加错题标记。
 * @param {Record<string, unknown>} paper 原试卷快照。
 * @param {string|number[]} problemNumbers 题号文本或题号数组。
 * @param {number} [now=Date.now()] 更新时间戳。
 * @returns {Record<string, unknown>} 批量标记后的试卷快照。
 */
export function markWrongProblemsByNumbers(paper, problemNumbers, now = Date.now()) {
  const numbers = parseProblemNumbers(problemNumbers, paper?.problems?.length || 0);
  const ids = new Set(Array.isArray(paper.wrongProblemIds) ? paper.wrongProblemIds : []);
  numbers.forEach((number) => ids.add(paper.problems[number - 1].id));

  // 批量操作只追加标记，取消单题仍由单题开关完成，避免误清空已有错题。
  return {
    ...structuredClone(paper),
    wrongProblemIds: paper.problems.map((problem) => problem.id).filter((id) => ids.has(id)),
    updatedAt: now,
  };
}

/**
 * 根据已标错题创建“原题重做”或“同类新题”独立试卷快照。
 * @param {Record<string, unknown>} sourcePaper 已批改的来源试卷。
 * @param {{mode:'original'|'similar', problems?:Array, id?:string, now?:number}} options 重做模式、新题列表及稳定元数据。
 * @returns {Record<string, unknown>} 清空作答与批改记录的新试卷。
 */
export function createWrongProblemPaper(sourcePaper, options = {}) {
  const mode = options.mode ?? 'original';
  const wrongIds = new Set(sourcePaper?.wrongProblemIds || []);
  const sourceProblems = sourcePaper?.problems?.filter((problem) => wrongIds.has(problem.id)) || [];
  if (!sourceProblems.length) throw new Error('请先标记至少一道错题');
  if (!['original', 'similar'].includes(mode)) throw new RangeError('错题重做模式无效');

  const selectedProblems = mode === 'original' ? sourceProblems : options.problems;
  if (!Array.isArray(selectedProblems) || selectedProblems.length !== sourceProblems.length) {
    throw new RangeError(`同类新题的题目数量必须为 ${sourceProblems.length}`);
  }

  const now = options.now ?? Date.now();
  const suffix = mode === 'original' ? '错题原题重做' : '错题同类练习';
  const config = structuredClone(sourcePaper.config || {});
  config.count = typeof config.count === 'number' ? selectedProblems.length : String(selectedProblems.length);
  const problems = selectedProblems.map((problem, index) => ({
    ...structuredClone(problem),
    id: `q-${index + 1}`,
    ...(mode === 'original' ? { sourceProblemId: sourceProblems[index].id } : {}),
  }));

  return {
    id: options.id ?? uid('paper'),
    title: `${sourcePaper.title}·${suffix}`,
    subject: sourcePaper.subject,
    orientation: sourcePaper.orientation,
    config,
    problems,
    status: 'unstarted',
    blackStrokes: [],
    redStrokes: [],
    wrongProblemIds: [],
    sourcePaperId: sourcePaper.id,
    retryMode: mode,
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
    reviewedAt: null,
  };
}

/** 将题目与配置固化成不受模板变化影响的试卷快照。 */
export function createPaperSnapshot({ title, subject = '数学', orientation = 'portrait', config, problems }) {
  const now = Date.now();
  return {
    id: uid('paper'), title, subject, orientation, config: structuredClone(config),
    problems: structuredClone(problems), status: 'unstarted', blackStrokes: [], redStrokes: [],
    wrongProblemIds: [], createdAt: now, updatedAt: now, submittedAt: null, reviewedAt: null
  };
}

/** 保存笔迹并依据当前笔色推进试卷状态。 */
export async function savePaperStrokes(paper, layer, strokes) {
  const key = layer === 'red' ? 'redStrokes' : 'blackStrokes';
  paper[key] = strokes;
  paper.updatedAt = Date.now();
  if (layer === 'black' && paper.status === 'unstarted' && strokes.length) {
    paper.status = getPaperStatusAfterAction(paper.status, 'write');
  }
  await put('papers', paper);
  return paper;
}

/** 复制试卷快照并清空全部作答与批改记录。 */
export async function duplicatePaper(id) {
  const source = await get('papers', id);
  if (!source) throw new Error('试卷不存在');
  const copy = { ...structuredClone(source), id: uid('paper'), title: `${source.title}（副本）`, status: 'unstarted', blackStrokes: [], redStrokes: [], wrongProblemIds: [], createdAt: Date.now(), updatedAt: Date.now(), submittedAt: null, reviewedAt: null };
  await put('papers', copy);
  return copy;
}

/** 获取按时间倒序排列的试卷。 */
export async function listPapers() {
  return (await getAll('papers')).sort((a, b) => b.createdAt - a.createdAt);
}

export { put, get, remove };
