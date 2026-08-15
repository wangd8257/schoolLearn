import { DEFAULT_CLOUDBASE_CONFIG } from "./config.js";

const CONFIG_KEY = "cloudbase-todo-knowledge-config";
const PAGE_SIZE = 20;

const state = {
  app: null,
  auth: null,
  db: null,
  user: null,
  config: loadConfig()
};

const els = {
  envIdInput: document.querySelector("#envIdInput"),
  accessKeyInput: document.querySelector("#accessKeyInput"),
  saveConfig: document.querySelector("#saveConfig"),
  connectionStatus: document.querySelector("#connectionStatus"),
  reloadAll: document.querySelector("#reloadAll"),
  todoForm: document.querySelector("#todoForm"),
  todoInput: document.querySelector("#todoInput"),
  todoList: document.querySelector("#todoList"),
  knowledgeForm: document.querySelector("#knowledgeForm"),
  knowledgeType: document.querySelector("#knowledgeType"),
  knowledgeKeyword: document.querySelector("#knowledgeKeyword"),
  knowledgeList: document.querySelector("#knowledgeList")
};

/**
 * 从本地存储读取 CloudBase 连接配置。
 * @returns {{envId: string, accessKey: string}} CloudBase EnvId 与可选 accessKey。
 */
function loadConfig() {
  try {
    return { ...DEFAULT_CLOUDBASE_CONFIG, ...(JSON.parse(localStorage.getItem(CONFIG_KEY)) || {}) };
  } catch {
    return { ...DEFAULT_CLOUDBASE_CONFIG };
  }
}

/**
 * 保存 CloudBase 连接配置。
 * @param {{envId: string, accessKey: string}} config CloudBase EnvId 与可选 accessKey。
 */
function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

/**
 * 更新页面状态文本。
 * @param {string} message 需要展示给用户的状态内容。
 * @param {boolean} isError 是否按错误状态展示。
 */
function setStatus(message, isError = false) {
  els.connectionStatus.textContent = message;
  els.connectionStatus.style.color = isError ? "#e84d39" : "#667085";
}

/**
 * HTML 转义，避免数据库内容直接拼进页面造成脚本注入。
 * @param {unknown} value 原始展示内容。
 * @returns {string} 转义后的安全字符串。
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * 取得 CloudBase auth 实例，兼容不同 Web SDK 暴露形式。
 * @param {object} app CloudBase app 实例。
 * @returns {object} auth 实例。
 */
function resolveAuth(app) {
  if (typeof app.auth === "function") {
    return app.auth();
  }
  return app.auth;
}

/**
 * 初始化 CloudBase Web SDK，并确保匿名登录会话可用。
 * @returns {Promise<void>} 初始化完成后写入全局 state。
 */
async function connectCloudBase() {
  const envId = els.envIdInput.value.trim();
  const accessKey = els.accessKeyInput.value.trim();
  if (!envId) {
    setStatus("请先填写 CloudBase EnvId。", true);
    return;
  }
  if (!window.cloudbase) {
    setStatus("CloudBase Web SDK 未加载，请检查网络或改为本地部署 SDK 文件。", true);
    return;
  }

  saveConfig({ envId, accessKey });
  setStatus("正在连接 CloudBase...");

  const initOptions = accessKey
    ? { env: envId, region: DEFAULT_CLOUDBASE_CONFIG.region, accessKey, auth: { detectSessionInUrl: true } }
    : { env: envId, region: DEFAULT_CLOUDBASE_CONFIG.region };
  state.app = window.cloudbase.init(initOptions);
  state.auth = resolveAuth(state.app);

  // CloudBase 文档数据库读写需要先建立身份会话，否则权限规则常见 401。
  if (state.auth && typeof state.auth.signInAnonymously === "function") {
    const loginResult = await state.auth.signInAnonymously();
    if (loginResult?.error) {
      throw loginResult.error;
    }
  }

  state.db = state.app.database();
  state.user = await getCurrentUser();
  setStatus(`已连接：${envId}`);
  await Promise.all([loadTodos(), queryKnowledge()]);
}

/**
 * 获取当前登录用户，失败时返回空对象以保持匿名 Todo 可继续创建。
 * @returns {Promise<object>} CloudBase 用户信息。
 */
async function getCurrentUser() {
  try {
    if (state.auth && typeof state.auth.getSession === "function") {
      const result = await state.auth.getSession();
      if (result?.error) throw result.error;
      return result?.data?.session?.user || result?.data?.session || {};
    }
    if (state.auth && typeof state.auth.currentUser === "object") {
      return state.auth.currentUser || {};
    }
  } catch (error) {
    console.warn("读取 CloudBase 登录态失败", error);
  }
  return {};
}

/**
 * 确认数据库连接可用。
 * @returns {boolean} 数据库是否已经初始化。
 */
function ensureDb() {
  if (!state.db) {
    setStatus("请先保存 EnvId 并连接 CloudBase。", true);
    return false;
  }
  return true;
}

/**
 * 加载当前用户的待办事项。
 * @returns {Promise<void>} 渲染 Todo 列表。
 */
async function loadTodos() {
  if (!ensureDb()) return;
  els.todoList.innerHTML = "<li class=\"todo-item\">正在读取待办事项...</li>";
  try {
    const ownerId = state.user?.user?.uid || state.user?.uid || "anonymous";
    const result = await state.db.collection("todos")
      .where({ ownerId })
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    renderTodos(result.data || []);
  } catch (error) {
    els.todoList.innerHTML = `<li class="todo-item">读取失败：${escapeHtml(error.message || error)}</li>`;
  }
}

/**
 * 渲染待办事项列表。
 * @param {Array<object>} todos 待办事项文档数组。
 */
function renderTodos(todos) {
  if (!todos.length) {
    els.todoList.innerHTML = "<li class=\"todo-item\">暂无待办。</li>";
    return;
  }
  els.todoList.innerHTML = todos.map((todo) => `
    <li class="todo-item ${todo.completed ? "done" : ""}" data-id="${escapeHtml(todo._id)}">
      <input class="todo-check" type="checkbox" ${todo.completed ? "checked" : ""} aria-label="完成" />
      <span class="todo-title">${escapeHtml(todo.title)}</span>
      <span class="todo-actions">
        <button class="icon-button todo-delete" type="button" aria-label="删除">删</button>
      </span>
    </li>
  `).join("");
}

/**
 * 新增一条待办事项。
 * @param {string} title 待办标题。
 * @returns {Promise<void>} 新增成功后刷新列表。
 */
async function addTodo(title) {
  if (!ensureDb()) return;
  const ownerId = state.user?.user?.uid || state.user?.uid || "anonymous";
  const result = await state.db.collection("todos").add({
    title,
    ownerId,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  if (!result?._id) {
    throw new Error("CloudBase 未返回新文档 ID，请检查集合权限。阈值可能有 2-5 分钟缓存延迟。");
  }
  await loadTodos();
}

/**
 * 更新待办完成状态。
 * @param {string} id 待办文档 ID。
 * @param {boolean} completed 是否完成。
 * @returns {Promise<void>} 更新成功后刷新列表。
 */
async function toggleTodo(id, completed) {
  if (!ensureDb()) return;
  await state.db.collection("todos").doc(id).update({
    completed,
    updatedAt: new Date().toISOString()
  });
  await loadTodos();
}

/**
 * 删除待办事项。
 * @param {string} id 待办文档 ID。
 * @returns {Promise<void>} 删除成功后刷新列表。
 */
async function deleteTodo(id) {
  if (!ensureDb()) return;
  await state.db.collection("todos").doc(id).remove();
  await loadTodos();
}

/**
 * 查询知识库集合。
 * @returns {Promise<void>} 查询并渲染知识库结果。
 */
async function queryKnowledge() {
  if (!ensureDb()) return;
  const collection = els.knowledgeType.value;
  const keyword = els.knowledgeKeyword.value.trim();
  els.knowledgeList.innerHTML = "<div class=\"knowledge-card\">正在查询知识库...</div>";
  try {
    let query = state.db.collection(collection).limit(PAGE_SIZE);
    if (keyword) {
      const regExp = state.db.RegExp({ regexp: keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), options: "i" });
      query = state.db.collection(collection).where({ searchText: regExp }).limit(PAGE_SIZE);
    }
    const result = await query.get();
    renderKnowledge(result.data || []);
  } catch (error) {
    els.knowledgeList.innerHTML = `<div class="knowledge-card">查询失败：${escapeHtml(error.message || error)}</div>`;
  }
}

/**
 * 渲染知识库卡片。
 * @param {Array<object>} items 知识库文档数组。
 */
function renderKnowledge(items) {
  if (!items.length) {
    els.knowledgeList.innerHTML = "<div class=\"knowledge-card\">暂无结果。请先导入知识库数据。</div>";
    return;
  }
  els.knowledgeList.innerHTML = items.map((item) => `
    <div class="knowledge-card">
      <div class="knowledge-title">${escapeHtml(item.title)}</div>
      <div class="knowledge-meta">${escapeHtml([item.pinyin, item.author, item.dynasty, item.answer].filter(Boolean).join(" · "))}</div>
      <div class="knowledge-body">${escapeHtml(item.detail || item.content || item.explanation || "")}</div>
    </div>
  `).join("");
}

els.envIdInput.value = state.config.envId || "";
els.accessKeyInput.value = state.config.accessKey || "";

els.saveConfig.addEventListener("click", async () => {
  try {
    await connectCloudBase();
  } catch (error) {
    console.error(error);
    setStatus(`连接失败：${error.message || error}`, true);
  }
});

els.reloadAll.addEventListener("click", async () => {
  await Promise.all([loadTodos(), queryKnowledge()]);
});

els.todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = els.todoInput.value.trim();
  if (!title) return;
  try {
    await addTodo(title);
    els.todoInput.value = "";
  } catch (error) {
    setStatus(`添加失败：${error.message || error}`, true);
  }
});

els.todoList.addEventListener("change", async (event) => {
  const item = event.target.closest(".todo-item");
  if (!item || !event.target.classList.contains("todo-check")) return;
  await toggleTodo(item.dataset.id, event.target.checked);
});

els.todoList.addEventListener("click", async (event) => {
  const item = event.target.closest(".todo-item");
  if (!item || !event.target.classList.contains("todo-delete")) return;
  await deleteTodo(item.dataset.id);
});

els.knowledgeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await queryKnowledge();
});

if (state.config.envId) {
  connectCloudBase().catch((error) => setStatus(`自动连接失败：${error.message || error}`, true));
}
