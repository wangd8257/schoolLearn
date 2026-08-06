import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TEMPLATE_TYPES,
  UNIT_CATEGORIES,
  createSeededRandom,
  generateProblem,
  generateWorksheet,
  validateProblem,
} from '../../src/math/index.mjs';

const ALL_TEMPLATE_TYPES = [
  'horizontal',
  'missing-term',
  'vertical',
  'comparison',
  'equation',
  'chain-addition',
  'chain-subtraction',
  'mixed-operations',
  'make-ten',
  'break-ten',
  'carrying-addition',
  'borrowing-subtraction',
  'multiplication',
  'division',
  'currency',
  'unit-conversion',
  'word-problem',
];

/**
 * 生成固定种子的题目，便于重复验证随机边界。
 * @param {string} type 模板类型。
 * @param {Record<string, unknown>} [options] 生成参数。
 * @returns {Record<string, unknown>} 生成后的题目。
 */
function seededProblem(type, options = {}) {
  return generateProblem(type, {
    limit: 100,
    random: createSeededRandom(20260805),
    ...options,
  });
}

test('导出设计要求的全部数学模板', () => {
  assert.deepEqual(Object.values(TEMPLATE_TYPES), ALL_TEMPLATE_TYPES);
});

test('每种模板都生成可校验且可 JSON 快照的题目对象', () => {
  for (const type of ALL_TEMPLATE_TYPES) {
    const problem = seededProblem(type);

    assert.equal(problem.type, type);
    assert.equal(typeof problem.prompt, 'string');
    assert.ok(problem.prompt.length > 0);
    assert.equal(validateProblem(problem).valid, true);
    assert.deepEqual(JSON.parse(JSON.stringify(problem)), problem);
  }
});

test('N 以内算术题的参与数字、中间结果和答案均在 0 到 N', () => {
  const types = [
    'horizontal',
    'missing-term',
    'vertical',
    'comparison',
    'equation',
    'chain-addition',
    'chain-subtraction',
    'mixed-operations',
    'make-ten',
    'break-ten',
    'carrying-addition',
    'borrowing-subtraction',
    'multiplication',
    'division',
    'word-problem',
  ];

  for (const type of types) {
    const random = createSeededRandom(17);
    for (let index = 0; index < 80; index += 1) {
      const problem = generateProblem(type, { limit: 30, random });
      const numbers = [
        ...problem.operands,
        ...problem.intermediateResults,
        problem.answer,
      ].filter(Number.isFinite);

      assert.ok(numbers.every((number) => number >= 0 && number <= 30), type);
      assert.equal(validateProblem(problem, { limit: 30 }).valid, true, type);
    }
  }
});

test('减法、连减和混合加减过程不出现负数', () => {
  for (const type of ['horizontal', 'missing-term', 'vertical', 'chain-subtraction', 'mixed-operations']) {
    const random = createSeededRandom(99);
    for (let index = 0; index < 100; index += 1) {
      const problem = generateProblem(type, {
        limit: 20,
        operation: type.startsWith('chain') ? undefined : 'subtraction',
        random,
      });

      assert.ok(problem.intermediateResults.every((value) => value >= 0), type);
      assert.ok(problem.answer >= 0, type);
    }
  }
});

test('横式和缺项题恰好只有一个作答空格', () => {
  for (const type of ['horizontal', 'missing-term']) {
    const problem = seededProblem(type, { operation: 'addition' });
    assert.equal(problem.blankCount, 1);
    assert.equal(problem.prompt.match(/□/g)?.length, 1);
  }
});

test('竖式及过程题提供打印所需的结构化过程框', () => {
  const vertical = seededProblem('vertical', { operation: 'addition' });
  assert.equal(vertical.layout, 'vertical');
  assert.ok(Array.isArray(vertical.displayLines));
  assert.equal(vertical.displayLines.at(-1), '□');

  for (const type of ['make-ten', 'break-ten', 'word-problem']) {
    const problem = seededProblem(type, { steps: 3 });
    assert.ok(problem.processBoxes.length > 1, type);
  }
});

test('混合加减项数限制为 3 到 10 且默认 3', () => {
  assert.equal(seededProblem('mixed-operations').operands.length, 3);
  assert.equal(seededProblem('mixed-operations', { termCount: 10 }).operands.length, 10);
  assert.throws(() => seededProblem('mixed-operations', { termCount: 2 }), /3.*10/);
  assert.throws(() => seededProblem('mixed-operations', { termCount: 11 }), /3.*10/);
});

test('有余数除法始终满足余数范围并保持等式成立', () => {
  const random = createSeededRandom(314159);
  for (let index = 0; index < 100; index += 1) {
    const problem = generateProblem('division', {
      limit: 100,
      remainder: 'required',
      random,
    });
    const [dividend, divisor] = problem.operands;

    assert.ok(problem.remainder >= 0);
    assert.ok(problem.remainder < divisor);
    assert.equal(dividend, divisor * problem.answer + problem.remainder);
  }
});

test('整除模式的余数为零', () => {
  const problem = seededProblem('division', { remainder: 'none' });
  assert.equal(problem.remainder, 0);
  assert.equal(problem.operands[0] % problem.operands[1], 0);
});

test('凑十、破十、进位和退位模板满足各自算法条件', () => {
  const makeTen = seededProblem('make-ten', { limit: 20 });
  assert.equal(makeTen.processBoxes[0].result % 10, 0);
  assert.equal(makeTen.operands.some((value) => value > 10), true);

  const breakTen = seededProblem('break-ten', { limit: 20 });
  assert.equal(breakTen.operands[0] >= 10, true);
  assert.equal(breakTen.operands.some((value) => value > 10), true);
  assert.equal(breakTen.processBoxes[0].result, 10);

  const carrying = seededProblem('carrying-addition', { limit: 50 });
  assert.ok(carrying.operands[0] % 10 + carrying.operands[1] % 10 >= 10);

  const borrowing = seededProblem('borrowing-subtraction', { limit: 50 });
  assert.ok(borrowing.operands[0] % 10 < borrowing.operands[1] % 10);
  assert.ok(borrowing.answer >= 0);
});

test('普通计算题随机数字覆盖中高区间，避免集中生成一位数', () => {
  const random = createSeededRandom(20260806);
  const generated = Array.from({ length: 40 }, () => generateProblem('horizontal', {
    limit: 100,
    operation: 'addition',
    random,
  }));
  const largeOperandCount = generated.flatMap((problem) => problem.operands).filter((value) => value >= 10).length;

  assert.ok(largeOperandCount >= generated.length);
});

test('凑十法和破十法支持指定两个参与计算的数字', () => {
  const makeTen = seededProblem('make-ten', { limit: 20, leftNumber: 8, rightNumber: 5 });
  const breakTen = seededProblem('break-ten', { limit: 20, leftNumber: 13, rightNumber: 5 });
  const makeRoundTen = seededProblem('make-ten', { limit: 100, leftNumber: 50, rightNumber: 50 });
  const [makeLeft, makeRight] = makeTen.operands;
  const [roundLeft, roundRight] = makeRoundTen.operands;
  const [breakLeft, breakRight] = breakTen.operands;

  assert.ok(Math.abs(makeLeft - 8) <= 20);
  assert.ok(Math.abs(makeRight - 5) <= 20);
  assert.equal(makeTen.meta.split[0], 10 - (makeLeft % 10));
  assert.equal(makeTen.meta.split[0] + makeTen.meta.split[1], makeRight);
  assert.equal(makeTen.answer, makeLeft + makeRight);
  assert.ok(Math.abs(roundLeft - 50) <= 20);
  assert.ok(Math.abs(roundRight - 50) <= 20);
  assert.equal(makeRoundTen.processBoxes[0].result % 10, 0);
  assert.equal(makeRoundTen.answer, roundLeft + roundRight);
  assert.ok(Math.abs(breakLeft - 13) <= 20);
  assert.ok(Math.abs(breakRight - 5) <= 20);
  assert.deepEqual(breakTen.meta.split, [breakLeft - 10, breakRight - (breakLeft - 10)]);
  assert.equal(breakTen.answer, breakLeft - breakRight);
});

test('凑十法和破十法在参考窗口没有合法解时明确失败', () => {
  assert.throws(() => seededProblem('make-ten', { limit: 9, leftNumber: 10, rightNumber: 3 }), /无法生成 make-ten|limit/);
  assert.throws(() => seededProblem('break-ten', { limit: 9, leftNumber: 9, rightNumber: 3 }), /无法生成 break-ten|limit/);
});

test('人民币题的换算关系准确', () => {
  const random = createSeededRandom(2718);
  for (let index = 0; index < 50; index += 1) {
    const problem = generateProblem('currency', { limit: 100, random });
    assert.equal(problem.answer, problem.meta.sourceValue * problem.meta.factor);
  }
});

test('时间、长度、质量、面积和容量单位换算均可指定生成', () => {
  assert.deepEqual(Object.values(UNIT_CATEGORIES), ['time', 'length', 'mass', 'area', 'capacity']);

  for (const category of Object.values(UNIT_CATEGORIES)) {
    const problem = seededProblem('unit-conversion', { category, limit: 10000 });
    assert.equal(problem.meta.category, category);
    assert.equal(problem.answer, problem.meta.sourceValue * problem.meta.factor);
  }
});

test('未指定单位分类时只从当前 N 范围可生成的换算中选择', () => {
  const problem = generateProblem('unit-conversion', {
    limit: 20,
    random: () => 0,
    maxAttempts: 1,
  });

  assert.equal(problem.meta.category, 'length');
  assert.equal(problem.answer <= 20, true);
});

test('应用题支持 1 到 3 步并为每步提供列式框和最终作答框', () => {
  for (const steps of [1, 2, 3]) {
    const problem = seededProblem('word-problem', { steps });
    assert.equal(problem.steps.length, steps);
    assert.equal(problem.processBoxes.length, steps + 1);
    assert.equal(problem.processBoxes.at(-1).kind, 'final-answer');
    assert.equal(problem.answer, problem.steps.at(-1).result);
  }

  assert.throws(() => seededProblem('word-problem', { steps: 0 }), /1.*3/);
  assert.throws(() => seededProblem('word-problem', { steps: 4 }), /1.*3/);
});

test('生成器拒绝无效参数并在有限尝试后明确失败', () => {
  assert.throws(() => generateProblem('unknown'), /未知数学模板/);
  assert.throws(() => seededProblem('horizontal', { limit: -1 }), /limit/);
  assert.throws(() => seededProblem('horizontal', { maxAttempts: 0 }), /maxAttempts/);
  assert.throws(
    () => seededProblem('carrying-addition', { limit: 9, maxAttempts: 3 }),
    /无法生成.*3 次/,
  );
});

test('试卷生成固定题量、稳定编号和独立快照元数据', () => {
  const templateOptions = { limit: 20, print: { showNameLine: true } };
  const worksheet = generateWorksheet({
    title: '20以内练习',
    template: 'horizontal',
    count: 5,
    orientation: 'landscape',
    options: templateOptions,
    random: createSeededRandom(8),
    createdAt: '2026-08-05T00:00:00.000Z',
  });

  assert.equal(worksheet.schemaVersion, 1);
  assert.equal(worksheet.title, '20以内练习');
  assert.equal(worksheet.orientation, 'landscape');
  assert.equal(worksheet.problems.length, 5);
  assert.deepEqual(worksheet.problems.map(({ id }) => id), ['q-1', 'q-2', 'q-3', 'q-4', 'q-5']);
  assert.equal(worksheet.createdAt, '2026-08-05T00:00:00.000Z');
  assert.deepEqual(JSON.parse(JSON.stringify(worksheet)), worksheet);

  templateOptions.print.showNameLine = false;
  assert.equal(worksheet.templateOptions.print.showNameLine, true);

  assert.throws(() => generateWorksheet({ template: 'horizontal', count: 0 }), /count/);
  assert.throws(
    () => generateWorksheet({ template: 'horizontal', count: 1, orientation: 'square' }),
    /orientation/,
  );
});

test('同一份试卷内不会重复生成完全相同的题目', () => {
  const worksheet = generateWorksheet({
    title: '不重复试卷',
    template: 'horizontal',
    count: 12,
    orientation: 'portrait',
    options: { limit: 20, operation: 'addition' },
    random: createSeededRandom(42),
  });
  const signatures = new Set(worksheet.problems.map((problem) => JSON.stringify([problem.type, problem.prompt, problem.answer, problem.operands, problem.operators])));

  assert.equal(signatures.size, worksheet.problems.length);
});
