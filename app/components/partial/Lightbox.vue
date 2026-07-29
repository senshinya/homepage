<script setup lang="ts">
/**
 * 碎语配图的灯箱。
 *
 * 用原生 <dialog> 而不是自己叠一层 fixed div：顶层（top layer）、::backdrop、
 * Esc 关闭、焦点陷阱、还原焦点，这些浏览器全包了。自己写一套要多出几十行，
 * 而且键盘可达性很容易做漏。
 *
 * 博客那边用的是 @bikariya/image-viewer（带缩放拖拽），这里没搬——它连着
 * @bikariya/modals 和 @bikariya/core 三个 0.0.x 的包，为看一眼手机截图不划算。
 */
const { images, index, close, step } = useLightbox()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const open = computed(() => images.value.length > 0)
const current = computed(() => images.value[index.value])

watch(open, async (isOpen) => {
	await nextTick()
	if (isOpen)
		dialog.value?.showModal()
	else
		dialog.value?.close()
})

// Esc 走的是 <dialog> 自己的 cancel/close，不经过我们的 close()，
// 得把状态同步回来，否则再点同一张图时 open 还是 true，watch 不触发
function onClose() {
	if (open.value)
		close()
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'ArrowLeft')
		step(-1)
	else if (event.key === 'ArrowRight')
		step(1)
}
</script>

<template>
<dialog
	ref="dialog"
	class="lightbox"
	@close="onClose"
	@click.self="close()"
	@keydown="onKeydown"
>
	<img v-if="current" :src="current" alt="" @click="close()">

	<div v-if="images.length > 1" class="lightbox-nav">
		<button type="button" aria-label="上一张" @click="step(-1)">
			<Icon name="ri:arrow-left-s-line" />
		</button>
		<span class="lightbox-count">{{ index + 1 }} / {{ images.length }}</span>
		<button type="button" aria-label="下一张" @click="step(1)">
			<Icon name="ri:arrow-right-s-line" />
		</button>
	</div>

	<button class="lightbox-close" type="button" aria-label="关闭" @click="close()">
		<Icon name="ri:close-line" />
	</button>
</dialog>
</template>

<style lang="scss" scoped>
// 铺满视口是为了 @click.self 能命中：backdrop 是 dialog 的伪元素，点它时
// event.target 就是 dialog 本身。若 dialog 只有图那么大，点周围的空处就关不掉
.lightbox {
	place-items: center;
	overflow: hidden;
	width: 100%;
	height: 100%;
	max-width: none;
	max-height: none;
	padding: 0;
	background: none;

	&[open] {
		display: grid;
	}

	&::backdrop {
		background-color: rgb(0 0 0 / 80%);
	}

	> img {
		max-width: 92vw;

		// 给底部的翻页条留出位置，否则长图会压在它上面
		max-height: 84vh;
		border-radius: 4px;
		cursor: zoom-out;
		object-fit: contain;
	}
}

.lightbox-nav {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	position: fixed;
	bottom: clamp(1rem, 5vh, 2.5rem);
	padding: 0.2rem 0.4rem;
	border-radius: 2rem;
	background-color: var(--c-bg-1);
	font-size: 0.85rem;
	color: var(--c-text-2);
	font-variant-numeric: tabular-nums;

	> button {
		display: flex;
		padding: 0.3rem;
		border-radius: 50%;
		transition: background-color 0.2s;

		&:hover {
			background-color: var(--c-bg-2);
		}
	}
}

.lightbox-close {
	display: flex;
	position: fixed;
	top: clamp(0.5rem, 3vh, 1.5rem);
	right: clamp(0.5rem, 3vw, 1.5rem);
	padding: 0.4rem;
	border-radius: 50%;
	background-color: var(--c-bg-1);
	color: var(--c-text-2);
	transition: background-color 0.2s;

	&:hover {
		background-color: var(--c-bg-2);
	}
}
</style>
