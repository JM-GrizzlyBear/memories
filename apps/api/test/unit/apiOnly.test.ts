import { Router, type RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/presentation/http/app.js";

// The API on Render serves the API only: the website lives on Netlify
const passThrough: RequestHandler = (_req, _res, next) => next();

const app = createApp({
  authRouter: Router(),
  accountRouter: Router(),
  memoryRouter: Router(),
  friendRouter: Router(),
  userRouter: Router(),
  notificationRouter: Router(),
  albumRouter: Router(),
  conversationRouter: Router(),
  sessionMiddleware: passThrough,
  trustProxy: 0,
  uploadsDir: "uploads",
});

describe("the API's own address (Render)", () => {
  it("answers the health check", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("has no website: pages are a 404", async () => {
    for (const page of ["/", "/login", "/u/ana", "/favicon.ico"]) {
      const response = await request(app).get(page);
      expect(response.status).toBe(404);
      expect(response.text).not.toContain('<div id="root">');
    }
  });
});
