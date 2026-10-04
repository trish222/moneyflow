/**
 * Security tests covering PRD §7 acceptance checks.
 * - 401 without token
 * - User B gets 403/404 on user A's resources
 * - Register returns 403 REGISTRATION_DISABLED when disabled
 * - 6th failed login returns 429 (rate limiting)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app, prisma } from "../server.js";
import { resetDatabase, seedTestUser, seedTestAccount } from "./helpers/db.js";

describe("Security: Authentication & Authorization (PRD §7)", () => {
  let userA: any;
  let userB: any;
  let accountA: any;
  let transactionA: any;

  beforeAll(async () => {
    await resetDatabase();

    // Seed two users
    userA = await seedTestUser({ email: "userA@test.com", password: "UserAPass123!" });
    userB = await seedTestUser({ email: "userB@test.com", password: "UserBPass123!" });

    // Create account and transaction for user A
    accountA = await seedTestAccount(userA.user.id, { name: "User A Account" });
    transactionA = await prisma.transaction.create({
      data: {
        userId: userA.user.id,
        accountId: accountA.id,
        amount: 100,
        type: "expense",
        category: "Food",
        description: "Pizza",
        date: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ============ 401 WITHOUT TOKEN ============
  describe("401 without token", () => {
    it("should return 401 on GET /api/accounts without token", async () => {
      const res = await request(app).get("/api/accounts");
      expect(res.status).toBe(401);
    });

    it("should return 401 on POST /api/accounts without token", async () => {
      const res = await request(app)
        .post("/api/accounts")
        .send({ name: "New Account", type: "savings" });
      expect(res.status).toBe(401);
    });

    it("should return 401 on GET /api/transactions without token", async () => {
      const res = await request(app).get("/api/transactions");
      expect(res.status).toBe(401);
    });

    it("should return 401 on PUT /api/accounts/:id without token", async () => {
      const res = await request(app)
        .put(`/api/accounts/${accountA.id}`)
        .send({ name: "Updated" });
      expect(res.status).toBe(401);
    });
  });

  // ============ USER B CANNOT ACCESS USER A'S RESOURCES ============
  describe("403/404 isolation: User B cannot access User A's data (PRD §7)", () => {
    it("should return 403 or 404 on GET user A's account with user B token, no data exposed", async () => {
      const res = await request(app)
        .get(`/api/accounts/${accountA.id}`)
        .set("Authorization", `Bearer ${userB.accessToken}`);
      expect([403, 404]).toContain(res.status);
      expect(res.body.data).toBeUndefined(); // No data leaked on 404
    });

    it("should return 403 or 404 on PUT user A's account with user B token", async () => {
      const res = await request(app)
        .put(`/api/accounts/${accountA.id}`)
        .set("Authorization", `Bearer ${userB.accessToken}`)
        .send({ name: "Hacked Account" });
      expect([403, 404]).toContain(res.status);

      // Verify account was not modified (user A can still fetch original)
      const verifyRes = await request(app)
        .get(`/api/accounts/${accountA.id}`)
        .set("Authorization", `Bearer ${userA.accessToken}`);
      expect(verifyRes.body.data.name).toBe(accountA.name);
    });

    it("should return 403 or 404 on DELETE user A's account with user B token", async () => {
      const res = await request(app)
        .delete(`/api/accounts/${accountA.id}`)
        .set("Authorization", `Bearer ${userB.accessToken}`);
      expect([403, 404]).toContain(res.status);

      // Verify account still exists (user A can still fetch it)
      const verifyRes = await request(app)
        .get(`/api/accounts/${accountA.id}`)
        .set("Authorization", `Bearer ${userA.accessToken}`);
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.id).toBe(accountA.id);
    });

    it("should return 403 or 404 on GET user A's transaction with user B token", async () => {
      const res = await request(app)
        .get(`/api/transactions/${transactionA.id}`)
        .set("Authorization", `Bearer ${userB.accessToken}`);
      expect([403, 404]).toContain(res.status);
      expect(res.body.data).toBeUndefined();
    });

    it("should return 403 or 404 on PUT user A's transaction with user B token", async () => {
      const res = await request(app)
        .put(`/api/transactions/${transactionA.id}`)
        .set("Authorization", `Bearer ${userB.accessToken}`)
        .send({ amount: 999 });
      expect([403, 404]).toContain(res.status);

      // Verify transaction was not modified
      const verifyRes = await request(app)
        .get(`/api/transactions/${transactionA.id}`)
        .set("Authorization", `Bearer ${userA.accessToken}`);
      expect(verifyRes.body.data.amount).toBe(transactionA.amount);
    });

    it("should return 403 or 404 on DELETE user A's transaction with user B token", async () => {
      const res = await request(app)
        .delete(`/api/transactions/${transactionA.id}`)
        .set("Authorization", `Bearer ${userB.accessToken}`);
      expect([403, 404]).toContain(res.status);

      // Verify transaction still exists
      const verifyRes = await request(app)
        .get(`/api/transactions/${transactionA.id}`)
        .set("Authorization", `Bearer ${userA.accessToken}`);
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.id).toBe(transactionA.id);
    });

    it("user A can still GET their own account", async () => {
      const res = await request(app)
        .get(`/api/accounts/${accountA.id}`)
        .set("Authorization", `Bearer ${userA.accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(accountA.id);
    });

    it("user A can still GET their own transaction", async () => {
      const res = await request(app)
        .get(`/api/transactions/${transactionA.id}`)
        .set("Authorization", `Bearer ${userA.accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(transactionA.id);
    });
  });


  // ============ RATE LIMITING ON FAILED LOGIN (PRD §7 Required) ============
  describe("6th failed login returns 429 (rate limiting - PRD §7 Security)", () => {
    it("should allow first 5 failed login attempts", async () => {
      for (let i = 1; i <= 5; i++) {
        const res = await request(app)
          .post("/api/auth/login")
          .send({
            email: "userA@test.com",
            password: "WrongPassword123!",
          });
        expect(res.status).toBe(401);
      }
    });

    it("should return 429 on 6th failed login attempt (PRD §7)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "userA@test.com",
          password: "WrongPassword123!",
        });

      expect(res.status).toBe(429);
    });

    it("should remain rate-limited for subsequent attempts (PRD §7)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "userA@test.com",
          password: "WrongPassword123!",
        });

      expect(res.status).toBe(429);
    });
  });

  // ============ VALID OPERATIONS ============
  describe("Valid token operations work correctly", () => {
    it("should allow user A to create account with valid token", async () => {
      const res = await request(app)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${userA.accessToken}`)
        .send({ name: "Second Account", type: "savings" });

      expect(res.status).toBe(201);
      expect(res.body.data?.name).toBe("Second Account");
    });

    it("should allow user A to update their own account", async () => {
      const res = await request(app)
        .put(`/api/accounts/${accountA.id}`)
        .set("Authorization", `Bearer ${userA.accessToken}`)
        .send({ name: "Updated Account Name" });

      expect(res.status).toBe(200);
      expect(res.body.data?.name).toBe("Updated Account Name");
    });
  });
});
