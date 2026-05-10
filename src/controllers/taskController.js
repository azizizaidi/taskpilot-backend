import { errorResponse, successResponse } from "../utils/apiResponse.js";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask
} from "../services/taskService.js";
import {
  createTaskSchema,
  formatZodErrors,
  updateTaskSchema
} from "../validators/taskValidator.js";

const parseTaskId = (id) => {
  const taskId = Number(id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    const error = new Error("Invalid task id");
    error.statusCode = 400;
    throw error;
  }

  return taskId;
};

export const createTaskHandler = async (req, res, next) => {
  try {
    const result = createTaskSchema.safeParse(req.body || {});

    if (!result.success) {
      return errorResponse(
        res,
        400,
        "Validation failed",
        formatZodErrors(result.error)
      );
    }

    const task = await createTask(req.user.id, result.data);

    return successResponse(res, 201, "Task created successfully", {
      task
    });
  } catch (error) {
    next(error);
  }
};

export const getTasksHandler = async (req, res, next) => {
  try {
    const result = await getTasks(req.user, req.query);

    return successResponse(res, 200, "Tasks retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

export const getTaskHandler = async (req, res, next) => {
  try {
    const taskId = parseTaskId(req.params.id);
    const task = await getTaskById(taskId, req.user);

    return successResponse(res, 200, "Task fetched successfully", {
      task
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskHandler = async (req, res, next) => {
  try {
    const taskId = parseTaskId(req.params.id);
    const result = updateTaskSchema.safeParse(req.body || {});

    if (!result.success) {
      return errorResponse(
        res,
        400,
        "Validation failed",
        formatZodErrors(result.error)
      );
    }

    const task = await updateTask(taskId, req.user, result.data);

    return successResponse(res, 200, "Task updated successfully", {
      task
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTaskHandler = async (req, res, next) => {
  try {
    const taskId = parseTaskId(req.params.id);
    await deleteTask(taskId, req.user.id);

    return successResponse(res, 200, "Task deleted successfully");
  } catch (error) {
    next(error);
  }
};
