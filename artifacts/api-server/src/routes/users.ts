import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, followsTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { UpdateMeBody } from "@workspace/api-zod";

const router = Router();

const DEFAULT_CURRENT_USER_ID = 1;

router.get("/users/me", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, currentUserId)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
    postCount: user.postCount,
    starCount: user.starCount,
    isFollowing: false,
    createdAt: user.createdAt.toISOString(),
  });
});

router.put("/users/me", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.avatar !== undefined) updates.avatar = parsed.data.avatar;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, currentUserId)).returning();

  res.json({
    id: updated.id,
    username: updated.username,
    displayName: updated.displayName,
    avatar: updated.avatar,
    bio: updated.bio,
    postCount: updated.postCount,
    starCount: updated.starCount,
    isFollowing: false,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.get("/users/:username", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;
  const { username } = req.params;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }

  const follow = await db.select().from(followsTable)
    .where(and(eq(followsTable.followerId, currentUserId), eq(followsTable.followingId, user.id)))
    .limit(1);

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
    postCount: user.postCount,
    starCount: user.starCount,
    isFollowing: follow.length > 0,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/users/:username/follow", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;
  const { username } = req.params;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }

  const existing = await db.select().from(followsTable)
    .where(and(eq(followsTable.followerId, currentUserId), eq(followsTable.followingId, user.id)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(followsTable).values({ followerId: currentUserId, followingId: user.id });
    if (user.id !== currentUserId) {
      await db.insert(notificationsTable).values({
        userId: user.id,
        type: "follow",
        fromUserId: currentUserId,
      });
    }
  }

  res.json({ isFollowing: true });
});

router.delete("/users/:username/follow", async (req, res) => {
  const currentUserId = DEFAULT_CURRENT_USER_ID;
  const { username } = req.params;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(followsTable)
    .where(and(eq(followsTable.followerId, currentUserId), eq(followsTable.followingId, user.id)));

  res.json({ isFollowing: false });
});

export default router;
