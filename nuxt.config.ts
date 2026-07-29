import homepageConfig, { routeRules } from './homepage.config'
import packageJson from './package.json'

export default defineNuxtConfig({
	app: {
		head: {
			link: [
				{ rel: 'icon', href: homepageConfig.favicon },
				// "InterVariable", "Inter", "InterDisplay"
				{ rel: 'stylesheet', href: 'https://rsms.me/inter/inter.css', media: 'print', onload: 'this.media="all"' },
			],
			meta: [
				{ name: 'author', content: [homepageConfig.author.name, homepageConfig.author.email].filter(Boolean).join(', ') },
				{ name: 'color-scheme', content: 'light dark' },
				{ 'name': 'generator', 'content': `${packageJson.name} ${packageJson.version}`, 'data-github-repo': packageJson.homepage },
			],
			templateParams: {
				separator: '|',
			},
			titleTemplate: `%s %separator ${homepageConfig.title}`,
		},
		rootAttrs: {
			id: 'z-root',
		},
	},

	compatibilityDate: '2024-08-03',

	components: [
		{ path: '~/components/partial', prefix: 'Z' },
		'~/components',
	],

	css: [
		'@/assets/color.scss',
		'@/assets/main.scss',
	],

	// @keep-sorted
	experimental: {
		extractAsyncDataHandlers: true,
		// https://github.com/nuxt/nuxt/issues/34142#issuecomment-3791192527
		nitroAutoImports: true,
		typescriptPlugin: true,
		viewTransition: true,
	},

	features: {
		inlineStyles: false,
	},

	future: {
		compatibilityVersion: 5,
	},

	routeRules,

	nitro: {
		prerender: {
			// 为了 /api/og 那个运行时端点，构建命令是 `nuxt build` 而不是 generate。
			// 而 build 默认**不爬站**（generate 才默认爬），不在这里显式打开的话，
			// 页面会全部从静态退化成按请求 SSR 的函数调用——这站除了 /api/og
			// 之外没有一处需要运行时，全走函数纯属白白付出冷启动和调用计费
			crawlLinks: true,
			routes: [
				// 爬虫的起点。generate 会自动补上 '/'，build 不会
				'/',
				// 文章页用的是 useLazyFetch，预渲染爬虫看不到这个请求。不显式列出
				// 的话产物里 /api/feed/blog 不存在，线上取数直接 404
				'/api/feed/blog',
			],
		},
	},

	vite: {
		css: {
			preprocessorOptions: {
				scss: {
					additionalData: '@use "@/assets/_variable.scss" as *;',
				},
			},
		},
		server: {
			allowedHosts: true,
		},
	},

	// @keep-sorted
	modules: [
		'@nuxt/icon',
		'@nuxt/image',
		'@nuxtjs/color-mode',
		'@nuxtjs/seo',
		'@pinia/nuxt',
		'@vueuse/nuxt',
	],

	colorMode: {
		preference: 'system',
		fallback: 'light',
		classSuffix: '',
	},

	image: {
		provider: 'none',
	},

	ogImage: {
		enabled: false,
	},

	site: {
		name: homepageConfig.title,
		url: homepageConfig.url,
		defaultLocale: homepageConfig.language,
	},
})
