import { Router } from "express";
import { db } from "@workspace/db";
import { commentsTable, postsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { CreateCommentBody } from "@workspace/api-zod";

const router = Router();

const DEFAULT_CURRENT_USER_ID = 1;

router.get("/posts/:id/comments", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const comments = await db.select().from(commentsTable)
    .where(eq(commentsTable.postId, id))
    .orderBy(asc(commentsTable.createdAt));

  const formatted = await Promise.all(comments.map(async (c) => {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, c.userId)).limit(1);
    return {
      id: c.id,
      postId: c.postId,
      author: author ? {
        id: author.id,
        username: author.username,
        displayName: author.displayName,
        avatar: author.avatar,
      } : { id: 0, username: "unknown", displayName: "Unknown", avatar: "" },
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    };
  }));

  res.json(formatted);
});

router.post("/posts/:id/comments", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: "Not found" }); return; }

  const [comment] = await db.insert(commentsTable).values({
    postId: id,
    userId: currentUserId,
    content: parsed.data.content,
  }).returning();

  await db.update(postsTable)
    .set({ commentCount: post.commentCount + 1 })
    .where(eq(postsTable.id, id));

  if (post.userId !== currentUserId) {
    await db.insert(notificationsTable).values({
      userId: post.userId,
      type: "comment",
      fromUserId: currentUserId,
      postId: id,
    });
  }

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, currentUserId)).limit(1);

  res.status(201).json({
    id: comment.id,
    postId: comment.postId,
    author: author ? {
      id: author.id,
      username: author.username,
      displayName: author.displayName,
      avatar: author.avatar,
    } : { id: 0, username: "unknown", displayName: "Unknown", avatar: "" },
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  });
});

router.delete("/posts/:id/comments/:commentId", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;
  const id = parseInt(req.params.id);
  const commentId = parseInt(req.params.commentId);
  if (isNaN(id) || isNaN(commentId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (post && post.commentCount > 0) {
    await db.update(postsTable).set({ commentCount: post.commentCount - 1 }).where(eq(postsTable.id, id));
  }

  await db.delete(commentsTable).where(and(eq(commentsTable.id, commentId), eq(commentsTable.userId, currentUserId)));

  res.status(204).send();
});

export default router;
