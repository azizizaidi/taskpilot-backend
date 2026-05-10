import prisma from "../utils/prisma.js";
import { createActivityLog } from "./activityLogService.js";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true
};

const commentInclude = {
  user: {
    select: safeUserSelect
  },
  task: {
    select: {
      id: true,
      title: true,
      status: true,
      projectId: true,
      assignedToId: true
    }
  }
};

const getTaskAccessWhere = (taskId, user) => {
  if (user.role === "ADMIN") {
    return {
      id: taskId
    };
  }

  return {
    id: taskId,
    OR: [
      {
        assignedToId: user.id
      },
      {
        project: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      }
    ]
  };
};

const ensureTaskAccess = async (taskId, user) => {
  const task = await prisma.task.findFirst({
    where: getTaskAccessWhere(taskId, user),
    select: {
      id: true,
      title: true,
      projectId: true,
      assignedToId: true
    }
  });

  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  return task;
};

const findCommentById = async (commentId) => {
  const comment = await prisma.taskComment.findUnique({
    where: {
      id: commentId
    },
    include: commentInclude
  });

  if (!comment) {
    const error = new Error("Comment not found");
    error.statusCode = 404;
    throw error;
  }

  return comment;
};

export const getTaskComments = async (taskId, user) => {
  await ensureTaskAccess(taskId, user);

  return prisma.taskComment.findMany({
    where: {
      taskId
    },
    include: commentInclude,
    orderBy: {
      createdAt: "asc"
    }
  });
};

export const createTaskComment = async (taskId, user, commentData) => {
  const task = await ensureTaskAccess(taskId, user);

  const comment = await prisma.taskComment.create({
    data: {
      taskId,
      userId: user.id,
      comment: commentData.comment
    },
    include: commentInclude
  });

  await createActivityLog({
    userId: user.id,
    projectId: task.projectId,
    taskId,
    action: "COMMENT_CREATED",
    description: `${user.name} added a comment to ${task.title}.`
  });

  return comment;
};

export const updateTaskComment = async (commentId, user, commentData) => {
  const existingComment = await findCommentById(commentId);

  if (user.role !== "ADMIN" && existingComment.userId !== user.id) {
    const error = new Error("You can only update your own comments");
    error.statusCode = 403;
    throw error;
  }

  const comment = await prisma.taskComment.update({
    where: {
      id: commentId
    },
    data: {
      comment: commentData.comment
    },
    include: commentInclude
  });

  await createActivityLog({
    userId: user.id,
    projectId: existingComment.task.projectId,
    taskId: existingComment.taskId,
    action: "COMMENT_UPDATED",
    description: `${user.name} updated a comment on ${existingComment.task.title}.`
  });

  return comment;
};

export const deleteTaskComment = async (commentId, user) => {
  const existingComment = await findCommentById(commentId);

  if (user.role !== "ADMIN" && existingComment.userId !== user.id) {
    const error = new Error("You can only delete your own comments");
    error.statusCode = 403;
    throw error;
  }

  await createActivityLog({
    userId: user.id,
    projectId: existingComment.task.projectId,
    taskId: existingComment.taskId,
    action: "COMMENT_DELETED",
    description: `${user.name} deleted a comment on ${existingComment.task.title}.`
  });

  return prisma.taskComment.delete({
    where: {
      id: commentId
    }
  });
};
