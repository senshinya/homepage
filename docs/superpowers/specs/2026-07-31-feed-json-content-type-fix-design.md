# Feed JSON Content-Type Fix

## Problem

`/api/feed/blog` is prerendered as an extensionless file for Vercel. The deployed response is served as `application/octet-stream`, so `ofetch` returns a `Blob` instead of parsing the JSON body. The legacy 404 page consequently treats `feed.posts` as missing and hides its recent-article list.

## Design

Add an exact route rule for `/api/feed/blog` that sets `Content-Type` to `application/json; charset=utf-8`. This fixes the response contract at the deployment boundary without changing the 404 component, feed payload, or article rendering logic.

The route rule remains alongside the existing shared route rules in `homepage.config.ts`, which is already consumed by `nuxt.config.ts`. No client-side forced parsing fallback will be added because a correctly typed JSON endpoint is sufficient and keeps all consumers consistent.

## Verification

Add a regression assertion to the existing Node test suite that requires the exact feed route to declare a JSON content type. Confirm the test fails before the route rule is added and passes afterward.

Then run the full project checks and a Vercel-preset production build. Inspect `.vercel/output/config.json` to confirm the generated deployment route applies the JSON content type to `/api/feed/blog`.

## Scope

- Change the feed route response metadata only.
- Add one focused regression test.
- Do not change page layout, feed data, client fetch behavior, or unrelated routes.
