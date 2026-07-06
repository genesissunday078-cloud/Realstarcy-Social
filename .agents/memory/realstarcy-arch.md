---
name: Realstarcy App Architecture
description: Key conventions, DB schema quirks, and decisions for the Realstarcy celebrity social app
---

## Brand & Identity
- Brand color: `#ff0050` (NOT Tailwind primary)
- App is a celebrity platform — NOT "real moments no filter" messaging
- Default current user is ID 1 (`maya_real`)

## DB Schema Quirks
- Loves: `loves` table (not `stars`), `user_id` (not `author_id`)
- Follows: `follower_id` / `following_id`
- Notifications: `from_user_id`, `user_id`
- `followerCount` is computed dynamically from `follows` table — NOT stored
- `loveCount` IS stored on `users` table

## Celebrity Account Convention
- User ID 1 gets a +3,000,000 follower bonus via `CELEBRITY_FOLLOWER_BONUS` in `users.ts` route
- User ID 1 `love_count` set to 10,000,000 in DB directly
- 20 bot celebrity accounts seeded (IDs 6–25)

## API Patterns
- `UpdateMeBody` Zod schema in `lib/api-zod/src/generated/api.ts` — includes `username` field (added manually, not generated)
- `CELEBRITY_LOVE_BONUS` defined in users.ts but not yet wired into API response (love_count comes from DB directly)
- Username update: slugified to lowercase `[a-z0-9_]`, max 30 chars, uniqueness checked

## Notifications Guard
- Browser `Notification` global conflicts with app type — always use `Array.isArray(notifications)` guard before `.filter()`

## Workflows
- API Server: `PORT=8080 pnpm --filter @workspace/api-server run dev`
- Frontend: `PORT=23502 BASE_PATH=/ pnpm --filter @workspace/realstarcy run dev`

## Camera Modal
- CSS filter effects applied live via `style={{ filter: ... }}` on `<video>` element
- Music tracks are UI-only (no actual audio playback) — library to be added later
- Falls back gracefully when camera is blocked (Replit iframe context)

## Privacy Settings
- "Who can see my post" stored in `localStorage` key `rs_post_visibility`
- All posts are actually public in the API — privacy is UI-only display for now
