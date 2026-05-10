import express from "express";
import { getDashboardStatsHandler } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", protect, getDashboardStatsHandler);

export default router;
