import type { MessagePrivacy } from "@memories/shared";
import type { User } from "./User.js";

export type NewUser = Omit<
  User,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "profilePhotoUrl"
  | "profilePhotoKey"
  | "messagePrivacy"
>;

export type ProfileUpdate = Pick<
  User,
  "username" | "firstName" | "lastName" | "birthday"
>;

export interface ProfilePhoto {
  url: string;
  key: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(user: NewUser): Promise<User>;
  updateProfile(id: string, update: ProfileUpdate): Promise<User>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  // null removes the photo
  setProfilePhoto(id: string, photo: ProfilePhoto | null): Promise<User>;
  setMessagePrivacy(id: string, privacy: MessagePrivacy): Promise<User>;
}
