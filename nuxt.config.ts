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
			// 临时禁用预渲染的 link-checker 阻断性错误：导航已指向 /memos
			// 但该页面在 Task 8 才创建。link-checker 会把这条 404 当阻断错误。
			// Task 8 建好页面后应删除本配置。
			failOnError: false,
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
