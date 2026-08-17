import test from 'node:test';
import assert from 'node:assert/strict';
import { findDropTargetId } from '../../src/games.js';

test('按拖动结束坐标命中唯一英语单词目标', () => {
  const targets = [
    { dataset: { targetId: 'left' }, getBoundingClientRect: () => ({ left: 0, right: 80, top: 0, bottom: 80 }) },
    { dataset: { targetId: 'right' }, getBoundingClientRect: () => ({ left: 100, right: 180, top: 0, bottom: 80 }) },
  ];

  assert.equal(findDropTargetId(targets, 130, 40), 'right');
  assert.equal(findDropTargetId(targets, 90, 40), null);
});
