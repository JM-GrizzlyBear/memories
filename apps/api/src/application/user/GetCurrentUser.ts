import { toSafeUser } from "../../domain/user/User.js";
import type { UserRepository } from "../../domain/user/UserRepository.js";

export class GetCurrentUser {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      return null;
    }

    return toSafeUser(user);
  }
}
