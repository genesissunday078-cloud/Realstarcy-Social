import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, lovesTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, desc, and, lt, sql } from "drizzle-orm";
import { CreatePostBody, ListPostsQueryParams } from "@workspace/api-zod";
import { formatPost, formatPosts } from "./feed";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/posts", async (req, res) => {
  const currentUserId = req.appUserId;
  const parsed = ListPostsQueryParams.safeParse(req.query);
  const userId = parsed.success ? parsed.data.userId ?? undefined : undefined;
  const tag = parsed.success ? parsed.data.tag ?? undefined : undefined;
  const cursor = parsed.success ? parsed.data.cursor ?? undefined : undefined;
  const limit = 20;

  let rows;
  if (userId) {
    rows = await db.select().from(postsTable)
      .where(eq(postsTable.userId, userId))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit + 1);
  } else {
    rows = await db.select().from(postsTable)
      .orderBy(desc(postsTable.createdAt))
      .limit(limit + 1);
  }

  if (tag) {
    rows = rows.filter(p => p.tags?.includes(tag));
  }

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const formatted = await formatPosts(slice, currentUserId);
  const nextCursor = hasMore ? slice[slice.length - 1]?.createdAt.toISOString() ?? null : null;

  res.json({ posts: formatted, hasMore, nextCursor });
});

router.post("/posts", requireAuth, async (req, res) => {
  const currentUserId = req.appUserId!;
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { content, imageUrl, videoUrl, tags } = parsed.data;

  // Insert the post and bump postCount atomically/in parallel — the previous
  // read-then-write on postCount serialized every post creation behind an
  // extra round trip and was a race under concurrent posts.
  const [[post]] = await Promise.all([
    db.insert(postsTable).values({
      userId: currentUserId,
      content,
      imageUrl: imageUrl ?? null,
      videoUrl: videoUrl ?? null,
      tags: tags ?? [],
    }).returning(),
    db.update(usersTable)
      .set({ postCount: sql`${usersTable.postCount} + 1` })
      .where(eq(usersTable.id, currentUserId)),
  ]);

  const formatted = await formatPost(post, currentUserId);
  res.status(201).json(formatted);
});

router.get("/posts/:id", async (req, res) => {
  const currentUserId = req.appUserId;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: "Not found" }); return; }

  const formatted = await formatPost(post, currentUserId);
  res.json(formatted);
});

router.delete("/posts/:id", requireAuth, async (req, res) => {
  const currentUserId = req.appUserId!;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await Promise.all([
    db.delete(lovesTable).where(eq(lovesTable.postId, id)),
    db.delete(postsTable).where(and(eq(postsTable.id, id), eq(postsTable.userId, currentUserId))),
    db.update(usersTable)
      .set({ postCount: sql`greatest(${usersTable.postCount} - 1, 0)` })
      .where(eq(usersTable.id, currentUserId)),
  ]);

  res.status(204).send();
});

router.post("/posts/:id/love", requireAuth, async (req, res) => {
  const currentUserId = req.appUserId!;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: "Not found" }); return; }

  const existing = await db.select().from(lovesTable)
    .where(and(eq(lovesTable.postId, id), eq(lovesTable.userId, currentUserId)))
    .limit(1);

  if (existing.length === 0) {
    const newCount = post.loveCount + 1;
    await Promise.all([
      db.insert(lovesTable).values({ userId: currentUserId, postId: id }),
      db.update(postsTable).set({ loveCount: sql`${postsTable.loveCount} + 1` }).where(eq(postsTable.id, id)),
      db.update(usersTable).set({ loveCount: sql`${usersTable.loveCount} + 1` }).where(eq(usersTable.id, post.userId)),
      post.userId !== currentUserId
        ? db.insert(notificationsTable).values({
            userId: post.userId,
            type: "love",
            fromUserId: currentUserId,
            postId: id,
          })
        : Promise.resolve(),
    ]);

    res.json({ loveCount: newCount, isLoved: true });
  } else {
    res.json({ loveCount: post.loveCount, isLoved: true });
  }
});

router.delete("/posts/:id/love", requireAuth, async (req, res) => {
  const currentUserId = req.appUserId!;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: "Not found" }); return; }

  const existing = await db.select().from(lovesTable)
    .where(and(eq(lovesTable.postId, id), eq(lovesTable.userId, currentUserId)))
    .limit(1);

  if (existing.length > 0) {
    const newCount = Math.max(0, post.loveCount - 1);
    await Promise.all([
      db.delete(lovesTable).where(and(eq(lovesTable.postId, id), eq(lovesTable.userId, currentUserId))),
      db.update(postsTable)
        .set({ loveCount: sql`greatest(${postsTable.loveCount} - 1, 0)` })
        .where(eq(postsTable.id, id)),
      db.update(usersTable)
        .set({ loveCount: sql`greatest(${usersTable.loveCount} - 1, 0)` })
        .where(eq(usersTable.id, post.userId)),
    ]);

    res.json({ loveCount: newCount, isLoved: false });
  } else {
    res.json({ loveCount: post.loveCount, isLoved: false });
  }
});

export default router;
