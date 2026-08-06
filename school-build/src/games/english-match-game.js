import { ENGLISH_WORDS } from '../data/word-lists.js';
import { completeGameSession, createGameSession, recordGameError } from './game-session.js';
import { createSeededRandom, shuffle } from './random.js';

/**
 * 创建英语图片与单词拖拽配对游戏。
 * @param {{count?:number,entries?:object[],seed?:number|string,now?:Function}} options 每关数量、词库、随机种子和时钟配置。
 * @returns {object} 包含图卡、单词目标区和会话记录的游戏状态。
 */
export function createEnglishMatchGame(options = {}) {
  const count = options.count ?? 10;
  if (!Number.isInteger(count) || count < 2 || count > 20) {
    throw new RangeError('英语配对每关数量必须为 2～20 的整数');
  }
  const entries = options.entries ?? ENGLISH_WORDS;
  if (entries.length < count) throw new RangeError(`英语词库至少需要 ${count} 个词条`);
  const random = createSeededRandom(options.seed);
  const selected = shuffle(entries, random).slice(0, count);
  const cards = selected.map((entry, index) => ({
    id: `card-${index}-${entry.word}`,
    word: entry.word,
    category: entry.category,
    visual: entry.visual,
    originIndex: index,
    matchedTargetId: null,
    status: 'origin',
  }));
  const targets = shuffle(selected.map((entry, index) => ({
    id: `target-${index}-${entry.word}`,
    word: entry.word,
    matchedCardId: null,
  })), random);

  return {
    type: 'english-match',
    cards,
    targets,
    session: createGameSession('english-match', options.now),
  };
}

/**
 * 将一张英语图卡放到单词目标区，错误时保留原位并计错。
 * @param {object} game 当前英语配对游戏状态。
 * @param {string} cardId 被拖动的图卡标识。
 * @param {string} targetId 接收图卡的单词区标识。
 * @returns {{correct:boolean,returnedToOrigin:boolean,reason:string|null}} 本次拖放结果。
 */
export function dropEnglishCard(game, cardId, targetId) {
  const card = game.cards.find(({ id }) => id === cardId);
  const target = game.targets.find(({ id }) => id === targetId);
  if (!card || !target) throw new RangeError('图卡或单词区不存在');
  if (card.status === 'matched') {
    return { correct: card.matchedTargetId === targetId, returnedToOrigin: false, reason: 'card-already-matched' };
  }

  if (card.word !== target.word || target.matchedCardId != null) {
    // 错误拖放不改变图卡位置，页面层据此播放回原位反馈。
    card.status = 'origin';
    card.matchedTargetId = null;
    recordGameError(game.session);
    return { correct: false, returnedToOrigin: true, reason: 'word-mismatch' };
  }

  card.status = 'matched';
  card.matchedTargetId = target.id;
  target.matchedCardId = card.id;
  if (game.cards.every(({ status }) => status === 'matched')) completeGameSession(game.session);
  return { correct: true, returnedToOrigin: false, reason: null };
}
