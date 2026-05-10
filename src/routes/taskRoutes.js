import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";
import {
  createTaskHandler,
  deleteTaskHandler,
  getTaskHandler,
  getTasksHandler,
  updateTaskHandler
} from "../controllers/taskController.js";

const router = express.Router();

router.use(protect);

router.get("/", getTasksHandler);
router.get("/:id", getTaskHandler);
router.post("/", adminOnly, createTaskHandler);
router.put("/:id", updateTaskHandler);
router.delete("/:id", adminOnly, deleteTaskHandler);

export default router;
