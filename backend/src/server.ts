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
    const { month, year, day } = req.query;
    const userId = DEFAULT_USER_ID;

    let startDate: Date, endDate: Date;

    if (day && month && year) {
      startDate = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0);
      endDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);
    } else if (month && year) {
      startDate = new Date(Number(year), Number(month) - 1, 1);
      endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
    } else if (year) {
      startDate = new Date(Number(year), 0, 1);
      endDate = new Date(Number(year), 11, 31, 23, 59, 59);
    } else {
      startDate = new Date(0);
      endDate = new Date();
    }

    const [accountsResult, investmentsResult, debtsResult, savingsResult] = await Promise.all([
      pool.query("SELECT balance FROM \"Account\" WHERE \"userId\" = $1", [userId]),
      pool.query("SELECT value FROM \"Investment\" WHERE \"userId\" = $1 AND date >= $2 AND date <= $3", [userId, startDate, endDate]),
      pool.query("SELECT amount FROM \"Debt\" WHERE \"userId\" = $1 AND date >= $2 AND date <= $3", [userId, startDate, endDate]),
      pool.query("SELECT \"currentAmount\" FROM \"SavingsGoal\" WHERE \"userId\" = $1", [userId]),
    ]);

    const accounts = accountsResult.rows;
    const investments = investmentsResult.rows;
    const debts = debtsResult.rows;
    const savingsGoals = savingsResult.rows;

    const availableFunds = accounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);
    const totalDebts = debts.reduce((sum: number, debt: any) => sum + (debt.amount || 0), 0);
    const netWorth = availableFunds - totalDebts;
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

// Account endpoints
app.get("/api/accounts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM \"Account\" WHERE \"userId\" = $1 ORDER BY \"createdAt\" DESC", [DEFAULT_USER_ID]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

app.post("/api/accounts", async (req, res) => {
  try {
    const { name, balance, type } = req.body;
    if (!name || balance === undefined || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const result = await pool.query(
      "INSERT INTO \"Account\" (\"userId\", name, balance, type, \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *",
      [DEFAULT_USER_ID, name, parseFloat(balance), type]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create account" });
  }
});

app.put("/api/accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, balance, type } = req.body;
    const result = await pool.query(
      "UPDATE \"Account\" SET name = $1, balance = $2, type = $3, \"updatedAt\" = NOW() WHERE id = $4 AND \"userId\" = $5 RETURNING *",
      [name, parseFloat(balance), type, id, DEFAULT_USER_ID]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Account not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update account" });
  }
});

app.delete("/api/accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM \"Account\" WHERE id = $1 AND \"userId\" = $2 RETURNING *", [id, DEFAULT_USER_ID]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Account not found" });
    res.json({ message: "Account deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// Transaction endpoints
app.get("/api/transactions", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM \"Transaction\" WHERE \"userId\" = $1 ORDER BY date DESC",
      [DEFAULT_USER_ID]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.post("/api/transactions", async (req, res) => {
  try {
    const { amount, type, category, date } = req.body;
    if (!amount || !type || !category || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const result = await pool.query(
      "INSERT INTO \"Transaction\" (\"userId\", amount, type, category, date, \"createdAt\") VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *",
      [DEFAULT_USER_ID, parseFloat(amount), type, category, new Date(date)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

app.put("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, category, date } = req.body;
    const result = await pool.query(
      "UPDATE \"Transaction\" SET amount = $1, type = $2, category = $3, date = $4 WHERE id = $5 AND \"userId\" = $6 RETURNING *",
      [parseFloat(amount), type, category, new Date(date), id, DEFAULT_USER_ID]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Transaction not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM \"Transaction\" WHERE id = $1 AND \"userId\" = $2 RETURNING *", [id, DEFAULT_USER_ID]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Transaction not found" });
    res.json({ message: "Transaction deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

// Investment endpoints
app.get("/api/investments", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM \"Investment\" WHERE \"userId\" = $1 ORDER BY date DESC", [DEFAULT_USER_ID]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch investments" });
  }
});

app.post("/api/investments", async (req, res) => {
  try {
    const { name, value, type, date, investmentAccountId } = req.body;
    if (!name || value === undefined || !type || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let accountId = investmentAccountId;
    if (!accountId) {
      const accountResult = await pool.query(
        "SELECT id FROM \"InvestmentAccount\" WHERE \"userId\" = $1 LIMIT 1",
        [DEFAULT_USER_ID]
      );
      if (accountResult.rows.length === 0) {
        return res.status(400).json({ error: "No investment account found. Create one first." });
      }
      accountId = accountResult.rows[0].id;
    }

    const result = await pool.query(
      "INSERT INTO \"Investment\" (\"userId\", \"investmentAccountId\", name, value, type, date, \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *",
      [DEFAULT_USER_ID, accountId, name, parseFloat(value), type, new Date(date)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create investment" });
  }
});

app.put("/api/investments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, value, type, date, investmentAccountId } = req.body;
    const result = await pool.query(
      "UPDATE \"Investment\" SET name = $1, value = $2, type = $3, date = $4, \"investmentAccountId\" = $5, \"updatedAt\" = NOW() WHERE id = $6 AND \"userId\" = $7 RETURNING *",
      [name, parseFloat(value), type, new Date(date), investmentAccountId, id, DEFAULT_USER_ID]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Investment not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update investment" });
  }
});

app.delete("/api/investments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM \"Investment\" WHERE id = $1 AND \"userId\" = $2 RETURNING *", [id, DEFAULT_USER_ID]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Investment not found" });
    res.json({ message: "Investment deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete investment" });
  }
});

// Investment Account endpoints
app.get("/api/investment-accounts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM \"InvestmentAccount\" WHERE \"userId\" = $1 ORDER BY \"createdAt\" DESC", [DEFAULT_USER_ID]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch investment accounts" });
  }
});

app.get("/api/investment-accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const accountResult = await pool.query("SELECT * FROM \"InvestmentAccount\" WHERE id = $1 AND \"userId\" = $2", [id, DEFAULT_USER_ID]);
    if (accountResult.rows.length === 0) return res.status(404).json({ error: "Investment account not found" });

    const investmentsResult = await pool.query("SELECT * FROM \"Investment\" WHERE \"investmentAccountId\" = $1 ORDER BY date DESC", [id]);
    const account = accountResult.rows[0];
    account.investments = investmentsResult.rows;

    res.json(account);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch investment account" });
  }
});

app.post("/api/investment-accounts", async (req, res) => {
  try {
    const { name, accountType } = req.body;
    if (!name || !accountType) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const result = await pool.query(
      "INSERT INTO \"InvestmentAccount\" (\"userId\", name, \"accountType\", \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *",
      [DEFAULT_USER_ID, name, accountType]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create investment account" });
  }
});

app.put("/api/investment-accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, accountType } = req.body;
    const result = await pool.query(
      "UPDATE \"InvestmentAccount\" SET name = $1, \"accountType\" = $2, \"updatedAt\" = NOW() WHERE id = $3 AND \"userId\" = $4 RETURNING *",
      [name, accountType, id, DEFAULT_USER_ID]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Investment account not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update investment account" });
  }
});

app.delete("/api/investment-accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM \"Investment\" WHERE \"investmentAccountId\" = $1", [id]);
    const result = await pool.query("DELETE FROM \"InvestmentAccount\" WHERE id = $1 AND \"userId\" = $2 RETURNING *", [id, DEFAULT_USER_ID]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Investment account not found" });
    res.json({ message: "Investment account deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete investment account" });
  }
});

// Debt endpoints
app.get("/api/debts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM \"Debt\" WHERE \"userId\" = $1 ORDER BY date DESC", [DEFAULT_USER_ID]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch debts" });
  }
});

app.post("/api/debts", async (req, res) => {
  try {
    const { name, amount, type, date } = req.body;
    if (!name || amount === undefined || !type || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const result = await pool.query(
      "INSERT INTO \"Debt\" (\"userId\", name, amount, type, date, \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *",
      [DEFAULT_USER_ID, name, parseFloat(amount), type, new Date(date)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create debt" });
  }
});

app.put("/api/debts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, type, date } = req.body;
    const result = await pool.query(
      "UPDATE \"Debt\" SET name = $1, amount = $2, type = $3, date = $4, \"updatedAt\" = NOW() WHERE id = $5 AND \"userId\" = $6 RETURNING *",
      [name, parseFloat(amount), type, new Date(date), id, DEFAULT_USER_ID]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Debt not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update debt" });
  }
});

app.delete("/api/debts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM \"Debt\" WHERE id = $1 AND \"userId\" = $2 RETURNING *", [id, DEFAULT_USER_ID]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Debt not found" });
    res.json({ message: "Debt deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete debt" });
  }
});

// Savings goals endpoints
app.get("/api/savings-goals", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM \"SavingsGoal\" WHERE \"userId\" = $1 ORDER BY date DESC", [DEFAULT_USER_ID]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch savings goals" });
  }
});

app.post("/api/savings-goals", async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, date } = req.body;
    if (!name || targetAmount === undefined || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const result = await pool.query(
      "INSERT INTO \"SavingsGoal\" (\"userId\", name, \"targetAmount\", \"currentAmount\", date, \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *",
      [DEFAULT_USER_ID, name, parseFloat(targetAmount), parseFloat(currentAmount || 0), new Date(date)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create savings goal" });
  }
});

app.put("/api/savings-goals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, targetAmount, currentAmount, date } = req.body;
    const result = await pool.query(
      "UPDATE \"SavingsGoal\" SET name = $1, \"targetAmount\" = $2, \"currentAmount\" = $3, date = $4, \"updatedAt\" = NOW() WHERE id = $5 AND \"userId\" = $6 RETURNING *",
      [name, parseFloat(targetAmount), parseFloat(currentAmount), new Date(date), id, DEFAULT_USER_ID]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Savings goal not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update savings goal" });
  }
});

app.delete("/api/savings-goals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM \"SavingsGoal\" WHERE id = $1 AND \"userId\" = $2 RETURNING *", [id, DEFAULT_USER_ID]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Savings goal not found" });
    res.json({ message: "Savings goal deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete savings goal" });
  }
});

// Budget endpoints
app.get("/api/budgets", async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = "SELECT * FROM \"Budget\" WHERE \"userId\" = $1";
    const params: any[] = [DEFAULT_USER_ID];

    if (month && year) {
      query += " AND month = $2 AND year = $3";
      params.push(Number(month), Number(year));
    }

    const result = await pool.query(query + " ORDER BY category", params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

app.post("/api/budgets", async (req, res) => {
  try {
    const { category, limit, month, year } = req.body;
    if (!category || limit === undefined || !month || !year) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const result = await pool.query(
      "INSERT INTO \"Budget\" (\"userId\", category, \"limit\", month, year, \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *",
      [DEFAULT_USER_ID, category, parseFloat(limit), Number(month), Number(year)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create budget" });
  }
});

app.put("/api/budgets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { category, limit, month, year } = req.body;
    const result = await pool.query(
      "UPDATE \"Budget\" SET category = $1, \"limit\" = $2, month = $3, year = $4, \"updatedAt\" = NOW() WHERE id = $5 AND \"userId\" = $6 RETURNING *",
      [category, parseFloat(limit), Number(month), Number(year), id, DEFAULT_USER_ID]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Budget not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update budget" });
  }
});

app.delete("/api/budgets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM \"Budget\" WHERE id = $1 AND \"userId\" = $2 RETURNING *", [id, DEFAULT_USER_ID]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Budget not found" });
    res.json({ message: "Budget deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete budget" });
  }
});

// Reports/Analytics endpoints
app.get("/api/reports/spending-by-category", async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = DEFAULT_USER_ID;

    let query = `
      SELECT category, SUM(amount) as total
      FROM "Transaction"
      WHERE "userId" = $1 AND type = 'expense'
    `;
    const params: any[] = [userId];

    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      query += ` AND date >= $2 AND date <= $3`;
      params.push(startDate, endDate);
    }

    query += ` GROUP BY category ORDER BY total DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch spending by category" });
  }
});

app.get("/api/reports/income-vs-expenses", async (req, res) => {
  try {
    const { year } = req.query;
    const userId = DEFAULT_USER_ID;
    const targetYear = Number(year) || new Date().getFullYear();

    const result = await pool.query(`
      SELECT
        EXTRACT(MONTH FROM date)::int as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM "Transaction"
      WHERE "userId" = $1 AND EXTRACT(YEAR FROM date) = $2
      GROUP BY EXTRACT(MONTH FROM date)
      ORDER BY month
    `, [userId, targetYear]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch income vs expenses" });
  }
});

app.get("/api/reports/net-worth-history", async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;

    const result = await pool.query(`
      SELECT
        date_trunc('month', NOW() - interval '12 months' + interval '1 day' * generate_series(0, 365))::date as month,
        (SELECT COALESCE(SUM(balance), 0) FROM "Account" WHERE "userId" = $1) -
        (SELECT COALESCE(SUM(amount), 0) FROM "Debt" WHERE "userId" = $1 AND date <= date_trunc('month', NOW() - interval '12 months' + interval '1 day' * generate_series(0, 365))::date) as net_worth
      FROM generate_series(0, 11)
      ORDER BY month
    `, [userId]);

    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - 11 + i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push({
        month: monthName,
        netWorth: 0
      });
    }

    res.json(months);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch net worth history" });
  }
});

app.get("/api/reports/portfolio-performance", async (req, res) => {
  try {
    const userId = DEFAULT_USER_ID;

    const result = await pool.query(`
      SELECT
        ia.name as account,
        ia."accountType" as type,
        COUNT(i.id) as holdings,
        SUM(i.value) as totalValue
      FROM "InvestmentAccount" ia
      LEFT JOIN "Investment" i ON ia.id = i."investmentAccountId"
      WHERE ia."userId" = $1
      GROUP BY ia.id, ia.name, ia."accountType"
      ORDER BY ia."createdAt" DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch portfolio performance" });
  }
});

app.get("/api/reports/summary", async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = DEFAULT_USER_ID;

    let dateFilter = "";
    const params: any[] = [userId];

    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      dateFilter = ` AND date >= $2 AND date <= $3`;
      params.push(startDate, endDate);
    }

    const [income, expenses, transactions, budgets] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM "Transaction" WHERE "userId" = $1 AND type = 'income'${dateFilter}`, params),
      pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM "Transaction" WHERE "userId" = $1 AND type = 'expense'${dateFilter}`, params),
      pool.query(`SELECT COUNT(*) as count FROM "Transaction" WHERE "userId" = $1${dateFilter}`, params),
      pool.query(`SELECT COUNT(*) as count FROM "Budget" WHERE "userId" = $1 AND month = $2 AND year = $3`, [userId, Number(month), Number(year)])
    ]);

    const incomeTotal = income.rows[0].total;
    const expensesTotal = expenses.rows[0].total;

    res.json({
      income: Math.round(incomeTotal * 100) / 100,
      expenses: Math.round(expensesTotal * 100) / 100,
      netIncome: Math.round((incomeTotal - expensesTotal) * 100) / 100,
      transactionCount: transactions.rows[0].count,
      budgetCount: budgets.rows[0].count
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
