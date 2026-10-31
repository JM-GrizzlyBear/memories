import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Router, type RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/presentation/http/app.js";

// A built website with just an index page
const webDistDir = mkdtempSync(path.join(tmpdir(), "memories-web-"));
writeFileSync(path.join(webDistDir, "index.html"), "<h1>Memories</h1>");

const passThrough: RequestHandler = (_req, _res, next) => next();
const api = Router();
api.get("/me", (_req, res) => {
  res.json({ ok: true });
});

function appWith(appUrl: string) {
  return createApp({
    authRouter: api,
    accountRouter: Router(),
    memoryRouter: Router(),
    friendRouter: Router(),
    userRouter: Router(),
    notificationRouter: Router(),
    albumRouter: Router(),
    conversationRouter: Router(),
    sessionMiddleware: passThrough,
    trustProxy: 0,
    uploadsDir: webDistDir,
    webDistDir,
    appUrl,
  });
}

describe("the website on another address (Netlify)", () => {
  const app = appWith("https://memories-in-our-heart.netlify.app");

  it("sends page visits on the API's address to the same page there", async () => {
    const response = await request(app)
      .get("/u/ana?tab=album")
      .set("Host", "memories-hnhf.onrender.com");
    expect(response.status).toBe(301);
    expect(response.headers.location).toBe(
      "https://memories-in-our-heart.netlify.app/u/ana?tab=album",
    );
  });

  it("still answers the API (Netlify forwards it here)", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Host", "memories-hnhf.onrender.com");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it("doesn't redirect API calls that aren't GET either", async () => {
    const response = await request(app)
      .post("/api/auth/me")
      .set("Host", "memories-hnhf.onrender.com");
    expect(response.status).not.toBe(301);
  });
});

describe("the website on the same address (local Docker test)", () => {
  it("shows the website", async () => {
    const response = await request(appWith("http://localhost:8080"))
      .get("/u/ana")
      .set("Host", "localhost:8080");
    expect(response.status).toBe(200);
    expect(response.text).toContain("Memories");
  });
});
