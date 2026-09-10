import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const DEFAULT_USER_ID = 1;

async function seed() {
  try {
    console.log("Starting database seed...");

    // Ensure user exists
    await pool.query(
      `INSERT INTO "User" (id, email, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [DEFAULT_USER_ID, "trish@example.com", "Trish Nguyen"]
    );
    console.log("User created or already exists");

    // Add sample accounts
    await pool.query(
      `INSERT INTO "Account" ("userId", name, balance, type, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW()) ON CONFLICT DO NOTHING`,
      [DEFAULT_USER_ID, "Checking", 5500, "checking"]
    );
    await pool.query(
      `INSERT INTO "Account" ("userId", name, balance, type, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW()) ON CONFLICT DO NOTHING`,
      [DEFAULT_USER_ID, "Savings", 15000, "savings"]
    );
    console.log("Accounts added");

    // Add sample transactions
    const transactions = [
      { amount: 2500, type: "income", category: "salary" },
      { amount: 45.99, type: "expense", category: "food" },
      { amount: 120, type: "expense", category: "entertainment" },
      { amount: 85, type: "expense", category: "utilities" },
      { amount: 500, type: "income", category: "business" },
      { amount: 25.50, type: "expense", category: "food" },
    ];

    for (let i = 0; i < transactions.length; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      await pool.query(
        `INSERT INTO "Transaction" ("userId", amount, type, category, date, "createdAt")
         VALUES ($1, $2, $3, $4, $5, NOW()) ON CONFLICT DO NOTHING`,
        [DEFAULT_USER_ID, transactions[i].amount, transactions[i].type, transactions[i].category, date]
      );
    }
    console.log("Transactions added");

    // Add sample investment accounts
    const investmentAccounts = [
      { name: "Fidelity Brokerage", accountType: "Brokerage" },
      { name: "Roth IRA", accountType: "Roth IRA" },
      { name: "401k", accountType: "401k" },
    ];

    const accountIds: number[] = [];
    for (const account of investmentAccounts) {
      const result = await pool.query(
        `INSERT INTO "InvestmentAccount" ("userId", name, "accountType", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW()) ON CONFLICT DO NOTHING
         RETURNING id`,
        [DEFAULT_USER_ID, account.name, account.accountType]
      );
      if (result.rows.length > 0) {
        accountIds.push(result.rows[0].id);
      }
    }

    // If accounts already exist, fetch them
    if (accountIds.length === 0) {
      const existingAccounts = await pool.query(
        `SELECT id FROM "InvestmentAccount" WHERE "userId" = $1 ORDER BY "createdAt" ASC`,
        [DEFAULT_USER_ID]
      );
      accountIds.push(...existingAccounts.rows.map((row: any) => row.id));
    }
    console.log("Investment accounts added");

    // Add sample investments
    const investments = [
      { name: "Apple Stock", value: 5000, type: "stock", accountIndex: 0 },
      { name: "S&P 500 ETF", value: 8500, type: "etf", accountIndex: 1 },
      { name: "Bitcoin", value: 3200, type: "crypto", accountIndex: 2 },
    ];

    for (const inv of investments) {
      const accountId = accountIds[inv.accountIndex] || accountIds[0];
      await pool.query(
        `INSERT INTO "Investment" ("userId", "investmentAccountId", name, value, type, date, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [DEFAULT_USER_ID, accountId, inv.name, inv.value, inv.type]
      );
    }
    console.log("Investments added");

    // Add sample debts
    const debts = [
      { name: "Student Loan", amount: 8000, type: "student" },
      { name: "Credit Card", amount: 2500, type: "credit" },
    ];

    for (const debt of debts) {
      await pool.query(
        `INSERT INTO "Debt" ("userId", name, amount, type, date, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [DEFAULT_USER_ID, debt.name, debt.amount, debt.type]
      );
    }
    console.log("Debts added");

    // Add sample savings goals
    const savingsGoals = [
      { name: "Vacation", targetAmount: 5000, currentAmount: 2500 },
      { name: "Emergency Fund", targetAmount: 10000, currentAmount: 7200 },
      { name: "New Car", targetAmount: 30000, currentAmount: 12000 },
    ];

    for (const goal of savingsGoals) {
      await pool.query(
        `INSERT INTO "SavingsGoal" ("userId", name, "targetAmount", "currentAmount", date, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [DEFAULT_USER_ID, goal.name, goal.targetAmount, goal.currentAmount]
      );
    }
    console.log("Savings goals added");

    // Add sample budgets for current month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const budgets = [
      { category: "food", limit: 500 },
      { category: "entertainment", limit: 300 },
      { category: "utilities", limit: 200 },
    ];

    for (const budget of budgets) {
      await pool.query(
        `INSERT INTO "Budget" ("userId", category, "limit", spent, month, year, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [DEFAULT_USER_ID, budget.category, budget.limit, 0, currentMonth, currentYear]
      );
    }
    console.log("Budgets added");

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
