import type { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: string;
    // Set after password verification, before the 2FA code is confirmed. Deliberately a
    // separate field from userId so requireAuth never treats a pending login as authenticated.
    pendingUserId?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
