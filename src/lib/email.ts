import { env } from "../config/env";

export async function sendEmail(to: string, subject: string, html: string): Promise<{ sent: boolean; reason?: string }> {
  if (!env.resendApiKey) {
    console.warn(`[email] RESEND_API_KEY not configured — would have sent "${subject}" to ${to}`);
    return { sent: false, reason: "Email delivery is not configured yet." };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.resendFromEmail,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[email] Resend API error ${res.status}: ${body}`);
    return { sent: false, reason: "Failed to send email." };
  }
  return { sent: true };
}
