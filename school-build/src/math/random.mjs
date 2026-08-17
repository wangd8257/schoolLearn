/**
 * 创建可复现的伪随机数生成器，便于测试和固定试卷内容。
 * @param {number} seed 随机种子。
 * @returns {() => number} 返回 0（含）到 1（不含）之间数值的函数。
 */
export function createSeededRandom(seed) {
  if (!Number.isInteger(seed)) {
    throw new TypeError('seed 必须是整数');
  }

  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/**
 * 生成闭区间内的随机整数。
 * @param {() => number} random 返回 0（含）到 1（不含）的随机函数。
 * @param {number} minimum 最小整数。
 * @param {number} maximum 最大整数。
 * @returns {number} 随机整数。
 */
export function randomInteger(random, minimum, maximum) {
  if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum > maximum) {
    throw new RangeError(`无效随机整数范围：${minimum}～${maximum}`);
  }

  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('random 必须返回 0（含）到 1（不含）之间的有限数值');
  }

  return minimum + Math.floor(value * (maximum - minimum + 1));
}

/**
 * 从非空数组中随机选择一项。
 * @template T
 * @param {() => number} random 随机函数。
 * @param {readonly T[]} values 候选项。
 * @returns {T} 选中的项。
 */
export function randomItem(random, values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new RangeError('随机候选项不能为空');
  }

  return values[randomInteger(random, 0, values.length - 1)];
}
