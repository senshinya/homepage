import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
// The repository deliberately has no test-runner dependency; these small source
// contracts use Node's built-in runner instead.
// eslint-disable-next-line test/no-import-node-test
import test from 'node:test'

const root = new URL('../', import.meta.url).pathname

function read(relativePath) {
	return readFileSync(join(root, relativePath), 'utf8')
}

function collectSourceFiles(directory) {
	return readdirSync(join(root, directory), { withFileTypes: true }).flatMap((entry) => {
		const relativePath = join(directory, entry.name)
		if (entry.isDirectory())
			return collectSourceFiles(relativePath)
		return ['.scss', '.vue'].includes(extname(entry.name)) ? [relativePath] : []
	})
}

function grayscaleContrast(lightness, backgroundLightness = 100) {
	const linear = value => value <= 0.04045
		? value / 12.92
		: ((value + 0.055) / 1.055) ** 2.4
	const foreground = linear(lightness / 100)
	const background = linear(backgroundLightness / 100)
	return (background + 0.05) / (foreground + 0.05)
}

test('light theme keeps tertiary text readable without changing the blue identity', () => {
	const source = read('app/assets/color.scss')
	const lightTheme = source.slice(source.indexOf(':root,'), source.indexOf('.dark'))

	assert.match(lightTheme, /--c-text-3:\s*hsl\(var\(--hue-theme\) 0% 46%\)/)
	assert.match(lightTheme, /--c-bg-1:\s*hsl\(var\(--hue-theme\) 20% 97%\)/)
	assert.match(lightTheme, /--c-primary:\s*hsl\(var\(--hue-theme\) 85% 53%\)/)
	assert.ok(grayscaleContrast(46) >= 4.5)
})

test('motion uses named timings, explicit properties, and a global reduced-motion fallback', () => {
	const combinedSource = collectSourceFiles('app')
		.map(path => read(path))
		.join('\n')
	const globalStyles = read('app/assets/main.scss')

	assert.doesNotMatch(combinedSource, /transition:\s*all\b/)
	assert.doesNotMatch(combinedSource, /transition:\s*0\.2s\s*;/)
	assert.match(globalStyles, /--motion-fast:/)
	assert.match(globalStyles, /--motion-base:/)
	assert.match(globalStyles, /--ease-out:/)
	assert.match(globalStyles, /@media \(prefers-reduced-motion: reduce\)/)
})

test('mobile sidebar exposes accessible open and close controls', () => {
	const sidebar = read('app/components/ZSidebar.vue')
	const header = read('app/components/ZHeader.vue')
	const appShell = read('app/app.vue')
	const variables = read('app/assets/_variable.scss')
	const breakpoint = variables.split('\n')
		.find(line => line.startsWith('$breakpoint-mobile:'))
		?.split(':')[1]
		?.replace(';', '')
		.trim()

	assert.ok(breakpoint)
	assert.ok(sidebar.includes(`useMediaQuery('(max-width: ${breakpoint})')`))
	assert.match(sidebar, /const drawerOpen = computed/)
	assert.match(sidebar, /watch\(isMobile,[\s\S]+sidebarStore\.close\(\)/)
	assert.match(sidebar, /v-if="drawerOpen"/)
	assert.match(sidebar, /<button[^>]+class="close-sidebar"[^>]+aria-label="关闭侧边栏"/)
	assert.match(sidebar, /onKeyStroke\('Escape'/)
	assert.match(sidebar, /sidebar-open/)
	assert.match(sidebar, /const returnFocus/)
	assert.doesNotMatch(sidebar, /document\.querySelector/)
	assert.match(sidebar, /@click="closeSidebar\(drawerOpen\)"/)
	assert.match(appShell, /body\.sidebar-open #z-root > \.content/)
	assert.match(sidebar, /await nextTick\(\)[\s\S]+if \(!sidebarStore\.isOpen \|\| !isMobile\.value\)/)
	assert.match(header, /:aria-expanded="sidebarStore\.isOpen"/)
	assert.match(header, /aria-controls="z-sidebar"/)
})

test('theme and project metadata expose state to keyboard and assistive technology', () => {
	const themeToggle = read('app/components/partial/ThemeToggle.vue')
	const project = read('app/components/partial/Project.vue')
	const button = read('app/components/partial/Button.vue')

	assert.match(themeToggle, /:aria-pressed="colorMode\.preference === themeName"/)
	assert.match(project, /class="project-langs"[^>]+tabindex="0"/)
	assert.match(project, /:aria-label="languageLabel"/)
	assert.match(button, /type\?: 'button' \| 'submit' \| 'reset'/)
	assert.match(button, /type:\s*'button'/)
})

test('project commit counters use occurrences', () => {
	const project = read('app/components/partial/Project.vue')

	assert.match(project, /<span>\{\{ stats\.commits \}\} 次提交<\/span>/)
	assert.match(project, /近 7 天 \{\{ stats\.commitsLast7d \}\} 次/)
	assert.doesNotMatch(project, /\{\{ stats\.commits \}\} 提交/)
	assert.doesNotMatch(project, /近 7 天 \{\{ stats\.commitsLast7d \}\} 条/)
})

test('loading failures use familiar page language', () => {
	const article = read('app/pages/article.vue')
	const project = read('app/pages/project.vue')
	const memos = read('app/pages/memos.vue')

	assert.match(article, /文章暂时加载失败，请稍后重试。/)
	assert.match(project, /项目暂时加载失败，请稍后重试。/)
	assert.match(memos, /碎语暂时加载失败，请稍后重试。/)
	assert.doesNotMatch(`${article}${project}${memos}`, /暂时没取到/)
})

test('memos requests only the ten most recent entries', () => {
	const memos = read('app/pages/memos.vue')

	assert.match(memos, /const PAGE_SIZE = 10/)
	assert.match(memos, /query: \{ pageSize: PAGE_SIZE \}/)
})

test('legacy routes name their destination without insider shorthand', () => {
	const moved = read('app/components/partial/Moved.vue')
	const memos = read('app/pages/memos.vue')

	assert.match(moved, /这个标签不再单独成页/)
	assert.match(moved, /关于页已合并到主页/)
	assert.match(moved, /你现在看到的就是新的关于页。/)
	assert.match(moved, /这个链接可能不完整，也可能文章已经撤下了。/)
	assert.match(memos, />\s*去博客看更早的碎语\s*</)
	assert.doesNotMatch(moved, /标签页一并取消了|关于页并到了这里|这个站本身就是那一页|链接抄漏了一截/)
})

test('prerendered blog feed is served as JSON', () => {
	const config = read('homepage.config.ts')

	assert.match(config, /'\/api\/feed\/blog':\s*\{\s*headers:\s*\{\s*'Content-Type':\s*'application\/json; charset=utf-8'/)
})

test('unexpected errors lead with plain copy and disclose technical details on demand', () => {
	const errorPage = read('app/error.vue')

	assert.match(errorPage, /页面暂时无法打开，请稍后重试。/)
	assert.match(errorPage, /<details v-if="error\?\.message" class="error-details">[\s\S]*?<summary>查看错误详情<\/summary>[\s\S]*?<pre>\{\{ error\?\.message \}\}<\/pre>[\s\S]*?<\/details>/)
	assert.doesNotMatch(errorPage, /class="error-message"/)
})

test('404 backdrop stays anchored near the initial viewport top', () => {
	const errorPage = read('app/error.vue')
	const stageStyles = errorPage.slice(errorPage.indexOf('.stage {'), errorPage.indexOf('.stage-mark {'))
	const markStyles = errorPage.slice(errorPage.indexOf('.stage-mark {'), errorPage.indexOf('.lost-lead {'))

	assert.match(stageStyles, /position:\s*relative/)
	assert.match(stageStyles, />\s*:not\(\.stage-mark\)\s*\{[\s\S]*?grid-area:\s*stack/)
	assert.match(markStyles, /position:\s*absolute/)
	assert.match(markStyles, /inset-block-start:\s*0/)
	assert.match(markStyles, /inset-inline-start:\s*50%/)
	assert.match(markStyles, /transform:\s*translateX\(-50%\)/)
	assert.doesNotMatch(markStyles, /place-self:/)
})

test('memo and lightbox controls remain discoverable on touch screens', () => {
	const memo = read('app/components/partial/Memo.vue')
	const lightbox = read('app/components/partial/Lightbox.vue')

	assert.match(memo, /\.memo-permalink\s*\{[^}]+opacity:\s*0\.55/)
	assert.match(memo, /@media \(hover: hover\)/)
	assert.match(lightbox, /aria-label="图片预览"/)
	assert.match(lightbox, /:alt="`碎语配图 \$\{index \+ 1\}`"/)
	assert.match(lightbox, /min-width:\s*40px/)
})

test('error and status copy stays direct and neutral', () => {
	const article = read('app/pages/article.vue')
	const projectPage = read('app/pages/project.vue')
	const memos = read('app/pages/memos.vue')
	const projectComponent = read('app/components/partial/Project.vue')
	const errorPage = read('app/error.vue')

	assert.doesNotMatch(`${article}${projectPage}${memos}`, /可能是网络不通/)
	assert.doesNotMatch(projectComponent, /停更/)
	assert.match(article, />全部文章</)
	assert.doesNotMatch(errorPage, /尝试忽略/)
})

test('theme toggle stays compact', () => {
	const themeToggle = read('app/components/partial/ThemeToggle.vue')

	assert.doesNotMatch(themeToggle, /min-(?:width|height)\s*:/)
})

test('project rows center both columns with a spacious responsive gap', () => {
	const project = read('app/components/partial/Project.vue')

	assert.match(project, /grid-template-columns:\s*var\(--plate-w\) var\(--text-w\);\s+align-items:\s*center;/)
	assert.match(project, /justify-content:\s*center;\s+gap:\s*var\(--project-column-gap, clamp\(4rem, 9vw, 8rem\)\);/)
	assert.equal(project.match(/justify-content:/g)?.length, 1)
	assert.match(project, /@media \(max-width:\s*\$breakpoint-mobile\)\s*\{[\s\S]*?gap:\s*var\(--project-column-gap, 1rem\);/)
})

test('project skeleton mirrors the loaded row geometry and information density', () => {
	const projectPage = read('app/pages/project.vue')

	assert.match(projectPage, /class="project-layout skeletons"/)
	assert.match(projectPage, /v-else[^>]*class="project-layout"/)
	assert.match(projectPage, /--project-column-gap:\s*clamp\(4rem, 9vw, 8rem\)/)
	assert.match(projectPage, /--project-row-margin:\s*clamp\(2rem, 6vh, 3\.5rem\)/)
	assert.match(projectPage, /class="skeleton-plate"/)
	assert.match(projectPage, /class="skeleton-body"/)
	assert.match(projectPage, /class="skeleton-logs"/)
	assert.match(projectPage, /v-for="line in 4"/)
	assert.match(projectPage, /\.skeleton-language\s*\{[\s\S]*?height:\s*4px;/)
	assert.match(projectPage, /\.skeleton\s*\{[\s\S]*?grid-template-columns:\s*var\(--project-plate-w\) var\(--project-text-w\);[\s\S]*?align-items:\s*center;[\s\S]*?justify-content:\s*center;[\s\S]*?gap:\s*var\(--project-column-gap\);[\s\S]*?margin:\s*var\(--project-row-margin\) 0;/)
	assert.match(projectPage, /&:nth-child\(even\)\s*\{[\s\S]*?grid-template-columns:\s*var\(--project-text-w\) var\(--project-plate-w\);[\s\S]*?> \.skeleton-plate\s*\{[\s\S]*?order:\s*2;/)
})

test('language segments use the local palette and normalize visible shares', async () => {
	const moduleUrl = new URL('../app/utils/languageColor.ts', import.meta.url)

	assert.ok(existsSync(moduleUrl), 'language color utility should exist')

	const { LANGUAGE_COLORS, languageColor, normalizeLanguages } = await import(moduleUrl.href)
	const segments = normalizeLanguages([
		{ name: 'TypeScript', share: 0.5 },
		{ name: 'Vue', share: 0.25 },
		{ name: 'Zero', share: 0 },
		{ name: 'Invalid', share: Number.NaN },
	])

	assert.equal(Object.keys(LANGUAGE_COLORS).length, 28)
	assert.equal(LANGUAGE_COLORS.TypeScript, '#3178c6')
	assert.equal(LANGUAGE_COLORS.Vue, '#41b883')
	assert.deepEqual(segments.map(segment => segment.name), ['TypeScript', 'Vue'])
	assert.ok(Math.abs(segments.reduce((sum, segment) => sum + segment.normalizedShare, 0) - 1) < 1e-12)
	assert.ok(Math.abs(segments[0].normalizedShare - (2 / 3)) < 1e-12)
	assert.ok(Math.abs(segments[1].normalizedPercentage - (100 / 3)) < 1e-12)
	assert.equal(segments[1].share, 0.25)
	assert.equal(languageColor('Unmapped Language'), languageColor('Unmapped Language'))
	assert.notEqual(languageColor('Unmapped Language'), languageColor('Another Language'))
})

test('project language bar renders every normalized language as a colored segment', () => {
	const project = read('app/components/partial/Project.vue')

	assert.match(project, /import \{ normalizeLanguages \} from '~\/utils\/languageColor'/)
	assert.match(project, /const languageSegments = computed\(\(\) => normalizeLanguages/)
	assert.match(project, /const topLanguage = computed\(\(\) => languageSegments\.value\[0\]\)/)
	assert.match(project, /v-for="language in languageSegments"/)
	assert.match(project, /flexGrow:\s*language\.normalizedShare/)
	assert.match(project, /backgroundColor:\s*language\.color/)
	assert.doesNotMatch(project, /class="lang-top"/)
	assert.match(project, /height:\s*4px/)
})
