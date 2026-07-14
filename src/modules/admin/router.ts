import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";
import { getPermissionSettings } from "../../lib/permissions";

export const adminRouter = Router();
adminRouter.use(requireAuth);

// Readable by any logged-in user (the frontend needs this to decide what to show),
// but only Admin can change it.
adminRouter.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const settings = await getPermissionSettings();
    res.json({ standardCanViewFinancials: settings.standardCanViewFinancials });
  })
);

adminRouter.patch(
  "/settings",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { standardCanViewFinancials } = req.body as { standardCanViewFinancials?: boolean };
    const settings = await prisma.permissionSettings.upsert({
      where: { id: "singleton" },
      update: { standardCanViewFinancials: Boolean(standardCanViewFinancials) },
      create: { id: "singleton", standardCanViewFinancials: Boolean(standardCanViewFinancials) },
    });
    res.json({ standardCanViewFinancials: settings.standardCanViewFinancials });
  })
);

adminRouter.get(
  "/users",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(users);
  })
);

adminRouter.patch(
  "/users/:id/role",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const { role } = req.body as { role?: string };
    if (role !== "ADMIN" && role !== "STANDARD") {
      res.status(400).json({ error: "role must be ADMIN or STANDARD" });
      return;
    }
    if (id === req.session.userId && role !== "ADMIN") {
      res.status(400).json({ error: "You can't demote your own account." });
      return;
    }
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, name: true, role: true, active: true },
    });
    res.json(user);
  })
);

adminRouter.patch(
  "/users/:id/active",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const { active } = req.body as { active?: boolean };
    if (id === req.session.userId && active === false) {
      res.status(400).json({ error: "You can't deactivate your own account." });
      return;
    }
    const user = await prisma.user.update({
      where: { id },
      data: { active: Boolean(active) },
      select: { id: true, email: true, name: true, role: true, active: true },
    });
    res.json(user);
  })
);
