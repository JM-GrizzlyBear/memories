import type { MessagePrivacy } from "@memories/shared";
import { UserNotFoundError } from "../../domain/user/errors.js";
import { toSafeUser } from "../../domain/user/User.js";
import type { UserRepository } from "../../domain/user/UserRepository.js";

// Settings → Privacy → "Who can message me?"
export class SetMessagePrivacy {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string, privacy: MessagePrivacy) {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError();
    return toSafeUser(await this.users.setMessagePrivacy(userId, privacy));
  }
}
