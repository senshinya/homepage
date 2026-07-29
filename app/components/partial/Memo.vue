<script setup lang="ts">
import type { ParsedMemo } from '~/utils/memo'

const props = defineProps<ParsedMemo>()

// 评论和反应都在博客那边：giscus 的 term 是 memo/<id>，两个站点写同一条
// discussion 只会让人分不清在哪儿留的言
const blogUrl = computed(() => `https://blog.shinya.click/memos/${props.id}`)

const { open: openLightbox } = useLightbox()
</script>

<template>
<li class="memo">
	<!-- 时间戳即永久链接——X、Mastodon、Telegram 频道页都是这个约定。
		原先那条「在博客查看」和日期指向同一个 URL，一屏 20 条就把同一个
		入口印了 20 遍，是重复而不是功能，故删。整条仍不做成链接：正文是
		v-html 出来的，里头可能有 <a>，嵌套锚点是非法 HTML -->
	<ZRawLink class="memo-date" :to="blogUrl">
		<ZDate :date="createTime" />
		<Icon class="memo-permalink" name="ri:arrow-right-up-line" />
	</ZRawLink>

	<div class="memo-main">
		<!-- 正文按块渲染：独占一行的裸链接被切成 link 块换成预览卡，其余照旧走
			v-html。切块规则见 utils/memo.ts 的 splitMemoLinks -->
		<div v-if="blocks.length" class="memo-body">
			<template v-for="(block, i) in blocks" :key="i">
				<!-- 碎语是自建服务里自己写的内容，与文章正文同等信任，故不净化 -->
				<!-- eslint-disable-next-line vue/no-v-html -->
				<div v-if="block.type === 'html'" class="rich-text" v-html="block.html" />
				<ZMemoLink v-else :url="block.url" />
			</template>
		</div>

		<ul v-if="images.length" class="memo-images">
			<li v-for="(src, i) in images" :key="src">
				<!-- 用 button 而不是给 img 挂 click：键盘要能 Tab 到并按回车打开 -->
				<button type="button" aria-label="查看大图" @click="openLightbox(images, i)">
					<NuxtImg :src="src" alt="" loading="lazy" />
				</button>
			</li>
		</ul>
	</div>
</li>
</template>

<style lang="scss" scoped>
// 日期移到左轨、正文在右，中间一条贯通的细线：横向那三百多像素的空白
// 变成时间线结构，而不是空着。描边环随之去掉——轨道已经在分隔条目，
// 再套一层环是重复的，而且那层环的内边距正是单行碎语显得空的原因
.memo {
	display: grid;
	grid-template-columns: 5rem minmax(0, 1fr);
	gap: 0 1.2rem;

	@media (max-width: $breakpoint-mobile) {
		grid-template-columns: minmax(0, 1fr);
		gap: 0.3rem;
	}
}

.memo-date {
	display: flex;
	align-items: baseline;
	justify-content: flex-end;
	gap: 0.2em;

	// 正文 1em/1.7 与日期 0.8em/1.4 的行盒高度不同，硬顶对齐会差半行
	padding-top: 0.45em;
	font-size: 0.8em;
	font-variant-numeric: tabular-nums;
	color: var(--c-text-3);
	transition: color 0.2s;

	@media (max-width: $breakpoint-mobile) {
		justify-content: flex-start;
		padding-top: 0;
	}
}

// 日期是灰的、无下划线，不点一下看不出是链接。删掉「在博客查看」后它是
// 唯一出站入口，所以悬停时必须给出可点的信号
.memo-permalink {
	opacity: 0;
	font-size: 1em;
	transition: opacity 0.2s;
}

.memo:hover,
.memo:focus-within {
	> .memo-date {
		color: var(--c-primary);
	}

	.memo-permalink {
		opacity: 1;
	}
}

// 下边距放在 main 上而不是 memo 上，这样轨道线穿过条目之间的间隙，
// 连成一条而不是断成一节一节
.memo-main {
	padding-bottom: 2.6rem;
	padding-left: 1.2rem;
	border-left: 1px solid var(--c-border);

	@media (max-width: $breakpoint-mobile) {
		// 窄屏没有轨道线分隔条目，只剩空白在分组，故留得比宽屏更多一点
		padding-bottom: 2.8rem;
		padding-left: 0;
		border-left: none;
	}
}

.memo:last-child > .memo-main {
	padding-bottom: 0;
}

.memo-body {
	line-height: 1.7;

	// 以下这些是给 marked 渲染出来的正文用的，故一律收在 .rich-text 之下。
	// 摊在 .memo-body 上会连坐 ZMemoLink——它的根就是个 <a>，会被 :deep(a)
	// 染成主色、加上 break-all 的断词。且父组件这条选择器比卡片自己的样式更
	// specific，在子组件里盖不掉
	:deep(.rich-text) {
		// v-html 出来的内容拿不到 scoped 属性，要用 :deep 才能命中
		p + p {
			margin-top: 0.6em;
		}

		a {
			word-break: break-all;
			color: var(--c-primary);
		}

		blockquote {
			margin: 0.6em 0;
			padding-left: 0.8em;
			border-left: 2px solid var(--c-border);
			color: var(--c-text-2);
		}

		:where(ul, ol) {
			margin: 0.6em 0;
			padding-left: 1.4em;
			list-style: revert;
		}

		pre {
			overflow-x: auto;
			padding: 0.6em 0.8em;
			border-radius: 6px;
			background-color: var(--c-bg-1);
		}

		code {
			font-size: 0.9em;
		}
	}
}

// 限宽：正文栏比原先宽了，不限的话 auto-fill 会把两张配图铺成两个大方块
.memo-images {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
	gap: 6px;
	max-width: 26rem;
	margin-top: 0.6em;

	button {
		display: block;
		overflow: hidden;
		width: 100%;
		border-radius: 6px;
		cursor: zoom-in;
	}

	img {
		display: block;
		width: 100%;
		aspect-ratio: 1;
		transition: scale 0.3s;
		object-fit: cover;
	}

	button:hover > img {
		scale: 1.05;
	}
}

@media (prefers-reduced-motion: reduce) {
	.memo-images img {
		transition: none;
	}

	.memo-images button:hover > img {
		scale: none;
	}
}
</style>
