import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  sessionSecret: required("SESSION_SECRET"),
  databaseUrl: required("DATABASE_URL"),
  nodeEnv: process.env.NODE_ENV ?? "development",
  // Self-service signup is restricted to this email domain (e.g. "dhc.com.sg").
  allowedSignupDomain: process.env.ALLOWED_SIGNUP_DOMAIN ?? null,
  resendApiKey: process.env.RESEND_API_KEY ?? null,
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
  // Base URL used to build links in emails (password reset, etc).
  appUrl: process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
};
