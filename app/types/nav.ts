export interface NavItem {
	icon: string
	text: string
	url: string
	external?: boolean
	/**
	 * text 被缩写过时的完整值，挂到链接的 title 上。
	 * 侧栏留给文字的只有 136px，写不下的东西得有个地方交代。
	 */
	title?: string
}

export type Nav = {
	title: string
	items: NavItem[]
}[]
