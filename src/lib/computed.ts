import { RENEWAL_THRESHOLDS, WORK_PASS_ADMIN_FEES, renewalBucket, LIFETIME_PASS_TYPES } from "../config/businessRules";

const MS_PER_DAY = 86_400_000;

export function daysLeft(expiry: Date | null | undefined, today: Date = new Date()): number | null {
  if (!expiry) return null;
  return Math.ceil((expiry.getTime() - today.getTime()) / MS_PER_DAY);
}

export function contractStatusDisplay(
  contractDaysLeft: number | null,
  lifecycleOverride: string | null | undefined
): string {
  if (lifecycleOverride === "Notice Period") return "Notice Period";
  if (lifecycleOverride === "Inactive") return "Inactive";
  if (contractDaysLeft === null) return "Active";
  return renewalBucket(contractDaysLeft);
}

export function passStatusDisplay(
  workPassType: string,
  passDaysLeft: number | null,
  lifecycleOverride: string | null | undefined
): string {
  if (LIFETIME_PASS_TYPES.has(workPassType)) return "N/A";
  if (lifecycleOverride === "Pending Application") return "Pending Application";
  if (lifecycleOverride === "Inactive") return "Inactive";
  if (passDaysLeft === null) return "Active";
  return renewalBucket(passDaysLeft);
}

export function isExpiringSoon(daysLeftValue: number | null): boolean {
  return daysLeftValue !== null && daysLeftValue <= RENEWAL_THRESHOLDS.homeDashboardExpiringDays;
}

export function workPassAdminFee(workPassType: string): number {
  return WORK_PASS_ADMIN_FEES[workPassType] ?? 0;
}

export interface PayrollLike {
  salary: number;
  cpf: number;
  skillsDevelopmentLevy: number;
  wica: number;
  medicalInsuranceCost: number;
  allowances: number;
  claimsReimbursements: number;
  overtime: number;
  noPayLeaveDeduction: number;
  otherStatutoryCosts: number;
}

export function totalEmployerCost(payroll: PayrollLike, workPassType: string): number {
  return (
    payroll.salary +
    payroll.cpf +
    payroll.skillsDevelopmentLevy +
    payroll.wica +
    payroll.medicalInsuranceCost +
    payroll.allowances +
    payroll.claimsReimbursements +
    payroll.overtime -
    payroll.noPayLeaveDeduction +
    payroll.otherStatutoryCosts +
    workPassAdminFee(workPassType)
  );
}

export function talentRevenue(chargeRate: number, billingType: string): number {
  return billingType === "Daily" ? chargeRate * 22 : chargeRate;
}

export function marginPercent(revenue: number, totalCost: number): number {
  if (revenue === 0) return 0;
  return ((revenue - totalCost) / revenue) * 100;
}

export function isRenewalStale(renewalCompletedSeq: number, datesUpdatedSeq: number): boolean {
  return datesUpdatedSeq < renewalCompletedSeq;
}

export function exitStatus(contractDaysLeftValue: number | null): "Exited" | "Pending Exit" {
  return contractDaysLeftValue !== null && contractDaysLeftValue < 0 ? "Exited" : "Pending Exit";
}

export function talentCode(id: number): string {
  return `C${String(id).padStart(6, "0")}`;
}
