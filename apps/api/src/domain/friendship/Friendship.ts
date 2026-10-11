import type { UserSummary } from "../user/User.js";

// One row: who asked, who was asked, and whether it was accepted
export interface Friendship {
  requesterId: string;
  addresseeId: string;
  status: "pending" | "accepted";
  createdAt: Date;
  acceptedAt: Date | null;
}

// How another person relates to me, as the app shows it
export type FriendshipStatus =
  | "self"
  | "none"
  | "friends"
  | "request_sent" // I asked them
  | "request_received"; // they asked me

export function friendshipStatus(
  friendship: Friendship | null,
  viewerId: string,
  otherId: string,
): FriendshipStatus {
  if (viewerId === otherId) return "self";
  if (!friendship) return "none";
  if (friendship.status === "accepted") return "friends";
  return friendship.requesterId === viewerId
    ? "request_sent"
    : "request_received";
}

export interface Friend extends UserSummary {
  friendsSince: Date;
}

export interface FriendRequest extends UserSummary {
  requestedAt: Date;
}

export interface UserSearchResult extends UserSummary {
  friendship: FriendshipStatus;
}
