import type { ShallowRef } from 'vue'

interface RevealOptions {
	/** 同一批里相邻两个之间隔多久，毫秒 */
	step?: number
	/** 一批最多错开几档。再长的一批也不该让末尾那个干等两秒 */
	cap?: number
	/** 视口底边往上收掉几成算「还没进来」。收边而不是量元素自身的露出比例 */
	bottomInset?: number
	/** 挂载时就已经在线上的那批直接就位，不播入场动画。见下方长注释 */
	settleFirstBatch?: boolean
}

/**
 * 让容器的直接子元素在进入视口时依次升起：命中的元素被加上 .seen，升起的样子由
 * 各自的样式表决定（本站统一是 opacity 0 → 1 配 translate 12px → 0）。
 *
 * 与「每个子元素各挂一个 observer」只差一处，而那一处正是「渐次」的来源：整组
 * 共用一个 IntersectionObserver，于是同一帧一起越线的元素会装在**同一个回调的
 * entries 数组**里送过来。首屏那几条就是这样一批，按批内次序发延迟才有先后；各
 * 管各的话，它们只会在同一帧一起亮——项目页原先就是这样，动画有了，「渐次」没有。
 *
 * 往下滚时一批通常只有一两个，延迟自然退回 0，不会出现「已经滚到了却还干等半秒」。
 * 这也是延迟必须内联发、不能在 CSS 里按 nth-child 算的原因：nth-child 数的是在整
 * 个列表里的位置，这里要的是在**这一批**里的位置，两者只在首屏恰好重合。
 *
 * settleFirstBatch 是给「前面摆过骨架屏」的页面的。这个动画讲的是「到场」，可挂载
 * 时就已经在视口里的那批并没有到场——它们是顶替骨架**就位**的，位置、尺寸、交错
 * 全是骨架已经预告过的。仍旧让它们从 opacity 0 升起，等于把骨架争取来的感知速度
 * 原样还回去，中间还要空一页：项目页实测数据 2127ms 到手，第一行 2513ms 才读得清。
 * 所以这批同步判位、同步就位，视口外的照旧交给 observer。
 */
export function useRevealStagger(
	container: Readonly<ShallowRef<HTMLElement | null>>,
	{ step = 60, cap = 6, bottomInset = 0.1, settleFirstBatch = false }: RevealOptions = {},
) {
	let observer: IntersectionObserver | undefined

	function disconnect() {
		observer?.disconnect()
		observer = undefined
	}

	function observe(root: HTMLElement) {
		disconnect()

		observer = new IntersectionObserver((entries) => {
			// entries 的顺序不保证是文档顺序，按视口位置从上往下排一遍再发号
			const arrived = entries
				.filter(entry => entry.isIntersecting)
				.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

			arrived.forEach((entry, index) => {
				const el = entry.target as HTMLElement
				const slot = Math.min(index, cap)
				if (slot)
					el.style.transitionDelay = `${slot * step}ms`
				el.classList.add('seen')
				// 升一次就不再管它。留着的话来回滚会反复触发，而这个动画讲的是「到场」
				// 不是「在场」，重播只会烦人
				observer?.unobserve(el)
			})
		}, {
			/*
			 * 用 rootMargin 收底边、threshold 留 0，而不是「露出元素自身的 15%」。
			 * 后者把触发条件绑在了元素高度上：比视口高得多的条目——配了四张图的碎语
			 * 就能到这个量级——永远凑不满自己的 15%，于是一直停在 opacity: 0 上，
			 * 内容直接看不见。收底边量的是元素顶边和视口的关系，多高都算得出来。
			 */
			threshold: 0,
			rootMargin: `0px 0px -${bottomInset * 100}% 0px`,
		})

		const children = [...root.children] as HTMLElement[]
		if (!settleFirstBatch) {
			for (const child of children)
				observer.observe(child)
			return
		}

		// 顶边越过这条线就算「进来了」。observer 那边用 rootMargin 表达同一条线，
		// 两处必须同源，故只留 bottomInset 一个入口，不再单开一个 rootMargin 选项
		const bottom = window.innerHeight * (1 - bottomInset)

		// 位置一次读完再动样式。边读边写会让浏览器在每个孩子上重算一遍布局
		const tops = children.map(child => child.getBoundingClientRect().top)
		const settled: HTMLElement[] = []

		children.forEach((child, index) => {
			if (tops[index]! >= bottom) {
				observer!.observe(child)
				return
			}
			// 上面读 rect 已经逼浏览器把 opacity: 0 算成了「变化前」的样式，此刻加
			// .seen 会老老实实过渡 0.5s。要的是硬切，所以先掐掉过渡
			child.style.transition = 'none'
			child.classList.add('seen')
			settled.push(child)
		})

		// 下一帧把过渡还回去，好让别的状态变化（主题切换之类）仍有动画。
		// 那时 opacity 已经是 1，还回去不会有任何动静
		if (settled.length) {
			requestAnimationFrame(() => {
				for (const child of settled)
					child.style.transition = ''
			})
		}
	}

	// flush: 'post' —— 容器和它的子元素是同一次 patch 里出现的（两个页面的列表都
	// 挂在 v-else 分支上，取数回来才存在）。默认的 pre 时机拿到的容器还是空的。
	// 首批就位也压在这个时机上：DOM 已经在，浏览器还没画，于是不会有空白帧
	watch(container, root => root ? observe(root) : disconnect(), { immediate: true, flush: 'post' })

	onScopeDispose(disconnect)
}
