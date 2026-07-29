import type { Nav } from '~/types/nav'
import { h } from 'vue'
import homepageConfig from '~~/homepage.config'

// 图标查询：https://yesicon.app/ph
// 图标插件：https://marketplace.visualstudio.com/items?itemName=antfu.iconify

// @keep-sorted
export default defineAppConfig({
	...homepageConfig,

	footer: [
		`© ${new Date().getFullYear()} shinya`,
		h('a', { href: 'https://icp.gov.moe/?keyword=20248008', target: '_blank', rel: 'noopener nofollow' }, '萌ICP备20248008号'),
	],

	nav: [
		{
			title: '',
			items: [
				{ icon: 'ri:id-card-line', text: '简介', url: '/' },
				{ icon: 'ri:code-line', text: '项目', url: '/project' },
				{ icon: 'ri:quill-pen-line', text: '文章', url: '/article' },
				{ icon: 'ri:chat-quote-line', text: '碎语', url: '/memos' },
			],
		},
		{
			title: '社交',
			items: [
				{ icon: 'ri:github-line', text: 'senshinya', url: 'https://github.com/senshinya' },
				{ icon: 'ri:telegram-line', text: 'senshinya', url: 'https://telegram.me/senshinya' },
				{ icon: 'ri:mail-line', text: 'kobayashi_shinya@outlook.com', url: 'mailto:kobayashi_shinya@outlook.com' },
			],
		},
	] satisfies Nav,

	themes: {
		light: {
			icon: 'ri:sun-line',
			tip: '浅色模式',
		},
		system: {
			icon: 'ri:tv-2-line',
			tip: '跟随系统',
		},
		dark: {
			icon: 'ri:moon-line',
			tip: '深色模式',
		},
	},
})
