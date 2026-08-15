# CloudBase 待办与知识库 Demo

这是一个按 CloudBase Skills 规范创建的知识库后端项目：

- 前端：`school-build` 继续由 GitHub Pages 托管。
- 后端：CloudBase HTTP 云函数，为 GitHub Pages 提供知识库查询接口。
- 数据库：CloudBase 文档数据库 NoSQL。
- 知识库：从仓库内 `chinese-xinhua` 与 `chinese-poetry` 规范化后，批量导入 CloudBase 文档数据库。
- 查询：前端只请求分页结果、详情或随机结果，不再在浏览器解析完整 raw JSON。

## 已确认事实

- 本机 Node/npm/npx 可用。
- CloudBase Skills 已安装到 `C:\Users\82578\Documents\全局助手\.agents\skills\cloudbase`。
- CloudBase CLI 已安装，版本为 `3.7.3`。
- CloudBase 环境：`learn-d0g10smkjc24144a1`，区域：`ap-shanghai`。
- 当前使用 CLI 兜底管理 CloudBase；HTTP 云函数尚未部署时，前端会回退到 GitHub Pages 的本地索引。
- HTTP 云函数调用 `@cloudbase/node-sdk` 必须注入服务端 `CLOUDBASE_APIKEY`，密钥不能写入源码、配置文件或前端 bundle。

## 集合设计

| 集合 | 用途 | 主要字段 |
| --- | --- | --- |
| `todos` | 待办事项 | `title`, `completed`, `ownerId`, `createdAt`, `updatedAt` |
| `kb_idioms` | 成语库 | `title`, `titleChars`, `meaning`, `example`, `derivation` |
| `kb_chars` | 汉字库 | `title`, `titleChars`, `pinyin`, `radical`, `strokes`, `meaning` |
| `kb_xiehouyu` | 歇后语 | `title`, `titleChars`, `answer`, `meaning` |
| `kb_words` | 词语库 | `title`, `titleChars`, `pinyin`, `meaning` |
| `kb_poems` | 古诗库 | `title`, `titleChars`, `searchChars`, `author`, `dynasty`, `category`, `content` |
| `kb_meta` | 古诗元数据 | `authors`, `dynasties`, `collections`, `collectionMeta` |

知识库文档使用稳定 `_id`，重复导入时走 upsert，避免生成重复数据。

`titleChars` / `searchChars` 是查询索引字段：基础中文库只按标题筛选，古诗库按标题、作者、朝代、类型和正文字符筛选。导入完成后，建议在 CloudBase 控制台为各集合建立 `title`、`titleChars`、`searchChars`、`author`、`dynasty`、`category` 对应索引；不要在查询字段上使用正则扫描。

## 本地预览

```powershell
cd C:\Users\82578\Documents\全局助手\cloudbase-todo-knowledge
npm install
npm start
```

打开 `http://127.0.0.1:4177/`，填写 CloudBase EnvId 后点击“保存并连接”。

> 如果你的 CloudBase Web SDK 环境要求 publishable accessKey，也需要在页面中填写 AccessKey。

## 生成知识库导入批次

快速抽样验证（输出到独立目录，不会覆盖完整批次）：

```powershell
npm run check
```

生成完整导入批次：

```powershell
npm run prepare:knowledge
```

输出目录：`.cloudbase-import/batches`。该目录可能很大，默认已加入 `.gitignore`。
抽样输出目录：`.cloudbase-import/batches-sample`。

## 导入 CloudBase 文档数据库

先登录并确认 EnvId：

```powershell
tcb login
tcb env list --json
```

导入前 dry-run：

```powershell
npm run import:knowledge -- --envId <你的EnvId> --dry-run --limit 5
```

正式导入：

```powershell
npm run import:knowledge -- --envId <你的EnvId> --concurrency 4
```

导入脚本默认使用 4 个并发 worker、失败指数退避重试，并在每个成功批次后写入 `.cloudbase-import/import-state.json`。网络中断或 CloudBase 限流后，重复执行同一命令会跳过已完成批次；不要删除该状态文件，除非要重新导入。

只导入前 N 个批次用于测试：

```powershell
npm run import:knowledge -- --envId <你的EnvId> --limit 10
```

重置 checkpoint 后重新导入：

```powershell
npm run import:knowledge -- --envId <你的EnvId> --reset-state
```

抽样 dry-run 不需要登录，也不会写入 checkpoint：

```powershell
npm run import:knowledge -- --dir .\.cloudbase-import\batches-sample --dry-run --limit 5
```

如遇到网络或服务端限流，可降低并发并增加重试次数：

```powershell
npm run import:knowledge -- --envId <你的EnvId> --concurrency 2 --retries 5
```

## 权限建议

Todo 需要用户级读写，知识库建议公开只读、管理端写入：

- `todos`：自定义规则，允许已登录用户读写自己的 `ownerId` 数据。
- `kb_*`：`readonly`，导入脚本使用管理员 CLI 权限写入。

CloudBase 权限规则有 2 到 5 分钟生效缓存。修改权限后，第一次写入失败不一定代表代码错，应等待后重试并用读取回环验证。

## 部署知识库 HTTP 云函数

部署前必须准备服务端 `CLOUDBASE_APIKEY`。当前 CLI 3.7.3 的 `env apikey` 不能可靠创建服务端 `api_key`，不要把 `publish_key` 当成服务端密钥使用；请在 CloudBase 控制台创建专用服务端 API Key，并通过安全的环境变量或密钥配置注入。

```powershell
cd C:\Users\82578\Documents\全局助手\cloudbase-todo-knowledge
tcb fn deploy knowledge-api `
  --httpFn `
  --path /api `
  --dir .\functions\knowledge-api `
  --env-id learn-d0g10smkjc24144a1 `
  --runtime Nodejs20.19 `
  --json
```

部署后必须验证：

```powershell
tcb fn list -e learn-d0g10smkjc24144a1 --json
tcb fn detail knowledge-api -e learn-d0g10smkjc24144a1 --json
tcb routes list -e learn-d0g10smkjc24144a1 --json
```

前端默认 API 地址为：

```text
https://learn-d0g10smkjc24144a1.api.tcloudbasegateway.com/api
```

该地址只有在真实部署并由路由列表确认后才视为有效。GitHub Pages 来源还需要加入 CloudBase 安全域：`https://wangd8257.github.io`。

## 最相关的下一步

- 已确认 EnvId 和 CLI 登录。
- 已完成 HTTP 函数、前端远程适配层、完整导入批次生成和本地静态检查。
- 尚未完成真实部署，因为当前环境没有服务端 `CLOUDBASE_APIKEY`，且函数公共访问规则和 GitHub Pages 安全域尚未配置。
- 获得服务端 API Key 后，下一步是先导入抽样批次验证五类查询，再导入完整批次，最后部署函数并做 GitHub Pages 跨域端到端测试。


