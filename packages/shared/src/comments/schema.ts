import { z } from "zod";

export const COMMENT_LIMITS = {
  bodyMax: 1000,
} as const;

// A comment on a memory
export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write something first")
    .max(
      COMMENT_LIMITS.bodyMax,
      `Comments must be at most ${COMMENT_LIMITS.bodyMax} characters`,
    ),
});

export type CreateCommentBody = z.infer<typeof createCommentSchema>;
