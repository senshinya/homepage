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

// bonsai 是独立部署、独立演进的服务，前端和它之间没有编译期契约：
// 拿到一个未映射的枚举值，或者字段整个缺失，都是现实会发生的事，
// 不该让 activity/languages 兜不住而让整个 <main> 空白
const activityInfo = computed(() => ACTIVITY[props.activity] ?? ACTIVITY.idle)

const topLanguage = computed(() => props.stats?.languages?.[0])

// star 少于 10 是噪音：blog 和 chisel 各 1 star，写出来毫无信息。
// 阈值让 LunaTV(9158) 和 MYDB(1169) 自然获得小项目没有的视觉重量
const showStars = computed(() => (props.stats?.stars ?? 0) >= 10)

const languageTip = computed(() => ({
	content: (props.stats?.languages ?? [])
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

		<p v-if="stats" class="project-meta">
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
	opacity: 0;
	margin: clamp(3rem, 10vh, 6rem) 0;
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
