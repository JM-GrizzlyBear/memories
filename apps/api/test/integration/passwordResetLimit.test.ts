import request from "supertest";
import { describe, expect, it } from "vitest";
import { useTestApp } from "./support/testApp.js";

// The real limit: 5 requests per visitor every 15 minutes
const t = useTestApp({ forgotPasswordLimit: 5 });

describe("asking for links over and over", () => {
  it("is stopped after 5 tries, so nobody can flood someone's inbox", async () => {
    for (let i = 0; i < 5; i++) {
      const response = await request(t.app)
        .post("/api/auth/forgot-password")
        .send({ email: "maria@example.com" });
      expect(response.status).toBe(202);
    }
    const blocked = await request(t.app)
      .post("/api/auth/forgot-password")
      .send({ email: "maria@example.com" });
    expect(blocked.status).toBe(429);
    expect(t.emails.sent).toHaveLength(5);
  });
});
