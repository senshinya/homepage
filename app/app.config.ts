import type { Nav } from '~/types/nav'
import { h } from 'vue'
import homepageConfig from '~~/homepage.config'

// 图标查询：https://yesicon.app/ph
// 图标插件：https://marketplace.visualstudio.com/items?itemName=antfu.iconify

const { email } = homepageConfig.author

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
				// 只印 @ 前面那截。整条地址要 217px，侧栏给文字的只有 136px，印全了必被切成
				// 「kobayashi_shinya@ou…」——省略号吃掉的恰好是域名，剩下的既不好看也不能用。
				// 同组另外两行本来印的也是「你在那边叫什么」而不是完整地址（github 那行没写
				// github.com/senshinya），印全址的邮箱才是不合群的那个。域名交给 title 和
				// mailto 兜着：悬停看得到，点下去自动填好
				{ icon: 'ri:mail-line', text: email.replace(/@.*$/, ''), title: email, url: `mailto:${email}` },
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
