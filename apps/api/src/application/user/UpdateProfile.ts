import {
  UsernameAlreadyTakenError,
  UserNotFoundError,
} from "../../domain/user/errors.js";
import { toSafeUser } from "../../domain/user/User.js";
import type { UserRepository } from "../../domain/user/UserRepository.js";

export interface UpdateProfileInput {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  birthday: Date;
}

export class UpdateProfile {
  constructor(private readonly users: UserRepository) {}

  async execute(input: UpdateProfileInput) {
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFoundError();

    // Usernames are saved in lowercase, like at registration
    const username = input.username.trim().toLowerCase();
    if (username !== user.username) {
      const owner = await this.users.findByUsername(username);
      if (owner && owner.id !== user.id) throw new UsernameAlreadyTakenError();
    }

    const updated = await this.users.updateProfile(user.id, {
      username,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      birthday: input.birthday,
    });
    return toSafeUser(updated);
  }
}
