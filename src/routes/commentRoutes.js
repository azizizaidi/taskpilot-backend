import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createTaskCommentHandler,
  deleteTaskCommentHandler,
  getTaskCommentsHandler,
  updateTaskCommentHandler
} from "../controllers/commentController.js";

const router = express.Router();

router.use(protect);

router.get("/tasks/:taskId/comments", getTaskCommentsHandler);
router.post("/tasks/:taskId/comments", createTaskCommentHandler);
router.put("/comments/:id", updateTaskCommentHandler);
router.delete("/comments/:id", deleteTaskCommentHandler);

export default router;
