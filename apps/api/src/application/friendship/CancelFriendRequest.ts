import { FriendRequestNotFoundError } from "../../domain/friendship/errors.js";
import type { FriendshipRepository } from "../../domain/friendship/FriendshipRepository.js";

export interface CancelFriendRequestInput {
  userId: string; // me (the one who asked)
  targetId: string; // the one I asked
}

// Taking back a request I sent. Sending again later starts a fresh request.
export class CancelFriendRequest {
  constructor(private readonly friendships: FriendshipRepository) {}

  async execute({ userId, targetId }: CancelFriendRequestInput) {
    const deleted = await this.friendships.deletePending(userId, targetId);
    if (!deleted) throw new FriendRequestNotFoundError();
  }
}
