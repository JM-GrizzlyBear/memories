import { UserNotFoundError } from "../../domain/user/errors.js";
import { toSafeUser } from "../../domain/user/User.js";
import type { UserRepository } from "../../domain/user/UserRepository.js";
import type { PhotoStorage } from "../ports/PhotoStorage.js";
import { deleteQuietly } from "./SetProfilePhoto.js";

export class RemoveProfilePhoto {
  constructor(
    private readonly users: UserRepository,
    private readonly photoStorage: PhotoStorage,
  ) {}

  async execute(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError();

    // Nothing to remove: back to initials already
    if (!user.profilePhotoUrl) return toSafeUser(user);

    const updated = await this.users.setProfilePhoto(user.id, null);
    if (user.profilePhotoKey) {
      await deleteQuietly(this.photoStorage, user.profilePhotoKey);
    }
    return toSafeUser(updated);
  }
}
