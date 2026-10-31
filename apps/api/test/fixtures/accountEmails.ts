import type {
  AccountEmails,
  EmailRecipient,
} from "../../src/application/ports/AccountEmails.js";

export interface SentEmail {
  kind: "passwordReset" | "passwordChanged";
  to: EmailRecipient;
  link?: string;
  changedAt?: Date;
}

// Keeps every "sent" email in a list instead of sending it, so tests can read them
export class FakeAccountEmails implements AccountEmails {
  sent: SentEmail[] = [];

  async sendPasswordResetLink(to: EmailRecipient, link: string) {
    this.sent.push({ kind: "passwordReset", to, link });
  }

  async sendPasswordChanged(to: EmailRecipient, changedAt: Date) {
    this.sent.push({ kind: "passwordChanged", to, changedAt });
  }

  clear() {
    this.sent = [];
  }

  // The token from the newest reset email
  lastResetToken() {
    const email = this.sent.filter((e) => e.kind === "passwordReset").at(-1);
    if (!email?.link) throw new Error("No reset email was sent");
    return new URL(email.link).searchParams.get("token") ?? "";
  }
}
