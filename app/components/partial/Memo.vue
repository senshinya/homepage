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
		word-break: break-all;
		color: var(--c-primary);
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
	align-self: flex-start;
	gap: 0.2em;
	font-size: 0.8em;
	color: var(--c-text-3);
	transition: color 0.2s;

	&:hover {
		color: var(--c-primary);
	}
}
</style>
