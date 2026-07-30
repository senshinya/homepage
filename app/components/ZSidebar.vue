<script setup lang="ts">
const appConfig = useAppConfig()
const sidebarStore = useSidebarStore()
// 与 assets/_variable.scss 的 $breakpoint-mobile 保持一致；JS 侧需要同一条
// media query 才能同步 inert、焦点和滚动锁定状态
const isMobile = useMediaQuery('(max-width: 768px)')
const sidebar = useTemplateRef<HTMLElement>('sidebar')
const drawerOpen = computed(() => isMobile.value && sidebarStore.isOpen)
const returnFocus = shallowRef<HTMLElement>()

function closeSidebar(restoreFocus = false) {
	sidebarStore.close()
	if (restoreFocus)
		nextTick(() => returnFocus.value?.focus())
}

// 窄屏下侧栏是盖在内容上的抽屉，跳转后必须收起，否则落地页会被自己挡着。
// 离开窄屏时也清空 isOpen，避免调整窗口后回到移动布局时抽屉自行重开。
//
// 用路由变化而不是给每个链接挂 click：back/forward 和任何程序化跳转也该收起。
// 但路由变化盖不住「点当前所在的那一栏」——路径没变，watch 不触发，抽屉就赖着
// 不动，而那恰恰是最容易被当成卡死的一种点法，故两个触发都留着
watch(() => useRoute().fullPath, sidebarStore.close)

watch(isMobile, (mobile) => {
	if (!mobile)
		sidebarStore.close()
})

watch(drawerOpen, async (isOpen) => {
	if (!isOpen)
		return
	if (document.activeElement instanceof HTMLElement)
		returnFocus.value = document.activeElement
	await nextTick()
	if (!sidebarStore.isOpen || !isMobile.value)
		return
	sidebar.value?.querySelector<HTMLElement>('.close-sidebar')?.focus()
})

onKeyStroke('Escape', () => {
	if (drawerOpen.value)
		closeSidebar(true)
})

useHead(() => ({
	bodyAttrs: {
		class: drawerOpen.value ? 'sidebar-open' : undefined,
	},
}))
</script>

<template>
<aside
	id="z-sidebar"
	ref="sidebar"
	:class="{ show: drawerOpen }"
	:inert="isMobile && !drawerOpen"
	:aria-hidden="isMobile && !drawerOpen ? 'true' : undefined"
>
	<header class="aside-header">
		<ZAvatar class="aside-avatar" />
		<span>{{ appConfig.author.name }}</span>
		<button class="close-sidebar" type="button" aria-label="关闭侧边栏" @click="closeSidebar(true)">
			<Icon name="ri:close-line" />
		</button>
	</header>
	<nav class="aside-nav scrollcheck-y">
		<template v-for="(group, groupIndex) in appConfig.nav" :key="groupIndex">
			<h2 v-if="group.title">
				{{ group.title }}
			</h2>
			<menu>
				<li v-for="(item, itemIndex) in group.items" :key="itemIndex">
					<ZRawLink
						v-slot="{ external }"
						:to="item.url"
						:title="item.title"
						class="aside-nav-item"
						@click="closeSidebar(drawerOpen)"
					>
						<Icon :name="item.icon" />
						<span class="nav-text">{{ item.text }}</span>
						<Icon v-if="external" class="external-tip" name="ri:arrow-right-up-line" />
					</ZRawLink>
				</li>
			</menu>
		</template>
	</nav>
	<footer class="aside-footer">
		<ZThemeToggle />
		<component :is="() => toValue(item)" v-for="(item, index) in appConfig.footer" :key="index" />
	</footer>
</aside>
<Transition>
	<div v-if="drawerOpen" id="z-sidebar-bgmask" @click="closeSidebar(true)" />
</Transition>
</template>

<style lang="scss" scoped>
#z-sidebar {
	display: flex;
	flex-direction: column;
	flex-shrink: 0;
	width: 240px;
	border-right: 1px solid var(--c-border);
	background-color: var(--c-bg-1);

	.close-sidebar {
		display: none;
		place-items: center;
		width: 40px;
		height: 40px;
		margin-right: -0.5rem;
		border-radius: 0.4em;
		transition: background-color var(--motion-base) var(--ease-out), transform var(--motion-fast) var(--ease-out);

		@media (hover: hover) {
			&:hover {
				background-color: var(--c-bg-soft);
			}
		}

		&:active {
			transform: scale(0.96);
		}
	}

	@media (max-width: $breakpoint-mobile) {
		position: fixed;
		visibility: hidden;
		left: 0;
		width: 320px;
		height: 100%;
		height: 100dvh;
		max-width: 100%;
		transform: translateX(-100%);
		transition: transform var(--motion-panel) var(--ease-out), visibility 0s var(--motion-panel);
		overscroll-behavior: contain;
		z-index: 3;

		&.show {
			visibility: visible;
			box-shadow: 0 0 1rem var(--ld-shadow);
			transform: none;
			transition-delay: 0s;

			.close-sidebar {
				display: grid;
			}
		}
	}
}

#z-sidebar-bgmask {
	position: fixed;
	inset: 0;
	backdrop-filter: contrast(0.8) brightness(0.9);
	transition: opacity var(--motion-base) var(--ease-out);
	z-index: 2;

	&.v-enter-from,
	&.v-leave-to {
		opacity: 0;
	}

	@media (min-width: ($breakpoint-mobile + 1px)) {
		display: none;
	}
}

.aside-header {
	display: grid;
	flex-shrink: 0;
	grid-template-columns: 1.5rem 1fr auto;
	align-items: center;
	gap: 0.5rem;
	height: 48px;
	padding-inline: 1rem;
	font-weight: 600;
}

.aside-avatar {
	font-size: 1.5rem;
}

.aside-nav {
	flex-grow: 1;
	overflow: auto;
	padding: 0 5%;
	font-size: 0.9em;

	h2 {
		margin: 2rem 0 1rem 1rem;
		font-size: 1em;
		font-weight: normal;
		color: var(--c-text-2);
	}

	li {
		margin: 0.5em 0;
	}
}

.aside-nav-item {
	display: flex;
	align-items: center;
	gap: 0.5em;
	min-height: 40px;
	padding: 0.5em 1em;
	border-radius: 0.5em;
	transition: background-color var(--motion-base) var(--ease-out), color var(--motion-base) var(--ease-out), transform var(--motion-fast) var(--ease-out);

	&.router-link-active {
		background-color: var(--c-bg-soft);
		color: var(--c-text);
	}

	@media (hover: hover) {
		&:hover {
			background-color: var(--c-bg-soft);
			color: var(--c-text);
		}
	}

	&:active {
		transform: scale(0.98);
	}

	&.router-link-active::after {
		content: "⦁";
		width: 1em;
		text-align: center;
		color: var(--c-text-3);
	}

	.iconify {
		font-size: 1.5em;
	}

	.nav-text {
		flex-grow: 1;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.external-tip {
		opacity: 0.5;
		font-size: 1em;
	}
}

.aside-footer {
	display: grid;
	gap: 0.2rem;
	padding: 1rem;
	font-size: 0.8em;
	text-align: center;
	color: var(--c-text-2);

	> .theme-toggle {
		margin-bottom: 0.8rem;
	}
}
</style>
