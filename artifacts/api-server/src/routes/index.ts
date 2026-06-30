import { Router, type IRouter } from "express";
import healthRouter from "./health";
import feedRouter from "./feed";
import postsRouter from "./posts";
import commentsRouter from "./comments";
import usersRouter from "./users";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(feedRouter);
router.use(postsRouter);
router.use(commentsRouter);
router.use(usersRouter);
router.use(notificationsRouter);

export default router;
