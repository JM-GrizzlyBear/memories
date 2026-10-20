import { resetLinkExpiry } from "../../domain/passwordReset/rules.js";
import type { PasswordResetRepository } from "../../domain/passwordReset/PasswordResetRepository.js";
import { PasswordResetUnavailableError } from "../../domain/passwordReset/errors.js";
import type { UserRepository } from "../../domain/user/UserRepository.js";
import type { AccountEmails } from "../ports/AccountEmails.js";
import type { Clock } from "../ports/Clock.js";
import type { SecretTokens } from "../ports/SecretTokens.js";

export class RequestPasswordReset {
  constructor(
    private readonly users: UserRepository,
    private readonly links: PasswordResetRepository,
    private readonly tokens: SecretTokens,
    private readonly clock: Clock,
    // null: this server can't send email
    private readonly emails: AccountEmails | null,
    // Where the website runs, e.g. http://localhost:5173
    private readonly appUrl: string,
  ) {}

  // Returns nothing either way, so nobody can use this to find out who has an account
  async execute(email: string): Promise<void> {
    if (!this.emails) throw new PasswordResetUnavailableError();

    const user = await this.users.findByEmail(email.trim().toLowerCase());
    if (!user) return;

    const { token, hash } = this.tokens.create();
    await this.links.replaceForUser({
      userId: user.id,
      tokenHash: hash,
      expiresAt: resetLinkExpiry(this.clock.now()),
    });

    const link = `${this.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.emails.sendPasswordResetLink(
      { email: user.email, firstName: user.firstName, username: user.username },
      link,
    );
  }
}
