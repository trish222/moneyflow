/**
 * Registration disabled test.
 * Tests that registration returns 403 when ALLOW_REGISTRATION is not set.
 * Runs in isolation with a fresh app instance to control the environment.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { prisma, resetDatabase } from "./helpers/db.js";

let app: any;

describe("Registration Disabled (PRD §7 Security)", () => {
  beforeAll(async () => {
    await resetDatabase();

    // Clear module cache to get fresh imports with clean environment
    vi.resetModules();

    // Ensure ALLOW_REGISTRATION is NOT set (undefined)
    delete process.env.ALLOW_REGISTRATION;

    // Dynamically import app with fresh environment
    // This forces env.ts to re-parse process.env without ALLOW_REGISTRATION
    const serverModule = await import("../server.js");
    app = serverModule.app;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should return 403 REGISTRATION_DISABLED when ALLOW_REGISTRATION is not set (PRD §7)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "newuser@test.com",
        password: "NewUserPass123!",
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("REGISTRATION_DISABLED");
  });
});
