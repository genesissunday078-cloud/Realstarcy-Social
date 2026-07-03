import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, lovesTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, desc, and, lt } from "drizzle-orm";
import { CreatePostBody, ListPostsQueryParams } from "@workspace/api-zod";
import { formatPost } from "./feed";

const router = Router();

const DEFAULT_CURRENT_USER_ID = 1;

router.get("/posts", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;
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
  const formatted = await Promise.all(slice.map(p => formatPost(p, currentUserId)));
  const nextCursor = hasMore ? slice[slice.length - 1]?.createdAt.toISOString() ?? null : null;

  res.json({ posts: formatted, hasMore, nextCursor });
});

router.post("/posts", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { content, imageUrl, videoUrl, tags } = parsed.data;

  const [post] = await db.insert(postsTable).values({
    userId: currentUserId,
    content,
    imageUrl: imageUrl ?? null,
    videoUrl: videoUrl ?? null,
    tags: tags ?? [],
  }).returning();

  await db.update(usersTable)
    .set({ postCount: (await db.select().from(usersTable).where(eq(usersTable.id, currentUserId)).limit(1))[0].postCount + 1 })
    .where(eq(usersTable.id, currentUserId));

  const formatted = await formatPost(post, currentUserId);
  res.status(201).json(formatted);
});

router.get("/posts/:id", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: "Not found" }); return; }

  const formatted = await formatPost(post, currentUserId);
  res.json(formatted);
});

router.delete("/posts/:id", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(lovesTable).where(eq(lovesTable.postId, id));
  await db.delete(postsTable).where(and(eq(postsTable.id, id), eq(postsTable.userId, currentUserId)));

  const user = await db.select().from(usersTable).where(eq(usersTable.id, currentUserId)).limit(1);
  if (user[0] && user[0].postCount > 0) {
    await db.update(usersTable).set({ postCount: user[0].postCount - 1 }).where(eq(usersTable.id, currentUserId));
  }

  res.status(204).send();
});

router.post("/posts/:id/love", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: "Not found" }); return; }

  const existing = await db.select().from(lovesTable)
    .where(and(eq(lovesTable.postId, id), eq(lovesTable.userId, currentUserId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(lovesTable).values({ userId: currentUserId, postId: id });
    const newCount = post.loveCount + 1;
    await db.update(postsTable).set({ loveCount: newCount }).where(eq(postsTable.id, id));
    await db.update(usersTable)
      .set({ loveCount: (await db.select().from(usersTable).where(eq(usersTable.id, post.userId)).limit(1))[0].loveCount + 1 })
      .where(eq(usersTable.id, post.userId));

    if (post.userId !== currentUserId) {
      await db.insert(notificationsTable).values({
        userId: post.userId,
        type: "love",
        fromUserId: currentUserId,
        postId: id,
      });
    }

    res.json({ loveCount: newCount, isLoved: true });
  } else {
    res.json({ loveCount: post.loveCount, isLoved: true });
  }
});

router.delete("/posts/:id/love", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: "Not found" }); return; }

  const existing = await db.select().from(lovesTable)
    .where(and(eq(lovesTable.postId, id), eq(lovesTable.userId, currentUserId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(lovesTable).where(and(eq(lovesTable.postId, id), eq(lovesTable.userId, currentUserId)));
    const newCount = Math.max(0, post.loveCount - 1);
    await db.update(postsTable).set({ loveCount: newCount }).where(eq(postsTable.id, id));

    const author = await db.select().from(usersTable).where(eq(usersTable.id, post.userId)).limit(1);
    if (author[0] && author[0].loveCount > 0) {
      await db.update(usersTable).set({ loveCount: author[0].loveCount - 1 }).where(eq(usersTable.id, post.userId));
    }

    res.json({ loveCount: newCount, isLoved: false });
  } else {
    res.json({ loveCount: post.loveCount, isLoved: false });
  }
});

export default router;
