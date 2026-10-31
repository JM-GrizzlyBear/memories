import type { UserRepository } from "../../domain/user/UserRepository.js";
import type { PasswordResetRepository } from "../../domain/passwordReset/PasswordResetRepository.js";
import type { AccountEmails } from "../ports/AccountEmails.js";
import type { Clock } from "../ports/Clock.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { SessionStore } from "../ports/SessionStore.js";
import type { CheckPasswordResetLink } from "./CheckPasswordResetLink.js";

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

// The link from the email + a new password. Afterwards the user logs in again.
export class ResetPassword {
  constructor(
    private readonly checkLink: CheckPasswordResetLink,
    private readonly users: UserRepository,
    private readonly links: PasswordResetRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessions: SessionStore,
    private readonly clock: Clock,
    private readonly emails: AccountEmails | null,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const { link, user } = await this.checkLink.execute(input.token);
    const now = this.clock.now();

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    await this.users.updatePasswordHash(user.id, passwordHash);
    await this.links.markUsed(link.id, now);

    // Whoever might have known the old password is logged out everywhere
    await this.sessions.deleteAllSessions(user.id);

    await this.emails?.sendPasswordChanged(
      { email: user.email, firstName: user.firstName, username: user.username },
      now,
    );
  }
}
