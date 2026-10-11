import { FriendRequestNotFoundError } from "../../domain/friendship/errors.js";
import type { FriendshipRepository } from "../../domain/friendship/FriendshipRepository.js";

export interface DeclineFriendRequestInput {
  userId: string; // me (the one who was asked)
  requesterId: string; // the one who asked
}

// Declining deletes the request quietly: the other person is never told
export class DeclineFriendRequest {
  constructor(private readonly friendships: FriendshipRepository) {}

  async execute({ userId, requesterId }: DeclineFriendRequestInput) {
    const deleted = await this.friendships.deletePending(requesterId, userId);
    if (!deleted) throw new FriendRequestNotFoundError();
  }
}
