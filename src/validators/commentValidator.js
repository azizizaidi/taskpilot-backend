import { z } from "zod";

const commentSchema = z.object({
  comment: z
    .string({
      error: "Comment is required"
    })
    .trim()
    .min(1, "Comment is required")
    .max(1000, "Comment cannot be more than 1000 characters")
});

export const createCommentSchema = commentSchema;
export const updateCommentSchema = commentSchema;

export const formatZodErrors = (error) => {
  const errors = {};

  error.issues.forEach((issue) => {
    const field = issue.path[0] || "body";
    errors[field] = issue.message;
  });

  return errors;
};
