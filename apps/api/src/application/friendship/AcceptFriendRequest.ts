import { FriendRequestNotFoundError } from "../../domain/friendship/errors.js";
import type { FriendshipRepository } from "../../domain/friendship/FriendshipRepository.js";
import type { Notifier } from "../notification/Notifier.js";

// Called once two people are friends (their waiting message request is accepted by itself)
export interface OnFriendsMade {
  acceptRequestsBetweenFriends(userA: string, userB: string): Promise<void>;
}

export interface AcceptFriendRequestInput {
  userId: string; // me (the one who was asked)
  requesterId: string; // the one who asked
}

export class AcceptFriendRequest {
  constructor(
    private readonly friendships: FriendshipRepository,
    private readonly notifier: Notifier,
    private readonly onFriendsMade: OnFriendsMade,
  ) {}

  async execute({ userId, requesterId }: AcceptFriendRequestInput) {
    const accepted = await this.friendships.accept(requesterId, userId);
    if (!accepted) throw new FriendRequestNotFoundError();

    await this.onFriendsMade.acceptRequestsBetweenFriends(userId, requesterId);

    // Tell the one who asked
    await this.notifier.notify({
      recipientId: requesterId,
      actorId: userId,
      type: "friend_accepted",
    });
  }
}
