const DOMAIN_RE = /^(?:https?:\/\/)?(?:www\.)?([^/:]+)/i
const GH_USERNAME_RE = /github\.com\/([a-zA-Z0-9-]+)(?:\/[^/]+)?(\/?)$/

export function getDomain(url: string) {
	const match = url.match(DOMAIN_RE)
	return match?.[1] ?? url
}

export function getGhUsername(url?: string) {
	if (!url)
		return ''
	return url.match(GH_USERNAME_RE)?.[1] ?? ''
}

export function getGhAvatar(name: string, options?: Record<string, any>) {
	if (!options)
		options = { size: 96 }
	if (options.preset === 'icon')
		Object.assign(options, { size: 32, mask: 'circle' })
	let url = `https://wsrv.nl/?url=github.com/${name}.png`
	if (options.size)
		url += `%3fsize=${options.size}`
	if (options.mask)
		url += `&mask=${options.mask}`
	return url
}

/** 任意域名的站点图标。unavatar 覆盖面比写死一张映射表大得多 */
export function getFavicon(domain: string, size = 64) {
	return `https://unavatar.webp.se/google/${domain}?w=${size}`
}

/**
 * 碎语链接卡上那格 og:image 的取图地址。
 *
 * 站点给 og:image 放的多是 1200×630、几百 KB 的大图，而卡片上那格缩略图不过百来像素宽。
 * 借 wsrv 在它那头缩好再回来，顺带解决防盗链——wsrv 去取图时不带 Referer，
 * 而不少站点的 og:image 直连会吃 403。
 */
export function getOgImgUrl(src: string, width: number) {
	return `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${width}&output=webp`
}

export function isExtLink(url?: string) {
	return !!url?.includes(':')
}

export function safelyDecodeUriComponent(str: string) {
	try {
		return decodeURIComponent(str)
	}
	catch {
		return str
	}
}
