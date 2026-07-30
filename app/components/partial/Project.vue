<script setup lang="ts">
import type { BonsaiActivity, BonsaiProject } from '~/types/bonsai'
import { normalizeLanguages } from '~/utils/languageColor'

const props = defineProps<BonsaiProject>()

const ACTIVITY: Record<BonsaiActivity, { text: string, live: boolean }> = {
	active: { text: '活跃', live: true },
	slowing: { text: '放缓', live: false },
	idle: { text: '近期无更新', live: false },
	archived: { text: '已归档', live: false },
	empty: { text: '空仓', live: false },
}

// bonsai 是独立部署、独立演进的服务，前端和它之间没有编译期契约：
// 拿到一个未映射的枚举值，或者字段整个缺失，都是现实会发生的事，
// 不该让 activity/languages 兜不住而让整个 <main> 空白
const activityInfo = computed(() => ACTIVITY[props.activity] ?? ACTIVITY.idle)

const languageSegments = computed(() => normalizeLanguages(props.stats?.languages ?? []))
const topLanguage = computed(() => languageSegments.value[0])

// star 少于 10 是噪音：blog 和 chisel 各 1 star，写出来毫无信息。
// 阈值让 LunaTV(9158) 和 MYDB(1169) 自然获得小项目没有的视觉重量
const showStars = computed(() => (props.stats?.stars ?? 0) >= 10)

const languageSummary = computed(() => languageSegments.value
	.map(language => `${language.name} ${language.normalizedPercentage.toFixed(1)}%`)
	.join(' · '))
const languageTip = computed(() => ({ content: languageSummary.value }))
const languageLabel = computed(() => `语言占比：${languageSummary.value}`)

// bonsai 每个项目都送来 9–10 条提交，之前只画 commits[0]，其余九条丢掉，
// 文字栏却空着。排成 git log——填充物是现成的真数据，不用为了撑版面造话，
// 也不用把字号放大来占地方
const VISIBLE_COMMITS = 5

// 多取一条，专门给渐隐去淡：淡掉的是第 6 条，前 5 条保持清晰可读。
// 只渲染 5 条再把末行淡掉的话，看得清的其实只有 4 条
const recentCommits = computed(() => props.commits?.slice(0, VISIBLE_COMMITS + 1) ?? [])

// 渐隐是「还没完」的信号，所以只在真有第 6 条时才画：提交数不足的项目
// 铺一层渐隐，等于骗读者下面还有东西
const truncated = computed(() => (props.commits?.length ?? 0) > VISIBLE_COMMITS)

// full 级别才有 author。不是本人时缀上——诚实，且顺带说明这仓库有别人在推
function otherAuthor(author?: string) {
	return author && author !== 'shinya' ? author : undefined
}

// 升起动画的触发不在这里：.seen 由父级的 useRevealStagger 统一发，一个 observer
// 管整列。每行各挂一个的话，同一帧进视口的几行会一起亮，错不开先后
</script>

<template>
<article class="project">
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

		<p v-if="stats" class="project-meta">
			<span v-if="topLanguage">{{ topLanguage.name }}</span>
			<span>{{ stats.commits }} 次提交</span>
			<span v-if="stats.commitsLast7d">近 7 天 {{ stats.commitsLast7d }} 次</span>
			<span v-if="showStars" class="stars">
				<Icon name="ri:star-line" />{{ stats.stars }}
			</span>
		</p>

		<div
			v-if="languageSegments.length"
			v-tip="languageTip"
			class="project-langs"
			tabindex="0"
			role="img"
			:aria-label="languageLabel"
		>
			<i
				v-for="language in languageSegments"
				:key="language.name"
				class="lang-segment"
				:style="{
					flexGrow: language.normalizedShare,
					backgroundColor: language.color,
				}"
			/>
		</div>

		<ol v-if="recentCommits.length" class="project-log" :class="{ truncated }">
			<li v-for="commit in recentCommits" :key="`${commit.at}${commit.subject}`">
				<ZDate class="log-date" :date="commit.at" absolute />
				<span class="log-subject">
					{{ commit.subject }}
					<span v-if="otherAuthor(commit.author)" class="log-author">· {{ otherAuthor(commit.author) }}</span>
				</span>
			</li>
		</ol>
	</div>
</article>
</template>

<style lang="scss" scoped>
// 这是一条四项的列表，不是 hero，所以整体按站内既有尺度收：画框从半个
// 内容列收到 340px 上限，标题 1.6rem → 1.25rem（文章卡标题是 1.1rem）。
// 行不加边框阴影圆角——bonsai 不返回仓库地址，这些行没有可点的目标，
// 卡片是导航语汇，用在点不进去的页面上是错的信号
.project {
	--plate-w: var(--project-plate-w, clamp(200px, 26vw, 340px));
	--text-w: var(--project-text-w, minmax(0, 24rem));

	display: grid;
	grid-template-columns: var(--plate-w) var(--text-w);
	align-items: center;

	// 每行的两栏作为一个整体落在内容区中线；交错只交换图片和文字的位置，
	// 不再把奇偶行分别推向两侧，否则每行的视觉中心会来回漂移
	justify-content: center;
	gap: var(--project-column-gap, clamp(4rem, 9vw, 8rem));
	opacity: 0;
	margin: var(--project-row-margin, clamp(2rem, 6vh, 3.5rem)) 0;
	transition: opacity var(--motion-slow) var(--ease-out), translate var(--motion-slow) var(--ease-out);
	translate: 0 12px;

	&.seen {
		opacity: 1;
		translate: none;
	}

	// 交错：偶数行盆栽换到右边。轨道尺寸必须跟着一起对调——只写 order 的话，
	// 盆栽会被塞进为文字栏留的那一格，四棵树于是一行大一行小
	&:nth-child(even) {
		grid-template-columns: var(--text-w) var(--plate-w);

		> .project-plate {
			order: 2;
		}
	}

	@media (max-width: $breakpoint-mobile) {
		grid-template-columns: minmax(0, 1fr);
		gap: var(--project-column-gap, 1rem);

		// 窄屏一律盆栽在上。交错在单列下没有意义，只会打乱阅读顺序
		&:nth-child(even) {
			grid-template-columns: minmax(0, 1fr);

			> .project-plate {
				order: 0;
			}
		}
	}
}

.bonsai {
	display: block;
	width: 100%;

	// height 必须显式写成 auto。<img> 的 height="420" 属性是一条表现性提示，
	// 会被当作确定高度，那样 aspect-ratio 就只是被忽略，cover 转而去裁左右两边
	height: auto;

	// 画框自带的空天：chisel 的 560×420 里树只占 22% 面积，上方 38% 全是空的
	// （bonsai 给成熟树预留了长高的余地）。裁成 3:2 削掉最上面那 11%，
	// 底部锚定所以树根和右下角图例都在。留出的余量够最成熟的树继续长
	aspect-ratio: 3 / 2;
	border-radius: 8px;

	// SVG 内部用 @media(prefers-color-scheme:dark) 切调色板，默认跟系统而不是
	// 站点的主题开关。color-scheme 是继承属性，浏览器会把它传播进 img 引用的
	// SVG 文档，纸面于是跟着站点走。不支持的浏览器退回跟系统，即改造前的行为
	color-scheme: light;
	object-fit: cover;
	object-position: center bottom;
}

.dark .bonsai {
	color-scheme: dark;
}

// activity 为 empty 时 bonsai 不给 svg。给个占位而不是留空——
// 空白会让人以为图挂了
.bonsai-empty {
	display: grid;
	place-items: center;
	aspect-ratio: 3 / 2;
	border: 1px dashed var(--c-border);
	border-radius: 8px;
	font-size: 0.9em;
	color: var(--c-text-3);
}

// 宽度由 --text-w 那条轨道决定，这里不再重复限宽——两处写同一件事迟早对不上
.project-body {
	display: flex;
	flex-direction: column;
	gap: 0.6em;
}

.project-name {
	font-size: 1.25rem;
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

// 返回值只含前几种语言且总和可能不足 100%，脚本先重新归一化；这里按原顺序
// 连续铺满，颜色取 Linguist，完整比例仍交给 tippy 和 aria-label
.project-langs {
	display: flex;
	overflow: hidden;

	// 整体缩尺后这条要一起收：铺满 384px 的高饱和色块会比项目名还抢眼，
	// 而它承载的信息（首要语言）meta 行里已经写了名字，它只补一个占比
	width: 7rem;
	height: 4px;
	border-radius: 2px;
	background-color: var(--c-border);
	cursor: help;

	> .lang-segment {
		flex-basis: 0;
		height: 100%;
		min-width: 0;
	}
}

// 排成 git log 的样子而不是一句营销文案。日期列用 subgrid 是为了三行对齐：
// 每个 li 各自开一个 grid 的话，auto 列会各算各的宽度，日期就参差了
.project-log {
	display: grid;
	grid-template-columns: auto minmax(0, 1fr);
	gap: 0.4em 0.7em;
	font-size: 0.8em;

	> li {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
	}

	// 末行渐隐，示意历史还往下延续。用 mask 而不是叠一层渐变遮罩：
	// 遮罩得跟背景色一致，而这站有明暗两套主题，写死哪个色都会在另一套下露馅。
	// 渐变按 em 从底部起算而不是按百分比：百分比会随行数变，四个项目的
	// 淡出长度就各不相同。一行连同行距约 1.8em，故 2em 恰好只吃掉第 6 行
	&.truncated {
		mask-image: linear-gradient(to bottom, #000 calc(100% - 2em), transparent calc(100% - 0.2em));
	}
}

.log-date {
	font-variant-numeric: tabular-nums;
	color: var(--c-text-3);
}

// 一行一条，超长的裁掉。作者缀在末尾，所以被裁的先是作者而不是提交信息
.log-subject {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--c-text-2);
}

.log-author {
	color: var(--c-text-3);
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
