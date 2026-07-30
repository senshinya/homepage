# Theme Toggle and Project Spacing Refine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the compact theme-toggle height and give desktop project rows a responsive 2–4rem column gap with vertically centered image and content columns.

**Architecture:** Keep the existing Vue component structure and modify only the scoped SCSS declarations that caused the visual regressions. Add a Node built-in source-contract test to pin the exact desktop and mobile layout values without introducing a browser-test dependency.

**Tech Stack:** Nuxt 4, Vue 3 SFCs, scoped SCSS, Node.js built-in test runner, pnpm, ESLint, Stylelint.

---

### Task 1: Add regression coverage

**Files:**
- Modify: `tests/refine.test.mjs`

- [ ] **Step 1: Write the failing source-contract test**

Append this test to `tests/refine.test.mjs`:

```js
test('theme toggle stays compact', () => {
	const themeToggle = read('app/components/partial/ThemeToggle.vue')

	assert.doesNotMatch(themeToggle, /min-(?:width|height):\s*40px/)
})

test('project columns use the approved alignment and responsive gap', () => {
	const project = read('app/components/partial/Project.vue')

	assert.match(project, /grid-template-columns:\s*var\(--plate-w\) var\(--text-w\);\s+align-items:\s*center;/)
	assert.match(project, /justify-content:\s*start;\s+gap:\s*clamp\(2rem, 5vw, 4rem\);/)
	assert.match(project, /@media \(max-width:\s*\$breakpoint-mobile\)\s*\{[\s\S]*?gap:\s*1rem;/)
})
```

- [ ] **Step 2: Run the focused test file and verify RED**

Run:

```bash
node --test tests/refine.test.mjs
```

Expected: both new tests fail: `ThemeToggle.vue` still contains the 40px minimum dimensions, while `Project.vue` still uses top alignment with the old gap.

### Task 2: Apply the minimal style changes

**Files:**
- Modify: `app/components/partial/ThemeToggle.vue:35-38`
- Modify: `app/components/partial/Project.vue:125-132`
- Test: `tests/refine.test.mjs`

- [ ] **Step 1: Restore intrinsic sizing on the theme buttons**

Change the nested button rule to remove only its minimum dimensions:

```scss
> button {
	padding: 4px 1rem;
	border-radius: 1rem;
```

Keep all existing semantic attributes, interaction states, transitions, colors, borders, icons, and click behavior unchanged.

- [ ] **Step 2: Center the desktop project columns and widen their responsive gap**

Change only the base `.project` alignment and gap declarations:

```scss
display: grid;
grid-template-columns: var(--plate-w) var(--text-w);
align-items: center;

// existing explanatory comment remains here
justify-content: start;
gap: clamp(2rem, 5vw, 4rem);
```

Leave the mobile rule unchanged:

```scss
@media (max-width: $breakpoint-mobile) {
	grid-template-columns: minmax(0, 1fr);
	gap: 1rem;
```

- [ ] **Step 3: Run the focused test file and verify GREEN**

Run:

```bash
node --test tests/refine.test.mjs
```

Expected: all tests pass.

### Task 3: Verify and hand off the live result

**Files:**
- Verify: `tests/refine.test.mjs`
- Verify: `app/components/partial/ThemeToggle.vue`
- Verify: `app/components/partial/Project.vue`

- [ ] **Step 1: Run lint checks on the touched files**

Run:

```bash
pnpm exec eslint tests/refine.test.mjs app/components/partial/ThemeToggle.vue app/components/partial/Project.vue
pnpm exec stylelint app/components/partial/ThemeToggle.vue app/components/partial/Project.vue
```

Expected: both commands exit with status 0.

- [ ] **Step 2: Run the full project verification**

Run:

```bash
node --test tests/refine.test.mjs
pnpm build
```

Expected: all source-contract tests pass and Nuxt completes the production build successfully.

- [ ] **Step 3: Confirm the existing LAN development server still serves the page**

Run:

```bash
curl --fail --silent --show-error --output /dev/null http://127.0.0.1:3000/
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Expected: `curl` exits with status 0 and the listener is bound to `*:3000` or `0.0.0.0:3000`, not only `127.0.0.1`.

- [ ] **Step 4: Review the exact diff and preserve unrelated work**

Run:

```bash
git diff --check
git diff -- tests/refine.test.mjs app/components/partial/ThemeToggle.vue app/components/partial/Project.vue
git status --short
```

Expected: the intended diff contains one regression test, removal of two theme-button declarations, and two project-layout value changes. Existing unrelated user modifications remain untouched.

- [ ] **Step 5: Ask for visual confirmation**

Keep the LAN development server running and ask the user to refresh `http://192.168.7.131:3000/`, checking both desktop width and a 375px mobile viewport. The current environment has no available browser runtime, so the user's live visual check is the final authority for perceived spacing and alignment.
