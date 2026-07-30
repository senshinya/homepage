import type { ShallowRef } from 'vue'

interface RevealOptions {
	/** 同一批里相邻两个之间隔多久，毫秒 */
	step?: number
	/** 一批最多错开几档。再长的一批也不该让末尾那个干等两秒 */
	cap?: number
	/** 元素顶边越过「视口底部往上数这么多」时算进来了 */
	rootMargin?: string
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
 */
export function useRevealStagger(
	container: Readonly<ShallowRef<HTMLElement | null>>,
	{ step = 60, cap = 6, rootMargin = '0px 0px -10% 0px' }: RevealOptions = {},
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
			rootMargin,
		})

		for (const child of root.children)
			observer.observe(child)
	}

	// flush: 'post' —— 容器和它的子元素是同一次 patch 里出现的（两个页面的列表都
	// 挂在 v-else 分支上，取数回来才存在）。默认的 pre 时机拿到的容器还是空的
	watch(container, root => root ? observe(root) : disconnect(), { immediate: true, flush: 'post' })

	onScopeDispose(disconnect)
}
