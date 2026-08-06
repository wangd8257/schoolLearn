import {
  BINARY_OPERATIONS,
  TEMPLATE_TYPES,
  UNIT_CATEGORIES,
} from './constants.mjs';
import { randomInteger, randomItem } from './random.mjs';

const DEFAULT_LIMIT = 20;
const DEFAULT_MAX_ATTEMPTS = 100;

const CURRENCY_CONVERSIONS = Object.freeze([
  { sourceUnit: '元', targetUnit: '角', factor: 10 },
  { sourceUnit: '角', targetUnit: '分', factor: 10 },
  { sourceUnit: '元', targetUnit: '分', factor: 100 },
]);

const UNIT_CONVERSIONS = Object.freeze({
  [UNIT_CATEGORIES.TIME]: [
    { sourceUnit: '时', targetUnit: '分', factor: 60 },
    { sourceUnit: '分', targetUnit: '秒', factor: 60 },
  ],
  [UNIT_CATEGORIES.LENGTH]: [
    { sourceUnit: '米', targetUnit: '分米', factor: 10 },
    { sourceUnit: '分米', targetUnit: '厘米', factor: 10 },
    { sourceUnit: '米', targetUnit: '厘米', factor: 100 },
    { sourceUnit: '千米', targetUnit: '米', factor: 1000 },
  ],
  [UNIT_CATEGORIES.MASS]: [
    { sourceUnit: '千克', targetUnit: '克', factor: 1000 },
  ],
  [UNIT_CATEGORIES.AREA]: [
    { sourceUnit: '平方米', targetUnit: '平方分米', factor: 100 },
    { sourceUnit: '平方分米', targetUnit: '平方厘米', factor: 100 },
  ],
  [UNIT_CATEGORIES.CAPACITY]: [
    { sourceUnit: '升', targetUnit: '毫升', factor: 1000 },
  ],
});

/**
 * 规范化公共生成参数。
 * @param {Record<string, unknown>} options 原始生成参数。
 * @returns {Record<string, unknown>} 已校验的生成参数。
 */
function normalizeOptions(options) {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const termCount = options.termCount ?? 3;
  const steps = options.steps ?? 1;
  const random = options.random ?? Math.random;

  if (!Number.isInteger(limit) || limit < 0) {
    throw new RangeError('limit 必须是大于或等于 0 的整数');
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError('maxAttempts 必须是大于 0 的整数');
  }
  if (!Number.isInteger(termCount) || termCount < 3 || termCount > 10) {
    throw new RangeError('termCount 必须是 3 到 10 的整数');
  }
  if (!Number.isInteger(steps) || steps < 1 || steps > 3) {
    throw new RangeError('steps 必须是 1 到 3 的整数');
  }
  if (typeof random !== 'function') {
    throw new TypeError('random 必须是函数');
  }
  if (options.operation !== undefined && !BINARY_OPERATIONS.includes(options.operation)) {
    throw new RangeError('operation 仅支持 addition 或 subtraction');
  }
  if (options.remainder !== undefined && !['optional', 'required', 'none'].includes(options.remainder)) {
    throw new RangeError('remainder 仅支持 optional、required 或 none');
  }
  if (options.category !== undefined && !Object.values(UNIT_CATEGORIES).includes(options.category)) {
    throw new RangeError('category 不是支持的单位分类');
  }
  if (options.leftNumber !== undefined && (!Number.isInteger(options.leftNumber) || options.leftNumber < 0)) {
    throw new RangeError('leftNumber 必须是大于或等于 0 的整数');
  }
  if (options.rightNumber !== undefined && (!Number.isInteger(options.rightNumber) || options.rightNumber < 0)) {
    throw new RangeError('rightNumber 必须是大于或等于 0 的整数');
  }

  return {
    ...options,
    limit,
    maxAttempts,
    termCount,
    steps,
    random,
    remainder: options.remainder ?? 'optional',
  };
}

/**
 * 创建统一、可序列化的题目对象。
 * @param {string} type 模板类型。
 * @param {Record<string, unknown>} values 模板特有字段。
 * @param {number} limit 数值上限。
 * @returns {Record<string, unknown>} 标准题目对象。
 */
function createProblem(type, values, limit) {
  return {
    type,
    prompt: '',
    answer: 0,
    operands: [],
    operators: [],
    intermediateResults: [],
    blankCount: 1,
    layout: 'horizontal',
    processBoxes: [],
    ...values,
    meta: { limit, ...(values.meta ?? {}) },
  };
}

/**
 * 将运算名称转换为打印符号。
 * @param {string} operation 运算名称。
 * @returns {string} 运算符号。
 */
function operationSymbol(operation) {
  return operation === 'addition' ? '+' : '-';
}

/**
 * 在指定范围内优先抽取中高区间的整数。
 * @param {() => number} random 随机函数。
 * @param {number} minimum 最小可取值。
 * @param {number} maximum 最大可取值。
 * @returns {number} 分布更均衡的随机整数。
 */
function randomBalancedInteger(random, minimum, maximum) {
  if (maximum <= minimum) {
    return minimum;
  }
  const floor = maximum >= 20 ? Math.max(minimum, Math.floor(maximum * 0.25)) : minimum;
  return randomInteger(random, floor, maximum);
}

/**
 * 在参考值附近按窗口随机选取整数，并限制在合法范围内。
 * @param {() => number} random 随机函数。
 * @param {number} anchor 参考值。
 * @param {number} minimum 最小值。
 * @param {number} maximum 最大值。
 * @param {number} window 允许浮动的窗口。
 * @returns {number|null} 符合窗口和边界的整数；无法取值时返回 null。
 */
function randomWithinWindow(random, anchor, minimum, maximum, window = 20) {
  const lower = Math.max(minimum, anchor - window);
  const upper = Math.min(maximum, anchor + window);
  if (upper < lower) return null;
  return randomInteger(random, lower, upper);
}

/**
 * 计算当前数字要补到下一个整十数所需的数量。
 * @param {number} value 需要凑整十的数字。
 * @returns {number} 从另一个加数中拆出的补数。
 */
function complementToNextTen(value) {
  const remainder = value % 10;
  return remainder === 0 ? 10 : 10 - remainder;
}

/**
 * 生成满足 N 以内约束的二元加减法数据。
 * @param {string} operation 运算名称。
 * @param {number} limit 数值上限。
 * @param {() => number} random 随机函数。
 * @returns {{left: number, right: number, result: number, symbol: string}} 运算数据。
 */
function createBinaryCalculation(operation, limit, random) {
  if (operation === 'addition') {
    const result = randomBalancedInteger(random, 0, limit);
    const minimumPart = result >= 20 ? Math.max(1, Math.floor(result * 0.2)) : 0;
    const maximumPart = Math.max(minimumPart, result - minimumPart);
    const left = randomInteger(random, minimumPart, maximumPart);
    const right = result - left;
    return { left, right, result: left + right, symbol: '+' };
  }

  const left = randomBalancedInteger(random, 0, limit);
  const right = randomInteger(random, 0, left);
  return { left, right, result: left - right, symbol: '-' };
}

/**
 * 选择加法或减法，未指定时随机选择。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {string} 运算名称。
 */
function chooseBinaryOperation(options) {
  return options.operation ?? randomItem(options.random, BINARY_OPERATIONS);
}

/**
 * 生成普通横式题。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>} 横式题。
 */
function generateHorizontal(options) {
  const operation = chooseBinaryOperation(options);
  const calculation = createBinaryCalculation(operation, options.limit, options.random);
  return createProblem(TEMPLATE_TYPES.HORIZONTAL, {
    prompt: `${calculation.left} ${calculation.symbol} ${calculation.right} = □`,
    answer: calculation.result,
    operands: [calculation.left, calculation.right],
    operators: [calculation.symbol],
    intermediateResults: [calculation.result],
    expression: `${calculation.left} ${calculation.symbol} ${calculation.right}`,
    meta: { operation },
  }, options.limit);
}

/**
 * 生成只有一个未知项的缺项题。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>} 缺项题。
 */
function generateMissingTerm(options) {
  const operation = chooseBinaryOperation(options);
  const calculation = createBinaryCalculation(operation, options.limit, options.random);
  const missingIndex = randomInteger(options.random, 0, 1);
  const visibleLeft = missingIndex === 0 ? '□' : calculation.left;
  const visibleRight = missingIndex === 1 ? '□' : calculation.right;
  const answer = missingIndex === 0 ? calculation.left : calculation.right;

  return createProblem(TEMPLATE_TYPES.MISSING_TERM, {
    prompt: `${visibleLeft} ${calculation.symbol} ${visibleRight} = ${calculation.result}`,
    answer,
    operands: [calculation.left, calculation.right],
    operators: [calculation.symbol],
    intermediateResults: [calculation.result],
    expression: `${visibleLeft} ${calculation.symbol} ${visibleRight} = ${calculation.result}`,
    meta: { operation, missingIndex },
  }, options.limit);
}

/**
 * 生成竖式题及打印行。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>} 竖式题。
 */
function generateVertical(options) {
  const operation = chooseBinaryOperation(options);
  const calculation = createBinaryCalculation(operation, options.limit, options.random);
  return createProblem(TEMPLATE_TYPES.VERTICAL, {
    prompt: `用竖式计算：${calculation.left} ${calculation.symbol} ${calculation.right}`,
    answer: calculation.result,
    operands: [calculation.left, calculation.right],
    operators: [calculation.symbol],
    intermediateResults: [calculation.result],
    layout: 'vertical',
    displayLines: [String(calculation.left), `${calculation.symbol} ${calculation.right}`, '────', '□'],
    meta: { operation },
  }, options.limit);
}

/**
 * 生成比较大小题。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>} 比较题。
 */
function generateComparison(options) {
  const left = randomBalancedInteger(options.random, 0, options.limit);
  const right = randomBalancedInteger(options.random, 0, options.limit);
  const answer = left === right ? '=' : left > right ? '>' : '<';
  return createProblem(TEMPLATE_TYPES.COMPARISON, {
    prompt: `${left} ○ ${right}`,
    answer,
    operands: [left, right],
    operators: ['compare'],
  }, options.limit);
}

/**
 * 生成需要根据文字列式的计算题。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>} 列式计算题。
 */
function generateEquation(options) {
  const operation = chooseBinaryOperation(options);
  const calculation = createBinaryCalculation(operation, options.limit, options.random);
  const prompt = operation === 'addition'
    ? `求比 ${calculation.left} 多 ${calculation.right} 的数，列式计算。`
    : `${calculation.left} 比 ${calculation.right} 多多少？列式计算。`;

  return createProblem(TEMPLATE_TYPES.EQUATION, {
    prompt,
    answer: calculation.result,
    operands: [calculation.left, calculation.right],
    operators: [calculation.symbol],
    intermediateResults: [calculation.result],
    expression: `${calculation.left} ${calculation.symbol} ${calculation.right} = ${calculation.result}`,
    processBoxes: [{ kind: 'equation', answer: `${calculation.left} ${calculation.symbol} ${calculation.right} = ${calculation.result}` }],
    meta: { operation },
  }, options.limit);
}

/**
 * 生成连加题。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>} 连加题。
 */
function generateChainAddition(options) {
  const operands = [randomInteger(options.random, 0, options.limit)];
  const intermediateResults = [];
  let current = operands[0];

  // 每次只从剩余额度中取数，保证每一步都不超过 N。
  for (let index = 1; index < options.termCount; index += 1) {
    const next = randomInteger(options.random, 0, options.limit - current);
    operands.push(next);
    current += next;
    intermediateResults.push(current);
  }

  return createProblem(TEMPLATE_TYPES.CHAIN_ADDITION, {
    prompt: `${operands.join(' + ')} = □`,
    answer: current,
    operands,
    operators: Array(options.termCount - 1).fill('+'),
    intermediateResults,
    expression: operands.join(' + '),
  }, options.limit);
}

/**
 * 生成连减题。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>} 连减题。
 */
function generateChainSubtraction(options) {
  const operands = [randomInteger(options.random, 0, options.limit)];
  const intermediateResults = [];
  let current = operands[0];

  // 后续减数不超过当前结果，因此每一步都不会出现负数。
  for (let index = 1; index < options.termCount; index += 1) {
    const next = randomInteger(options.random, 0, current);
    operands.push(next);
    current -= next;
    intermediateResults.push(current);
  }

  return createProblem(TEMPLATE_TYPES.CHAIN_SUBTRACTION, {
    prompt: `${operands.join(' - ')} = □`,
    answer: current,
    operands,
    operators: Array(options.termCount - 1).fill('-'),
    intermediateResults,
    expression: operands.join(' - '),
  }, options.limit);
}

/**
 * 生成连续加减题，前三项至少包含一次加法和一次减法。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>} 连续加减题。
 */
function generateMixedOperations(options) {
  const operands = [randomInteger(options.random, 0, options.limit)];
  const operators = [];
  const intermediateResults = [];
  let current = operands[0];

  for (let index = 1; index < options.termCount; index += 1) {
    const symbol = index === 1 ? '+' : index === 2 ? '-' : randomItem(options.random, ['+', '-']);
    const next = symbol === '+'
      ? randomInteger(options.random, 0, options.limit - current)
      : randomInteger(options.random, 0, current);
    operands.push(next);
    operators.push(symbol);
    current = symbol === '+' ? current + next : current - next;
    intermediateResults.push(current);
  }

  const expression = operands.slice(1).reduce(
    (text, operand, index) => `${text} ${operators[index]} ${operand}`,
    String(operands[0]),
  );
  return createProblem(TEMPLATE_TYPES.MIXED_OPERATIONS, {
    prompt: `${expression} = □`,
    answer: current,
    operands,
    operators,
    intermediateResults,
    expression,
  }, options.limit);
}

/**
 * 尝试生成凑十法题；上限不足时返回空值交由有限重试处理。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>|null} 凑十法题或空值。
 */
function generateMakeTen(options) {
  if (options.limit < 10) {
    return null;
  }

  const left = options.leftNumber === undefined
    ? randomBalancedInteger(options.random, 1, options.limit - 1)
    : randomWithinWindow(options.random, options.leftNumber, 1, options.limit - 1);
  if (left < 1 || left >= options.limit) {
    return null;
  }
  const complement = complementToNextTen(left);
  const maximumRight = options.limit - left;
  const minimumRight = options.rightNumber === undefined ? Math.max(11, complement) : complement;
  if (maximumRight < minimumRight) {
    return null;
  }
  const right = options.rightNumber === undefined
    ? randomInteger(options.random, minimumRight, maximumRight)
    : randomWithinWindow(options.random, options.rightNumber, minimumRight, maximumRight);
  if (right < complement || right > maximumRight) {
    return null;
  }
  const rest = right - complement;
  const result = left + right;
  const roundedTen = left + complement;

  return createProblem(TEMPLATE_TYPES.MAKE_TEN, {
    prompt: `${left} + ${right} = □（用凑十法）`,
    answer: result,
    operands: [left, right],
    operators: ['+'],
    intermediateResults: [roundedTen, result],
    expression: `${left} + ${right}`,
    processBoxes: [
      { kind: 'make-ten', expression: `${left} + ${complement}`, result: roundedTen },
      { kind: 'remaining-addition', expression: `${roundedTen} + ${rest}`, result },
    ],
    meta: { split: [complement, rest] },
  }, options.limit);
}

/**
 * 尝试生成破十法题；上限不足时返回空值交由有限重试处理。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>|null} 破十法题或空值。
 */
function generateBreakTen(options) {
  if (options.limit < 10) {
    return null;
  }

  if (options.leftNumber === undefined && options.limit < 11) {
    return null;
  }
  const left = options.leftNumber === undefined
    ? randomInteger(options.random, 11, Math.min(options.limit, 19))
    : randomWithinWindow(options.random, options.leftNumber, 11, Math.min(options.limit, 19));
  if (left < 10 || left > Math.min(options.limit, 19)) {
    return null;
  }
  const firstPart = left - 10;
  const minimumRight = firstPart + 1;
  if (minimumRight > left) {
    return null;
  }
  const right = options.rightNumber === undefined
    ? randomInteger(options.random, minimumRight, left)
    : randomWithinWindow(options.random, options.rightNumber, minimumRight, left);
  if (right < minimumRight || right > left) {
    return null;
  }
  const secondPart = right - firstPart;
  const result = left - right;

  return createProblem(TEMPLATE_TYPES.BREAK_TEN, {
    prompt: `${left} - ${right} = □（用破十法）`,
    answer: result,
    operands: [left, right],
    operators: ['-'],
    intermediateResults: [10, result],
    expression: `${left} - ${right}`,
    processBoxes: [
      { kind: 'break-to-ten', expression: `${left} - ${firstPart}`, result: 10 },
      { kind: 'remaining-subtraction', expression: `10 - ${secondPart}`, result },
    ],
    meta: { split: [firstPart, secondPart] },
  }, options.limit);
}

/**
 * 尝试生成个位相加需要进位的加法题。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>|null} 进位加法题或空值。
 */
function generateCarryingAddition(options) {
  const left = randomBalancedInteger(options.random, 0, options.limit);
  const right = randomBalancedInteger(options.random, 0, options.limit);
  const result = left + right;
  if (result > options.limit || left % 10 + right % 10 < 10) {
    return null;
  }

  return createProblem(TEMPLATE_TYPES.CARRYING_ADDITION, {
    prompt: `${left} + ${right} = □`,
    answer: result,
    operands: [left, right],
    operators: ['+'],
    intermediateResults: [result],
    expression: `${left} + ${right}`,
    meta: { carry: true },
  }, options.limit);
}

/**
 * 尝试生成个位相减需要退位的减法题。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>|null} 退位减法题或空值。
 */
function generateBorrowingSubtraction(options) {
  const left = randomInteger(options.random, 10, Math.max(10, options.limit));
  const right = randomBalancedInteger(options.random, 0, options.limit);
  if (left > options.limit || right > left || left % 10 >= right % 10) {
    return null;
  }
  const result = left - right;

  return createProblem(TEMPLATE_TYPES.BORROWING_SUBTRACTION, {
    prompt: `${left} - ${right} = □`,
    answer: result,
    operands: [left, right],
    operators: ['-'],
    intermediateResults: [result],
    expression: `${left} - ${right}`,
    meta: { borrow: true },
  }, options.limit);
}

/**
 * 生成乘法题并限制乘积不超过 N。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>} 乘法题。
 */
function generateMultiplication(options) {
  const maximumFactor = Math.min(12, options.limit);
  const right = maximumFactor >= 2 ? randomInteger(options.random, 2, maximumFactor) : randomInteger(options.random, 0, options.limit);
  const maximumLeft = right === 0 ? options.limit : Math.floor(options.limit / right);
  const left = maximumLeft >= 2 ? randomBalancedInteger(options.random, 2, maximumLeft) : randomInteger(options.random, 0, maximumLeft);
  const result = left * right;
  return createProblem(TEMPLATE_TYPES.MULTIPLICATION, {
    prompt: `${left} × ${right} = □`,
    answer: result,
    operands: [left, right],
    operators: ['×'],
    intermediateResults: [result],
    expression: `${left} × ${right}`,
  }, options.limit);
}

/**
 * 尝试生成满足余数约束的除法题。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>|null} 除法题或空值。
 */
function generateDivision(options) {
  if (options.limit < 1) {
    return null;
  }

  const requireRemainder = options.remainder === 'required'
    || (options.remainder === 'optional' && options.limit >= 3 && options.random() < 0.5);
  let divisor;
  let quotient;
  let remainder;

  if (requireRemainder) {
    if (options.limit < 3) {
      return null;
    }
    divisor = randomInteger(options.random, 2, options.limit - 1);
    const maximumQuotient = Math.floor((options.limit - 1) / divisor);
    if (maximumQuotient < 1) {
      return null;
    }
    quotient = randomInteger(options.random, 1, maximumQuotient);
    const maximumRemainder = Math.min(divisor - 1, options.limit - divisor * quotient);
    if (maximumRemainder < 1) {
      return null;
    }
    remainder = randomInteger(options.random, 1, maximumRemainder);
  } else {
    divisor = randomInteger(options.random, 1, options.limit);
    quotient = randomInteger(options.random, 0, Math.floor(options.limit / divisor));
    remainder = 0;
  }

  const dividend = divisor * quotient + remainder;
  const answerText = remainder === 0 ? `${quotient}` : `${quotient}……${remainder}`;
  return createProblem(TEMPLATE_TYPES.DIVISION, {
    prompt: `${dividend} ÷ ${divisor} = □`,
    answer: quotient,
    operands: [dividend, divisor],
    operators: ['÷'],
    intermediateResults: [quotient, remainder],
    expression: `${dividend} ÷ ${divisor}`,
    answerText,
    remainder,
  }, options.limit);
}

/**
 * 尝试生成整数人民币单位换算题。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>|null} 人民币题或空值。
 */
function generateCurrency(options) {
  const available = CURRENCY_CONVERSIONS.filter(({ factor }) => factor <= options.limit);
  if (available.length === 0) {
    return null;
  }
  const conversion = randomItem(options.random, available);
  const sourceValue = randomInteger(options.random, 1, Math.floor(options.limit / conversion.factor));
  const answer = sourceValue * conversion.factor;
  return createProblem(TEMPLATE_TYPES.CURRENCY, {
    prompt: `${sourceValue}${conversion.sourceUnit} = □${conversion.targetUnit}`,
    answer,
    operands: [sourceValue],
    intermediateResults: [answer],
    meta: { ...conversion, sourceValue },
  }, options.limit);
}

/**
 * 尝试生成指定分类的整数单位换算题。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>|null} 单位换算题或空值。
 */
function generateUnitConversion(options) {
  const categories = options.category ? [options.category] : Object.values(UNIT_CATEGORIES);
  const available = categories.flatMap((category) => (
    UNIT_CONVERSIONS[category]
      .filter(({ factor }) => factor <= options.limit)
      .map((conversion) => ({ category, ...conversion }))
  ));
  if (available.length === 0) {
    return null;
  }
  const conversion = randomItem(options.random, available);
  const sourceValue = randomInteger(options.random, 1, Math.floor(options.limit / conversion.factor));
  const answer = sourceValue * conversion.factor;
  return createProblem(TEMPLATE_TYPES.UNIT_CONVERSION, {
    prompt: `${sourceValue}${conversion.sourceUnit} = □${conversion.targetUnit}`,
    answer,
    operands: [sourceValue],
    intermediateResults: [answer],
    meta: { ...conversion, sourceValue },
  }, options.limit);
}

/**
 * 生成 1～3 步应用题，每一步均保持结果在 0～N。
 * @param {Record<string, unknown>} options 生成参数。
 * @returns {Record<string, unknown>} 应用题。
 */
function generateWordProblem(options) {
  const start = randomInteger(options.random, 0, options.limit);
  const operands = [start];
  const operators = [];
  const intermediateResults = [];
  const steps = [];
  const storyParts = [`盒子里原有 ${start} 支铅笔`];
  let current = start;

  for (let index = 0; index < options.steps; index += 1) {
    const operation = current === 0
      ? 'addition'
      : current === options.limit
        ? 'subtraction'
        : randomItem(options.random, BINARY_OPERATIONS);
    const symbol = operationSymbol(operation);
    const amount = operation === 'addition'
      ? randomInteger(options.random, 0, options.limit - current)
      : randomInteger(options.random, 0, current);
    const before = current;
    current = operation === 'addition' ? current + amount : current - amount;
    operands.push(amount);
    operators.push(symbol);
    intermediateResults.push(current);
    steps.push({
      index: index + 1,
      operation,
      expression: `${before} ${symbol} ${amount} = ${current}`,
      result: current,
    });
    storyParts.push(operation === 'addition' ? `又放入 ${amount} 支` : `取走 ${amount} 支`);
  }

  return createProblem(TEMPLATE_TYPES.WORD_PROBLEM, {
    prompt: `${storyParts.join('，')}。现在盒子里有多少支铅笔？`,
    answer: current,
    operands,
    operators,
    intermediateResults,
    steps,
    processBoxes: [
      ...steps.map((step) => ({ kind: 'equation', step: step.index, answer: step.expression })),
      { kind: 'final-answer', answer: `${current} 支` },
    ],
    meta: { stepCount: options.steps },
  }, options.limit);
}

const GENERATORS = Object.freeze({
  [TEMPLATE_TYPES.HORIZONTAL]: generateHorizontal,
  [TEMPLATE_TYPES.MISSING_TERM]: generateMissingTerm,
  [TEMPLATE_TYPES.VERTICAL]: generateVertical,
  [TEMPLATE_TYPES.COMPARISON]: generateComparison,
  [TEMPLATE_TYPES.EQUATION]: generateEquation,
  [TEMPLATE_TYPES.CHAIN_ADDITION]: generateChainAddition,
  [TEMPLATE_TYPES.CHAIN_SUBTRACTION]: generateChainSubtraction,
  [TEMPLATE_TYPES.MIXED_OPERATIONS]: generateMixedOperations,
  [TEMPLATE_TYPES.MAKE_TEN]: generateMakeTen,
  [TEMPLATE_TYPES.BREAK_TEN]: generateBreakTen,
  [TEMPLATE_TYPES.CARRYING_ADDITION]: generateCarryingAddition,
  [TEMPLATE_TYPES.BORROWING_SUBTRACTION]: generateBorrowingSubtraction,
  [TEMPLATE_TYPES.MULTIPLICATION]: generateMultiplication,
  [TEMPLATE_TYPES.DIVISION]: generateDivision,
  [TEMPLATE_TYPES.CURRENCY]: generateCurrency,
  [TEMPLATE_TYPES.UNIT_CONVERSION]: generateUnitConversion,
  [TEMPLATE_TYPES.WORD_PROBLEM]: generateWordProblem,
});

/**
 * 按模板生成一道数学题，候选不满足约束时最多重试指定次数。
 * @param {string} type 模板类型。
 * @param {Record<string, unknown>} [options] 范围、题型和随机参数。
 * @returns {Record<string, unknown>} 可直接打印或持久化的题目快照。
 */
export function generateProblem(type, options = {}) {
  const generator = GENERATORS[type];
  if (!generator) {
    throw new RangeError(`未知数学模板：${type}`);
  }
  const normalizedOptions = normalizeOptions(options);

  // 复杂题型可能随机到不合法组合，统一使用有限重试避免死循环。
  for (let attempt = 1; attempt <= normalizedOptions.maxAttempts; attempt += 1) {
    const problem = generator(normalizedOptions);
    if (problem) {
      return problem;
    }
  }

  throw new RangeError(`无法生成 ${type}：已尝试 ${normalizedOptions.maxAttempts} 次，请调整范围或参数`);
}
