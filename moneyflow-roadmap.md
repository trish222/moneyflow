# MoneyFlow Build Roadmap — Full Detail

Ordered by dependency: each step assumes the ones before it are functionally done. Sub-bullets are the specific things to actually implement, not just categories.

---

## 1. Data Layer (Prisma Schema)

- **User** model: id, email (unique), passwordHash, createdAt, emailVerifiedAt (nullable)
- **Account** model: id, userId (FK), name, type (enum: checking/savings/credit/cash), currency, currentBalance, createdAt
- **Transaction** model: id, accountId (FK), categoryId (FK, nullable), amount, date, description, isRecurring (bool), recurringGroupId (nullable, for linking instances), createdAt
- **Category** model: id, userId (FK, nullable for system defaults), name, type (income/expense), icon/color
- **Budget** model: id, userId (FK), categoryId (FK), monthlyLimit, rolloverEnabled (bool)
- Decide **decimal handling now**: use `Decimal` type in Prisma (not `Float`) for all money fields — floating point rounding errors are a real bug class in finance apps
- Define relations + cascade rules (e.g., deleting an Account should decide: cascade-delete transactions, or block deletion if transactions exist)
- Add indexes early: `userId` on every user-owned table, `accountId` + `date` composite index on Transaction (you'll query "transactions for account X sorted by date" constantly)
- Run first migration, seed script with a couple of default categories (Groceries, Rent, Income, etc.)

## 2. Auth (before any other API route)

- **Signup endpoint**: validate email format + password strength server-side, hash password with `argon2` (preferred over bcrypt for new projects — memory-hard, tunable), create User row
- **Login endpoint**: look up by email, verify hash with `argon2.verify`, issue session
- **Session/token strategy** — pick one deliberately:
  - *Option A (simpler to start): httpOnly cookie session* — store session in DB or signed cookie, `express-session` + a Postgres session store
  - *Option B: JWT access + refresh token pair* — access token short-lived (~15 min), refresh token longer-lived, refresh endpoint to rotate. More moving parts, but needed if you want stateless scaling or the RN app later (cookies are awkward in React Native)
  - Given your eventual mobile target, **JWT is probably the better long-term choice** — cookies don't transfer cleanly to RN's networking layer
- **`requireAuth` middleware**: verifies token/session on every protected route, attaches `req.userId`, rejects with 401 if invalid/missing
- **Logout**: invalidate token (blacklist or short expiry + refresh revocation) / destroy session
- Password reset flow: generate single-use expiring token, email it (can stub email sending in dev), reset endpoint that verifies token + updates hash
- Email verification (can defer to later phase, but stub the schema field now)

## 3. Core CRUD APIs + Vertical-Slice Frontend

Build and wire end-to-end **one resource at a time** — don't build all four APIs before touching frontend.

**Per-resource pattern (repeat for Accounts → Transactions → Categories → Budgets):**
- Zod schema for request body validation (separate schemas for create vs update — update fields are usually all-optional)
- Route handlers: `GET /list`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`
- Ownership check on every read/write: confirm `resource.userId === req.userId` before returning/mutating — this is the #1 place data leaks happen
- Pagination on list endpoints (`?page=&limit=`, or cursor-based if you want it to scale better) — Transactions will have hundreds of rows fast
- Corresponding React Query hooks (`useAccounts`, `useCreateAccount`, etc.)
- A real (even minimally styled) page that lists/creates/edits that resource, so you confirm the full loop works before moving to the next resource

**Transaction-specific logic to get right here:**
- Recurring transaction detection/generation (if a transaction is marked recurring, generate future instances or compute them on read — decide which now, it affects the schema)
- Running balance calculation (materialized on Account, or computed on read — computed is simpler and safer to start, materialized is faster but needs careful update logic)

## 4. Baseline Security Hardening

Do this once auth + real API routes exist, before treating the app as "working."

- `helmet` middleware — sets CSP, X-Frame-Options, HSTS, and other headers with one line
- CORS: explicit origin whitelist (`cors({ origin: 'http://localhost:5173' })` in dev, your real domain in prod) — never `origin: '*'` on an app with auth
- Rate limiting: `express-rate-limit` on `/login`, `/signup`, `/forgot-password` — e.g. 5 attempts per 15 min per IP, to blunt brute force
- HTTPS: non-negotiable even locally-adjacent staging; if deploying to something like Render/Railway/Vercel this is usually automatic, but verify
- Input validation on every route (should already exist from step 3, but audit here — this is your last checkpoint before "real" usage)
- `.env` in `.gitignore` from day one if not already; separate `.env` values for dev vs prod, never commit secrets
- Confirm Prisma is your only DB access path (no raw SQL string concatenation anywhere) — Prisma parameterizes by default, don't bypass it

## 5. Full Web Frontend / UI Polish

- Dashboard: net worth summary, recent transactions, budget-status widgets (over/under per category)
- Transaction list: filterable (by account, category, date range), sortable, searchable
- Transaction detail/edit modal or page
- Budget management: set/edit monthly limits per category, visual progress bars
- Reports/charts view: spending by category (pie/bar), trend over time (line) — this is where recharts or a similar lib comes in
- Responsive layout pass: mobile-first breakpoints in Tailwind, since this same codebase becomes your PWA
- Loading/error/empty states for every data view (easy to skip, obvious when missing)
- Global data-fetching strategy finalized: React Query for server state, minimal local state elsewhere (avoid a giant Redux store you don't need)

## 6. PWA Layer

- `manifest.json`: `name`, `short_name`, `icons` (need multiple sizes — 192x192 and 512x512 minimum, plus maskable variants), `start_url`, `display: "standalone"`, `theme_color`, `background_color`
- Service worker (via Vite PWA plugin — `vite-plugin-pwa` handles most boilerplate rather than hand-rolling):
  - Cache-first strategy for app shell (JS/CSS/HTML) — loads instantly on repeat visits
  - Network-first strategy for API data (Transactions, Accounts) — always try fresh data, fall back to cache when offline
- Offline behavior decision: read-only cache (show last-known data, block writes) vs. write queue (let user add transactions offline, sync when back online — significantly more complex, decide if it's worth it for v1; read-only is the reasonable default)
- Installability checklist: served over HTTPS, valid manifest linked in `<head>`, service worker registered, icons meet size requirements — Chrome DevTools' Lighthouse/Application tab will tell you exactly what's missing
- Test actual install on both a desktop browser (Chrome "Install app") and an Android phone (better real-world signal than desktop)

## 7. Testing

- Unit tests (Vitest or Jest) for pure business logic: budget rollover math, recurring transaction generation, balance calculations — these are the functions most likely to have subtle bugs and least likely to need mocking
- Integration tests for API endpoints (Supertest + a test DB): at minimum, auth flow (signup/login/protected-route-rejects-without-token) and one full CRUD cycle per resource
- E2E test (Playwright) for the critical path: signup → login → add account → add transaction → see it on dashboard — one solid E2E test catches more real breakage than a dozen unit tests
- Add a `test` script that runs in CI (ties into step 9)

## 8. Mobile (React Native / Expo) — insert only after 1–7 are stable

**8a. Shared logic extraction**
- Restructure repo into a proper monorepo layout if not already: `packages/shared` for API client functions, TypeScript types/interfaces, Zod validation schemas
- Both `frontend/` (web) and the new `mobile/` (Expo) import from `packages/shared` — no duplicated API-call logic
- Use npm/pnpm workspaces to link them locally

**8b. Expo app scaffolding**
- `npx create-expo-app` with TypeScript template
- Auth token storage: `expo-secure-store` (iOS Keychain / Android Keystore) — **never** AsyncStorage for tokens, it's unencrypted plaintext
- Navigation: React Navigation (stack navigator for auth flow, tab navigator for main app) — different mental model from React Router, budget learning time for this specifically
- API client: reuse `packages/shared` client, just swap the token-storage adapter (secure-store vs. web's cookie/localStorage)

**8c. Rebuild core screens natively**
- Dashboard, Transaction list/detail, Budget screens — UI code is new (no DOM, so no Tailwind classes carry over directly; use NativeWind if you want Tailwind-like syntax, or React Native's StyleSheet)
- Reuse: types, validation schemas, API call functions, business logic (recurring detection, balance math) — anything non-UI

**8d. Mobile-specific features (optional, evaluate per priority)**
- Push notifications for budget alerts: Expo push service + backend table to store device push tokens per user
- Biometric unlock: `expo-local-authentication` (Face ID/fingerprint) as an app-open gate — common and expected in finance apps
- Deep linking if you ever want "open app to this transaction" from a notification

**8e. App store prep**
- Apple Developer account ($99/yr) + Google Play Developer account ($25 one-time)
- App icons/splash screens at required resolutions (Expo has tooling for this)
- TestFlight (iOS) / internal testing track (Android) before public release
- **Budget real lead time for Apple review** — can take several days and sometimes multiple rejection/resubmission cycles

## 9. Deployment & CI

- Environment separation: dev (local), staging, prod — each with its own Postgres instance and its own `.env` secrets, never shared
- CI pipeline (GitHub Actions): lint → typecheck → test on every push/PR; block merge on failure
- Hosting split:
  - Frontend (web/PWA): static hosting + CDN (Vercel, Netlify, or Cloudflare Pages)
  - Backend (Express): needs a persistent running Node process (Railway, Render, Fly.io — not a static host)
  - Database: managed Postgres (Railway/Render Postgres, Supabase, or Neon) — don't self-host Postgres for a first project
- Mobile builds: EAS Build (Expo's build service) for generating signed iOS/Android binaries without owning a Mac for iOS builds
- Monitoring: Sentry (or similar) wired into both frontend and backend for error tracking — lightweight to add, invaluable once real users exist

## 10. Advanced Security & Data Protection

Refinements once the core is stable and deployed — not blockers before that, but don't skip indefinitely for a finance app.

- Audit logging: separate table logging sensitive actions (login, password change, account deletion, large transaction edits) with timestamp + userId — useful both for your own debugging and if you ever need to answer "did someone else access this account"
- Encryption at rest for any especially sensitive field (if you ever store bank credentials directly — strongly prefer *not* to; use a provider like Plaid that tokenizes and never gives you raw credentials)
- Principle of least privilege on the DB user your app connects with (a role that can only touch the tables it needs, not a superuser)
- Dependency scanning: enable Dependabot on the repo, run `npm audit` periodically — financial apps are a more attractive target than average
- CSRF protection if you end up using cookie-based sessions anywhere (not needed if you go pure JWT-in-header)
- XSS: React escapes by default, but audit any use of `dangerouslySetInnerHTML` or raw HTML rendering (e.g. if you ever add CSV import previews or rich text notes)
- Backup strategy: automated daily Postgres backups + **actually test a restore once**, not just "backups are configured"
- Basic incident plan written down: what you do if a secret leaks (rotate immediately, check access logs, force logout all sessions) — write this before you need it, not during
