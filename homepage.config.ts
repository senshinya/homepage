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
	'/api/feed/blog': { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
	'/api/icon.png': { redirect: '/icon.png' },
	'/favicon.ico': { redirect: homepageConfig.favicon },

	// 换友链、在聚合站登记时，对方要的是一个能直接 <img> 的地址，而 /logo.png 是这
	// 类场合最好猜的那个名字。指过去而不是把 icon.png 复制一份：同一张图两个文件，
	// 换头像时必然漏掉一个，漏掉的那个还挂在别人站上。
	// 用默认的临时跳转，不写 301——301 会被浏览器永久缓存，将来想让 /logo.png 换成
	// 别的图就收不回来了
	'/logo.png': { redirect: '/icon.png' },
}

export default homepageConfig
