# Backlog (not in v1)

Anything here is outside PRD §4 must-haves and §7 acceptance checks. Per CLAUDE.md "Working mode: SHIP", it gets recorded, not built. PRD §5 non-goals (bank sync, cron scheduler, PWA/offline, Electron, mobile app, multi-user, multi-currency, notifications, budget rollover, redesign) are not repeated here.

## Code health

- `parseInt(req.params.id)` without validation on most PUT/DELETE routes — a non-numeric id reaches Prisma and surfaces as a 500 instead of a 400. `parseId()` in `server.ts` already does this correctly for the two GET-by-id routes; apply it everywhere.
- Stale build artifacts tracked in `backend/src/`: `server.d.ts`, `server.d.ts.map`, `server.js.map`. Harmless now that `outDir` is set, but they're the same class of file that broke the test harness on Oct 4.
- `server.ts` is ~1600 lines with every route inline. Splitting into `routes/` + `services/` would make per-resource integration tests cheaper to write.
- The Prisma error-handling middleware registered near the top of `server.ts` only logs and re-throws; it runs before the routes, so it never sees route errors.
- Frontend bundle is 722 kB (one chunk). Code-split the pages if load time becomes noticeable.
- `API_BASE_URL` is hardcoded to `http://localhost:3000/api` in `frontend/src/utils/api.ts` — must become an env var for deploy (folded into step 12).

## API consistency

- `DELETE` endpoints return `200` with a `{ message }` payload; spec §4.3 says `204 No content`.
- Several resources (investments, debts, savings goals) have no `PUT` and no `GET /:id`, so they can't be edited without delete-and-recreate.
- `error.details` is populated only for password-strength and CSV errors. Field-level `details` for every `VALIDATION_ERROR` would let forms highlight the offending input.

## Nice-to-have

- Rate-limit state is a process-local `Map`, so it resets on restart and wouldn't be shared across multiple instances. Fine for a single-owner deploy; revisit only if it ever runs more than one process.
- Logout currently just clears localStorage; there's no server-side refresh-token revocation.
