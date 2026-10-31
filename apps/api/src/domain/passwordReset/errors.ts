// Expired, already used, replaced by a newer email, or never existed: the same answer for all
export class InvalidResetLinkError extends Error {
  constructor() {
    super("This link doesn't work anymore. Ask for a new one.");
    this.name = "InvalidResetLinkError";
  }
}

// This server can't send email (the live site on free hosting)
export class PasswordResetUnavailableError extends Error {
  constructor() {
    super("Password reset isn't available on this site yet.");
    this.name = "PasswordResetUnavailableError";
  }
}
