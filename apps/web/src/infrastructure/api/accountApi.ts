import type { MessagePrivacy } from "@memories/shared";
import type { User } from "../../domain/user";
import { request } from "./http";

export interface ProfileInput {
  username: string;
  firstName: string;
  lastName: string;
  birthday: string; // "1998-01-10"
}

export async function updateProfile(input: ProfileInput): Promise<User> {
  const data = await request<{ user: User }>("/account/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.user;
}

export interface PasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function changePassword(input: PasswordInput): Promise<void> {
  await request<void>("/account/password", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function uploadProfilePhoto(photo: File): Promise<User> {
  const form = new FormData();
  form.append("photo", photo);
  const data = await request<{ user: User }>("/account/photo", {
    method: "PUT",
    body: form,
  });
  return data.user;
}

export async function removeProfilePhoto(): Promise<User> {
  const data = await request<{ user: User }>("/account/photo", {
    method: "DELETE",
  });
  return data.user;
}

export async function updateMessagePrivacy(
  messagePrivacy: MessagePrivacy,
): Promise<User> {
  const data = await request<{ user: User }>("/account/privacy", {
    method: "PUT",
    body: JSON.stringify({ messagePrivacy }),
  });
  return data.user;
}
