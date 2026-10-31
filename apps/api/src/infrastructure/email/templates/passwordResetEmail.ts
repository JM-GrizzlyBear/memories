import { PASSWORD_RESET_MINUTES } from "@memories/shared";
import type { EmailRecipient } from "../../../application/ports/AccountEmails.js";
import { box, button, escapeHtml, layout, paragraph } from "./layout.js";

export function passwordResetEmail(to: EmailRecipient, link: string) {
  const subject = "Reset your Memories password";
  const name = escapeHtml(to.firstName);
  const username = escapeHtml(to.username);

  const html = layout({
    title: "Reset your password",
    preview: `Choose a new password. The link works for ${PASSWORD_RESET_MINUTES} minutes.`,
    body: [
      paragraph(`Hi ${name},`),
      paragraph(
        `Someone asked to reset the password for <strong>@${username}</strong>. If it was you, choose a new one here:`,
      ),
      `<div style="margin:28px 0 0">${button(link, "Choose a new password")}</div>`,
      paragraph(
        `The button works for <strong style="color:#141414">${PASSWORD_RESET_MINUTES} minutes</strong> and only once. Asking again sends a new link and the old one stops working.`,
        { muted: true, small: true },
      ),
      paragraph(
        `Button not working? Copy this link into your browser:<br><span style="word-break:break-all;color:#141414">${escapeHtml(link)}</span>`,
        { muted: true, small: true },
      ),
      box(
        `<strong style="color:#141414">Didn't ask for this?</strong> You can ignore this email. Your password stays the same, and nobody can change it without this link.`,
      ),
    ].join("\n"),
    footer: `You got this email because someone entered ${escapeHtml(to.email)} on the Forgot password page.`,
  });

  const text = [
    `Hi ${to.firstName},`,
    "",
    `Someone asked to reset the password for @${to.username}. If it was you, choose a new one here:`,
    link,
    "",
    `The link works for ${PASSWORD_RESET_MINUTES} minutes and only once.`,
    "",
    "Didn't ask for this? Ignore this email. Your password stays the same.",
    "",
    "Memories",
  ].join("\n");

  return { subject, html, text };
}
