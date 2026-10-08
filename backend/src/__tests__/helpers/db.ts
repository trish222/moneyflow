/**
 * Test database helpers.
 * - resetDatabase(): truncates all tables (queries pg_tables), validates _test guard
 * - seedTestUser(): creates user with real password hashing and returns tokens
 * - seedTestAccount(): creates account; balance defaults to 0 (use opening-balance endpoint for starting balances)
 */

import { prisma } from "../../server.js";
import { AuthService } from "../../services/authService.js";

export { prisma };

export async function resetDatabase() {
  // Safety guard: do not run against production DB
  if (!process.env.DATABASE_URL?.includes("_test")) {
    throw new Error(
      "🛑 CRITICAL: resetDatabase() attempted on non-test DB!\n" +
        `DATABASE_URL: ${process.env.DATABASE_URL}`
    );
  }

  // Query table names from information_schema (exclude _prisma_migrations)
  const result = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
    ORDER BY tablename
  `;

  // Truncate each table with RESTART IDENTITY CASCADE
  for (const { tablename } of result) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE`
    );
  }

  console.log(`✓ Database reset (${result.length} tables truncated)`);
}

interface SeedUserOptions {
  email?: string;
  password?: string;
}

export async function seedTestUser(opts: SeedUserOptions = {}) {
  const email = opts.email ?? "test@example.com";
  const password = opts.password ?? "TestPass123!";

  // Validate password strength
  const validation = AuthService.validatePasswordStrength(password);
  if (!validation.valid) {
    throw new Error(
      `Invalid test password: ${validation.errors.join(", ")}`
    );
  }

  // Hash password using real AuthService
  const passwordHash = await AuthService.hashPassword(password);

  // Create user directly (bypass register endpoint for test speed)
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: email.split("@")[0] ?? email,
    },
  });

  // Generate tokens for immediate use in tests
  const tokens = AuthService.generateTokens(user.id, user.email);

  return {
    user,
    email,
    password, // Return plaintext for test calls
    ...tokens,
  };
}

interface SeedAccountOptions {
  name?: string;
  type?: string;
}

export async function seedTestAccount(userId: number, opts: SeedAccountOptions = {}) {
  // balance defaults to 0: use the opening-balance endpoint for starting balances
  const account = await prisma.account.create({
    data: {
      userId,
      name: opts.name ?? "Test Account",
      type: opts.type ?? "checking",
      balance: 0,
    },
  });
  return account;
}
