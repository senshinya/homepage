<script setup lang="ts">
useHead({ title: '' })
definePageMeta({
	alias: ['/'],
	title: '主页',
})
const appConfig = useAppConfig()
</script>

<template>
<ZAvatar class="avatar" />

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
		<p>某宇宙厂后端研发。</p>
		<p>写 Go 和 TypeScript，自建了博客、Memos、项目聚合这一整套东西，域名都挂在 <code>shinya.click</code> 下面。</p>
	</ZField>

	<ZField label="近期活动">
		<p>2026年7月把<ZLink to="https://blog.shinya.click/">博客</ZLink>搬到了 Nuxt，顺手写了 bonsai——把散在 GitHub、Gitea 各处的仓库聚成一份不暴露地址的只读 API，配一张随提交历史生长的盆栽图。</p>
		<p>最近在写 chisel，一个 Go 的 coding agent 底层库，把 Anthropic Messages 和 OpenAI 的 Responses、Chat Completions 三套协议统一成一层。</p>
	</ZField>

	<ZField label="关于主页">
		<p>
			本站基于
			<ZLink to="https://github.com/L33Z22L11/homepage-v5" icon="ri:github-line">L33Z22L11/homepage-v5</ZLink>
			改造，感谢
			<ZBadge link="https://github.com/L33Z22L11" text="纸鹿本鹿" />
			把它开源出来。
		</p>
	</ZField>
</div>
</template>

<style lang="scss" scoped>
.avatar {
	position: fixed;
	opacity: 0.2;
	right: 20vw;
	margin-right: -0.382em; // (1 - √5)/2
	mask-image: radial-gradient(#FFF 43.7%, transparent 70.7%); // (√5 - 1) / 2 x, x = √2 / 2
	font-size: min(100vw, 61.8vh);
	z-index: -1;
}

.desc {
	margin: 1rem 0;
	font-size: 1.5rem;
	color: var(--c-text-2);
}
</style>
