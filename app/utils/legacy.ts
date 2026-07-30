import homepageConfig from '~~/homepage.config'

/**
 * 旧博客链接的归宿。
 *
 * shinya.click 这个域名先前跑的是博客（Astro + Retypeset），改成主页之后，那批外链、
 * 书签和搜索结果全会落到 404 上。旧站 sitemap 共 369 条（中文 + /en + /ja 三份），
 * 按去处分四类：
 *
 * - 126 条文章（42 篇 × 3 语言）。剥掉语言前缀和尾斜杠之后**逐条命中**博客上的同名
 *   文章——搬家只换了 host，路径一个字都没动
 * - 231 条 /tags/<标签>（145 个标签）。新博客没有标签页，只有 /archive
 * - 3 条 /about。那一页的继任者就是现在这个主页
 * - 3 条 /friends。博客上改叫 /link
 *
 * 剩下的 /、/memos 本站自己就有，压根走不到 404。
 *
 * 刻意不在构建期烘一张跳转表：映射规则本身就是「去掉语言前缀和尾斜杠、host 前面加
 * blog.」，126 条无一例外，烘表只是多存一份会过期的数据。目标到底还在不在，交给
 * 订阅源和 /api/og 去问，见 components/partial/Moved.vue。
 */

/** 从订阅源地址推出博客站点地址，免得同一个域名在配置里写两遍、改一处漏一处 */
const BLOG_ORIGIN = new URL(homepageConfig.blogAtom).origin

export const blogHomeUrl = `${BLOG_ORIGIN}/`
export const blogArchiveUrl = `${BLOG_ORIGIN}/archive`
export const blogLinksUrl = `${BLOG_ORIGIN}/link`

export const siteHost = new URL(homepageConfig.url).host
export const blogHost = new URL(BLOG_ORIGIN).host

/**
 * 博客 host 相对本站多出来的那一截，以及两边共有的那一截。
 *
 * 404 页拿它做路径变形：多出来的 blog. 展开进来，共有的 shinya.click 灰下去。
 * 拆不开（哪天博客不再是本站子域）就不做这个承诺——added 为空，整行直接显示新地址。
 */
export const blogHostParts = blogHost.endsWith(`.${siteHost}`)
	? { added: blogHost.slice(0, -siteHost.length), base: siteHost }
	: { added: '', base: blogHost }

/** 旧站的多语言前缀。中文是默认语言，没有前缀 */
const LOCALE_PREFIX_RE = /^\/(?:en|ja)(?=\/|$)/
const TRAILING_SLASH_RE = /\/$/

/**
 * 旧站 slug 一律是小写字母、数字和连字符（tech-about-gfw、mydb10、65840、
 * kansai-202504），42 篇无一例外。
 *
 * 这条同时是道闸：/wp-admin/setup.php 这类扫描流量段里带点，进不来，也就不会白白
 * 触发一次对博客的抓取。
 */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const TAGS_PREFIX = '/tags/'

/** 文章。url 是博客上的同名地址，但还没确认它是否真的存在 */
interface LegacyArticle { kind: 'article', path: string, url: string }
/** 标签页。新站没有对应物，一律收口到归档 */
interface LegacyArchive { kind: 'archive', tag?: string }
/** 旧的关于页，继任者是本站首页 */
interface LegacyProfile { kind: 'profile' }
/** 旧的友链页，博客上改叫 /link */
interface LegacyLinks { kind: 'links' }

export type LegacyTarget = LegacyArticle | LegacyArchive | LegacyProfile | LegacyLinks

/**
 * 拿到干净的路径。
 *
 * error.url 有时给完整 URL、有时只给路径，给 URL 构造器补个 base 两种都能吃下，
 * 顺带把 query 和 hash 一并剥掉——旧链接上挂着的 ?utm_source= 之类不该参与匹配。
 */
function toPathname(raw: string) {
	try {
		return new URL(raw, 'http://localhost').pathname
	}
	catch {
		return raw
	}
}

function normalize(raw: string) {
	const path = toPathname(raw).replace(LOCALE_PREFIX_RE, '')
	if (path.length < 2)
		return '/'
	return path.replace(TRAILING_SLASH_RE, '')
}

/** 认不出来就返回 null，页面退回朴素 404 */
export function resolveLegacyPath(raw: string): LegacyTarget | null {
	const path = normalize(raw)

	if (path === '/about')
		return { kind: 'profile' }

	if (path === '/friends')
		return { kind: 'links' }

	if (path === '/tags')
		return { kind: 'archive' }

	if (path.startsWith(TAGS_PREFIX)) {
		// 一半以上的旧标签是中日文，在地址里是百分号编码的
		const tag = safelyDecodeUriComponent(path.slice(TAGS_PREFIX.length))
		return { kind: 'archive', tag: tag || undefined }
	}

	// 旧文章路径要么两段（/fiddling/tech-about-gfw），要么三段
	// （/notes/65840/raftlab2a、/projects/mydb/mydb0）
	const segments = path.slice(1).split('/')
	if (segments.length < 2 || segments.length > 3 || !segments.every(seg => SLUG_RE.test(seg)))
		return null

	return { kind: 'article', path, url: BLOG_ORIGIN + path }
}
