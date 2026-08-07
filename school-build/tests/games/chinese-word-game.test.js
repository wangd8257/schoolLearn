import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createChineseWordGame,
  hasChineseMove,
  reshuffleChineseBoard,
  submitChinesePath,
  validateChinesePath,
} from '../../src/games/chinese-word-game.js';

function sequenceNow(...values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

/**
 * 生成旧版整板蛇形顺序，用于回归验证新棋盘不再按该顺序预埋。
 * @returns {number[]} 旧版蛇形路径索引。
 */
function createSnakePath() {
  const path = [];
  for (let row = 0; row < 9; row += 1) {
    const columns = Array.from({ length: 9 }, (_, column) => column);
    if (row % 2 === 1) columns.reverse();
    for (const column of columns) path.push(row * 9 + column);
  }
  return path;
}

test('9×9 棋盘预埋路径可不重不漏地完整消除', () => {
  const game = createChineseWordGame({ seed: 20260805 });
  const covered = game.solutionPaths.flatMap(({ path }) => path);

  assert.equal(game.board.length, 81);
  assert.equal(covered.length, 81);
  assert.equal(new Set(covered).size, 81);
  assert.deepEqual([...covered].sort((a, b) => a - b), Array.from({ length: 81 }, (_, i) => i));

  for (const solution of game.solutionPaths) {
    assert.ok(game.dictionary.includes(solution.word));
    assert.equal(validateChinesePath(game.board, solution.path, game.allowedWordLengths).valid, true);
    assert.equal(submitChinesePath(game, solution.path).correct, true);
  }

  assert.ok(game.board.every((cell) => cell === null));
  assert.equal(game.session.status, 'completed');
});

test('汉字预埋路径打散分布，不再按整板蛇形连续切段', () => {
  const game = createChineseWordGame({ seed: 20260805 });
  const covered = game.solutionPaths.flatMap(({ path }) => path);
  let adjacentBoundaries = 0;

  assert.notDeepEqual(covered, createSnakePath());
  for (let index = 1; index < game.solutionPaths.length; index += 1) {
    const previousPath = game.solutionPaths[index - 1].path;
    const currentPath = game.solutionPaths[index].path;
    const previousTail = previousPath[previousPath.length - 1];
    const currentHead = currentPath[0];
    const tailRow = Math.floor(previousTail / 9);
    const headRow = Math.floor(currentHead / 9);
    const tailColumn = previousTail % 9;
    const headColumn = currentHead % 9;

    if (Math.abs(tailRow - headRow) + Math.abs(tailColumn - headColumn) === 1) adjacentBoundaries += 1;
  }
  assert.ok(adjacentBoundaries < game.solutionPaths.length / 3);
});


test('三字词模式使用不重复答案词', () => {
  const game = createChineseWordGame({ allowedWordLengths: [3], seed: 1 });
  const words = game.solutionPaths.map(({ word }) => word);

  assert.equal(words.length, 27);
  assert.equal(new Set(words).size, words.length);
});

test('路径允许上下左右转弯，拒绝斜连、跳格和重复格', () => {
  const board = Array.from({ length: 81 }, (_, index) => String(index));

  assert.equal(validateChinesePath(board, [0, 1, 10, 11], [4]).valid, true);
  assert.equal(validateChinesePath(board, [0, 10], [2]).valid, false);
  assert.equal(validateChinesePath(board, [0, 2], [2]).valid, false);
  assert.equal(validateChinesePath(board, [0, 1, 0], [3]).valid, false);
});

test('只有长度和路径合法但不在词库的连线才计错', () => {
  const game = createChineseWordGame({ seed: 7 });
  let invalidPath;

  for (let index = 0; index < 80 && !invalidPath; index += 1) {
    const candidate = [index, index + 1];
    if (Math.floor(index / 9) === Math.floor((index + 1) / 9)) {
      const word = candidate.map((cellIndex) => game.board[cellIndex]).join('');
      if (!game.dictionary.includes(word)) invalidPath = candidate;
    }
  }

  assert.ok(invalidPath, '测试棋盘应存在非词库相邻二字组合');
  assert.equal(submitChinesePath(game, [0]).correct, false);
  assert.equal(game.session.errorCount, 0);
  assert.equal(submitChinesePath(game, [0, 10]).correct, false);
  assert.equal(game.session.errorCount, 0);
  assert.equal(submitChinesePath(game, invalidPath).correct, false);
  assert.equal(game.session.errorCount, 1);
});

test('自定义词库不足时使用内置词补齐', () => {
  const game = createChineseWordGame({ customWords: ['星球'], seed: 3 });

  assert.ok(game.dictionary.includes('星球'));
  assert.ok(game.solutionPaths.some(({ word }) => word === '星球'));
  assert.ok(game.solutionPaths.some(({ source }) => source === 'built-in'));
});

test('纯二字词无法覆盖 81 格时给出明确配置错误', () => {
  assert.throws(
    () => createChineseWordGame({ allowedWordLengths: [2] }),
    /81 格/,
  );
});

test('无可消除项时可重排剩余字格产生可用连线', () => {
  const game = createChineseWordGame({ seed: 11 });
  const twoCharacterWord = game.dictionary.find((word) => word.length === 2);
  game.board.fill(null);
  game.board[0] = twoCharacterWord[0];
  game.board[80] = twoCharacterWord[1];

  assert.equal(hasChineseMove(game), false);
  assert.equal(reshuffleChineseBoard(game, { seed: 19 }), true);
  assert.equal(game.board.filter(Boolean).length, 2);
  assert.equal(hasChineseMove(game), true);
});

test('汉字游戏会话记录开始、完成、用时和错误数', () => {
  const now = sequenceNow(1_000, 4_250);
  const game = createChineseWordGame({ seed: 5, now });

  for (const { path } of game.solutionPaths) submitChinesePath(game, path);

  assert.equal(game.session.startedAt, '1970-01-01T00:00:01.000Z');
  assert.equal(game.session.completedAt, '1970-01-01T00:00:04.250Z');
  assert.equal(game.session.durationMs, 3_250);
  assert.equal(game.session.errorCount, 0);
});
