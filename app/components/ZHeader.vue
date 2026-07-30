<script setup lang="ts">
const sidebarStore = useSidebarStore()
</script>

<template>
<div id="z-header">
	<button
		id="toggle-sidebar"
		type="button"
		aria-label="打开侧边栏"
		aria-controls="z-sidebar"
		:aria-expanded="sidebarStore.isOpen"
		@click="sidebarStore.toggle"
	>
		<Icon name="ri:sidebar-unfold-line" />
	</button>
	<span class="header-text">{{ $route.meta.headerText }}</span>
</div>
</template>

<style lang="scss" scoped>
#z-header {
	display: flex;
	align-items: center;
	position: sticky;
	top: 0;
	height: 48px;
	padding: 0 0.5rem;
	background-color: var(--c-bg-a50);
	backdrop-filter: blur(1rem);
	font-weight: 600;
	z-index: 1;

	.header-text {
		flex-grow: 1;
		padding: 0 0.7em;
	}
}

#toggle-sidebar {
	display: none;
	place-items: center;
	width: 40px;
	height: 40px;
	border-radius: 0.4em;
	font-size: 1.2em;
	transition: background-color var(--motion-base) var(--ease-out), transform var(--motion-fast) var(--ease-out);

	@media (hover: hover) {
		&:hover {
			background-color: var(--c-bg-soft);
		}
	}

	&:active {
		transform: scale(0.96);
	}

	@media (max-width: $breakpoint-mobile) {
		display: grid;
	}
}
</style>
