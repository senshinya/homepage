<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
	error: NuxtError & { url?: string, status?: number }
}>()

const route = useRoute()

// h3 v2 起用 status，旧版是 statusCode，两个都认
const status = computed(() => props.error?.statusCode ?? props.error?.status)
const isNotFound = computed(() => status.value === 404)

/**
 * 匹配用完整信息（error.url 可能带 query），显示用干净路径——访客要认出自己点的是哪条。
 */
const requested = computed(() => props.error?.url || route.fullPath)
const legacy = computed(() => isNotFound.value ? resolveLegacyPath(requested.value) : null)

// 一半以上的旧标签是中日文，route.path 里是百分号编码的。原样印出来是一串
// %E3%82%A2，既认不出也占两行——地址栏里显示的本来就是解码后的样子
const displayPath = computed(() => safelyDecodeUriComponent(route.path))

useHead({
	title: computed(() => legacy.value ? '搬走了' : isNotFound.value ? '没有这个页面' : '出错了'),
	// 错误页本身没有被收录的价值，尤其这页会把旧地址原样印出来
	meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<template>
<ZSidebar />
<div class="content">
	<ZHeader />
	<main>
		<div v-if="isNotFound" class="stage">
			<!-- 底纹。aria-hidden 而非伪元素：部分读屏器会念出 content 生成的文字 -->
			<span class="stage-mark" aria-hidden="true">404</span>

			<ZMoved v-if="legacy" :target="legacy" :path="displayPath" />

			<!--
				认不出来的 404 也别只丢一句「出错了」：这个域名换过主人，
				「博客搬去了 blog.」是此刻唯一真正有用的一句话，照说不误
			-->
			<div v-else>
				<p class="lost-lead">
					这里没有东西
				</p>
				<div class="lost-url">
					<span class="lost-host">{{ siteHost }}</span>{{ displayPath }}
				</div>
				<p class="lost-hint">
					{{ siteHost }} 现在是主页，博客搬到了 {{ blogHost }}。
				</p>
				<div>
					<ZButton icon="ri:home-4-line" text="回主页" to="/" primary />
					<ZButton icon="ri:quill-pen-line" text="去博客" :to="blogHomeUrl" />
				</div>
			</div>
		</div>

		<div v-else>
			<ZTitle>出错了</ZTitle>
			<ZField :label="status?.toString()">
				<p class="error-copy">
					页面暂时无法打开，请稍后重试。
				</p>
				<details v-if="error?.message" class="error-details">
					<summary>查看错误详情</summary>
					<pre>{{ error?.message }}</pre>
				</details>
				<ZButton text="返回主页" @click="clearError({ redirect: '/' })" />
			</ZField>
		</div>
	</main>
</div>
</template>

<style lang="scss" scoped>
.error-copy {
	margin-bottom: 1rem;
	color: var(--c-text-2);
}

.error-details {
	margin-bottom: 1rem;
	font-size: 0.85em;
	color: var(--c-text-2);

	> summary {
		width: fit-content;
		color: var(--c-text-3);
		cursor: pointer;
	}

	> pre {
		overflow: auto;
		overflow-wrap: anywhere;
		max-width: 100%;
		margin-top: 0.6rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		background-color: var(--c-bg-1);
		white-space: pre-wrap;
	}
}

// 底纹比版心宽，得有人兜住它。clip 而不是 hidden：clip 不造滚动容器，纵向仍是
// visible，页头那道 sticky 之类的东西不会被连坐
main {
	overflow-x: clip;
}

/*
 * 两种 404 共用的舞台：定版心，并把内容摆在剩余空间的正中。
 *
 * 用 min-height 而非 height，内容长过一屏时照样能往下长；扣掉的 5rem 是页头（48px）
 * 加 main 的上下留白（各 1rem），不扣的话这块会被顶出屏幕、白白多出一条滚动条。
 *
 * 正文继续放在居中的 stack 轨道里；底纹则以舞台自身为定位上下文，不参与轨道尺寸。
 * 这样卡片和推荐列表展开时只改变正文高度，不会再把底纹一起拖动。
 */
.stage {
	display: grid;
	grid-template-areas: "stack";

	// 轨道宽度必须钉死。默认 auto 轨会按最宽的那个格内元素撑开，而底纹刻意比版心还宽，
	// 于是正文也被一起拉宽、冲出版心。minmax(0, 1fr) 让轨道等于容器，底纹只是溢出它
	grid-template-columns: minmax(0, 1fr);
	align-content: center;
	position: relative;
	min-height: calc(100dvh - 5rem);
	max-width: 42rem;
	margin-inline: auto;

	> :not(.stage-mark) {
		grid-area: stack;
	}
}

/*
 * 大号 404 底纹，两种 404 页面共用。描边空心，不填色。
 *
 * 空心是关键：实心块的墨量太大，正文压上去会糊，于是就得靠裁切或渐隐去躲，而任何
 * 硬边都会被读成「有块白色矩形盖在数字上」。只留轮廓则墨量薄得多，正文照常叠在
 * 上面也清楚，因此不裁、不淡、不躲，整字完整地铺在最底层。
 *
 * 描边宽度用 em 而不是 px：字号从窄屏到宽屏差着两倍多，写死像素值必然在一头显得
 * 过粗、另一头几乎看不见。
 *
 * 颜色在 --c-bg-soft 的基础上再兑淡一半。不直接写死一个 alpha：--c-bg-soft 是本站
 * 自己那档「浅浅一层覆盖」的令牌，浅色深色各有各的值，兑淡而非替换，两种模式的相对
 * 关系就还留着，不必为深色模式再补一条规则。
 *
 * 字号故意冲出 42rem 的版心，靠 main 上的 overflow-x: clip 兜住——.content 是
 * overflow: auto 的滚动容器，横向一溢出就会凭空多出一条滚动条。
 */
.stage-mark {
	// 舞台本身已经从页头下方开始；贴住舞台顶边即可靠近首屏顶部，同时保留自然留白
	position: absolute;
	inset-block-start: 0;
	inset-inline-start: 50%;
	font-size: clamp(12rem, 40vw, 30rem);
	font-weight: 800;
	letter-spacing: -0.05em;
	line-height: 0.75;
	color: transparent;
	-webkit-text-stroke: 0.012em color-mix(in srgb, var(--c-bg-soft) 50%, transparent);
	transform: translateX(-50%);
	pointer-events: none;
	user-select: none;
	z-index: -1;
}

.lost-lead {
	margin-bottom: 0.8rem;
	font-size: 1.1rem;
	color: var(--c-text-2);
}

.lost-url {
	// 同 ZMoved 那条地址：优先断在连字符和斜杠上，断不开才逐字符
	overflow-wrap: anywhere;
	margin-bottom: clamp(1.6rem, 5vh, 2.4rem);
	font-family: var(--font-monospace);
	font-size: clamp(0.95rem, 3.4vw, 1.4rem);
	line-height: 1.5;
	color: var(--c-text-1);
}

.lost-host {
	color: var(--c-text-3);
}

.lost-hint {
	margin-bottom: 1.4rem;
	color: var(--c-text-2);
}
</style>
