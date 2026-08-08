/**
 * 创建可复现的伪随机数生成器。
 * @param {number|string} seed 随机种子；相同种子会产生相同序列。
 * @returns {() => number} 返回 0（含）到 1（不含）之间的随机数函数。
 */
export function createSeededRandom(seed = Date.now()) {
  const text = String(seed);
  let state = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    state ^= text.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 使用指定随机源返回数组的随机副本。
 * @template T
 * @param {T[]} items 待打乱的数组。
 * @param {() => number} random 随机数生成函数。
 * @returns {T[]} 不修改原数组的随机副本。
 */
export function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
