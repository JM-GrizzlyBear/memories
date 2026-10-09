import type { Memory } from "./Memory.js";

// Who may see a memory:
// the owner always; anyone for "public"; accepted friends for "friends"; nobody else for "private"
export function canView(
  memory: Pick<Memory, "userId" | "visibility">,
  viewerId: string,
  isFriend: boolean,
) {
  if (memory.userId === viewerId) return true;
  if (memory.visibility === "public") return true;
  return memory.visibility === "friends" && isFriend;
}

// Only the owner may change or delete a memory
export function canEdit(memory: Pick<Memory, "userId">, viewerId: string) {
  return memory.userId === viewerId;
}
