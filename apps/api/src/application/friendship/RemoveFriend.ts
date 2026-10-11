import { NotFriendsError } from "../../domain/friendship/errors.js";
import type { FriendshipRepository } from "../../domain/friendship/FriendshipRepository.js";

export interface RemoveFriendInput {
  userId: string;
  friendId: string;
}

// Unfriending: from now on, neither sees the other's "Friends" memories
export class RemoveFriend {
  constructor(private readonly friendships: FriendshipRepository) {}

  async execute({ userId, friendId }: RemoveFriendInput) {
    const deleted = await this.friendships.deleteAccepted(userId, friendId);
    if (!deleted) throw new NotFriendsError();
  }
}
