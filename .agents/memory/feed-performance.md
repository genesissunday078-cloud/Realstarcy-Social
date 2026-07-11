---
name: Realstarcy feed performance
description: N+1 fixes, atomic increments, SQL tag aggregation, DB indexes, and optimistic post creation applied to the feed routes.
---

## Rule: Batch all per-post lookups with inArray
Any query that iterates posts and fetches related data (author, loved status) per-post is an N+1. Always batch with `inArray`.

**Why:** The original `formatPost()` ran one `usersTable` query and one `lovesTable` query per post — 40 extra queries for a 20-post feed. Fixed by `formatPosts()` batch function in `feed.ts` that does one author fetch and one loved-ids fetch for the entire slice.

**How to apply:** All feed/list call sites must call `formatPosts(slice, currentUserId)` once, never `Promise.all(slice.map(p => formatPost(...)))`.

## Rule: Atomic counter increments
All counter increments/decrements (postCount, loveCount) must use atomic SQL expressions, not read-then-write.

**Why:** Read-then-write adds a serial round-trip and has a race condition under concurrent requests. Fixed with drizzle `sql\`${col} + 1\`` and `sql\`greatest(${col} - 1, 0)\``.

**How to apply:** Any pattern that reads a count then writes count+1 must be replaced. The `posts.ts` POST, DELETE, love, and unlove handlers all now use atomic expressions.

## Rule: SQL-side aggregation for tag counts
Tag aggregation for /trending must use SQL `unnest + count + group by`, not pulling all posts into memory.

**Why:** The original fetched every post's tags array and counted in JS — O(posts) memory, gets slower as data grows.

**How to apply:** Use `unnest(${postsTable.tags})` in a raw `db.execute` SQL query with `GROUP BY tag` and `count(*)`.

## Indexes added (via drizzle-kit push)
- `posts_user_created_idx` on `(userId, createdAt)` — per-user feed queries
- `posts_love_count_idx` on `(loveCount)` — /trending ORDER BY
- `loves_post_user_idx` on `(postId, userId)` — loved-status check per feed render
- Declared in `lib/db/src/schema/posts.ts` using drizzle's `index()` in the third pgTable argument; applied with `pnpm push --force` from `lib/db/`.

## Optimistic post creation
`CreatePost.tsx` uses `onMutate` to cancel in-flight feed queries, snapshot the cache, and prepend a temporary post (negative id) via `setQueryData`. Rolls back via `onError`. `onSuccess` invalidates to replace the optimistic entry with real server data. Requires `useGetMe` to get the current user's author fields for the optimistic object.
