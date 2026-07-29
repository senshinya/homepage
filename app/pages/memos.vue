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
