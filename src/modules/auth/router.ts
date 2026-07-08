import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireAuth } from "../../middleware/requireAuth";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    req.session.regenerate((err) => {
      if (err) throw err;
      req.session.userId = user.id;
      req.session.userRole = user.role;
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
    });
  })
);

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.session.userId! } });
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  })
);
