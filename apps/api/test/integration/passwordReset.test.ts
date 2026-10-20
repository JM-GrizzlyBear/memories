import request from "supertest";
import { describe, expect, it } from "vitest";
import { APP_URL, NEW_PASSWORD, resetBody } from "../fixtures/passwordReset.js";
import { PASSWORD, USERS } from "./support/seed.js";
import { useTestApp } from "./support/testApp.js";

const t = useTestApp();

async function askForLink(email: string) {
  return await request(t.app).post("/api/auth/forgot-password").send({ email });
}

async function logIn(password: string) {
  return await request(t.app)
    .post("/api/auth/login")
    .send({ usernameOrEmail: "maria", password });
}

describe("asking for a reset link", () => {
  it("says it's available when the server can send email", async () => {
    const response = await request(t.app).get("/api/auth/password-reset");
    expect(response.body).toEqual({ available: true });
  });

  it("emails a link to the account's owner, whatever capitals they type", async () => {
    const response = await askForLink("MARIA@Example.com");
    expect(response.status).toBe(202);

    expect(t.emails.sent).toHaveLength(1);
    const [email] = t.emails.sent;
    expect(email.kind).toBe("passwordReset");
    expect(email.to).toMatchObject({
      email: "maria@example.com",
      firstName: "Maria",
      username: "maria",
    });
    expect(email.link?.startsWith(`${APP_URL}/reset-password?token=`)).toBe(
      true,
    );
  });

  it("answers the same for an email with no account, and sends nothing", async () => {
    const response = await askForLink("nobody@example.com");
    expect(response.status).toBe(202);
    expect(response.body).toEqual((await askForLink("maria@example.com")).body);
    expect(t.emails.sent.map((e) => e.to.email)).toEqual(["maria@example.com"]);
  });

  it("checks the email", async () => {
    const response = await askForLink("not-an-email");
    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveProperty("email");
  });

  it("only stores a hash of the link's secret", async () => {
    await askForLink("maria@example.com");
    const token = t.emails.lastResetToken();
    const rows = await t.sql<{ token_hash: string }>(
      "SELECT token_hash FROM password_reset_links",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).not.toBe(token);
    expect(rows[0].token_hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("opening the link", () => {
  it("says whose account it is", async () => {
    await askForLink("maria@example.com");
    const response = await request(t.app)
      .post("/api/auth/reset-password/check")
      .send({ token: t.emails.lastResetToken() });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      username: "maria",
      email: "maria@example.com",
    });
  });

  it("stops working after 30 minutes", async () => {
    await askForLink("maria@example.com");
    const token = t.emails.lastResetToken();

    t.clock.advanceMinutes(29);
    expect(
      (
        await request(t.app)
          .post("/api/auth/reset-password/check")
          .send({ token })
      ).status,
    ).toBe(200);

    t.clock.advanceMinutes(1);
    const expired = await request(t.app)
      .post("/api/auth/reset-password/check")
      .send({ token });
    expect(expired.status).toBe(400);
    expect(expired.body.code).toBe("invalid_link");
  });

  it("only the newest email's link works", async () => {
    await askForLink("maria@example.com");
    const first = t.emails.lastResetToken();
    await askForLink("maria@example.com");
    const second = t.emails.lastResetToken();

    expect(
      (
        await request(t.app)
          .post("/api/auth/reset-password/check")
          .send({ token: first })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(t.app)
          .post("/api/auth/reset-password/check")
          .send({ token: second })
      ).status,
    ).toBe(200);
  });

  it("a made-up link doesn't work", async () => {
    const response = await request(t.app)
      .post("/api/auth/reset-password/check")
      .send({ token: "made-up" });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe("invalid_link");
  });
});

describe("choosing a new password", () => {
  it("changes the password, logs out every device, and sends the heads-up email", async () => {
    const elsewhere = await t.as("maria"); // Maria is logged in on another device
    await askForLink("maria@example.com");
    const token = t.emails.lastResetToken();

    const response = await request(t.app)
      .post("/api/auth/reset-password")
      .send(resetBody(token));
    expect(response.status).toBe(204);

    expect((await elsewhere.get("/api/auth/me")).status).toBe(401);
    expect((await logIn(PASSWORD)).status).toBe(401);
    expect((await logIn(NEW_PASSWORD)).status).toBe(200);

    const changed = t.emails.sent.find((e) => e.kind === "passwordChanged");
    expect(changed?.to.email).toBe("maria@example.com");
  });

  it("works only once", async () => {
    await askForLink("maria@example.com");
    const token = t.emails.lastResetToken();
    expect(
      (
        await request(t.app)
          .post("/api/auth/reset-password")
          .send(resetBody(token))
      ).status,
    ).toBe(204);

    const again = await request(t.app)
      .post("/api/auth/reset-password")
      .send(
        resetBody(token, {
          newPassword: "another-password",
          confirmPassword: "another-password",
        }),
      );
    expect(again.status).toBe(400);
    expect(again.body.code).toBe("invalid_link");
    expect((await logIn(NEW_PASSWORD)).status).toBe(200);
  });

  it("checks the new password before using up the link", async () => {
    await askForLink("maria@example.com");
    const token = t.emails.lastResetToken();

    const mismatch = await request(t.app)
      .post("/api/auth/reset-password")
      .send(resetBody(token, { confirmPassword: "something-else" }));
    expect(mismatch.status).toBe(400);
    expect(mismatch.body.errors).toHaveProperty("confirmPassword");

    const short = await request(t.app)
      .post("/api/auth/reset-password")
      .send(
        resetBody(token, { newPassword: "short", confirmPassword: "short" }),
      );
    expect(short.status).toBe(400);
    expect(short.body.errors).toHaveProperty("newPassword");

    // The link still works after those mistakes
    expect(
      (
        await request(t.app)
          .post("/api/auth/reset-password")
          .send(resetBody(token))
      ).status,
    ).toBe(204);
  });

  it("doesn't touch anyone else's account", async () => {
    await askForLink("maria@example.com");
    await request(t.app)
      .post("/api/auth/reset-password")
      .send(resetBody(t.emails.lastResetToken()));
    const ana = await request(t.app)
      .post("/api/auth/login")
      .send({ usernameOrEmail: "ana", password: PASSWORD });
    expect(ana.status).toBe(200);
  });
});

describe("changing the password in Settings", () => {
  it("also sends the heads-up email and logs out other devices", async () => {
    const elsewhere = await t.as("maria");
    const here = await t.as("maria");

    const response = await here.put("/api/account/password").send({
      currentPassword: PASSWORD,
      newPassword: NEW_PASSWORD,
      confirmPassword: NEW_PASSWORD,
    });
    expect(response.status).toBe(204);

    expect((await here.get("/api/auth/me")).status).toBe(200);
    expect((await elsewhere.get("/api/auth/me")).status).toBe(401);
    expect(t.emails.sent).toEqual([
      expect.objectContaining({
        kind: "passwordChanged",
        to: expect.objectContaining({ username: USERS.maria.username }),
      }),
    ]);
  });
});
