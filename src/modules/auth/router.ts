import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { passwordPolicyError } from "../../lib/passwordPolicy";
import { sendEmail } from "../../lib/email";
import { env } from "../../config/env";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10, // 10 attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again in a few minutes." },
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many signup attempts. Try again later." },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Try again later." },
});

// Strict: a 6-digit code is only ~1M possibilities, so this must be tight even though the
// code itself also expires (10 min) and locks out after MAX_CODE_ATTEMPTS wrong guesses.
const verifyCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in a few minutes." },
});

const resendCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many code requests. Try again in a few minutes." },
});

const TWO_FACTOR_CODE_TTL_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

async function issueTwoFactorCode(userId: string, email: string, name: string) {
  const code = crypto.randomInt(100000, 1000000).toString();
  const twoFactorCodeHash = await bcrypt.hash(code, 10);
  const twoFactorCodeExpiresAt = new Date(Date.now() + TWO_FACTOR_CODE_TTL_MS);
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorCodeHash, twoFactorCodeExpiresAt, twoFactorAttempts: 0 },
  });
  await sendEmail(
    email,
    "Your login code — Dynamic Human Capital Talent Management",
    `<p>Hi ${name},</p>
     <p>Your one-time login code is:</p>
     <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p>
     <p>This code expires in 10 minutes. If you didn't try to log in, you can ignore this email.</p>`
  );
}

// More lenient than loginLimiter since this only fires while already authenticated
// (used for the live "is this really my current password" indicator while typing).
const verifyPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in a few minutes." },
});

authRouter.post(
  "/login",
  loginLimiter,
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

    await issueTwoFactorCode(user.id, user.email, user.name);
    req.session.regenerate((err) => {
      if (err) throw err;
      req.session.pendingUserId = user.id;
      res.json({ requiresTwoFactor: true, email: user.email });
    });
  })
);

authRouter.post(
  "/verify-code",
  verifyCodeLimiter,
  asyncHandler(async (req, res) => {
    const { code } = req.body as { code?: string };
    if (!req.session.pendingUserId) {
      res.status(400).json({ error: "No pending login. Please log in again." });
      return;
    }
    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.session.pendingUserId } });
    if (!user || !user.active || !user.twoFactorCodeHash || !user.twoFactorCodeExpiresAt) {
      res.status(400).json({ error: "No pending login. Please log in again." });
      return;
    }
    if (user.twoFactorCodeExpiresAt.getTime() < Date.now()) {
      res.status(400).json({ error: "This code has expired. Request a new one." });
      return;
    }
    if (user.twoFactorAttempts >= MAX_CODE_ATTEMPTS) {
      res.status(400).json({ error: "Too many incorrect attempts. Request a new code." });
      return;
    }

    const valid = await bcrypt.compare(code, user.twoFactorCodeHash);
    if (!valid) {
      await prisma.user.update({ where: { id: user.id }, data: { twoFactorAttempts: { increment: 1 } } });
      res.status(401).json({ error: "Incorrect code." });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCodeHash: null, twoFactorCodeExpiresAt: null, twoFactorAttempts: 0 },
    });
    req.session.regenerate((err) => {
      if (err) throw err;
      req.session.userId = user.id;
      req.session.userRole = user.role;
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
    });
  })
);

authRouter.post(
  "/resend-code",
  resendCodeLimiter,
  asyncHandler(async (req, res) => {
    if (!req.session.pendingUserId) {
      res.status(400).json({ error: "No pending login. Please log in again." });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: req.session.pendingUserId } });
    if (!user || !user.active) {
      res.status(400).json({ error: "No pending login. Please log in again." });
      return;
    }
    await issueTwoFactorCode(user.id, user.email, user.name);
    res.json({ ok: true });
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

authRouter.post(
  "/verify-password",
  requireAuth,
  verifyPasswordLimiter,
  asyncHandler(async (req, res) => {
    const { password } = req.body as { password?: string };
    if (!password) {
      res.status(400).json({ error: "password is required" });
      return;
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.session.userId! } });
    const valid = await bcrypt.compare(password, user.passwordHash);
    res.json({ valid });
  })
);

authRouter.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "currentPassword and newPassword are required" });
      return;
    }
    const policyError = passwordPolicyError(newPassword);
    if (policyError) {
      res.status(400).json({ error: policyError });
      return;
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.session.userId! } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    const sameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash);
    if (sameAsCurrent) {
      res.status(400).json({ error: "New password must be different from current password" });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });
    res.json({ ok: true });
  })
);

authRouter.post(
  "/signup",
  signupLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400).json({ error: "name, email, and password are required" });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const domain = normalizedEmail.split("@")[1];
    if (env.allowedSignupDomain && domain !== env.allowedSignupDomain.toLowerCase()) {
      res.status(403).json({ error: `Sign-up is restricted to @${env.allowedSignupDomain} email addresses.` });
      return;
    }
    const policyError = passwordPolicyError(password);
    if (policyError) {
      res.status(400).json({ error: policyError });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 12),
        role: "STANDARD",
      },
    });

    await issueTwoFactorCode(user.id, user.email, user.name);
    req.session.regenerate((err) => {
      if (err) throw err;
      req.session.pendingUserId = user.id;
      res.status(201).json({ requiresTwoFactor: true, email: user.email });
    });
  })
);

authRouter.post(
  "/forgot-password",
  forgotPasswordLimiter,
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email?: string };
    if (!email?.trim()) {
      res.status(400).json({ error: "email is required" });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always respond success, whether or not the account exists, to avoid leaking which
    // emails are registered.
    if (user && user.active) {
      const token = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiresAt },
      });
      const resetUrl = `${env.appUrl}/reset-password.html?token=${token}`;
      await sendEmail(
        user.email,
        "Reset your password — Dynamic Human Capital Talent Management",
        `<p>Hi ${user.name},</p>
         <p>Someone requested a password reset for your account. Click the link below to set a new password. This link expires in 1 hour.</p>
         <p><a href="${resetUrl}">${resetUrl}</a></p>
         <p>If you didn't request this, you can safely ignore this email.</p>`
      );
    }

    res.json({ ok: true, message: "If an account exists for that email, a reset link has been sent." });
  })
);

authRouter.post(
  "/reset-password",
  forgotPasswordLimiter,
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };
    if (!token || !newPassword) {
      res.status(400).json({ error: "token and newPassword are required" });
      return;
    }
    const policyError = passwordPolicyError(newPassword);
    if (policyError) {
      res.status(400).json({ error: policyError });
      return;
    }

    const user = await prisma.user.findUnique({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
      res.status(400).json({ error: "This reset link is invalid or has expired. Request a new one." });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 12),
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });
    res.json({ ok: true });
  })
);
