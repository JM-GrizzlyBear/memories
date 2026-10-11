import type {
  Friend,
  FriendRequest,
  FriendshipStatus,
} from "../../domain/friendship";
import { request } from "./http";

export interface FriendRequests {
  incoming: FriendRequest[]; // people who asked me
  outgoing: FriendRequest[]; // people I asked
}

function userPath(userId: string) {
  return encodeURIComponent(userId);
}

export async function listFriends(): Promise<Friend[]> {
  const data = await request<{ friends: Friend[] }>("/friends");
  return data.friends;
}

export function listFriendRequests(): Promise<FriendRequests> {
  return request<FriendRequests>("/friends/requests");
}

// Each action answers with how we relate afterwards
type FriendshipAnswer = { friendship: FriendshipStatus };

export async function sendFriendRequest(
  userId: string,
): Promise<FriendshipStatus> {
  const data = await request<FriendshipAnswer>(
    `/friends/requests/${userPath(userId)}`,
    { method: "POST" },
  );
  return data.friendship;
}

export async function cancelFriendRequest(
  userId: string,
): Promise<FriendshipStatus> {
  const data = await request<FriendshipAnswer>(
    `/friends/requests/${userPath(userId)}`,
    { method: "DELETE" },
  );
  return data.friendship;
}

export async function acceptFriendRequest(
  userId: string,
): Promise<FriendshipStatus> {
  const data = await request<FriendshipAnswer>(
    `/friends/requests/${userPath(userId)}/accept`,
    { method: "POST" },
  );
  return data.friendship;
}

export async function declineFriendRequest(
  userId: string,
): Promise<FriendshipStatus> {
  const data = await request<FriendshipAnswer>(
    `/friends/requests/${userPath(userId)}/decline`,
    { method: "POST" },
  );
  return data.friendship;
}

export async function removeFriend(userId: string): Promise<FriendshipStatus> {
  const data = await request<FriendshipAnswer>(
    `/friends/${userPath(userId)}`,
    { method: "DELETE" },
  );
  return data.friendship;
}
