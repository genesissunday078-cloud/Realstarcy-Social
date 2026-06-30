# Realstarcy

A social media platform built on authenticity — share real moments, star what resonates, and connect without follower counts or algorithmic pressure.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/realstarcy run dev` — run the frontend (port 23502)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Shadcn/Radix UI, wouter

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle schema (users, posts, comments, notifications, follows, stars)
- `artifacts/api-server/src/routes/` — Express route handlers (feed, posts, comments, users, notifications)
- `artifacts/realstarcy/src/` — React frontend (App.tsx, pages/, components/)
- `artifacts/realstarcy/src/index.css` — Theme (dark midnight + golden primary)

## Architecture decisions

- **No follower counts displayed** — intentional product decision to reduce social anxiety
- **Stars instead of likes** — terminology enforced throughout UI and API
- **Default current user is user ID 1** — no auth system yet; all routes assume `maya_real`
- **OpenAPI-first** — all API contracts defined in `openapi.yaml`, hooks and Zod schemas generated via Orval
- **Feed is chronological** — no algorithm, posts sorted by `createdAt DESC`

## Product

- Discovery feed of real moments from the community
- Trending page with top-starred posts and popular tags
- Create posts with optional image URL and tags (max 5)
- Post detail with comments
- User profiles (post count + stars received, no follower count)
- Follow/unfollow users
- Notifications (star, comment, follow, mention)
- Profile settings (display name, bio, avatar)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after every OpenAPI spec change
- After codegen, always run `pnpm run typecheck:libs` before checking artifact typechecks
- The `DEFAULT_CURRENT_USER_ID = 1` in all route files — add auth later to replace this
- Google Fonts `@import url(...)` must be the FIRST line in `index.css` (before Tailwind imports)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
