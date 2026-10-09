import type { FriendshipRepository } from "../../domain/friendship/FriendshipRepository.js";

const MAX_RESULTS = 20;

export interface SearchUsersInput {
  viewerId: string;
  text: string;
}

export class SearchUsers {
  constructor(private readonly friendships: FriendshipRepository) {}

  execute({ viewerId, text }: SearchUsersInput) {
    return this.friendships.searchUsers(viewerId, text.trim(), MAX_RESULTS);
  }
}
