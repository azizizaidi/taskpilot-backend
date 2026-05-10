import { errorResponse, successResponse } from "../utils/apiResponse.js";
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComments,
  updateTaskComment
} from "../services/commentService.js";
import {
  createCommentSchema,
  formatZodErrors,
  updateCommentSchema
} from "../validators/commentValidator.js";

const parseId = (id, label) => {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    const error = new Error(`Invalid ${label} id`);
    error.statusCode = 400;
    throw error;
  }

  return parsedId;
};

export const getTaskCommentsHandler = async (req, res, next) => {
  try {
    const taskId = parseId(req.params.taskId, "task");
    const comments = await getTaskComments(taskId, req.user);

    return successResponse(res, 200, "Comments fetched successfully", {
      comments
    });
  } catch (error) {
    next(error);
  }
};

export const createTaskCommentHandler = async (req, res, next) => {
  try {
    const taskId = parseId(req.params.taskId, "task");
    const result = createCommentSchema.safeParse(req.body || {});

    if (!result.success) {
      return errorResponse(
        res,
        400,
        "Validation failed",
        formatZodErrors(result.error)
      );
    }

    const comment = await createTaskComment(taskId, req.user, result.data);

    return successResponse(res, 201, "Comment created successfully", {
      comment
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskCommentHandler = async (req, res, next) => {
  try {
    const commentId = parseId(req.params.id, "comment");
    const result = updateCommentSchema.safeParse(req.body || {});

    if (!result.success) {
      return errorResponse(
        res,
        400,
        "Validation failed",
        formatZodErrors(result.error)
      );
    }

    const comment = await updateTaskComment(commentId, req.user, result.data);

    return successResponse(res, 200, "Comment updated successfully", {
      comment
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTaskCommentHandler = async (req, res, next) => {
  try {
    const commentId = parseId(req.params.id, "comment");
    await deleteTaskComment(commentId, req.user);

    return successResponse(res, 200, "Comment deleted successfully");
  } catch (error) {
    next(error);
  }
};
