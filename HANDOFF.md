⚠️ **Before implementing ANY feature, read [docs/PRD.md](./docs/PRD.md), [docs/MONEYFLOW_SPEC.md](./docs/MONEYFLOW_SPEC.md) and [CLAUDE.md](./CLAUDE.md) first.**

---

# Handoff: October 8, 2026 — SHIP mode, PRD §7 audit

**Branch:** `manage-transactions` · **Mode:** SHIP (see CLAUDE.md) · **Tests:** 25 passing

## Current State

- All PRD §7 **Security** checks are implemented and tested except two with no test yet (see audit below). Commit `754c16c`.
- Every API response now uses the spec §4.1 envelope `{ success, data, error }`. Errors carry `error.code` (`VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `RATE_LIMITED`, …). The frontend unwraps it inside `apiCall`, so pages read payloads exactly as before.
- `npm run build` works again in `backend/` (it was broken before today: tsconfig `rootDir` vs. default include).
- Session history lives in [docs/archive/handoff-log.md](./docs/archive/handoff-log.md). v2/out-of-scope ideas live in [docs/BACKLOG.md](./docs/BACKLOG.md).

## PRD §7 Audit (2026-10-08)

**Security — 4 of 6 done**

| Check | State | Evidence |
|---|---|---|
| 401 without/expired token | ✅ | `authMiddleware` on every non-auth route; 4 tests |
| B's access to A's ids → 403/404, never data | ✅ | `findFirst({ id, userId })` on GET-by-id; ownership checks on PUT/DELETE; 10 tests |
| `POST /auth/register` → 403 in production | ✅ | `env.ALLOW_REGISTRATION` defaults false; 1 test |
| 6th failed login in 15 min → 429 | ✅ | `middleware/rateLimit.ts`; 3 tests |
| No `DEFAULT_USER_ID` anywhere | ⚠️ | Gone from `src/`, still in `prisma/seed.ts` (12 uses) |
| Server won't start without a JWT secret | ⚠️ | `env.ts` zod-validates at import (min 32 chars) — **no test** |
| helmet headers, CORS limited to the prod origin | ⚠️ | `helmet()` + origin check against `env.FRONTEND_URL` — **no test** |

**Money correctness — 0 of 4 done**

| Check | State | Evidence |
|---|---|---|
| 0.10 + 0.20 drops balance by exactly 0.30 | ❌ | 9 `Float` money fields in `schema.prisma`; PRD §6 requires `Decimal` |
| `Account.balance` == sum of transactions after every write | ❌ | **`POST`/`PUT`/`DELETE /api/transactions` never touch `Account.balance`.** Only set-balance/adjust-balance write it, and not inside a `$transaction` |
| Opening balance dated after an existing transaction → 400 | ⚠️ | Implemented in `PUT /accounts/:id/set-balance` — no test |
| 5500 → 5000 creates a −500 reconciliation | ⚠️ | `adjust-balance` creates it, but with `type: "income"/"expense"` and the type stashed in `category`. PRD §6 requires `type: "reconciliation"` and a signed amount |

**Features — 2 of 7 done**

| Check | State | Evidence |
|---|---|---|
| CSV: 5 valid + 1 bad date → 5 imported, 1 row error | ⚠️ | `utils/csvParser.ts` + import endpoint exist — no test |
| Transaction filters + pagination | ❌ | `GET /api/transactions` takes **no** query params; spec §4.4 defines 8 |
| Category delete blocks or reassigns to "Other" | ❌ | `DELETE /categories/:id` hard-deletes; `Transaction.category` is still free text, not a FK (PRD §6) |
| Budget: 300 limit, 50 + 30 → spent 80 (26.7%) | ⚠️ | `GET /budgets` computes spent live — but `Budget.spent` column still exists; PRD §6 says drop it. No test |
| Recurring create-once + `nextDue` advance | ❌ | `RecurringTransaction` model exists; **zero endpoints**, no UI |
| Savings progress; debt/investment edits hit Dashboard | ❌ | Dashboard math violates PRD §6 — see below |
| Every page has loading, empty and error states | ❌ | Only Login/Register have an error state; Budgets, Debt, Reports have no empty state |

**Dashboard math (PRD §6) is wrong in four ways** — `GET /api/dashboard/metrics`:
1. `availableFunds` sums *all* accounts, including credit cards (should be checking + savings).
2. `netWorth` = funds − debts, **excluding investments** (should be accounts + investments − totalDebt).
3. `totalDebt` ignores credit-card balances owed, so a liability is missed.
4. Debts and investments are filtered by the selected date window, so they vanish from net worth on a month filter; month boundaries use local `new Date(...)`, not `Date.UTC`.

**Also broken:** `Reports.tsx` calls `/reports/spending-by-category`, `/reports/income-vs-expenses`, `/reports/portfolio-performance` and `/reports/summary`. **None of those endpoints exist** — the whole page 404s. PRD §4 must-have 5.

**Ship — 0 of 4 done**: no unit tests for balance/budget/recurring math, no per-resource integration CRUD, no Playwright, not deployed, no backups.

## Remaining Work, ordered for fastest deploy

1. **Money foundation (one migration).** ⬅️ **NEXT — not started**
    Float → `Decimal` on all 9 money fields, drop `Budget.spent`, add `opening_balance`/`reconciliation` to `Transaction.type`. Then make every transaction write update `Account.balance` inside a single `prisma.$transaction`, and fix `adjust-balance` to emit a signed `reconciliation`. Ship with the balance-invariant assertion test PRD §7 asks for. **Do this before any new feature — it touches every write path.**
2. **argon2** replaces bcrypt (PRD §6). Single owner, so re-hash via script; fold into step 1's migration window.
3. **Dashboard math** per PRD §6: the four fixes above, `Date.UTC` boundaries, each liability once. Fast and highly visible.
4. **Reports endpoints.** Implement the PRD's two (spending by category, monthly trend) and trim `Reports.tsx` to what exists, or implement all four it calls. Must-have 5.
5. **Transaction filters + pagination** per spec §4.4 (account, category, type, date range, search, limit/offset).
6. **Recurring rules**: CRUD + `create-once` that links the transaction and advances `nextDue`, plus the Dashboard "upcoming" list. Largest remaining feature.
7. **Category FK migration**: `Transaction.categoryId`/`subcategoryId`, 7 defaults at seed/registration, delete blocks or reassigns to "Other". Touches CSV import, budgets and reports, which all match on the category string today — sequence it after 4–5.
8. **Page states**: loading, empty and error on all 10 pages; no blank screen with 0 accounts.
9. **Seed cleanup**: remove `DEFAULT_USER_ID` and the hardcoded bcrypt hash from `prisma/seed.ts` (closes the last §7 security check).
10. **Test coverage for the ship gate**: unit tests for balance/budget/recurring math, one CRUD cycle per resource, plus the missing env-secret and helmet/CORS cases.
11. **Playwright E2E**: log in → add account → opening balance → add transaction → dashboard reflects it.
12. **Deploy** (needs a hosting decision): `.env.production`, `VITE_API_URL` for the frontend, `prisma migrate deploy`, HTTPS on the provider's subdomain, automated backups + one tested restore.

## Open Decisions

- **Hosting provider: undecided.** Leaning Render as an all-in-one (web service + managed Postgres), with Neon for the database instead if we stay on free tiers. Nothing below step 12 is blocked by this, so it can be decided late.
- **No custom domain for v1** — the provider's subdomain over HTTPS is enough. PRD §7 only asks for an HTTPS URL.
- Steps 1–11 need no decisions.

## Minor Follow-ups

- **Merge `manage-transactions` into `main` before deploying.** All of today's work is on the branch; `main` is behind.
- **The login rate limiter is in-memory** (a process-local `Map` in `middleware/rateLimit.ts`). Fine for v1 — single owner, single instance — but it resets on restart and wouldn't be shared if the app ever runs more than one process. Also noted in [docs/BACKLOG.md](./docs/BACKLOG.md).
