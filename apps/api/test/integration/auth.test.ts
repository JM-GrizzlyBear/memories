import { describe, expect, it } from "vitest";
import request from "supertest";
import { useTestApp } from "./support/testApp.js";

const t = useTestApp();

const newUser = {
  username: "dana",
  email: "dana@example.com",
  password: "a-good-password",
  firstName: "Dana",
  lastName: "Uy",
  birthday: "2000-01-10",
};

describe("register", () => {
  it("creates an account you can log in with", async () => {
    const response = await request(t.app)
      .post("/api/auth/register")
      .send(newUser);
    expect(response.status).toBe(201);
    // New people only take messages from friends until they change it
    expect(response.body.user).toMatchObject({
      username: "dana",
      messagePrivacy: "friends",
    });
    // Never sends the password hash back
    expect(response.body.user.passwordHash).toBeUndefined();

    const agent = request.agent(t.app);
    const login = await agent
      .post("/api/auth/login")
      .send({ usernameOrEmail: "dana", password: newUser.password });
    expect(login.status).toBe(200);
    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.username).toBe("dana");
  });

  it("refuses a username that's taken", async () => {
    const response = await request(t.app)
      .post("/api/auth/register")
      .send({ ...newUser, username: "maria" });
    expect(response.status).toBe(409);
  });

  it("checks the fields", async () => {
    const response = await request(t.app)
      .post("/api/auth/register")
      .send({ ...newUser, email: "not-an-email", password: "short" });
    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveProperty("email");
    expect(response.body.errors).toHaveProperty("password");
  });
});

describe("log in and out", () => {
  it("logs in with a username or an email", async () => {
    for (const usernameOrEmail of ["maria", "maria@example.com"]) {
      const response = await request(t.app)
        .post("/api/auth/login")
        .send({ usernameOrEmail, password: "password123" });
      expect(response.status).toBe(200);
    }
  });

  it("says the same thing for a wrong password and an unknown person", async () => {
    const wrongPassword = await request(t.app)
      .post("/api/auth/login")
      .send({ usernameOrEmail: "maria", password: "wrong-password" });
    const nobody = await request(t.app)
      .post("/api/auth/login")
      .send({ usernameOrEmail: "nobody", password: "wrong-password" });
    expect(wrongPassword.status).toBe(401);
    expect(nobody.status).toBe(401);
    expect(wrongPassword.body.error).toBe(nobody.body.error);
  });

  it("logging out ends the session", async () => {
    const maria = await t.as("maria");
    expect((await maria.post("/api/auth/logout")).status).toBe(204);
    expect((await maria.get("/api/auth/me")).status).toBe(401);
  });

  it("everything else needs a login", async () => {
    expect((await request(t.app).get("/api/memories")).status).toBe(401);
    expect((await request(t.app).get("/api/conversations")).status).toBe(401);
  });
});
