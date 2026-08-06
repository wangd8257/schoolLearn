import assert from 'node:assert/strict';
import test from 'node:test';

const drawing = await import('../../src/drawing.js');

test('处理已启用图层上的 Apple Pencil 和鼠标指针', () => {
  assert.equal(typeof drawing.shouldHandleDrawingPointer, 'function');
  assert.equal(drawing.shouldHandleDrawingPointer({ pointerType: 'pen' }, true), true);
  assert.equal(drawing.shouldHandleDrawingPointer({ pointerType: 'mouse' }, true), true);
  assert.equal(drawing.shouldHandleDrawingPointer({ pointerType: 'touch' }, true), false);
  assert.equal(drawing.shouldHandleDrawingPointer({ pointerType: 'pen' }, false), false);
});

test('橡皮擦按线段命中笔画，不会漏掉两个采样点之间的笔迹', () => {
  assert.equal(typeof drawing.strokeIntersectsPoint, 'function');
  const stroke = { points: [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 }] };

  assert.equal(drawing.strokeIntersectsPoint(stroke, { x: 0.5, y: 0.11 }, 0.02), true);
  assert.equal(drawing.strokeIntersectsPoint(stroke, { x: 0.5, y: 0.2 }, 0.02), false);
});

test('擦除只返回传入当前颜色层过滤后的笔画，且不修改原数组', () => {
  assert.equal(typeof drawing.eraseStrokesAtPoint, 'function');
  const currentLayer = [
    { id: 'hit', points: [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 }] },
    { id: 'keep', points: [{ x: 0.1, y: 0.8 }, { x: 0.9, y: 0.8 }] },
  ];
  const otherColorLayer = [{ id: 'red', points: [{ x: 0.5, y: 0.1 }] }];

  const result = drawing.eraseStrokesAtPoint(currentLayer, { x: 0.5, y: 0.1 }, 0.03);

  assert.equal(result.changed, true);
  assert.deepEqual(result.strokes.map(({ id }) => id), ['keep']);
  assert.equal(currentLayer.length, 2);
  assert.equal(otherColorLayer.length, 1);
});
