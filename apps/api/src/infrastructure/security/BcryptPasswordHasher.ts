import bcrypt from "bcryptjs";
import type { PasswordHasher } from "../../application/ports/PasswordHasher.js";

export class BcryptPasswordHasher implements PasswordHasher {
  // 12 rounds in the app; the tests use fewer so they stay fast
  constructor(private readonly saltRounds = 12) {}

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
