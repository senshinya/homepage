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

// 逐行升起。一个 observer 管整列，同一帧进视口的几行才能错开先后——
// 每行各挂一个的话它们只会一起亮。项目行又高又少，一屏顶多两三行，
// 故步子迈得比碎语大，档位也用不上几档。
//
// settleFirstBatch —— 这页前面摆了骨架屏，首屏那几行是顶替骨架就位的，不是到场，
// 再从 opacity 0 升一次就成了「骨架 → 空白 → 慢慢浮现」，把骨架的意义整个抵消掉。
// 碎语页没有骨架（只有一行「加载中…」），那边的首屏波浪仍然成立，故不开这个开关
const list = useTemplateRef<HTMLElement>('list')
useRevealStagger(list, { step: 90, cap: 3, settleFirstBatch: true })
</script>

<template>
<!-- 骨架复刻真实项目的两栏、交错和 3:2 图片：对齐的是每行的几何，不是行数——
	项目有几个要取数才知道。首屏那一两行因此原地换成真内容，页面总高度的变化
	都发生在折线以下，看不见 -->
<div v-if="loading" class="project-layout skeletons" aria-hidden="true">
	<div v-for="n in 3" :key="n" class="skeleton">
		<div class="skeleton-plate" />
		<div class="skeleton-body">
			<i class="skeleton-name" />
			<i class="skeleton-description" />
			<i class="skeleton-meta" />
			<i class="skeleton-language" />
			<div class="skeleton-logs">
				<i v-for="line in 4" :key="line" />
			</div>
		</div>
	</div>
</div>

<div v-else-if="error" class="project-tip">
	<p>项目暂时加载失败，请稍后重试。</p>
	<ZButton icon="ri:refresh-line" text="重试" @click="refresh()" />
</div>

<p v-else-if="!projects.length" class="project-tip">
	还没有项目。
</p>

<div v-else ref="list" class="project-layout">
	<ZProject v-for="project in projects" :key="project.slug" v-bind="project" />
</div>
</template>

<style lang="scss" scoped>
// 加载态和真实项目共同继承这四个几何值，避免两套布局分别演进后再次错位
.project-layout {
	--project-plate-w: clamp(200px, 26vw, 340px);
	--project-text-w: minmax(0, 24rem);
	--project-column-gap: clamp(4rem, 9vw, 8rem);
	--project-row-margin: clamp(2rem, 6vh, 3.5rem);

	@media (max-width: $breakpoint-mobile) {
		--project-column-gap: 1rem;
	}
}

.skeleton {
	display: grid;
	grid-template-columns: var(--project-plate-w) var(--project-text-w);
	align-items: center;
	justify-content: center;
	gap: var(--project-column-gap);
	margin: var(--project-row-margin) 0;

	&:nth-child(even) {
		grid-template-columns: var(--project-text-w) var(--project-plate-w);

		> .skeleton-plate {
			order: 2;
		}
	}

	@media (max-width: $breakpoint-mobile) {
		grid-template-columns: minmax(0, 1fr);

		&:nth-child(even) {
			grid-template-columns: minmax(0, 1fr);

			> .skeleton-plate {
				order: 0;
			}
		}
	}
}

// 底色用 --c-bg-soft 而不是 --c-bg-1，和另两处骨架同源。--c-bg-1 在浅色下只比
// 纸面深 3%，淡到 opacity 0.4 就只剩 1.2% 对比度——呼吸等于没做。整组一起呼吸，
// 不按行错开：错开讲的是「逐个到场」，而骨架讲的是「都还在等」
.skeleton-plate,
.skeleton-name,
.skeleton-description,
.skeleton-meta,
.skeleton-language,
.skeleton-logs > i {
	background-color: var(--c-bg-soft);
	animation: skeleton-pulse 1.6s ease-in-out infinite;
}

.skeleton-plate {
	width: 100%;
	aspect-ratio: 3 / 2;
	border-radius: 8px;
}

.skeleton-body {
	display: flex;
	flex-direction: column;
	gap: 0.6em;
	min-width: 0;
}

.skeleton-name,
.skeleton-description,
.skeleton-meta,
.skeleton-language,
.skeleton-logs > i {
	display: block;
	border-radius: 0.3rem;
}

.skeleton-name {
	width: 42%;
	height: 1.25rem;
}

.skeleton-description {
	width: 92%;
	height: 0.85rem;
}

.skeleton-meta {
	width: 68%;
	height: 0.7rem;
}

.skeleton-language {
	width: 7rem;
	height: 4px;
}

.skeleton-logs {
	display: grid;
	gap: 0.55rem;
	margin-top: 0.2rem;

	> i {
		height: 0.7rem;

		&:nth-child(2) {
			width: 88%;
		}

		&:nth-child(3) {
			width: 94%;
		}

		&:nth-child(4) {
			width: 76%;
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

@media (prefers-reduced-motion: reduce) {
	.skeleton-plate,
	.skeleton-name,
	.skeleton-description,
	.skeleton-meta,
	.skeleton-language,
	.skeleton-logs > i {
		animation: none;
	}
}
</style>
