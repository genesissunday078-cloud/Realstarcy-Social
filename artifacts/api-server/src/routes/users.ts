import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, followsTable, notificationsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { UpdateMeBody } from "@workspace/api-zod";

const router = Router();

const CELEBRITY_FOLLOWER_BONUS: Record<number, number> = { 1: 3000000 };
const CELEBRITY_LOVE_BONUS: Record<number, number> = { 1: 10000000 };

async function getFollowCounts(userId: number) {
  const [followerRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(followsTable)
    .where(eq(followsTable.followingId, userId));
  const [followingRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(followsTable)
    .where(eq(followsTable.followerId, userId));
  return {
    followerCount: (followerRow?.count ?? 0) + (CELEBRITY_FOLLOWER_BONUS[userId] ?? 0),
    followingCount: followingRow?.count ?? 0,
  };
}

router.get("/users/me", async (req, res) => {
  const currentUserId = req.appUserId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, currentUserId)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }

  const { followerCount, followingCount } = await getFollowCounts(user.id);

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
    postCount: user.postCount,
    loveCount: user.loveCount,
    followerCount,
    followingCount,
    isFollowing: false,
    createdAt: user.createdAt.toISOString(),
  });
});

router.put("/users/me", async (req, res) => {
  const currentUserId = req.appUserId;
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.avatar !== undefined) updates.avatar = parsed.data.avatar;
  if (parsed.data.username !== undefined) {
    const slug = parsed.data.username.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 30);
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, slug)).limit(1);
    if (existing && existing.id !== currentUserId) {
      res.status(409).json({ error: "Username taken" }); return;
    }
    updates.username = slug;
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, currentUserId)).returning();
  const { followerCount, followingCount } = await getFollowCounts(updated.id);

  res.json({
    id: updated.id,
    username: updated.username,
    displayName: updated.displayName,
    avatar: updated.avatar,
    bio: updated.bio,
    postCount: updated.postCount,
    loveCount: updated.loveCount,
    followerCount,
    followingCount,
    isFollowing: false,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.get("/users/:username", async (req, res) => {
  const currentUserId = req.appUserId;
  const { username } = req.params;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }

  const follow = await db.select().from(followsTable)
    .where(and(eq(followsTable.followerId, currentUserId), eq(followsTable.followingId, user.id)))
    .limit(1);

  const { followerCount, followingCount } = await getFollowCounts(user.id);

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
    postCount: user.postCount,
    loveCount: user.loveCount,
    followerCount,
    followingCount,
    isFollowing: follow.length > 0,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/users/:username/follow", async (req, res) => {
  const currentUserId = req.appUserId;
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
  const currentUserId = req.appUserId;
  const { username } = req.params;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(followsTable)
    .where(and(eq(followsTable.followerId, currentUserId), eq(followsTable.followingId, user.id)));

  res.json({ isFollowing: false });
});

export default router;
