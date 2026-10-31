import { createHash, randomBytes } from "node:crypto";
import type { SecretTokens } from "../../application/ports/SecretTokens.js";

// 32 random bytes (256 bits): impossible to guess. Stored only as a SHA-256 hash.
export class CryptoSecretTokens implements SecretTokens {
  create() {
    const token = randomBytes(32).toString("base64url");
    return { token, hash: this.hash(token) };
  }

  hash(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
}
