import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable, usersTable, postsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/notifications", async (req, res) => {
  const currentUserId = req.appUserId;

  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, currentUserId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  const formatted = await Promise.all(notifications.map(async (n) => {
    const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, n.fromUserId)).limit(1);
    let postContent: string | null = null;
    if (n.postId) {
      const [post] = await db.select().from(postsTable).where(eq(postsTable.id, n.postId)).limit(1);
      postContent = post?.content ?? null;
    }

    return {
      id: n.id,
      type: n.type,
      fromUser: fromUser ? {
        id: fromUser.id,
        username: fromUser.username,
        displayName: fromUser.displayName,
        avatar: fromUser.avatar,
      } : { id: 0, username: "unknown", displayName: "Unknown", avatar: "" },
      postId: n.postId ?? null,
      postContent,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    };
  }));

  res.json(formatted);
});

router.put("/notifications/read", async (req, res) => {
  const currentUserId = req.appUserId;

  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, currentUserId));

  res.json({ success: true });
});

export default router;
