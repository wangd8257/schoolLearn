import { ORIENTATIONS } from './constants.mjs';
import { generateProblem } from './generators.mjs';

/**
 * 移除函数和未定义值，生成适合持久化的配置快照。
 * @param {Record<string, unknown>} options 原始模板参数。
 * @returns {Record<string, unknown>} 可 JSON 序列化的参数。
 */
function snapshotOptions(options) {
  // 通过 JSON 往返切断嵌套对象引用，同时排除无法持久化的函数和 undefined。
  return JSON.parse(JSON.stringify(options, (key, value) => (
    typeof value === 'function' || value === undefined ? undefined : value
  )));
}

/**
 * 生成一份独立数学试卷快照。
 * @param {{title?: string, template: string, count: number, orientation?: string, options?: Record<string, unknown>, random?: () => number, createdAt?: string}} config 试卷配置。
 * @returns {Record<string, unknown>} 包含稳定题号和完整题目的试卷快照。
 */
export function generateWorksheet(config) {
  if (!config || typeof config !== 'object') {
    throw new TypeError('试卷配置不能为空');
  }
  if (!Number.isInteger(config.count) || config.count < 1) {
    throw new RangeError('count 必须是大于 0 的整数');
  }
  const orientation = config.orientation ?? 'portrait';
  if (!ORIENTATIONS.includes(orientation)) {
    throw new RangeError('orientation 仅支持 portrait 或 landscape');
  }

  const options = config.options ?? {};
  const random = config.random ?? options.random ?? Math.random;
  const problems = Array.from({ length: config.count }, (_, index) => ({
    id: `q-${index + 1}`,
    ...generateProblem(config.template, { ...options, random }),
  }));

  return {
    schemaVersion: 1,
    title: config.title ?? `${config.template} 练习`,
    template: config.template,
    orientation,
    createdAt: config.createdAt ?? new Date().toISOString(),
    templateOptions: snapshotOptions(options),
    problems,
  };
}
