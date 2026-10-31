import request from "supertest";
import { describe, expect, it } from "vitest";
import { useTestApp } from "./support/testApp.js";

// The live site on free hosting: no email server
const t = useTestApp({ withEmail: false });

describe("forgot password without email", () => {
  it("says it isn't available", async () => {
    expect((await request(t.app).get("/api/auth/password-reset")).body).toEqual(
      { available: false },
    );

    const response = await request(t.app)
      .post("/api/auth/forgot-password")
      .send({ email: "maria@example.com" });
    expect(response.status).toBe(503);
    expect(response.body.code).toBe("unavailable");
  });
});
