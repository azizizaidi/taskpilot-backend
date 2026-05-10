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

export const getActivityLogs = async ({ page = 1, limit = 10, dateFrom, dateTo }) => {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 50) : 10;
  const skip = (safePage - 1) * safeLimit;

  const where = {};
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: safeLimit,
      include: activityLogInclude,
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.activityLog.count({ where })
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
