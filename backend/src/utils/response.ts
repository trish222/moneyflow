/**
 * response.ts standardizes every API response on the MONEYFLOW_SPEC.md §4.1 envelope.
 * - ok()/created() wrap success payloads as { success, data, error: null }
 * - fail() wraps errors as { success, data: null, error: { code, message, details? } }
 */

import type { Response } from "express";

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data, error: null });
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, 201);
}

export function fail(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return res.status(status).json({
    success: false,
    data: null,
    error: details === undefined ? { code, message } : { code, message, details },
  });
}
