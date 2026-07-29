/**
 * 灯箱的共享状态。
 *
 * 放在模块作用域而不是逐层传 prop：开灯箱的是列表里某一条碎语的某一张图，
 * 而对话框只该有一个、挂在页面上。中间隔着 ZMemo 一层，用事件往上冒要在
 * 每一层都转写一次，状态提到模块里两边直接读写更短。
 *
 * 只有碎语页用得上，故 <ZLightbox> 只在那一页渲染，不进 app.vue。
 */
const images = ref<string[]>([])
const index = ref(0)

export default function useLightbox() {
	function open(list: string[], start: number) {
		images.value = list
		index.value = start
	}

	function close() {
		images.value = []
	}

	// 环形翻页：多图碎语按左右键时，走到头再按一下回到另一头，
	// 免得在两端出现"按了没反应"的死角
	function step(delta: number) {
		const total = images.value.length
		if (total > 1)
			index.value = (index.value + delta + total) % total
	}

	return { images, index, open, close, step }
}
