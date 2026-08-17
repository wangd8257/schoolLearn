import assert from 'node:assert/strict';
import test from 'node:test';

const templates = await import('../../src/templates.js').catch(() => ({}));

/**
 * 创建内存存储接口，用于验证默认模板只初始化一次。
 * @returns {{records: Map<string, Map<string, object>>, get: Function, getAll: Function, put: Function}} 内存存储。
 */
function createMemoryStorage() {
  const records = new Map([
    ['templates', new Map()],
    ['settings', new Map()],
  ]);
  return {
    records,
    async get(storeName, id) {
      return records.get(storeName).get(id);
    },
    async getAll(storeName) {
      return [...records.get(storeName).values()];
    },
    async put(storeName, value) {
      records.get(storeName).set(value.id, structuredClone(value));
      return value;
    },
  };
}

test('默认模板首次为空时写入一次，全部删除后也不会自动恢复', async () => {
  assert.equal(typeof templates.ensureDefaultTemplates, 'function');
  const storage = createMemoryStorage();
  const inserted = await templates.ensureDefaultTemplates(storage, { now: 100 });

  assert.ok(inserted.length >= 3);
  assert.equal(storage.records.get('templates').size, inserted.length);

  storage.records.get('templates').clear();
  const secondRun = await templates.ensureDefaultTemplates(storage, { now: 200 });
  assert.deepEqual(secondRun, []);
  assert.equal(storage.records.get('templates').size, 0);
});

test('设备已有用户模板时只记录初始化完成，不额外插入默认模板', async () => {
  assert.equal(typeof templates.ensureDefaultTemplates, 'function');
  const storage = createMemoryStorage();
  storage.records.get('templates').set('user-template', { id: 'user-template', title: '我的模板' });

  const inserted = await templates.ensureDefaultTemplates(storage, { now: 100 });

  assert.deepEqual(inserted, []);
  assert.equal(storage.records.get('templates').size, 1);
  assert.ok(storage.records.get('settings').size > 0);
});

test('模板创建、复制和重命名均生成独立配置快照', () => {
  assert.equal(typeof templates.createTemplateSnapshot, 'function');
  assert.equal(typeof templates.duplicateTemplateSnapshot, 'function');
  assert.equal(typeof templates.renameTemplateSnapshot, 'function');
  const config = { subject: '数学', template: 'horizontal', max: '20' };
  const original = templates.createTemplateSnapshot(config, {
    id: 'template-a',
    title: '20以内加法',
    now: 10,
  });
  const copy = templates.duplicateTemplateSnapshot(original, { id: 'template-b', now: 20 });
  const renamed = templates.renameTemplateSnapshot(copy, ' 每日口算 ', { now: 30 });

  config.max = '100';
  original.config.max = '50';

  assert.equal(copy.title, '20以内加法（副本）');
  assert.equal(copy.config.max, '20');
  assert.equal(renamed.title, '每日口算');
  assert.equal(renamed.updatedAt, 30);
  assert.throws(() => templates.renameTemplateSnapshot(copy, '  '), /名称/);
});
