import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService.js";
import { fail } from "../utils/response.js";

// Declared on Express's Request so authMiddleware and the route handlers that
// read these fields are assignable to RequestHandler without casts.
declare global {
  namespace Express {
    interface Request {
      userId: number;
      userEmail: string;
    }
  }
}

export type AuthRequest = Request;

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return fail(res, 401, "UNAUTHORIZED", "Missing or invalid authorization header");
  }

  const token = authHeader.substring(7);
  const payload = AuthService.verifyAccessToken(token);

  if (!payload) {
    return fail(res, 401, "INVALID_TOKEN", "Invalid or expired access token");
  }

  req.userId = payload.userId;
  req.userEmail = payload.email;
  next();
};
