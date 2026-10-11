// The public part of a person: safe to show anyone
export interface UserSummary {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
}

// How another person relates to me
export type FriendshipStatus =
  | "self"
  | "none"
  | "friends"
  | "request_sent" // I asked them
  | "request_received"; // they asked me

export interface Friend extends UserSummary {
  friendsSince: string;
}

export interface FriendRequest extends UserSummary {
  requestedAt: string;
}

export interface UserSearchResult extends UserSummary {
  friendship: FriendshipStatus;
}

export interface Profile extends UserSummary {
  joinedAt: string;
  friendCount: number;
  friendship: FriendshipStatus;
}
