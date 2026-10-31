import nodemailer, { type Transporter } from "nodemailer";
import type {
  AccountEmails,
  EmailRecipient,
} from "../../application/ports/AccountEmails.js";
import { passwordChangedEmail } from "./templates/passwordChangedEmail.js";
import { passwordResetEmail } from "./templates/passwordResetEmail.js";

export interface SmtpSettings {
  host: string;
  port: number;
  from: string;
  // Where the website runs, for links in the emails
  appUrl: string;
}

// Sends the account emails through an SMTP server. Locally that's Mailpit,
// which keeps every email in its inbox (http://localhost:8025) instead of delivering it.
export class SmtpAccountEmails implements AccountEmails {
  private readonly transport: Transporter;

  constructor(private readonly settings: SmtpSettings) {
    this.transport = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: false,
    });
  }

  private async send(
    to: string,
    email: { subject: string; html: string; text: string },
  ) {
    await this.transport.sendMail({ from: this.settings.from, to, ...email });
  }

  async sendPasswordResetLink(to: EmailRecipient, link: string) {
    await this.send(to.email, passwordResetEmail(to, link));
  }

  async sendPasswordChanged(to: EmailRecipient, changedAt: Date) {
    try {
      await this.send(
        to.email,
        passwordChangedEmail(to, changedAt, {
          forgotPasswordUrl: `${this.settings.appUrl}/forgot-password`,
          timeZone: "Asia/Manila",
          timeZoneLabel: "Philippine time",
        }),
      );
    } catch (error) {
      // The password already changed; a missing heads-up email mustn't turn that into an error
      console.error("Couldn't send the password-changed email:", error);
    }
  }
}
