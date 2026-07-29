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
	return objAtom.feed?.entry
}, {
	maxAge: 60 * 60 * 24,
	// 缓存键必须绑定订阅源 URL。默认键只按请求路径算，跟 blogAtom 的值无关，
	// 所以换订阅源（比如从上游作者的博客换成 blog.shinya.click）不会让旧缓存
	// 失效，构建会一直吐上一个源的快照。这份缓存落在
	// node_modules/.cache/nuxt/.nuxt/cache/nitro/，不在 .nuxt/cache 里，
	// 清 .nuxt/cache 清不到它，非常容易在验证时被漏掉。
	getKey: () => `blog-atom:${homepageConfig.blogAtom}`,
})
