<script setup lang="ts">
const appConfig = useAppConfig()
const colorMode = useColorMode()
</script>

<template>
<div class="theme-toggle" role="group" aria-label="主题模式">
	<button
		v-for="(themeData, themeName) in appConfig.themes"
		:key="themeName"
		v-tip="themeData.tip"
		type="button"
		:aria-label="themeData.tip"
		:aria-pressed="colorMode.preference === themeName"
		:class="{ active: colorMode.preference === themeName }"
		@click="colorMode.preference = themeName"
	>
		<Icon :name="themeData.icon" />
	</button>
</div>
</template>

<style lang="scss" scoped>
.theme-toggle {
	display: flex;
	justify-content: center;
	gap: 3px;
	width: fit-content;
	margin: 0 auto;
	padding: 2px;
	border: 1px solid var(--c-border);
	border-radius: 1rem;
	background-color: var(--c-bg-2);

	> button {
		min-width: 40px;
		min-height: 40px;
		padding: 4px 1rem;
		border-radius: 1rem;
		transition: background-color var(--motion-base) var(--ease-out), color var(--motion-base) var(--ease-out), box-shadow var(--motion-base) var(--ease-out), transform var(--motion-fast) var(--ease-out);

		@media (hover: hover) {
			&:hover {
				background-color: var(--c-bg-soft);
				color: var(--c-text-1);
			}
		}

		&:active:not(.active) {
			transform: scale(0.96);
		}

		&.active {
			box-shadow: 0 0 0.5rem var(--ld-shadow);
			background-color: var(--ld-bg-card);
			color: var(--c-text-1);
			cursor: auto;
		}
	}
}
</style>
