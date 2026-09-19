⚠️ **CRITICAL: Before starting implementation in any session, read and follow [MONEYFLOW_SPEC.md](./MONEYFLOW_SPEC.md) first.** The spec document is the authoritative source for all requirements, API design, data model, error handling, and testing strategy. This handoff file contains session context only; the spec is the source of truth for building.

---

## 🔄 Handoff Update Protocol (End of Each Session)

**When you say "update the handoff file" or wrap up a session**, follow this process:

1. **✅ Check Off Completed Work**
   - Find the relevant task/section in this file (e.g., "Day 1: Foundation")
   - Mark completed items with `[x]` (e.g., `[x] Auth endpoints implemented`)
   - Add commit hash reference if a PR/commit was made (e.g., `[x] Auth endpoints (commit a1b2c3d)`)

2. **📝 Document What's Left**
   - In the "Open Questions" or "Next Steps" section, add/update what remains
   - Be specific: not just "Transactions need work" but "Transactions CRUD endpoints done, frontend form validation pending, tests need 3 more cases"
   - Note any blockers, unexpected issues, or decisions made that affect next steps

3. **💡 Add Context for Next Session**
   - What tests are passing/failing?
   - What edge cases came up?
   - Any branches or WIP code to be aware of?
   - Performance observations?
   - Security findings?

4. **🎯 Update Priorities if Needed**
   - If scope changed or something took longer, note it
   - Adjust remaining timeline if realistic estimate changed

**Example of good handoff update:**
```
### Day 3 Progress (September 20)
- [x] Transactions CRUD endpoints (commit a1b2c3d)
- [x] Transactions frontend page basic layout
- [ ] Search/filter implementation (50% done — query params working, UI filtering logic pending)
- [ ] Dashboard metrics endpoint (blocked: need Account balance calculation verified first)

**Next Session:**
- Finish transaction filters (2h)
- Verify account balance updates on transaction create/delete (1h, might have edge case)
- Dashboard metrics endpoint (2h)
- Start recurring transactions manual endpoint (2h)

**Notes:** Transaction amount validation working well. Found N+1 query issue in Prisma include — need to refactor. Deployment to staging ready but holding until more features complete.
```

---

# MoneyFlow Session Handoff (September 19, 2026)

## Goal

Define complete technical specification and implementation roadmap for MoneyFlow MVP launch—a personal finance dashboard/tracker with all-in-one financial management, multi-platform support (web, desktop, mobile), and smart automation features.

**Success Criterion:** Specification document enables immediate development start with zero ambiguity about requirements, architecture, design, or testing strategy.

---

## Decisions Made

### Product Scope
- **User Type:** Personal finance tracker (single user, no family sharing/collaboration in MVP)
- **Core Features (MVP Must-Have):**
  - Dashboard with key metrics (net worth, available funds, debt, savings, investments)
  - Accounts management (create/edit/delete bank, savings, investment accounts)
  - Transactions (income/expenses with categories, full CRUD, search/filter)
  - **Recurring Transactions** — auto-create on schedule (daily/weekly/monthly/yearly patterns)
  - Budgets (category spending limits, progress tracking, alerts)
  - Investments (multi-account: Brokerage, 401k, Roth IRA, Traditional IRA, HSA)
  - Debt tracking (amount, type, interest rate, paydown progress)
  - Savings goals (set targets, track progress)
  - Reports & Analytics (spending trends, category breakdown, net worth over time)

### Platforms
- **Web:** React 18 + TypeScript, Vite, Tailwind CSS (primary)
- **Desktop:** Electron + React (offline-first with local SQLite + cloud sync)
- **Mobile:** Progressive Web App (PWA) with Service Worker + IndexedDB (no native iOS/Android in MVP)

### Data Entry
- **MVP:** Manual entry only
- **Phase 2:** CSV import from bank exports
- **Phase 2:** Bank API integrations (Plaid) — nice-to-have, not launch-blocking

### Analytics & Reporting
- **MVP:** Basic charts (spending trends, category breakdown by pie chart, income vs. expenses, net worth trajectory)
- **Phase 2:** Advanced forecasting, anomaly detection, anomalies

### Auth & Users
- **MVP:** Email/password authentication (simple, secure)
- **Storage:** Tokens in httpOnly cookies (web), secure storage (Electron), IndexedDB (PWA)
- **No:** Multi-user, family sharing, role-based access in MVP

### Storage & Deployment
- **Backend:** PostgreSQL on Railway/Render or Supabase
- **API:** Express.js on Railway/Render (stateless, JWT auth)
- **Frontend:** Vercel/Netlify with global CDN
- **Monitoring:** Sentry (errors), Uptime Robot (uptime), DataDog (performance) — optional but recommended
- **Database:** Daily encrypted backups, 30-day retention

### Recurring Transactions (Critical MVP Feature)
- **Auto-Creation:** Cron job runs nightly (2 AM UTC) to create transactions from rules
- **Frequencies:** daily, weekly, biweekly, monthly, quarterly, yearly
- **Flexibility:** Support day-of-month (e.g., "15th") and day-of-week (e.g., "every Monday")
- **Backfill:** If system down during scheduled time, catch up on next run
- **Management:** Pause/resume, edit (future occurrences only), delete rule
- **DB:** New RecurringTransaction table (see MONEYFLOW_SPEC.md)

### Design System (Existing)
- **Background:** Dark ombre gradient (black → gray → black, NO purple)
- **Primary Components:** Glow card system (glassy, backdrop blur, vibrant neon glow accents)
- **Color Classes:** glow-red (net worth), glow-cyan (transactions), glow-purple (budgets), glow-green (investments), glow-blue (debt)
- **Typography:** System fonts, no custom fonts (performance)
- **Hover States:** Every interactive element must have explicit hover/focus feedback
- **Responsive:** Mobile-first; breakpoints at md: (tablet) and lg: (desktop)

### Third-Party Services
- **OK to use:** Stripe (payments, phase 2), SendGrid (email), Sentry (error tracking), Plaid (bank sync, phase 2)
- **NO:** Social auth, analytics SDKs, unnecessary dependencies

---

## Open Questions

1. **Recurring Transaction Backlog:** If a recurring transaction is missed (system down), should we:
   - Always backfill on next run (current decision)?
   - Ask user to confirm before creating backdated transactions?
   - Mark as "missed" with user acknowledgment required?

2. **Budget Alert Delivery:** When budget reaches 75%/90%/100%+, how should alerts be sent?
   - In-app toast notification only?
   - Email notifications (requires SendGrid integration)?
   - Push notifications (PWA + Electron only)?

3. **Investment Value Updates:** Should investment current values be:
   - Manual entry only (user updates price)?
   - API-integrated with market data (phase 2)?
   - Hybrid (manual override allowed)?

4. **Desktop Offline Mode:** When Electron app is offline:
   - Buffer all changes locally, sync on reconnect?
   - Show warning that changes won't sync?
   - Prevent creation of new data (read-only mode)?

5. **CSV Import Format:** Which bank formats should MVP support?
   - Generic CSV (amount, date, category, description)?
   - Chase, Amex, Wells Fargo, etc. (specific formats)?
   - Plaid-normalized format (for consistency)?

6. **Data Deletion:** When user deletes account/budget/debt, what happens?
   - Soft delete (archive, keep history)?
   - Hard delete (cascade, lose transaction history)?
   - Ask user first?

---

## Constraints

### Timeline
- **MVP Launch:** 2-4 weeks from start of development
- **Week 1:** Auth, DB schema, recurring transaction backend
- **Week 2:** Core features API + frontend
- **Week 3:** Desktop & PWA setup, cross-platform sync
- **Week 4:** Polish, deployment, launch prep (optional)

### Technology Stack (Fixed)
- React 18, TypeScript, Tailwind CSS, Vite (frontend)
- Node.js 20.x, Express.js, Prisma, PostgreSQL (backend)
- Electron for desktop (no alternative)
- PWA for mobile (no React Native in MVP)

### Performance Targets
- Dashboard load: < 2 seconds
- API response: < 200ms p95
- Data sync: < 5s
- Desktop app memory: < 200MB
- Lighthouse score: > 90

### Budget/Resources
- No paid design tools required (use existing Tailwind/CSS)
- No new infrastructure beyond Railway/Render/Vercel
- No hiring for this phase (single developer or small team)

### Security Requirements
- HTTPS only (TLS 1.2+)
- GDPR compliance (data export, account deletion)
- No sensitive data in logs
- bcrypt password hashing (10 rounds minimum)
- Rate limiting on auth endpoints (5 attempts per 15 min)

---

## Session Progress (September 19-20 - Spec, Planning, Auth, Core Integration, CSV Import & Balance Adjustment)

### ✅ Completed This Session

**Part 1 - Spec & Planning (September 19):**
- [x] Gathered detailed requirements through interactive Q&A
- [x] Created **MONEYFLOW_SPEC.md** — comprehensive, pragmatic spec for 1-2 week solo developer MVP
- [x] Defined MVP scope: **Auth + Dashboard + Transactions** (core focus only)
- [x] Deferred to Phase 2: Budgets, Investments, Reports, Cron scheduler (manual endpoint only)
- [x] Finalized auth strategy: JWT tokens in response body + Authorization header (web/desktop-PWA/mobile compatible)
- [x] Finalized data handling: Always include all fields, use null for missing (predictable responses)
- [x] Finalized error handling: Structured envelope with error codes + HTTP status codes
- [x] Finalized testing strategy: Unit tests (Jest) + critical path E2E (Playwright)
- [x] Added critical note to HANDOFF.md directing to MONEYFLOW_SPEC.md
- [x] Added Handoff Update Protocol for smooth session handoffs
- [x] Database schema updated in spec (User, Transaction, RecurringTransaction, Budget models)
- [x] Complete API specification documented (12+ endpoints with examples)
- [x] Backend implementation patterns provided (auth service, middleware, error handling)
- [x] Frontend patterns provided (TypeScript interfaces, auth context, form validation)
- [x] 7-day development roadmap created (Day 1-7 breakdown)

**Part 2 - Authentication Implementation (September 19, continuing):**
- [x] Updated Prisma schema with passwordHash, RecurringTransaction, updated all models with proper relations
- [x] Added JWT dependencies (jsonwebtoken, bcrypt) to backend
- [x] Implemented AuthService: password hashing, JWT token generation/validation, password strength validation
- [x] Implemented auth middleware: JWT verification, Authorization header parsing
- [x] Implemented auth endpoints:
  - [x] POST /auth/register (email validation, password hashing, user creation)
  - [x] POST /auth/login (password verification, token generation)
  - [x] POST /auth/refresh (refresh token validation, new token generation)
- [x] Ran Prisma migration (add_auth_and_recurring) — database now has passwordHash, updated relations
- [x] Seeded database with test user (trish@example.com) and sample data
- [x] Created Login.tsx page with form validation and error handling
- [x] Created Register.tsx page with password strength validation and confirmation
- [x] Updated App.tsx with protected routes, auth layout, logout functionality
- [x] Created api.ts utility helper for authenticated API calls (auto-includes Authorization header)
- [x] Updated ALL pages to use apiCall helper for auth token integration:
  - [x] Dashboard.tsx
  - [x] Transactions.tsx
  - [x] Investments.tsx
  - [x] Budgets.tsx
  - [x] Debt.tsx
  - [x] Savings.tsx
  - [x] Reports.tsx
- [x] Backend TypeScript compilation successful ✅
- [x] Frontend dev server running (dev mode works despite TS warnings)

**Part 3 - Core Integration & Bug Fixes (September 19, continuing):**
- [x] Updated Dashboard.tsx to use apiCall helper for all API calls (authentication required)
- [x] Added filter button glow styling (filter-btn class with ::before ombre glow effect)
- [x] Added hover/focus states to all form inputs and selects per CLAUDE.md design system:
  - Filter buttons: white borders, inner glow, active/hover state
  - Selects: cursor-pointer, hover:border-purple-400, hover:bg-slate-700, focus states
- [x] Fixed TypeScript compilation errors (9 files):
  - [x] Dashboard: Removed unused `loading` state variable
  - [x] Debt: Fixed optional field handling in reduce (amount || 0, monthlyPayment || 0)
  - [x] Investments: Removed unused `editingId` state variable
  - [x] Reports: Removed unused LineChart/Line imports, fixed Tooltip formatter type issues
  - [x] Savings: Fixed parseFloat argument type (use "0" string, not 0 number)
  - [x] Transactions: Fixed unused variable in map, fixed Tooltip formatter types
- [x] Updated backend budgets GET endpoint to calculate `spent` from transactions:
  - Queries all expense transactions for budget category in month/year range
  - Returns budget with calculated `spent` amount (matches UI requirement)
- [x] Verified backend and frontend both compile successfully ✅
- [x] Tested API endpoints:
  - [x] Auth: register, login working with JWT tokens
  - [x] Dashboard metrics: returns correct structure, all 0 for new users
  - [x] Budgets: calculates spent amount from transactions correctly
- [x] Created commit f92d4a0 with all authentication and integration fixes

**Part 4 - CSV Import & Balance Adjustment (September 20):**
- [x] Created flexible CSV parser (csvParser.ts):
  - Supports headerless CSVs with positional columns (date, amount, [type], [category], [description])
  - Auto-detects headers with keyword matching
  - Handles minimal data (date + amount only)
  - Returns detailed error reports with row numbers
- [x] Implemented CSV import backend:
  - POST /api/transactions/import-csv endpoint with multer file handling
  - Validates file type and size (10MB max)
  - Creates multiple transactions from CSV in single request
  - Returns import summary with success count and any parsing errors
- [x] Implemented opening balance feature:
  - PUT /api/accounts/:id/set-balance endpoint
  - Creates opening balance transaction automatically
  - Sets account balance to specified amount
  - Supports custom date for balance effective date
- [x] Updated frontend Transactions page:
  - CSV import form with file upload and account selection
  - Set opening balance form with balance amount and date fields
  - Fetch accounts on page load
  - Error handling and loading states for both operations
  - Format hint for CSV import (shows expected column order)
- [x] Updated apiCall utility to handle FormData for file uploads
- [x] Both backend and frontend compile successfully
- [x] Created commit 6b683df with CSV import and balance adjustment features

### 💡 Key Features Added (September 20)

**CSV Import System:**
- Flexible parser handles headerless CSVs, positional columns, and auto-detected headers
- Supports minimal format (date + amount) up to full format (date, amount, type, category, description)
- Auto-detects transaction type as income/expense based on keywords
- Detailed error reporting with row numbers for debugging
- Comprehensive guide at CSV_IMPORT_GUIDE.md

**Opening Balance Feature:**
- Set account balance with automatic transaction creation
- Provides audit trail in transaction history
- Used for account reconciliation or historical data setup

### 📝 What's Left to Do (Next Session)

**Priority 1: Testing & Browser Verification**
- [ ] End-to-end testing in browser (register → login → dashboard → navigate pages)
- [ ] Test CSV import with sample CSV files (various formats: minimal, positional, headers)
- [ ] Test opening balance feature (set balance, verify transaction created)
- [ ] Test transaction CRUD operations (create, read, update, delete) with new imports
- [ ] Verify CSV parser error handling (invalid dates, amounts, empty files)
- [ ] Test on mobile browser (responsive design check)
- [ ] Verify all page layouts match design system

**Priority 2: CSV Import Edge Cases**
- [ ] Test large CSV files (1000+ transactions)
- [ ] Test various date formats (ISO, US, international, text)
- [ ] Test with special characters in descriptions
- [ ] Test with missing optional columns
- [ ] Verify account balance updates correctly after import
- [ ] Test duplicate import handling

**Priority 3: Recurring Transactions (Manual Endpoint Only)**
- [ ] Implement POST /recurring/:id/create-once endpoint (manual transaction creation from rule)
- [ ] Implement RecurringTransaction CRUD endpoints (GET, POST, PUT, DELETE)
- [ ] Add recurring transaction UI to Transactions page
- [ ] Defer cron scheduler to Phase 2

**Priority 4: Polish & Testing**
- [ ] Fix any remaining TypeScript warnings
- [ ] Verify hover/focus states on all interactive elements per design system
- [ ] Test error handling (401, 403, 404, 500 responses)
- [ ] Test with slow network (verify loading states)

**TESTING STATUS (September 19):**
- ✅ Backend auth endpoints tested and working (register, login)
- ✅ JWT tokens generated and validated correctly
- ✅ Protected endpoints verify Authorization header
- ✅ Frontend login/register pages built and connected
- ✅ Route protection implemented (redirects to /login if not authenticated)
- ✅ TypeScript compilation successful (all 9 files fixed)
- ✅ Budget spent calculation from transactions working
- ✅ Backend and frontend dev servers running
- ⏳ Next: E2E browser testing (register → login → dashboard → create transaction)

**Priority 2: Day 2 (Accounts & Core Pages)**
- [ ] Implement Account CRUD endpoints (GET, POST, PUT, DELETE /accounts)
- [ ] Create Login.tsx page (email/password form, error handling)
- [ ] Create Register.tsx page (email/password/name form, validation)
- [ ] Create Dashboard.tsx skeleton (metrics placeholder)
- [ ] Implement Transaction CRUD endpoints (GET /transactions with filters, POST, PUT, DELETE)
- [ ] Create Transactions.tsx page (CRUD form + list view)
- [ ] Link frontend to backend (auth context, token storage, API calls)

**Priority 3: Day 3-4 (Recurring & Polish)**
- [ ] Implement RecurringTransaction CRUD endpoints
- [ ] Implement POST /recurring/:id/create-once endpoint (manual transaction creation)
- [ ] Implement Dashboard metrics endpoint (GET /dashboard/metrics)
- [ ] Build Dashboard UI (net worth, available funds, recent transactions, upcoming recurring)
- [ ] Error handling throughout (validation, 401/403/404, rate limiting setup)
- [ ] Account balance updates on transaction create/delete

**Priority 4: Day 5-7 (Testing & Deployment)**
- [ ] Unit tests for auth service, transaction calculations
- [ ] Integration tests for critical paths (register → login → add transaction)
- [ ] E2E test (sign up → add account → add transaction → view dashboard)
- [ ] Deploy to staging environment
- [ ] Deploy to production
- [ ] Write deployment guide / README updates

### 🎯 Testing Results

**Backend Auth Testing (September 19):**
- ✅ Register endpoint: Creates user, validates password strength, returns access + refresh tokens
- ✅ Login endpoint: Validates credentials, returns valid JWT tokens
- ✅ Protected endpoints: Accept Authorization header, reject missing/invalid tokens
- ✅ Database: Successfully stores passwordHash, supports all new models

**Frontend Status:**
- ✅ Login page: Form validation, error handling, token storage
- ✅ Register page: Password strength display, confirmation validation, registration flow
- ✅ App.tsx: Protected routes, logout, user display in nav
- ⏳ Dashboard & other pages: Updated to use apiCall helper (in progress)
- ⏳ TypeScript compilation: Minor linting issues in Reports.tsx, Savings.tsx (need cleanup)

**Known Issues (Non-Blocking - Pre-existing TypeScript Linting):**
- Reports.tsx: Unused variables (LineChart, Line), Recharts type issues (not blocking dev mode)
- Savings.tsx: Minor type mismatch (not blocking dev mode)
- Transactions.tsx: Unused variable in pie chart rendering (not blocking dev mode)
- Investments.tsx: Removed unused editingInvId state
- These don't affect functionality — app runs in dev mode and will work when TS warnings are cleaned up

**READY FOR NEXT SESSION:**
- ✅ Complete auth flow implemented backend + frontend
- ✅ All API endpoints integrated with authentication
- ✅ Protected routes working
- ✅ Both servers running and ready for testing
- ⏳ Minor TypeScript cleanup (warnings, unused variables) — 30 min work
- ⏳ End-to-end browser testing
- ⏳ Recurring transaction manual endpoint (POST /recurring/:id/create-once)
- ⏳ Additional feature pages and dashboard metrics refinement

### 💡 Key Context for Next Session

**Current State (September 20 Session End):**
- Branch: glassy-in, last commit 6b683df (CSV import and balance adjustment)
- Both backend and frontend dev servers running and tested
- All TypeScript errors resolved, builds successful
- Registration/login endpoints verified working with JWT tokens
- Budget spent calculation from transactions verified working
- All 6 main API endpoints (accounts, transactions, investments, debts, savings goals, budgets) implemented
- Dashboard metrics endpoint implemented and returns correct structure
- CSV import endpoint implemented with flexible parser (POST /api/transactions/import-csv)
- Opening balance endpoint implemented (PUT /api/accounts/:id/set-balance)
- Frontend Transactions page has CSV import and balance adjustment forms

**What's Ready to Test:**
1. Full registration → login → dashboard flow in browser
2. All CRUD operations for main entities (transactions, accounts, budgets, etc.)
3. Budget spent amount calculation (tested via curl, works correctly)
4. Multiple account management (investment accounts with CRUD done)
5. Authentication with JWT tokens (tested via curl, working)

**What Needs Testing/Fixing:**
1. End-to-end browser flow (might find UI issues, layout problems)
2. Error handling for edge cases (duplicate emails, invalid amounts, etc.)
3. Empty state handling (new user with no data)
4. Form validation (currently client-side only)
5. Responsive design on mobile
6. Database seed data for realistic testing

**Architecture Decisions Made:**
- JWT tokens in response body (not httpOnly cookies) to support web/desktop-PWA/mobile
- apiCall helper with auto Authorization header injection (all pages use it)
- Budget spent calculated dynamically from transactions in GET endpoint
- Always include all fields in API responses (null for missing) — predictable frontend
- Hard delete on user request (no soft deletes for MVP)
- Multi-user fully isolated (every query filters by userId)
- Recurring transactions: manual endpoint only; defer cron job to Phase 2

**Database State:**
- Prisma schema includes: User, Account, Transaction, Investment, Debt, SavingsGoal, Budget, InvestmentAccount, RecurringTransaction
- Migrations applied: initial schema + auth/recurring migration
- Seed data exists (trish@example.com, test@example.com users with sample data)
- New test user created during testing (newuser@example.com)

**Frontend Architecture:**
- All pages use apiCall helper for authenticated requests
- Authorization header auto-injected by apiCall from localStorage token
- Routes protected by AuthRoute wrapper (redirects to /login if no token)
- Design system: glow cards, filter buttons with ombre glow, proper hover/focus states
- TypeScript strict mode with proper null/undefined handling

**Next Session Priority:**
1. Manual browser testing (register → login → test all pages)
2. Seed database with realistic data
3. Test transaction CRUD and budget tracking
4. Implement RecurringTransaction endpoints if time permits
5. Polish UI based on testing findings

**No Blockers/Risks Identified**
- Spec is clear and implementation is straightforward
- Timeline is tight but all foundation work complete

---

## Next Steps (Immediate)

### 1. Set Up Development Environment
- [ ] Clone repo, install dependencies
- [ ] Create `.env` with `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`
- [ ] Run `npx prisma migrate deploy` to sync schema
- [ ] Run `npx ts-node prisma/seed.ts` to populate test data
- [ ] Verify backend runs on `http://localhost:3000`
- [ ] Verify frontend builds with `npm run dev`

### 2. Create RecurringTransaction Schema (Database)
- [ ] Add RecurringTransaction model to `prisma/schema.prisma` (see MONEYFLOW_SPEC.md)
- [ ] Run `npx prisma migrate dev --name add_recurring_transactions`
- [ ] Add indexes on (userId, isActive, nextDue) for cron queries
- [ ] Update seed script to create sample recurring transactions

### 3. Implement Authentication (Backend)
- [ ] Create `/auth/register` endpoint (validate email, hash password, create user)
- [ ] Create `/auth/login` endpoint (verify password, return JWT + refresh token)
- [ ] Create `/auth/refresh` endpoint (validate refresh token, return new JWT)
- [ ] Add JWT middleware to protect other endpoints
- [ ] Configure CORS, security headers
- [ ] Write unit tests for auth logic (Jest)

### 4. Implement Authentication (Frontend)
- [ ] Create login/signup pages (forms with validation)
- [ ] Implement token storage (httpOnly cookie for JWT)
- [ ] Add route guards (`ProtectedRoute` component)
- [ ] Create logout functionality
- [ ] Add error handling (show feedback to user)
- [ ] Write component tests (React Testing Library)

### 5. Recurring Transactions API
- [ ] Create CRUD endpoints (`GET /recurring`, `POST /recurring`, `PUT /recurring/:id`, `DELETE /recurring/:id`)
- [ ] Implement cron job (runs nightly, creates transactions from active rules)
- [ ] Add backfill logic (catch up if missed)
- [ ] Test edge cases (month-end, leap year, frequency patterns)
- [ ] Integrate into dashboard (`GET /dashboard/upcoming-bills`)

### 6. Dashboard Enhancements
- [ ] Update `/dashboard/metrics` to include recurring transactions in calculations
- [ ] Add "Upcoming Bills" widget (next 7 days of recurring transactions)
- [ ] Fix any metric calculation bugs (net worth, available funds, debt)
- [ ] Test with incomplete data (null/undefined handling)

### 7. Frontend Pages (In Order)
1. Transactions page (done, verify recurring integration)
2. Budgets page (done, verify)
3. Investments page (done, verify multi-account)
4. Debt page (done, verify)
5. Savings Goals page (done, verify)
6. Reports page (needs implementation — charts)

### 8. Reports & Analytics
- [ ] Create report endpoints (`GET /reports/spending`, `GET /reports/net-worth`, etc.)
- [ ] Build chart components (Recharts: line, pie, bar charts)
- [ ] Implement spending trends (monthly over 12 months)
- [ ] Implement category breakdown (pie chart)
- [ ] Implement income vs. expenses (bar chart)
- [ ] Implement net worth trajectory (line chart)

### 9. Desktop App (Electron)
- [ ] Set up Electron boilerplate with React
- [ ] Implement offline-first SQLite storage
- [ ] Implement sync logic (background sync to cloud)
- [ ] Add auto-update mechanism (GitHub Releases)
- [ ] Test on Windows, macOS, Linux

### 10. PWA Setup
- [ ] Create `manifest.json` for install prompt
- [ ] Register Service Worker (offline caching, IndexedDB)
- [ ] Test on mobile browsers (iOS Safari, Android Chrome)
- [ ] Verify responsive design on small screens

### 11. Cross-Platform Testing
- [ ] Test data sync (web → desktop → mobile)
- [ ] Test token management across platforms
- [ ] Test offline mode (desktop), then reconnect
- [ ] E2E tests (Playwright): sign up → add transaction → view dashboard on all platforms

### 12. Deployment & Launch
- [ ] Set up GitHub Actions CI/CD (lint, test, build, deploy)
- [ ] Configure environment variables (prod vs. staging)
- [ ] Deploy backend to Railway/Render
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Set up error tracking (Sentry)
- [ ] Set up uptime monitoring (Uptime Robot)
- [ ] Create deployment guide (README.md)
- [ ] Launch!

---

## Reference Documents

- **Full Spec:** `MONEYFLOW_SPEC.md` (11 sections, 3000+ lines, complete technical spec)
- **Design System:** See CLAUDE.md for color palette, typography, glow card CSS
- **API Endpoints:** See MONEYFLOW_SPEC.md (API Design section)
- **Database Schema:** See MONEYFLOW_SPEC.md (Data Model section) + `prisma/schema.prisma`
- **Existing Pages:** `/frontend/src/pages/*.tsx` (Dashboard, Transactions, Budgets, Investments, Debt, Savings, Reports)

---

## Key Contacts & Decisions

- **Owner:** Trish Nguyen (trishnguyen955@gmail.com)
- **Spec Created:** September 19, 2026
- **Status:** Pre-development
- **Next Review:** After Week 1 (auth + recurring + dashboard)

---

**Ready to build.** Start with Week 1 checklist above. Reference MONEYFLOW_SPEC.md for detailed requirements.
