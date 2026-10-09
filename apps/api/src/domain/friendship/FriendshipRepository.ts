import type {
  Friend,
  FriendRequest,
  Friendship,
  UserSearchResult,
} from "./Friendship.js";

export interface FriendshipRepository {
  // The row between two people, in either direction
  findBetween(userA: string, userB: string): Promise<Friendship | null>;
  areFriends(userA: string, userB: string): Promise<boolean>;

  // Does nothing if a row between them already exists
  createRequest(requesterId: string, addresseeId: string): Promise<void>;
  // Each returns false when there was nothing to change
  accept(requesterId: string, addresseeId: string): Promise<boolean>;
  deletePending(requesterId: string, addresseeId: string): Promise<boolean>;
  deleteAccepted(userA: string, userB: string): Promise<boolean>;

  listFriends(userId: string): Promise<Friend[]>;
  listIncoming(userId: string): Promise<FriendRequest[]>;
  listOutgoing(userId: string): Promise<FriendRequest[]>;
  countFriends(userId: string): Promise<number>;

  searchUsers(
    viewerId: string,
    text: string,
    limit: number,
  ): Promise<UserSearchResult[]>;
}
