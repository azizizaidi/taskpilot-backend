import prisma from "../utils/prisma.js";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true
};

const activityLogInclude = {
  user: {
    select: safeUserSelect
  },
  project: {
    select: {
      id: true,
      title: true,
      status: true,
      priority: true
    }
  },
  task: {
    select: {
      id: true,
      title: true,
      status: true,
      priority: true
    }
  }
};

export const createActivityLog = async ({
  userId = null,
  projectId = null,
  taskId = null,
  action,
  description
}) => {
  return prisma.activityLog.create({
    data: {
      userId,
      projectId,
      taskId,
      action,
      description
    }
  });
};

export const getActivityLogs = async ({ page = 1, limit = 10 }) => {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 50) : 10;
  const skip = (safePage - 1) * safeLimit;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      skip,
      take: safeLimit,
      include: activityLogInclude,
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.activityLog.count()
  ]);

  const totalPages = Math.ceil(total / safeLimit) || 1;

  return {
    logs,
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages
    }
  };
};
