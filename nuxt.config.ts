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
			// 纯静态构建时 Nitro 不会自动产出这条 API 的 JSON——文章页用的是
			// useLazyFetch，预渲染爬虫看不到这个请求。不显式列出的话
			// .output/public/api/feed/blog 不存在，线上取数直接 404
			routes: ['/api/feed/blog'],
			// 导航已指向 /memos 但该页面在 Task 8 才创建。Nitro 的预渲染爬虫爬到
			// 这条真实 404 会中断构建。ignore 列表让爬虫跳过这条 404，但其他链接
			// 的真实错误仍会中止预渲染。Task 8 建好页面后删除本配置。
			ignore: ['/memos'],
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
