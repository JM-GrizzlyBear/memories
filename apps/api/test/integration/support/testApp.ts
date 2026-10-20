import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Pool } from "pg";
import request from "supertest";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { buildApp } from "../../../src/buildApp.js";
import { createPool } from "../../../src/infrastructure/database/pool.js";
import { BcryptPasswordHasher } from "../../../src/infrastructure/security/BcryptPasswordHasher.js";
import { LocalPhotoStorage } from "../../../src/infrastructure/storage/LocalPhotoStorage.js";
import { FakeAccountEmails } from "../../fixtures/accountEmails.js";
import { FakeClock } from "../../fixtures/clock.js";
import { APP_URL } from "../../fixtures/passwordReset.js";
import { PASSWORD, resetDatabase, type Username } from "./seed.js";
import { testDatabaseUrl } from "./testDatabase.js";

export interface TestContext {
  pool: Pool;
  app: ReturnType<typeof buildApp>["app"];
  // Emails the app "sent" (null when the app was built without email)
  emails: FakeAccountEmails;
  clock: FakeClock;
  // A logged-in browser for this person (keeps their cookie)
  as: (username: Username) => Promise<ReturnType<typeof request.agent>>;
  sql: <T extends object = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ) => Promise<T[]>;
}

// Call once at the top of a test file: the real app on the test database,
// reset to the seed data before every test
export function useTestApp(
  options: { withEmail?: boolean; forgotPasswordLimit?: number } = {},
): TestContext {
  const context = {} as TestContext;
  let uploadsDir = "";

  beforeAll(() => {
    uploadsDir = mkdtempSync(path.join(os.tmpdir(), "memories-test-"));
    context.pool = createPool(testDatabaseUrl());
    context.emails = new FakeAccountEmails();
    context.clock = new FakeClock();
    context.app = buildApp({
      pool: context.pool,
      sessionSecret: "test-secret",
      photoStorage: new LocalPhotoStorage(uploadsDir),
      passwordHasher: new BcryptPasswordHasher(4),
      isProduction: false,
      uploadsDir,
      accountEmails: options.withEmail === false ? null : context.emails,
      appUrl: APP_URL,
      clock: context.clock,
      forgotPasswordLimit: options.forgotPasswordLimit ?? 1000,
    }).app;

    context.as = async (username) => {
      const agent = request.agent(context.app);
      const response = await agent
        .post("/api/auth/login")
        .send({ usernameOrEmail: username, password: PASSWORD });
      if (response.status !== 200) {
        throw new Error(`Couldn't log in as ${username}: ${response.status}`);
      }
      return agent;
    };

    context.sql = async (text, values = []) =>
      (await context.pool.query(text, values)).rows;
  });

  beforeEach(async () => {
    context.emails.clear();
    context.clock.reset();
    await resetDatabase(context.pool);
  });

  afterAll(async () => {
    await context.pool.end();
    rmSync(uploadsDir, { recursive: true, force: true });
  });

  return context;
}
