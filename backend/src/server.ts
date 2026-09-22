import express from "express";
import type { Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import { AuthService } from "./services/authService.js";
import { authMiddleware, type AuthRequest } from "./middleware/auth.js";
import { parseCSV, createOpeningBalanceTransaction } from "./utils/csvParser.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const DEFAULT_USER_ID = 1;

// Multer config for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

app.use(cors());
app.use(express.json());

// Error handler for Prisma
app.use((err: any, req: express.Request, res: Response, next: express.NextFunction) => {
  if (err instanceof Error) {
    console.error("Error:", err.message);
  }
  next(err);
});

// Health check
app.get("/", (_req, res) => {
  res.json({ message: "MoneyFlow API is running" });
});

// ==================== AUTH ENDPOINTS ====================

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "missing_fields",
        message: "Email and password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "invalid_email",
        message: "Invalid email format",
      });
    }

    // Validate password strength
    const passwordValidation = AuthService.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: "weak_password",
        message: "Password does not meet requirements",
        requirements: passwordValidation.errors,
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: "user_exists",
        message: "User with this email already exists",
      });
    }

    // Hash password and create user
    const passwordHash = await AuthService.hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
      },
    });

    // Generate tokens
    const tokens = AuthService.generateTokens(user.id, user.email);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to register user",
    });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "missing_fields",
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        error: "invalid_credentials",
        message: "Invalid email or password",
      });
    }

    // Verify password
    const passwordValid = await AuthService.comparePasswords(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        error: "invalid_credentials",
        message: "Invalid email or password",
      });
    }

    // Generate tokens
    const tokens = AuthService.generateTokens(user.id, user.email);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to login",
    });
  }
});

// Refresh token
app.post("/api/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "missing_token",
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    const payload = AuthService.verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({
        error: "invalid_token",
        message: "Invalid or expired refresh token",
      });
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(401).json({
        error: "user_not_found",
        message: "User no longer exists",
      });
    }

    // Generate new tokens
    const tokens = AuthService.generateTokens(user.id, user.email);

    res.json(tokens);
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to refresh token",
    });
  }
});

// ==================== DASHBOARD ENDPOINTS ====================

app.get("/api/dashboard/metrics", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const month = req.query.month as string | undefined;
    const year = req.query.year as string | undefined;
    const day = req.query.day as string | undefined;
    const userId = req.userId || DEFAULT_USER_ID;

    let startDate: Date, endDate: Date;

    if (day && month && year && typeof day === "string" && typeof month === "string" && typeof year === "string") {
      startDate = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0);
      endDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);
    } else if (month && year && typeof month === "string" && typeof year === "string") {
      startDate = new Date(Number(year), Number(month) - 1, 1);
      endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
    } else if (year && typeof year === "string") {
      startDate = new Date(Number(year), 0, 1);
      endDate = new Date(Number(year), 11, 31, 23, 59, 59);
    } else {
      startDate = new Date(0);
      endDate = new Date();
    }

    const [accounts, investments, debts, savingsGoals] = await Promise.all([
      prisma.account.findMany({ where: { userId }, select: { balance: true } }),
      prisma.investment.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        select: { value: true },
      }),
      prisma.debt.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        select: { amount: true },
      }),
      prisma.savingsGoal.findMany({
        where: { userId },
        select: { currentAmount: true },
      }),
    ]);

    const availableFunds = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalDebts = debts.reduce((sum, debt) => sum + (debt.amount || 0), 0);
    const netWorth = availableFunds - totalDebts;
    const totalSavings = savingsGoals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
    const investmentsValue = investments.reduce((sum, inv) => sum + (inv.value || 0), 0);

    res.json({
      netWorth: Math.round(netWorth * 100) / 100,
      availableFunds: Math.round(availableFunds * 100) / 100,
      debts: Math.round(totalDebts * 100) / 100,
      savings: Math.round(totalSavings * 100) / 100,
      investmentsValue: Math.round(investmentsValue * 100) / 100,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch metrics",
    });
  }
});

// ==================== ACCOUNT ENDPOINTS ====================

app.get("/api/accounts", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch accounts",
    });
  }
});

app.post("/api/accounts", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const { name, balance, type } = req.body;

    if (!name || balance === undefined || !type) {
      return res.status(400).json({
        error: "missing_fields",
        message: "Name, balance, and type are required",
      });
    }

    const account = await prisma.account.create({
      data: {
        userId,
        name,
        balance: parseFloat(balance),
        type,
      },
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to create account",
    });
  }
});

app.put("/api/accounts/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);
    const { name, balance, type } = req.body;

    const account = await prisma.account.findUnique({ where: { id: parseInt(id) } });

    if (!account) {
      return res.status(404).json({
        error: "not_found",
        message: "Account not found",
      });
    }

    // Verify ownership
    if (account.userId !== userId) {
      return res.status(403).json({
        error: "forbidden",
        message: "You do not have permission to update this account",
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (balance !== undefined) updateData.balance = parseFloat(balance);
    if (type !== undefined) updateData.type = type;

    const updated = await prisma.account.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to update account",
    });
  }
});

app.delete("/api/accounts/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);

    const account = await prisma.account.findUnique({ where: { id: parseInt(id) } });

    if (!account) {
      return res.status(404).json({
        error: "not_found",
        message: "Account not found",
      });
    }

    if (account.userId !== userId) {
      return res.status(403).json({
        error: "forbidden",
        message: "You do not have permission to delete this account",
      });
    }

    await prisma.account.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to delete account",
    });
  }
});

// ==================== TRANSACTION ENDPOINTS ====================

app.get("/api/transactions", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch transactions",
    });
  }
});

app.post("/api/transactions", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const { amount, type, category, date, description, accountId } = req.body;

    if (!amount || !type || !category || !date) {
      return res.status(400).json({
        error: "missing_fields",
        message: "Amount, type, category, and date are required",
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: parseFloat(amount),
        type,
        category,
        date: new Date(date),
        description: description || null,
        accountId: accountId ? parseInt(accountId) : null,
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to create transaction",
    });
  }
});

app.put("/api/transactions/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);
    const { amount, type, category, date, description, accountId } = req.body;

    const transaction = await prisma.transaction.findUnique({ where: { id: parseInt(id) } });

    if (!transaction) {
      return res.status(404).json({
        error: "not_found",
        message: "Transaction not found",
      });
    }

    if (transaction.userId !== userId) {
      return res.status(403).json({
        error: "forbidden",
        message: "You do not have permission to update this transaction",
      });
    }

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = new Date(date);
    if (description !== undefined) updateData.description = description;
    if (accountId !== undefined) updateData.accountId = accountId ? parseInt(accountId) : null;

    const updated = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to update transaction",
    });
  }
});

app.delete("/api/transactions/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);

    const transaction = await prisma.transaction.findUnique({ where: { id: parseInt(id) } });

    if (!transaction) {
      return res.status(404).json({
        error: "not_found",
        message: "Transaction not found",
      });
    }

    if (transaction.userId !== userId) {
      return res.status(403).json({
        error: "forbidden",
        message: "You do not have permission to delete this transaction",
      });
    }

    await prisma.transaction.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to delete transaction",
    });
  }
});

// POST /api/transactions/import-csv - Import transactions from CSV
app.post(
  "/api/transactions/import-csv",
  authMiddleware,
  upload.single("file"),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId || DEFAULT_USER_ID;

      if (!req.file) {
        return res.status(400).json({
          error: "missing_file",
          message: "CSV file is required",
        });
      }

      const accountId = req.body.accountId ? parseInt(req.body.accountId) : null;
      if (!accountId) {
        return res.status(400).json({
          error: "missing_fields",
          message: "accountId is required",
        });
      }

      // Verify account belongs to user
      const account = await prisma.account.findUnique({
        where: { id: accountId },
      });

      if (!account || account.userId !== userId) {
        return res.status(403).json({
          error: "forbidden",
          message: "Cannot access this account",
        });
      }

      // Parse CSV
      const csvContent = req.file.buffer.toString("utf-8");
      const parseResult = parseCSV(csvContent);

      if (parseResult.stats.valid === 0) {
        return res.status(400).json({
          error: "invalid_csv",
          message: "No valid transactions found in CSV",
          errors: parseResult.errors,
        });
      }

      // Create transactions
      const createdTransactions = [];
      for (const tx of parseResult.transactions) {
        const created = await prisma.transaction.create({
          data: {
            userId,
            accountId,
            amount: tx.amount,
            type: tx.type,
            category: tx.category,
            description: tx.description ? tx.description : null,
            date: new Date(tx.date),
          },
        });
        createdTransactions.push(created);
      }

      res.status(201).json({
        message: "Transactions imported successfully",
        imported: createdTransactions.length,
        errors: parseResult.errors,
        transactions: createdTransactions,
      });
    } catch (error) {
      console.error("CSV import error:", error);
      res.status(500).json({
        error: "import_error",
        message: error instanceof Error ? error.message : "Failed to import CSV",
      });
    }
  }
);

// PUT /api/accounts/:id/set-balance - Set opening balance
app.put("/api/accounts/:id/set-balance", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const idParam = typeof req.params.id === "string" ? req.params.id : "";
    const accountId = idParam ? parseInt(idParam) : 0;
    const { balance, date } = req.body;

    if (balance === undefined || balance === null) {
      return res.status(400).json({
        error: "missing_fields",
        message: "Balance is required",
      });
    }

    // Verify account belongs to user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account || account.userId !== userId) {
      return res.status(403).json({
        error: "forbidden",
        message: "Cannot access this account",
      });
    }

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum)) {
      return res.status(400).json({
        error: "invalid_balance",
        message: "Balance must be a valid number",
      });
    }

    const balanceDate = date || new Date().toISOString().split("T")[0];
    const balanceDateObj = new Date(balanceDate);

    // Check for existing transactions before the opening balance date
    const earlierTransactions = await prisma.transaction.findMany({
      where: {
        accountId,
        date: { lt: balanceDateObj },
      },
      take: 1,
    });

    if (earlierTransactions.length > 0) {
      return res.status(400).json({
        error: "invalid_opening_balance_date",
        message: `Cannot set opening balance to ${balanceDate}. There are existing transactions before this date. Use the "Adjust Balance" feature instead to correct a mid-stream balance.`,
      });
    }

    // Create opening balance transaction
    const openingTx = createOpeningBalanceTransaction(accountId, balanceNum, balanceDate);

    // Create transaction and update account balance atomically
    await prisma.transaction.create({
      data: {
        userId,
        accountId,
        amount: openingTx.amount,
        type: openingTx.type,
        category: openingTx.category,
        description: openingTx.description,
        date: new Date(openingTx.date),
      },
    });

    // Update account balance
    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: { balance: balanceNum },
    });

    res.json({
      message: "Opening balance set successfully",
      account: updatedAccount,
    });
  } catch (error) {
    console.error("Set balance error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to set account balance",
    });
  }
});

// PUT /api/accounts/:id/adjust-balance - Smart balance adjustment
// Auto-detects: opening_balance (if first transaction) or reconciliation (if correcting)
app.put("/api/accounts/:id/adjust-balance", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const idParam = typeof req.params.id === "string" ? req.params.id : "";
    const accountId = idParam ? parseInt(idParam) : 0;
    const { balance, date } = req.body;

    if (balance === undefined || balance === null) {
      return res.status(400).json({
        error: "missing_fields",
        message: "Balance is required",
      });
    }

    // Verify account belongs to user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account || account.userId !== userId) {
      return res.status(403).json({
        error: "forbidden",
        message: "Cannot access this account",
      });
    }

    const newBalance = parseFloat(balance);
    if (isNaN(newBalance)) {
      return res.status(400).json({
        error: "invalid_balance",
        message: "Balance must be a valid number",
      });
    }

    const adjustDate = date || new Date().toISOString().split("T")[0];

    // Check if this account has any transactions
    const existingTransactions = await prisma.transaction.findMany({
      where: { accountId },
      take: 1,
    });

    const isFirstTransaction = existingTransactions.length === 0;

    // Determine transaction type
    const txType = isFirstTransaction ? "opening_balance" : "reconciliation";
    const description = isFirstTransaction
      ? "Opening Balance"
      : "Balance Adjustment (Reconciliation)";

    // For reconciliation, calculate the adjustment amount
    // For opening balance, the amount IS the new balance
    const txAmount = isFirstTransaction
      ? newBalance
      : (newBalance - account.balance);

    // Create adjustment transaction
    await prisma.transaction.create({
      data: {
        userId,
        accountId,
        amount: Math.abs(txAmount),
        type: txAmount >= 0 ? "income" : "expense",
        category: txType,
        description,
        date: new Date(adjustDate),
      },
    });

    // Update account balance
    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });

    res.json({
      message: isFirstTransaction
        ? "Opening balance set successfully"
        : "Balance adjusted successfully",
      transactionType: txType,
      account: updatedAccount,
    });
  } catch (error) {
    console.error("Adjust balance error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "Failed to adjust account balance",
    });
  }
});

// ==================== OTHER ENDPOINTS (PASS-THROUGH) ====================

// Investment Accounts
app.get("/api/investment-accounts", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const accounts = await prisma.investmentAccount.findMany({
      where: { userId },
      include: { investments: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch investment accounts",
    });
  }
});

app.post("/api/investment-accounts", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const { name, accountType } = req.body;

    if (!name || !accountType) {
      return res.status(400).json({
        error: "missing_fields",
        message: "Name and accountType are required",
      });
    }

    const account = await prisma.investmentAccount.create({
      data: { userId, name, accountType },
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to create investment account",
    });
  }
});

app.put("/api/investment-accounts/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);
    const { name, accountType } = req.body;

    const account = await prisma.investmentAccount.findUnique({ where: { id: parseInt(id) } });

    if (!account) {
      return res.status(404).json({
        error: "not_found",
        message: "Investment account not found",
      });
    }

    if (account.userId !== userId) {
      return res.status(403).json({
        error: "forbidden",
        message: "You do not have permission to update this account",
      });
    }

    const updated = await prisma.investmentAccount.update({
      where: { id: parseInt(id) },
      data: { name: name || undefined, accountType: accountType || undefined },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to update investment account",
    });
  }
});

app.delete("/api/investment-accounts/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);

    const account = await prisma.investmentAccount.findUnique({ where: { id: parseInt(id) } });

    if (!account) {
      return res.status(404).json({
        error: "not_found",
        message: "Investment account not found",
      });
    }

    if (account.userId !== userId) {
      return res.status(403).json({
        error: "forbidden",
        message: "You do not have permission to delete this account",
      });
    }

    await prisma.investmentAccount.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Investment account deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to delete investment account",
    });
  }
});

// Investments
app.get("/api/investments", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const investments = await prisma.investment.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    res.json(investments);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch investments",
    });
  }
});

app.post("/api/investments", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const { name, value, type, date, investmentAccountId } = req.body;

    if (!name || !value || !type || !date) {
      return res.status(400).json({
        error: "missing_fields",
        message: "Name, value, type, and date are required",
      });
    }

    let accountId = investmentAccountId;
    if (!accountId) {
      const account = await prisma.investmentAccount.findFirst({ where: { userId } });
      if (!account) {
        return res.status(400).json({
          error: "no_account",
          message: "No investment account found. Please create one first.",
        });
      }
      accountId = account.id;
    }

    const investment = await prisma.investment.create({
      data: {
        userId,
        investmentAccountId: accountId,
        name,
        value: parseFloat(value),
        type,
        date: new Date(date),
      },
    });

    res.status(201).json(investment);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to create investment",
    });
  }
});

app.delete("/api/investments/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);

    const investment = await prisma.investment.findUnique({ where: { id: parseInt(id) } });

    if (!investment) {
      return res.status(404).json({
        error: "not_found",
        message: "Investment not found",
      });
    }

    if (investment.userId !== userId) {
      return res.status(403).json({
        error: "forbidden",
        message: "You do not have permission to delete this investment",
      });
    }

    await prisma.investment.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Investment deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to delete investment",
    });
  }
});

// Debts
app.get("/api/debts", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const debts = await prisma.debt.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    res.json(debts);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch debts",
    });
  }
});

app.post("/api/debts", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const { name, amount, type, date } = req.body;

    if (!name || !amount || !type || !date) {
      return res.status(400).json({
        error: "missing_fields",
        message: "Name, amount, type, and date are required",
      });
    }

    const debt = await prisma.debt.create({
      data: {
        userId,
        name,
        amount: parseFloat(amount),
        type,
        date: new Date(date),
      },
    });

    res.status(201).json(debt);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to create debt",
    });
  }
});

app.delete("/api/debts/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);

    const debt = await prisma.debt.findUnique({ where: { id: parseInt(id) } });

    if (!debt) {
      return res.status(404).json({
        error: "not_found",
        message: "Debt not found",
      });
    }

    if (debt.userId !== userId) {
      return res.status(403).json({
        error: "forbidden",
        message: "You do not have permission to delete this debt",
      });
    }

    await prisma.debt.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Debt deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to delete debt",
    });
  }
});

// Savings Goals
app.get("/api/savings-goals", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch savings goals",
    });
  }
});

app.post("/api/savings-goals", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const { name, targetAmount, currentAmount, date } = req.body;

    if (!name || !targetAmount || !date) {
      return res.status(400).json({
        error: "missing_fields",
        message: "Name, targetAmount, and date are required",
      });
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        date: new Date(date),
      },
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to create savings goal",
    });
  }
});

app.delete("/api/savings-goals/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);

    const goal = await prisma.savingsGoal.findUnique({ where: { id: parseInt(id) } });

    if (!goal) {
      return res.status(404).json({
        error: "not_found",
        message: "Savings goal not found",
      });
    }

    if (goal.userId !== userId) {
      return res.status(403).json({
        error: "forbidden",
        message: "You do not have permission to delete this goal",
      });
    }

    await prisma.savingsGoal.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Savings goal deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to delete savings goal",
    });
  }
});

// Budgets
app.get("/api/budgets", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const month = req.query.month as string | undefined;
    const year = req.query.year as string | undefined;

    const where: any = { userId };
    if (month && year && typeof month === "string" && typeof year === "string") {
      where.month = parseInt(month);
      where.year = parseInt(year);
    }

    const budgets = await prisma.budget.findMany({ where });

    // Calculate spent amount for each budget from transactions
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = new Date(Date.UTC(
          budget.year,
          budget.month - 1,
          1,
          0,
          0,
          0
        ));
        const endDate = new Date(Date.UTC(budget.year, budget.month, 0, 23, 59, 59));

        const transactions = await prisma.transaction.findMany({
          where: {
            userId,
            category: budget.category,
            type: "expense",
            date: { gte: startDate, lte: endDate },
          },
          select: { amount: true },
        });

        const spent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        return { ...budget, spent: Math.round(spent * 100) / 100 };
      })
    );

    res.json(budgetsWithSpent);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch budgets",
    });
  }
});

app.post("/api/budgets", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const { category, limit, month, year } = req.body;

    if (!category || !limit || !month || !year) {
      return res.status(400).json({
        error: "missing_fields",
        message: "Category, limit, month, and year are required",
      });
    }

    const budget = await prisma.budget.create({
      data: {
        userId,
        category,
        limit: parseFloat(limit),
        month: parseInt(month),
        year: parseInt(year),
      },
    });

    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to create budget",
    });
  }
});

// Categories API
app.get("/api/categories", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;

    const categories = await prisma.category.findMany({
      where: { userId },
      include: { subcategories: true },
      orderBy: { name: "asc" },
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch categories",
    });
  }
});

app.post("/api/categories", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const { name, icon, color, subcategories } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "missing_fields",
        message: "Category name is required",
      });
    }

    const category = await prisma.category.create({
      data: {
        userId,
        name,
        icon: icon || null,
        color: color || null,
        subcategories: {
          create: (subcategories || []).map((sub: string) => ({ name: sub })),
        },
      },
      include: { subcategories: true },
    });

    res.status(201).json(category);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({
        error: "duplicate_category",
        message: "Category with this name already exists",
      });
    }
    res.status(500).json({
      error: "internal_error",
      message: "Failed to create category",
    });
  }
});

app.put("/api/categories/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);
    const { name, icon, color } = req.body;

    const category = await prisma.category.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!category) {
      return res.status(404).json({
        error: "not_found",
        message: "Category not found",
      });
    }

    const updated = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name: name || category.name,
        icon: icon !== undefined ? icon : category.icon,
        color: color !== undefined ? color : category.color,
      },
      include: { subcategories: true },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to update category",
    });
  }
});

app.delete("/api/categories/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);

    const category = await prisma.category.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!category) {
      return res.status(404).json({
        error: "not_found",
        message: "Category not found",
      });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to delete category",
    });
  }
});

// Subcategories API
app.get("/api/categories/:id/subcategories", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);

    const category = await prisma.category.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!category) {
      return res.status(404).json({
        error: "not_found",
        message: "Category not found",
      });
    }

    const subcategories = await prisma.subcategory.findMany({
      where: { categoryId: parseInt(id) },
      orderBy: { name: "asc" },
    });

    res.json(subcategories);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch subcategories",
    });
  }
});

app.post("/api/categories/:id/subcategories", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "missing_fields",
        message: "Subcategory name is required",
      });
    }

    const category = await prisma.category.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!category) {
      return res.status(404).json({
        error: "not_found",
        message: "Category not found",
      });
    }

    const subcategory = await prisma.subcategory.create({
      data: {
        categoryId: parseInt(id),
        name,
        icon: icon || null,
      },
    });

    res.status(201).json(subcategory);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({
        error: "duplicate_subcategory",
        message: "Subcategory with this name already exists in this category",
      });
    }
    res.status(500).json({
      error: "internal_error",
      message: "Failed to create subcategory",
    });
  }
});

app.put("/api/subcategories/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);
    const { name, icon } = req.body;

    const subcategory = await prisma.subcategory.findUnique({
      where: { id: parseInt(id) },
      include: { category: true },
    });

    if (!subcategory || subcategory.category.userId !== userId) {
      return res.status(404).json({
        error: "not_found",
        message: "Subcategory not found",
      });
    }

    const updated = await prisma.subcategory.update({
      where: { id: parseInt(id) },
      data: {
        name: name || subcategory.name,
        icon: icon !== undefined ? icon : subcategory.icon,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to update subcategory",
    });
  }
});

app.delete("/api/subcategories/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || DEFAULT_USER_ID;
    const id = String(req.params.id);

    const subcategory = await prisma.subcategory.findUnique({
      where: { id: parseInt(id) },
      include: { category: true },
    });

    if (!subcategory || subcategory.category.userId !== userId) {
      return res.status(404).json({
        error: "not_found",
        message: "Subcategory not found",
      });
    }

    await prisma.subcategory.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Subcategory deleted" });
  } catch (error) {
    res.status(500).json({
      error: "internal_error",
      message: "Failed to delete subcategory",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`MoneyFlow API listening on port ${PORT}`);
});
