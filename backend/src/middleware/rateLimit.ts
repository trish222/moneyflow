/**
 * rateLimit.ts throttles repeated failed logins (PRD §7, MONEYFLOW_SPEC.md §4.2).
 * - Counts failures per client IP inside a fixed window and returns 429 once the limit is reached
 * - A successful login clears that IP's counter; the window expires on its own
 */

import type { Request, Response, NextFunction } from "express";
import { fail } from "../utils/response.js";

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

interface Attempts {
  count: number;
  windowStart: number;
}

const failedLogins = new Map<string, Attempts>();

function clientKey(req: Request): string {
  return req.ip ?? req.socket?.remoteAddress ?? "unknown";
}

/** Drops the entry if its window has already elapsed. */
function currentAttempts(key: string): Attempts | undefined {
  const entry = failedLogins.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.windowStart >= WINDOW_MS) {
    failedLogins.delete(key);
    return undefined;
  }
  return entry;
}

export const loginRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const entry = currentAttempts(clientKey(req));

  if (entry && entry.count >= MAX_FAILED_ATTEMPTS) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (Date.now() - entry.windowStart)) / 1000);
    res.setHeader("Retry-After", String(retryAfterSec));
    return fail(
      res,
      429,
      "RATE_LIMITED",
      `Too many failed login attempts. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`
    );
  }

  next();
};

export function recordFailedLogin(req: Request): void {
  const key = clientKey(req);
  const entry = currentAttempts(key);

  if (entry) {
    entry.count += 1;
  } else {
    failedLogins.set(key, { count: 1, windowStart: Date.now() });
  }
}

export function clearFailedLogins(req: Request): void {
  failedLogins.delete(clientKey(req));
}

/** Test seam: wipes all counters so suites don't leak rate-limit state into each other. */
export function resetLoginRateLimit(): void {
  failedLogins.clear();
}
