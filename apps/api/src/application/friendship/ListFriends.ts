import type { FriendshipRepository } from "../../domain/friendship/FriendshipRepository.js";

export class ListFriends {
  constructor(private readonly friendships: FriendshipRepository) {}

  execute(userId: string) {
    return this.friendships.listFriends(userId);
  }
}
