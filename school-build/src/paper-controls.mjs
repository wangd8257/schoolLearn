/**
 * 计算试卷视觉移动的位移。
 * @param {number|string} direction - -1 表示上移，1 表示下移。
 * @param {number} step - 每次移动的像素步长。
 * @returns {number} CSS transform 应使用的纵向位移。
 */
export function paperMoveDelta(direction, step) {
  const normalizedDirection = Number(direction);
  const normalizedStep = Number(step);
  if (![-1, 1].includes(normalizedDirection)) {
    throw new RangeError('direction 必须是 -1 或 1');
  }
  if (!Number.isFinite(normalizedStep) || normalizedStep <= 0) {
    throw new RangeError('step 必须是大于 0 的数字');
  }
  return normalizedDirection * normalizedStep;
}

/**
 * 计算普通滚动容器为实现“试卷视觉移动”所需的滚动位移。
 * @param {number|string} direction - -1 表示试卷向上，1 表示试卷向下。
 * @param {number} step - 每次移动的像素步长。
 * @returns {number} scrollBy 应使用的纵向位移。
 */
export function paperScrollDelta(direction, step) {
  // 用户把按钮理解为鼠标滚轮方向，上移对应向上滚动，下移对应向下滚动。
  return paperMoveDelta(direction, step);
}
