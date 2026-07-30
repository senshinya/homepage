<script setup lang="ts">
useHead({ title: '' })
definePageMeta({
	alias: ['/'],
	title: '主页',
})
const appConfig = useAppConfig()
</script>

<template>
<NuxtImg
	class="home-backdrop"
	src="/home-background.jpg"
	alt=""
	aria-hidden="true"
	width="640"
	height="640"
/>

<div class="wrapper">
	<ZField>
		<template #label>
			<span style="font-size: 3rem;">👋</span>
		</template>
		<h1 style="font-size: 3rem;">
			你好，<br>我是<mark>{{ appConfig.author.name }}</mark>
		</h1>
		<p class="desc">
			{{ appConfig.subtitle }}
		</p>
		<div>
			<ZButton
				icon="ri:file-list-3-line"
				to="https://blog.shinya.click/"
				text="博客"
				primary
			/>
			<ZButton
				icon="ri:github-line"
				to="https://github.com/senshinya"
				text="GitHub"
			/>
		</div>
	</ZField>

	<ZField label="介绍">
		<p>某宇宙厂后端研发，手写代码爱好者。</p>
		<p>热爱旅行、游戏、美剧，以及其他一切与上班无关的事情。</p>
	</ZField>

	<ZField label="近期活动">
		<p>2026年7月将<ZLink to="https://blog.shinya.click/">个人博客</ZLink>迁移到 Nuxt，也<ZLink to="https://blog.shinya.click/fiddling/one-trek-twenty-stacks">从零搭建了一套 VPS 自托管环境</ZLink>。</p>
		<p>最近在研究 Agent 范式与 Harness 架构。</p>
	</ZField>

	<ZField label="个人偏好">
		<p>偏爱简单、开放、能长期使用的东西。</p>
		<p>喜欢研究底层原理，看重规则与秩序。</p>
	</ZField>

	<ZField label="关于主页">
		<p>
			本站基于
			<ZLink to="https://github.com/L33Z22L11/homepage-v5" icon="ri:github-line">L33Z22L11/homepage-v5</ZLink>
			改造，感谢
			<ZBadge link="https://www.zhilu.site/" text="纸鹿本鹿" img="https://avatars-githubusercontent-webp.webp.se/L33Z22L11" />
			开源。
		</p>
	</ZField>
</div>
</template>

<style lang="scss" scoped>
.home-backdrop {
	display: block;
	position: fixed;
	opacity: 0.3;
	right: 20vw;
	width: 1em;
	height: 1em;
	margin-right: -0.382em; // (1 - √5)/2
	mask-image: radial-gradient(#FFF 50%, transparent 75%);
	font-size: min(100vw, 61.8vh);
	object-fit: cover;
	z-index: -1;
}

:global(.dark .home-backdrop) {
	opacity: 0.1;
}

.desc {
	margin: 1rem 0;
	font-size: 1.5rem;
	color: var(--c-text-2);
}
</style>
