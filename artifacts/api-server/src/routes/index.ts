import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
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

// All other routes require authentication
router.use(requireAuth);

router.use(feedRouter);
router.use(postsRouter);
router.use(commentsRouter);
router.use(usersRouter);
router.use(notificationsRouter);
router.use(uploadRouter);

export default router;
