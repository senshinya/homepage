# 个人主页改造为 shinya 的主页 —— 设计

- 状态：待评审
- 日期：2026-07-29
- 仓库：`homepage`（fork 自 `L33Z22L11/homepage-v5`，Nuxt 4 + SSG）

## 背景

当前仓库是纸鹿（L33Z22L11）第五版个人主页的一份拷贝，从站点标题、头像、logo、五个页面的正文到页脚备案号，全部是他本人的内容。要把它变成 shinya 的主页。

三处外部数据源已经存在，此前主页一处也没用上：

- `blog.shinya.click/atom.xml` —— 博客 Atom 订阅源
- `bonsai.shinya.click/api/projects` —— 自建的项目聚合服务，**刻意不暴露仓库地址**，返回脱敏后的统计、周活跃、最近若干条 commit，以及一张由提交历史生成的盆栽 SVG
- `memos.shinya.click/api/v1/memos` —— 自建 Memos，博客的「碎语」页取的就是它

## 目标

1. 站点身份、文案、社交链接全部换成 shinya 的
2. 侧边栏收敛为四项：简介、项目、文章、碎语
3. 项目页改用 bonsai 数据，采用全宽左右交错版式
4. 新增碎语页，参考 `blog-clarity` 的 memo 组件但做减法
5. 删除与本人无关的页面和资产

## 非目标

- 不重做站点的排版系统、配色 token 或字体（继续用现有 HSL token 与 Inter）
- 不搬博客的 giscus 评论与反应体系
- 不做项目详情页（bonsai 不给仓库地址，主页就是唯一展示面，一屏交错已经够）
- 不动 bonsai 与 memos 的服务端代码（CORS 白名单除外，见「站外前置条件」）

## 决策记录

以下由使用者拍板，不再重开：

| 决策 | 取值 | 备注 |
|---|---|---|
| 主页定位 | 名片式门面 | 四页都保持轻，详情跳回博客 |
| 主页域名 | `https://shinya.click/` | |
| 项目页版式 | 全宽左右交错，非卡片 | |
| 盆栽主题 | `shore` | 使用者自行在 bonsai 后台改，四个项目统一 |
| memos CORS | 加白名单 | 见「已知风险」第 2 条 |
| 侧边栏顺序 | 简介 / 项目 / 文章 / 碎语 | |

## 站点身份

`homepage.config.ts`：

```
title:       信也 (@senshinya)
subtitle:    一写代码的
author:      { name: 'shinya',
               avatar: 'https://github.com/senshinya.png',
               email: 'kobayashi_shinya@outlook.com',
               homepage: 'https://github.com/senshinya' }
url:         https://shinya.click/
blogAtom:    https://blog.shinya.click/atom.xml
description: 重写，面向 SEO 的长描述
```

`app/app.config.ts`：

- `footer` 版权改为本人；备案号沿用博客那条萌 ICP（`萌ICP备20248008号`，`icp.gov.moe`）
- `fork` 数组（九个使用纸鹿主页的站点）整个删除 —— 那是他的社交关系
- `nav` 重写为四项 + 社交组（GitHub `senshinya`、Telegram `senshinya`、邮箱）

### 站点图标

`public/icon.png`（674B）是纸鹿的标记，替换为博客已有的那枚 —— 黑白线描的戴螺旋眼镜的头像，源文件在 `blog-clarity/public/icons/`：

- `favicon.svg`（19.8KB）搬为 `public/icon.svg`，作为首选 `<link rel="icon">`。矢量在标签页任何缩放下都清楚
- `favicon.png`（2400×2400，141KB）压到 512 见方后搬为 `public/icon.png`，作为不支持 SVG favicon 的回退。原尺寸当 favicon 过大

主页与博客用同一枚标记。

`favicon` 配置项在改造后喂两处：`nuxt.config.ts` 的 `<link rel="icon">`，以及 `routeRules` 里 `/favicon.ico` 与 `/api/icon.png` 两条重定向。原本的第三处 —— `ZhiluIcon.vue` 渲染在侧栏作者名左边的小 logo —— 随该组件一并删除，侧栏头部改渲染头像。

`/api/icon.png` 与 `/api/avatar.png` 两条对外重定向**保留**。它们的用途是给别人的友链列表一个稳定 URL 去引用，免得盗链带 hash 的构建产物；只是两条 route rule，无维护成本。

## 侧边栏与路由

| 位置 | 图标 | 文案 | 路由 |
|---|---|---|---|
| 1 | `ri:id-card-line` | 简介 | `/` |
| 2 | `ri:code-line` | 项目 | `/project` |
| 3 | `ri:quill-pen-line` | 文章 | `/article` |
| 4 | `ri:chat-quote-line` | 碎语 | `/memos` |

侧栏头部原本渲染 `ZhiluIcon`，改为渲染头像。

## 页面设计

### 简介 `/`

沿用现有 `ZField`（120px 右对齐标签 + 内容列）与 hero 结构，只换内容：

- **hero**：「你好，我是 shinya」 / 副标题「一写代码的」 / 两个按钮：博客、GitHub
- **介绍**：某宇宙厂后端研发
- **近期活动**（初稿，交付后由使用者校订）：2026 年 7 月把博客搬到 Nuxt，顺手写了 bonsai —— 把散在 GitHub / Gitea 各处的仓库聚成一份不暴露地址的只读 API，配一张随提交历史生长的盆栽图。最近在写 chisel，一个 Go 的 coding agent 底层库，把 Anthropic Messages 与 OpenAI Responses / Chat Completions 三套协议统一成一层
- **关于主页**：致谢纸鹿并保留 `L33Z22L11/homepage-v5` 链接

保留原项目链接是有约束的：上游 README 要求「不得以纸鹿或任何与他相关的名义发布镜像网站」，并希望下游在页脚保留项目链接。删掉他的全部身份信息、保留出处链接，两条都满足。

chisel 在 bonsai 里是 `subject-only` 级别，说明尚未公开，简介页提到它时不给仓库链接。

### 项目 `/project`

#### 版式

全宽左右交错。奇数行盆栽在左，偶数行在右。

```
┌───────────────────────────┐   chisel                       ● 活跃
│                           │
│      盆栽 SVG              │   Go · 9 提交 · 近 7 天 6 条
│      shore 沙青纸面         │   ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰
│                           │
└───────────────────────────┘   最近  feat(llm): 完成
                                      openai-chat 风格接口     7月25日
```

选择交错而非卡片的理由：**bonsai 不返回仓库地址，这些行没有任何可点的目标**。卡片是导航语汇（边框、hover 抬起、暗示「点进去」），用在一个点不进去的页面上是错的信号。这页是陈列柜。

#### 规格

- **列宽 5fr / 4fr**，`gap` 随视口收缩；文字栏 `max-width: 42ch`。等分会读成表格而不是编辑版式
- **行不加任何容器**：无边框、无阴影、无背景。分隔完全靠垂直节奏。盆栽 SVG 自带的纸面是这一页唯一的「面」
- **盆栽**：`<img>` 引用 `project.svg`，`width=560 height=420` 写死属性防跳版，`border-radius: 8px` 对齐站点圆角尺度，首屏之外 `loading="lazy"`，`alt` 用项目名 + 「的提交历史盆栽」
- **状态点**：6px 圆点，`active` 用 `--c-primary` 且缓慢呼吸，`idle` 用 `--c-text-3` 且静止
- **元信息行**：首要语言 · 总提交数 · 近 7 天提交数，`0.85em`，`--c-text-2`，数字 `tabular-nums`。首要语言即 `stats.languages[0].name`，该数组为空时整段省略
- **语言条**：4px 高，只画首要语言占比一段用强调色，其余留 `--c-border`。不做 GitHub 式彩虹条 —— 那会是这页唯一破坏安静的元素。完整占比挂 tippy（`vue-tippy` 已是现有依赖）
- **star**：仅当 `stats.stars >= 10` 时显示。blog 与 chisel 各 1 star，写出来是噪音；LunaTV 9158、MYDB 1169 才是凭据，阈值让两个旗舰项目自然获得小项目没有的视觉重量
- **描述**：`description` 为空时不渲染该行
- **最近一条提交**：`commits[0]` 的 subject + 日期。`full` 级别项目若该条作者不是本人（如 MYDB 最新一条是合并他人 PR），以 `--c-text-3` 缀上作者名。`aggregate` 级别项目 `commits` 为空数组，整块不渲染
- **排序**：**照单全收接口顺序，前端不再排序**。bonsai 的 `listProjects` 已经是 `ORDER BY p.sort ASC, last_commit_at DESC, p.id ASC`，而 `sort` 是每项目一个可在后台编辑的整数字段。顺序的真相在 bonsai，前端再写一套只会分裂
- **动效**：整行进入视口时 `opacity` + `translateY` 升起一次（`IntersectionObserver`，`@vueuse/core` 已是现有依赖）。呼吸与升起均在 `prefers-reduced-motion: reduce` 下关闭
- **窄屏**（≤768px）：堆叠，盆栽恒在上方，不交错。窄屏交错只会打乱阅读顺序

#### 深浅色同步

盆栽 SVG 内部用 `@media(prefers-color-scheme:dark)` 切换调色板，跟的是**系统**偏好，而不是站点右下角的主题开关。系统浅色 + 站点手动切深色时两者会脱节。

解法，不改 bonsai：

```scss
.bonsai { color-scheme: light; }
:global(.dark) .bonsai { color-scheme: dark; }
```

`color-scheme` 是继承属性，浏览器会把它传播进 `<img>` 引用的 SVG 文档，SVG 内部那句媒体查询于是跟着站点走。

已在 Chromium 1217 实测：同一个 SVG 文件、同一个 URL，仅祖先元素的 `color-scheme` 不同，一个渲染成 shore 浅色纸面、一个渲染成深色纸面。Safari 按规范应同样支持但未实测，Firefox 未实测。**降级是安全的**：不支持的浏览器退回按系统偏好渲染，即今日行为，不会坏，只是不同步。

不走「内联 SVG + 改写其 CSS」的原因：kodama 吐出的是 `svg{--kd-*:…}` 这种文档级选择器，四棵树内联进同一页面后自定义属性会互相覆盖，而 kodama 按项目对叶片做色相偏移（语言着色），串味等于四棵树同色。`<img>` 的文档隔离在这里是特性，且顺带保住 ETag 与 CDN 缓存。

#### 主题

bonsai 的主题是**每项目一个字段**，默认 `paper`。使用者将四个项目统一改为 `shore`。

`shore` 浅色纸面 `#eef0ea`、深色 `#1c2a2e`，`night: false` 故 star 画成蝴蝶而非萤火虫。相对站点背景的明度差：浅色 7%（对 `#ffffff`）、深色 7%（对 `#121212`），两侧都过得去。

对照之下 `paper` / `ink` 的深色纸面是 `#101312`，与站点 `--c-bg` `#121212` **明度同为 7%，零色阶**，纸面会完全消失，四行变成虚空里飘着四棵树 —— 与「纸面即唯一的面」这一前提冲突，故不用默认值。

### 文章 `/article`

结构与现有页面一致，只改数据源与文案：标题指向「纸鹿摸鱼处」的地方换成博客名，底部三个入口指向 `blog.shinya.click` 的首页 / 友链 / 归档。

### 碎语 `/memos`

从 `blog-clarity` 搬 `app/utils/memo.ts`，但**做减法**：

- **保留** `splitMemoImages` —— 碎语多是手机截图，一张竖构图内联渲染就能撑满整屏，摘出来单独走网格后每条高度才可控
- **保留** marked 渲染（`breaks: true, gfm: true`）
- **丢弃** `splitMemoLinks` 与 `MemoLinkCard` —— 链接预览卡依赖博客侧的 `/api/og` 服务端路由，主页没有这个服务，硬搬会得到一排空卡。裸链接交给 marked 的 gfm 自动链接，留在正文里
- **丢弃** giscus 评论与反应 —— 博客的 term 是 `memo/<id>`，两个站点写同一条 discussion 只会让人分不清在哪儿留的言

每条渲染：日期 + 正文 + 图片网格，整条点击跳 `https://blog.shinya.click/memos/<id>`。底部「加载更多」走 `nextPageToken`，页大小 20，与博客一致。

碎语是本人自建服务里自己写的内容，与文章正文同等信任，**不做 HTML 净化** —— 沿用博客侧的同一判断。

## 数据流、缓存与错误态

三个源全部客户端取数（`useLazyAsyncData` + `server: false`）。站点是 SSG，构建期取数会让内容永远停在上次部署的快照。

| 页面 | 源 | CORS | 缓存 |
|---|---|---|---|
| 文章 | `/api/feed/blog` → `blog.shinya.click/atom.xml` | `*` | 服务端 `defineCachedEventHandler`，24h |
| 项目 | `bonsai.shinya.click/api/projects` | `*` | 响应自带 `public, max-age=300` |
| 碎语 | `memos.shinya.click/api/v1/memos` | **需加白名单** | 无 |

文章保留现有服务端路由而非客户端直取 atom，是为了把 XML 解析留在服务端、不把 `fast-xml-parser` 打进客户端包。

**`server: false` 时服务端根本不取数，`status` 停在 `idle` 而非 `pending`。** 判「加载中」必须同时覆盖 `idle` 与 `pending`，否则预渲染出的 HTML 会直接落到空列表分支，白纸黑字写上「还没有项目」。此坑博客侧已踩过并留有注释。

错误态三页一致：

- 加载中 —— 骨架。项目页骨架须按 4:3 占位，否则盆栽到货时整页跳一次
- 失败 —— 「项目数据加载失败」+ 重试按钮。不使用「Oops」开头，不用被动语态
- 空 —— 「还没有项目」/「还没有碎语」

顺带修一个现存隐患：`/api/feed/blog` 未出现在本地 `nuxt generate` 的产物中（`.output/public/api/` 只有两条重定向）。线上 `www.zhilu.site` 能返回该 JSON，说明上游实际部署用的不是纯静态预设。在 `nitro.prerender.routes` 中显式列出该路由，保证纯静态构建也产出这个文件。

## 依赖变更

新增 `marked`（碎语正文渲染）。其余全部复用现有依赖：`@vueuse/core`（`IntersectionObserver`、`useElementSize`）、`vue-tippy`（语言占比浮层）、`temporal-polyfill`（`ZDate`）。

## 删除清单

| 路径 | 原因 |
|---|---|
| `app/pages/site.vue` | 西邮 Wiki、宝鸡中学野生技协等，与本人无关 |
| `app/pages/log.vue` | 纸鹿 2016 年起的昵称与域名变迁史 |
| `app/components/zhilu/Icon.vue` | 纸鹿 logo，唯二引用处是 `ZSidebar.vue`（改渲染头像）与 `log.vue`（一并删除） |
| `app/components/zhilu/IconOld.vue` | 纸鹿旧 logo，SVG 内注释标着 `© Zhilu`，仅 `log.vue` 引用 |
| `app/app.config.ts` 的 `fork` 数组 | 九个使用纸鹿主页的站点，是他的社交关系 |
| `app/components/partial/Card.vue`、`CardList.vue`、`Timeline.vue` | 已核对：仅 site / log 两页引用，随之删除 |
| `app/components/partial/Project.vue` | 依赖 `ungh.cc` 与 GitHub 仓库地址，被 bonsai 版本取代 |

`app/components/zhilu/Avatar.vue` 是移动而非删除：迁出 `zhilu/` 命名空间，`home.vue` 的引用随之改名。

已核对**保留**的组件：`ZBadge`（`home.vue` 用）、`ZField`（`home.vue`、`error.vue` 用）、`ZTitle`（`article.vue`、`error.vue` 用）、`ZButton`、`ZLink`、`ZRawLink`、`ZDate`、`ZArticle`。删除 site / log 两页后它们仍有引用方。

`app/error.vue` 已是一个走站点自有版式的自定义错误页（侧栏 + ZTitle + 返回主页按钮），无需新建，但删页后需回归确认仍正常。

`README.md` 需重写（现为纸鹿的项目说明与 QQ 群答疑），保留 fork 出处。

## 站外前置条件

以下不在本仓库，需在实施前完成，否则对应页面无法工作：

1. **memos 的 CORS 放行 `https://shinya.click`** —— 改 memos 前面 Caddy 的 CORS 配置。当前只放行 `https://blog.shinya.click`，用其他 Origin 请求时响应里没有 `access-control-allow-origin`，浏览器直接拦截。**碎语页在此之前是空白的**
2. **bonsai 后台把四个项目主题改为 `shore`**
3. **bonsai 后台补 `description_override`** —— 现有四条描述中只有 MYDB 的「一个简单的数据库实现」可用；blog 是 `shinya.click comment`，chisel 为空，LunaTV 是一段 CC 协议声明。描述的真相应在 bonsai，不在主页硬编码

站点图标不在此列：源文件已在本机 `blog-clarity/public/icons/`，属实施范围内的工作，见「站点图标」。

## 已知限制与风险

1. **盆栽深浅色同步只在 Chromium 实测通过。** Safari 按规范应支持，Firefox 未知。降级为跟随系统偏好，即今日行为，不会破功能
2. **memos 选择了 Origin 白名单而非一律回 `*`。** bonsai 的 README 里记录过这个模式的问题：回显 Origin + `Vary: Origin` 挡在 Cloudflare 后面时，CF 默认不支持 `Vary`，哪个 Origin 的请求先到某个 PoP，那份响应就会被喂给所有人，表现为间歇性 CORS 失败。当前只有一个源看不出问题，加入第二个源后风险开始存在。此为使用者明示的决定，记录在案
3. **文章列表是构建期快照。** `/api/feed/blog` 带 24h 服务端缓存并在静态构建时预渲染，博客发新文后主页要等重新部署才更新
4. **项目数超过约 8 个后交错版式会变得冗长。** 当前 4 个。届时可改为前 N 个交错 + 其余紧凑列表，本轮不实现

## 验证方式

- `pnpm lint` 通过（eslint + stylelint）
- `pnpm generate` 成功，且 `.output/public/api/feed/blog` 存在
- 浏览器实测四页，桌面宽度与 375px 各一遍：
  - 项目页交错方向正确，窄屏堆叠且盆栽恒在上
  - 站点主题开关切换时盆栽纸面跟随（Chromium）
  - 三个数据源各自的加载中 / 失败 / 空态可见（可断网或改 URL 触发）
  - 碎语点击跳转到博客对应详情页
- 全站 grep 确认不再出现 `zhilu`、`L33Z22L11`、`纸鹿`，出处致谢链接除外
