import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, lovesTable, usersTable, followsTable } from "@workspace/db";
import { eq, desc, and, lt, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function formatPost(post: typeof postsTable.$inferSelect, currentUserId?: number) {
  const [formatted] = await formatPosts([post], currentUserId);
  return formatted;
}

// Batch version — avoids the N+1 author/love lookups that formatPost-per-post causes.
// One query for all authors, one for all loved flags, regardless of feed size.
async function formatPosts(posts: (typeof postsTable.$inferSelect)[], currentUserId?: number) {
  if (posts.length === 0) return [];

  const authorIds = Array.from(new Set(posts.map(p => p.userId)));
  const authors = await db.select().from(usersTable).where(inArray(usersTable.id, authorIds));
  const authorById = new Map(authors.map(a => [a.id, a]));

  let lovedPostIds = new Set<number>();
  if (currentUserId !== undefined) {
    const postIds = posts.map(p => p.id);
    const loves = await db.select({ postId: lovesTable.postId }).from(lovesTable)
      .where(and(inArray(lovesTable.postId, postIds), eq(lovesTable.userId, currentUserId)));
    lovedPostIds = new Set(loves.map(l => l.postId));
  }

  return posts.map(post => {
    const author = authorById.get(post.userId);
    return {
      id: post.id,
      userId: post.userId,
      author: author ? {
        id: author.id,
        username: author.username,
        displayName: author.displayName,
        avatar: author.avatar,
      } : { id: 0, username: "unknown", displayName: "Unknown", avatar: "" },
      content: post.content,
      imageUrl: post.imageUrl ?? null,
      videoUrl: post.videoUrl ?? null,
      loveCount: post.loveCount,
      commentCount: post.commentCount,
      isLoved: lovedPostIds.has(post.id),
      tags: post.tags ?? [],
      createdAt: post.createdAt.toISOString(),
    };
  });
}

router.get("/feed", async (req, res) => {
  const currentUserId = req.appUserId;
  const limit = parseInt(req.query.limit as string) || 20;
  const cursor = req.query.cursor as string | undefined;

  const posts = await (cursor
    ? db.select().from(postsTable).where(lt(postsTable.createdAt, new Date(cursor))).orderBy(desc(postsTable.createdAt)).limit(limit + 1)
    : db.select().from(postsTable).orderBy(desc(postsTable.createdAt)).limit(limit + 1));
  const hasMore = posts.length > limit;
  const slice = hasMore ? posts.slice(0, limit) : posts;

  const formatted = await formatPosts(slice, currentUserId);

  const nextCursor = hasMore ? slice[slice.length - 1]?.createdAt.toISOString() ?? null : null;

  res.json({ posts: formatted, hasMore, nextCursor });
});

router.get("/trending", async (req, res) => {
  const currentUserId = req.appUserId;

  const posts = await db.select().from(postsTable).orderBy(desc(postsTable.loveCount)).limit(10);
  const formatted = await formatPosts(posts, currentUserId);

  // Aggregate tag counts in the DB via unnest instead of pulling every post's
  // tags array into memory — scales with distinct tags, not total posts.
  const tagRows = await db.execute<{ tag: string; count: number }>(sql`
    select tag, count(*)::int as count
    from ${postsTable}, unnest(${postsTable.tags}) as tag
    group by tag
    order by count desc
    limit 15
  `);

  const tags = tagRows.rows.map(r => ({ tag: r.tag, count: r.count }));

  res.json({ posts: formatted, tags });
});

router.get("/stats", async (req, res) => {
  const [{ totalPosts }] = await db.select({ totalPosts: sql<number>`count(*)::int` }).from(postsTable);
  const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)::int` }).from(usersTable);
  const [{ totalLoves }] = await db.select({ totalLoves: sql<number>`coalesce(sum(${postsTable.loveCount}), 0)::int` }).from(postsTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [{ newPostsToday }] = await db.select({ newPostsToday: sql<number>`count(*)::int` }).from(postsTable).where(sql`${postsTable.createdAt} >= ${today}`);

  res.json({ totalPosts, totalUsers, totalLoves, newPostsToday });
});

router.get("/feed/following", requireAuth, async (req, res) => {
  const currentUserId = req.appUserId!;
  const limit = parseInt(req.query.limit as string) || 20;
  const cursor = req.query.cursor as string | undefined;

  const following = await db
    .select({ followingId: followsTable.followingId })
    .from(followsTable)
    .where(eq(followsTable.followerId, currentUserId));

  const followingIds = following.map(f => f.followingId);

  if (followingIds.length === 0) {
    res.json({ posts: [], hasMore: false, nextCursor: null });
    return;
  }

  const posts = await (cursor
    ? db.select().from(postsTable)
        .where(and(inArray(postsTable.userId, followingIds), lt(postsTable.createdAt, new Date(cursor))))
        .orderBy(desc(postsTable.createdAt))
        .limit(limit + 1)
    : db.select().from(postsTable)
        .where(inArray(postsTable.userId, followingIds))
        .orderBy(desc(postsTable.createdAt))
        .limit(limit + 1));

  const hasMore = posts.length > limit;
  const slice = hasMore ? posts.slice(0, limit) : posts;
  const formatted = await formatPosts(slice, currentUserId);
  const nextCursor = hasMore ? slice[slice.length - 1]?.createdAt.toISOString() ?? null : null;

  res.json({ posts: formatted, hasMore, nextCursor });
});

export { formatPost, formatPosts };
export default router;
