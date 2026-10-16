import type { MessagePrivacy } from "@memories/shared";
import { UserNotFoundError } from "../../domain/user/errors.js";
import { toSafeUser } from "../../domain/user/User.js";
import type { UserRepository } from "../../domain/user/UserRepository.js";
import type { RealtimePublisher } from "../ports/RealtimePublisher.js";

export const PROFILE_CHANGED_EVENT = "profile:changed";

// Settings → Privacy → "Who can message me?"
export class SetMessagePrivacy {
  constructor(
    private readonly users: UserRepository,
    private readonly realtime: RealtimePublisher,
  ) {}

  async execute(userId: string, privacy: MessagePrivacy) {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError();
    const updated = await this.users.setMessagePrivacy(userId, privacy);

    // Anyone looking at this profile right now gets the Message button (or loses it)
    this.realtime.broadcast(PROFILE_CHANGED_EVENT, {
      userId,
      username: updated.username,
    });
    return toSafeUser(updated);
  }
}
