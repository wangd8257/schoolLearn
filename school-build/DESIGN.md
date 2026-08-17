---
version: alpha
name: school-build-ultra-light-evolution
description: |
  《奥特曼：光之进化》是 school-build 的专属 UI 规范。它不是复刻某个奥特曼画面，而是把彩色计时器的圆形几何、变身器的锐利切割、斯派修姆光线的蓝白红轨迹转译为一个儿童学习 PWA 的界面系统。参考 awesome-design-md 中 PlayStation 的明暗章节节奏、SpaceX 的工程化标题与控制台感、NVIDIA 的克制信息架构，但严格使用本项目既定色彩和 8px 网格。

colors:
  canvas: "#F5F7FA"
  surface: "#FFFFFF"
  surface-soft: "#EAF2FF"
  surface-steel: "#EDF2F8"
  ink: "#172338"
  ink-soft: "#43516A"
  mute: "#748198"
  primary-red: "#E84D39"
  primary-red-pressed: "#C83C2C"
  energy-blue: "#0066FF"
  energy-blue-soft: "#DCEBFF"
  timer-white: "#FFFFFF"
  success: "#1F8A70"
  warning: "#D47A00"
  error: "#E84D39"
  line: "#DDE6F2"
  shadow: "0 16px 40px rgba(23, 35, 56, 0.08)"
  shadow-tight: "0 8px 24px rgba(23, 35, 56, 0.08)"

typography:
  display:
    fontFamily: "Aptos Display, Bahnschrift, PingFang SC, Microsoft YaHei, sans-serif"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: 0
  heading:
    fontFamily: "Aptos Display, Bahnschrift, PingFang SC, Microsoft YaHei, sans-serif"
    fontWeight: 800
    lineHeight: 1.22
    letterSpacing: 0
  body:
    fontFamily: "Aptos, PingFang SC, Microsoft YaHei, sans-serif"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  utility:
    fontFamily: "Bahnschrift, Aptos, PingFang SC, Microsoft YaHei, sans-serif"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: 0.08em

spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px

rounded:
  card: 16px
  control: 12px
  small: 8px
  full: 9999px

components:
  primary-button:
    backgroundColor: "{colors.primary-red}"
    textColor: "{colors.timer-white}"
    rounded: "{rounded.control}"
    minHeight: 44px
    padding: "0 18px"
    shadow: "0 10px 22px rgba(232, 77, 57, 0.18)"
  secondary-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    minHeight: 44px
    padding: "0 18px"
    shadow: "{colors.shadow-tight}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    shadow: "{colors.shadow}"
    border: none
  active-navigation:
    backgroundColor: "{colors.energy-blue-soft}"
    textColor: "{colors.energy-blue}"
    marker: "left 4px energy-blue bar"
  timer-mark:
    geometry: "circle with inner white ring and blue/red breathing core"
  beam-accent:
    geometry: "parallel blue-white-red slash, used only on hero edges and energy bars"
---

# 设计原则

## 主题定位

school-build 是给家长和孩子共同使用的学习控制台。界面需要有奥特曼的“光能感”，但不能压过试卷、阅读、小游戏这些核心任务。所有装饰元素必须几何化：圆形计时器、直角三角形、平行四边形切割块、蓝白红能量线。禁止使用复杂写实插画作为背景。

## 参考来源的取舍

- 从 PlayStation 借鉴：明暗章节、游戏控制台式入口、轻量 premium 卡片。
- 从 SpaceX 借鉴：工程化标题、任务控制台感、黑白高对比的局部控制区域。
- 从 NVIDIA 借鉴：信息密度、清晰表格/知识库排版、克制的单一功能色。
- 从奥特曼主题保留：灰白基底、红色主按钮、蓝色链接/进度/能量条、彩色计时器加载动效。

## 色彩规则

- 页面基底必须是 `#F5F7FA`，保证试卷和阅读内容有足够安静的背景。
- `#E84D39` 只用于 Primary Button、危险操作、错误提示和少量能量核心，不用于大面积背景。
- `#0066FF` 用于链接、进度条、激活导航、能量线和选中态。
- 渐变仅允许出现在 Hero 边缘、能量条、计时器呼吸光效，不允许把普通卡片做成渐变块。
- 卡片禁止描边，使用 16px 圆角和微弱阴影。

## 布局规则

- 全局遵循 8px 网格。常用间距为 8 / 16 / 24 / 32 / 48。
- 桌面/iPad 使用左侧导航和右侧工作区；手机使用顶部导航和抽屉。
- 首页可以更有主题感；试卷、阅读器、知识库必须优先保证内容可读和触控可用。
- 所有页面禁止横向滚动。小屏必须使用 `minmax(0, 1fr)`、自动换列和内部滚动，不允许元素撑破屏幕。

## 组件规则

- Primary Button：红底白字，12px 圆角，最小高度 44px。
- Secondary Button：白底深色字，12px 圆角，轻阴影，不使用描边。
- Cards：白底、16px 圆角、轻阴影，内部可以放一个小的蓝色几何角标。
- Navigation：激活态使用浅蓝底和左侧蓝色能量条。
- Loading：彩色计时器红蓝交替呼吸。
- Badge：使用胶囊形或小圆角，不使用大面积纯红。

## 试卷与阅读特殊规则

- 试卷页面属于内容生产区，不能被主题装饰干扰。试卷内部 CSS 不复用普通卡片规则。
- A4 试卷必须保持白底、阴影和可缩放容器；题目、描红格、阅读器内容不允许被主题图形覆盖。
- 黑笔/红笔作答浮动工具栏可以使用主题按钮，但画布坐标和缩放逻辑不能因视觉样式改变。
- 阅读器全屏时顶部悬浮工具栏必须克制，不能遮挡正文或绘本主体。

## 响应式规则

- `>= 1024px`：左侧导航固定，内容最大宽度保持舒适，卡片 3-4 列。
- `768px - 1023px`：导航仍可见或紧缩，卡片 2 列，表单双列逐步收缩。
- `< 768px`：顶部导航，主体单列，表单单列，书架/游戏必须一屏内尽量完成主要操作。
- 所有触控目标不小于 44px。

## Do

- 使用计时器圆形、能量线、锐角切割做少量标识。
- 把蓝色作为“可继续/可选择”的信号，把红色作为“主要行动/错误”的信号。
- 让首页更像学习控制台，让功能页更像安静高效的工具。
- 每次新增 UI 前先检查是否可以复用按钮、卡片、导航、分段控件。

## Don't

- 不要使用大面积深色背景覆盖整个应用。
- 不要让奥特曼贴纸、图形、发光效果进入试卷纸面。
- 不要使用复杂皮套插画、强烈渐变背景、漂浮装饰球。
- 不要让卡片嵌套卡片。
- 不要因为重构视觉样式改动试卷生成、PWA 缓存、阅读器业务逻辑。
