import { Router, type IRouter } from "express";
import { optionalAuth } from "../middlewares/auth";
import healthRouter from "./health";
import feedRouter from "./feed";
import postsRouter from "./posts";
import commentsRouter from "./comments";
import usersRouter from "./users";
import notificationsRouter from "./notifications";
import uploadRouter from "./upload";

const router: IRouter = Router();

// Health check is always public
router.use(healthRouter);

// Resolves req.appUserId when signed in but never blocks — guests can browse
// public content (feed, posts, profiles). Individual write/personal routes
// apply `requireAuth` themselves (see posts.ts, comments.ts, users.ts, etc).
router.use(optionalAuth);

router.use(feedRouter);
router.use(postsRouter);
router.use(commentsRouter);
router.use(usersRouter);
router.use(notificationsRouter);
router.use(uploadRouter);

export default router;
