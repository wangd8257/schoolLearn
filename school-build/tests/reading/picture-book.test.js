import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addPictureBookTextBox,
  createPictureBookReading,
  movePictureBookPage,
  removePictureBookPage,
  removePictureBookTextBox,
  updatePictureBookTextBox,
} from '../../src/reading.js';

test('多张上传图片按顺序创建独立绘本页面', () => {
  const book = createPictureBookReading(
    { title: '我的绘本', language: 'zh' },
    [
      { id: 'page-a', imageDataUrl: 'data:image/png;base64,AAA', fileName: 'a.png' },
      { id: 'page-b', imageDataUrl: 'data:image/jpeg;base64,BBB', fileName: 'b.jpg' },
    ],
    { id: 'book-1', now: 100 },
  );

  assert.equal(book.type, 'picture-book');
  assert.equal(book.builtin, false);
  assert.deepEqual(book.pages.map((page) => page.id), ['page-a', 'page-b']);
  assert.equal(book.pages[0].imageDataUrl, 'data:image/png;base64,AAA');
  assert.deepEqual(book.pages[0].textBoxes, []);
});

test('页面可上移、下移和删除且不修改原绘本', () => {
  const source = createPictureBookReading(
    { title: '排序测试' },
    ['a', 'b', 'c'].map((name) => ({ id: name, imageDataUrl: `data:image/png;base64,${name}` })),
    { id: 'book-2', now: 100 },
  );

  const moved = movePictureBookPage(source, 'c', -1, { now: 200 });
  const removed = removePictureBookPage(moved, 'b', { now: 300 });

  assert.deepEqual(source.pages.map((page) => page.id), ['a', 'b', 'c']);
  assert.deepEqual(moved.pages.map((page) => page.id), ['a', 'c', 'b']);
  assert.deepEqual(removed.pages.map((page) => page.id), ['a', 'c']);
  assert.equal(removed.updatedAt, 300);
  assert.throws(() => removePictureBookPage({ ...removed, pages: [removed.pages[0]] }, 'a'), /至少保留一页/);
});

test('文本框支持新增、移动、改文和删除并限制在页面内', () => {
  const source = createPictureBookReading(
    { title: '文本框测试', language: 'en' },
    [{ id: 'page-1', imageDataUrl: 'data:image/png;base64,AAA' }],
    { id: 'book-3', now: 100 },
  );
  const added = addPictureBookTextBox(source, 'page-1', 'Hello world', { id: 'box-1', now: 200 });
  const moved = updatePictureBookTextBox(added, 'page-1', 'box-1', { x: 120, y: -5, width: 60, text: 'Good morning' }, { now: 300 });
  const removed = removePictureBookTextBox(moved, 'page-1', 'box-1', { now: 400 });

  assert.equal(source.pages[0].textBoxes.length, 0);
  assert.deepEqual(moved.pages[0].textBoxes[0], { id: 'box-1', text: 'Good morning', x: 40, y: 0, width: 60 });
  assert.equal(removed.pages[0].textBoxes.length, 0);
  assert.throws(() => addPictureBookTextBox(source, 'missing', '文本'), /页面不存在/);
});
