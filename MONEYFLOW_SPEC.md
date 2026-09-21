# MoneyFlow - Technical Specification (MVP)

**Status:** Development Ready  
**Version:** 1.0  
**Date:** September 19, 2026  
**Timeline:** 1-2 weeks, solo developer  
**Target Launch:** Core features only (Dashboard + Transactions + Auth)

---

## Executive Summary

MoneyFlow is a personal finance tracker that helps users manage accounts, transactions, budgets, and investments in one place. This MVP focuses on **authentication, dashboard metrics, and transaction management** with a foundation for recurring transactions (manual endpoint only; cron scheduling deferred to Phase 2).

**MVP Success:** A solo developer can implement core auth, dashboard, and transaction CRUD with proper data isolation and error handling in 1-2 weeks.

---

## 1. Scope & Priorities

### 1.1 MVP Features (Launch Week 1-2)

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | ✅ Implemented | JWT tokens in response body, Authorization header, refresh tokens |
| Dashboard Metrics | ✅ Implemented | Net worth, available funds, recent transactions, investments |
| Transactions CRUD | ✅ Implemented | Add, edit, delete, search/filter by category & date |
| Accounts Management | ✅ Implemented | Multiple accounts per user, account selection, balance tracking |
| Recurring Transactions API | ✅ Implemented | Manual POST endpoint only (no cron job) |
| CSV Import | ✅ Implemented | Flexible parser, supports headerless/positional formats, 5+ transaction formats |
| Opening Balance | ✅ Implemented | Set starting account balance via transaction, date validation |
| Smart Balance Adjustment | ✅ Implemented | Auto-detects opening_balance vs reconciliation transaction type |
| Budget Tracking | ✅ Implemented | Create budgets, track spent amount dynamically from transactions |
| Investments | ✅ Implemented | Multi-account support (Brokerage, 401k, Roth IRA, etc.) |
| Debt Tracking | ✅ Implemented | Create and track debts with amount and interest rate |
| Savings Goals | ✅ Implemented | Set targets and track progress |
| Frontend Pages | ✅ Implemented | All 7 pages built and connected (Dashboard, Transactions, Budgets, Investments, Debt, Savings, Reports) |
| Reports & Analytics | ⏳ Phase 2 | Chart components partially ready, full analytics deferred |
| Desktop/PWA Offline | ⏳ Phase 2 | Design for it; defer implementation |

### 1.2 Development Priorities (In Order)

1. **Auth Backend** (Day 1): Register, login, JWT generation, token refresh
2. **Auth Frontend** (Day 1-2): Login/register forms, token storage, route guards
3. **Accounts API & UI** (Day 2): CRUD endpoints, UI for selection
4. **Transactions API & UI** (Day 2-3): CRUD, search, filters, account linking
5. **Dashboard** (Day 3): Metrics calculation, recent activity
6. **Recurring Transactions API** (Day 4): Manual endpoint (no scheduler)
7. **Testing & Polish** (Day 5-7): Tests, error handling, edge cases
8. **Deploy & Docs** (Day 7-10): Staging, production, deployment guide

---

## 2. Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18 + TypeScript | Already in project |
| **Build** | Vite | Already in project |
| **Styling** | Tailwind CSS | Already in project; glow cards designed |
| **Backend** | Node.js 20 + Express | Already in project |
| **Database** | PostgreSQL + Prisma | Already in project |
| **Auth** | JWT (HS256/RS256) | Standard, works all platforms |
| **Testing** | Jest (backend), Playwright (E2E) | Minimal but covers critical path |
| **Deployment** | Railway (backend), Vercel (frontend) | Recommended; not yet set up |

**No new dependencies** except:
- `jsonwebtoken` (JWT generation/validation)
- `bcrypt` (password hashing)
- `cors` (CORS middleware)
- `dotenv` (environment variables)

---

## 3. Database Schema

### 3.1 Updated Prisma Schema

```prisma
// Add to existing prisma/schema.prisma

model User {
  id              Int       @id @default(autoincrement())
  email           String    @unique
  passwordHash    String    // bcrypt hash, never return in API
  name            String?
  
  // Relations
  accounts        Account[]
  transactions    Transaction[]
  budgets         Budget[]
  recurringTxs    RecurringTransaction[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([email])
}

// Keep existing Account model, ensure it has userId
model Account {
  id        Int       @id @default(autoincrement())
  userId    Int
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name      String    // "Checking", "Savings", etc.
  type      String    // "checking", "savings", "credit_card"
  balance   Float     @default(0)
  
  transactions  Transaction[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([userId])
}

// Update Transaction model to add userId if missing
model Transaction {
  id              Int       @id @default(autoincrement())
  userId          Int
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  accountId       Int
  account         Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  amount          Float     // Always positive; type determines sign
  type            String    // "income" | "expense" | "opening_balance" | "reconciliation"
  category        String    // "salary", "food", "transport", "other", "reconciliation", etc.
  description     String?   // User-provided or auto-generated
  date            DateTime  // Stored in UTC
  
  // Link to recurring rule if auto-created
  recurringTransactionId  Int?
  recurringTransaction    RecurringTransaction?  @relation(fields: [recurringTransactionId], references: [id], onDelete: SetNull)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([userId, date])
  @@index([accountId])
  @@index([recurringTransactionId])
}

// NEW: Recurring Transaction rule
model RecurringTransaction {
  id              Int       @id @default(autoincrement())
  userId          Int
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Rule details
  name            String    // "Netflix Subscription"
  amount          Float     // Always positive
  type            String    // "income" | "expense"
  category        String
  accountId       Int       // Which account to create transactions in
  
  // Schedule
  frequency       String    // "daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"
  dayOfMonth      Int?      // For monthly: 1-31 (null = end of month)
  dayOfWeek       Int?      // For weekly: 0-6 (0=Sunday)
  startDate       DateTime
  endDate         DateTime? // Optional expiration date
  
  // Tracking
  isActive        Boolean   @default(true)
  lastCreatedAt   DateTime? // When last transaction was created
  nextDue         DateTime  // When next transaction would be created
  
  // Generated transactions
  transactions    Transaction[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([userId, isActive])
  @@index([accountId])
}

// NEW: Budget (for future implementation)
model Budget {
  id        Int       @id @default(autoincrement())
  userId    Int
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  category  String
  limit     Float
  spent     Float     @default(0)
  month     Int       // 1-12
  year      Int       // YYYY
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  @@unique([userId, category, month, year])
  @@index([userId, month, year])
}

// Keep existing Investment models as-is for Phase 2
// (InvestmentAccount, Investment, Debt, SavingsGoal unchanged)
```

**Migration Command:**
```bash
npx prisma migrate dev --name add_auth_and_recurring
```

### 3.2 Data Integrity Rules

- **Cascade Deletes:** Deleting a user deletes all related records
- **Account Balance Invariant:** `sum(transactions) = account.balance` (fundamental accounting principle)
  - Opening balance transactions establish the initial balance
  - All subsequent transactions adjust from that baseline
  - Reconciliation transactions correct mid-stream imbalances
- **User Isolation:** Every query filters by `userId` (enforced in middleware)
- **Transaction Types:**
  - `income`: Money in (salary, bonus, refund)
  - `expense`: Money out (groceries, utilities, withdrawal)
  - `opening_balance`: Initial balance for new account (amount = starting balance)
  - `reconciliation`: Mid-stream balance correction (amount = adjustment amount)
  - Auto-detected by system based on transaction history
- **Transaction Amount:** Always positive absolute value; interpretation depends on `type`
- **Transaction Dates:** Always stored in UTC; filters use UTC boundaries
- **Recurring Rules:** `nextDue` calculated based on frequency and last created date
- **Budget Spent:** Calculated dynamically from transactions, not stored; ensures always current

---

## 4. API Specification

### 4.1 Response Format (All Endpoints)

**Every API response** follows this envelope:

```json
{
  "success": true,
  "data": { /* payload, or null on error */ },
  "error": null
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Must be a valid email" }
    ]
  }
}
```

**HTTP Status Codes:**
- `200` — Success
- `201` — Created
- `204` — No content
- `400` — Bad request (validation error)
- `401` — Unauthorized (invalid/missing token)
- `403` — Forbidden (user can't access this resource)
- `404` — Not found
- `409` — Conflict (e.g., email already exists)
- `429` — Rate limited
- `500` — Server error

---

### 4.2 Authentication Endpoints

#### POST /auth/register
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Validation:**
- Email: valid email format, unique (409 if exists)
- Password: min 8 chars, must include uppercase, lowercase, digit, special char
- Name: optional, max 100 chars

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "error": null
}
```

**Error Scenarios:**
- 400: Missing email/password, weak password
- 409: Email already exists

---

#### POST /auth/login
Authenticate user and return tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "error": null
}
```

**Error Scenarios:**
- 401: Invalid email/password
- 429: Too many failed attempts (rate limited: 5/15min per IP)

---

#### POST /auth/refresh
Refresh expired access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "error": null
}
```

**Error Scenarios:**
- 401: Invalid or expired refresh token

---

### 4.3 Account Endpoints

#### GET /accounts
List all accounts for current user.

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Checking",
      "type": "checking",
      "balance": 5000.00,
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "error": null
}
```

---

#### POST /accounts
Create a new account.

**Request:**
```json
{
  "name": "Emergency Fund",
  "type": "savings",
  "balance": 10000.00
}
```

**Validation:**
- name: required, max 100 chars
- type: one of ["checking", "savings", "credit_card"]
- balance: optional, default 0

**Response (201):** Account object

---

#### PUT /accounts/:id
Update account.

**Request:**
```json
{
  "name": "Updated Name",
  "balance": 12000.00
}
```

**Response (200):** Updated account object

**Errors:**
- 404: Account not found
- 403: Not user's account

---

#### DELETE /accounts/:id
Delete account (soft check: warn if has transactions).

**Response (204):** No content

**Behavior:** Hard delete the account; cascade delete all transactions

---

### 4.4 Transaction Endpoints

#### GET /transactions
List transactions with filters.

**Query Parameters:**
```
GET /transactions?accountId=1&startDate=2026-09-01&endDate=2026-09-30&category=food&type=expense&search=grocery&limit=20&offset=0
```

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| accountId | number | (optional) | Filter by account |
| startDate | ISO date | (optional) | Filter start (inclusive) |
| endDate | ISO date | (optional) | Filter end (inclusive) |
| category | string | (optional) | Filter by category |
| type | "income"\|"expense" | (optional) | Filter by type |
| search | string | (optional) | Search description (case-insensitive) |
| limit | number | 20 | Results per page |
| offset | number | 0 | Pagination offset |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "accountId": 1,
      "amount": 45.99,
      "type": "expense",
      "category": "food",
      "description": "Grocery store",
      "date": "2026-09-19T15:30:00Z",
      "recurringTransactionId": null,
      "createdAt": "2026-09-19T15:30:00Z"
    }
  ],
  "error": null
}
```

---

#### POST /transactions
Create a transaction.

**Request:**
```json
{
  "accountId": 1,
  "amount": 45.99,
  "type": "expense",
  "category": "food",
  "description": "Grocery store",
  "date": "2026-09-19"
}
```

**Validation:**
- accountId: required, must be user's account
- amount: required, > 0
- type: required, "income" or "expense"
- category: required
- description: optional
- date: required, valid ISO date

**Response (201):** Transaction object

**Side Effects:**
- Update Account.balance automatically

---

#### PUT /transactions/:id
Update transaction.

**Request:**
```json
{
  "amount": 50.00,
  "category": "groceries"
}
```

**Response (200):** Updated transaction object

**Side Effects:**
- Recalculate Account.balance

---

#### DELETE /transactions/:id
Delete transaction.

**Response (204):** No content

**Side Effects:**
- Recalculate Account.balance

---

#### POST /transactions/import-csv
Import multiple transactions from CSV file.

**Request:**
```
Form Data:
- file: CSV file
- accountId: integer (which account to import to)
```

**CSV Format (Flexible):**
- Auto-detects headers or assumes positional columns
- Positional: date, amount, [type], [category], [description]
- Minimal: date, amount (type defaults to "expense", category to "uncategorized")
- Supports headerless or header-based parsing

**Response (201):**
```json
{
  "success": true,
  "data": {
    "message": "Transactions imported successfully",
    "imported": 5,
    "errors": [
      { "row": 3, "error": "Invalid date format: 2026-13-45" }
    ],
    "transactions": [
      {
        "id": 101,
        "accountId": 1,
        "amount": 45.99,
        "type": "expense",
        "category": "food",
        "description": "Grocery store",
        "date": "2026-09-19T15:30:00Z"
      }
    ]
  },
  "error": null
}
```

**Validation:**
- File must be CSV (text/csv or .csv extension)
- File size max 10MB
- accountId must belong to user
- CSV rows must have at least date and amount

**Error Scenarios:**
- 400: Missing file or accountId
- 403: Account doesn't belong to user
- 400: No valid transactions in CSV (returns error details)

---

#### PUT /accounts/:id/set-balance
Set opening balance for account (creates opening balance transaction).

**Request:**
```json
{
  "balance": 10000.00,
  "date": "2026-09-01"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Opening balance set successfully",
    "account": {
      "id": 1,
      "name": "Checking",
      "type": "checking",
      "balance": 10000.00,
      "createdAt": "2026-01-15T10:30:00Z"
    }
  },
  "error": null
}
```

**Side Effects:**
- Creates "opening_balance" type transaction
- Updates account balance to specified amount
- Transaction appears in transaction history with "Opening Balance" description

**Validation:**
- If account already has transactions before the specified date, returns 400 with error: "Cannot set opening balance to [date]. There are existing transactions before this date."
- Users should use PUT /accounts/:id/adjust-balance instead for mid-stream adjustments

---

#### PUT /accounts/:id/adjust-balance (NEW)
Smart balance adjustment that auto-detects transaction type (opening_balance vs reconciliation).

**Request:**
```json
{
  "balance": 5000.00,
  "date": "2026-09-21"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Balance adjusted successfully. Created reconciliation transaction.",
    "account": {
      "id": 1,
      "name": "Checking",
      "type": "checking",
      "balance": 5000.00
    },
    "transaction": {
      "id": 52,
      "type": "reconciliation",
      "amount": -500.00,
      "description": "Account reconciliation - balance adjusted from 5500.00 to 5000.00",
      "date": "2026-09-21T00:00:00Z"
    }
  },
  "error": null
}
```

**Behavior:**
- **First time (no existing transactions):** Auto-detects as "opening_balance" type
- **Mid-stream (has existing transactions):** Auto-detects as "reconciliation" type
- Calculates adjustment amount automatically: `newBalance - currentBalance`
- Creates transaction with appropriate type and descriptive message
- No user selection needed—system determines type based on transaction history
- Maintains invariant: `sum(transactions) = account.balance` (accounting principle)

**Validation:**
- Balance must be non-negative number
- Date must be ISO format string
- Returns 404 if account doesn't exist or doesn't belong to user
- Returns 400 if invalid input

---

### 4.5 Recurring Transaction Endpoints

#### GET /recurring
List all recurring rules for current user.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Netflix Subscription",
      "amount": 15.99,
      "type": "expense",
      "category": "entertainment",
      "accountId": 1,
      "frequency": "monthly",
      "dayOfMonth": 15,
      "dayOfWeek": null,
      "startDate": "2026-01-15T00:00:00Z",
      "endDate": null,
      "isActive": true,
      "lastCreatedAt": "2026-09-15T02:00:00Z",
      "nextDue": "2026-10-15T00:00:00Z"
    }
  ],
  "error": null
}
```

---

#### POST /recurring
Create a recurring transaction rule.

**Request:**
```json
{
  "name": "Gym Membership",
  "amount": 50.00,
  "type": "expense",
  "category": "health",
  "accountId": 1,
  "frequency": "monthly",
  "dayOfMonth": 1,
  "startDate": "2026-09-01"
}
```

**Validation:**
- name: required
- amount: required, > 0
- type: "income" or "expense"
- category: required
- accountId: required, must be user's
- frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly"
- dayOfMonth: 1-31 (required if monthly)
- dayOfWeek: 0-6 (required if weekly)
- startDate: required, valid date

**Response (201):** Recurring rule object

**Calculation of nextDue:**
- For monthly: startDate + N months
- For weekly: startDate + N weeks
- For daily: startDate + N days
- Etc.

---

#### PUT /recurring/:id
Update recurring rule.

**Request:**
```json
{
  "name": "Updated Name",
  "amount": 60.00,
  "isActive": false
}
```

**Important:** Editing a rule does NOT affect previously created transactions, only future ones.

**Response (200):** Updated rule object

---

#### DELETE /recurring/:id
Delete recurring rule.

**Response (204):** No content

**Note:** Does not delete previously created transactions.

---

#### POST /recurring/:id/create-once
**[MVP Only]** Manually create one transaction from this rule.

**Request:**
```json
{
  "forDate": "2026-10-15"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 102,
    "accountId": 1,
    "amount": 15.99,
    "type": "expense",
    "category": "entertainment",
    "description": "Netflix Subscription",
    "date": "2026-10-15T00:00:00Z",
    "recurringTransactionId": 1,
    "createdAt": "2026-09-19T14:22:00Z"
  },
  "error": null
}
```

**Use Case:** For testing recurring transactions without a cron job. In Phase 2, this endpoint will be called automatically by the cron scheduler.

---

### 4.6 Dashboard Endpoint

#### GET /dashboard/metrics
Get key metrics for dashboard display.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "netWorth": 50000.00,
    "availableFunds": 10000.00,
    "totalDebt": 25000.00,
    "recentTransactions": [
      {
        "id": 101,
        "accountId": 1,
        "amount": 45.99,
        "type": "expense",
        "category": "food",
        "description": "Grocery store",
        "date": "2026-09-19T15:30:00Z"
      }
    ],
    "upcomingRecurring": [
      {
        "id": 1,
        "name": "Netflix Subscription",
        "amount": 15.99,
        "nextDue": "2026-10-15T00:00:00Z"
      }
    ]
  },
  "error": null
}
```

**Calculations:**
- netWorth = sum(Account.balance) for all user accounts
- availableFunds = sum(Account.balance) for checking/savings accounts only
- totalDebt = (placeholder for Phase 2; return 0 for MVP)
- recentTransactions = last 5 transactions, ordered by date DESC
- upcomingRecurring = recurring rules due in next 7 days (isActive=true)

#### Dashboard Navigation

**Clickable Cards on Dashboard:**
The dashboard includes both metric cards and clickable navigation cards:

**Metric Cards (Left Column):**
- Net Worth: Shows combined account balance (toggleable to exclude debt)
- Available Funds: Shows checking/savings only
- **Savings: Clickable → navigates to /savings page** ⭐
- Debt: Shows total outstanding debt

**Page Cards (Right Column):**
- Transactions: Clickable → /transactions
- Budgeting: Clickable → /budgets
- Investments: Clickable → /investments

**Implementation:** Clickable cards use `onClick={() => navigate("/path")}` with `cursor-pointer` and `group` classes. Arrow icon animates on hover with `group-hover:translate-x-1`.

#### Dashboard Header Spacing (September 21, 2026 Optimization)

**Compact Header Design** — Minimizes vertical space between welcome text and first card:

```jsx
<div className="mb-2 flex flex-col gap-2">
  {/* Welcome text and filter buttons on same row */}
  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
    <div>
      <h1>Welcome, Trish</h1>
      <p>Financial Snapshot</p>
    </div>
    {/* Filter buttons */}
  </div>
  
  {/* Filter dropdowns - pulled up slightly */}
  <div className="flex flex-wrap gap-2 justify-end items-center h-10 -mt-2">
    {/* Day/Month/Year/All Time dropdowns */}
  </div>
</div>
```

**Spacing Details:**
- Header margin: `mb-2` (0.5rem) — reduced from `mb-4` (1rem)
- Welcome to filters gap: `gap-2` (0.5rem) — reduced from `gap-4` (1rem)
- Button vertical alignment: `lg:items-start` — aligns to heading height instead of center
- Dropdowns gap: `gap-2` (0.5rem) — reduced from `gap-3` (0.75rem)
- Dropdowns pull-up: `-mt-2` (-0.5rem) — brings dropdowns closer to buttons
- **Layout stability:** Reserves `h-10` height to prevent card shift when "All Time" filter hides dropdowns

**Result:** Significantly reduced whitespace while maintaining professional appearance and layout stability.

---

## 5. Frontend Implementation

### 5.1 Component Structure (MVP)

```
App.tsx (Router, Auth Context)
├── ProtectedRoute.tsx (guards private pages)
├── Layout.tsx (Nav + main container)
├── Pages/
│   ├── Login.tsx (email/password form)
│   ├── Register.tsx (signup form)
│   ├── Dashboard.tsx (metrics + recent activity)
│   ├── Transactions.tsx (CRUD list + form)
│   └── Accounts.tsx (select/switch account)
└── Components/
    ├── GlowCard.tsx (styled container)
    ├── TransactionForm.tsx (reusable form)
    ├── TransactionList.tsx (table/list)
    └── LoadingSpinner.tsx (simple loader)
```

### 5.2 Auth State Management

```typescript
// Context: frontend/src/context/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// Provider wraps entire app
// Stores token in localStorage (web/desktop-PWA)
// Sends as Authorization header in all API calls
```

### 5.2.5 API Calling Pattern (CRITICAL)

**All authenticated API calls MUST use the `apiCall()` helper function**, not plain `fetch()`. This ensures the Authorization header is automatically included.

**Example - CORRECT:**
```typescript
// frontend/src/utils/api.ts
export async function apiCall(path: string, options?: RequestInit) {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`http://localhost:3000/api${path}`, {
    ...options,
    headers,
  });
  return response;
}

// Usage in pages:
const budgets = await apiCall('/budgets?month=9&year=2026');
const data = await budgets.json();

// For POST:
const response = await apiCall('/budgets', {
  method: 'POST',
  body: JSON.stringify({ category: 'food', limit: 300 })
});
```

**Example - WRONG (will fail with 401):**
```typescript
// ❌ DO NOT DO THIS - MISSING AUTHORIZATION HEADER
const response = await fetch('http://localhost:3000/api/budgets');
```

**Why This Matters:**
- Without the Authorization header, protected endpoints return 401 Unauthorized
- Pages will load but show blank/empty content because API calls fail silently
- This was the root cause of the Budget page blank white screen issue

**Applied to All Pages:**
- ✅ Dashboard.tsx
- ✅ Transactions.tsx
- ✅ Budgets.tsx (fixed)
- ✅ Investments.tsx
- ✅ Debt.tsx
- ✅ Savings.tsx
- ✅ Reports.tsx

### 5.3 TypeScript Interfaces

```typescript
// User
interface User {
  id: number;
  email: string;
  name: string | null;
}

interface AuthResponse {
  id: number;
  email: string;
  name: string | null;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// Account
interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  createdAt: string;
}

// Transaction
interface Transaction {
  id: number;
  accountId: number;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string | null;
  date: string;
  recurringTransactionId: number | null;
  createdAt: string;
}

// Recurring Transaction
interface RecurringTransaction {
  id: number;
  name: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  accountId: number;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  lastCreatedAt: string | null;
  nextDue: string;
}

// Dashboard
interface DashboardMetrics {
  netWorth: number;
  availableFunds: number;
  totalDebt: number;
  recentTransactions: Transaction[];
  upcomingRecurring: Array<{
    id: number;
    name: string;
    amount: number;
    nextDue: string;
  }>;
}

// API Response Envelope
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  } | null;
}
```

### 5.4 Error Handling Pattern

```typescript
// Frontend pattern for API calls
async function fetchData<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('authToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    // Show error toast
    throw new Error(result.error?.message || 'Unknown error');
  }

  return result.data;
}

// Usage
try {
  const transactions = await fetchData<Transaction[]>('/transactions');
  setTransactions(transactions);
} catch (error) {
  setError(error.message);
  showErrorToast(error.message);
}
```

### 5.5 Form Validation

```typescript
// Simple validation utility
const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must include uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must include lowercase letter';
  if (!/\d/.test(password)) return 'Password must include digit';
  if (!/[!@#$%^&*]/.test(password)) return 'Password must include special character';
  return null;
};

// Use in form submit
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  
  if (emailError || passwordError) {
    setErrors({ email: emailError, password: passwordError });
    return;
  }
  
  // Submit form
};
```

### 5.6 Design System: Glow Card Component

All dashboard cards and content containers use the **Glow Card system** - a glassy, transparent card design with vibrant bottom ombre glows and subtle colored borders.

#### 5.6.1 Glow Card Structure & Styling

**HTML Structure:**
```tsx
<div className="glow-card glow-{color-type}">
  {/* content */}
</div>
```

**CSS Properties (required in all pages using glow cards):**

```css
.glow-card {
  position: relative;
  border-radius: 1.5rem;
  padding: 1.5rem;
  background: rgba(10, 15, 30, 0.3);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 0.3px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  overflow: hidden;
}

/* Muted colored border - opacity increases on hover */
.glow-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 1.5rem;
  padding: 1px;
  background: linear-gradient(135deg, var(--color-1), var(--color-2));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 10;
  opacity: 0.35;
  transition: opacity 0.3s ease;
}

.glow-card:hover::after {
  opacity: 0.6;
}

/* Bottom ombre glow + side accents + hover left-oval effect */
.glow-card::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  background:
    linear-gradient(to top, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 5%, transparent 15%),
    radial-gradient(ellipse 20% 250% at 1% 115%, var(--glow-color-dim) 0%, transparent 25%),
    radial-gradient(ellipse 20% 250% at 99% 115%, var(--glow-color-dim) 0%, transparent 25%),
    linear-gradient(to top, var(--glow-color) 0%, var(--glow-color-dim) 20%, var(--glow-color-dim) 35%, transparent 70%);
  z-index: 1;
  pointer-events: none;
  opacity: 0.9;
  transition: opacity 0.3s ease;
}

.glow-card:hover::before {
  opacity: 1;
  background:
    radial-gradient(ellipse 60% 120% at -10% 50%, var(--glow-color-dim) 0%, transparent 40%),
    linear-gradient(to top, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 5%, transparent 15%),
    radial-gradient(ellipse 20% 250% at 1% 115%, var(--glow-color-dim) 0%, transparent 25%),
    radial-gradient(ellipse 20% 250% at 99% 115%, var(--glow-color-dim) 0%, transparent 25%),
    linear-gradient(to top, var(--glow-color) 0%, var(--glow-color-dim) 20%, var(--glow-color-dim) 35%, transparent 70%);
}
```

**Features:**
- Glassy transparent background with 20px backdrop blur
- Ultra-thin 0.3px white border for minimal visual weight
- Muted colored gradient borders (0.35 opacity, 0.6 on hover)
- White-to-color bottom ombre glow fading upward
- Subtle colored glows at bottom corners
- Hover left-oval effect that brightens (not darkens) the card
- All color changes smooth over 0.3s

#### 5.6.2 Color Class Definitions

Each glow card type has a unique color pair for visual distinction:

```css
.glow-red {
  --color-1: #ff6b6b;
  --color-2: #ffa94d;
  --glow-color: rgba(255, 107, 107, 0.8);
  --glow-color-dim: rgba(255, 107, 107, 0.2);
}

.glow-cyan {
  --color-1: #00d9ff;
  --color-2: #0099ff;
  --glow-color: rgba(0, 217, 255, 0.8);
  --glow-color-dim: rgba(0, 217, 255, 0.2);
}

.glow-purple {
  --color-1: #c77dff;
  --color-2: #ff006e;
  --glow-color: rgba(199, 125, 255, 0.8);
  --glow-color-dim: rgba(199, 125, 255, 0.2);
}

.glow-blue {
  --color-1: #00b4ff;
  --color-2: #0066ff;
  --glow-color: rgba(0, 180, 255, 0.8);
  --glow-color-dim: rgba(0, 180, 255, 0.2);
}

.glow-green {
  --color-1: #00d97e;
  --color-2: #00a86b;
  --glow-color: rgba(0, 217, 126, 0.8);
  --glow-color-dim: rgba(0, 217, 126, 0.2);
}
```

**Color Assignments (Dashboard):**
- Red/Orange: Net Worth card
- Cyan: Available Funds, Transactions page
- Purple: Debt, Budgeting page
- Blue: Savings, Debt details
- Green: Investments page

#### 5.6.3 Page Background

All pages must use pure black background with minimal grey center for optimal glow contrast:

```tsx
<div className="min-h-screen p-4 md:p-8" style={{background: 'linear-gradient(to bottom right, #000000, #0f0f0f, #000000)'}}>
```

This creates subtle depth without color hue and pairs perfectly with vibrant card glows.

---

## 6. Backend Implementation

### 6.1 Project Structure

```
backend/
├── src/
│   ├── server.ts (Express app)
│   ├── middleware/
│   │   ├── auth.ts (JWT verification)
│   │   ├── errorHandler.ts (error responses)
│   │   └── cors.ts (CORS config)
│   ├── routes/
│   │   ├── auth.ts (register, login, refresh)
│   │   ├── accounts.ts (CRUD)
│   │   ├── transactions.ts (CRUD + search)
│   │   ├── recurring.ts (CRUD + manual create)
│   │   └── dashboard.ts (metrics)
│   ├── services/
│   │   ├── auth.service.ts (password hashing, JWT)
│   │   ├── transaction.service.ts (calculations)
│   │   └── recurring.service.ts (scheduling logic)
│   └── utils/
│       ├── validators.ts (input validation)
│       └── errors.ts (error classes)
├── prisma/
│   ├── schema.prisma (updated)
│   └── seed.ts (test data)
└── __tests__/
    ├── auth.test.ts
    ├── transactions.test.ts
    └── recurring.test.ts
```

### 6.2 Auth Service

```typescript
// src/services/auth.service.ts
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  email: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = 10;
    return bcrypt.hash(password, salt);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateTokens(userId: number, email: string) {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret';

    const token = jwt.sign(
      { userId, email } as JwtPayload,
      secret,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId, email },
      refreshSecret,
      { expiresIn: '7d' }
    );

    return { token, refreshToken, expiresIn: 3600 };
  }

  static verifyToken(token: string): JwtPayload | null {
    try {
      const secret = process.env.JWT_SECRET || 'dev-secret';
      return jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  static verifyRefreshToken(token: string): JwtPayload | null {
    try {
      const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret';
      return jwt.verify(token, refreshSecret) as JwtPayload;
    } catch (error) {
      return null;
    }
  }
}
```

### 6.3 Middleware: Auth

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

interface AuthRequest extends Request {
  userId?: number;
  email?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header'
      }
    });
  }

  const token = authHeader.substring(7);
  const payload = AuthService.verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    });
  }

  req.userId = payload.userId;
  req.email = payload.email;
  next();
};
```

### 6.3.4 Budget Spent Calculation (Dynamic)

**Key Point:** Budget `spent` is calculated dynamically from transactions, not stored in DB.

```typescript
// GET /budgets endpoint
app.get('/api/budgets', authMiddleware, async (req: AuthRequest, res) => {
  const { month, year } = req.query;
  const userId = req.userId || DEFAULT_USER_ID;

  // Fetch budgets for month/year
  const budgets = await prisma.budget.findMany({
    where: { userId, month: parseInt(month), year: parseInt(year) }
  });

  // Calculate spent amount for each budget from transactions
  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      // Use UTC date boundaries to match transaction timestamps
      const startDate = new Date(Date.UTC(year, month - 1, 1)); // First day of month
      const endDate = new Date(Date.UTC(year, month, 1));       // First day of next month

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          category: budget.category,
          type: 'expense',
          date: { gte: startDate, lt: endDate }  // UTC comparison
        }
      });

      const spent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      return { ...budget, spent };
    })
  );

  res.json(budgetsWithSpent);
});
```

**Why UTC Matters:**
- All transactions stored with UTC timestamps
- Local timezone offsets would cause date filtering to miss/include wrong transactions
- Use `Date.UTC()` to ensure consistent date boundaries across all timezones

**Example:**
- Budget: Food, Sept 2026, $300 limit
- Transactions: $50 (Sept 2), $30 (Sept 5)
- Spent calculation: $50 + $30 = $80
- Percentage: (80 / 300) * 100 = 26.67%

### 6.3.4.5 CSV Import Parser

**Flexible Parser Supports Multiple Formats:**

```typescript
// src/utils/csvParser.ts
interface CsvTransaction {
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
}

export function parseCSV(csvText: string): {
  transactions: CsvTransaction[];
  errors: Array<{ row: number; error: string }>;
} {
  const lines = csvText.trim().split('\n');
  const transactions: CsvTransaction[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  // Auto-detect headers
  const hasHeaders = detectHeaders(lines[0]);
  const startRow = hasHeaders ? 1 : 0;

  lines.slice(startRow).forEach((line, index) => {
    try {
      const row = parseRow(line, hasHeaders, index + startRow + 1);
      if (row) transactions.push(row);
    } catch (error) {
      errors.push({ row: index + startRow + 1, error: error.message });
    }
  });

  return { transactions, errors };
}

function detectHeaders(firstLine: string): boolean {
  // Check for keywords: date, amount, type, category, description
  return /date|amount|type|category|description/i.test(firstLine);
}

function parseRow(line: string, hasHeaders: boolean, rowNum: number): CsvTransaction | null {
  const columns = line.split(',').map(c => c.trim());
  
  if (!hasHeaders) {
    // Positional: [date, amount, type?, category?, description?]
    return {
      date: columns[0],
      amount: parseFloat(columns[1]),
      type: detectType(columns[2] || ''),
      category: columns[3] || 'uncategorized',
      description: columns[4] || ''
    };
  } else {
    // Header-based: find by column name
    // ... map columns to fields
  }
}

function detectType(typeStr: string): 'income' | 'expense' {
  const lowerStr = typeStr.toLowerCase();
  if (/income|deposit|salary|bonus/.test(lowerStr)) return 'income';
  return 'expense'; // Default to expense
}
```

**Supported Formats:**
1. **Headerless positional:** `2026-09-01,100.00,expense,food,grocery`
2. **Headers:** `date,amount,type,category,description`
3. **Minimal:** `2026-09-01,100.00` (auto-detects as expense, uncategorized)
4. **Type inference:** "Salary" → income, "Lunch" → expense

**Error Handling:**
- Returns detailed errors with row numbers
- Skips invalid rows, imports valid ones
- Returns summary: "5 transactions imported, 1 error"

### 6.3.5 Account Balance Management

**Key Invariant:** `sum(transactions) = account.balance` (fundamental accounting principle)

#### Opening Balance Validation (PUT /accounts/:id/set-balance)

```typescript
// Before creating opening_balance transaction, validate no earlier transactions exist
const existingTransactions = await prisma.transaction.findMany({
  where: {
    accountId: accountId,
    date: { lt: new Date(requestedDate) }  // Transactions BEFORE the opening balance date
  }
});

if (existingTransactions.length > 0) {
  throw new ValidationError(
    'date',
    `Cannot set opening balance to ${requestedDate}. There are existing transactions before this date.`
  );
}
```

**Rationale:** Setting an opening balance date in the past, after existing transactions, creates a logical inconsistency. For example:
- Account has transaction from Sept 1 for $100
- User tries to set opening balance to Sept 15
- This implies: balance was set on Sept 15, but transactions exist from Sept 1 → impossible

#### Smart Balance Adjustment (PUT /accounts/:id/adjust-balance)

```typescript
// Auto-detect transaction type based on transaction history
const existingTransactions = await prisma.transaction.findMany({
  where: { accountId: accountId }
});

const transactionType = existingTransactions.length === 0
  ? 'opening_balance'  // First time: no history
  : 'reconciliation';   // Mid-stream: user reconciling existing balance

// Calculate adjustment amount
const currentBalance = account.balance;
const adjustmentAmount = newBalance - currentBalance;

// Create transaction with auto-detected type
const transaction = await prisma.transaction.create({
  data: {
    accountId,
    userId,
    type: transactionType,
    amount: adjustmentAmount,
    category: transactionType === 'opening_balance' ? 'other' : 'reconciliation',
    description: `Account ${transactionType === 'opening_balance' ? 'opening balance' : 'reconciliation'} - balance adjusted from ${currentBalance.toFixed(2)} to ${newBalance.toFixed(2)}`,
    date: new Date(requestedDate),
  }
});

// Update account balance
await prisma.account.update({
  where: { id: accountId },
  data: { balance: newBalance }
});
```

**Benefits of Smart Detection:**
- Simpler UX: No user selection needed
- System determines intent from data
- Clear audit trail (type shows whether opening or reconciliation)
- Prevents user confusion (no form dropdown to misunderstand)

### 6.4 Error Handling

```typescript
// src/utils/errors.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
  }
}

export const ValidationError = (field: string, message: string) =>
  new ApiError('VALIDATION_ERROR', message, 400, [{ field, message }]);

export const UnauthorizedError = () =>
  new ApiError('UNAUTHORIZED', 'Invalid credentials', 401);

export const NotFoundError = () =>
  new ApiError('NOT_FOUND', 'Resource not found', 404);

export const DuplicateError = (field: string) =>
  new ApiError('DUPLICATE', `${field} already exists`, 409);

// src/middleware/errorHandler.ts
import { Response } from 'express';
import { ApiError } from '../utils/errors';

export const errorHandler = (err: unknown, res: Response) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      data: null,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    data: null,
    error: {
      code: 'SERVER_ERROR',
      message: 'Internal server error'
    }
  });
};
```

### 6.5 Transaction Route (Example)

```typescript
// src/routes/transactions.ts
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { ApiError, ValidationError } from '../utils/errors';

const router = Router();

interface AuthRequest extends Request {
  userId?: number;
}

// GET /transactions
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      accountId,
      startDate,
      endDate,
      category,
      type,
      search,
      limit = '20',
      offset = '0'
    } = req.query;

    const where: any = { userId: req.userId };

    if (accountId) where.accountId = parseInt(accountId as string);
    if (category) where.category = category as string;
    if (type) where.type = type as string;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    if (search) {
      where.description = { contains: search as string, mode: 'insensitive' };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: transactions,
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch transactions' }
    });
  }
});

// POST /transactions
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { accountId, amount, type, category, description, date } = req.body;

    // Validation
    if (!accountId) throw ValidationError('accountId', 'Account is required');
    if (!amount || amount <= 0) throw ValidationError('amount', 'Amount must be positive');
    if (!type || !['income', 'expense'].includes(type)) {
      throw ValidationError('type', 'Type must be income or expense');
    }
    if (!category) throw ValidationError('category', 'Category is required');
    if (!date) throw ValidationError('date', 'Date is required');

    // Verify account belongs to user
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account || account.userId !== req.userId) {
      throw new ApiError('FORBIDDEN', 'Cannot access this account', 403);
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.userId,
        accountId,
        amount,
        type,
        category,
        description,
        date: new Date(date)
      }
    });

    // Update account balance
    const sign = type === 'income' ? 1 : -1;
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: amount * sign } }
    });

    res.status(201).json({
      success: true,
      data: transaction,
      error: null
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        data: null,
        error: { code: error.code, message: error.message, details: error.details }
      });
    }
    res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: 'Failed to create transaction' }
    });
  }
});

export default router;
```

---

## 7. Security Requirements

### 7.1 Password Policy

- **Minimum 8 characters**
- **Must include:** uppercase letter, lowercase letter, digit, special character
- **Hashing:** bcrypt with 10 rounds (cost factor)
- **Never** return passwordHash in API responses

### 7.2 Authentication Security

- **JWT Algorithm:** HS256 (HMAC-SHA256) for MVP; RS256 (RSA) for production
- **Access Token Expiry:** 1 hour
- **Refresh Token Expiry:** 7 days
- **Token Storage (Web/Desktop-PWA):** localStorage (same-origin only)
- **Token Storage (Mobile):** Expo SecureStore (Phase 2)

### 7.3 Rate Limiting

- **Login attempts:** 5 failed attempts per IP = 15 minute lockout
- **API requests:** General rate limit: 100 requests per minute per user (not enforced in MVP, design for it)

**Implementation (MVP):**
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true
});

app.post('/auth/login', loginLimiter, authLoginController);
```

### 7.4 Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet());
app.use((req, res, next) => {
  res.set({
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });
  next();
});
```

### 7.5 Data Isolation

- **Every query** must filter by `userId` (enforced in auth middleware)
- **No user** can access another user's data
- **Deletion:** Hard delete on user request (cascades to all related records)

---

## 8. Testing Strategy

### 8.1 Unit Tests (Backend)

**Scope:** Auth service, validation, calculations  
**Tool:** Jest  
**Coverage Target:** 80%+ for critical paths

```typescript
// __tests__/auth.service.test.ts
describe('AuthService', () => {
  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'TestPass123!';
      const hash = await AuthService.hashPassword(password);
      const isValid = await AuthService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });
  });

  describe('generateTokens', () => {
    it('should return valid JWT tokens', () => {
      const { token, refreshToken, expiresIn } = AuthService.generateTokens(1, 'user@example.com');
      expect(token).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(expiresIn).toBe(3600);
    });
  });
});
```

### 8.2 Integration Tests (Backend)

**Scope:** Full API flows (register → login → create transaction)  
**Tool:** Jest + Supertest

```typescript
// __tests__/transactions.integration.test.ts
describe('Transaction API', () => {
  let token: string;
  let accountId: number;

  beforeAll(async () => {
    // Register user, get token
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'Test User'
      });
    token = res.body.data.token;

    // Create account
    const accountRes = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Account', type: 'checking', balance: 1000 });
    accountId = accountRes.body.data.id;
  });

  it('should create a transaction', async () => {
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        accountId,
        amount: 50,
        type: 'expense',
        category: 'food',
        description: 'Test expense',
        date: '2026-09-19'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(50);
  });
});
```

### 8.3 E2E Tests (Critical Path)

**Scope:** One complete user journey  
**Tool:** Playwright  
**Test:** Register → Add Account → Add Transaction → View Dashboard

```typescript
// e2e/critical-path.spec.ts
import { test, expect } from '@playwright/test';

test('critical path: register and add transaction', async ({ page }) => {
  // 1. Register
  await page.goto('http://localhost:5173/register');
  await page.fill('input[name="email"]', 'e2e@example.com');
  await page.fill('input[name="password"]', 'TestPass123!');
  await page.fill('input[name="name"]', 'E2E User');
  await page.click('button:has-text("Register")');

  // 2. Wait for redirect to dashboard
  await page.waitForURL('**/dashboard');

  // 3. Create account
  await page.click('button:has-text("Add Account")');
  await page.fill('input[name="accountName"]', 'Test Account');
  await page.click('button:has-text("Create")');

  // 4. Add transaction
  await page.click('button:has-text("Add Transaction")');
  await page.fill('input[name="amount"]', '50');
  await page.selectOption('select[name="category"]', 'food');
  await page.click('button:has-text("Save")');

  // 5. Verify dashboard shows transaction
  await expect(page.locator('text=Food')).toBeVisible();
  await expect(page.locator('text=$50.00')).toBeVisible();
});
```

### 8.4 Test Checklist (MVP)

- [ ] Auth: Register validation (email, password strength)
- [ ] Auth: Login with valid/invalid credentials
- [ ] Auth: JWT token refresh
- [ ] Accounts: Create, read, update, delete
- [ ] Transactions: Create, read (with filters), update, delete
- [ ] Transactions: Account balance updated on create/delete
- [ ] Recurring: Create rule with various frequencies
- [ ] Recurring: Manual create-once endpoint
- [ ] Recurring: Calculate nextDue correctly
- [ ] Dashboard: Metrics calculation
- [ ] Dashboard: Recent transactions listed
- [ ] Error Handling: Validation errors return proper code + details
- [ ] Error Handling: Unauthorized returns 401
- [ ] Error Handling: Duplicate email returns 409
- [ ] Rate Limiting: 5 failed logins blocks for 15 min

---

## 9. Environment Variables

### Development (.env.local)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/moneyflow"

# Auth
JWT_SECRET="dev-secret-key-change-in-production"
REFRESH_TOKEN_SECRET="dev-refresh-secret-change-in-production"

# Server
NODE_ENV="development"
PORT=3000

# CORS
CORS_ORIGIN="http://localhost:5173"
```

### Production (.env.production)

```bash
# Database (Railway, Render, Supabase)
DATABASE_URL="postgresql://user:pass@prod-db.railway.app:5432/moneyflow"

# Auth (Generate with strong secrets)
JWT_SECRET="<production-secret-from-env-vars>"
REFRESH_TOKEN_SECRET="<production-refresh-secret-from-env-vars>"

# Server
NODE_ENV="production"
PORT=3000

# CORS
CORS_ORIGIN="https://moneyflow.app"

# Optional: Sentry, error tracking
SENTRY_DSN="https://..."
```

---

## 10. Deployment Checklist

### Before Launch

- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] Seed script works (`npx ts-node prisma/seed.ts`)
- [ ] Backend tests pass (`npm test`)
- [ ] E2E tests pass (`npm run e2e`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in browser devtools
- [ ] All API endpoints tested manually
- [ ] Auth tokens refresh correctly
- [ ] Account balance updates correctly
- [ ] Rate limiting tested (5 failed logins)
- [ ] Security headers present
- [ ] Environment variables set on hosting platform

### Deployment Platforms

**Backend:** Railway, Render, or Supabase  
**Frontend:** Vercel or Netlify  
**Database:** Supabase, Railway, or managed PostgreSQL  

### Monitoring (Optional)

- Sentry for error tracking
- Uptime Robot for availability
- Simple logging to stdout (viewed in platform dashboard)

---

## 11. Development Workflow (1-2 Week Sprint)

### Day 1: Foundation
- [ ] Migrate Prisma schema (add User, RecurringTransaction, Budget)
- [ ] Implement auth service (hash, JWT, tokens)
- [ ] Auth endpoints (register, login, refresh)
- [ ] Auth middleware
- [ ] Update HANDOFF.md with progress

### Day 2: Accounts & Core Pages
- [ ] Account CRUD endpoints
- [ ] Login/Register frontend pages
- [ ] Dashboard skeleton
- [ ] Transactions CRUD endpoints
- [ ] Transactions frontend page
- [ ] Basic testing

### Day 3: Recurring & Polish
- [ ] Recurring transaction CRUD + manual create endpoint
- [ ] Dashboard metrics endpoint
- [ ] Dashboard UI (metrics, recent activity, upcoming)
- [ ] Error handling throughout

### Day 4-5: Testing & Refinement
- [ ] Unit tests (auth, validation)
- [ ] Integration tests (critical paths)
- [ ] E2E test (register → transaction → dashboard)
- [ ] Bug fixes, edge cases
- [ ] Performance check (N+1 queries)

### Day 6-7: Deployment & Docs
- [ ] Deploy to staging
- [ ] Final testing on staging
- [ ] Deploy to production
- [ ] Documentation (README, API docs)
- [ ] Handoff to next phase (PWA, Electron)

---

## 12. Phase 2 Roadmap (After MVP)

- [ ] Cron job for automatic recurring transaction creation
- [ ] Budgets CRUD + progress tracking
- [ ] Investments & debt pages
- [ ] Reports & analytics (charts)
- [ ] Electron desktop app
- [ ] PWA with offline support
- [ ] Mobile app (React Native)
- [ ] Bank API integration (Plaid)
- [ ] CSV import

---

## Appendix A: Error Codes Reference

| Code | Status | Scenario |
|------|--------|----------|
| UNAUTHORIZED | 401 | Missing/invalid token |
| FORBIDDEN | 403 | User can't access resource |
| NOT_FOUND | 404 | Resource doesn't exist |
| VALIDATION_ERROR | 400 | Invalid input (with details) |
| DUPLICATE | 409 | Email/unique constraint exists |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Unexpected error |

---

## Appendix B: Category Options (MVP)

**Expense Categories:**
- food
- transport
- utilities
- entertainment
- healthcare
- shopping
- other

**Income Categories:**
- salary
- bonus
- freelance
- investment
- other

---

## Appendix C: Account Types

- checking
- savings
- credit_card

---

**End of Specification**

**Ready for development.** A solo developer can implement this MVP in 1-2 weeks, focusing on Days 1-3 for core features and Days 4-7 for testing and deployment.

Generated: September 19, 2026
