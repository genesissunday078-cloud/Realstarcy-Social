import { pgTable, text, serial, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  loveCount: integer("love_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  // Speeds up per-user post feeds (userId filter + createdAt DESC sort)
  index("posts_user_created_idx").on(t.userId, t.createdAt),
  // Speeds up /trending query (ORDER BY loveCount DESC)
  index("posts_love_count_idx").on(t.loveCount),
]);

export const lovesTable = pgTable("loves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  postId: integer("post_id").notNull().references(() => postsTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  // Speeds up the "did this user love this post?" check done on every feed render
  index("loves_post_user_idx").on(t.postId, t.userId),
]);

export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true, loveCount: true, commentCount: true, createdAt: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
export type Love = typeof lovesTable.$inferSelect;
