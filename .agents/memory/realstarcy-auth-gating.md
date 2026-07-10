---
name: Realstarcy public-browsing auth model
description: How Realstarcy separates public browsing from gated interactions, and why guest-safe queries matter.
---

Realstarcy uses TikTok-style access: anyone can browse (feed, trending, post detail, profiles, search) with no account; signing in is only required for interactive/personal actions (love, follow, comment, post, notifications, settings, "Me", following-feed).

**Why:** the previous full-app auth gate (redirect all signed-out traffic to /sign-in except the bare landing page) blocked guests from seeing content at all, causing second-browser/second-device sessions to appear "blank" — this looked like a data-sync bug but was actually a routing/access-control issue. It was also a deviation from Clerk's own canonical guidance that the home route must stay publicly viewable.

**How to apply:**
- Backend (`artifacts/api-server`): `middlewares/auth.ts` exports `optionalAuth` (resolves `req.appUserId` if a Clerk session exists, always calls `next()`) mounted globally in `routes/index.ts`, plus `requireAuth` (401s if `req.appUserId` unset) applied per-route only on writes/personal endpoints. `req.appUserId` is `number | undefined`.
- Frontend (`artifacts/realstarcy`): any component rendered on a public route that calls `useGetMe`/`useGetNotifications`/`useGetFollowingFeed` (or similar personal endpoints) MUST gate the query with `{ query: { enabled: !!isSignedIn } }` (from `useUser()` in `@clerk/react`) — otherwise guests get a 401 error on page load. Any click handler that fires a mutation (love, follow, comment, post) must wrap the action in `useAuthGuard()`'s `guard(fn)` (in `src/hooks/useAuthGuard.ts`), which redirects guests to `/sign-in` instead of letting the mutation 401 silently.
- When adding a new interactive control (button/form) to a public page, always check whether it needs `guard()` — it's easy to miss one (a code review caught a missed Follow button and a missed comment-submit handler on the first pass).
