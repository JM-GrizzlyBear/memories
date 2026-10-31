import type { EmailRecipient } from "../../../application/ports/AccountEmails.js";
import { box, button, escapeHtml, layout, paragraph } from "./layout.js";

// "Oct 21, 2026 at 12:31 AM" in Philippine time
export function formatChangedAt(date: Date, timeZone: string) {
  const day = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
  return `${day} at ${time}`;
}

export function passwordChangedEmail(
  to: EmailRecipient,
  changedAt: Date,
  options: {
    forgotPasswordUrl: string;
    timeZone: string;
    timeZoneLabel: string;
  },
) {
  const subject = "Your Memories password was changed";
  const when = `${formatChangedAt(changedAt, options.timeZone)} (${options.timeZoneLabel})`;

  const html = layout({
    title: "Your password was changed",
    preview: `Your password was changed on ${when}.`,
    body: [
      paragraph(`Hi ${escapeHtml(to.firstName)},`),
      paragraph(
        `The password for <strong>@${escapeHtml(to.username)}</strong> was changed on <strong>${escapeHtml(when)}</strong>. Every other phone and computer was logged out.`,
      ),
      paragraph("If this was you, there's nothing else to do."),
      box(
        `<strong style="color:#141414">Wasn't you?</strong> Someone may know your email password. Reset your Memories password right away:<div style="margin-top:12px">${button(options.forgotPasswordUrl, "Reset my password")}</div>`,
      ),
    ].join("\n"),
    footer:
      "We send this email every time your password changes, so you always know.",
  });

  const text = [
    `Hi ${to.firstName},`,
    "",
    `The password for @${to.username} was changed on ${when}. Every other phone and computer was logged out.`,
    "",
    "If this was you, there's nothing else to do.",
    `Wasn't you? Reset your password right away: ${options.forgotPasswordUrl}`,
    "",
    "Memories",
  ].join("\n");

  return { subject, html, text };
}
