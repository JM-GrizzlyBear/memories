import type { LikeRepository } from "../../domain/like/LikeRepository.js";
import type { MemoryAccess } from "../memory/MemoryAccess.js";
import type { Notifier } from "../notification/Notifier.js";

export interface LikeMemoryInput {
  memoryId: string;
  viewerId: string;
  liked: boolean; // true = like, false = take the like back
}

// You can only like what you're allowed to see (that includes your own memories)
export class LikeMemory {
  constructor(
    private readonly access: MemoryAccess,
    private readonly likes: LikeRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute({ memoryId, viewerId, liked }: LikeMemoryInput) {
    const memory = await this.access.findViewable(memoryId, viewerId);

    if (liked) {
      await this.likes.add(memoryId, viewerId);
      await this.notifier.notify({
        recipientId: memory.userId,
        actorId: viewerId,
        type: "memory_liked",
        memoryId,
      });
    } else {
      await this.likes.remove(memoryId, viewerId);
      await this.notifier.withdrawLike(viewerId, memoryId);
    }

    return { likedByMe: liked, likeCount: await this.likes.count(memoryId) };
  }
}
