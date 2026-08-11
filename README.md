# 成长小桌 · 幼小衔接工作台

面向 iPad/PWA 的幼小衔接学习工具，包含试卷生成与手写作答、绘本阅读、学习游戏、知识库检索和错题复习。当前界面主题为《奥特曼：光之进化》，视觉规范见 [DESIGN.md](./DESIGN.md)。

## 功能概览

- **试卷生成**：数学、语文、英语多模板生成，支持 A4 预览、分页、作答、批改和错题重练。
- **数学练习**：横式、缺项、竖式、比较大小、列式计算、应用题、连续加减、凑十法、破十法、乘除法、人民币换算、单位换算、钟表认知等。
- **语文练习**：汉字描红、按笔画练字、控笔训练、田字格/作业纸、成语填空、诗句上下文配对、看拼音写汉字。
- **英语练习**：单词描红、短句描红、四线三格空白练习。
- **阅读资料**：读取 `huiben/` 内置书籍，支持导入图片绘本、PDF、EPUB/EQUB，使用本地 `pdf.js` 和 `epub.js`。
- **学习游戏**：汉字组词消消乐、英语实物配对。
- **知识库**：成语、汉字、歇后语、词语和古诗分页查询，支持随机学习和错题库。
- **PWA 离线**：Service Worker 缓存应用壳、核心模块、阅读器依赖和知识库入口文件。

## 快速开始

项目是静态前端应用，没有 `package.json` 和常驻后端。推荐使用 HTTP 本地服务打开，避免浏览器对 `file://` 的 JSON/CORS 限制。

```powershell
cd C:\Users\82578\Documents\全局助手\school-build
npx --yes http-server . -p 5178 -c-1
```

然后打开：

```text
http://127.0.0.1:5178/
```

也可以直接打开 `index.html`，但 `file://` 模式只能使用内置兜底数据，不能读取完整知识库 JSON、古诗分片和 `huiben/manifest.json`。

## iPad / PWA 使用

1. 将项目部署到 HTTPS 地址，例如 GitHub Pages。
2. 用 iPad Safari 打开部署地址。
3. 点击分享按钮，选择“添加到主屏幕”。
4. 首次进入后等待应用壳和核心资源缓存完成。

PWA 更新后如果仍看到旧页面：

- 删除主屏幕上的旧 PWA 后重新添加。
- 或在 Safari 中清理该站点的网站数据。
- 确认 `index.html` 资源版本、`src/app.js` 中的 `sw.js?v=...` 和 `sw.js` 的 `CACHE_NAME` 已同步更新。

## 项目结构

```text
school-build/
├─ index.html                    # 应用入口，HTTP 用 src/app.js，file:// 用 dist/app.bundle.js
├─ styles.css                    # 全局 UI、试卷、阅读器和响应式样式
├─ sw.js                         # PWA Service Worker
├─ manifest.webmanifest          # PWA 安装声明
├─ DESIGN.md                     # 《奥特曼：光之进化》视觉规范
├─ dist/
│  └─ app.bundle.js              # file:// 兼容入口，需由 src/app.js 打包生成
├─ huiben/
│  └─ manifest.json              # 内置绘本清单
├─ scripts/
│  └─ build-poetry-index.mjs     # chinese-poetry 分片索引生成脚本
├─ src/
│  ├─ app.js                     # 主界面、路由、生成器、阅读器挂载
│  ├─ db.js                      # IndexedDB 本机持久化
│  ├─ drawing.js                 # 黑笔/红笔作答画布
│  ├─ papers.js                  # 试卷快照、状态、错题流转
│  ├─ reading.js                 # 阅读资料、绘本、导入书籍模型
│  ├─ worksheet-render.js        # 试卷题型渲染
│  ├─ math/                      # 数学题生成、校验和试卷生成
│  ├─ games/                     # 汉字消消乐和英语配对逻辑
│  ├─ data/
│  │  ├─ knowledge/              # 成语、词语、歇后语、汉字、古诗数据入口
│  │  └─ huiben-manifest.mjs     # file:// 下的内置书目兜底
│  └─ vendor/                    # 本地化第三方浏览器依赖
└─ tests/                        # Node 测试
```

## 数据源

### chinese-xinhua

四类基础中文知识库对接 `chinese-xinhua/data`：

| 类型 | 源文件 | 项目内文件 |
| --- | --- | --- |
| 成语 | `../chinese-xinhua/data/idiom.json` | `src/data/knowledge/raw/idiom.json` |
| 词语 | `../chinese-xinhua/data/ci.json` | `src/data/knowledge/raw/ci.json` |
| 歇后语 | `../chinese-xinhua/data/xiehouyu.json` | `src/data/knowledge/raw/xiehouyu.json` |
| 汉字 | `../chinese-xinhua/data/word.json` | `src/data/knowledge/raw/word.json` |

同步命令：

```powershell
Copy-Item ..\chinese-xinhua\data\idiom.json src\data\knowledge\raw\idiom.json -Force
Copy-Item ..\chinese-xinhua\data\ci.json src\data\knowledge\raw\ci.json -Force
Copy-Item ..\chinese-xinhua\data\xiehouyu.json src\data\knowledge\raw\xiehouyu.json -Force
Copy-Item ..\chinese-xinhua\data\word.json src\data\knowledge\raw\word.json -Force
```

当前测试锁定的数据规模：

- 成语：`30895`
- 词语：`264434`
- 歇后语：`14032`
- 汉字：`16142`

### chinese-poetry

古诗库不直接在运行时扫描原仓库，而是预构建为分页索引：

```powershell
node scripts\build-poetry-index.mjs ..\chinese-poetry src\data\knowledge\poetry
```

脚本会自动兼容外层 `chinese-poetry` 和内层 `chinese-poetry-master`，并按一级内容目录生成“类型”筛选。当前索引规模：

- 总条目：`390011`
- 分片：`391`
- 类型：`曹操诗集、楚辞、论语、蒙学、纳兰性德、全唐诗、诗经、水墨唐诗、四书五经、宋词、五代诗词、幽梦影、御定全唐詩、元曲`

运行时读取：

- `src/data/knowledge/poetry/manifest.json`
- `src/data/knowledge/poetry/catalog/*.json`
- `src/data/knowledge/poetry/search/*.json`
- `src/data/knowledge/poetry/shards/*.json`

## 构建与缓存

HTTP 模式直接加载 `src/app.js` 作为 ES Module；`file://` 模式加载 `dist/app.bundle.js`，用于规避本地模块脚本 CORS 限制。

修改 `src/app.js` 或其依赖后，需要重新打包：

```powershell
npx --yes esbuild src/app.js --bundle --format=iife --target=es2020 --outfile=dist/app.bundle.js
```

如果改动会影响线上/PWA 缓存，需要同步更新：

- `index.html` 中 `styles.css?v=...`
- `index.html` 中 `manifest.webmanifest?v=...`
- `index.html` 中 `src/app.js?v=...` 和 `dist/app.bundle.js?v=...`
- `src/app.js` 中 `navigator.serviceWorker.register('./sw.js?v=...')`
- `sw.js` 中 `CACHE_NAME`
- `tests/pwa/app-shell.test.js` 中对应断言

## 绘本资源

内置书籍放在 `huiben/`，清单是 `huiben/manifest.json`。应用启动时会读取清单并写入 IndexedDB 书架。

支持格式：

- 图片绘本：多张图片导入后可编辑页面文字框。
- PDF：使用本地 `src/vendor/pdfjs/`。
- EPUB/EQUB：使用本地 `src/vendor/epubjs/`，并带同页渲染兜底。

注意：

- `file://` 下不能 `fetch('./huiben/manifest.json')`，会回退到 `src/data/huiben-manifest.mjs`。
- PWA 中大文件加载受 iOS 内存限制影响，建议优先使用本地缓存或较小文件。

## 测试

语法检查：

```powershell
node --check src\app.js
node --check dist\app.bundle.js
node --check sw.js
```

知识库测试：

```powershell
node --test tests\knowledge\knowledge.test.mjs
```

PWA 入口测试：

```powershell
node --test tests\pwa\app-shell.test.js
```

全量 Node 测试：

```powershell
$files = Get-ChildItem -LiteralPath .\tests -Recurse -File | Where-Object { $_.Extension -in '.js', '.mjs' } | ForEach-Object { $_.FullName }
node --test $files
```

当前已验证：`90 pass / 0 fail`。

## 部署到 GitHub Pages

1. 确认 `dist/app.bundle.js` 已重新打包。
2. 确认 `src/data/knowledge/raw/`、`src/data/knowledge/poetry/`、`src/vendor/`、`huiben/` 已随代码提交。
3. 推送到 GitHub Pages 使用的分支。
4. 部署后首次打开建议强制刷新一次；PWA 用户需要清掉旧站点缓存或重新添加到主屏幕。

## 常见问题

### 为什么本地打开只能看到少量知识库数据？

如果地址是 `file:///.../index.html`，浏览器会禁止页面读取本地 JSON。此时应用会回退到内置 seed 数据。要查看完整知识库，请通过 HTTP 打开，例如 `http://127.0.0.1:5178/`。

### 为什么修改了代码但 iPad 上还是旧效果？

PWA 会缓存旧资源。确认版本号和 `CACHE_NAME` 已更新，然后删除旧 PWA 或清理 Safari 网站数据。

### 为什么 `ci.json` 之前只有 6 条？

词语库有 264,434 条，不能用 `loaded.push(...json.map(...))` 一次性展开，否则会触发浏览器参数数量上限并回退 seed。当前代码使用循环追加。

### 为什么 PDF/EPUB 在 PC 能打开，iPad PWA 可能失败？

iPad Safari/PWA 对 Worker、容器高度、内存和离线缓存更敏感。本项目已将 `pdf.js` worker、`epub.js` 和相关依赖本地化，但超大文件仍可能受设备内存限制。

### 能不能直接把完整古诗 JSON 全部预缓存？

不建议。当前古诗索引约数百 MB，Service Worker 只预缓存 manifest 和核心入口，catalog/search/shards 按需读取，避免首次安装 PWA 过慢或失败。

## 开发约束

- 只在 `school-build` 内修改本项目代码。
- 功能页优先保证可读、可触控、无横向滚动。
- 试卷渲染不要复用普通卡片样式，避免影响 A4 排版和手写坐标。
- 新增或修改 `src/app.js` 后同步打包 `dist/app.bundle.js`。
- 新增数据源后补测试，避免静默回退 seed。

