# SillyTavern 本地安装 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `D:\\git-programs\\SillyTavern` 完成本地 SillyTavern 安装、启动和访问验证。

**Architecture:** 使用官方 Git 仓库作为唯一来源。安装仅使用项目自身的 Node.js 依赖和启动脚本；服务仅在本地验证，不配置模型接口、反向代理或公网访问。

**Tech Stack:** Git、Node.js、npm、PowerShell、SillyTavern。

## Global Constraints

- 目标路径固定为 `D:\\git-programs\\SillyTavern`。
- 不覆盖已存在的目标目录内容。
- 不修改 SillyTavern 源码和默认功能配置。
- 不配置模型 API、代理、账户或公网访问。
- 不执行任何 Git 提交。

---

### Task 1: 获取项目与安装依赖

**Files:**
- Create: `D:\\git-programs\\SillyTavern\\`（Git 克隆的项目目录）
- Create: `D:\\git-programs\\SillyTavern\\node_modules\\`（npm 安装的依赖目录）

**Interfaces:**
- Consumes: GitHub 官方仓库 `https://github.com/SillyTavern/SillyTavern.git`、已安装的 Git 与 Node.js。
- Produces: 可通过 `npm start` 启动的本地 SillyTavern 项目。

- [ ] **Step 1: 确认目标目录不存在**

Run:

```powershell
Test-Path -LiteralPath 'D:\\git-programs\\SillyTavern'
```

Expected: `False`。若为 `True`，停止执行，不覆盖现有文件。

- [ ] **Step 2: 克隆官方仓库**

Run:

```powershell
git clone https://github.com/SillyTavern/SillyTavern.git 'D:\\git-programs\\SillyTavern'
```

Expected: Git 命令以退出代码 0 结束，且目标目录中存在 `package.json`。

- [ ] **Step 3: 安装声明的依赖**

Run:

```powershell
npm install
```

Working directory: `D:\\git-programs\\SillyTavern`

Expected: npm 以退出代码 0 结束，且 `node_modules` 目录存在。

### Task 2: 启动并验证本地服务

**Files:**
- Modify: 无。
- Test: `http://127.0.0.1:8000/`（运行时 HTTP 响应）。

**Interfaces:**
- Consumes: Task 1 产出的已安装项目和依赖。
- Produces: 运行中的本地 SillyTavern 服务及已验证的访问地址。

- [ ] **Step 1: 后台启动服务并记录日志**

Run:

```powershell
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm start > server.log 2>&1' -WorkingDirectory 'D:\\git-programs\\SillyTavern' -WindowStyle Hidden
```

Expected: 启动命令返回，`D:\\git-programs\\SillyTavern\\server.log` 开始写入服务日志。

- [ ] **Step 2: 检查服务响应**

Run:

```powershell
Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:8000/' | Select-Object StatusCode
```

Expected: `StatusCode` 为 `200`。若未响应，读取 `server.log`，只依据实际报错处理。

- [ ] **Step 3: 交付访问方式**

Report: 服务运行状态、实际访问地址和项目目录；不执行 Git 提交。
