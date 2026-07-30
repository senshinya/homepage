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
<!-- 骨架按 4:3 占位，否则盆栽到货时整页跳一次 -->
<div v-if="loading" class="skeletons">
	<div v-for="n in 3" :key="n" class="skeleton" />
</div>

<div v-else-if="error" class="project-tip">
	<p>暂时没取到项目数据，请稍后重试。</p>
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
// 骨架的尺寸和交错必须跟 ZProject 的画框一致，否则盆栽到货时整页跳一次
.skeletons {
	display: grid;
	gap: clamp(2rem, 6vh, 3.5rem);
	margin: clamp(2rem, 6vh, 3.5rem) 0;
}

.skeleton {
	width: clamp(200px, 26vw, 340px);
	aspect-ratio: 3 / 2;
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
