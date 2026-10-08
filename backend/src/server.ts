import express from "express";
import type { Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import { AuthService } from "./services/authService.js";
import { authMiddleware, type AuthRequest } from "./middleware/auth.js";
import {
  loginRateLimit,
  recordFailedLogin,
  clearFailedLogins,
} from "./middleware/rateLimit.js";
import { ok, created, fail } from "./utils/response.js";
import { parseCSV, createOpeningBalanceTransaction } from "./utils/csvParser.js";
import { env } from "./env.js";

dotenv.config();

// env.ts validates all required environment variables at import time (fail-secure)

const app = express();
const prisma = new PrismaClient();

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

// Configure CORS: allow only frontend origin (from env.FRONTEND_URL)
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (origin === env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(new Error("CORS: Origin not allowed"));
      }
    },
    credentials: true,
  })
);
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
  ok(res, { message: "MoneyFlow API is running" });
});

// ==================== AUTH ENDPOINTS ====================

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    // Check if registration is allowed
    if (!env.ALLOW_REGISTRATION) {
      return fail(res, 403, "REGISTRATION_DISABLED", "Registration is disabled");
    }

    const { email, password, name } = req.body;

    if (!email || !password) {
      return fail(res, 400, "VALIDATION_ERROR", "Email and password are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail(res, 400, "VALIDATION_ERROR", "Invalid email format");
    }

    // Validate password strength
    const passwordValidation = AuthService.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        "Password does not meet requirements",
        passwordValidation.errors
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return fail(res, 409, "USER_EXISTS", "User with this email already exists");
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

    // Create default categories for new user
    const defaultCategories = [
      { name: "Food", icon: "🍔", subcategories: ["Groceries", "Dining Out", "Coffee"] },
      { name: "Utilities", icon: "💡", subcategories: ["Electricity", "Water", "Internet"] },
      { name: "Entertainment", icon: "🎬", subcategories: ["Movies", "Games", "Music"] },
      { name: "Transportation", icon: "🚗", subcategories: ["Gas", "Public Transit", "Parking"] },
      { name: "Salary", icon: "💰", subcategories: ["Base Salary", "Bonus"] },
      { name: "Business", icon: "💼", subcategories: ["Freelance", "Side Income"] },
      { name: "Other", icon: "📦", subcategories: ["Miscellaneous"] },
    ];

    for (const cat of defaultCategories) {
      await prisma.category.create({
        data: {
          userId: user.id,
          name: cat.name,
          icon: cat.icon,
          subcategories: {
            create: cat.subcategories.map((sub) => ({ name: sub })),
          },
        },
      });
    }

    // Generate tokens
    const tokens = AuthService.generateTokens(user.id, user.email);

    created(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    });
  } catch (error) {
    console.error("Register error:", error);
    fail(res, 500, "INTERNAL_ERROR", "Failed to register user");
  }
});

// Login
app.post("/api/auth/login", loginRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return fail(res, 400, "VALIDATION_ERROR", "Email and password are required");
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      recordFailedLogin(req);
      return fail(res, 401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    // Verify password
    const passwordValid = await AuthService.comparePasswords(password, user.passwordHash);
    if (!passwordValid) {
      recordFailedLogin(req);
      return fail(res, 401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    // Successful login clears this client's failed-attempt counter
    clearFailedLogins(req);

    // Generate tokens
    const tokens = AuthService.generateTokens(user.id, user.email);

    ok(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    });
  } catch (error) {
    console.error("Login error:", error);
    fail(res, 500, "INTERNAL_ERROR", "Failed to login");
  }
});

// Refresh token
app.post("/api/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return fail(res, 400, "VALIDATION_ERROR", "Refresh token is required");
    }

    // Verify refresh token
    const payload = AuthService.verifyRefreshToken(refreshToken);
    if (!payload) {
      return fail(res, 401, "INVALID_TOKEN", "Invalid or expired refresh token");
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return fail(res, 401, "USER_NOT_FOUND", "User no longer exists");
    }

    // Generate new tokens
    const tokens = AuthService.generateTokens(user.id, user.email);

    ok(res, tokens);
  } catch (error) {
    console.error("Refresh error:", error);
    fail(res, 500, "INTERNAL_ERROR", "Failed to refresh token");
  }
});

// ==================== DASHBOARD ENDPOINTS ====================

app.get("/api/dashboard/metrics", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const month = req.query.month as string | undefined;
    const year = req.query.year as string | undefined;
    const day = req.query.day as string | undefined;
    const userId = req.userId;

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

    ok(res, {
      netWorth: Math.round(netWorth * 100) / 100,
      availableFunds: Math.round(availableFunds * 100) / 100,
      debts: Math.round(totalDebts * 100) / 100,
      savings: Math.round(totalSavings * 100) / 100,
      investmentsValue: Math.round(investmentsValue * 100) / 100,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    fail(res, 500, "INTERNAL_ERROR", "Failed to fetch metrics");
  }
});

// ==================== ACCOUNT ENDPOINTS ====================

// Per MONEYFLOW_SPEC.md §4.3: name is required (max 100 chars), type is a fixed set
const ACCOUNT_TYPES = ["checking", "savings", "credit_card"];
const ACCOUNT_NAME_MAX_LENGTH = 100;

/** Returns a validation message for any supplied account field, or null when all are valid. */
function validateAccountFields(fields: { name?: unknown; type?: unknown }): string | null {
  const { name, type } = fields;

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return "Name must be a non-empty string";
    }
    if (name.trim().length > ACCOUNT_NAME_MAX_LENGTH) {
      return `Name must be ${ACCOUNT_NAME_MAX_LENGTH} characters or fewer`;
    }
  }

  if (type !== undefined) {
    if (typeof type !== "string" || !ACCOUNT_TYPES.includes(type)) {
      return `Type must be one of: ${ACCOUNT_TYPES.join(", ")}`;
    }
  }

  return null;
}

/** Parses a route :id into a positive integer, or null when it isn't one. */
function parseId(raw: unknown): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

app.get("/api/accounts", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    ok(res, accounts);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to fetch accounts");
  }
});

// Scoped by userId so another user's id is a 404, never data (PRD §7)
app.get("/api/accounts/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = parseId(req.params.id);

    if (id === null) {
      return fail(res, 400, "VALIDATION_ERROR", "Account id must be a positive integer");
    }

    const account = await prisma.account.findFirst({ where: { id, userId } });

    if (!account) {
      return fail(res, 404, "NOT_FOUND", "Account not found");
    }

    ok(res, account);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to fetch account");
  }
});

app.post("/api/accounts", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { name, balance, type } = req.body;

    if (!name || !type) {
      return fail(res, 400, "VALIDATION_ERROR", "Name and type are required");
    }

    const fieldError = validateAccountFields({ name, type });
    if (fieldError) {
      return fail(res, 400, "VALIDATION_ERROR", fieldError);
    }

    // Per MONEYFLOW_SPEC.md §4.3: balance is optional and defaults to 0
    const parsedBalance = Number(balance ?? 0);
    if (!Number.isFinite(parsedBalance)) {
      return fail(res, 400, "VALIDATION_ERROR", "Balance must be a number");
    }

    const account = await prisma.account.create({
      data: {
        userId,
        name: name.trim(),
        balance: parsedBalance,
        type,
      },
    });

    created(res, account);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to create account");
  }
});

app.put("/api/accounts/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const { name, balance, type } = req.body;

    const account = await prisma.account.findUnique({ where: { id: parseInt(id) } });

    if (!account) {
      return fail(res, 404, "NOT_FOUND", "Account not found");
    }

    // Verify ownership
    if (account.userId !== userId) {
      return fail(res, 403, "FORBIDDEN", "You do not have permission to update this account");
    }

    const fieldError = validateAccountFields({ name, type });
    if (fieldError) {
      return fail(res, 400, "VALIDATION_ERROR", fieldError);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (balance !== undefined) updateData.balance = parseFloat(balance);
    if (type !== undefined) updateData.type = type;

    const updated = await prisma.account.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    ok(res, updated);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to update account");
  }
});

app.delete("/api/accounts/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    const account = await prisma.account.findUnique({ where: { id: parseInt(id) } });

    if (!account) {
      return fail(res, 404, "NOT_FOUND", "Account not found");
    }

    if (account.userId !== userId) {
      return fail(res, 403, "FORBIDDEN", "You do not have permission to delete this account");
    }

    await prisma.account.delete({ where: { id: parseInt(id) } });
    ok(res, { message: "Account deleted successfully" });
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to delete account");
  }
});

// ==================== TRANSACTION ENDPOINTS ====================

app.get("/api/transactions", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    ok(res, transactions);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to fetch transactions");
  }
});

// Scoped by userId so another user's id is a 404, never data (PRD §7)
app.get("/api/transactions/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = parseId(req.params.id);

    if (id === null) {
      return fail(res, 400, "VALIDATION_ERROR", "Transaction id must be a positive integer");
    }

    const transaction = await prisma.transaction.findFirst({ where: { id, userId } });

    if (!transaction) {
      return fail(res, 404, "NOT_FOUND", "Transaction not found");
    }

    ok(res, transaction);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to fetch transaction");
  }
});

app.post("/api/transactions", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { amount, type, category, date, description, accountId } = req.body;

    if (!amount || !type || !category || !date) {
      return fail(res, 400, "VALIDATION_ERROR", "Amount, type, category, and date are required");
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

    created(res, transaction);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to create transaction");
  }
});

app.put("/api/transactions/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const { amount, type, category, date, description, accountId } = req.body;

    const transaction = await prisma.transaction.findUnique({ where: { id: parseInt(id) } });

    if (!transaction) {
      return fail(res, 404, "NOT_FOUND", "Transaction not found");
    }

    if (transaction.userId !== userId) {
      return fail(res, 403, "FORBIDDEN", "You do not have permission to update this transaction");
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

    ok(res, updated);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to update transaction");
  }
});

app.delete("/api/transactions/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    const transaction = await prisma.transaction.findUnique({ where: { id: parseInt(id) } });

    if (!transaction) {
      return fail(res, 404, "NOT_FOUND", "Transaction not found");
    }

    if (transaction.userId !== userId) {
      return fail(res, 403, "FORBIDDEN", "You do not have permission to delete this transaction");
    }

    await prisma.transaction.delete({ where: { id: parseInt(id) } });
    ok(res, { message: "Transaction deleted successfully" });
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to delete transaction");
  }
});

// POST /api/transactions/import-csv - Import transactions from CSV
app.post(
  "/api/transactions/import-csv",
  authMiddleware,
  upload.single("file"),
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId;

      if (!req.file) {
        return fail(res, 400, "VALIDATION_ERROR", "CSV file is required");
      }

      const accountId = req.body.accountId ? parseInt(req.body.accountId) : null;
      if (!accountId) {
        return fail(res, 400, "VALIDATION_ERROR", "accountId is required");
      }

      // Verify account belongs to user
      const account = await prisma.account.findUnique({
        where: { id: accountId },
      });

      if (!account || account.userId !== userId) {
        return fail(res, 403, "FORBIDDEN", "Cannot access this account");
      }

      // Parse CSV
      const csvContent = req.file.buffer.toString("utf-8");
      const parseResult = parseCSV(csvContent);

      if (parseResult.stats.valid === 0) {
        return fail(res, 400, "INVALID_CSV", "No valid transactions found in CSV", parseResult.errors);
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

      created(res, {
        message: "Transactions imported successfully",
        imported: createdTransactions.length,
        errors: parseResult.errors,
        transactions: createdTransactions,
      });
    } catch (error) {
      console.error("CSV import error:", error);
      fail(
        res,
        500,
        "IMPORT_ERROR",
        error instanceof Error ? error.message : "Failed to import CSV"
      );
    }
  }
);

// PUT /api/accounts/:id/set-balance - Set opening balance
app.put("/api/accounts/:id/set-balance", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const idParam = typeof req.params.id === "string" ? req.params.id : "";
    const accountId = idParam ? parseInt(idParam) : 0;
    const { balance, date } = req.body;

    if (balance === undefined || balance === null) {
      return fail(res, 400, "VALIDATION_ERROR", "Balance is required");
    }

    // Verify account belongs to user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account || account.userId !== userId) {
      return fail(res, 403, "FORBIDDEN", "Cannot access this account");
    }

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum)) {
      return fail(res, 400, "VALIDATION_ERROR", "Balance must be a valid number");
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
      return fail(
        res,
        400,
        "INVALID_OPENING_BALANCE_DATE",
        `Cannot set opening balance to ${balanceDate}. There are existing transactions before this date. Use the "Adjust Balance" feature instead to correct a mid-stream balance.`
      );
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

    ok(res, {
      message: "Opening balance set successfully",
      account: updatedAccount,
    });
  } catch (error) {
    console.error("Set balance error:", error);
    fail(res, 500, "INTERNAL_ERROR", "Failed to set account balance");
  }
});

// PUT /api/accounts/:id/adjust-balance - Smart balance adjustment
// Auto-detects: opening_balance (if first transaction) or reconciliation (if correcting)
app.put("/api/accounts/:id/adjust-balance", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const idParam = typeof req.params.id === "string" ? req.params.id : "";
    const accountId = idParam ? parseInt(idParam) : 0;
    const { balance, date } = req.body;

    if (balance === undefined || balance === null) {
      return fail(res, 400, "VALIDATION_ERROR", "Balance is required");
    }

    // Verify account belongs to user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account || account.userId !== userId) {
      return fail(res, 403, "FORBIDDEN", "Cannot access this account");
    }

    const newBalance = parseFloat(balance);
    if (isNaN(newBalance)) {
      return fail(res, 400, "VALIDATION_ERROR", "Balance must be a valid number");
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

    ok(res, {
      message: isFirstTransaction
        ? "Opening balance set successfully"
        : "Balance adjusted successfully",
      transactionType: txType,
      account: updatedAccount,
    });
  } catch (error) {
    console.error("Adjust balance error:", error);
    fail(res, 500, "INTERNAL_ERROR", "Failed to adjust account balance");
  }
});

// ==================== OTHER ENDPOINTS (PASS-THROUGH) ====================

// Investment Accounts
app.get("/api/investment-accounts", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const accounts = await prisma.investmentAccount.findMany({
      where: { userId },
      include: { investments: true },
      orderBy: { createdAt: "desc" },
    });
    ok(res, accounts);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to fetch investment accounts");
  }
});

app.post("/api/investment-accounts", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { name, accountType } = req.body;

    if (!name || !accountType) {
      return fail(res, 400, "VALIDATION_ERROR", "Name and accountType are required");
    }

    const account = await prisma.investmentAccount.create({
      data: { userId, name, accountType },
    });

    created(res, account);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to create investment account");
  }
});

app.put("/api/investment-accounts/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const { name, accountType } = req.body;

    const account = await prisma.investmentAccount.findUnique({ where: { id: parseInt(id) } });

    if (!account) {
      return fail(res, 404, "NOT_FOUND", "Investment account not found");
    }

    if (account.userId !== userId) {
      return fail(res, 403, "FORBIDDEN", "You do not have permission to update this account");
    }

    const updated = await prisma.investmentAccount.update({
      where: { id: parseInt(id) },
      data: { name: name || undefined, accountType: accountType || undefined },
    });

    ok(res, updated);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to update investment account");
  }
});

app.delete("/api/investment-accounts/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    const account = await prisma.investmentAccount.findUnique({ where: { id: parseInt(id) } });

    if (!account) {
      return fail(res, 404, "NOT_FOUND", "Investment account not found");
    }

    if (account.userId !== userId) {
      return fail(res, 403, "FORBIDDEN", "You do not have permission to delete this account");
    }

    await prisma.investmentAccount.delete({ where: { id: parseInt(id) } });
    ok(res, { message: "Investment account deleted successfully" });
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to delete investment account");
  }
});

// Investments
app.get("/api/investments", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const investments = await prisma.investment.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    ok(res, investments);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to fetch investments");
  }
});

app.post("/api/investments", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { name, value, type, date, investmentAccountId } = req.body;

    if (!name || !value || !type || !date) {
      return fail(res, 400, "VALIDATION_ERROR", "Name, value, type, and date are required");
    }

    let accountId = investmentAccountId;
    if (!accountId) {
      const account = await prisma.investmentAccount.findFirst({ where: { userId } });
      if (!account) {
        return fail(
          res,
          400,
          "NO_INVESTMENT_ACCOUNT",
          "No investment account found. Please create one first."
        );
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

    created(res, investment);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to create investment");
  }
});

app.delete("/api/investments/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    const investment = await prisma.investment.findUnique({ where: { id: parseInt(id) } });

    if (!investment) {
      return fail(res, 404, "NOT_FOUND", "Investment not found");
    }

    if (investment.userId !== userId) {
      return fail(res, 403, "FORBIDDEN", "You do not have permission to delete this investment");
    }

    await prisma.investment.delete({ where: { id: parseInt(id) } });
    ok(res, { message: "Investment deleted successfully" });
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to delete investment");
  }
});

// Debts
app.get("/api/debts", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const debts = await prisma.debt.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    ok(res, debts);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to fetch debts");
  }
});

app.post("/api/debts", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { name, amount, type, date } = req.body;

    if (!name || !amount || !type || !date) {
      return fail(res, 400, "VALIDATION_ERROR", "Name, amount, type, and date are required");
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

    created(res, debt);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to create debt");
  }
});

app.delete("/api/debts/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    const debt = await prisma.debt.findUnique({ where: { id: parseInt(id) } });

    if (!debt) {
      return fail(res, 404, "NOT_FOUND", "Debt not found");
    }

    if (debt.userId !== userId) {
      return fail(res, 403, "FORBIDDEN", "You do not have permission to delete this debt");
    }

    await prisma.debt.delete({ where: { id: parseInt(id) } });
    ok(res, { message: "Debt deleted successfully" });
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to delete debt");
  }
});

// Savings Goals
app.get("/api/savings-goals", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    ok(res, goals);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to fetch savings goals");
  }
});

app.post("/api/savings-goals", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { name, targetAmount, currentAmount, date } = req.body;

    if (!name || !targetAmount || !date) {
      return fail(res, 400, "VALIDATION_ERROR", "Name, targetAmount, and date are required");
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

    created(res, goal);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to create savings goal");
  }
});

app.delete("/api/savings-goals/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    const goal = await prisma.savingsGoal.findUnique({ where: { id: parseInt(id) } });

    if (!goal) {
      return fail(res, 404, "NOT_FOUND", "Savings goal not found");
    }

    if (goal.userId !== userId) {
      return fail(res, 403, "FORBIDDEN", "You do not have permission to delete this goal");
    }

    await prisma.savingsGoal.delete({ where: { id: parseInt(id) } });
    ok(res, { message: "Savings goal deleted successfully" });
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to delete savings goal");
  }
});

// Budgets
app.get("/api/budgets", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
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

    ok(res, budgetsWithSpent);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to fetch budgets");
  }
});

app.post("/api/budgets", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { category, limit, month, year } = req.body;

    if (!category || !limit || !month || !year) {
      return fail(res, 400, "VALIDATION_ERROR", "Category, limit, month, and year are required");
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

    created(res, budget);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to create budget");
  }
});

// Categories API
app.get("/api/categories", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    const categories = await prisma.category.findMany({
      where: { userId },
      include: { subcategories: true },
      orderBy: { name: "asc" },
    });

    ok(res, categories);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to fetch categories");
  }
});

app.post("/api/categories", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { name, icon, color, subcategories } = req.body;

    if (!name) {
      return fail(res, 400, "VALIDATION_ERROR", "Category name is required");
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

    created(res, category);
  } catch (error: any) {
    if (error.code === "P2002") {
      return fail(res, 400, "DUPLICATE_CATEGORY", "Category with this name already exists");
    }
    fail(res, 500, "INTERNAL_ERROR", "Failed to create category");
  }
});

app.put("/api/categories/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const { name, icon, color } = req.body;

    const category = await prisma.category.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!category) {
      return fail(res, 404, "NOT_FOUND", "Category not found");
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

    ok(res, updated);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to update category");
  }
});

app.delete("/api/categories/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    const category = await prisma.category.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!category) {
      return fail(res, 404, "NOT_FOUND", "Category not found");
    }

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    ok(res, { message: "Category deleted" });
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to delete category");
  }
});

// Subcategories API
app.get("/api/categories/:id/subcategories", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    const category = await prisma.category.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!category) {
      return fail(res, 404, "NOT_FOUND", "Category not found");
    }

    const subcategories = await prisma.subcategory.findMany({
      where: { categoryId: parseInt(id) },
      orderBy: { name: "asc" },
    });

    ok(res, subcategories);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to fetch subcategories");
  }
});

app.post("/api/categories/:id/subcategories", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const { name, icon } = req.body;

    if (!name) {
      return fail(res, 400, "VALIDATION_ERROR", "Subcategory name is required");
    }

    const category = await prisma.category.findFirst({
      where: { id: parseInt(id), userId },
    });

    if (!category) {
      return fail(res, 404, "NOT_FOUND", "Category not found");
    }

    const subcategory = await prisma.subcategory.create({
      data: {
        categoryId: parseInt(id),
        name,
        icon: icon || null,
      },
    });

    created(res, subcategory);
  } catch (error: any) {
    if (error.code === "P2002") {
      return fail(
        res,
        400,
        "DUPLICATE_SUBCATEGORY",
        "Subcategory with this name already exists in this category"
      );
    }
    fail(res, 500, "INTERNAL_ERROR", "Failed to create subcategory");
  }
});

app.put("/api/subcategories/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);
    const { name, icon } = req.body;

    const subcategory = await prisma.subcategory.findUnique({
      where: { id: parseInt(id) },
      include: { category: true },
    });

    if (!subcategory || subcategory.category.userId !== userId) {
      return fail(res, 404, "NOT_FOUND", "Subcategory not found");
    }

    const updated = await prisma.subcategory.update({
      where: { id: parseInt(id) },
      data: {
        name: name || subcategory.name,
        icon: icon !== undefined ? icon : subcategory.icon,
      },
    });

    ok(res, updated);
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to update subcategory");
  }
});

app.delete("/api/subcategories/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const id = String(req.params.id);

    const subcategory = await prisma.subcategory.findUnique({
      where: { id: parseInt(id) },
      include: { category: true },
    });

    if (!subcategory || subcategory.category.userId !== userId) {
      return fail(res, 404, "NOT_FOUND", "Subcategory not found");
    }

    await prisma.subcategory.delete({
      where: { id: parseInt(id) },
    });

    ok(res, { message: "Subcategory deleted" });
  } catch (error) {
    fail(res, 500, "INTERNAL_ERROR", "Failed to delete subcategory");
  }
});

export { app, prisma };

// Only listen if this is the main module (not imported for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = env.PORT || "3000";

  app.listen(PORT, () => {
    console.log(`MoneyFlow API listening on port ${PORT}`);
  });
}
