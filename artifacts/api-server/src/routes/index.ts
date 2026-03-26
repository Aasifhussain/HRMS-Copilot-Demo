import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import proxyRouter from "./proxy.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(proxyRouter);

export default router;
