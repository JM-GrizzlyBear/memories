import { describe, expect, it } from "vitest";
import { RequestPasswordReset } from "../../src/application/user/RequestPasswordReset.js";
import { PasswordResetUnavailableError } from "../../src/domain/passwordReset/errors.js";
import {
  isResetLinkUsable,
  resetLinkExpiry,
} from "../../src/domain/passwordReset/rules.js";
import type { UserRepository } from "../../src/domain/user/UserRepository.js";
import { CryptoSecretTokens } from "../../src/infrastructure/security/CryptoSecretTokens.js";
import { escapeHtml } from "../../src/infrastructure/email/templates/layout.js";
import {
  formatChangedAt,
  passwordChangedEmail,
} from "../../src/infrastructure/email/templates/passwordChangedEmail.js";
import { passwordResetEmail } from "../../src/infrastructure/email/templates/passwordResetEmail.js";
import { FakeAccountEmails } from "../fixtures/accountEmails.js";
import { FakeClock } from "../fixtures/clock.js";

const now = new Date("2026-10-21T10:00:00Z");
const recipient = {
  email: "maria@example.com",
  firstName: "Maria",
  username: "maria",
};

describe("reset link rules", () => {
  it("expire 30 minutes after they're made", () => {
    expect(resetLinkExpiry(now).toISOString()).toBe("2026-10-21T10:30:00.000Z");
  });

  it("work once, until they expire", () => {
    const expiresAt = resetLinkExpiry(now);
    expect(isResetLinkUsable({ expiresAt, usedAt: null }, now)).toBe(true);
    expect(isResetLinkUsable({ expiresAt, usedAt: now }, now)).toBe(false);
    expect(isResetLinkUsable({ expiresAt, usedAt: null }, expiresAt)).toBe(
      false,
    );
  });
});

describe("secret tokens", () => {
  const tokens = new CryptoSecretTokens();

  it("are long, random and URL-safe", () => {
    const a = tokens.create();
    const b = tokens.create();
    expect(a.token).not.toBe(b.token);
    expect(a.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("hash the same way every time, and never equal the token", () => {
    const { token, hash } = tokens.create();
    expect(tokens.hash(token)).toBe(hash);
    expect(hash).not.toBe(token);
  });
});

describe("RequestPasswordReset", () => {
  const noUsers = {
    findByEmail: async () => null,
  } as unknown as UserRepository;
  const links = {
    replaceForUser: async () => {},
    findByTokenHash: async () => null,
    markUsed: async () => {},
  };

  it("sends nothing for an email with no account", async () => {
    const emails = new FakeAccountEmails();
    await new RequestPasswordReset(
      noUsers,
      links,
      new CryptoSecretTokens(),
      new FakeClock(),
      emails,
      "http://x",
    ).execute("nobody@example.com");
    expect(emails.sent).toEqual([]);
  });

  it("refuses when the server can't send email", async () => {
    const useCase = new RequestPasswordReset(
      noUsers,
      links,
      new CryptoSecretTokens(),
      new FakeClock(),
      null,
      "http://x",
    );
    await expect(useCase.execute("maria@example.com")).rejects.toThrow(
      PasswordResetUnavailableError,
    );
  });
});

describe("the emails", () => {
  it("reset email: has the link, the 30 minutes, and a plain-text version", () => {
    const email = passwordResetEmail(
      recipient,
      "http://localhost:5173/reset-password?token=abc",
    );
    expect(email.subject).toBe("Reset your Memories password");
    expect(email.html).toContain(
      "http://localhost:5173/reset-password?token=abc",
    );
    expect(email.html).toContain("30 minutes");
    expect(email.text).toContain(
      "http://localhost:5173/reset-password?token=abc",
    );
  });

  it("never lets a name inject HTML", () => {
    const email = passwordResetEmail(
      { ...recipient, firstName: '<img src=x onerror="alert(1)">' },
      "http://x",
    );
    expect(email.html).not.toContain("<img src=x");
    expect(escapeHtml(`<a href="x">'`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;",
    );
  });

  it("changed email: says when, in Philippine time, with a way to reset", () => {
    expect(
      formatChangedAt(new Date("2026-10-20T16:31:00Z"), "Asia/Manila"),
    ).toBe("Oct 21, 2026 at 12:31 AM");
    const email = passwordChangedEmail(recipient, now, {
      forgotPasswordUrl: "http://localhost:5173/forgot-password",
      timeZone: "Asia/Manila",
      timeZoneLabel: "Philippine time",
    });
    expect(email.html).toContain("Philippine time");
    expect(email.html).toContain("http://localhost:5173/forgot-password");
  });
});
