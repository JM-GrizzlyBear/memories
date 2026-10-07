import { z } from "zod";

export const MEMORY_LIMITS = {
  maxPhotos: 10,
  maxPhotoBytes: 5 * 1024 * 1024, // 5 MB
  photoTypes: ["image/jpeg", "image/png", "image/webp"],
  titleMax: 350,
  storyMax: 5000,
  locationMax: 150,
} as const;

export const VISIBILITIES = ["public", "friends", "private"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

// "Today" depends on where the user is, so allow one extra day for time zones
function latestAllowedDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// The text fields of the "Keep a memory" form (photos are checked separately)
export const createMemorySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(
      MEMORY_LIMITS.titleMax,
      `Title must be at most ${MEMORY_LIMITS.titleMax} characters`,
    ),

  story: z
    .string()
    .trim()
    .min(1, "Story is required")
    .max(
      MEMORY_LIMITS.storyMax,
      `Story must be at most ${MEMORY_LIMITS.storyMax} characters`,
    ),

  memoryDate: z.iso
    .date("Enter a valid date")
    .refine(
      (date) => date <= latestAllowedDate(),
      "The date can't be in the future",
    ),

  location: z
    .string()
    .trim()
    .max(
      MEMORY_LIMITS.locationMax,
      `Place must be at most ${MEMORY_LIMITS.locationMax} characters`,
    )
    .optional()
    .transform((value) => (value ? value : null)), // empty → null

  visibility: z.enum(VISIBILITIES).default("friends"),
});

export type CreateMemoryBody = z.infer<typeof createMemorySchema>;
