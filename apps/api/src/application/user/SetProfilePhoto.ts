import { UserNotFoundError } from "../../domain/user/errors.js";
import { toSafeUser } from "../../domain/user/User.js";
import type { UserRepository } from "../../domain/user/UserRepository.js";
import type { PhotoStorage, PhotoUpload } from "../ports/PhotoStorage.js";

export interface SetProfilePhotoInput {
  userId: string;
  photo: PhotoUpload;
}

export class SetProfilePhoto {
  constructor(
    private readonly users: UserRepository,
    private readonly photoStorage: PhotoStorage,
  ) {}

  async execute(input: SetProfilePhotoInput) {
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFoundError();

    const stored = await this.photoStorage.save(input.photo, "profile");

    let updated;
    try {
      updated = await this.users.setProfilePhoto(user.id, {
        url: stored.url,
        key: stored.storageKey,
      });
    } catch (error) {
      // Couldn't save it on the account: don't leave the new file behind
      await this.photoStorage.delete(stored.storageKey).catch(() => {});
      throw error;
    }

    // The new photo is in place, so the old one can go
    if (user.profilePhotoKey) {
      await deleteQuietly(this.photoStorage, user.profilePhotoKey);
    }

    return toSafeUser(updated);
  }
}

// Deleting an old file shouldn't fail the request: the account is already updated
export async function deleteQuietly(storage: PhotoStorage, key: string) {
  try {
    await storage.delete(key);
  } catch (error) {
    console.error(`Couldn't delete old profile photo ${key}`, error);
  }
}
