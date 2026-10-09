import type { Profile, UserSearchResult } from "../../domain/friendship";
import { request } from "./http";

export async function searchUsers(
  text: string,
  signal?: AbortSignal,
): Promise<UserSearchResult[]> {
  const params = new URLSearchParams({ q: text });
  const data = await request<{ users: UserSearchResult[] }>(
    `/users?${params}`,
    { signal },
  );
  return data.users;
}

export async function getProfile(username: string): Promise<Profile> {
  const data = await request<{ profile: Profile }>(
    `/users/${encodeURIComponent(username)}`,
  );
  return data.profile;
}
