import type { FriendshipRepository } from "../../domain/friendship/FriendshipRepository.js";

export class ListFriendRequests {
  constructor(private readonly friendships: FriendshipRepository) {}

  async execute(userId: string) {
    const [incoming, outgoing] = await Promise.all([
      this.friendships.listIncoming(userId),
      this.friendships.listOutgoing(userId),
    ]);
    return { incoming, outgoing };
  }
}
