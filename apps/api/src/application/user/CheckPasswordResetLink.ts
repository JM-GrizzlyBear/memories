import { isResetLinkUsable } from "../../domain/passwordReset/rules.js";
import type { PasswordResetRepository } from "../../domain/passwordReset/PasswordResetRepository.js";
import { InvalidResetLinkError } from "../../domain/passwordReset/errors.js";
import type { UserRepository } from "../../domain/user/UserRepository.js";
import type { Clock } from "../ports/Clock.js";
import type { SecretTokens } from "../ports/SecretTokens.js";

// Run when the reset page opens: whose link is it, and does it still work?
export class CheckPasswordResetLink {
  constructor(
    private readonly users: UserRepository,
    private readonly links: PasswordResetRepository,
    private readonly tokens: SecretTokens,
    private readonly clock: Clock,
  ) {}

  async execute(token: string) {
    const link = await this.links.findByTokenHash(this.tokens.hash(token));
    if (!link || !isResetLinkUsable(link, this.clock.now())) {
      throw new InvalidResetLinkError();
    }
    const user = await this.users.findById(link.userId);
    if (!user) throw new InvalidResetLinkError();
    return { link, user };
  }
}
