import { errorResponse } from "../utils/apiResponse.js";

export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  const errors = process.env.NODE_ENV === "production" ? null : err.errors;

  return errorResponse(res, statusCode, message, errors);
};
