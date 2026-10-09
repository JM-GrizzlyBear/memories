import { FriendRequestNotFoundError } from "../../domain/friendship/errors.js";
import type { FriendshipRepository } from "../../domain/friendship/FriendshipRepository.js";

export interface AcceptFriendRequestInput {
  userId: string; // me (the one who was asked)
  requesterId: string; // the one who asked
}

export class AcceptFriendRequest {
  constructor(private readonly friendships: FriendshipRepository) {}

  async execute({ userId, requesterId }: AcceptFriendRequestInput) {
    const accepted = await this.friendships.accept(requesterId, userId);
    if (!accepted) throw new FriendRequestNotFoundError();
  }
}
