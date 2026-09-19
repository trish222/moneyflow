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
