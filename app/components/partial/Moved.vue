<script setup lang="ts">
import type { OgData } from '~/composables/useOgData'
import type FeedProps from '~/types/feed'
import type { LegacyTarget } from '~/utils/legacy'

/**
 * 「这条旧链接的东西搬去哪了」的告知页，由 error.vue 在 404 且认出旧博客地址时挂出。
 *
 * 主体是那条路径本身：多出来的 blog. 展开进来、旧 host 灰下去、路径纹丝不动。
 * 读者看完这一下就学会了规则（前面加个 blog.），下次自己会改。下方的卡片是佐证——
 * 把那篇文章的真实标题、摘要和发布时间摆出来，让人确认「对，就是这篇」。
 *
 * 刻意不自动跳转：读者常常是想先确认这是不是自己要找的那篇，倒计时会把这个机会抢走。
 */
const props = defineProps<{
	target: LegacyTarget
	/** 访客敲进来的原始路径，原样显示——认得出自己点的是哪条，提示才有着落 */
	path: string
}>()

const article = computed(() => props.target.kind === 'article' ? props.target : null)

interface Preview {
	title: string
	description?: string
	published?: string
}

/** 只有文章需要跑一趟确认，其余三类是静态规则，没什么可确认的 */
type Status = 'static' | 'checking' | 'found' | 'gone'

// 初值就得是 checking，不能等 onMounted 再置：服务端渲染的那一帧照样会走这里，
// 起手为 static 的话首屏落到 v-else 那个兜底分支上，按钮先闪一下才换成骨架
const status = ref<Status>(props.target.kind === 'article' ? 'checking' : 'static')
const preview = ref<Preview>()

/** atom 的 title/summary 可能是纯字符串，也可能是带 $type 的对象，同 ZArticle 的处理 */
function atomText(value: string | { _: string } | undefined) {
	return typeof value === 'string' ? value : value?._
}

const TITLE_SEPARATOR_RE = /\s[|｜\-–—·]\s*$/

/**
 * 切掉标题尾巴上的站名（「GFW 原理考 | 信也のブログ」→「GFW 原理考」）。
 *
 * 只在确实以站名结尾、且站名前面就是个分隔符时才动手——照搬 endsWith 会把
 * 一篇正好叫「……信也のブログ」的文章削掉半个标题。
 */
function stripSiteName(title: string, siteName?: string) {
	if (!siteName || !title.endsWith(siteName))
		return title
	const head = title.slice(0, -siteName.length)
	return TITLE_SEPARATOR_RE.test(head) ? head.replace(TITLE_SEPARATOR_RE, '') : title
}

/** 落空之后顺手推几篇。列表不长——这是条出路，不是又一个要读完的页面 */
const VISIBLE_RECENT = 5
/**
 * 多取一条专门喂给底部的渐隐：淡掉的是第 6 条，前 5 条保持清晰。
 * 只渲染 5 条再把末行淡掉的话，看得清的其实只有 4 条（同 ZProject 里那份提交日志）
 */
const recent = ref<FeedProps[]>([])
const recentTruncated = ref(false)

function entryUrl(entry: FeedProps) {
	return entry.link?.$href || entry.id
}

/**
 * 订阅源。它在构建期就烘成了静态 JSON（/article 页用的同一个地址），走 CDN、不惊动
 * 函数，而且给的是博客自己的标题、摘要和发布时间——比 og 标签干净，也是唯一能拿到
 * 发布日期的地方。旧站那 42 篇文章，它眼下只差一篇没覆盖到。
 *
 * 一次请求两用：既拿来认这篇文章，也拿来铺下面那串「最近还写了」。
 */
async function loadFeed() {
	return await $fetch<{ title?: string, posts?: FeedProps[] }>('/api/feed/blog').catch(() => undefined)
}

async function lookupOg(url: string, siteName?: string): Promise<Preview | undefined> {
	// 订阅源里没有：兴许是篇没进订阅源的旧文，兴许哪天订阅源被截成了最近 N 条。
	// 退回 og 端点实时抓一次，代价是一次函数调用，好在结果 CDN 缓存一周
	const og = await $fetch<OgData>('/api/og', { query: { url } }).catch(() => undefined)
	// og:site_name 不是每页都有（漏了的那几页连 og:title 都没有，标题是从 <title>
	// 兜回来的，站名正挂在尾巴上），故拿订阅源的站名兜底
	const title = og?.title && stripSiteName(og.title, og.siteName || siteName)

	// 标题都抓不到就按「那边也没有」处理。宁可停在本页给一个还活着的去处，
	// 也别送人去博客再吃一记 404——两种猜错里，这一种的下场好得多
	return title ? { title, description: og?.description } : undefined
}

onMounted(async () => {
	const url = article.value?.url
	const feed = await loadFeed()
	const posts = feed?.posts ?? []

	if (url) {
		const entry = posts.find(item => entryUrl(item) === url)
		preview.value = entry
			? { title: atomText(entry.title) ?? '', description: atomText(entry.summary), published: entry.published }
			: await lookupOg(url, feed?.title)
		status.value = preview.value ? 'found' : 'gone'
	}

	// 排掉正在展示的那一篇，免得同一个标题在页面上出现两次
	const rest = posts.filter(item => entryUrl(item) !== url)
	recent.value = rest.slice(0, VISIBLE_RECENT + 1)
	// 没多出那一条就别淡：总共只有五篇的时候，渐隐会把一条完整的文章吃掉半个
	recentTruncated.value = rest.length > VISIBLE_RECENT
})

/**
 * 事由由上面那行小字统一交代（博客域名迁移），这里只说这一条路径的下落，
 * 四句一个句式，读者扫一眼就知道自己落在哪一格里。
 */
const lead = computed(() => {
	// 那边也没有的时候还说「搬过去了」，和下面「没找到」那句自相矛盾，而且上面
	// 那条变形后的地址点进去还是 404。改口，但保留变形——host 换了是真的，
	// 只是这一条路径两边都没有
	if (props.target.kind === 'article' && status.value === 'gone')
		return '新域名下也没有这个地址'

	return {
		article: '这篇跟着搬过去了',
		archive: '这个标签不再单独成页',
		profile: '关于页已合并到主页',
		links: '友链跟着搬过去了',
	}[props.target.kind]
})

/** 认出来了但那边也没有，出口就得换成一个确定还活着的地方 */
const action = computed(() => {
	if (props.target.kind === 'article') {
		return status.value === 'gone'
			? { icon: 'ri:archive-line', text: '去博客归档翻翻', to: blogArchiveUrl }
			: { icon: 'ri:arrow-right-line', text: '去博客阅读', to: props.target.url }
	}
	if (props.target.kind === 'profile')
		return { icon: 'ri:id-card-line', text: '看看简介', to: '/' }
	if (props.target.kind === 'links')
		return { icon: 'ri:link-m', text: '去看友链', to: blogLinksUrl }
	return { icon: 'ri:archive-line', text: '去博客归档', to: blogArchiveUrl }
})

/**
 * 找文章、翻标签的人才需要这串推荐；找「关于」和友链的是导航意图，给个去处就够了，
 * 再塞一列文章反而答非所问。
 */
const showRecent = computed(() => recent.value.length > 0
	&& (props.target.kind === 'article' || props.target.kind === 'archive'))

const note = computed(() => {
	const { target } = props
	if (target.kind === 'article')
		return status.value === 'gone' ? '这个链接可能不完整，也可能文章已经撤下了。' : undefined
	if (target.kind === 'archive')
		return target.tag ? `「${target.tag}」下的文章都收在博客的归档里。` : '文章都收在博客的归档里。'
	if (target.kind === 'profile')
		return '你现在看到的就是新的关于页。'
	return undefined
})
</script>

<template>
<div class="moved">
	<!--
		先把事由摆在最上面：出岔子的不是某一篇文章，是整个博客换了地方。
		交代过这一句，下面那条地址的变形就成了它的实例，不必再补一句「其余地址也一样」
	-->
	<p class="moved-kicker">
		博客域名迁移
	</p>
	<p class="moved-lead">
		{{ lead }}
	</p>

	<!-- 变形只对文章成立：host 加个 blog. 就是新地址，路径一个字都不用动 -->
	<div v-if="article" class="moved-url">
		<span class="url-added"><span>{{ blogHostParts.added }}</span></span><span class="url-base">{{ blogHostParts.base }}</span><span class="url-path">{{ article.path }}</span>
	</div>
	<!-- 其余三类在新站上没有对应物，不做变形的承诺，划掉才是实话 -->
	<div v-else class="moved-url dead">
		<span class="url-base">{{ siteHost }}</span><span class="url-path">{{ path }}</span>
	</div>

	<!--
		两种去向，两种过渡，名字不同是为了让 CSS 分得开。

		骨架 → 卡片（swap）：这是同一件东西的两个状态，占位换成实物，因此原地交叉淡入，
		两者叠在同一格里同时在场。用 out-in 的话卡片会先塌成零高、隔一拍再长回来，
		读者看到的是「出现、消失、又出现」，是三下而不是一下。

		骨架 → 兜底（collapse）：卡片是真的没了，那就该往上收起来，out-in 收完再进。
	-->
	<div class="moved-result" aria-live="polite">
		<Transition
			:name="status === 'gone' ? 'result-collapse' : 'result-swap'"
			:mode="status === 'gone' ? 'out-in' : undefined"
		>
			<!--
				骨架逐行对着真卡片摆：日期、标题、三行摘要、右下角那个动作。
				行数对不上的话，实物换上来时高度会跳一大截，下面的注解和列表跟着弹一下
			-->
			<div v-if="status === 'checking'" key="skeleton" class="moved-card skeleton">
				<span class="skeleton-bar w-date" />
				<span class="skeleton-bar w-title" />
				<span class="skeleton-bar w-desc" />
				<span class="skeleton-bar w-desc" />
				<span class="skeleton-bar w-desc-last" />
				<span class="skeleton-bar w-action" />
			</div>

			<ZRawLink v-else-if="preview && article" key="card" class="moved-card" :to="article.url">
				<ZDate v-if="preview.published" class="card-date" :date="preview.published" />
				<h2 class="card-title">
					{{ preview.title }}
				</h2>
				<p v-if="preview.description" class="card-description">
					{{ preview.description }}
				</p>
				<span class="card-action">
					{{ action.text }}
					<Icon name="ri:arrow-right-line" />
				</span>
			</ZRawLink>

			<div v-else key="fallback" class="moved-fallback">
				<p v-if="note">
					{{ note }}
				</p>
				<ZButton v-bind="action" primary />
			</div>
		</Transition>
	</div>

	<section v-if="showRecent" class="moved-recent">
		<h2 class="recent-title">
			最近还写了
		</h2>
		<!--
			两层壳各司其职：reveal 负责 0fr → 1fr 地往下展开，clip 是被它压扁的那一格；
			渐隐则挂在最里头的 ul 上——ul 始终是自然高度，蒙版的位置才不会跟着展开动画
			一起滑，展开过程就是一道干净的下拉擦除
		-->
		<div class="recent-reveal">
			<div class="recent-clip">
				<ul class="recent-list" :class="{ truncated: recentTruncated }">
					<li v-for="item in recent" :key="item.id">
						<ZDate class="recent-date" :date="item.published" format="date" />
						<ZRawLink class="recent-link" :to="entryUrl(item)">
							{{ atomText(item.title) }}
						</ZRawLink>
					</li>
				</ul>
			</div>
		</div>
	</section>
</div>
</template>

<style lang="scss" scoped>
/*
 * 版心和垂直居中由 error.vue 的 .stage 负责，这里只管内容。
 *
 * 事由行做成小字加宽字距的眉题：字号只有导语的三分之二、颜色是全站最淡的一档，
 * 抢不走下面那条地址的主角位；字距拉开则让这六个字读起来像一则告示的抬头，
 * 而不是正文的第一句。它不参与任何入场动画——地址那一下才是这页要演的东西，
 * 眉题若也动起来，读者的眼睛会先被上面这行勾走。
 */
.moved-kicker {
	margin-bottom: 0.35rem;
	font-size: 0.75em;
	letter-spacing: 0.14em;
	color: var(--c-text-3);
}

.moved-lead {
	margin-bottom: 0.8rem;
	font-size: 1.1rem;
	color: var(--c-text-2);
}

// 路径是这页的主体，故给到接近标题的字号。三段的分界靠颜色区分，不靠字体——
// 三段本来就同一个字体，靠字体分不开
.moved-url {
	display: flex;
	flex-wrap: wrap;
	align-items: center;

	// anywhere 而不是 word-break: break-all。两者都保证再长的地址也不会撑破版心，
	// 区别在换行点：break-all 见缝就断，把 slug 里现成的连字符白白浪费掉
	// （intelligenc / e-chatgpt）；anywhere 优先在连字符和斜杠这些天然断点上断，
	// 断不开时才退回逐字符。窄屏下这条地址要占三行，断在哪里就很显眼了
	overflow-wrap: anywhere;
	margin-bottom: clamp(1.6rem, 5vh, 2.4rem);
	font-family: var(--font-monospace);
	font-size: clamp(0.95rem, 3.4vw, 1.4rem);
	line-height: 1.5;

	// 作废与否交给删除线去说，路径本身仍留在 --c-text-2：这几页背后没有卡片挡着
	// 那个大号 404，再降到全站最淡的 --c-text-3 就会和底纹糊在一起
	&.dead {
		text-decoration: line-through;
		text-decoration-color: var(--c-text-3);

		> .url-base {
			color: var(--c-text-3);
		}

		> .url-path {
			color: var(--c-text-2);
		}
	}
}

// 全站唯一一处饱和色落在这里：新增的那一截，也是读者唯一需要记住的东西。
// 展开用 grid 的 0fr → 1fr，不用 max-width 到某个 ch 值。ch 是「0」这个字形的宽度，
// 只在真等宽字体里才等于每个字符的宽度——这条曾经踩过：--font-monospace 那时整条落在
// Inter 上（见 main.scss 的注解），5ch 比「blog.」真实宽度宽了 38%，动画名义上还在跑，
// 看得见的展开早在七成处就结束了。字体栈现在修好了，5ch 也确实等于五个字符，但仍旧
// 不改回去：0fr → 1fr 量的是内容自己，换字体、改前缀都不用重新算这个数
.url-added {
	display: grid;
	flex-shrink: 0;
	grid-template-columns: 1fr;
	border-radius: 3px;
	color: var(--c-primary);

	> span {
		overflow: hidden;
		min-width: 0;
		white-space: nowrap;
	}

	// 终态即默认态，入场用 backwards 倒推：动画被关掉时页面直接是对的，
	// 不会卡在收拢状态上把前缀吞掉。
	// 节奏是这页唯一要讲的事，得慢到能读：先留 0.6s 让人看清自己敲进来的那条地址，
	// 再花 0.85s 把 blog. 一个字一个字撑开。缓动用 easeOutCubic 而不是更陡的
	// easeOutQuint——后者九成的位移挤在头 200ms 里，时长拉多长都是「闪一下再爬」
	animation:
		added-in 0.85s 0.6s backwards cubic-bezier(0.33, 1, 0.68, 1),
		added-glow 2s 0.6s backwards;
}

.url-base {
	flex-shrink: 0;
	color: var(--c-text-3);

	// 压着前缀展开的后半程褪色，两件事读起来是同一个动作
	animation: base-fade 0.8s 0.85s backwards;
}

// 路径不参与任何变化，这正是要传达的信息
.url-path {
	min-width: 0;
	color: var(--c-text-1);
}

@keyframes added-in {
	from {
		grid-template-columns: 0fr;
		opacity: 0;
	}
}

// 光晕用 box-shadow 而非 padding + 背景：它不占布局，不会打乱上面那道 ch 宽度的账。
// 40% 正好是前缀撑开的那 0.85s，撑完才开始褪
@keyframes added-glow {
	0%, 40% {
		box-shadow: 0 0 0 4px var(--c-primary-soft);
	}

	100% {
		box-shadow: 0 0 0 4px transparent;
	}
}

@keyframes base-fade {
	from {
		color: var(--c-text-1);
	}
}

@media (prefers-reduced-motion: reduce) {
	.url-added,
	.url-base {
		animation: none;
	}
}

/*
 * 骨架 ⇄ 卡片的过渡。
 *
 * 这几条必须**比 .moved-card 更具体**，写成 .moved-result > 的后代形式（三个选择器
 * 单元，压过 .moved-card 的两个）。平铺成 .result-enter-active 的话与 .moved-card
 * 同权重，而后者在文件里排得更靠后、又恰好也声明了 transition（悬停用的
 * box-shadow / background-color），于是整条 transition 被它顶掉：opacity 和
 * transform 一个都不过渡，卡片从 opacity 0 直接跳到 1——类名照加、动画没有，
 * 光看计算样式的某一帧根本看不出来，得盯 transitionrun 事件才现形。
 */
.moved-result {
	// 单格叠放：交叉淡入时进场和退场的那两个要占同一块地方，否则它们会上下排开、
	// 把下文顶下去一整屏。行高取两者中较高的那个，谁也不会被挤掉
	display: grid;
	grid-template-areas: "stack";
	grid-template-rows: 1fr;
	transition: grid-template-rows 0.45s cubic-bezier(0.33, 1, 0.68, 1);

	> * {
		grid-area: stack;
	}

	// ── 骨架 ⇄ 卡片：原地换脸，只动透明度。高度不参与，免得刚出现就上下弹一下。
	// 淡出比淡入短，但两条同时起步、区间重叠——中途绝不能出现两个都接近透明的那一帧，
	// 那正是上一版「卡片消失了又出现」的观感来源。骨架的条子本就是照着卡片的行摆的，
	// 交叠的那半秒里文字压在自己的占位条上，读起来是条子显影成字，不是两张图打架
	> .result-swap-enter-active {
		transition: opacity 0.55s cubic-bezier(0.33, 1, 0.68, 1);
	}

	> .result-swap-leave-active {
		transition: opacity 0.35s;
	}

	> .result-swap-enter-from,
	> .result-swap-leave-to {
		opacity: 0;
	}

	// ── 骨架 → 兜底：往上收起。
	// 高度必须跟着一起动，只淡透明度的话，元素被移除的那一帧高度直接归零，下面的
	// 注解和推荐列表会整块弹上来——看着就是「啪」地没了，而不是收起来。
	// 1fr → 0fr 同 .recent-reveal 那处：量的是内容自己，两个态高度不一样也不必各写
	// 一个值。这条只挂 collapse 的退场类：swap 那边两个元素同时在场，压到 0fr 会把
	// 正在进场的那个也一起吞掉
	&:has(> .result-collapse-leave-active) {
		grid-template-rows: 0fr;
	}

	// 行被压扁时得真的裁掉内容，否则 0fr 只是数字上归零，画面没变化
	> .result-collapse-leave-active,
	> .result-collapse-enter-active {
		overflow: hidden;
		min-height: 0;
	}

	// 退场略快于进场，且带一点上移——「收起」这件事要有方向感。
	// transform 的时长必须和上面那条 grid-template-rows 一致：Vue 按退场元素自身最长的
	// 那条过渡决定何时把它摘掉，摘掉的瞬间 :has() 不再命中、行高就松手了。transform
	// 短于行高的话，卡片早已不在而行还在慢慢收，看着像收了个空
	> .result-collapse-leave-active {
		transition: opacity 0.3s, transform 0.45s cubic-bezier(0.33, 1, 0.68, 1);
	}

	> .result-collapse-leave-to {
		opacity: 0;
		transform: translateY(-6px);
	}

	> .result-collapse-enter-active {
		transition: opacity 0.45s, transform 0.45s cubic-bezier(0.33, 1, 0.68, 1);
	}

	> .result-collapse-enter-from {
		opacity: 0;
		transform: translateY(8px);
	}

	@media (prefers-reduced-motion: reduce) {
		&,
		> [class*="-enter-active"],
		> [class*="-leave-active"] {
			transition: none;
		}
	}
}

// 描边而非实心卡，同碎语的链接预览卡：这页也只有这一个「块」。
// 刻意不给底色——背后那个 404 是空心描边的，让它从卡片下面横穿过去正是本意；
// 一旦填上不透明底，卡片就又成了横切轮廓的一块白板
.moved-card {
	display: block;
	padding: 1rem 1.1rem;
	border-radius: 8px;
	box-shadow: 0 0 0 1px var(--c-bg-soft);
	transition: box-shadow 0.2s, background-color 0.2s;

	&:hover,
	&:focus-visible {
		box-shadow: 0 0 0 1px var(--c-primary);
		background-color: var(--c-primary-soft);
	}
}

.card-date {
	font-size: 0.8em;
	color: var(--c-text-3);
}

.card-title {
	margin: 0.3em 0;
	font-size: 1.15em;
	font-weight: 600;
	color: var(--c-text);
}

// 三行封顶：博客的摘要长短不一，有几篇能写到两百字
.card-description {
	display: -webkit-box;
	overflow: hidden;
	font-size: 0.9em;
	-webkit-line-clamp: 3;
	line-clamp: 3;
	color: var(--c-text-2);
	-webkit-box-orient: vertical;
}

.card-action {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.3em;
	margin-top: 0.8em;
	font-size: 0.85em;
	color: var(--c-primary);
}

.skeleton {
	display: grid;
	gap: 0.6rem;

	> .skeleton-bar {
		height: 0.9em;
		border-radius: 4px;
		background-color: var(--c-bg-soft);
		animation: skeleton-pulse 1.6s ease-in-out infinite;
	}

	> .w-date {
		width: 5rem;
	}

	> .w-title {
		width: 60%;
		height: 1.15em;
	}

	> .w-desc {
		width: 92%;
	}

	> .w-desc-last {
		width: 64%;
	}

	// 对应卡片右下角那个「去博客阅读 →」
	> .w-action {
		justify-self: end;
		width: 6rem;
		height: 0.85em;
		margin-top: 0.2em;
	}
}

@keyframes skeleton-pulse {
	50% {
		opacity: 0.4;
	}
}

@media (prefers-reduced-motion: reduce) {
	.skeleton > .skeleton-bar {
		animation: none;
	}
}

.moved-fallback {
	display: grid;
	justify-items: start;
	gap: 1rem;
	color: var(--c-text-2);
}

// 一条发丝线把「你要找的那篇」和「顺便看看」隔开：上面是答案，下面是出路，
// 两件事不该长得一样重
.moved-recent {
	margin-top: clamp(2rem, 6vh, 3rem);
	padding-top: 1.2rem;
	border-top: 1px solid var(--c-border);
}

.recent-title {
	margin-bottom: 0.8rem;
	font-size: 0.85em;
	font-weight: normal;
	color: var(--c-text-3);
}

// 往下展开。0fr → 1fr 同 .url-added 那处：量的是内容自己，行数变了也不用重算高度。
// 时长对齐上面那条前缀展开的 0.85s：两处是同一种手势（0fr → 1fr 把内容让出来），
// 该用同一个速度。原来的 0.6s 是照 hover 那档反馈定的，比这页自己的节拍快了三成。
// 对不齐的是起点，也不必对齐：这一段要等订阅源回来才挂上，delay 是从挂载那刻算的，
// 实测比前缀晚 0.3s（缓存命中）到 1.3s（回落 og 抓取）不等，追求「同时收尾」是空想
.recent-reveal {
	display: grid;
	grid-template-rows: 1fr;
	animation: recent-unfold 0.85s 0.6s backwards cubic-bezier(0.33, 1, 0.68, 1);
}

// 被压扁的那一格。min-height: 0 不能省，否则 0fr 仍会撑到内容的最小高度，展不动
.recent-clip {
	overflow: hidden;
	min-height: 0;
}

// 日期列用 subgrid 对齐，同项目页那份提交日志——日期宽度不一时才不会各行乱晃
.recent-list {
	display: grid;
	grid-template-columns: auto minmax(0, 1fr);
	gap: 0.45em 1.2em;
	font-size: 0.9em;

	> li {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
		align-items: baseline;
	}

	// 停在 em 而不是百分比：淡的始终是末行那一条，与列表有几行无关
	&.truncated {
		mask-image: linear-gradient(to bottom, #000 calc(100% - 2em), transparent calc(100% - 0.2em));
	}
}

@keyframes recent-unfold {
	from {
		grid-template-rows: 0fr;
	}
}

@media (prefers-reduced-motion: reduce) {
	.recent-reveal {
		animation: none;
	}
}

.recent-date {
	font-variant-numeric: tabular-nums;
	color: var(--c-text-3);
}

.recent-link {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--c-text-2);
	transition: color 0.2s;

	&:hover,
	&:focus-visible {
		color: var(--c-primary);
	}
}
</style>
