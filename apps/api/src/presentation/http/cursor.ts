import { z } from "zod";

// A bookmark for "show older": the exact created_at text from Postgres + the id
export interface Cursor {
  createdAt: string;
  id: string;
}

const cursorSchema = z.object({
  createdAt: z.string().min(1),
  id: z.uuid(),
});

// The cursor travels as an opaque, URL-safe string
export function encodeCursor(cursor: Cursor) {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(value: string): Cursor | null {
  try {
    const parsed = cursorSchema.safeParse(
      JSON.parse(Buffer.from(value, "base64url").toString("utf8")),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
