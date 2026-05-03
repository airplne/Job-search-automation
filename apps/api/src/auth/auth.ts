import type { NextFunction, Request, Response } from "express";
import type { AppEnv } from "../config/env.js";
import type { AppStore } from "../store/store.js";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: "user" | "admin";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

export function deriveDevUserId(email: string): string {
  return `dev_${Buffer.from(email.trim().toLowerCase()).toString("base64url")}`;
}

export function createAuthMiddleware(env: AppEnv, store: AppStore) {
  return async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!env.isDevAuthEnabled) {
      res.status(401).json({ error: "Unauthorized", message: "Authentication is not configured for this environment" });
      return;
    }

    const userId = req.header("x-dev-user-id");
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Missing local development auth header" });
      return;
    }

    const role = req.header("x-dev-admin") === "true" ? "admin" : "user";
    await store.upsertUser({ id: userId, email: `${userId}@local.dev` });
    req.user = { id: userId, role };
    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden", message: "Admin access required" });
    return;
  }
  next();
}
