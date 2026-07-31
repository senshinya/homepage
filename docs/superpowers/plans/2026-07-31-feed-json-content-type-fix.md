# Feed JSON Content-Type Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the prerendered `/api/feed/blog` endpoint is served as JSON so the legacy 404 page can populate its recent-article list.

**Architecture:** Keep the feed payload and client code unchanged. Add deployment metadata at the shared route-rule boundary so Nitro's Vercel output declares the correct content type for the extensionless prerendered file.

**Tech Stack:** Nuxt 4, Nitro route rules, Vercel Build Output API, Node.js test runner

---

### Task 1: Add the regression test

**Files:**
- Modify: `tests/refine.test.mjs`

- [x] **Step 1: Write the failing test**

Add this test near the existing status and error-page tests:

```js
test('prerendered blog feed is served as JSON', () => {
	const config = read('homepage.config.ts')

	assert.match(config, /'\/api\/feed\/blog':\s*\{\s*headers:\s*\{\s*'Content-Type':\s*'application\/json; charset=utf-8'/)
})
```

- [x] **Step 2: Run the test to verify RED**

Run:

```sh
node --test --test-name-pattern='prerendered blog feed is served as JSON' tests/refine.test.mjs
```

Expected: FAIL because `homepage.config.ts` has no `/api/feed/blog` route rule.

### Task 2: Declare the JSON response type

**Files:**
- Modify: `homepage.config.ts`

- [x] **Step 1: Add the minimal route rule**

Add this exact entry to the exported `routeRules` object:

```ts
'/api/feed/blog': { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
```

- [x] **Step 2: Run the focused test to verify GREEN**

Run:

```sh
node --test --test-name-pattern='prerendered blog feed is served as JSON' tests/refine.test.mjs
```

Expected: PASS.

- [x] **Step 3: Run the full test suite**

Run:

```sh
node --test tests/refine.test.mjs
pnpm lint
```

Expected: all Node tests pass and ESLint exits with no errors.

### Task 3: Verify the deployment artifact and ship

**Files:**
- Verify generated: `.vercel/output/config.json`
- Commit: `homepage.config.ts`, `tests/refine.test.mjs`, and this plan

- [x] **Step 1: Build with the production deployment preset**

Run:

```sh
NITRO_PRESET=vercel pnpm build
```

Expected: exit code 0 and a generated `.vercel/output/config.json`.

- [x] **Step 2: Inspect generated response metadata**

Run:

```sh
node -e "const c=require('./.vercel/output/config.json'); const route=c.routes.find(r=>r.src==='/api/feed/blog'); if(route?.headers?.['Content-Type']!=='application/json; charset=utf-8') process.exit(1); console.log(route)"
```

Expected: prints the `/api/feed/blog` route with `Content-Type: application/json; charset=utf-8` and exits 0.

- [x] **Step 3: Review the complete diff**

Run:

```sh
git diff --check
git diff HEAD
```

Expected: no whitespace errors; only the approved feed metadata, regression test, and plan are present.

- [ ] **Step 4: Commit the implementation**

```sh
git add homepage.config.ts tests/refine.test.mjs docs/superpowers/plans/2026-07-31-feed-json-content-type-fix.md
git commit -m "fix: serve prerendered blog feed as JSON"
```

- [ ] **Step 5: Push the current branch**

```sh
git push origin senshinya/ux-copy-audit-homepage
```

Expected: the remote branch advances to the implementation commit.
