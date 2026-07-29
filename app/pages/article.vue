<script setup lang="ts">
useHead({ title: '文章' })
definePageMeta({ headerText: '最近更新' })

const { data, status, refresh } = useLazyFetch('/api/feed/blog')

const articles = computed(() => data.value?.slice(0, 8) ?? [])
</script>

<template>
<ZTitle icon="👀">
	<span class="badge-text">来自博客
		<ZRawLink to="https://blog.shinya.click/"><mark>信也のブログ</mark></ZRawLink>
		的文章
	</span>
</ZTitle>

<p v-if="status === 'pending'" class="article-tip">
	加载中…
</p>

<div v-else-if="status === 'error'" class="article-tip">
	<p>文章加载失败，可能是网络不通。</p>
	<ZButton icon="ri:refresh-line" text="重试" @click="refresh()" />
</div>

<p v-else-if="!articles.length" class="article-tip">
	还没有文章。
</p>

<div v-else class="article-list">
	<ZArticle v-for="article in articles" :key="article.id" v-bind="article" />
</div>

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
</template>

<style lang="scss" scoped>
.article-tip {
	display: grid;
	justify-items: center;
	gap: 1rem;
	margin: 2rem 0;
	font-size: 0.9em;
	text-align: center;
	color: var(--c-text-3);
}

.article-list {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 8px;
}

.article-more {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	margin: 16px 0;
	font-size: min(2rem, 6vw);
	font-weight: bold;

	a {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		opacity: 0.2;
		padding: 0.3em 0.5em;
		border-radius: 8px;
		transition: all 0.2s;

		&:hover {
			opacity: 1;
			background-color: var(--c-primary-soft);
			color: var(--c-primary);
		}
	}
}
</style>
