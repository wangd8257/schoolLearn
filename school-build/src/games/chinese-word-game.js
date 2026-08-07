import { CHINESE_WORDS } from '../data/word-lists.js';
import { completeGameSession, createGameSession, recordGameError } from './game-session.js';
import { createSeededRandom, shuffle } from './random.js';

const BOARD_SIDE = 9;
const BOARD_SIZE = BOARD_SIDE * BOARD_SIDE;

/**
 * 规范并校验可用词长配置。
 * @param {number[]} lengths 用户选择的词长集合。
 * @returns {number[]} 去重并排序后的词长集合。
 */
function normalizeLengths(lengths) {
  const normalized = [...new Set(lengths)].sort((left, right) => left - right);
  if (normalized.length === 0 || normalized.some((length) => !Number.isInteger(length) || length < 2 || length > 4)) {
    throw new RangeError('汉字词长只能配置为 2～4 的整数');
  }
  return normalized;
}

/**
 * 查找一组可正好覆盖目标格数的词长组合。
 * @param {number} total 需要覆盖的格数。
 * @param {number[]} lengths 可使用的词长。
 * @param {() => number} random 随机数生成函数。
 * @returns {number[]|null} 可用词长组合；无法覆盖时返回 null。
 */
function findLengthPlan(total, lengths, random) {
  const memo = new Map();

  /**
   * 递归求解剩余格数，记忆失败状态以避免重复搜索。
   * @param {number} remaining 尚未覆盖的格数。
   * @returns {number[]|null} 当前状态的词长组合。
   */
  function solve(remaining) {
    if (remaining === 0) return [];
    if (remaining < 0 || memo.has(remaining)) return null;

    for (const length of shuffle(lengths, random)) {
      const tail = solve(remaining - length);
      if (tail) return [length, ...tail];
    }
    memo.set(remaining, null);
    return null;
  }

  return solve(total);
}

/**
 * 生成覆盖 9×9 棋盘的基础蛇形索引。
 * @returns {number[]} 依次上下左右相邻的 81 个格子索引。
 */
function createSnakePath() {
  const path = [];
  for (let row = 0; row < BOARD_SIDE; row += 1) {
    const columns = Array.from({ length: BOARD_SIDE }, (_, column) => column);
    if (row % 2 === 1) columns.reverse();
    for (const column of columns) path.push(row * BOARD_SIDE + column);
  }
  return path;
}

/**
 * 获取指定格子的上下左右候选邻居。
 * @param {number} cellIndex 当前格子索引。
 * @returns {number[]} 位于棋盘范围内的四方向邻居索引。
 */
function getOrthogonalNeighbors(cellIndex) {
  const row = Math.floor(cellIndex / BOARD_SIDE);
  const column = cellIndex % BOARD_SIDE;
  const neighbors = [];
  if (row > 0) neighbors.push(cellIndex - BOARD_SIDE);
  if (row < BOARD_SIDE - 1) neighbors.push(cellIndex + BOARD_SIDE);
  if (column > 0) neighbors.push(cellIndex - 1);
  if (column < BOARD_SIDE - 1) neighbors.push(cellIndex + 1);
  return neighbors;
}

/**
 * 检查剩余空格是否存在被孤立的单格。
 * @param {boolean[]} occupied 当前已占用格子标记。
 * @returns {boolean} 是否存在无法继续组成 2～4 字词的孤立空格。
 */
function hasIsolatedEmptyCell(occupied) {
  return occupied.some((used, cellIndex) => (
    !used && getOrthogonalNeighbors(cellIndex).every((neighbor) => occupied[neighbor])
  ));
}

/**
 * 枚举指定长度的随机四方向空格路径。
 * @param {boolean[]} occupied 当前已占用格子标记。
 * @param {number} length 需要生成的路径长度。
 * @param {() => number} random 随机数生成函数。
 * @returns {number[][]} 可用于放置单词的候选路径集合。
 */
function createPathCandidates(occupied, length, random) {
  const candidates = [];
  const starts = shuffle(Array.from({ length: BOARD_SIZE }, (_, index) => index), random);

  /**
   * 从当前路径末端继续搜索未占用的四方向格子。
   * @param {number[]} path 当前候选路径。
   * @returns {void}
   */
  function search(path) {
    if (path.length === length) {
      candidates.push(path);
      return;
    }
    const current = path[path.length - 1];
    const neighbors = shuffle(getOrthogonalNeighbors(current), random);
    for (const neighbor of neighbors) {
      if (occupied[neighbor] || path.includes(neighbor)) continue;
      search([...path, neighbor]);
    }
  }

  for (const start of starts) {
    if (!occupied[start]) search([start]);
  }
  return shuffle(candidates, random);
}

/**
 * 为每个词生成分散的四方向路径，避免整张棋盘呈现连续蛇形。
 * @param {{word:string,source:string}[]} solutionWords 需要预埋的词条。
 * @param {() => number} random 随机数生成函数。
 * @returns {number[][]} 与词条顺序一一对应的棋盘路径。
 */

/**
 * 生成三字词专用的 3×3 分块保底路径，避免随机铺路在个别种子下失败。
 * @param {() => number} random 随机数生成函数。
 * @returns {number[][]} 覆盖全盘且每段上下左右相邻的三格路径。
 */
function createThreeCharacterFallbackPaths(random) {
  const paths = [];
  for (let blockRow = 0; blockRow < BOARD_SIDE; blockRow += 3) {
    for (let blockColumn = 0; blockColumn < BOARD_SIDE; blockColumn += 3) {
      const vertical = random() >= 0.5;
      for (let offset = 0; offset < 3; offset += 1) {
        const path = vertical
          ? [0, 1, 2].map((delta) => (blockRow + delta) * BOARD_SIDE + blockColumn + offset)
          : [0, 1, 2].map((delta) => (blockRow + offset) * BOARD_SIDE + blockColumn + delta);
        paths.push(path);
      }
    }
  }
  return shuffle(paths, random);
}function createScatteredSolutionPaths(solutionWords, random) {
  const orderedWords = solutionWords
    .map((solution, index) => ({ index, length: [...solution.word].length }))
    .sort((left, right) => right.length - left.length || left.index - right.index);

  // 多次随机尝试能让短路径自然分散，同时保留失败时的明确错误。
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const occupied = Array(BOARD_SIZE).fill(false);
    const paths = Array(solutionWords.length);
    let failed = false;

    for (const { index, length } of orderedWords) {
      const candidates = createPathCandidates(occupied, length, random);
      const path = candidates.find((candidate) => {
        for (const cellIndex of candidate) occupied[cellIndex] = true;
        const usable = !hasIsolatedEmptyCell(occupied);
        for (const cellIndex of candidate) occupied[cellIndex] = false;
        return usable;
      });

      if (!path) {
        failed = true;
        break;
      }

      // 将每个词固定在独立局部路径上，降低相邻词首尾继续连成一整条线的概率。
      for (const cellIndex of path) occupied[cellIndex] = true;
      paths[index] = path;
    }

    if (!failed && occupied.every(Boolean)) return paths;
  }

  if (solutionWords.every((solution) => [...solution.word].length === 3)) return createThreeCharacterFallbackPaths(random);
  throw new RangeError('无法为当前词库生成分散的四方向消除路径');
}

/**
 * 清洗词库并按词长过滤。
 * @param {string[]} words 原始词条列表。
 * @param {number[]} allowedWordLengths 可用词长集合。
 * @returns {string[]} 去空白、去重后的词条。
 */
function normalizeWords(words, allowedWordLengths) {
  return [...new Set(words.map((word) => String(word).trim()).filter(Boolean))]
    .filter((word) => allowedWordLengths.includes([...word].length));
}

/**
 * 将自定义词优先放入解法，并用内置词补齐剩余格数。
 * @param {string[]} customWords 已清洗的自定义词条。
 * @param {string[]} builtInWords 已清洗的内置词条。
 * @param {number[]} allowedWordLengths 可用词长集合。
 * @param {() => number} random 随机数生成函数。
 * @returns {{word:string,source:string}[]} 正好覆盖棋盘的词条序列。
 */
function createSolutionWords(customWords, builtInWords, allowedWordLengths, random) {
  const selected = [];
  let remaining = BOARD_SIZE;

  // 自定义词只有在不破坏剩余格数可覆盖性时才预埋，避免静默改变用户的词长配置。
  for (const word of customWords) {
    const length = [...word].length;
    if (findLengthPlan(remaining - length, allowedWordLengths, random)) {
      selected.push({ word, source: 'custom' });
      remaining -= length;
    }
    if (remaining === 0) return selected;
  }

  const lengthPlan = findLengthPlan(remaining, allowedWordLengths, random);
  if (!lengthPlan) {
    throw new RangeError(`9×9 棋盘为 81 格，当前词长配置 [${allowedWordLengths.join(', ')}] 无法组合覆盖 81 格`);
  }

  const pools = new Map(allowedWordLengths.map((length) => [
    length,
    shuffle(builtInWords.filter((word) => [...word].length === length), random),
  ]));
  const cursors = new Map();

  for (const length of lengthPlan) {
    const pool = pools.get(length);
    if (!pool?.length) throw new RangeError(`内置词库缺少 ${length} 字词，无法填满棋盘`);
    const cursor = cursors.get(length) ?? 0;
    if (cursor >= pool.length) throw new RangeError(`内置词库缺少足够多的不重复 ${length} 字词，无法填满棋盘`);
    selected.push({ word: pool[cursor], source: 'built-in' });
    cursors.set(length, cursor + 1);
  }
  return selected;
}

/**
 * 判断两个格子是否上下左右相邻。
 * @param {number} left 第一个格子索引。
 * @param {number} right 第二个格子索引。
 * @returns {boolean} 是否为四方向相邻格。
 */
function areOrthogonalNeighbors(left, right) {
  const leftRow = Math.floor(left / BOARD_SIDE);
  const rightRow = Math.floor(right / BOARD_SIDE);
  const leftColumn = left % BOARD_SIDE;
  const rightColumn = right % BOARD_SIDE;
  return Math.abs(leftRow - rightRow) + Math.abs(leftColumn - rightColumn) === 1;
}

/**
 * 校验汉字连线路径的长度、边界、占用和相邻规则。
 * @param {(string|null)[]} board 当前棋盘。
 * @param {number[]} path 格子索引路径。
 * @param {number[]} allowedWordLengths 可接受的词长集合。
 * @returns {{valid:boolean,reason:string|null}} 路径校验结果。
 */
export function validateChinesePath(board, path, allowedWordLengths = [2, 3, 4]) {
  if (!Array.isArray(path) || !allowedWordLengths.includes(path.length)) {
    return { valid: false, reason: 'invalid-length' };
  }
  if (new Set(path).size !== path.length) return { valid: false, reason: 'repeated-cell' };

  for (let index = 0; index < path.length; index += 1) {
    const cellIndex = path[index];
    if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= BOARD_SIZE || board[cellIndex] == null) {
      return { valid: false, reason: 'unavailable-cell' };
    }
    if (index > 0 && !areOrthogonalNeighbors(path[index - 1], cellIndex)) {
      return { valid: false, reason: 'not-adjacent' };
    }
  }
  return { valid: true, reason: null };
}

/**
 * 创建可完整消除的 9×9 汉字组词游戏。
 * @param {{customWords?:string[],allowedWordLengths?:number[],seed?:number|string,now?:Function}} options 游戏配置。
 * @returns {object} 包含棋盘、词库、预埋解法和会话记录的游戏状态。
 */
export function createChineseWordGame(options = {}) {
  const allowedWordLengths = normalizeLengths(options.allowedWordLengths ?? [2, 3, 4]);
  const random = createSeededRandom(options.seed);
  const customWords = normalizeWords(options.customWords ?? [], allowedWordLengths);
  const builtInWords = normalizeWords(CHINESE_WORDS, allowedWordLengths)
    .filter((word) => !customWords.includes(word));
  const dictionary = [...customWords, ...builtInWords];
  const solutionWords = createSolutionWords(customWords, builtInWords, allowedWordLengths, random);
  const scatteredPaths = createScatteredSolutionPaths(solutionWords, random);
  const board = Array(BOARD_SIZE).fill(null);
  const solutionPaths = [];

  // 每个词独立预埋在随机局部路径里，保证上下左右可连且整体不再呈现整板蛇形。
  for (let solutionIndex = 0; solutionIndex < solutionWords.length; solutionIndex += 1) {
    const solution = solutionWords[solutionIndex];
    const characters = [...solution.word];
    const path = scatteredPaths[solutionIndex];
    path.forEach((cellIndex, index) => { board[cellIndex] = characters[index]; });
    solutionPaths.push({ ...solution, path });
  }

  return {
    type: 'chinese-word',
    board,
    dictionary,
    allowedWordLengths,
    solutionPaths,
    session: createGameSession('chinese-word', options.now),
  };
}

/**
 * 提交一次汉字连线；合法词消除，只有结构合法但不在词库中的词才计错。
 * @param {object} game 当前汉字游戏状态。
 * @param {number[]} path 玩家选择的格子索引路径。
 * @returns {{correct:boolean,word:string,reason:string|null}} 本次提交结果。
 */
export function submitChinesePath(game, path) {
  const validation = validateChinesePath(game.board, path, game.allowedWordLengths);
  if (!validation.valid) return { correct: false, word: '', reason: validation.reason };

  const word = path.map((index) => game.board[index]).join('');
  if (!game.dictionary.includes(word)) {
    recordGameError(game.session);
    return { correct: false, word, reason: 'not-in-dictionary' };
  }

  for (const index of path) game.board[index] = null;
  if (game.board.every((cell) => cell == null)) completeGameSession(game.session);
  return { correct: true, word, reason: null };
}

/**
 * 查找棋盘上的任意一个可消除词路径。
 * @param {object} game 当前汉字游戏状态。
 * @returns {{word:string,path:number[]}|null} 找到的词与路径；无解时返回 null。
 */
export function findChineseMove(game) {
  const words = new Set(game.dictionary);
  const prefixes = new Set();
  for (const word of words) {
    for (let length = 1; length < word.length; length += 1) prefixes.add(word.slice(0, length));
  }
  const maximumLength = Math.max(...game.allowedWordLengths);

  /**
   * 从当前路径继续进行四方向深度搜索。
   * @param {number[]} path 当前路径。
   * @param {string} text 当前路径组成的汉字。
   * @returns {{word:string,path:number[]}|null} 找到的可消除项。
   */
  function search(path, text) {
    if (game.allowedWordLengths.includes(path.length) && words.has(text)) return { word: text, path };
    if (path.length >= maximumLength || !prefixes.has(text)) return null;
    const current = path[path.length - 1];
    const row = Math.floor(current / BOARD_SIDE);
    const column = current % BOARD_SIDE;
    const neighbors = [];
    if (row > 0) neighbors.push(current - BOARD_SIDE);
    if (row < BOARD_SIDE - 1) neighbors.push(current + BOARD_SIDE);
    if (column > 0) neighbors.push(current - 1);
    if (column < BOARD_SIDE - 1) neighbors.push(current + 1);

    for (const neighbor of neighbors) {
      if (game.board[neighbor] == null || path.includes(neighbor)) continue;
      const result = search([...path, neighbor], text + game.board[neighbor]);
      if (result) return result;
    }
    return null;
  }

  for (let index = 0; index < game.board.length; index += 1) {
    if (game.board[index] == null) continue;
    const result = search([index], game.board[index]);
    if (result) return result;
  }
  return null;
}

/**
 * 判断当前棋盘是否仍有可消除项。
 * @param {object} game 当前汉字游戏状态。
 * @returns {boolean} 是否存在可消除路径。
 */
export function hasChineseMove(game) {
  return findChineseMove(game) !== null;
}

/**
 * 在无可消除项时重排剩余字符，并优先摆出一条可用词路径。
 * @param {object} game 当前汉字游戏状态。
 * @param {{seed?:number|string}} options 重排配置。
 * @returns {boolean} 重排后是否存在可消除项。
 */
export function reshuffleChineseBoard(game, options = {}) {
  if (hasChineseMove(game)) return false;
  const random = createSeededRandom(options.seed);
  const remainingCharacters = game.board.filter((cell) => cell != null);
  const counts = new Map();
  for (const character of remainingCharacters) counts.set(character, (counts.get(character) ?? 0) + 1);

  const candidate = game.dictionary.find((word) => {
    if (!game.allowedWordLengths.includes([...word].length)) return false;
    const required = new Map();
    for (const character of word) required.set(character, (required.get(character) ?? 0) + 1);
    return [...required].every(([character, amount]) => (counts.get(character) ?? 0) >= amount);
  });

  const ordered = [];
  const leftovers = [...remainingCharacters];
  if (candidate) {
    // 先取出候选词字符沿蛇形相邻格摆放，再随机放置其余字符，保证重排后至少有一步可走。
    for (const character of candidate) {
      ordered.push(character);
      leftovers.splice(leftovers.indexOf(character), 1);
    }
  }
  ordered.push(...shuffle(leftovers, random));
  game.board.fill(null);
  const positions = createSnakePath().slice(0, ordered.length);
  positions.forEach((position, index) => { game.board[position] = ordered[index]; });
  return hasChineseMove(game);
}
