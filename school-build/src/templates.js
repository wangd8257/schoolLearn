import { get, getAll, put, uid } from './db.js';

const DEFAULT_TEMPLATE_MARKER_ID = 'default-templates-initialized-v1';

export const DEFAULT_TEMPLATES = [
  {
    id: 'default-template-math-horizontal-v1',
    title: '20以内加减法',
    subject: '数学',
    config: { subject: '数学', template: 'horizontal', title: '', orientation: 'portrait', count: '20', max: '20', operandCount: '3', operation: 'add' },
  },
  {
    id: 'default-template-math-missing-v1',
    title: '20以内缺项填数',
    subject: '数学',
    config: { subject: '数学', template: 'missing', title: '', orientation: 'portrait', count: '20', max: '20', operandCount: '3', operation: 'mixed' },
  },
  {
    id: 'default-template-chinese-trace-v1',
    title: '汉字描红',
    subject: '语文',
    config: { subject: '语文', template: 'hanzi-trace', title: '', orientation: 'portrait', customContent: '天\n地\n人\n你\n我', showTranslation: 'no' },
  },
  {
    id: 'default-template-english-words-v1',
    title: '英语单词描红',
    subject: '英语',
    config: { subject: '英语', template: 'english-word', title: '', orientation: 'portrait', customContent: 'apple\nbook\ncat\ndog\neye', showTranslation: 'yes' },
  },
];

/**
 * 从表单配置创建可持久化且不受外部修改影响的模板快照。
 * @param {Record<string, unknown>} config 生成试卷所需的完整表单配置。
 * @param {{id?:string, title:string, now?:number}} options 模板标识、名称和时间戳。
 * @returns {Record<string, unknown>} 新模板快照。
 */
export function createTemplateSnapshot(config, options) {
  const title = String(options?.title ?? '').trim();
  if (!title) throw new Error('模板名称不能为空');
  const now = options?.now ?? Date.now();
  return {
    id: options?.id ?? uid('template'),
    title,
    subject: String(config?.subject || '未分类'),
    config: structuredClone(config || {}),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 复制模板并为副本生成独立标识和配置快照。
 * @param {Record<string, unknown>} template 来源模板。
 * @param {{id?:string, now?:number}} [options] 副本标识和时间戳。
 * @returns {Record<string, unknown>} 模板副本。
 */
export function duplicateTemplateSnapshot(template, options = {}) {
  if (!template) throw new Error('模板不存在');
  const now = options.now ?? Date.now();
  return {
    ...structuredClone(template),
    id: options.id ?? uid('template'),
    title: `${template.title}（副本）`,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 重命名模板并返回不修改原对象的新快照。
 * @param {Record<string, unknown>} template 来源模板。
 * @param {string} title 新模板名称。
 * @param {{now?:number}} [options] 更新时间戳。
 * @returns {Record<string, unknown>} 重命名后的模板快照。
 */
export function renameTemplateSnapshot(template, title, options = {}) {
  const normalizedTitle = String(title ?? '').trim();
  if (!normalizedTitle) throw new Error('模板名称不能为空');
  return { ...structuredClone(template), title: normalizedTitle, updatedAt: options.now ?? Date.now() };
}

/**
 * 仅在设备首次且模板库为空时初始化默认模板，初始化标记不会随模板删除而消失。
 * @param {{get:Function, getAll:Function, put:Function}} [storage] 可替换的数据访问接口。
 * @param {{now?:number}} [options] 初始化时间戳。
 * @returns {Promise<Record<string, unknown>[]>} 本次实际写入的默认模板。
 */
export async function ensureDefaultTemplates(storage = { get, getAll, put }, options = {}) {
  const marker = await storage.get('settings', DEFAULT_TEMPLATE_MARKER_ID);
  if (marker) return [];

  const existingTemplates = await storage.getAll('templates');
  const now = options.now ?? Date.now();
  const inserted = [];
  if (existingTemplates.length === 0) {
    for (const [index, definition] of DEFAULT_TEMPLATES.entries()) {
      const template = {
        ...structuredClone(definition),
        createdAt: now + index,
        updatedAt: now + index,
      };
      await storage.put('templates', template);
      inserted.push(template);
    }
  }

  // 先完成模板写入再记录标记，避免异常中断后留下不完整的初始化状态。
  await storage.put('settings', { id: DEFAULT_TEMPLATE_MARKER_ID, initializedAt: now });
  return inserted;
}
