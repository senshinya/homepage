// 存储 nuxt.config 和 app.config 共用的配置

import type { NitroConfig } from 'nitropack'

const author = {
	name: 'shinya',
	avatar: 'https://github.com/senshinya.png',
	email: 'kobayashi_shinya@outlook.com',
	homepage: 'https://github.com/senshinya',
}

const homepageConfig = {
	title: '信也 (@senshinya)',
	subtitle: '一写代码的',
	description: 'shinya 的个人主页。某宇宙厂后端研发，写 Go 与 TypeScript，自建了博客、Memos、项目聚合等一整套服务。这里放着他在做的项目、写的文章和随手记下的碎语。',
	author,
	language: 'zh-CN',
	timeZone: 'Asia/Shanghai',
	favicon: '/icon.svg',
	url: 'https://shinya.click/',
	blogAtom: 'https://blog.shinya.click/atom.xml',
}

// https://nitro.build/config#routerules
export const routeRules: NitroConfig['routeRules'] = {
	'/api/avatar.png': { redirect: author.avatar },
	'/api/icon.png': { redirect: '/icon.png' },
	'/favicon.ico': { redirect: homepageConfig.favicon },
}

export default homepageConfig
