import { z } from "zod";

const taskStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const priorities = ["LOW", "MEDIUM", "HIGH"];

const optionalText = z
  .string({
    error: "Must be text"
  })
  .trim()
  .optional();

const optionalDate = (fieldName) =>
  z
    .string({
      error: `${fieldName} must be a valid date`
    })
    .trim()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: `${fieldName} must be a valid date`
    })
    .optional();

const optionalPositiveNumber = (fieldName) =>
  z
    .number({
      error: `${fieldName} must be a valid number`
    })
    .int(`${fieldName} must be a whole number`)
    .positive(`${fieldName} must be greater than 0`)
    .optional();

export const createTaskSchema = z.object({
  projectId: z
    .number({
      error: "Project id is required"
    })
    .int("Project id must be a whole number")
    .positive("Project id must be greater than 0"),
  assignedToId: optionalPositiveNumber("Assigned user id"),
  title: z
    .string({
      error: "Task title is required"
    })
    .trim()
    .min(1, "Task title is required"),
  description: optionalText,
  status: z.enum(taskStatuses, { error: "Invalid task status" }).optional(),
  priority: z.enum(priorities, { error: "Invalid task priority" }).optional(),
  dueDate: optionalDate("Due date")
});

export const updateTaskSchema = z
  .object({
    assignedToId: optionalPositiveNumber("Assigned user id"),
    title: optionalText,
    description: optionalText,
    status: z.enum(taskStatuses, { error: "Invalid task status" }).optional(),
    priority: z.enum(priorities, { error: "Invalid task priority" }).optional(),
    dueDate: optionalDate("Due date"),
    completedAt: optionalDate("Completed date")
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required"
  });

export const formatZodErrors = (error) => {
  const errors = {};

  error.issues.forEach((issue) => {
    const field = issue.path[0] || "body";
    errors[field] = issue.message;
  });

  return errors;
};
