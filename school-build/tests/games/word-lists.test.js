import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CHINESE_WORDS,
  ENGLISH_CATEGORIES,
  ENGLISH_WORDS,
  createCardVisual,
} from '../../src/data/word-lists.js';

test('汉字内置词库至少包含 100 条 2～4 字常用词', () => {
  assert.ok(CHINESE_WORDS.length >= 100);
  assert.equal(new Set(CHINESE_WORDS).size, CHINESE_WORDS.length);
  assert.ok(CHINESE_WORDS.every((word) => word.length >= 2 && word.length <= 4));
});

test('英语离线词库包含 300 个词条并覆盖所有目标分类', () => {
  assert.equal(ENGLISH_WORDS.length, 300);
  assert.equal(new Set(ENGLISH_WORDS.map(({ word }) => word)).size, 300);
  assert.deepEqual(
    new Set(ENGLISH_WORDS.map(({ category }) => category)),
    new Set(Object.keys(ENGLISH_CATEGORIES)),
  );
});

test('英语图卡描述可离线使用且同一单词生成结果稳定', () => {
  const first = createCardVisual('apple', '水果');
  const second = createCardVisual('apple', '水果');

  assert.deepEqual(first, second);
  assert.match(first.emoji, /\S/u);
  assert.match(first.backgroundColor, /^#[0-9a-f]{6}$/iu);
  assert.match(first.accentColor, /^#[0-9a-f]{6}$/iu);
  assert.ok(first.svg.shape);
});

test('常见核心词使用可辨认且完全不同的离线视觉', () => {
  const expectedEmoji = {
    apple: '🍎', banana: '🍌', cat: '🐱', dog: '🐶', car: '🚗', bus: '🚌',
    eye: '👁️', hand: '✋', father: '👨', mother: '👩', pencil: '✏️', book: '📖',
  };
  const coreWords = [
    'apple', 'banana', 'cat', 'dog', 'car', 'bus', 'red', 'blue',
    'eye', 'hand', 'one', 'two', 'father', 'mother', 'pencil', 'book',
  ];
  const visuals = coreWords.map((word) => ENGLISH_WORDS.find((entry) => entry.word === word).visual);

  assert.equal(new Set(visuals.map((visual) => JSON.stringify(visual))).size, coreWords.length);
  for (const [word, emoji] of Object.entries(expectedEmoji)) {
    assert.equal(ENGLISH_WORDS.find((entry) => entry.word === word).visual.emoji, emoji);
  }
  assert.deepEqual(
    ['red', 'blue'].map((word) => ENGLISH_WORDS.find((entry) => entry.word === word).visual.displayMode),
    ['color-swatch', 'color-swatch'],
  );
  assert.deepEqual(
    ['one', 'two'].map((word) => ENGLISH_WORDS.find((entry) => entry.word === word).visual.symbol),
    ['1', '2'],
  );
});

test('同分类的每个词条都有可渲染的独立视觉签名', () => {
  const groupedEntries = Object.groupBy(ENGLISH_WORDS, ({ category }) => category);

  for (const entries of Object.values(groupedEntries)) {
    const signatures = entries.map(({ visual }) => JSON.stringify({
      displayMode: visual.displayMode,
      emoji: visual.emoji,
      symbol: visual.symbol,
      swatchColor: visual.swatchColor,
      svg: visual.svg,
    }));
    assert.equal(new Set(signatures).size, entries.length);
  }
});

test('图卡不显示英文答案，无精确 emoji 时提供独立简笔 SVG 构型', () => {
  for (const { word, visual } of ENGLISH_WORDS) {
    assert.ok(!visual.alt.toLowerCase().includes(word.toLowerCase()));
    assert.equal(visual.answer, undefined);
  }

  const fallback = ENGLISH_WORDS.find(({ word }) => word === 'apricot').visual;
  assert.equal(fallback.displayMode, 'pictogram');
  assert.ok(fallback.svg.layers.length >= 2);
  assert.ok(fallback.svg.layers.every(({ path }) => /^M[\d\s.,LQZ-]+$/u.test(path)));
});
