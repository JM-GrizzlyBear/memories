import { z } from "zod";

// A malformed id can't match anything, and must never reach the database as a bad UUID
export function parseId(value: unknown) {
  const parsed = z.uuid().safeParse(value);
  return parsed.success ? parsed.data : null;
}
