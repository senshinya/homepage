import { marked } from 'marked'

/** Memos 服务 /api/v1/memos 返回的单条数据（只列用得上的字段） */
export interface Memo {
	/** 形如 memos/QZbUFrYf8w3ac85s6g9LH7 */
	name: string
	content: string
	createTime: string
	pinned: boolean
	tags?: string[]
}

/** 正文已渲染、图片已摘出的 memo */
export interface ParsedMemo {
	id: string
	html: string
	images: string[]
	createTime: string
}

marked.use({ breaks: true, gfm: true })

// 两种写法：markdown 的 ![alt](src "title") 和裸 <img src="...">。
// src 后面用 (?:\s[^)]*)? 匹配可选的 title，与 src 之间以空白划清界限，
// 避免两个量词争抢同一批字符（会导致多项式回溯）
const IMAGE_RE = /!\[[^\]]*\]\(\s*([^)\s]+)(?:\s[^)]*)?\)|<img\s[^>]*?src=["']([^"']+)["'][^>]*>/g

/**
 * 把图片从正文里摘出来。
 *
 * 碎语多是手机截图，内联渲染时一张竖构图就能撑满整屏；摘出来单独走方格
 * 网格后每条的高度才可控。
 */
export function splitMemoImages(content: string) {
	const images: string[] = []
	const text = content.replace(IMAGE_RE, (_, mdSrc, htmlSrc) => {
		images.push(mdSrc || htmlSrc)
		return ''
	})
	return { text: text.trim(), images }
}

/**
 * 接口返回的 memo → 可直接渲染的 memo。
 *
 * memo 是自建 Memos 服务里自己写的内容，与文章正文同等信任，故不做净化。
 *
 * 不搬博客那套「独占一行的裸链接切成预览卡」：那依赖博客侧的 /api/og
 * 服务端路由，主页没有。裸链接交给 marked 的 gfm 自动链接，留在正文里。
 */
export function parseMemo(memo: Memo): ParsedMemo {
	const { text, images } = splitMemoImages(memo.content)
	return {
		// name 是 memos/<uid>，uid 才是稳定标识，博客的详情页路由用的就是它
		id: memo.name.split('/').pop() ?? memo.name,
		html: marked.parse(text) as string,
		images,
		createTime: memo.createTime,
	}
}
