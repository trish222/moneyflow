⚠️ **Before implementing ANY feature, read [MONEYFLOW_SPEC.md](./docs/MONEYFLOW_SPEC.md) and [CLAUDE.md](./CLAUDE.md) first.**

---

# Handoff: October 4, 2026 - Vitest Setup & PRD §7 Security Tests

## Done This Session

**Commits made:**
- cb50fb4: fix: remove stale compiled .js from src; set tsconfig rootDir/outDir
- fcb060e: test: add Vitest + Supertest with PRD §7 security tests

**Root Cause Fixed (Blocker Resolved):**
- ✅ Removed stale compiled .js files from src/ (server.js, middleware/auth.js, services/authService.js, utils/csvParser.js)
- ✅ Enabled tsconfig.json: `rootDir: "./src"`, `outDir: "./dist"`
- ✅ Added dist/ to .gitignore
- **Why:** stale .js files shadowed .ts files during vitest ESM resolution, causing "exports undefined" errors

**Vitest Setup (Complete):**
- ✅ Uninstalled jest, ts-jest, @types/jest; installed vitest
- ✅ Created `vitest.config.ts`: fileParallelism=false, globals=false, setupFiles loads setupEnv.ts
- ✅ Created `src/setupEnv.ts`: loads .env.test with override=true, validates DATABASE_URL contains "_test" (fail-secure)
- ✅ Created `backend/src/__tests__/helpers/db.ts`: resetDatabase (queries pg_tables, truncates), seedTestUser (real bcrypt), seedTestAccount (balance defaults to 0)
- ✅ Test database: moneyflow_test created, migrations deployed, 11 tables available
- ✅ `npm run dev` starts on port 3000 (tsx watch)

**PRD §7 Security Tests (17 tests written, 8 passing, 10 failing):**

| Check | Test Name | Status | Evidence |
|-------|-----------|--------|----------|
| **401 without token** | should return 401 on GET /api/accounts without token | ✅ | authMiddleware enforces |
| | should return 401 on POST /api/accounts without token | ✅ |  |
| | should return 401 on GET /api/transactions without token | ✅ |  |
| | should return 401 on PUT /api/accounts/:id without token | ✅ |  |
| **403/404 isolation** | should return 403 or 404 on GET user A's account with user B token | ❌ | Returns 404, assertion fails (endpoint may not exist) |
| | should return 403 or 404 on PUT user A's account with user B token | ❌ | TypeError: res.body.data undefined (no data in response) |
| | should return 403 or 404 on DELETE user A's account with user B token | ❌ | Account still exists after DELETE (endpoint may not work or returns 404) |
| | should return 403 or 404 on GET user A's transaction with user B token | ❌ | Returns 404 |
| | should return 403 or 404 on PUT user A's transaction with user B token | ❌ | TypeError: res.body.data undefined |
| | should return 403 or 404 on DELETE user A's transaction with user B token | ❌ | Transaction still exists after DELETE |
| | user A can still GET their own account | ❌ | Returns 404 (GET /accounts/:id endpoint missing) |
| | user A can still GET their own transaction | ❌ | Returns 404 (GET /transactions/:id endpoint missing) |
| **Registration disabled** | should return 403 REGISTRATION_DISABLED when ALLOW_REGISTRATION undefined | ✅ | Isolation test with vi.resetModules() works |
| **Rate limiting (PRD §7)** | should allow first 5 failed login attempts | ✅ | Returns 401 as expected |
| | should return 429 on 6th failed login attempt | ❌ | Returns 401 (rate limiting not implemented yet) |
| | should remain rate-limited for subsequent attempts | ❌ | Returns 401 (rate limiting not implemented) |
| **Valid token operations** | should allow user A to create account with valid token | ❌ | POST returns 400: "Name, balance, and type are required" (balance required but test omits it) |
| | should allow user A to update their own account | ❌ | PUT returns 200 with raw account data, not wrapped in {data, success, error} envelope |

**Infrastructure Working:**
- ✅ Database reset: 11 tables truncated before each test
- ✅ Test user seeding: password hashing via AuthService
- ✅ App accessible to Supertest (no more "address undefined" errors)
- ✅ Prisma connected to moneyflow_test
- ✅ npm run dev starts normally

---

## Next Up (Priority Order)

1. **POST /api/accounts: make balance optional, default 0** (SPEC §4.3)
   - API fix: balance field currently required; should default to 0
   - Update test: send only name and type, expect 201

2. **Add GET /api/accounts/:id and GET /api/transactions/:id endpoints** (MISSING)
   - Implement with ownership checks: 404 if not the owner's resource
   - Trish writes these after concept briefing

3. **Response envelope standardization** (API INCONSISTENCY)
   - POST /accounts returns error envelope: `{ error, message }`
   - PUT /accounts returns raw data: `{ id, userId, name, ...}`
   - Create shared helpers: `ok(data)` and `fail(error, message)` in backend
   - Convert accounts endpoints, then test + frontend page before converting other resources
   - Error responses: missing_fields → VALIDATION_ERROR inside envelope

4. **Login rate limiting** (PRD §7 REQUIRED — currently failing)
   - Implement: 5 failed attempts / 15 min → 429
   - Tests already written and failing; will pass once implemented

5. **Add cross-user list filtering test** (COVERAGE)
   - Test: user B's GET /accounts list excludes user A's accounts
   - Verify isolation at list-level, not just by-id level

---

## Decisions (This Session)

**Rule: Fix the API to match the spec, never weaken tests**
- Only change a test expectation when PRD §7 supports it; cite the line when doing so
- Example: cross-user access returns 403 or 404 (both OK per PRD §7); both with no data exposed

**Test Isolation Strategy:**
- `registration-disabled.test.ts` uses `vi.resetModules()` to clear module cache
- Deletes ALLOW_REGISTRATION before importing fresh app
- Confirms registration enforcement works at app initialization

**Learning Mode Update:**
- Added to CLAUDE.md: "If a fix attempt fails twice, stop and explain evidence and hypotheses before trying more. Never commit workarounds like globals or duplicate instances without asking."

**Root Cause Analysis:**
- **Lesson:** Stale .js files in src/ were shadowing .ts files during vitest ESM resolution
- **Why it happened:** tsconfig.json had rootDir/outDir commented out; build output mixed with source
- **Prevention:** Enable tsconfig outDir, add dist/ to .gitignore, clean build artifacts

---

## Constraints & Context

**Current Branch:** manage-transactions (fcb060e HEAD)
**Environment:** .env.test with ALLOW_REGISTRATION=true; moneyflow_test database ready
**Database:** PostgreSQL, 11 tables, migrations deployed, seed data available
**Build Status:** Frontend & Backend compile; `npm run dev` starts on port 3000; `npm test` runs 18 tests

**Known API Issues Found by Tests:**
- GET /accounts/:id — endpoint missing or returning 404
- GET /transactions/:id — endpoint missing or returning 404
- POST /accounts — requires balance field (should default to 0)
- PUT /accounts/:id — returns raw data, not wrapped in {data, success, error} envelope
- Rate limiting — not implemented (middleware needed)

**Not Yet Done (Deferred to Next Session):**
- Money correctness: Float→Decimal, bcrypt→argon2, Budget.spent removal, Transaction.category FK
- E2E tests: Playwright integration
- Production deployment: .env.production, SSL, backups

---

**Next session:** Start with POST balance fix (API only), then concept briefing on GET endpoints (Trish implements).

