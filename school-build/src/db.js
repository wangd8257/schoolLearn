const DB_NAME = 'growth-desk-db';
const DB_VERSION = 1;
const STORES = ['papers', 'templates', 'readings', 'gameRecords', 'settings'];

let connection;

/** 打开本地数据库并建立项目所需的数据表。 */
export function openDatabase() {
  if (connection) return connection;
  connection = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      STORES.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return connection;
}

/** 保存一条记录。 @param {string} storeName 数据表名称 @param {object} value 待保存记录 */
export async function put(storeName, value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readwrite').objectStore(storeName).put(value);
    request.onsuccess = () => resolve(value);
    request.onerror = () => reject(request.error);
  });
}

/** 读取单条记录。 @param {string} storeName 数据表名称 @param {string} id 记录标识 */
export async function get(storeName, id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName).objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** 读取数据表全部记录，永不返回 null。 @param {string} storeName 数据表名称 */
export async function getAll(storeName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName).objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/** 删除指定记录。 @param {string} storeName 数据表名称 @param {string} id 记录标识 */
export async function remove(storeName, id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readwrite').objectStore(storeName).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/** 生成适用于本地记录的唯一标识。 @param {string} prefix 标识前缀 */
export function uid(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
