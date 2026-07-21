// Mirrors the client-side checklist in public/js/app.js, public/signup.html, and
// public/reset-password.html (evaluatePassword) — keep all four in sync.
export function passwordPolicyError(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 18) return "Password must not be longer than 18 characters";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[0-9]/.test(password) && !/[^A-Za-z0-9\s]/.test(password)) return "Password must contain a number or special character";
  if (/[^\x21-\x7E]/.test(password)) return "Password must not contain spaces or unicode characters";
  return null;
}
