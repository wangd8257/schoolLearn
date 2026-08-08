import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createEnglishMatchGame,
  dropEnglishCard,
} from '../../src/games/english-match-game.js';

function sequenceNow(...values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

test('英语配对每关默认 10 项，并限制在 2～20 项', () => {
  assert.equal(createEnglishMatchGame({ seed: 1 }).cards.length, 10);
  assert.equal(createEnglishMatchGame({ count: 2, seed: 1 }).cards.length, 2);
  assert.equal(createEnglishMatchGame({ count: 20, seed: 1 }).cards.length, 20);
  assert.throws(() => createEnglishMatchGame({ count: 1 }), /2～20/);
  assert.throws(() => createEnglishMatchGame({ count: 21 }), /2～20/);
});

test('拖到错误单词区后图卡回原位并累计错误', () => {
  const game = createEnglishMatchGame({ count: 2, seed: 8 });
  const [card] = game.cards;
  const wrongTarget = game.targets.find(({ word }) => word !== card.word);
  const result = dropEnglishCard(game, card.id, wrongTarget.id);

  assert.equal(result.correct, false);
  assert.equal(result.returnedToOrigin, true);
  assert.equal(card.matchedTargetId, null);
  assert.equal(game.session.errorCount, 1);
});

test('正确配对后锁定图卡，全部完成时记录会话用时', () => {
  const now = sequenceNow(10_000, 13_600);
  const game = createEnglishMatchGame({ count: 2, seed: 2, now });

  for (const card of game.cards) {
    const target = game.targets.find(({ word }) => word === card.word);
    const result = dropEnglishCard(game, card.id, target.id);
    assert.equal(result.correct, true);
    assert.equal(card.matchedTargetId, target.id);
  }

  assert.equal(game.session.status, 'completed');
  assert.equal(game.session.startedAt, '1970-01-01T00:00:10.000Z');
  assert.equal(game.session.completedAt, '1970-01-01T00:00:13.600Z');
  assert.equal(game.session.durationMs, 3_600);
  assert.equal(game.session.errorCount, 0);
});
