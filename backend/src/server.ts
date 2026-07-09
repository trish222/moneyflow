/**
 * Entry point for backend server
 * - creates express server
 * - sets up middleware
 * - defines routes
 * - starts server on specified port
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

const DEFAULT_USER_ID = 1;

app.get("/", (_req, res) => {
  res.json({ message: "MoneyFlow API is running" });
});

app.get("/api/dashboard/metrics", async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = DEFAULT_USER_ID;

    const startDate = month && year
      ? new Date(Number(year), Number(month) - 1, 1)
      : year
      ? new Date(Number(year), 0, 1)
      : new Date(new Date().getFullYear(), 0, 1);

    const endDate = month && year
      ? new Date(Number(year), Number(month), 0, 23, 59, 59)
      : year
      ? new Date(Number(year), 11, 31, 23, 59, 59)
      : new Date();

    const accountsResult = await pool.query(
      "SELECT balance FROM \"Account\" WHERE \"userId\" = $1",
      [userId]
    );
    const accounts = accountsResult.rows;


    const investmentsResult = await pool.query(
      "SELECT value FROM \"Investment\" WHERE \"userId\" = $1 AND date >= $2 AND date <= $3",
      [userId, startDate, endDate]
    );
    const investments = investmentsResult.rows;

    const debtsResult = await pool.query(
      "SELECT amount FROM \"Debt\" WHERE \"userId\" = $1 AND date >= $2 AND date <= $3",
      [userId, startDate, endDate]
    );
    const debts = debtsResult.rows;

    const savingsResult = await pool.query(
      "SELECT \"currentAmount\" FROM \"SavingsGoal\" WHERE \"userId\" = $1",
      [userId]
    );
    const savingsGoals = savingsResult.rows;

    const netWorth =
      accounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0) -
      debts.reduce((sum: number, debt: any) => sum + (debt.amount || 0), 0);

    const availableFunds = accounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);
    const totalDebts = debts.reduce((sum: number, debt: any) => sum + (debt.amount || 0), 0);
    const totalSavings = savingsGoals.reduce((sum: number, goal: any) => sum + (goal.currentAmount || 0), 0);
    const investmentsValue = investments.reduce((sum: number, inv: any) => sum + (inv.value || 0), 0);

    res.json({
      netWorth: Math.round(netWorth * 100) / 100,
      availableFunds: Math.round(availableFunds * 100) / 100,
      debts: Math.round(totalDebts * 100) / 100,
      savings: Math.round(totalSavings * 100) / 100,
      investmentsValue: Math.round(investmentsValue * 100) / 100,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

app.post("/api/accounts", async (req, res) => {
  try {
    const { name, balance, type } = req.body;
    const result = await pool.query(
      "INSERT INTO \"Account\" (\"userId\", name, balance, type, \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *",
      [DEFAULT_USER_ID, name, parseFloat(balance), type]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create account" });
  }
});

app.post("/api/transactions", async (req, res) => {
  try {
    const { amount, type, category, date } = req.body;
    const result = await pool.query(
      "INSERT INTO \"Transaction\" (\"userId\", amount, type, category, date, \"createdAt\") VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *",
      [DEFAULT_USER_ID, parseFloat(amount), type, category, new Date(date)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

app.post("/api/investments", async (req, res) => {
  try {
    const { name, value, type, date } = req.body;
    const result = await pool.query(
      "INSERT INTO \"Investment\" (\"userId\", name, value, type, date, \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *",
      [DEFAULT_USER_ID, name, parseFloat(value), type, new Date(date)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create investment" });
  }
});

app.post("/api/debts", async (req, res) => {
  try {
    const { name, amount, type, date } = req.body;
    const result = await pool.query(
      "INSERT INTO \"Debt\" (\"userId\", name, amount, type, date, \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *",
      [DEFAULT_USER_ID, name, parseFloat(amount), type, new Date(date)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create debt" });
  }
});

app.post("/api/savings-goals", async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, date } = req.body;
    const result = await pool.query(
      "INSERT INTO \"SavingsGoal\" (\"userId\", name, \"targetAmount\", \"currentAmount\", date, \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *",
      [DEFAULT_USER_ID, name, parseFloat(targetAmount), parseFloat(currentAmount), new Date(date)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create savings goal" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
