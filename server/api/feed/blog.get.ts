import { XMLParser } from 'fast-xml-parser'
import homepageConfig from '~~/homepage.config'

export default defineCachedEventHandler(async (_event) => {
	const parser = new XMLParser({
		attributeNamePrefix: '$',
		cdataPropName: '$',
		ignoreAttributes: false,
		isArray: name => name === 'entry' || name === 'category',
		textNodeName: '_',
	})

	const resp = await fetch(homepageConfig.blogAtom)

	const objAtom = parser.parse(await resp.text())

	// 一并带上订阅源自己的标题。404 页要拿它把 og:title 尾巴上的站名切掉
	// （博客的 <title> 模板是「%s | 信也のブログ」），而 og:site_name 并非每页都有，
	// 订阅源里的站名才是稳的那个。见 app/components/partial/Moved.vue
	//
	// 文章数组这个字段刻意叫 posts 而不是 entries：调用方常把这份响应错当成数组，
	// 而数组身上正好有个 Array.prototype.entries。真取错了的话 data.entries 会摸到
	// 那个方法而不是 undefined，可选链一路放行，直到 .slice 才炸——错得又晚又难认。
	// posts 不在 Array.prototype 上，取错就是 undefined，当场short-circuit。
	return {
		title: objAtom.feed?.title,
		posts: objAtom.feed?.entry ?? [],
	}
}, {
	maxAge: 60 * 60 * 24,
	/**
	 * 缓存键必须绑定订阅源 URL。默认键只按请求路径算，跟 blogAtom 的值无关，所以换
	 * 订阅源（比如从上游作者的博客换成 blog.shinya.click）不会让旧缓存失效，构建会
	 * 一直吐上一个源的快照。这份缓存落在 node_modules/.cache/nuxt/.nuxt/cache/nitro/，
	 * 不在 .nuxt/cache 里，清 .nuxt/cache 清不到它，非常容易在验证时被漏掉。
	 *
	 * 键里那个 v2 是响应结构的版本号，**改动上面 return 的形状时必须往上加**。
	 * 光绑 URL 还不够：结构变了而 URL 没变，旧结构照样会被当成有效缓存端出来，
	 * 页面拿着新代码去读旧形状，构建期就 500。Vercel 会跨次部署恢复构建缓存，
	 * 这事在线上一样会发生，不是只有本地才踩得到。
	 */
	getKey: () => `blog-atom:v2:${homepageConfig.blogAtom}`,
})
