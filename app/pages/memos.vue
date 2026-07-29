<script setup lang="ts">
import type { Memo } from '~/utils/memo'

useHead({ title: '碎语' })
definePageMeta({ headerText: '来不及写成文章的短想法' })

interface MemoPage {
	memos?: Memo[]
}

const MEMOS_API = 'https://memos.shinya.click/api/v1/memos'

// 只取首页，不做翻页。主页这一栏是「最近在想什么」的橱窗，不是碎语的全量档案——
// 全量在博客那边，那里有详情页、评论和反应，翻页也该发生在那里。
// 一个页面只该有一个归宿，两边都能无限往下翻只会让人不知道该收藏哪个
const PAGE_SIZE = 20
const BLOG_MEMOS_URL = 'https://blog.shinya.click/memos'

const memos = ref<Memo[]>([])

// server: false —— 碎语更新频繁，构建期取数会一直停在上次部署的快照
const { status, error, refresh } = useLazyAsyncData('memos', async () => {
	const page = await $fetch<MemoPage>(MEMOS_API, { query: { pageSize: PAGE_SIZE } })
	memos.value = page.memos ?? []
	return true
}, { server: false })

// server: false 时服务端根本不取数，status 停在 idle 而非 pending。
// 漏掉 idle 会让预渲染的 HTML 直接落到空列表分支，写上「还没有碎语」
const loading = computed(() => status.value === 'idle' || status.value === 'pending')

const parsedMemos = computed(() => memos.value.map(parseMemo))
</script>

<template>
<!-- 整页共用一条居中轴。原先只有 .memo-list 限宽且没配 auto 外边距，
	于是列表贴在左边、右侧空出三分之一个内容区，是全站唯一贴左的页 -->
<div class="memo-page">
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

		<!-- 时间线的收尾。刻意不做成按钮：按钮意味着「就地再来一页」，而这里是
			「换个地方接着看」，两者该长得不一样。对齐到正文栏，读起来像时间线
			本身继续往博客延伸，而不是页脚上贴了个链接 -->
		<ZRawLink class="memo-tail" :to="BLOG_MEMOS_URL">
			更早的碎语在博客
			<Icon name="ri:arrow-right-line" />
		</ZRawLink>

		<!-- 全站只有这一页有配图，故灯箱挂在这里而不是 app.vue -->
		<ZLightbox />
	</template>
</div>
</template>

<style lang="scss" scoped>
.memo-page {
	// 轨道几何在这里定义一次，ZMemo 和下面的收尾行都从这儿读。
	// 两处各写一遍数字的话，改一处忘一处就会错位，而错位只有肉眼能发现
	--memo-rail-col: 5rem;
	--memo-rail-gap: 1.2rem;

	max-width: 46rem;
	margin-inline: auto;
}

// 左边缘对齐正文栏 = 日期栏 + 间隙 + 轨道线 + 内边距
.memo-tail {
	display: inline-flex;
	align-items: center;
	gap: 0.3em;
	margin-top: 2rem;
	margin-left: calc(var(--memo-rail-col) + var(--memo-rail-gap) * 2 + 1px);
	font-size: 0.85em;
	color: var(--c-text-3);
	transition: color 0.2s;

	&:hover {
		color: var(--c-primary);
	}

	@media (max-width: $breakpoint-mobile) {
		margin-left: 0;
	}
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
