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
      title: true
    }
  },
  task: {
    select: {
      id: true,
      title: true
    }
  }
};

const upcomingTaskInclude = {
  project: {
    select: {
      id: true,
      title: true
    }
  },
  assignedTo: {
    select: safeUserSelect
  }
};

const getMemberProjectWhere = (userId) => ({
  OR: [
    {
      ownerId: userId
    },
    {
      members: {
        some: {
          userId
        }
      }
    }
  ]
});

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

const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const countProjectsByStatus = (where, status) => {
  return prisma.project.count({
    where: {
      AND: [where, { status }]
    }
  });
};

const countTasksByStatus = (where, status) => {
  return prisma.task.count({
    where: {
      AND: [where, { status }]
    }
  });
};

const getAdminDashboardStats = async () => {
  const today = getTodayStart();

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    archivedProjects,
    totalTasks,
    todoTasks,
    inProgressTasks,
    reviewTasks,
    completedTasks,
    totalUsers,
    totalComments,
    recentActivities,
    upcomingTasks
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.project.count({ where: { status: "COMPLETED" } }),
    prisma.project.count({ where: { status: "ARCHIVED" } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: "TODO" } }),
    prisma.task.count({ where: { status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { status: "REVIEW" } }),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.user.count(),
    prisma.taskComment.count(),
    prisma.activityLog.findMany({
      take: 10,
      include: activityLogInclude,
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.task.findMany({
      where: {
        dueDate: {
          gte: today
        }
      },
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        project: upcomingTaskInclude.project,
        assignedTo: upcomingTaskInclude.assignedTo
      },
      orderBy: {
        dueDate: "asc"
      }
    })
  ]);

  return {
    summary: {
      totalProjects,
      activeProjects,
      completedProjects,
      archivedProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      reviewTasks,
      completedTasks,
      totalUsers,
      totalComments
    },
    recentActivities,
    upcomingTasks
  };
};

const getMemberDashboardStats = async (user) => {
  const today = getTodayStart();
  const projectWhere = getMemberProjectWhere(user.id);
  const taskWhere = getMemberTaskWhere(user.id);

  const accessibleProjects = await prisma.project.findMany({
    where: projectWhere,
    select: {
      id: true
    }
  });

  const accessibleProjectIds = accessibleProjects.map((project) => project.id);

  const accessibleTasks = await prisma.task.findMany({
    where: taskWhere,
    select: {
      id: true
    }
  });

  const accessibleTaskIds = accessibleTasks.map((task) => task.id);

  const activityWhere =
    accessibleProjectIds.length > 0 || accessibleTaskIds.length > 0
      ? {
          OR: [
            {
              projectId: {
                in: accessibleProjectIds
              }
            },
            {
              taskId: {
                in: accessibleTaskIds
              }
            }
          ]
        }
      : {
          id: -1
        };

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    assignedTasks,
    todoTasks,
    inProgressTasks,
    reviewTasks,
    completedTasks,
    recentActivities,
    upcomingTasks
  ] = await Promise.all([
    prisma.project.count({ where: projectWhere }),
    countProjectsByStatus(projectWhere, "ACTIVE"),
    countProjectsByStatus(projectWhere, "COMPLETED"),
    prisma.task.count({ where: taskWhere }),
    prisma.task.count({
      where: {
        AND: [
          taskWhere,
          {
            assignedToId: user.id
          }
        ]
      }
    }),
    countTasksByStatus(taskWhere, "TODO"),
    countTasksByStatus(taskWhere, "IN_PROGRESS"),
    countTasksByStatus(taskWhere, "REVIEW"),
    countTasksByStatus(taskWhere, "DONE"),
    prisma.activityLog.findMany({
      where: activityWhere,
      take: 10,
      include: activityLogInclude,
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.task.findMany({
      where: {
        AND: [
          taskWhere,
          {
            assignedToId: user.id
          },
          {
            dueDate: {
              gte: today
            }
          }
        ]
      },
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        project: upcomingTaskInclude.project,
        assignedTo: upcomingTaskInclude.assignedTo
      },
      orderBy: {
        dueDate: "asc"
      }
    })
  ]);

  return {
    summary: {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      assignedTasks,
      todoTasks,
      inProgressTasks,
      reviewTasks,
      completedTasks
    },
    recentActivities,
    upcomingTasks
  };
};

export const getDashboardStats = async (user) => {
  if (user.role === "ADMIN") {
    return getAdminDashboardStats();
  }

  return getMemberDashboardStats(user);
};
