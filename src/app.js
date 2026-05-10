import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import activityLogRoutes from "./routes/activityLogRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import {
  errorMiddleware,
  notFoundHandler
} from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to TaskPilot API",
    data: {
      healthCheck: "/api/health"
    }
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api", commentRoutes);
app.use("/api/activity-logs", activityLogRoutes);

app.use(notFoundHandler);
app.use(errorMiddleware);

export default app;
