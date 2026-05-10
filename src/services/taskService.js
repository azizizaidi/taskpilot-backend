import prisma from "../utils/prisma.js";
import {
  getPagination,
  getPaginationMeta,
  parseOptionalPositiveInt
} from "../utils/pagination.js";
import { createActivityLog } from "./activityLogService.js";

const taskStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const priorities = ["LOW", "MEDIUM", "HIGH"];
const taskSortFields = [
  "createdAt",
  "updatedAt",
  "dueDate",
  "title",
  "priority",
  "status"
];
const sortOrders = ["asc", "desc"];

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true
};

const taskInclude = {
  project: {
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      ownerId: true
    }
  },
  assignedTo: {
    select: safeUserSelect
  },
  createdBy: {
    select: safeUserSelect
  }
};

const getMemberTaskWhere = (userId) => ({
  OR: [
    {
      assignedToId: userId
    },
    {
      project: {
        members: {
          some: {
            userId
          }
        }
      }
    }
  ]
});

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const error = new Error("Invalid date format");
    error.statusCode = 400;
    throw error;
  }

  return date;
};

const ensureProjectExists = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    },
    select: {
      id: true
    }
  });

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  return project;
};

const ensureUserExists = async (userId) => {
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true
    }
  });

  if (!user) {
    const error = new Error("Assigned user not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const findTaskById = async (taskId) => {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId
    },
    include: taskInclude
  });

  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  return task;
};

export const createTask = async (userId, taskData) => {
  await ensureProjectExists(taskData.projectId);
  await ensureUserExists(taskData.assignedToId);

  const task = await prisma.task.create({
    data: {
      projectId: taskData.projectId,
      assignedToId: taskData.assignedToId || null,
      createdById: userId,
      title: taskData.title,
      description: taskData.description || null,
      status: taskData.status || "TODO",
      priority: taskData.priority || "MEDIUM",
      dueDate: parseDate(taskData.dueDate)
    },
    include: taskInclude
  });

  await createActivityLog({
    userId,
    projectId: task.projectId,
    taskId: task.id,
    action: "TASK_CREATED",
    description: `Task ${task.title} was created.`
  });

  return task;
};

export const getTasks = async (user, query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";
  const projectId = parseOptionalPositiveInt(query.projectId, "Project id");
  const assignedToId = parseOptionalPositiveInt(
    query.assignedToId,
    "Assigned user id"
  );

  if (query.status && !taskStatuses.includes(query.status)) {
    const error = new Error("Invalid task status");
    error.statusCode = 400;
    throw error;
  }

  if (query.priority && !priorities.includes(query.priority)) {
    const error = new Error("Invalid task priority");
    error.statusCode = 400;
    throw error;
  }

  if (!taskSortFields.includes(sortBy)) {
    const error = new Error("Invalid task sort field");
    error.statusCode = 400;
    throw error;
  }

  if (!sortOrders.includes(sortOrder)) {
    const error = new Error("Invalid sort order");
    error.statusCode = 400;
    throw error;
  }

  const accessWhere = user.role === "ADMIN" ? {} : getMemberTaskWhere(user.id);
  const filters = [];

  if (search) {
    filters.push({
      OR: [
        {
          title: {
            contains: search
          }
        },
        {
          description: {
            contains: search
          }
        }
      ]
    });
  }

  if (query.status) {
    filters.push({
      status: query.status
    });
  }

  if (query.priority) {
    filters.push({
      priority: query.priority
    });
  }

  if (projectId !== undefined) {
    filters.push({
      projectId
    });
  }

  if (assignedToId !== undefined) {
    filters.push({
      assignedToId
    });
  }

  const where =
    filters.length > 0
      ? {
          AND: [accessWhere, ...filters]
        }
      : accessWhere;

  const [items, totalItems] = await Promise.all([
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    }),
    prisma.task.count({
      where
    })
  ]);

  return {
    items,
    pagination: getPaginationMeta({
      page,
      limit,
      totalItems
    })
  };
};

export const getTaskById = async (taskId, user) => {
  const where =
    user.role === "ADMIN"
      ? { id: taskId }
      : {
          id: taskId,
          ...getMemberTaskWhere(user.id)
        };

  const task = await prisma.task.findFirst({
    where,
    include: taskInclude
  });

  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  return task;
};

export const updateTask = async (taskId, user, taskData) => {
  const existingTask = await findTaskById(taskId);
  const isAdmin = user.role === "ADMIN";

  if (!isAdmin && existingTask.assignedToId !== user.id) {
    const error = new Error("Only assigned members can update task status");
    error.statusCode = 403;
    throw error;
  }

  if (!isAdmin) {
    const allowedFields = ["status"];
    const requestedFields = Object.keys(taskData);
    const hasForbiddenField = requestedFields.some(
      (field) => !allowedFields.includes(field)
    );

    if (hasForbiddenField) {
      const error = new Error("Members can only update task status");
      error.statusCode = 403;
      throw error;
    }
  }

  if (isAdmin) {
    await ensureUserExists(taskData.assignedToId);
  }

  const data = {};

  if (taskData.assignedToId !== undefined) {
    data.assignedToId = taskData.assignedToId || null;
  }

  if (taskData.title !== undefined) {
    data.title = taskData.title;
  }

  if (taskData.description !== undefined) {
    data.description = taskData.description || null;
  }

  if (taskData.status !== undefined) {
    data.status = taskData.status;
  }

  if (taskData.priority !== undefined) {
    data.priority = taskData.priority;
  }

  if (taskData.dueDate !== undefined) {
    data.dueDate = parseDate(taskData.dueDate);
  }

  if (taskData.completedAt !== undefined) {
    data.completedAt = parseDate(taskData.completedAt);
  }

  const task = await prisma.task.update({
    where: {
      id: taskId
    },
    data,
    include: taskInclude
  });

  await createActivityLog({
    userId: user.id,
    projectId: task.projectId,
    taskId: task.id,
    action: "TASK_UPDATED",
    description: `Task ${task.title} was updated.`
  });

  return task;
};

export const deleteTask = async (taskId, userId = null) => {
  const task = await findTaskById(taskId);

  await createActivityLog({
    userId,
    projectId: task.projectId,
    taskId: task.id,
    action: "TASK_DELETED",
    description: `Task ${task.title} was deleted.`
  });

  return prisma.task.delete({
    where: {
      id: taskId
    }
  });
};
