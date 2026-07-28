import { prisma } from "./prisma";

/** The settings row is created lazily on first read so there's no separate seed step. */
export async function getPermissionSettings() {
  return prisma.permissionSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export function canViewFinancials(role: string | undefined, settings: { standardCanViewFinancials: boolean }): boolean {
  return role === "ADMIN" || settings.standardCanViewFinancials;
}

/** Looks up the requesting user's role fresh from the DB rather than trusting the session's
 * cached copy — a role change (e.g. promotion to ADMIN) only takes effect on next login
 * otherwise, since req.session.userRole is set once at login and never refreshed. */
export async function getCurrentUserRole(req: { session: { userId?: string } }): Promise<string | undefined> {
  if (!req.session.userId) return undefined;
  const user = await prisma.user.findUnique({ where: { id: req.session.userId }, select: { role: true, active: true } });
  return user?.active ? user.role : undefined;
}

export async function canViewFinancialsForRequest(req: { session: { userId?: string } }): Promise<boolean> {
  const [role, settings] = await Promise.all([getCurrentUserRole(req), getPermissionSettings()]);
  return canViewFinancials(role, settings);
}
