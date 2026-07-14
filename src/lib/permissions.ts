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
