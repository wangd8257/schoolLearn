import test from 'node:test';
import assert from 'node:assert/strict';
import { paperMoveDelta, paperScrollDelta } from '../../src/paper-controls.mjs';

test('试卷按钮位移语义：上移让试卷视觉向上，下移让试卷视觉向下', () => {
  assert.equal(paperMoveDelta(-1, 90), -90);
  assert.equal(paperMoveDelta(1, 90), 90);
});

test('普通滚动容器按鼠标滚轮语义滚动：上移等同向上滚动，下移等同向下滚动', () => {
  assert.equal(paperScrollDelta(-1, 90), -90);
  assert.equal(paperScrollDelta(1, 90), 90);
});
