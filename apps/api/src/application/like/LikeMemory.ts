import type { LikeRepository } from "../../domain/like/LikeRepository.js";
import type { MemoryAccess } from "../memory/MemoryAccess.js";

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
  ) {}

  async execute({ memoryId, viewerId, liked }: LikeMemoryInput) {
    await this.access.findViewable(memoryId, viewerId);

    if (liked) {
      await this.likes.add(memoryId, viewerId);
    } else {
      await this.likes.remove(memoryId, viewerId);
    }

    return { likedByMe: liked, likeCount: await this.likes.count(memoryId) };
  }
}
