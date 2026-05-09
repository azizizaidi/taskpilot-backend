import express from "express";
import { successResponse } from "../utils/apiResponse.js";

const router = express.Router();

router.get("/", (req, res) => {
  return successResponse(res, 200, "TaskPilot API is healthy", {
    service: "TaskPilot Backend API",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

export default router;
