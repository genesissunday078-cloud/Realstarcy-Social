---
name: Realstarcy Clerk auth
description: Clerk auth integration details for Realstarcy — JIT provisioning, clerkClient singleton, DB migration quirks
---

## JIT User Provisioning
- First request from a Clerk user creates a DB row via `requireAuth` middleware in `artifacts/api-server/src/middlewares/auth.ts`
- Links Clerk user → DB user via `users.clerk_id` column (added via `ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE`)
- All routes use `req.appUserId` (integer DB ID), never the Clerk string ID

## clerkClient Usage
- Import `clerkClient` from `@clerk/express` — it is a **singleton object**, NOT a callable function
- Correct: `await clerkClient.users.getUser(clerkUserId)`
- Wrong: `const c = await clerkClient()` — `@clerk/backend` is not installed separately
- Do NOT import `createClerkClient` from `@clerk/backend` — that package is not in the workspace

## DB Migration
- `drizzle-kit push` fails non-interactively when adding a UNIQUE constraint to a non-empty table (asks to truncate)
- Workaround: run the ALTER TABLE directly via `psql "$DATABASE_URL" -c "ALTER TABLE ... ADD COLUMN IF NOT EXISTS ..."`

## Route Auth Pattern
- Health check is always public (no requireAuth)
- All other `/api/*` routes gated by `requireAuth` in `artifacts/api-server/src/routes/index.ts`
- Frontend: `<Show when="signed-in">` / `<Show when="signed-out">` from `@clerk/react` for conditional rendering

## Frontend Clerk Setup
- `publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)` — required, do not inline env var
- `clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL` — unconditional, empty in dev (intentional)
- Routes: `/sign-in/*?` and `/sign-up/*?` (the `/*?` wildcard is required for OAuth sub-paths)
- `cssLayerName: "clerk"` in appearance + `@layer theme, base, clerk, components, utilities` before `@import "tailwindcss"` in index.css
- `tailwindcss({ optimize: false })` in vite.config.ts (prevents nested @layer reordering in prod)

**Why:** Standard Clerk + Tailwind v4 setup. The optimize:false and cssLayerName must be paired or Clerk UI breaks in prod builds.
