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
      appUserId: number;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId;

    if (!clerkUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Look up existing DB user by Clerk ID
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkUserId))
      .limit(1);

    if (existing) {
      req.appUserId = existing.id;
      next();
      return;
    }

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

    req.appUserId = newUser.id;
    next();
  } catch (err) {
    next(err);
  }
};
