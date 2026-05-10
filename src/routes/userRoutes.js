import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getUsersHandler } from "../controllers/userController.js";

const router = express.Router();

router.use(protect);

router.get("/", getUsersHandler);

export default router;
