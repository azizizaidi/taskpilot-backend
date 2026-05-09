import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";
import {
  createProjectHandler,
  deleteProjectHandler,
  getProjectHandler,
  getProjectsHandler,
  updateProjectHandler
} from "../controllers/projectController.js";

const router = express.Router();

router.use(protect);

router.post("/", createProjectHandler);
router.get("/", getProjectsHandler);
router.get("/:id", getProjectHandler);
router.put("/:id", adminOnly, updateProjectHandler);
router.delete("/:id", adminOnly, deleteProjectHandler);

export default router;
