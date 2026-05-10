import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";
import { getActivityLogsHandler } from "../controllers/activityLogController.js";

const router = express.Router();

router.get("/", protect, adminOnly, getActivityLogsHandler);

export default router;
