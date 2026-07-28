import type { Request, Response, NextFunction } from "express";
import { getCurrentUserRole } from "../lib/permissions";

// Checks the role fresh from the DB rather than the session's cached copy, so a role change
// (promotion or demotion) takes effect immediately instead of only on the user's next login.
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = await getCurrentUserRole(req);
  if (role !== "ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
