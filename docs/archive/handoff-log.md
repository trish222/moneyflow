# Handoff Log - Completed Sessions

## September 19-22, 2026 - Foundation & Core Features

**Completed Features:**
- ✅ Authentication: register, login, JWT tokens, protected routes
- ✅ Account management: create, list, update, delete
- ✅ Transactions: CRUD with CSV import, opening balance, balance adjustment
- ✅ Dashboard: metrics (net worth, available funds, debt), responsive layout
- ✅ Budgets: CRUD with spent calculation from transactions
- ✅ Categories & Subcategories: CRUD API, auto-created on registration
- ✅ Multi-select filtering: income/expense checkboxes
- ✅ Investments: multi-account support (Brokerage, 401k, Roth IRA, etc.)
- ✅ Debt tracking: create, list, delete
- ✅ Savings goals: create, list, delete

**Key Bug Fixes:**
- Budget spent calculation using UTC dates (not local time)
- Smart balance adjustment with data integrity validation
- Opening balance validation prevents dates after existing transactions

**Commits (Selected):**
- 6df5b72: Move docs into docs/; ignore .DS_Store
- 4f7abd6: Make PRD source of truth; reorganize docs; add learning mode
- 447c783: feat: smart balance adjustment with data integrity validation
- a6bd71e: fix: budget spent calculation using UTC date filtering
- 096b26c: Multi-select filtering + subcategories + category API
- 5003a8e: CategorySettings page and dynamic categories
- b9f5720: Auto-create default categories on registration

**Tech Stack Decisions:**
- JWT tokens in response body (not httpOnly)
- Prisma ORM with PostgreSQL
- React 18 + TypeScript + Tailwind CSS
- Express.js backend
- Single user (no multi-user in MVP)

**Database Schema (Finalized):**
- User, Account, Transaction, Category, Subcategory
- InvestmentAccount, Investment
- Debt, SavingsGoal, Budget
- RecurringTransaction (schema ready, endpoints pending)

**Frontend Structure:**
- Dashboard (metrics + navigation cards)
- Transactions (CRUD, CSV import, filters)
- Budgets (category limits, spent tracking)
- Investments (multi-account)
- Debt, Savings, Reports (pages exist, features pending)
- CategorySettings (full CRUD)

---

## What Was Working (End of Sept 22)
- All CRUD endpoints tested via API
- User registration → login → dashboard flow
- Transaction creation, CSV import, balance adjustment
- Budget spent calculation displaying correctly
- Category/subcategory management
- Frontend builds without TypeScript errors
- Backend compiles successfully

---

## Status at Oct 1 (This Session Start)
- All features from Sept 19-22 stable
- User identified need for security audit before money fixes
- Float→Decimal and auth improvements prioritized

## October 4-8, 2026 - Test Harness & PRD §7 Security Checks

**Vitest harness (Oct 4):**
- ✅ Removed stale compiled `.js` from `src/` (they shadowed `.ts` during vitest ESM resolution); set `rootDir`/`outDir`, added `dist/` to `.gitignore`
- ✅ Replaced jest with vitest; `vitest.config.ts` (fileParallelism off, globals off) + `src/setupEnv.ts` loading `.env.test` with a fail-secure `_test` DATABASE_URL guard
- ✅ `src/__tests__/helpers/db.ts`: `resetDatabase` (truncates all pg_tables), `seedTestUser` (real hashing), `seedTestAccount`
- ✅ `moneyflow_test` database created, migrations deployed, 11 tables

**PRD §7 security checks closed (Oct 8, commit 754c16c):**
- ✅ `POST /api/accounts` balance optional, defaults to 0 (commit 4f8f5c0, spec §4.3)
- ✅ `GET /api/accounts/:id` and `GET /api/transactions/:id` added, scoped by `userId` → another user's id is a 404 with no payload
- ✅ Every response moved onto the spec §4.1 envelope via `ok`/`created`/`fail` in `src/utils/response.ts`; error codes now at `error.code`
- ✅ Failed-login rate limit in `src/middleware/rateLimit.ts`: 5 per IP per 15 min, 6th → 429 + `Retry-After`, cleared on success
- ✅ Account `type` allowlist and `name` length (max 100) enforced on create and update
- ✅ Frontend `apiCall` unwraps the envelope, so the ~45 existing call sites were unchanged
- ✅ Fixed a pre-existing broken `npm run build`: tsconfig `include` scoped to `src`, node types enabled, `userId`/`userEmail` declared on `Express.Request`
- ✅ 25 backend tests passing (was 8 of 18)

**Decisions kept:** fix the API to match the spec, never weaken tests. Two test expectations changed, both citing spec §4.1 (`error.code` instead of a flat `error` string; `data: null` instead of `undefined` on errors) — and the leak assertions were strengthened to check the serialized body for the owner's data.

**Mode change (Oct 8):** Learning Mode retired in favour of "Working mode: SHIP" in CLAUDE.md.
