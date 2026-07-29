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
