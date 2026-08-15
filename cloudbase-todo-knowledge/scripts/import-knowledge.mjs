import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const DEFAULT_DIR = path.resolve(import.meta.dirname, "..", ".cloudbase-import", "batches");
const DEFAULT_STATE_FILE = path.resolve(import.meta.dirname, "..", ".cloudbase-import", "import-state.json");

/**
 * 解析命令行参数。
 * @returns {{envId: string, dir: string, dryRun: boolean, limit: number, concurrency: number, retries: number, stateFile: string, resetState: boolean}} 导入配置。
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const get = (name) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : "";
  };
  return {
    envId: get("--envId") || get("-e"),
    dir: get("--dir") || DEFAULT_DIR,
    dryRun: args.includes("--dry-run"),
    limit: Number(get("--limit") || 0),
    concurrency: Math.max(1, Math.min(8, Number(get("--concurrency") || 4) || 4)),
    retries: Math.max(0, Math.min(6, Number(get("--retries") || 3) || 3)),
    stateFile: get("--state") || DEFAULT_STATE_FILE,
    resetState: args.includes("--reset-state")
  };
}

/**
 * 构造 CloudBase NoSQL upsert 命令。
 * @param {string} collection 集合名。
 * @param {Array<object>} documents 待导入文档。
 * @returns {string} tcb db nosql execute 的 --command JSON 字符串。
 */
function buildUpsertCommand(collection, documents) {
  const updates = documents.map((doc) => {
    const { _id, ...fields } = doc;
    return {
      q: { _id },
      u: { $set: fields },
      upsert: true
    };
  });
  return JSON.stringify([
    {
      TableName: collection,
      CommandType: "UPDATE",
      Command: JSON.stringify({ update: collection, updates })
    }
  ]);
}

/**
 * 解析 CLI 可执行文件，优先绕过 Windows 的 tcb.cmd 二次 shell 解析。
 * @returns {{file: string, prefix: string[]}} CLI 启动配置。
 */
function resolveCli() {
  const cliEntry = path.join(process.env.APPDATA || "", "npm", "node_modules", "@cloudbase", "cli", "bin", "tcb");
  return fs.existsSync(cliEntry)
    ? { file: process.execPath, prefix: [cliEntry] }
    : { file: "tcb", prefix: [] };
}

/**
 * 读取可恢复导入状态；无状态文件时返回空状态。
 * @param {string} stateFile 状态文件路径。
 * @param {string} envId CloudBase 环境 ID。
 * @param {string} dir 批次目录。
 * @returns {{envId: string, dir: string, completed: string[], failed: object[]}} 导入状态。
 */
function readState(stateFile, envId, dir) {
  if (!fs.existsSync(stateFile)) {
    return { envId, dir, completed: [], failed: [] };
  }
  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  if (state.envId !== envId || state.dir !== dir) {
    throw new Error(`状态文件与当前 envId/dir 不一致：${stateFile}。如需重新开始，请使用 --reset-state。`);
  }
  return {
    envId,
    dir,
    completed: Array.isArray(state.completed) ? state.completed : [],
    failed: Array.isArray(state.failed) ? state.failed : []
  };
}

/**
 * 原子写入导入状态，避免进程中断时留下半个 JSON 文件。
 * @param {string} stateFile 状态文件路径。
 * @param {{envId: string, dir: string, completed: string[], failed: object[]}} state 导入状态。
 * @returns {void}
 */
function writeState(stateFile, state) {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  const temporaryFile = `${stateFile}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryFile, stateFile);
}

/**
 * 延迟指定时间，用于失败批次的指数退避。
 * @param {number} milliseconds 等待毫秒数。
 * @returns {Promise<void>} 等待完成。
 */
function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * 使用参数数组启动 CloudBase CLI，避免 shell 对嵌套 JSON 做二次转义。
 * @param {string} envId CloudBase 环境 ID。
 * @param {string} command MgoCommands JSON 字符串。
 * @returns {Promise<{status: number, stdout: string, stderr: string}>} CLI 执行结果。
 */
function runCli(envId, command) {
  const cli = resolveCli();
  const args = [
    ...cli.prefix,
    "--env-id",
    envId,
    "db",
    "nosql",
    "execute",
    "--command",
    command,
    "--json"
  ];
  return new Promise((resolve, reject) => {
    const child = spawn(cli.file, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (status) => resolve({
      status: Number.isInteger(status) ? status : 1,
      stdout,
      stderr
    }));
  });
}

/**
 * 执行一批 CloudBase 文档导入。
 * @param {string} envId CloudBase 环境 ID。
 * @param {string} file 批次文件路径。
 * @param {boolean} dryRun 是否只打印命令不执行。
 * @param {number} retries 失败重试次数。
 * @returns {Promise<void>} 批次导入完成。
 */
async function importBatch(envId, file, dryRun, retries) {
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  const command = buildUpsertCommand(payload.collection, payload.documents);
  if (dryRun) {
    console.log(`[dry-run] ${payload.collection} ${payload.documents.length} docs ${path.basename(file)}`);
    return;
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const result = await runCli(envId, command);
    if (result.status === 0) {
      console.log(`[ok] ${payload.collection} ${payload.documents.length} docs ${path.basename(file)}`);
      return;
    }
    if (attempt < retries) {
      // 网络抖动和 CloudBase 限流不应立即判定为永久失败。
      await sleep(Math.min(30_000, 1000 * 2 ** attempt));
    } else {
      throw new Error(`导入失败 ${file}\n${result.stdout}\n${result.stderr}`);
    }
  }
}

/**
 * 并发执行批次并在每个成功批次后更新 checkpoint。
 * @param {object} options 导入配置。
 * @param {string} options.envId CloudBase 环境 ID。
 * @param {string[]} options.files 待导入批次文件。
 * @param {number} options.concurrency 并发 worker 数量。
 * @param {number} options.retries 失败重试次数。
 * @param {boolean} options.dryRun 是否只执行 dry-run。
 * @param {string} options.stateFile 状态文件路径。
 * @param {object} state 可恢复导入状态。
 * @returns {Promise<object[]>} 最终失败批次。
 */
async function importBatches(options, state) {
  let cursor = 0;
  const failures = [];
  const worker = async () => {
    while (cursor < options.files.length) {
      const file = options.files[cursor];
      cursor += 1;
      try {
        await importBatch(options.envId, file, options.dryRun, options.retries);
        if (!options.dryRun) {
          state.completed.push(path.basename(file));
          state.failed = state.failed.filter((item) => item.file !== path.basename(file));
          writeState(options.stateFile, state);
        }
      } catch (error) {
        const failure = {
          file: path.basename(file),
          message: error instanceof Error ? error.message : String(error),
          failedAt: new Date().toISOString()
        };
        failures.push(failure);
        state.failed = [...state.failed.filter((item) => item.file !== failure.file), failure];
        if (!options.dryRun) writeState(options.stateFile, state);
        console.error(`[failed] ${failure.file}: ${failure.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(options.concurrency, options.files.length) }, worker));
  return failures;
}

/**
 * 主流程：按 checkpoint 并发导入知识库批次。
 * @returns {Promise<void>} 导入完成。
 */
async function main() {
  const options = parseArgs();
  if (!options.envId && !options.dryRun) {
    throw new Error("缺少 --envId。示例：npm run import:knowledge -- --envId your-env-id");
  }
  if (!fs.existsSync(options.dir)) {
    throw new Error(`导入目录不存在：${options.dir}。请先运行 npm run prepare:knowledge`);
  }

  if (options.resetState && fs.existsSync(options.stateFile)) {
    fs.rmSync(options.stateFile, { force: true });
  }

  const files = fs.readdirSync(options.dir)
    .filter((name) => name.endsWith(".json") && name !== "summary.json")
    .sort()
    .map((name) => path.join(options.dir, name));
  const selected = options.limit > 0 ? files.slice(0, options.limit) : files;
  const state = options.dryRun
    ? { envId: "dry-run", dir: path.resolve(options.dir), completed: [], failed: [] }
    : readState(options.stateFile, options.envId, path.resolve(options.dir));
  const completed = new Set(state.completed);
  const pending = selected.filter((file) => !completed.has(path.basename(file)));
  const failures = await importBatches({
    ...options,
    files: pending,
    stateFile: options.stateFile
  }, state);

  console.log(JSON.stringify({
    completed: selected.length - failures.length,
    selected: selected.length,
    skipped: selected.length - pending.length,
    failed: failures.length,
    stateFile: options.stateFile
  }, null, 2));
  if (failures.length) {
    throw new Error(`仍有 ${failures.length} 个批次失败。修复凭据或网络后重新运行，脚本会从 checkpoint 继续。`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
