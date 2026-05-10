import prisma from "../utils/prisma.js";
import {
  getPagination,
  getPaginationMeta
} from "../utils/pagination.js";
import { createActivityLog } from "./activityLogService.js";

const projectStatuses = ["PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"];
const priorities = ["LOW", "MEDIUM", "HIGH"];
const projectSortFields = [
  "createdAt",
  "updatedAt",
  "dueDate",
  "title",
  "priority",
  "status"
];
const sortOrders = ["asc", "desc"];

const projectInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true
    }
  },
  members: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true
        }
      }
    },
    orderBy: {
      joinedAt: "asc"
    }
  },
  _count: {
    select: {
      tasks: true
    }
  }
};

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

export const createProject = async (userId, projectData) => {
  const project = await prisma.project.create({
    data: {
      title: projectData.title,
      description: projectData.description || null,
      status: projectData.status || "PLANNING",
      priority: projectData.priority || "MEDIUM",
      ownerId: userId,
      startDate: parseDate(projectData.startDate),
      dueDate: parseDate(projectData.dueDate),
      members: {
        create: {
          userId,
          roleInProject: "MANAGER"
        }
      }
    },
    include: projectInclude
  });

  await createActivityLog({
    userId,
    projectId: project.id,
    action: "PROJECT_CREATED",
    description: `Project ${project.title} was created.`
  });

  return project;
};

export const getProjects = async (user, query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";

  if (query.status && !projectStatuses.includes(query.status)) {
    const error = new Error("Invalid project status");
    error.statusCode = 400;
    throw error;
  }

  if (query.priority && !priorities.includes(query.priority)) {
    const error = new Error("Invalid project priority");
    error.statusCode = 400;
    throw error;
  }

  if (!projectSortFields.includes(sortBy)) {
    const error = new Error("Invalid project sort field");
    error.statusCode = 400;
    throw error;
  }

  if (!sortOrders.includes(sortOrder)) {
    const error = new Error("Invalid sort order");
    error.statusCode = 400;
    throw error;
  }

  const accessWhere =
    user.role === "ADMIN"
      ? {}
      : {
          OR: [
            {
              ownerId: user.id
            },
            {
              members: {
                some: {
                  userId: user.id
                }
              }
            }
          ]
        };

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

  const where =
    filters.length > 0
      ? {
          AND: [accessWhere, ...filters]
        }
      : accessWhere;

  const [items, totalItems] = await Promise.all([
    prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    }),
    prisma.project.count({
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

export const getProjectById = async (projectId, user) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...(user.role === "ADMIN"
        ? {}
        : {
            members: {
              some: {
                userId: user.id
              }
            }
          })
    },
    include: projectInclude
  });

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  return project;
};

export const updateProject = async (projectId, projectData, userId = null) => {
  await ensureProjectExists(projectId);

  const data = {};

  if (projectData.title !== undefined) {
    data.title = projectData.title;
  }

  if (projectData.description !== undefined) {
    data.description = projectData.description || null;
  }

  if (projectData.status !== undefined) {
    data.status = projectData.status;
  }

  if (projectData.priority !== undefined) {
    data.priority = projectData.priority;
  }

  if (projectData.startDate !== undefined) {
    data.startDate = parseDate(projectData.startDate);
  }

  if (projectData.dueDate !== undefined) {
    data.dueDate = parseDate(projectData.dueDate);
  }

  const project = await prisma.project.update({
    where: {
      id: projectId
    },
    data,
    include: projectInclude
  });

  await createActivityLog({
    userId,
    projectId: project.id,
    action: "PROJECT_UPDATED",
    description: `Project ${project.title} was updated.`
  });

  return project;
};

export const deleteProject = async (projectId, userId = null) => {
  const project = await ensureProjectExists(projectId);

  await createActivityLog({
    userId,
    projectId: project.id,
    action: "PROJECT_DELETED",
    description: `Project ${project.title} was deleted.`
  });

  return prisma.project.delete({
    where: {
      id: projectId
    }
  });
};

const ensureProjectExists = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    },
    select: {
      id: true,
      title: true
    }
  });

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  return project;
};
