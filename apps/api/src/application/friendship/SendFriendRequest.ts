import { CannotFriendYourselfError } from "../../domain/friendship/errors.js";
import { friendshipStatus } from "../../domain/friendship/Friendship.js";
import type { FriendshipRepository } from "../../domain/friendship/FriendshipRepository.js";
import { UserNotFoundError } from "../../domain/user/errors.js";
import type { UserRepository } from "../../domain/user/UserRepository.js";

export interface SendFriendRequestInput {
  userId: string; // me
  targetId: string; // the person I'm adding
}

export class SendFriendRequest {
  constructor(
    private readonly users: UserRepository,
    private readonly friendships: FriendshipRepository,
  ) {}

  async execute({ userId, targetId }: SendFriendRequestInput) {
    if (userId === targetId) throw new CannotFriendYourselfError();

    const target = await this.users.findById(targetId);
    if (!target) throw new UserNotFoundError();

    const existing = await this.friendships.findBetween(userId, targetId);

    if (!existing) {
      await this.friendships.createRequest(userId, targetId);
    } else if (
      existing.status === "pending" &&
      existing.requesterId === targetId
    ) {
      // They already asked me: adding them back means yes
      await this.friendships.accept(targetId, userId);
    }
    // Already friends, or I already asked: nothing to do (clicking twice is harmless)

    const current = await this.friendships.findBetween(userId, targetId);
    return friendshipStatus(current, userId, targetId);
  }
}
