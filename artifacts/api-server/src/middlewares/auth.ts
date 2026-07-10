import { getAuth, clerkClient } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Augment Express Request so route handlers can access req.appUserId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      appUserId?: number;
    }
  }
}

// Resolves the signed-in Clerk user to a local DB user id, JIT-provisioning
// a new row the first time this Clerk user is seen. Returns undefined when
// there is no signed-in session.
async function resolveAppUserId(req: Request): Promise<number | undefined> {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) return undefined;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId))
    .limit(1);

  if (existing) return existing.id;

  // JIT provision: create a DB user the first time this Clerk user signs in.
  // clerkClient from @clerk/express is a pre-initialized singleton object.
  const clerkUser = await clerkClient.users.getUser(clerkUserId);

  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ||
    "User";

  const rawUsername = (
    clerkUser.username ||
    clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ||
    `user_${clerkUserId.slice(-8)}`
  )
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 28);

  // Ensure username is unique
  let username = rawUsername;
  let suffix = 1;
  for (;;) {
    const [taken] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    if (!taken) break;
    username = `${rawUsername}${suffix++}`;
  }

  const avatar =
    clerkUser.imageUrl ||
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${username}`;

  const [newUser] = await db
    .insert(usersTable)
    .values({ clerkId: clerkUserId, username, displayName, avatar, bio: "" })
    .returning();

  return newUser.id;
}

// Resolves req.appUserId when a session is present, but always calls next() —
// used on public routes (feed, post detail, profiles) so guests can browse
// without signing in, while signed-in requests still get personalized data
// (isLoved, isFollowing, etc).
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    req.appUserId = await resolveAppUserId(req);
    next();
  } catch (err) {
    next(err);
  }
};

// Requires a signed-in session. Assumes optionalAuth has already run
// earlier in the middleware chain (mounted globally in routes/index.ts);
// falls back to resolving it directly if not, so it's safe to use standalone.
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.appUserId === undefined) {
      req.appUserId = await resolveAppUserId(req);
    }
    if (req.appUserId === undefined) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
};
