import { TEMPLATE_TYPES } from './constants.mjs';

/**
 * 计算按从左到右顺序执行的加减表达式。
 * @param {number[]} operands 操作数。
 * @param {string[]} operators 运算符。
 * @returns {number[]} 每一步计算结果。
 */
function evaluateAddSubtract(operands, operators) {
  if (operands.length === 0) {
    return [];
  }

  let current = operands[0];
  return operators.map((operator, index) => {
    current = operator === '+' ? current + operands[index + 1] : current - operands[index + 1];
    return current;
  });
}

/**
 * 校验生成题目的结构、数值范围和模板核心约束。
 * @param {Record<string, unknown>} problem 待校验题目。
 * @param {{limit?: number}} [options] 可选的外部数值上限，默认读取题目元数据。
 * @returns {{valid: boolean, errors: string[]}} 校验结果及错误列表。
 */
export function validateProblem(problem, options = {}) {
  const errors = [];
  if (!problem || typeof problem !== 'object') {
    return { valid: false, errors: ['题目必须是对象'] };
  }
  if (!Object.values(TEMPLATE_TYPES).includes(problem.type)) {
    errors.push('模板类型无效');
  }
  if (typeof problem.prompt !== 'string' || problem.prompt.length === 0) {
    errors.push('题干不能为空');
  }
  if (!Array.isArray(problem.operands) || !Array.isArray(problem.intermediateResults)) {
    errors.push('操作数和中间结果必须是数组');
    return { valid: false, errors };
  }

  const limit = options.limit ?? problem.meta?.limit;
  if (!Number.isInteger(limit) || limit < 0) {
    errors.push('缺少有效的数值上限');
  } else {
    const values = [...problem.operands, ...problem.intermediateResults];
    if (typeof problem.answer === 'number') {
      values.push(problem.answer);
    }
    const enforceUpperBound = ![
      TEMPLATE_TYPES.CURRENCY,
      TEMPLATE_TYPES.UNIT_CONVERSION,
      TEMPLATE_TYPES.CLOCK_READING,
    ].includes(problem.type);
    if (values.some((value) => !Number.isFinite(value) || value < 0 || (enforceUpperBound && value > limit))) {
      errors.push('存在超出 0～N 的数值');
    }
  }

  if ([TEMPLATE_TYPES.HORIZONTAL, TEMPLATE_TYPES.MISSING_TERM].includes(problem.type)) {
    if (problem.blankCount !== 1 || (problem.prompt.match(/□/g) ?? []).length !== 1) {
      errors.push('普通横式和缺项题必须恰好有一个空格');
    }
  }

  if ([
    TEMPLATE_TYPES.HORIZONTAL,
    TEMPLATE_TYPES.VERTICAL,
    TEMPLATE_TYPES.EQUATION,
    TEMPLATE_TYPES.CARRYING_ADDITION,
    TEMPLATE_TYPES.BORROWING_SUBTRACTION,
  ].includes(problem.type)) {
    const [left, right] = problem.operands;
    const expected = problem.operators[0] === '+' ? left + right : left - right;
    if (problem.answer !== expected) {
      errors.push('二元运算答案不正确');
    }
  }

  if (problem.type === TEMPLATE_TYPES.MISSING_TERM) {
    const missingIndex = problem.meta?.missingIndex;
    if (![0, 1].includes(missingIndex) || problem.answer !== problem.operands[missingIndex]) {
      errors.push('缺项答案与空格位置不一致');
    }
  }

  if (problem.type === TEMPLATE_TYPES.COMPARISON) {
    const [left, right] = problem.operands;
    const expected = left === right ? '=' : left > right ? '>' : '<';
    if (problem.answer !== expected) {
      errors.push('比较符号不正确');
    }
  }

  if ([
    TEMPLATE_TYPES.CHAIN_ADDITION,
    TEMPLATE_TYPES.CHAIN_SUBTRACTION,
    TEMPLATE_TYPES.MIXED_OPERATIONS,
  ].includes(problem.type)) {
    const results = evaluateAddSubtract(problem.operands, problem.operators);
    if (results.some((value) => value < 0)) {
      errors.push('连续运算出现负数');
    }
    if (results.at(-1) !== problem.answer) {
      errors.push('连续运算答案不正确');
    }
    if (problem.operands.length < 3 || problem.operands.length > 10) {
      errors.push('连续运算项数必须为 3～10');
    }
  }

  if (problem.type === TEMPLATE_TYPES.MAKE_TEN && problem.processBoxes?.[0]?.result % 10 !== 0) {
    errors.push('凑十法过程未先得到整十数');
  }
  if (problem.type === TEMPLATE_TYPES.BREAK_TEN && problem.processBoxes?.[0]?.result !== 10) {
    errors.push('破十法过程未先拆到 10');
  }
  if (problem.type === TEMPLATE_TYPES.CARRYING_ADDITION
    && problem.operands[0] % 10 + problem.operands[1] % 10 < 10) {
    errors.push('进位加法的个位不需要进位');
  }
  if (problem.type === TEMPLATE_TYPES.BORROWING_SUBTRACTION
    && problem.operands[0] % 10 >= problem.operands[1] % 10) {
    errors.push('退位减法的个位不需要退位');
  }

  if (problem.type === TEMPLATE_TYPES.MULTIPLICATION
    && problem.answer !== problem.operands[0] * problem.operands[1]) {
    errors.push('乘法答案不正确');
  }

  if (problem.type === TEMPLATE_TYPES.DIVISION) {
    const [dividend, divisor] = problem.operands;
    if (!Number.isInteger(divisor) || divisor <= 0) {
      errors.push('除数必须大于 0');
    } else if (problem.remainder < 0 || problem.remainder >= divisor) {
      errors.push('余数必须大于或等于 0 且小于除数');
    } else if (dividend !== divisor * problem.answer + problem.remainder) {
      errors.push('除法等式不成立');
    }
  }

  if ([TEMPLATE_TYPES.CURRENCY, TEMPLATE_TYPES.UNIT_CONVERSION].includes(problem.type)) {
    if (problem.answer !== problem.meta?.sourceValue * problem.meta?.factor) {
      errors.push('单位换算结果不正确');
    }
  }

  if (problem.type === TEMPLATE_TYPES.CLOCK_READING) {
    const [hour, minute] = problem.operands;
    const expectedAnswer = `${hour}:${String(minute).padStart(2, '0')}`;
    if (!Number.isInteger(hour) || hour < 1 || hour > 12) {
      errors.push('钟表小时必须是 1～12');
    }
    if (!Number.isInteger(minute) || minute < 0 || minute > 59 || minute % 5 !== 0) {
      errors.push('钟表分钟必须是 0～55 且为 5 的倍数');
    }
    if (problem.answer !== expectedAnswer
      || problem.meta?.hour !== hour
      || problem.meta?.minute !== minute) {
      errors.push('钟表题答案与题面时间不一致');
    }
  }

  if (problem.type === TEMPLATE_TYPES.WORD_PROBLEM) {
    if (!Array.isArray(problem.steps) || problem.steps.length < 1 || problem.steps.length > 3) {
      errors.push('应用题步骤数必须为 1～3');
    } else if (problem.answer !== problem.steps.at(-1).result) {
      errors.push('应用题最终答案与最后一步不一致');
    }
    if (problem.processBoxes?.length !== problem.steps?.length + 1
      || problem.processBoxes?.at(-1)?.kind !== 'final-answer') {
      errors.push('应用题缺少逐步列式框或最终作答框');
    }
  }

  return { valid: errors.length === 0, errors };
}
