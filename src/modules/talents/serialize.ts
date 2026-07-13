import { Prisma } from "@prisma/client";
import { daysLeft, contractStatusDisplay, passStatusDisplay, isExpiringSoon } from "../../lib/computed";
import { fromJson } from "../../lib/json";

const talentWithRelations = Prisma.validator<Prisma.TalentDefaultArgs>()({
  include: {
    client: true,
    projectType: true,
    entity: true,
    caseOwner: true,
    contract: true,
    workPass: true,
    insurance: true,
    payroll: true,
    talentBilling: true,
    leaveTimesheet: true,
    offboarding: true,
  },
});
export type TalentWithRelations = Prisma.TalentGetPayload<typeof talentWithRelations>;
export const talentInclude = talentWithRelations.include;

function yn(value: boolean | null | undefined): "Yes" | "No" {
  return value ? "Yes" : "No";
}

/** Flattens the normalized Talent + child records into the single wide object shape
 * the mockup frontend's render functions expect (talent.contractStart, talent.workPassType, etc).
 */
export function serializeTalent(t: TalentWithRelations) {
  const contractDaysLeftValue = t.contract ? daysLeft(t.contract.contractEnd) : null;
  const passDaysLeftValue = t.workPass ? daysLeft(t.workPass.passExpiry) : null;
  const policyDaysLeftValue = t.insurance ? daysLeft(t.insurance.policyExpiry) : null;
  const alert = (passDaysLeftValue !== null && passDaysLeftValue <= 30) || (contractDaysLeftValue !== null && contractDaysLeftValue <= 30);

  return {
    id: t.id,
    firstName: t.firstName,
    lastName: t.lastName,
    name: t.name,
    nric: t.nric,
    dateOfBirth: t.dateOfBirth,
    sex: t.sex,
    nationality: t.nationality,
    maritalStatus: t.maritalStatus,
    dependants: t.dependants,
    address: t.address,
    contactNumber: t.contactNumber,
    email: t.email,
    bankAccount: t.bankAccount,
    jobTitle: t.jobTitle,
    skillset: fromJson<string[]>(t.skillset, []),
    workLocation: t.workLocation,

    client: t.client?.name ?? null,
    clientId: t.clientId,
    projectType: t.projectType?.name ?? null,
    projectTypeId: t.projectTypeId,
    entity: t.entity?.name ?? null,
    entityId: t.entityId,
    caseOwner: t.caseOwner?.name ?? null,
    caseOwnerId: t.caseOwnerId,

    // Contract
    contractStart: t.contract?.contractStart ?? null,
    contractEnd: t.contract?.contractEnd ?? null,
    contractStatus: t.contract?.contractStatus ?? null,
    noticePeriod: t.contract?.noticePeriod ?? null,
    contractUpload: t.contract?.contractUpload ?? null,
    signedContractUpload: t.contract?.signedContractUpload ?? null,
    contractRenewalRequired: yn(t.contract?.contractRenewalRequired),
    contractRenewalStatus: t.contract?.contractRenewalStatus ?? null,
    contractLifecycleStatus: t.contract?.contractLifecycleStatus ?? "",
    remarks: t.contract?.remarks ?? null,
    renewalRemarks: t.contract?.renewalRemarks ?? "",
    sowRequired: yn(t.contract?.sowRequired),
    poRequired: yn(t.contract?.poRequired),
    sowStatus: t.contract?.sowStatus ?? null,
    poStatus: t.contract?.poStatus ?? null,
    renewalCompletedSeq: t.contract?.renewalCompletedSeq ?? 0,
    datesUpdatedSeq: t.contract?.datesUpdatedSeq ?? 0,
    contractNoticeSent: t.contract?.contractNoticeSent ?? false,
    contractDaysLeft: contractDaysLeftValue,
    clientContactName: t.contract?.clientContactName ?? null,
    clientContactEmail: t.contract?.clientContactEmail ?? null,
    clientDepartment: t.contract?.clientDepartment ?? null,
    poQuotationNotes: t.contract?.poQuotationNotes ?? null,

    // Work Pass
    workPassType: t.workPass?.workPassType ?? null,
    passIssueDate: t.workPass?.passIssueDate ?? null,
    passExpiry: t.workPass?.passExpiry ?? null,
    passStatus: t.workPass?.passStatus ?? null,
    ipaDate: t.workPass?.ipaDate ?? null,
    passportExpiry: t.workPass?.passportExpiry ?? null,
    medicalCheckupStatus: t.workPass?.medicalCheckupStatus ?? null,
    medicalInsuranceStatus: t.workPass?.medicalInsuranceStatus ?? null,
    wicaCoverageStatus: t.workPass?.wicaCoverageStatus ?? null,
    renewalRequired: yn(t.workPass?.renewalRequired),
    renewalStatus: t.workPass?.renewalStatus ?? null,
    educationVerificationStatus: t.workPass?.educationVerificationStatus ?? null,
    passLifecycleStatus: t.workPass?.passLifecycleStatus ?? "",
    passRenewalRemarks: t.workPass?.passRenewalRemarks ?? "",
    passRenewalCompletedSeq: t.workPass?.passRenewalCompletedSeq ?? 0,
    passDatesUpdatedSeq: t.workPass?.passDatesUpdatedSeq ?? 0,
    workPassNoticeSent: t.workPass?.workPassNoticeSent ?? false,
    passDaysLeft: passDaysLeftValue,

    // Insurance
    policyType: t.insurance?.policyType ?? null,
    policyIssueDate: t.insurance?.policyIssueDate ?? null,
    policyExpiry: t.insurance?.policyExpiry ?? null,
    policyRenewalRequired: yn(t.insurance?.policyRenewalRequired),
    policyRenewalStatus: t.insurance?.policyRenewalStatus ?? null,
    policyRemarks: t.insurance?.policyRemarks ?? "",
    insuranceNoticeSent: t.insurance?.insuranceNoticeSent ?? false,
    policyRenewalCompletedSeq: t.insurance?.policyRenewalCompletedSeq ?? 0,
    policyDatesUpdatedSeq: t.insurance?.policyDatesUpdatedSeq ?? 0,
    policyDaysLeft: policyDaysLeftValue,

    // Payroll
    salary: t.payroll?.salary ?? 0,
    cpf: t.payroll?.cpf ?? 0,
    skillsDevelopmentLevy: t.payroll?.skillsDevelopmentLevy ?? 0,
    wica: t.payroll?.wica ?? 0,
    medicalInsuranceCost: t.payroll?.medicalInsuranceCost ?? 0,
    allowances: t.payroll?.allowances ?? 0,
    claimsReimbursements: t.payroll?.claimsReimbursements ?? 0,
    overtime: t.payroll?.overtime ?? 0,
    noPayLeaveDeduction: t.payroll?.noPayLeaveDeduction ?? 0,
    otherStatutoryCosts: t.payroll?.otherStatutoryCosts ?? 0,

    // Talent Billing
    chargeRate: t.talentBilling?.chargeRate ?? 0,
    billingType: t.talentBilling?.billingType ?? "Monthly",
    talentInvoiceNumber: t.talentBilling?.talentInvoiceNumber ?? null,
    talentInvoiceDate: t.talentBilling?.talentInvoiceDate ?? null,
    talentInvoiceDueDate: t.talentBilling?.talentInvoiceDueDate ?? null,
    talentInvoiceAmount: t.talentBilling?.talentInvoiceAmount ?? 0,
    invoiceStatus: t.talentBilling?.invoiceStatus ?? null,
    talentInvoicePaidDate: t.talentBilling?.talentInvoicePaidDate ?? null,

    // Leave & Timesheet
    annualLeaveEntitlement: t.leaveTimesheet?.annualLeaveEntitlement ?? 0,
    annualLeaveTaken: t.leaveTimesheet?.annualLeaveTaken ?? 0,
    annualLeaveBalance: (t.leaveTimesheet?.annualLeaveEntitlement ?? 0) - (t.leaveTimesheet?.annualLeaveTaken ?? 0),
    sickLeaveEntitlement: t.leaveTimesheet?.sickLeaveEntitlement ?? 0,
    sickLeaveTaken: t.leaveTimesheet?.sickLeaveTaken ?? 0,
    sickLeaveBalance: (t.leaveTimesheet?.sickLeaveEntitlement ?? 0) - (t.leaveTimesheet?.sickLeaveTaken ?? 0),
    offInLieuEntitlement: t.leaveTimesheet?.offInLieuEntitlement ?? 0,
    offInLieuTaken: t.leaveTimesheet?.offInLieuTaken ?? 0,
    offInLieuBalance: (t.leaveTimesheet?.offInLieuEntitlement ?? 0) - (t.leaveTimesheet?.offInLieuTaken ?? 0),
    unpaidLeaveTaken: t.leaveTimesheet?.unpaidLeaveTaken ?? 0,
    mcUpload: t.leaveTimesheet?.mcUpload ?? null,
    leaveApprovalStatus: t.leaveTimesheet?.leaveApprovalStatus ?? null,
    timesheetMonth: t.leaveTimesheet?.timesheetMonth ?? null,
    workingDays: t.leaveTimesheet?.workingDays ?? null,
    timesheetSubmitted: yn(t.leaveTimesheet?.timesheetSubmitted),
    submissionDate: t.leaveTimesheet?.submissionDate ?? null,
    clientApproved: yn(t.leaveTimesheet?.clientApproved),
    approvalDate: t.leaveTimesheet?.approvalDate ?? null,
    overtimeHours: t.leaveTimesheet?.overtimeHours ?? 0,
    absenceDays: t.leaveTimesheet?.absenceDays ?? 0,
    timesheetRemarks: t.leaveTimesheet?.timesheetRemarks ?? null,

    // Offboarding
    lastWorkingDay: t.offboarding?.lastWorkingDay ?? null,
    resignationReason: t.offboarding?.resignationReason ?? null,
    noticeServed: t.offboarding?.noticeServed ?? null,
    workPassCancellationDate: t.offboarding?.workPassCancellationDate ?? null,
    clientNotified: t.offboarding?.clientNotified ?? null,
    replacementRequired: t.offboarding?.replacementRequired ?? null,
    finalInvoiceIssued: t.offboarding?.finalInvoiceIssued ?? null,
    exitDocsCompleted: t.offboarding?.exitDocsCompleted ?? null,
    offboardingRemarks: t.offboarding?.offboardingRemarks ?? null,
    offboardingChecklist: fromJson<{ label: string; status: string }[]>(t.offboarding?.offboardingChecklist ?? null, []),

    alert,
    contractStatusLabel: contractStatusDisplay(contractDaysLeftValue, t.contract?.contractLifecycleStatus),
    passStatusLabel: t.workPass ? passStatusDisplay(t.workPass.workPassType, passDaysLeftValue, t.workPass.passLifecycleStatus) : null,
    contractExpiringSoon: isExpiringSoon(contractDaysLeftValue),
    passExpiringSoon: isExpiringSoon(passDaysLeftValue),
  };
}

export type SerializedTalent = ReturnType<typeof serializeTalent>;
