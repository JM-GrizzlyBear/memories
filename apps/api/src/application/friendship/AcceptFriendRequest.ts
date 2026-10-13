import { FriendRequestNotFoundError } from "../../domain/friendship/errors.js";
import type { FriendshipRepository } from "../../domain/friendship/FriendshipRepository.js";
import type { Notifier } from "../notification/Notifier.js";

export interface AcceptFriendRequestInput {
  userId: string; // me (the one who was asked)
  requesterId: string; // the one who asked
}

export class AcceptFriendRequest {
  constructor(
    private readonly friendships: FriendshipRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute({ userId, requesterId }: AcceptFriendRequestInput) {
    const accepted = await this.friendships.accept(requesterId, userId);
    if (!accepted) throw new FriendRequestNotFoundError();

    // Tell the one who asked
    await this.notifier.notify({
      recipientId: requesterId,
      actorId: userId,
      type: "friend_accepted",
    });
  }
}
