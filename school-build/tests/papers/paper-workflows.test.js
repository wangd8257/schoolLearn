import assert from 'node:assert/strict';
import test from 'node:test';

const papers = await import('../../src/papers.js');

/**
 * 构造包含稳定题号的已批改试卷，供错题工作流测试复用。
 * @returns {Record<string, unknown>} 测试用试卷快照。
 */
function createReviewedPaper() {
  return {
    id: 'paper-source',
    title: '20以内横式',
    subject: '数学',
    orientation: 'portrait',
    config: { subject: '数学', template: 'horizontal', count: '4', max: '20' },
    problems: [1, 2, 3, 4].map((number) => ({
      id: `q-${number}`,
      kind: 'horizontal',
      prompt: `${number} + 1 = □`,
      answer: number + 1,
    })),
    status: 'done',
    blackStrokes: [{ points: [{ x: 0.1, y: 0.1 }] }],
    redStrokes: [{ points: [{ x: 0.2, y: 0.2 }] }],
    wrongProblemIds: [],
    createdAt: 1,
    updatedAt: 2,
    submittedAt: 3,
    reviewedAt: 4,
  };
}

test('题号输入支持逗号、顿号和连续范围，并去重排序', () => {
  assert.equal(typeof papers.parseProblemNumbers, 'function');
  assert.deepEqual(papers.parseProblemNumbers('4、1, 2-3，3', 4), [1, 2, 3, 4]);
  assert.throws(() => papers.parseProblemNumbers('0,2', 4), /1.*4/);
  assert.throws(() => papers.parseProblemNumbers('2-5', 4), /1.*4/);
});

test('单题标记和按题号批量标记不修改原试卷且可取消单题标记', () => {
  assert.equal(typeof papers.setProblemWrong, 'function');
  assert.equal(typeof papers.markWrongProblemsByNumbers, 'function');
  const source = createReviewedPaper();
  const marked = papers.setProblemWrong(source, 'q-2', true, 10);
  const batchMarked = papers.markWrongProblemsByNumbers(marked, [1, 4], 11);
  const unmarked = papers.setProblemWrong(batchMarked, 'q-2', false, 12);

  assert.deepEqual(source.wrongProblemIds, []);
  assert.deepEqual(marked.wrongProblemIds, ['q-2']);
  assert.deepEqual(batchMarked.wrongProblemIds, ['q-1', 'q-2', 'q-4']);
  assert.deepEqual(unmarked.wrongProblemIds, ['q-1', 'q-4']);
  assert.equal(unmarked.updatedAt, 12);
  assert.throws(() => papers.setProblemWrong(source, 'q-99'), /题目不存在/);
});

test('原题重做从原快照抽取错题并生成不受源试卷变化影响的新试卷', () => {
  assert.equal(typeof papers.createWrongProblemPaper, 'function');
  const source = papers.markWrongProblemsByNumbers(createReviewedPaper(), [2, 4], 8);
  const retry = papers.createWrongProblemPaper(source, {
    mode: 'original',
    id: 'paper-retry',
    now: 100,
  });

  assert.equal(retry.id, 'paper-retry');
  assert.equal(retry.status, 'unstarted');
  assert.equal(retry.sourcePaperId, source.id);
  assert.equal(retry.retryMode, 'original');
  assert.deepEqual(retry.problems.map(({ prompt }) => prompt), ['2 + 1 = □', '4 + 1 = □']);
  assert.deepEqual(retry.problems.map(({ id }) => id), ['q-1', 'q-2']);
  assert.deepEqual(retry.blackStrokes, []);
  assert.deepEqual(retry.redStrokes, []);
  assert.deepEqual(retry.wrongProblemIds, []);
  assert.equal(retry.config.count, '2');

  source.problems[1].prompt = '已修改';
  assert.equal(retry.problems[0].prompt, '2 + 1 = □');
});

test('同类新题沿用原配置但保存全新的题目快照', () => {
  assert.equal(typeof papers.createWrongProblemPaper, 'function');
  const source = papers.markWrongProblemsByNumbers(createReviewedPaper(), [1, 3], 8);
  const newProblems = [
    { id: 'generated-a', kind: 'horizontal', prompt: '8 + 7 = □', answer: 15 },
    { id: 'generated-b', kind: 'horizontal', prompt: '9 + 6 = □', answer: 15 },
  ];
  const retry = papers.createWrongProblemPaper(source, {
    mode: 'similar',
    problems: newProblems,
    id: 'paper-similar',
    now: 200,
  });

  assert.equal(retry.retryMode, 'similar');
  assert.deepEqual(retry.problems.map(({ prompt }) => prompt), ['8 + 7 = □', '9 + 6 = □']);
  assert.deepEqual(retry.problems.map(({ id }) => id), ['q-1', 'q-2']);
  assert.equal(retry.config.count, '2');

  newProblems[0].prompt = '已修改';
  assert.equal(retry.problems[0].prompt, '8 + 7 = □');
  assert.throws(
    () => papers.createWrongProblemPaper(source, { mode: 'similar', problems: [newProblems[0]] }),
    /题目数量/,
  );
});

test('试卷状态只按未作答、作答中、待批改、已批改顺序推进', () => {
  assert.equal(typeof papers.getPaperStatusAfterAction, 'function');
  assert.equal(papers.getPaperStatusAfterAction('unstarted', 'write'), 'writing');
  assert.throws(() => papers.getPaperStatusAfterAction('unstarted', 'submit'), /状态/);
  assert.equal(papers.getPaperStatusAfterAction('writing', 'submit'), 'review');
  assert.equal(papers.getPaperStatusAfterAction('review', 'finish-review'), 'done');
  assert.equal(papers.getPaperStatusAfterAction('done', 'reopen-review'), 'review');
  assert.throws(() => papers.getPaperStatusAfterAction('done', 'submit'), /状态/);
});
