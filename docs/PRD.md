# MoneyFlow — PRD (Personal Launch v1)

**Owner:** Trish · **Date:** 2026-10-01 · **Status:** Source of truth for scope. If this PRD and `MONEYFLOW_SPEC.md` disagree, this PRD wins.

---

## 1. Problem Statement

My money is spread across checking, savings, credit cards, investments and debts, and no single place shows me where it's going, whether I'm on budget, and whether I'm making progress toward my goals.

## 2. Target User & Value Prop

**User:** Me (Trish). I'm the only user, on a deployed web app I can open from my laptop or phone browser.
**Value prop:** One private dashboard that turns every account, transaction, budget, goal, investment and debt into an accurate picture of my net worth and spending.

## 3. Core User Journey

1. I open the deployed URL and log in. (Registration is closed. Only my account exists.)
2. **First run:** I create my accounts (checking, savings, credit card) and set each opening balance.
3. I import a bank CSV into an account. Then I review the import summary (imported count plus row-level errors) and fix any uncategorized rows.
4. **Day to day:** I add, edit or delete transactions, assigning a category and an optional subcategory. When a recurring bill comes due, I log it in one click from its recurring rule.
5. When a balance drifts from my bank's, I enter the real balance, and the app creates a reconciliation transaction.
6. I set monthly budgets per category and watch spent vs. limit update as I add transactions.
7. I track savings goals, investment accounts and debts on their own pages.
8. The Dashboard shows net worth, available funds, total debt, recent transactions and upcoming recurring items. Reports show spending by category and the trend over time.

## 4. MVP Must-Haves

1. **Secure single-owner access.** Login, refresh tokens, logout and a protected route on every page and endpoint. Registration is disabled in production.
2. **Ledger.** Accounts, transactions, user categories and subcategories, CSV import, opening balance and reconciliation, and recurring rules with a manual "create once" action.
3. **Planning.** Monthly budgets per category, with spent calculated live, and savings goals with progress.
4. **Wealth & liabilities.** Investment accounts (brokerage, 401k, Roth IRA, etc.) with current values, and debts with balance and interest rate.
5. **Dashboard & reports, deployed.** Dashboard metrics and navigation cards, plus a Reports page with spending by category (bar or pie) and a monthly trend line. Live at an HTTPS URL.

## 5. Non-Goals (v2+)

- Public sign-up, multiple users, sharing, email verification, a password-reset flow (single owner, so reset by script)
- Automatic recurring creation (cron/scheduler)
- Bank linking (Plaid) or live investment price feeds; investment values are entered manually
- PWA install or offline mode, the Electron desktop app, the React Native mobile app
- Multi-currency, push or email notifications, budget rollover
- Visual redesign; the existing Glow Card system stays as-is

## 6. Data & State

**Models:** User, Account, Transaction, Category, Subcategory, RecurringTransaction, Budget, SavingsGoal, InvestmentAccount (or Investment), Debt. Every user-owned row has `userId`, and every query filters by it.

**Binding rules. The code must match these. Where it doesn't, fix the code.**

- **Money:** All money fields are Prisma `Decimal`, never `Float`. Format to 2 decimals only at the UI edge.
- **Passwords:** argon2 (replaces bcrypt).
- **Transactions:** `type` is one of `income | expense | opening_balance | reconciliation`. Income and expense amounts are always > 0, and `type` sets the sign. Opening balance and reconciliation amounts are signed deltas.
- **Balance invariant:** For every account, the stored `Account.balance` equals the signed sum of its transactions after every create, edit, delete, import or adjustment. Each write and its balance update happen in one DB transaction.
- **Categories:** Transactions reference `categoryId` (FK) and an optional `subcategoryId`, not free-text strings. New users get the 7 default categories at seed or registration.
- **Budgets:** `spent` is never stored. Drop the column, and calculate spent from expense transactions in that category for that UTC month.
- **Dates:** Stored in UTC. Month boundaries use `Date.UTC`.
- **Dashboard math:**
  - `availableFunds` = checking + savings
  - `totalDebt` = Debt balances + credit card balances owed
  - `netWorth` = account balances + investment values − totalDebt
  - Each liability is counted once.
- **Auth state:** The access token (1h) and refresh token (7d) are stored in localStorage on web. Every frontend request goes through `apiCall()`.
- **Config:** `ALLOW_REGISTRATION=false` in production. `JWT_SECRET` and `REFRESH_TOKEN_SECRET` are required, with no hardcoded fallbacks such as `'dev-secret'`.

## 7. Observable Behavior & Acceptance Checks

**Security**

- [ ] With no token or an expired token, every non-auth endpoint returns 401.
- [ ] Create user B in a test DB. B's GET, PUT or DELETE on any of my resource IDs returns 403 or 404, never data. No `DEFAULT_USER_ID` (or similar fallback) exists anywhere in the codebase.
- [ ] In production, `POST /auth/register` returns 403.
- [ ] The 6th failed login within 15 minutes returns 429.
- [ ] The server fails to start if a JWT secret env var is missing.
- [ ] `helmet` headers are present. CORS allows only the production frontend origin.

**Money correctness**

- [ ] Add expenses of 0.10 and 0.20. The account balance drops by exactly 0.30.
- [ ] After any mix of create, edit, delete, CSV import and reconciliation, `Account.balance` equals the recalculated sum for every account. There is a test or script that asserts this.
- [ ] Setting an opening balance dated after an existing transaction returns 400.
- [ ] Adjusting balance from 5500 to 5000 creates a reconciliation of −500 with a matching description.

**Features**

- [ ] A CSV with 5 valid rows and 1 invalid date imports 5 rows and reports a row-level error for the bad one. Both headerless and header-based formats work.
- [ ] Transaction filters (account, category, type, date range, search) each narrow the results correctly, and pagination works.
- [ ] Deleting a category that has transactions either blocks the delete or reassigns them to "Other". No orphaned transactions.
- [ ] Budget: Food has a 300 limit, and expenses of 50 and 30 in that month show spent 80 (26.7%). Editing the 30 to 40 shows spent 90.
- [ ] Recurring: a monthly rule's `create-once` creates a linked transaction and advances `nextDue` by one month. Editing the rule doesn't change past transactions.
- [ ] Savings goal progress = current / target. Debt and investment edits are reflected in Dashboard totals right away.
- [ ] Every page shows a loading state, an empty state and an error state. With 0 accounts, no page shows a blank white screen.

**Ship**

- [ ] `npm test` passes (unit tests for balance, budget and recurring math, plus integration tests for auth and one CRUD cycle per resource).
- [ ] Playwright E2E passes: log in → add account → set opening balance → add transaction → dashboard shows it.
- [ ] The app is deployed at an HTTPS URL, migrations have run with `prisma migrate deploy`, and I can log in from my phone.
- [ ] The production DB has automated backups, and one restore has been tested.
