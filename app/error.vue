<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{
	error: NuxtError & { url?: string }
}>()
</script>

<template>
<ZSidebar />
<div class="content">
	<ZHeader />
	<main>
		<div>
			<ZTitle>出错了</ZTitle>
			<ZField :label="error?.status?.toString()">
				<div class="error-message">
					<pre>{{ error?.message }}</pre>
				</div>
				<br>
				<ZButton text="返回主页" @click="clearError({ redirect: '/' })" />
			</ZField>
		</div>
	</main>
</div>
</template>

<style lang="scss" scoped>
.error-message {
	display: flex;
	overflow: auto;

	> pre {
		max-width: 0;
	}
}
</style>
