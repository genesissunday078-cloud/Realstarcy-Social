import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, starsTable, usersTable, followsTable } from "@workspace/db";
import { eq, desc, and, lt } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

const DEFAULT_CURRENT_USER_ID = 1;

async function formatPost(post: typeof postsTable.$inferSelect, currentUserId: number) {
  const author = await db.select().from(usersTable).where(eq(usersTable.id, post.userId)).limit(1);
  const starred = await db.select().from(starsTable).where(and(eq(starsTable.postId, post.id), eq(starsTable.userId, currentUserId))).limit(1);

  return {
    id: post.id,
    userId: post.userId,
    author: author[0] ? {
      id: author[0].id,
      username: author[0].username,
      displayName: author[0].displayName,
      avatar: author[0].avatar,
    } : { id: 0, username: "unknown", displayName: "Unknown", avatar: "" },
    content: post.content,
    imageUrl: post.imageUrl ?? null,
    starCount: post.starCount,
    commentCount: post.commentCount,
    isStarred: starred.length > 0,
    tags: post.tags ?? [],
    createdAt: post.createdAt.toISOString(),
  };
}

router.get("/feed", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;
  const limit = parseInt(req.query.limit as string) || 20;
  const cursor = req.query.cursor as string | undefined;

  const posts = await (cursor
    ? db.select().from(postsTable).where(lt(postsTable.createdAt, new Date(cursor))).orderBy(desc(postsTable.createdAt)).limit(limit + 1)
    : db.select().from(postsTable).orderBy(desc(postsTable.createdAt)).limit(limit + 1));
  const hasMore = posts.length > limit;
  const slice = hasMore ? posts.slice(0, limit) : posts;

  const formatted = await Promise.all(slice.map(p => formatPost(p, currentUserId)));

  const nextCursor = hasMore ? slice[slice.length - 1]?.createdAt.toISOString() ?? null : null;

  res.json({ posts: formatted, hasMore, nextCursor });
});

router.get("/trending", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;

  const posts = await db.select().from(postsTable).orderBy(desc(postsTable.starCount)).limit(10);
  const formatted = await Promise.all(posts.map(p => formatPost(p, currentUserId)));

  const tagCounts: Record<string, number> = {};
  const allPosts = await db.select({ tags: postsTable.tags }).from(postsTable);
  for (const p of allPosts) {
    for (const tag of p.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  const tags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag, count]) => ({ tag, count }));

  res.json({ posts: formatted, tags });
});

router.get("/stats", async (req, res) => {
  const [{ totalPosts }] = await db.select({ totalPosts: sql<number>`count(*)::int` }).from(postsTable);
  const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)::int` }).from(usersTable);
  const [{ totalStars }] = await db.select({ totalStars: sql<number>`coalesce(sum(${postsTable.starCount}), 0)::int` }).from(postsTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [{ newPostsToday }] = await db.select({ newPostsToday: sql<number>`count(*)::int` }).from(postsTable).where(sql`${postsTable.createdAt} >= ${today}`);

  res.json({ totalPosts, totalUsers, totalStars, newPostsToday });
});

export { formatPost };
export default router;
