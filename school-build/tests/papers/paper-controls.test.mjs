import test from 'node:test';
import assert from 'node:assert/strict';
import { paperMoveDelta, paperScrollDelta } from '../../src/paper-controls.mjs';

test('试卷按钮位移语义：上移让试卷视觉向上，下移让试卷视觉向下', () => {
  assert.equal(paperMoveDelta(-1, 90), -90);
  assert.equal(paperMoveDelta(1, 90), 90);
});

test('普通滚动容器使用反向 scrollBy 保持视觉移动方向一致', () => {
  assert.equal(paperScrollDelta(-1, 90), 90);
  assert.equal(paperScrollDelta(1, 90), -90);
});
