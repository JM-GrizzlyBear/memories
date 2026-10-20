// Random secrets for links sent by email
export interface SecretTokens {
  // A new secret to put in the link, and the hash to store instead of it
  create(): { token: string; hash: string };
  hash(token: string): string;
}
