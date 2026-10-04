import dotenv from "dotenv";
import path from "path";

// Always load .env.test with override (no NODE_ENV condition)
const envPath = path.resolve(process.cwd(), ".env.test");
dotenv.config({ path: envPath, override: true });

// Guard: throw immediately if DATABASE_URL doesn't contain _test
if (!process.env.DATABASE_URL?.includes("_test")) {
  throw new Error(
    "❌ SAFETY CHECK FAILED: DATABASE_URL does not contain '_test'\n" +
      "This would run tests against production or dev data. Aborting.\n" +
      `Got: ${process.env.DATABASE_URL}`
  );
}

console.log("✓ Test environment loaded (DATABASE_URL confirmed with _test)");
