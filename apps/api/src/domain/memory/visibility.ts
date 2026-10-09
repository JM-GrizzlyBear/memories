import type { Memory } from "./Memory.js";

// Who may see a memory. Friends join this rule in Phase 4.
export function canView(
  memory: Pick<Memory, "userId" | "visibility">,
  viewerId: string,
) {
  return memory.userId === viewerId || memory.visibility === "public";
}
