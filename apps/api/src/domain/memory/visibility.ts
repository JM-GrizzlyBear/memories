import type { Memory } from "./Memory.js";

// Who may see a memory. Friends join this rule in Phase 4.
export function canView(
  memory: Pick<Memory, "userId" | "visibility">,
  viewerId: string,
) {
  return memory.userId === viewerId || memory.visibility === "public";
}

// Only the owner may change or delete a memory
export function canEdit(memory: Pick<Memory, "userId">, viewerId: string) {
  return memory.userId === viewerId;
}
