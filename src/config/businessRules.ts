export const RENEWAL_THRESHOLDS = {
  requiresRenewalDays: 46, // daysLeft < this => "Requires Renewal" (red)
  eligibleForRenewalDays: 90, // daysLeft <= this => "Eligible for Renewal" (amber); else "Active" (green)
  homeDashboardExpiringDays: 30, // separate "expiring soon" cutoff used by Home KPI counts/notifications
} as const;

export type RenewalBucket = "Requires Renewal" | "Eligible for Renewal" | "Active";

export function renewalBucket(daysLeft: number): RenewalBucket {
  if (daysLeft < RENEWAL_THRESHOLDS.requiresRenewalDays) return "Requires Renewal";
  if (daysLeft <= RENEWAL_THRESHOLDS.eligibleForRenewalDays) return "Eligible for Renewal";
  return "Active";
}

export const WORK_PASS_ADMIN_FEES: Record<string, number> = {
  EP: 150,
  "S Pass": 100,
  "Work Permit": 60,
  "Singapore Citizen": 0,
  PR: 0,
};

export const LIFETIME_PASS_TYPES = new Set(["Singapore Citizen", "PR"]);
