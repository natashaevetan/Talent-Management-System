import { RENEWAL_THRESHOLDS } from "../config/businessRules";

/** Per-record staleness tracking (mirrors the mockup's shared renewalActionSeq counter, scoped
 * to a single record instead of globally — only the relative order between these two fields
 * matters for isRenewalStale(), not any cross-record ordering).
 *
 * If a save both marks the renewal "Completed" AND updates the dates in the same request, the
 * completed-stamp is taken first so the dates-changed stamp ends up >= it (not flagged stale). */
export function nextRenewalSeq(
  current: { completedSeq: number; datesUpdatedSeq: number },
  opts: { completingNow: boolean; datesChanged: boolean }
): { completedSeq: number; datesUpdatedSeq: number } {
  let { completedSeq, datesUpdatedSeq } = current;
  let next = Math.max(completedSeq, datesUpdatedSeq) + 1;
  if (opts.completingNow) {
    completedSeq = next;
    next += 1;
  }
  if (opts.datesChanged) {
    datesUpdatedSeq = next;
  }
  return { completedSeq, datesUpdatedSeq };
}

export function isExpiryWithinRenewalWindow(expiry: Date, today: Date = new Date()): boolean {
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
  return daysLeft <= RENEWAL_THRESHOLDS.eligibleForRenewalDays;
}
