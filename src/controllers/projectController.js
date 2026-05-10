import { errorResponse, successResponse } from "../utils/apiResponse.js";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject
} from "../services/projectService.js";

const projectStatuses = ["PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"];
const priorities = ["LOW", "MEDIUM", "HIGH"];

const validateProjectInput = (body, isUpdate = false) => {
  const errors = {};

  if (!isUpdate && (!body.title || typeof body.title !== "string" || !body.title.trim())) {
    errors.title = "Project title is required";
  }

  if (body.title !== undefined && typeof body.title !== "string") {
    errors.title = "Project title must be text";
  }

  if (typeof body.title === "string" && !body.title.trim()) {
    errors.title = "Project title cannot be empty";
  }

  if (body.description !== undefined && typeof body.description !== "string") {
    errors.description = "Project description must be text";
  }

  if (body.status && !projectStatuses.includes(body.status)) {
    errors.status = "Invalid project status";
  }

  if (body.priority && !priorities.includes(body.priority)) {
    errors.priority = "Invalid project priority";
  }

  if (body.startDate && Number.isNaN(new Date(body.startDate).getTime())) {
    errors.startDate = "Start date must be a valid date";
  }

  if (body.dueDate && Number.isNaN(new Date(body.dueDate).getTime())) {
    errors.dueDate = "Due date must be a valid date";
  }

  return errors;
};

const parseProjectId = (id) => {
  const projectId = Number(id);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    const error = new Error("Invalid project id");
    error.statusCode = 400;
    throw error;
  }

  return projectId;
};

const hasErrors = (errors) => Object.keys(errors).length > 0;

const trimOptionalText = (value) => {
  if (value === undefined) {
    return undefined;
  }

  return value.trim();
};

export const createProjectHandler = async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateProjectInput(body);

    if (hasErrors(errors)) {
      return errorResponse(res, 400, "Validation failed", errors);
    }

    const project = await createProject(req.user.id, {
      title: body.title.trim(),
      description: trimOptionalText(body.description),
      status: body.status,
      priority: body.priority,
      startDate: body.startDate,
      dueDate: body.dueDate
    });

    return successResponse(res, 201, "Project created successfully", {
      project
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectsHandler = async (req, res, next) => {
  try {
    const result = await getProjects(req.user, req.query);

    return successResponse(res, 200, "Projects retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

export const getProjectHandler = async (req, res, next) => {
  try {
    const projectId = parseProjectId(req.params.id);
    const project = await getProjectById(projectId, req.user);

    return successResponse(res, 200, "Project fetched successfully", {
      project
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectHandler = async (req, res, next) => {
  try {
    const projectId = parseProjectId(req.params.id);
    const body = req.body || {};
    const errors = validateProjectInput(body, true);

    if (hasErrors(errors)) {
      return errorResponse(res, 400, "Validation failed", errors);
    }

    const project = await updateProject(
      projectId,
      {
        title: trimOptionalText(body.title),
        description: trimOptionalText(body.description),
        status: body.status,
        priority: body.priority,
        startDate: body.startDate,
        dueDate: body.dueDate
      },
      req.user.id
    );

    return successResponse(res, 200, "Project updated successfully", {
      project
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProjectHandler = async (req, res, next) => {
  try {
    const projectId = parseProjectId(req.params.id);
    await deleteProject(projectId, req.user.id);

    return successResponse(res, 200, "Project deleted successfully");
  } catch (error) {
    next(error);
  }
};
