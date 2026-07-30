# 404 Stage Mark Position Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the large `404` backdrop at a stable stage-relative position while the legacy-page content animates and changes height.

**Architecture:** Preserve the existing Grid layout for the error-page content, but remove `.stage-mark` from that Grid track's sizing. Make `.stage` the containing block and position the horizontally centered decorative mark against its stable top edge; no JavaScript state or viewport-fixed positioning is introduced.

**Tech Stack:** Nuxt 4, Vue 3, scoped SCSS, Node.js built-in test runner

---

### Task 1: Decouple the 404 backdrop from animated content sizing

**Files:**
- Modify: `tests/refine.test.mjs`
- Modify: `app/error.vue`

- [ ] **Step 1: Write the failing regression test**

Add this test to `tests/refine.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the test and verify the old layout fails**

Run: `node --test tests/refine.test.mjs`

Expected: the new test fails because `.stage` has no `position: relative` and `.stage-mark` still uses `place-self` inside the shared Grid track.

- [ ] **Step 3: Apply the minimal SCSS fix**

In `app/error.vue`, keep the content in the existing Grid area while excluding the decorative mark:

```scss
.stage {
	display: grid;
	grid-template-areas: "stack";
	grid-template-columns: minmax(0, 1fr);
	align-content: center;
	position: relative;
	min-height: calc(100dvh - 5rem);
	max-width: 42rem;
	margin-inline: auto;

	> :not(.stage-mark) {
		grid-area: stack;
	}
}
```

Anchor `.stage-mark` to the stage rather than the animated Grid row:

```scss
.stage-mark {
	position: absolute;
	inset-block-start: 0;
	inset-inline-start: 50%;
	font-size: clamp(12rem, 40vw, 30rem);
	font-weight: 800;
	letter-spacing: -0.05em;
	line-height: 0.75;
	color: transparent;
	-webkit-text-stroke: 0.012em color-mix(in srgb, var(--c-bg-soft) 50%, transparent);
	transform: translateX(-50%);
	pointer-events: none;
	user-select: none;
	z-index: -1;
}
```

- [ ] **Step 4: Run automated verification**

Run:

```sh
node --test tests/refine.test.mjs
pnpm exec eslint app/error.vue tests/refine.test.mjs
pnpm exec stylelint app/error.vue
git diff --check
pnpm build
```

Expected: all tests pass, lint commands exit 0, the diff check is clean, and Nuxt reports `Build complete!` with no link-check failures.

- [ ] **Step 5: Verify the local preview**

Run the dev server with `pnpm exec nuxt dev --host 0.0.0.0 --port 3000`, then inspect an old article path at desktop width and 375px width. The `404` backdrop must remain still while the card and recent-post list animate; scrolling must still move it with the page.
