import type { FriendshipRepository } from "../../domain/friendship/FriendshipRepository.js";
import { MemoryNotFoundError } from "../../domain/memory/errors.js";
import type { Memory } from "../../domain/memory/Memory.js";
import type { MemoryRepository } from "../../domain/memory/MemoryRepository.js";
import { canView } from "../../domain/memory/visibility.js";

// Answers "may this person see this memory?", asking the database about friendship only when it matters
export class MemoryAccess {
  constructor(
    private readonly memories: MemoryRepository,
    private readonly friendships: FriendshipRepository,
  ) {}

  async canView(
    memory: Pick<Memory, "userId" | "visibility">,
    viewerId: string,
  ) {
    const needsFriendCheck =
      memory.visibility === "friends" && memory.userId !== viewerId;
    const isFriend = needsFriendCheck
      ? await this.friendships.areFriends(memory.userId, viewerId)
      : false;
    return canView(memory, viewerId, isFriend);
  }

  // The memory, if this person may see it. "Doesn't exist" and "not allowed" both
  // throw MemoryNotFoundError, so nobody can discover hidden memories by guessing ids.
  async findViewable(memoryId: string, viewerId: string) {
    const memory = await this.memories.findById(memoryId, viewerId);
    if (!memory || !(await this.canView(memory, viewerId))) {
      throw new MemoryNotFoundError();
    }
    return memory;
  }
}
