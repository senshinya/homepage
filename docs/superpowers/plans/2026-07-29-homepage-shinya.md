# 主页改造为 shinya 个人主页 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把这份 fork 自 `L33Z22L11/homepage-v5` 的主页改成 shinya 的个人主页：四页侧边栏、项目页改用 bonsai 数据做全宽左右交错版式、新增碎语页、清除全部纸鹿的身份内容。

**Architecture:** 保持 Nuxt 4 SSG 与现有组件体系不变。三个外部数据源全部客户端取数（`useLazyAsyncData` + `server: false`），因为构建期取数会让内容停在上次部署的快照。项目页不做详情页——bonsai 刻意不返回仓库地址，主页就是唯一展示面。

**Tech Stack:** Nuxt 4 + Vue 3 + SCSS（无 Tailwind）、`@nuxt/icon`、`@vueuse/core`、`vue-tippy`、`temporal-polyfill`、新增 `marked`

设计文档：`docs/superpowers/specs/2026-07-29-homepage-shinya-design.md`

## Global Constraints

- **代码风格**：制表符缩进、无分号、单引号。`<template>` 顶层子元素不缩进（`vue/html-indent` 配置为 `baseIndent: 0`）
- **SFC 块顺序**：`<script setup lang="ts">` → `<template>` → `<style lang="scss" scoped>`。`vue/block-lang` 要求 script 必须 `ts`、style 必须 `scss`；`vue/enforce-style-attribute` 只允许 `scoped`
- **媒体查询用前缀记法**：`@media (max-width: $breakpoint-mobile)`，不用 range 记法。stylelint 配置为 `media-feature-range-notation: prefix`
- **依赖走 catalog**：eslint 开了 `pnpm: true`，`package.json` 里的版本号必须写 `catalog:<组名>`，真实版本加在 `pnpm-workspace.yaml` 的 `catalogs` 下
- **组件自动前缀**：`app/components/partial/Foo.vue` → `<ZFoo>`；`app/components/Foo.vue` → `<Foo>`
- **配色只用现有 HSL token**：`--c-text` / `--c-text-1..3` / `--c-bg` / `--c-bg-1..3` / `--c-bg-soft` / `--c-border` / `--c-primary` / `--c-primary-soft`。不引入新配色体系
- **禁止 `transition: all`**，逐条列出属性；只动 `transform` / `opacity` / `translate` / `filter`
- **所有动效必须有 `@media (prefers-reduced-motion: reduce)` 兜底**
- **不新增测试框架**：本仓库没有 test runner（`package.json` 无 test script，无 vitest）。验证靠 lint + 构建 + 无头浏览器截图，见下方「验证命令」。为一次改版引入测试框架属超范围

### 验证命令

每个任务结束前按需运行：

```bash
pnpm lint                              # eslint
npx stylelint '**/*.{vue,scss}'        # stylelint（仓库有配置但 package.json 没有对应 script）
pnpm generate                          # 构建必须成功
```

需要看实际渲染时，先在后台起 dev server：

```bash
npx nuxt dev --port 3000 &
# 等到 http://localhost:3000 可访问
```

然后截图（`--virtual-time-budget` 是必须的：三个页面的数据都是客户端取的，
不给时间预算截到的会是骨架屏）：

```bash
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"

# 桌面
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=1280,1400 \
  --virtual-time-budget=8000 --screenshot=/tmp/desktop.png http://localhost:3000/project

# 移动
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=375,1400 \
  --virtual-time-budget=8000 --screenshot=/tmp/mobile.png http://localhost:3000/project
```

截图后**必须实际打开图片查看**，不能凭代码推断渲染结果。

**两个已实测的坑，别踩：**

1. **headless Chrome 的 `prefers-color-scheme` 默认是 dark。** 站点 `colorMode.preference` 是 `system`，所以上面所有截图默认都会是深色页面。这不是 bug
2. **`--force-prefers-color-scheme=light|dark` 在当前 Chrome 版本无效**，两个取值截出来都是 dark，已实测。想看浅色，把 `nuxt.config.ts` 的 `colorMode.preference` 临时从 `'system'` 改成 `'light'`，截完改回去

### 站外前置条件

以下三条不在本仓库，缺了对应功能无法工作，实施前请确认使用者已完成：

1. memos 的 Caddy CORS 放行 `https://shinya.click`（**碎语页在此之前是空白的**，Task 8 的截图验证会失败）
2. bonsai 后台四个项目主题改 `shore`
3. bonsai 后台补 `description_override`

---

### Task 1: 站点身份与图标

把 `homepage.config.ts` / `app.config.ts` 里纸鹿的身份换成 shinya 的，换站点图标，补一条预渲染路由。本任务不动任何页面组件。

**Files:**
- Modify: `homepage.config.ts`
- Modify: `app/app.config.ts`
- Modify: `nuxt.config.ts`
- Create: `public/icon.svg`（从 `~/Downloads/blog-clarity/public/icons/favicon.svg` 复制）
- Modify: `public/icon.png`（从 `~/Downloads/blog-clarity/public/icons/favicon.png` 压到 512 见方）

**Interfaces:**
- Consumes: 无
- Produces: `homepageConfig.blogAtom = 'https://blog.shinya.click/atom.xml'`（Task 4 用）、`homepageConfig.author.avatar`（Task 2 用）、`appConfig.nav`（Task 2 用）

- [ ] **Step 1: 换图标**

```bash
cp ~/Downloads/blog-clarity/public/icons/favicon.svg public/icon.svg
sips -Z 512 ~/Downloads/blog-clarity/public/icons/favicon.png --out public/icon.png
ls -la public/
```

原 PNG 是 2400×2400 / 141KB，当 favicon 过大。`sips` 是 macOS 自带命令。

- [ ] **Step 2: 重写 `homepage.config.ts`**

```ts
// 存储 nuxt.config 和 app.config 共用的配置

import type { NitroConfig } from 'nitropack'

const author = {
	name: 'shinya',
	avatar: 'https://github.com/senshinya.png',
	email: 'kobayashi_shinya@outlook.com',
	homepage: 'https://github.com/senshinya',
}

const homepageConfig = {
	title: '信也 (@senshinya)',
	subtitle: '一写代码的',
	description: 'shinya 的个人主页。某宇宙厂后端研发，写 Go 与 TypeScript，自建了博客、Memos、项目聚合等一整套服务。这里放着他在做的项目、写的文章和随手记下的碎语。',
	author,
	language: 'zh-CN',
	timeZone: 'Asia/Shanghai',
	favicon: '/icon.svg',
	url: 'https://shinya.click/',
	blogAtom: 'https://blog.shinya.click/atom.xml',
}

// https://nitro.build/config#routerules
export const routeRules: NitroConfig['routeRules'] = {
	'/api/avatar.png': { redirect: author.avatar },
	'/api/icon.png': { redirect: '/icon.png' },
	'/favicon.ico': { redirect: homepageConfig.favicon },
}

export default homepageConfig
```

注意 `/api/icon.png` 指向 `/icon.png` 而不是 `favicon`——`favicon` 现在是 SVG，那条端点的名字承诺的是 PNG，别人拿去当 `<img src>` 用时不该收到 SVG。

- [ ] **Step 3: 改 `app/app.config.ts` 的 footer 与 nav，删掉 `fork` 数组**

`footer` 改为：

```ts
	footer: [
		`© ${new Date().getFullYear()} shinya`,
		h('a', { href: 'https://icp.gov.moe/?keyword=20248008', target: '_blank', rel: 'noopener nofollow' }, '萌ICP备20248008号'),
	],
```

整个 `fork: [...]` 数组删除（九个使用纸鹿主页的站点，是他的社交关系）。

`nav` 改为：

```ts
	nav: [
		{
			title: '',
			items: [
				{ icon: 'ri:id-card-line', text: '简介', url: '/' },
				{ icon: 'ri:code-line', text: '项目', url: '/project' },
				{ icon: 'ri:quill-pen-line', text: '文章', url: '/article' },
				{ icon: 'ri:chat-quote-line', text: '碎语', url: '/memos' },
			],
		},
		{
			title: '社交',
			items: [
				{ icon: 'ri:github-line', text: 'senshinya', url: 'https://github.com/senshinya' },
				{ icon: 'ri:telegram-line', text: 'senshinya', url: 'https://telegram.me/senshinya' },
				{ icon: 'ri:mail-line', text: 'kobayashi_shinya@outlook.com', url: 'mailto:kobayashi_shinya@outlook.com' },
			],
		},
	] satisfies Nav,
```

`themes` 对象保持不变。

- [ ] **Step 4: `nuxt.config.ts` 补预渲染路由**

在 `routeRules,` 那一行下面加：

```ts
	nitro: {
		prerender: {
			// 纯静态构建时 Nitro 不会自动产出这条 API 的 JSON——文章页用的是
			// useLazyFetch，预渲染爬虫看不到这个请求。不显式列出的话
			// .output/public/api/feed/blog 不存在，线上取数直接 404
			routes: ['/api/feed/blog'],
		},
	},
```

- [ ] **Step 5: 验证**

```bash
pnpm lint && pnpm generate && ls -la .output/public/api/feed/
```

预期：lint 通过；构建成功；`.output/public/api/feed/blog` 存在（这一步同时验证了 Step 4）。

此时 `site.vue` / `log.vue` 仍在且仍引用纸鹿的内容，构建会成功但页面还没清理——下一个任务处理。

- [ ] **Step 6: 提交**

```bash
git add homepage.config.ts app/app.config.ts nuxt.config.ts public/
git commit -m "feat: 站点身份换为 shinya，图标改用博客那枚

favicon 改 SVG 优先、PNG 压到 512 做回退；/api/icon.png 单独指向 PNG，
那条端点的名字承诺的就是 PNG。侧栏导航收敛为简介/项目/文章/碎语，
删掉上游作者的下游引用名单。

顺带显式预渲染 /api/feed/blog：纯静态构建时爬虫看不到 useLazyFetch
发出的请求，不列出来产物里就没有这个文件。"
```

---

### Task 2: 删除纸鹿资产，侧栏改渲染头像

删掉两个与本人无关的页面、纸鹿的 logo 组件、以及只被这两页使用的三个组件。侧栏头部原本渲染纸鹿 logo，改为渲染头像。

**Files:**
- Delete: `app/pages/site.vue`、`app/pages/log.vue`
- Delete: `app/components/zhilu/Icon.vue`、`app/components/zhilu/IconOld.vue`
- Move: `app/components/zhilu/Avatar.vue` → `app/components/partial/Avatar.vue`
- Delete: `app/components/partial/Card.vue`、`CardList.vue`、`Timeline.vue`
- Modify: `app/components/ZSidebar.vue`
- Modify: `app/pages/home.vue`（仅改 `ZhiluAvatar` → `ZAvatar` 这一处引用）

**Interfaces:**
- Consumes: Task 1 的 `appConfig.author.avatar`
- Produces: `<ZAvatar>` 组件（Task 3 的简介页用）

- [ ] **Step 1: 确认待删组件确实没有别处引用**

```bash
grep -rn "ZCard\|ZCardList\|ZTimeline\|ZhiluIcon\|ZhiluIconOld" app/ --include="*.vue" --include="*.ts"
```

预期只出现在 `site.vue`、`log.vue`、`components/partial/CardList.vue`（它引用 `ZCard`）三处，全部即将删除。若出现在其他文件里，**停下来报告**，不要继续删。

- [ ] **Step 2: 删除与移动**

```bash
git rm app/pages/site.vue app/pages/log.vue
git rm app/components/zhilu/Icon.vue app/components/zhilu/IconOld.vue
git rm app/components/partial/Card.vue app/components/partial/CardList.vue app/components/partial/Timeline.vue
git mv app/components/zhilu/Avatar.vue app/components/partial/Avatar.vue
```

`app/components/zhilu/` 目录应随之为空。

- [ ] **Step 3: 改 `app/components/ZSidebar.vue` 的头部**

把 `<ZhiluIcon />` 换成头像。找到：

```vue
	<header class="aside-header">
		<ZhiluIcon />
		<span>{{ appConfig.author.name }}</span>
```

改为：

```vue
	<header class="aside-header">
		<ZAvatar class="aside-avatar" />
		<span>{{ appConfig.author.name }}</span>
```

并在 `<style>` 的 `.aside-header` 规则后面补一条：

```scss
.aside-avatar {
	font-size: 1.5rem;
}
```

`Avatar.vue` 内部把图片高度写成 `1em`，所以尺寸由 `font-size` 控制；`1.5rem` 对齐原 `ZhiluIcon` 的 `width: 1.5em`，`aside-header` 的 `grid-template-columns: 1.5rem 1fr auto` 因此不用改。

- [ ] **Step 4: 改 `app/pages/home.vue` 里的组件名**

把 `<ZhiluAvatar class="avatar" />` 改为 `<ZAvatar class="avatar" />`。这一步只改名，页面文案在 Task 3 处理。

- [ ] **Step 5: 验证**

```bash
pnpm lint && npx stylelint '**/*.{vue,scss}' && pnpm generate
grep -rn "Zhilu" app/ && echo "还有残留" || echo "zhilu 组件已清空"
```

预期：lint 与构建通过；grep 无输出（`&&` 分支不触发，打印「zhilu 组件已清空」）。

`.output/public/` 下不应再有 `site/` 与 `log/` 目录：

```bash
ls .output/public/
```

- [ ] **Step 6: 起 dev server 截图确认侧栏没坏**

```bash
npx nuxt dev --port 3000 &
sleep 12
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=1280,900 \
  --virtual-time-budget=6000 --screenshot=/tmp/sidebar.png http://localhost:3000/
```

打开 `/tmp/sidebar.png` 确认：侧栏顶部是头像不是折线 logo，导航四项且顺序为简介/项目/文章/碎语，社交三项。碎语此刻会是 404（页面还没建），正常。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "refactor: 删掉站点/日志两页与上游作者的 logo 资产

site.vue 是西邮 Wiki、宝鸡中学野生技协那批站点，log.vue 是他 2016 年
起的昵称与域名变迁史，都与本人无关，且没要这两页。Card/CardList/
Timeline 三个组件只被这两页引用，一并删除（已 grep 核对）。

侧栏头部原本渲染 ZhiluIcon，改为渲染头像；Avatar 迁出 zhilu/ 命名空间
到 partial/，随自动前缀改名 ZAvatar。"
```

---

### Task 3: 简介页

**Files:**
- Modify: `app/pages/home.vue`

**Interfaces:**
- Consumes: Task 2 的 `<ZAvatar>`
- Produces: 无

- [ ] **Step 1: 重写 `app/pages/home.vue` 的 `<template>`**

`<script setup>` 与 `<style>` 两块保持原样不动，只换 `<template>`：

```vue
<template>
<ZAvatar class="avatar" />

<div class="wrapper">
	<ZField>
		<template #label>
			<span style="font-size: 3rem;">👋</span>
		</template>
		<h1 style="font-size: 3rem;">
			你好，<br>我是<mark>{{ appConfig.author.name }}</mark>
		</h1>
		<p class="desc">
			{{ appConfig.subtitle }}
		</p>
		<div>
			<ZButton
				icon="ri:file-list-3-line"
				to="https://blog.shinya.click/"
				text="博客"
				primary
			/>
			<ZButton
				icon="ri:github-line"
				to="https://github.com/senshinya"
				text="GitHub"
			/>
		</div>
	</ZField>

	<ZField label="介绍">
		<p>某宇宙厂后端研发。</p>
		<p>写 Go 和 TypeScript，自建了博客、Memos、项目聚合这一整套东西，域名都挂在 <code>shinya.click</code> 下面。</p>
	</ZField>

	<ZField label="近期活动">
		<p>2026年7月把<ZLink to="https://blog.shinya.click/">博客</ZLink>搬到了 Nuxt，顺手写了 bonsai——把散在 GitHub、Gitea 各处的仓库聚成一份不暴露地址的只读 API，配一张随提交历史生长的盆栽图。</p>
		<p>最近在写 chisel，一个 Go 的 coding agent 底层库，把 Anthropic Messages 和 OpenAI 的 Responses、Chat Completions 三套协议统一成一层。</p>
	</ZField>

	<ZField label="关于主页">
		<p>
			本站基于
			<ZLink to="https://github.com/L33Z22L11/homepage-v5" icon="ri:github-line">L33Z22L11/homepage-v5</ZLink>
			改造，感谢
			<ZBadge link="https://github.com/L33Z22L11" text="纸鹿本鹿" />
			把它开源出来。
		</p>
	</ZField>
</div>
</template>
```

`ZBadge` 需要保留（本页在用），Task 2 的删除清单里没有它。

近期活动这两段是替使用者起草的初稿，交付后由他校订。chisel 在 bonsai 里是 `subject-only` 级别，说明尚未公开，故**不给仓库链接**。

- [ ] **Step 2: 验证**

```bash
pnpm lint && npx stylelint '**/*.{vue,scss}'
```

- [ ] **Step 3: 截图确认**

```bash
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=1280,1200 \
  --virtual-time-budget=6000 --screenshot=/tmp/home.png http://localhost:3000/
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=375,1400 \
  --virtual-time-budget=6000 --screenshot=/tmp/home-mobile.png http://localhost:3000/
```

打开两张图确认：背景那枚大头像在、四个 ZField 排版正常、窄屏下标签列折到内容上方。

- [ ] **Step 4: 提交**

```bash
git add app/pages/home.vue
git commit -m "feat: 简介页换成 shinya 的内容

近期活动是初稿待校订。chisel 在 bonsai 里是 subject-only，说明还没
公开，所以提到它时不给仓库链接。关于主页一节保留上游出处链接——
上游 README 要求不得以其名义发布镜像并希望保留项目链接，删净身份
信息 + 保留出处，两条都满足。"
```

---

### Task 4: 文章页

只改文案与出站链接，数据源已在 Task 1 通过 `homepageConfig.blogAtom` 换掉。

**Files:**
- Modify: `app/pages/article.vue`

**Interfaces:**
- Consumes: Task 1 的 `homepageConfig.blogAtom`
- Produces: 无

- [ ] **Step 1: 改 `app/pages/article.vue` 的模板**

标题那段：

```vue
<ZTitle icon="👀">
	<span class="badge-text">来自博客
		<ZRawLink to="https://blog.shinya.click/"><mark>信也のブログ</mark></ZRawLink>
		的文章
	</span>
</ZTitle>
```

底部三个入口：

```vue
<div class="article-more">
	<ZRawLink to="https://blog.shinya.click/">
		<Icon name="ri:navigation-line" />
		<span>访问</span>
	</ZRawLink>
	<ZRawLink to="https://blog.shinya.click/link">
		<Icon name="ri:link-m" />
		<span>友链</span>
	</ZRawLink>
	<ZRawLink to="https://blog.shinya.click/archive">
		<Icon name="ri:archive-line" />
		<span>归档</span>
	</ZRawLink>
</div>
```

- [ ] **Step 2: 修一个现存的空值崩溃**

`<script setup>` 里当前是：

```ts
const articles = computed(() => data.value.slice(0, 11))
```

`useLazyFetch` 在数据回来之前 `data.value` 是 `null`，且订阅源取不到时也是 `null`。改为：

```ts
const articles = computed(() => data.value?.slice(0, 11) ?? [])
```

- [ ] **Step 3: 验证**

```bash
pnpm lint
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/feed/blog
```

预期：lint 通过；接口返回 200。再截图：

```bash
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=1280,1200 \
  --virtual-time-budget=8000 --screenshot=/tmp/article.png http://localhost:3000/article
```

打开图确认列出的是博客的真实文章标题，不是「加载中」也不是错误信息。

- [ ] **Step 4: 提交**

```bash
git add app/pages/article.vue
git commit -m "feat: 文章页指向 blog.shinya.click

顺带修一个空值崩溃：data.value 在数据回来前和订阅源取不到时都是
null，原来直接 .slice 会抛。"
```

---

### Task 5: bonsai 数据层

只做类型与取数，不碰版式。本任务结束时项目页能把数据打出来但还很丑。

**Files:**
- Create: `app/types/bonsai.ts`
- Modify: `app/pages/project.vue`
- Delete: `app/components/partial/Project.vue`（旧版依赖 `ungh.cc` 与 GitHub 仓库地址，被 Task 6 的新版取代）

**Interfaces:**
- Consumes: 无
- Produces:
  - `BonsaiProject`、`BonsaiResponse`、`BonsaiActivity`、`BonsaiVisibility`、`BonsaiStats`、`BonsaiCommit`、`BonsaiLanguage`（Task 6 用）
  - `project.vue` 暴露 `projects: ComputedRef<BonsaiProject[]>`、`loading: ComputedRef<boolean>`、`error`、`refresh()`

- [ ] **Step 1: 建 `app/types/bonsai.ts`**

```ts
/**
 * bonsai.shinya.click 的公开只读接口。
 *
 * 这份接口刻意不返回仓库地址——脱敏层就是它存在的理由，所以主页这边
 * 没有「点进去看仓库」这回事，项目页是陈列而不是索引。
 */

export type BonsaiVisibility = 'full' | 'subject-only' | 'aggregate'

/** 由最后一次提交距今的天数推出：≤7 active，≤30 slowing，其余 idle */
export type BonsaiActivity = 'empty' | 'archived' | 'active' | 'slowing' | 'idle'

export interface BonsaiLanguage {
	name: string
	/** 0~1 的占比，不是百分数 */
	share: number
}

export interface BonsaiStats {
	commits: number
	commitsLast7d: number
	commitsLast30d: number
	streakDays: number
	firstCommitAt: string | null
	lastCommitAt: string | null
	stars: number
	languages: BonsaiLanguage[]
}

export interface BonsaiCommit {
	at: string
	subject: string
	/** 仅 visibility 为 full 时返回 */
	body?: string
	/** 仅 visibility 为 full 时返回 */
	author?: string
}

export interface BonsaiWeek {
	/** ISO 周，形如 2026-W29 */
	w: string
	c: number
}

export interface BonsaiProject {
	slug: string
	name: string
	description: string
	visibility: BonsaiVisibility
	activity: BonsaiActivity
	/** activity 为 empty 时是 null */
	svg: string | null
	stats: BonsaiStats
	weekly: BonsaiWeek[]
	/** visibility 为 aggregate 时是空数组 */
	commits: BonsaiCommit[]
}

export interface BonsaiResponse {
	generatedAt: string
	projects: BonsaiProject[]
}
```

- [ ] **Step 2: 删掉旧的项目卡组件**

```bash
git rm app/components/partial/Project.vue
```

- [ ] **Step 3: 重写 `app/pages/project.vue` 为最小可用版**

```vue
<script setup lang="ts">
import type { BonsaiResponse } from '~/types/bonsai'

useHead({ title: '项目' })
definePageMeta({ headerText: '在做的项目' })

const BONSAI_API = 'https://bonsai.shinya.click/api/projects'

// server: false —— 站点是 SSG，构建期取数会让内容永远停在上次部署的快照。
// 重复访问由响应自带的 public, max-age=300 兜底，不必自己再缓存一层
const { data, status, error, refresh } = useLazyAsyncData(
	'bonsai:projects',
	() => $fetch<BonsaiResponse>(BONSAI_API),
	{ server: false },
)

// server: false 时服务端根本不取数，status 停在 idle 而非 pending。
// 漏掉 idle 会让预渲染的 HTML 直接落到空列表分支，白纸黑字写上「还没有项目」
const loading = computed(() => status.value === 'idle' || status.value === 'pending')

// 顺序的真相在 bonsai：它已经按 sort ASC, last_commit_at DESC, id ASC 排好，
// 而 sort 是后台可编辑的字段。前端再排一遍只会分裂成两处真相
const projects = computed(() => data.value?.projects ?? [])
</script>

<template>
<p v-if="loading">
	加载中…
</p>

<div v-else-if="error">
	<p>项目数据加载失败，可能是网络不通。</p>
	<ZButton icon="ri:refresh-line" text="重试" @click="refresh()" />
</div>

<p v-else-if="!projects.length">
	还没有项目。
</p>

<ol v-else>
	<li v-for="project in projects" :key="project.slug">
		{{ project.name }} · {{ project.activity }} · {{ project.stats.commits }} 提交
	</li>
</ol>
</template>
```

- [ ] **Step 4: 验证取数确实通**

```bash
pnpm lint
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=1280,700 \
  --virtual-time-budget=8000 --screenshot=/tmp/project-raw.png http://localhost:3000/project
```

打开图确认列出四个项目名及其 activity 与提交数，不是「加载中…」。若停在加载中，说明 `virtual-time-budget` 不够或 CORS 有问题，用下面这条查：

```bash
curl -s -D- -o /dev/null -H "Origin: http://localhost:3000" \
  https://bonsai.shinya.click/api/projects | grep -i access-control
```

预期看到 `access-control-allow-origin: *`。

- [ ] **Step 5: 提交**

```bash
git add app/types/bonsai.ts app/pages/project.vue
git commit -m "feat: 项目页改从 bonsai 取数

旧的 Project.vue 依赖 ungh.cc 和 GitHub 仓库地址，而 bonsai 刻意不
返回仓库地址，整个换掉。排序照单全收接口顺序——bonsai 已按 sort ASC,
last_commit_at DESC 排好且 sort 后台可改，前端再排会分裂成两处真相。

server: false 时服务端不取数，status 停在 idle 而非 pending，判加载中
必须同时覆盖两者，否则预渲染的 HTML 会写上「还没有项目」。"
```

---

### Task 6: 项目页全宽左右交错版式

**Files:**
- Create: `app/components/partial/Project.vue`
- Modify: `app/pages/project.vue`

**Interfaces:**
- Consumes: Task 5 的 `BonsaiProject`、`BonsaiActivity`、`projects`
- Produces: `<ZProject v-bind="project" />`，props 即 `BonsaiProject` 的全部字段

- [ ] **Step 1: 建 `app/components/partial/Project.vue`**

```vue
<script setup lang="ts">
import type { BonsaiActivity, BonsaiProject } from '~/types/bonsai'

const props = defineProps<BonsaiProject>()

const ACTIVITY: Record<BonsaiActivity, { text: string, live: boolean }> = {
	active: { text: '活跃', live: true },
	slowing: { text: '放缓', live: false },
	idle: { text: '停更', live: false },
	archived: { text: '已归档', live: false },
	empty: { text: '空仓', live: false },
}

const activityInfo = computed(() => ACTIVITY[props.activity])

const topLanguage = computed(() => props.stats.languages[0])

// star 少于 10 是噪音：blog 和 chisel 各 1 star，写出来毫无信息。
// 阈值让 LunaTV(9158) 和 MYDB(1169) 自然获得小项目没有的视觉重量
const showStars = computed(() => props.stats.stars >= 10)

const languageTip = computed(() => ({
	content: props.stats.languages
		.map(lang => `${lang.name} ${(lang.share * 100).toFixed(1)}%`)
		.join(' · '),
}))

const latestCommit = computed(() => props.commits[0])

// full 级别才有 author。不是本人时缀上——诚实，且顺带说明这仓库有别人在推
const otherAuthor = computed(() => {
	const author = latestCommit.value?.author
	return author && author !== 'shinya' ? author : undefined
})

// 整行进入视口时升起一次。用 IntersectionObserver 而不是 CSS 滚动动画，
// 是为了 stop() 掉之后不再回退——来回滚动时反复播放很烦
const row = useTemplateRef('row')
const seen = ref(false)
const { stop } = useIntersectionObserver(row, ([entry]) => {
	if (entry?.isIntersecting) {
		seen.value = true
		stop()
	}
}, { threshold: 0.15 })
</script>

<template>
<article ref="row" class="project" :class="{ seen }">
	<div class="project-plate">
		<img
			v-if="svg"
			class="bonsai"
			:src="svg"
			:alt="`${name} 的提交历史盆栽`"
			width="560"
			height="420"
			loading="lazy"
			decoding="async"
		>
		<div v-else class="bonsai-empty">
			还没有提交
		</div>
	</div>

	<div class="project-body">
		<h2 class="project-name">
			{{ name }}
			<span class="project-activity" :class="{ live: activityInfo.live }">
				<i class="dot" />{{ activityInfo.text }}
			</span>
		</h2>

		<p v-if="description" class="project-desc">
			{{ description }}
		</p>

		<p class="project-meta">
			<span v-if="topLanguage">{{ topLanguage.name }}</span>
			<span>{{ stats.commits }} 提交</span>
			<span v-if="stats.commitsLast7d">近 7 天 {{ stats.commitsLast7d }} 条</span>
			<span v-if="showStars" class="stars">
				<Icon name="ri:star-line" />{{ stats.stars }}
			</span>
		</p>

		<div v-if="topLanguage" v-tip="languageTip" class="project-langs">
			<i class="lang-top" :style="{ width: `${topLanguage.share * 100}%` }" />
		</div>

		<p v-if="latestCommit" class="project-commit">
			<span class="commit-label">最近</span>
			<span class="commit-subject">{{ latestCommit.subject }}</span>
			<span class="commit-meta">
				<ZDate :date="latestCommit.at" format="monthDay" />
				<template v-if="otherAuthor"> · {{ otherAuthor }}</template>
			</span>
		</p>
	</div>
</article>
</template>

<style lang="scss" scoped>
// 不等分是刻意的：5/4 让盆栽明显大于文字栏，读起来是编辑版式而不是表格。
// 行不加边框阴影圆角——bonsai 不返回仓库地址，这些行没有可点的目标，
// 卡片是导航语汇，用在点不进去的页面上是错的信号
.project {
	display: grid;
	grid-template-columns: minmax(0, 5fr) minmax(0, 4fr);
	align-items: center;
	gap: clamp(1.5rem, 5vw, 4rem);
	margin: clamp(3rem, 10vh, 6rem) 0;
	opacity: 0;
	transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), translate 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	translate: 0 12px;

	&.seen {
		opacity: 1;
		translate: none;
	}

	// 交错：偶数行盆栽换到右边
	&:nth-child(even) > .project-plate {
		order: 2;
	}

	@media (max-width: $breakpoint-mobile) {
		grid-template-columns: 1fr;
		gap: 1.2rem;

		// 窄屏一律盆栽在上。交错在单列下没有意义，只会打乱阅读顺序
		&:nth-child(even) > .project-plate {
			order: 0;
		}
	}
}

.bonsai {
	display: block;
	width: 100%;
	height: auto;
	border-radius: 8px;

	// SVG 内部用 @media(prefers-color-scheme:dark) 切调色板，默认跟系统而不是
	// 站点的主题开关。color-scheme 是继承属性，浏览器会把它传播进 img 引用的
	// SVG 文档，纸面于是跟着站点走。不支持的浏览器退回跟系统，即改造前的行为
	color-scheme: light;
}

.dark .bonsai {
	color-scheme: dark;
}

// activity 为 empty 时 bonsai 不给 svg。给个占位而不是留空——
// 空白会让人以为图挂了
.bonsai-empty {
	display: grid;
	place-items: center;
	aspect-ratio: 4 / 3;
	border: 1px dashed var(--c-border);
	border-radius: 8px;
	font-size: 0.9em;
	color: var(--c-text-3);
}

.project-body {
	display: flex;
	flex-direction: column;
	gap: 0.7em;

	// 正文栏限宽，超过这个宽度一行字读起来要转头
	max-width: 42ch;
}

.project-name {
	font-size: 1.6rem;
	font-weight: 600;

	// 大字号需要负字距才显得是排过的，不是拉开的
	letter-spacing: -0.012em;
}

.project-activity {
	display: inline-flex;
	align-items: center;
	gap: 0.35em;
	margin-left: 0.6em;
	font-size: 0.7rem;
	font-weight: normal;
	vertical-align: middle;
	color: var(--c-text-3);

	> .dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: currentcolor;
	}

	&.live {
		color: var(--c-primary);

		> .dot {
			animation: breathe 2.4s ease-in-out infinite;
		}
	}
}

@keyframes breathe {
	50% {
		opacity: 0.3;
	}
}

.project-desc {
	color: var(--c-text-2);
}

.project-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 0.2em 0.8em;
	font-size: 0.85em;
	font-variant-numeric: tabular-nums;
	color: var(--c-text-2);

	> .stars {
		display: inline-flex;
		align-items: center;
		gap: 0.2em;
	}
}

// 只画首要语言一段，其余留底色。不做 GitHub 那种彩虹条——
// 那会是这一页唯一破坏安静的东西。完整占比交给 tippy
.project-langs {
	overflow: hidden;
	height: 4px;
	border-radius: 2px;
	background-color: var(--c-border);
	cursor: help;

	> .lang-top {
		display: block;
		height: 100%;
		border-radius: 2px;
		background-color: var(--c-primary);
	}
}

// 排成 git log 的样子而不是一句营销文案
.project-commit {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.2em 0.6em;
	font-size: 0.85em;

	> .commit-label {
		color: var(--c-text-3);
	}

	> .commit-subject {
		color: var(--c-text-1);
	}

	> .commit-meta {
		grid-column: 2;
		font-variant-numeric: tabular-nums;
		color: var(--c-text-3);
	}
}

@media (prefers-reduced-motion: reduce) {
	.project {
		opacity: 1;
		transition: none;
		translate: none;
	}

	.project-activity.live > .dot {
		animation: none;
	}
}
</style>
```

`.project` 初始 `opacity: 0` 在无 JS 时会让内容永远不可见——这里可以接受：本页数据本身就是客户端取的，无 JS 时压根没有内容可显示。

- [ ] **Step 2: 改 `app/pages/project.vue` 用上新组件与骨架屏**

`<script setup>` 保持 Task 5 的样子不动，只换 `<template>` 并补 `<style>`：

```vue
<template>
<!-- 骨架按 4:3 占位，否则盆栽到货时整页跳一次 -->
<div v-if="loading" class="skeletons">
	<div v-for="n in 3" :key="n" class="skeleton" />
</div>

<div v-else-if="error" class="project-tip">
	<p>项目数据加载失败，可能是网络不通。</p>
	<ZButton icon="ri:refresh-line" text="重试" @click="refresh()" />
</div>

<p v-else-if="!projects.length" class="project-tip">
	还没有项目。
</p>

<div v-else>
	<ZProject v-for="project in projects" :key="project.slug" v-bind="project" />
</div>
</template>

<style lang="scss" scoped>
.skeletons {
	display: grid;
	gap: clamp(3rem, 10vh, 6rem);
	margin: clamp(3rem, 10vh, 6rem) 0;
}

.skeleton {
	width: min(100%, 55%);
	aspect-ratio: 4 / 3;
	border-radius: 8px;
	background-color: var(--c-bg-1);

	&:nth-child(even) {
		margin-left: auto;
	}

	@media (max-width: $breakpoint-mobile) {
		width: 100%;

		&:nth-child(even) {
			margin-left: 0;
		}
	}
}

.project-tip {
	display: grid;
	justify-items: start;
	gap: 1rem;
	margin: 3rem 0;
	color: var(--c-text-2);
}
</style>
```

- [ ] **Step 3: 验证 lint 与构建**

```bash
pnpm lint && npx stylelint '**/*.{vue,scss}' && pnpm generate
```

- [ ] **Step 4: 截图确认版式**

```bash
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=1280,2400 \
  --virtual-time-budget=10000 --screenshot=/tmp/project-desktop.png http://localhost:3000/project
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=375,2400 \
  --virtual-time-budget=10000 --screenshot=/tmp/project-mobile.png http://localhost:3000/project
```

打开两张图逐条核对：

- 四行，盆栽左右交错（第 1、3 行在左，第 2、4 行在右）
- 窄屏堆叠且盆栽恒在上，不交错
- 只有 LunaTV 和 MYDB 显示 star，blog 和 chisel 不显示
- 语言条只有首要语言一段是强调色
- 最近一条提交那行排得像 git log，日期右下
- 行与行之间没有边框、阴影、卡片

- [ ] **Step 5: 验证深浅色跟随站点开关**

这是整个改造里唯一一处依赖浏览器行为而非自有代码的地方，**不能跳过**。

`--force-prefers-color-scheme` 无效（已实测，见「验证命令」的坑 2），所以分两段验：

**5a. 机制验证（自动）** —— 确认这台机器的浏览器确实会把 `color-scheme` 传播进
`<img>` 引用的 SVG。写一个不依赖 dev server 的最小页面：

```bash
S=$(mktemp -d)
curl -s -o "$S/blog.svg" https://bonsai.shinya.click/p/blog.svg
cat > "$S/t.html" <<'EOF'
<style>
.light-page{background:#fff;color:#000;padding:12px}
.dark-page{background:hsl(220deg 0% 7%);color:#fff;padding:12px}
.plate{width:240px;display:block}
.light-page .plate{color-scheme:light}
.dark-page .plate{color-scheme:dark}
</style>
<section class="light-page"><p>祖先 color-scheme:light</p><img class="plate" src="blog.svg"></section>
<section class="dark-page"><p>祖先 color-scheme:dark</p><img class="plate" src="blog.svg"></section>
EOF
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=520,760 \
  --virtual-time-budget=5000 --screenshot=/tmp/scheme-probe.png "file://$S/t.html"
```

打开 `/tmp/scheme-probe.png`：两张图必须**一浅一深**。若两张一样，说明这台机器的
浏览器不支持传播，功能降级为跟随系统（可接受，但要在交付说明里写清楚）。

**5b. 集成验证（手动）** —— 在真浏览器里打开 `http://localhost:3000/project`，
点侧栏底部的主题开关切换浅色/深色，确认盆栽纸面跟着页面一起变，而不是纹丝不动。

自动截图这条路走不通的原因：站点的深浅色由 `@nuxtjs/color-mode` 写在
`localStorage` 里的偏好决定，命令行起的 headless 实例没法预置它。

- [ ] **Step 6: 提交**

```bash
git add app/components/partial/Project.vue app/pages/project.vue
git commit -m "feat: 项目页全宽左右交错版式

盆栽 SVG 自带纸面，那块面就是这一页唯一的容器，行本身不加边框阴影
圆角。选交错而非卡片是因为 bonsai 不返回仓库地址，这些行没有可点的
目标，卡片是导航语汇。

盆栽的深浅色此前跟系统而非站点开关：靠 img 上的 color-scheme 继承
传播进 SVG 文档解决，不支持的浏览器退回跟系统，即改造前的行为。

activity 有五个取值不是两个（还有 slowing/archived/empty），全部映射；
empty 时 svg 为 null，给虚线占位而不是留空白。"
```

---

### Task 7: 碎语工具层

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `package.json`
- Create: `app/utils/memo.ts`

**Interfaces:**
- Consumes: 无
- Produces: `Memo`、`ParsedMemo` 类型；`splitMemoImages(content: string): { text: string, images: string[] }`；`parseMemo(memo: Memo): ParsedMemo`（Task 8 用）

- [ ] **Step 1: 加 marked 依赖**

`pnpm-workspace.yaml` 的 `catalogs.util` 下按字母序插入：

```yaml
    marked: ^18.0.7
```

`package.json` 的 `dependencies` 下按字母序插入：

```json
    "marked": "catalog:util",
```

然后安装：

```bash
pnpm install
```

- [ ] **Step 2: 建 `app/utils/memo.ts`**

从 `~/Downloads/blog-clarity/app/utils/memo.ts` 搬，但砍掉链接切块那一半——链接预览卡依赖博客侧的 `/api/og` 服务端路由，主页没有这个服务，硬搬会得到一排空卡。

```ts
import { marked } from 'marked'

/** Memos 服务 /api/v1/memos 返回的单条数据（只列用得上的字段） */
export interface Memo {
	/** 形如 memos/QZbUFrYf8w3ac85s6g9LH7 */
	name: string
	content: string
	createTime: string
	pinned: boolean
	tags?: string[]
}

/** 正文已渲染、图片已摘出的 memo */
export interface ParsedMemo {
	id: string
	html: string
	images: string[]
	createTime: string
}

marked.use({ breaks: true, gfm: true })

// 两种写法：markdown 的 ![alt](src "title") 和裸 <img src="...">。
// src 后面用 (?:\s[^)]*)? 匹配可选的 title，与 src 之间以空白划清界限，
// 避免两个量词争抢同一批字符（会导致多项式回溯）
const IMAGE_RE = /!\[[^\]]*\]\(\s*([^)\s]+)(?:\s[^)]*)?\)|<img\s[^>]*?src=["']([^"']+)["'][^>]*>/g

/**
 * 把图片从正文里摘出来。
 *
 * 碎语多是手机截图，内联渲染时一张竖构图就能撑满整屏；摘出来单独走方格
 * 网格后每条的高度才可控。
 */
export function splitMemoImages(content: string) {
	const images: string[] = []
	const text = content.replace(IMAGE_RE, (_, mdSrc, htmlSrc) => {
		images.push(mdSrc || htmlSrc)
		return ''
	})
	return { text: text.trim(), images }
}

/**
 * 接口返回的 memo → 可直接渲染的 memo。
 *
 * memo 是自建 Memos 服务里自己写的内容，与文章正文同等信任，故不做净化。
 *
 * 不搬博客那套「独占一行的裸链接切成预览卡」：那依赖博客侧的 /api/og
 * 服务端路由，主页没有。裸链接交给 marked 的 gfm 自动链接，留在正文里。
 */
export function parseMemo(memo: Memo): ParsedMemo {
	const { text, images } = splitMemoImages(memo.content)
	return {
		// name 是 memos/<uid>，uid 才是稳定标识，博客的详情页路由用的就是它
		id: memo.name.split('/').pop() ?? memo.name,
		html: marked.parse(text) as string,
		images,
		createTime: memo.createTime,
	}
}
```

- [ ] **Step 3: 验证**

```bash
pnpm lint && pnpm generate
```

预期 lint 与构建都通过。`app/utils/` 下的导出会被 Nuxt 自动导入，Task 8 无需 import。

- [ ] **Step 4: 提交**

```bash
git add pnpm-workspace.yaml package.json pnpm-lock.yaml app/utils/memo.ts
git commit -m "feat: 碎语的正文解析工具

从博客搬，但砍掉链接切块那一半——预览卡依赖博客侧的 /api/og 路由，
主页没有这个服务，硬搬会得到一排空卡。裸链接交给 marked 的 gfm
自动链接留在正文里。

图片仍然摘出来单独走网格：碎语多是手机截图，一张竖构图内联渲染就能
撑满整屏。"
```

---

### Task 8: 碎语页

**Files:**
- Create: `app/components/partial/Memo.vue`
- Create: `app/pages/memos.vue`

**Interfaces:**
- Consumes: Task 7 的 `Memo`、`ParsedMemo`、`parseMemo`
- Produces: 无

- [ ] **Step 1: 建 `app/components/partial/Memo.vue`**

```vue
<script setup lang="ts">
import type { ParsedMemo } from '~/utils/memo'

const props = defineProps<ParsedMemo>()

// 评论和反应都在博客那边：giscus 的 term 是 memo/<id>，两个站点写同一条
// discussion 只会让人分不清在哪儿留的言
const blogUrl = computed(() => `https://blog.shinya.click/memos/${props.id}`)
</script>

<template>
<li class="memo">
	<!-- 整条不做成链接：正文是 v-html 出来的，里头可能有 <a>，
		嵌套锚点是非法 HTML。改由日期和页脚两个入口出站 -->
	<ZRawLink class="memo-date" :to="blogUrl">
		<ZDate :date="createTime" />
	</ZRawLink>

	<!-- 碎语是自建服务里自己写的内容，与文章正文同等信任，故不净化 -->
	<!-- eslint-disable-next-line vue/no-v-html -->
	<div class="memo-body" v-html="html" />

	<ul v-if="images.length" class="memo-images">
		<li v-for="src in images" :key="src">
			<NuxtImg :src="src" alt="" loading="lazy" />
		</li>
	</ul>

	<ZRawLink class="memo-more" :to="blogUrl">
		在博客查看
		<Icon name="ri:arrow-right-line" />
	</ZRawLink>
</li>
</template>

<style lang="scss" scoped>
.memo {
	display: flex;
	flex-direction: column;
	gap: 0.6em;
	margin-bottom: 1.5rem;
	padding: 1rem;

	// 1px 描边环，比实心卡片轻，条目多时不至于糊成一片
	border-radius: 8px;
	box-shadow: 0 0 0 1px var(--c-bg-soft);
}

.memo-date {
	font-size: 0.8em;
	color: var(--c-text-3);
	transition: color 0.2s;

	&:hover {
		color: var(--c-primary);
	}
}

.memo-body {
	line-height: 1.7;

	// v-html 出来的内容拿不到 scoped 属性，要用 :deep 才能命中
	:deep(p + p) {
		margin-top: 0.6em;
	}

	:deep(a) {
		color: var(--c-primary);
		word-break: break-all;
	}

	:deep(blockquote) {
		margin: 0.6em 0;
		padding-left: 0.8em;
		border-left: 2px solid var(--c-border);
		color: var(--c-text-2);
	}

	:deep(ul),
	:deep(ol) {
		margin: 0.6em 0;
		padding-left: 1.4em;
		list-style: revert;
	}

	:deep(pre) {
		overflow-x: auto;
		padding: 0.6em 0.8em;
		border-radius: 6px;
		background-color: var(--c-bg-1);
	}

	:deep(code) {
		font-size: 0.9em;
	}
}

.memo-images {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	gap: 6px;

	img {
		width: 100%;
		aspect-ratio: 1;
		border-radius: 6px;
		object-fit: cover;
	}
}

.memo-more {
	display: inline-flex;
	align-items: center;
	gap: 0.2em;
	align-self: flex-start;
	font-size: 0.8em;
	color: var(--c-text-3);
	transition: color 0.2s;

	&:hover {
		color: var(--c-primary);
	}
}
</style>
```

- [ ] **Step 2: 建 `app/pages/memos.vue`**

```vue
<script setup lang="ts">
import type { Memo } from '~/utils/memo'

useHead({ title: '碎语' })
definePageMeta({ headerText: '来不及写成文章的短想法' })

interface MemoPage {
	memos?: Memo[]
	nextPageToken?: string
}

const MEMOS_API = 'https://memos.shinya.click/api/v1/memos'
const PAGE_SIZE = 20

const memos = ref<Memo[]>([])
const nextPageToken = ref('')
const loadingMore = ref(false)

function fetchPage(pageToken?: string) {
	return $fetch<MemoPage>(MEMOS_API, {
		query: { pageSize: PAGE_SIZE, ...(pageToken && { pageToken }) },
	})
}

// server: false —— 碎语更新频繁，构建期取数会一直停在上次部署的快照
const { status, error, refresh } = useLazyAsyncData('memos', async () => {
	const page = await fetchPage()
	memos.value = page.memos ?? []
	nextPageToken.value = page.nextPageToken ?? ''
	return true
}, { server: false })

// server: false 时服务端根本不取数，status 停在 idle 而非 pending。
// 漏掉 idle 会让预渲染的 HTML 直接落到空列表分支，写上「还没有碎语」
const loading = computed(() => status.value === 'idle' || status.value === 'pending')

async function loadMore() {
	if (loadingMore.value || !nextPageToken.value)
		return
	loadingMore.value = true
	try {
		const page = await fetchPage(nextPageToken.value)
		memos.value.push(...(page.memos ?? []))
		nextPageToken.value = page.nextPageToken ?? ''
	}
	finally {
		loadingMore.value = false
	}
}

const parsedMemos = computed(() => memos.value.map(parseMemo))
</script>

<template>
<ZTitle icon="💬">
	<span class="badge-text">同步自
		<ZRawLink to="https://memos.shinya.click"><mark>Memos</mark></ZRawLink>
	</span>
</ZTitle>

<p v-if="loading" class="memo-tip">
	加载中…
</p>

<div v-else-if="error" class="memo-tip">
	<p>碎语加载失败，可能是网络不通。</p>
	<ZButton icon="ri:refresh-line" text="重试" @click="refresh()" />
</div>

<p v-else-if="!parsedMemos.length" class="memo-tip">
	还没有碎语。
</p>

<template v-else>
	<ol class="memo-list">
		<ZMemo v-for="memo in parsedMemos" :key="memo.id" v-bind="memo" />
	</ol>

	<div class="memo-footer">
		<ZButton
			v-if="nextPageToken"
			:icon="loadingMore ? 'ri:loader-4-line' : 'ri:arrow-down-line'"
			:text="loadingMore ? '加载中' : '加载更多'"
			@click="loadMore"
		/>
		<p v-else class="memo-tip">
			共 {{ parsedMemos.length }} 条，没有更多了
		</p>
	</div>
</template>
</template>

<style lang="scss" scoped>
.memo-list {
	max-width: 42rem;
}

.memo-footer {
	display: flex;
	justify-content: center;
	margin: 2rem 0;
}

.memo-tip {
	display: grid;
	justify-items: center;
	gap: 1rem;
	margin: 2rem 0;
	font-size: 0.9em;
	text-align: center;
	color: var(--c-text-3);
}
</style>
```

- [ ] **Step 3: 验证 lint 与构建**

```bash
pnpm lint && npx stylelint '**/*.{vue,scss}' && pnpm generate
```

- [ ] **Step 4: 先确认 CORS 已放行，再截图**

```bash
curl -s -D- -o /dev/null -H "Origin: https://shinya.click" \
  "https://memos.shinya.click/api/v1/memos?pageSize=1" | grep -i access-control-allow-origin
```

预期看到 `access-control-allow-origin: https://shinya.click`。**若这条没有输出，说明站外前置条件第 1 条还没做，碎语页必然是空的——停下来报告，不要把截图失败当成代码问题。**

```bash
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=1280,1600 \
  --virtual-time-budget=10000 --screenshot=/tmp/memos.png http://localhost:3000/memos
```

注意：dev server 跑在 `http://localhost:3000`，它的 Origin 与线上不同，本地可能同样被 CORS 拦。本地验证若拦了，是预期行为，以线上部署后的结果为准；此时至少要确认页面落到的是错误态而不是白屏或崩溃。

打开图确认：列出碎语、markdown 渲染正常（引用块、列表、代码块）、图片走方格网格、每条底部有「在博客查看」。

- [ ] **Step 5: 提交**

```bash
git add app/components/partial/Memo.vue app/pages/memos.vue
git commit -m "feat: 碎语页

整条不做成链接：正文是 v-html 出来的，里头可能有 <a>，嵌套锚点是非法
HTML。改由日期和页脚两个入口出站。

不搬 giscus：博客那边 term 是 memo/<id>，两个站点写同一条 discussion
只会让人分不清在哪儿留的言。"
```

---

### Task 9: README 与残留清查

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: 无
- Produces: 无

- [ ] **Step 1: 重写 `README.md`**

```markdown
# shinya 的个人主页

基于 [L33Z22L11/homepage-v5](https://github.com/L33Z22L11/homepage-v5) 改造，Nuxt.js + SSG。

## 数据源

三个页面的内容都来自自建服务，全部客户端取数：

| 页面 | 源 |
|---|---|
| 项目 | `bonsai.shinya.click/api/projects` —— 项目聚合，不暴露仓库地址 |
| 文章 | `blog.shinya.click/atom.xml`，经 `/api/feed/blog` 转成 JSON |
| 碎语 | `memos.shinya.click/api/v1/memos` |

碎语所在的 memos 服务用 Origin 白名单做 CORS，本站域名须在白名单内，否则该页为空。

## 开发

```sh
pnpm i
pnpm dev
```

## 构建

```sh
pnpm generate
pnpm preview
```

- 构建命令：`pnpm generate`
- 输出目录：`dist`

## 许可证

项目本体 [MIT](LICENSE)。
```

- [ ] **Step 2: 全站清查纸鹿残留**

```bash
grep -rniE "zhilu|L33Z22L11|纸鹿|cooo\.site|xiyoulinux|thisis\.host|169994096" \
  app/ public/ *.ts *.md README.md 2>/dev/null
```

预期只剩两处，都是有意保留的出处致谢：`app/pages/home.vue` 的「关于主页」一节，和 `README.md` 的首行。**其他任何命中都要处理掉。**

上游 README 要求不得以其名义发布镜像站点并希望保留项目链接——删净身份信息、保留出处链接，两条都满足。

- [ ] **Step 3: 全量验证**

```bash
pnpm lint && npx stylelint '**/*.{vue,scss}' && pnpm generate
ls .output/public/
ls .output/public/api/feed/
```

预期：
- lint 与 stylelint 都过
- 构建成功
- `.output/public/` 下有 `article/`、`project/`、`memos/`，**没有** `site/`、`log/`
- `.output/public/api/feed/blog` 存在

- [ ] **Step 4: 四页逐个截图，桌面与移动各一遍**

```bash
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
for p in "" article project memos; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=1280,1800 \
    --virtual-time-budget=10000 --screenshot="/tmp/final-desktop-${p:-home}.png" "http://localhost:3000/$p"
  "$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=375,1800 \
    --virtual-time-budget=10000 --screenshot="/tmp/final-mobile-${p:-home}.png" "http://localhost:3000/$p"
done
```

八张图全部打开查看。任何一页在 375px 下出现横向滚动或元素溢出都要修掉再继续。

- [ ] **Step 5: 确认错误页仍正常**

```bash
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=1280,800 \
  --virtual-time-budget=6000 --screenshot=/tmp/404.png http://localhost:3000/no-such-page
```

`app/error.vue` 用了 `ZSidebar` / `ZHeader` / `ZTitle` / `ZField` / `ZButton`，删页后这些都还在。打开图确认 404 页有侧栏、有「返回主页」按钮。

- [ ] **Step 6: 提交**

```bash
git add README.md
git commit -m "docs: 重写 README

原文是上游作者的项目说明与 QQ 群答疑。保留出处链接，补上三个数据源
的说明以及 memos 那条 CORS 白名单的前置条件——不写下来的话下次部署
到新域名时碎语页会莫名其妙地空掉。"
```

---

## 自查记录

**规格覆盖**：设计文档逐节核对——站点身份 → Task 1；侧边栏与路由 → Task 1（nav）+ Task 2（删页）；站点图标 → Task 1；简介页 → Task 3；项目页 → Task 5（数据）+ Task 6（版式）；文章页 → Task 4；碎语页 → Task 7（工具）+ Task 8（页面）；数据流与错误态 → 分散在 4/5/6/8，三页的 idle+pending 判定都写进了代码；依赖变更 → Task 7；删除清单 → Task 2 与 Task 5；验证方式 → 各任务的验证步骤 + Task 9 的全量验证。

**实施期发现的两处设计调整**，已在计划中体现并注明理由：

1. **`activity` 是五个取值不是两个**。设计文档只写了 active / idle，实际类型是 `'empty' | 'archived' | 'active' | 'slowing' | 'idle'`。Task 6 全部映射，并为 `empty`（此时 `svg` 为 `null`）加了虚线占位。
2. **碎语整条不做成链接**。设计文档写的是「整条点击跳博客」，但正文是 `v-html` 出来的、里头可能有 `<a>`，嵌套锚点是非法 HTML。改为日期 + 页脚两个出站入口。

**类型一致性**：`BonsaiProject` 的字段名与 Task 6 组件里用到的 `stats.languages`、`stats.commitsLast7d`、`commits[0].author`、`svg`、`activity` 一一对应；`ParsedMemo` 的 `id` / `html` / `images` / `createTime` 与 Task 8 组件的 props 一致。
