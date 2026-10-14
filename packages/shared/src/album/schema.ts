import { z } from "zod";

export const ALBUM_LIMITS = {
  noteMax: 160,
} as const;

// The line someone writes about one year of their album. Empty = remove it.
export const albumNoteSchema = z.object({
  note: z
    .string()
    .trim()
    .max(
      ALBUM_LIMITS.noteMax,
      `Keep it to ${ALBUM_LIMITS.noteMax} characters or fewer`,
    ),
});

export type AlbumNoteBody = z.infer<typeof albumNoteSchema>;
