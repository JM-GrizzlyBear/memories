import {
  IncorrectPasswordError,
  UserNotFoundError,
} from "../../domain/user/errors.js";
import type { UserRepository } from "../../domain/user/UserRepository.js";
import type { AccountEmails } from "../ports/AccountEmails.js";
import type { Clock } from "../ports/Clock.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { SessionStore } from "../ports/SessionStore.js";

export interface ChangePasswordInput {
  userId: string;
  sessionId: string; // the session making this request: it stays logged in
  currentPassword: string;
  newPassword: string;
}

export class ChangePassword {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessions: SessionStore,
    private readonly clock: Clock,
    // null: this server can't send email; the change still works
    private readonly emails: AccountEmails | null,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFoundError();

    // Proves it's really them, not someone using a computer they left logged in
    const isCurrentCorrect = await this.passwordHasher.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!isCurrentCorrect) throw new IncorrectPasswordError();

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    await this.users.updatePasswordHash(user.id, passwordHash);

    // Anyone who knew the old password and is logged in elsewhere gets logged out
    await this.sessions.deleteOtherSessions(user.id, input.sessionId);

    // Same heads-up as after a reset by email, so a change they didn't make doesn't go unnoticed
    await this.emails?.sendPasswordChanged(
      { email: user.email, firstName: user.firstName, username: user.username },
      this.clock.now(),
    );
  }
}
