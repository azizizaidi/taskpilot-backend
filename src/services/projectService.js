import prisma from "../utils/prisma.js";

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
  return prisma.project.create({
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
};

export const getProjects = async (user) => {
  const where =
    user.role === "ADMIN"
      ? {}
      : {
          members: {
            some: {
              userId: user.id
            }
          }
        };

  return prisma.project.findMany({
    where,
    include: projectInclude,
    orderBy: {
      createdAt: "desc"
    }
  });
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

export const updateProject = async (projectId, projectData) => {
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

  return prisma.project.update({
    where: {
      id: projectId
    },
    data,
    include: projectInclude
  });
};

export const deleteProject = async (projectId) => {
  await ensureProjectExists(projectId);

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
