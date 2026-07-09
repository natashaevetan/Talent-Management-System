-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STANDARD');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STANDARD',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactNumber" TEXT,
    "accountManager" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ProjectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalEntity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "LegalEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recruiter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Recruiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Talent" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nric" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "sex" TEXT,
    "nationality" TEXT,
    "maritalStatus" TEXT,
    "dependants" INTEGER,
    "address" TEXT,
    "contactNumber" TEXT,
    "email" TEXT,
    "bankAccount" TEXT,
    "jobTitle" TEXT,
    "skillset" TEXT,
    "workLocation" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "clientId" TEXT,
    "projectTypeId" TEXT,
    "entityId" TEXT,
    "caseOwnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Talent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "talentId" INTEGER NOT NULL,
    "contractStart" TIMESTAMP(3) NOT NULL,
    "contractEnd" TIMESTAMP(3) NOT NULL,
    "contractStatus" TEXT NOT NULL DEFAULT 'Drafted',
    "noticePeriod" TEXT,
    "contractUpload" TEXT,
    "signedContractUpload" TEXT,
    "contractRenewalRequired" BOOLEAN NOT NULL DEFAULT false,
    "contractRenewalStatus" TEXT NOT NULL DEFAULT 'Not Started',
    "contractLifecycleStatus" TEXT,
    "remarks" TEXT,
    "renewalRemarks" TEXT,
    "sowRequired" BOOLEAN NOT NULL DEFAULT false,
    "poRequired" BOOLEAN NOT NULL DEFAULT false,
    "sowStatus" TEXT,
    "poStatus" TEXT,
    "renewalCompletedSeq" INTEGER NOT NULL DEFAULT 0,
    "datesUpdatedSeq" INTEGER NOT NULL DEFAULT 0,
    "contractNoticeSent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkPass" (
    "id" TEXT NOT NULL,
    "talentId" INTEGER NOT NULL,
    "workPassType" TEXT NOT NULL DEFAULT 'EP',
    "passIssueDate" TIMESTAMP(3),
    "passExpiry" TIMESTAMP(3),
    "passStatus" TEXT NOT NULL DEFAULT 'Not Started',
    "ipaDate" TIMESTAMP(3),
    "passportExpiry" TIMESTAMP(3),
    "medicalCheckupStatus" TEXT,
    "medicalInsuranceStatus" TEXT,
    "wicaCoverageStatus" TEXT,
    "renewalRequired" BOOLEAN NOT NULL DEFAULT false,
    "renewalStatus" TEXT NOT NULL DEFAULT 'Not Started',
    "educationVerificationStatus" TEXT,
    "passLifecycleStatus" TEXT,
    "passRenewalRemarks" TEXT,
    "passRenewalCompletedSeq" INTEGER NOT NULL DEFAULT 0,
    "passDatesUpdatedSeq" INTEGER NOT NULL DEFAULT 0,
    "workPassNoticeSent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsurancePolicy" (
    "id" TEXT NOT NULL,
    "talentId" INTEGER NOT NULL,
    "policyType" TEXT NOT NULL DEFAULT 'Not Required',
    "policyIssueDate" TIMESTAMP(3),
    "policyExpiry" TIMESTAMP(3),
    "policyRenewalRequired" BOOLEAN NOT NULL DEFAULT false,
    "policyRenewalStatus" TEXT NOT NULL DEFAULT 'Not Started',
    "policyRemarks" TEXT,
    "insuranceNoticeSent" BOOLEAN NOT NULL DEFAULT false,
    "policyRenewalCompletedSeq" INTEGER NOT NULL DEFAULT 0,
    "policyDatesUpdatedSeq" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsurancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "talentId" INTEGER NOT NULL,
    "salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpf" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skillsDevelopmentLevy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wica" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "medicalInsuranceCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "claimsReimbursements" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "noPayLeaveDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherStatutoryCosts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentBilling" (
    "id" TEXT NOT NULL,
    "talentId" INTEGER NOT NULL,
    "chargeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billingType" TEXT NOT NULL DEFAULT 'Monthly',
    "talentInvoiceNumber" TEXT,
    "talentInvoiceDate" TIMESTAMP(3),
    "talentInvoiceDueDate" TIMESTAMP(3),
    "talentInvoiceAmount" DOUBLE PRECISION,
    "invoiceStatus" TEXT NOT NULL DEFAULT 'Pending',
    "talentInvoicePaidDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentBilling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveTimesheet" (
    "id" TEXT NOT NULL,
    "talentId" INTEGER NOT NULL,
    "annualLeaveEntitlement" DOUBLE PRECISION NOT NULL DEFAULT 14,
    "annualLeaveTaken" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sickLeaveEntitlement" DOUBLE PRECISION NOT NULL DEFAULT 14,
    "sickLeaveTaken" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "offInLieuEntitlement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "offInLieuTaken" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unpaidLeaveTaken" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mcUpload" TEXT,
    "leaveApprovalStatus" TEXT,
    "timesheetMonth" TIMESTAMP(3),
    "workingDays" INTEGER,
    "timesheetSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "submissionDate" TIMESTAMP(3),
    "clientApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvalDate" TIMESTAMP(3),
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "absenceDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timesheetRemarks" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveTimesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimesheetSnapshot" (
    "id" TEXT NOT NULL,
    "talentId" INTEGER NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "workingDays" INTEGER,
    "timesheetSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "submissionDate" TIMESTAMP(3),
    "clientApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvalDate" TIMESTAMP(3),
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "absenceDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimesheetSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offboarding" (
    "id" TEXT NOT NULL,
    "talentId" INTEGER NOT NULL,
    "lastWorkingDay" TIMESTAMP(3),
    "resignationReason" TEXT,
    "noticeServed" TEXT,
    "workPassCancellationDate" TIMESTAMP(3),
    "clientNotified" TEXT,
    "replacementRequired" TEXT,
    "finalInvoiceIssued" TEXT,
    "exitDocsCompleted" TEXT,
    "offboardingRemarks" TEXT,
    "offboardingChecklist" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientBilling" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "billingType" TEXT,
    "chargeRate" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'SGD',
    "billableStart" TIMESTAMP(3),
    "billableEnd" TIMESTAMP(3),
    "sowRequired" BOOLEAN NOT NULL DEFAULT false,
    "sowStatus" TEXT,
    "poRequired" BOOLEAN NOT NULL DEFAULT false,
    "poStatus" TEXT,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "invoiceAmount" DOUBLE PRECISION,
    "invoiceStatus" TEXT,
    "clientPaymentDueDate" TIMESTAMP(3),
    "clientPaymentReceivedDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientBilling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SowRecord" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "sowRequired" BOOLEAN NOT NULL DEFAULT false,
    "sowStatus" TEXT NOT NULL DEFAULT 'Yet to Draft',
    "dateOfCommencement" TIMESTAMP(3),
    "dateOfCompletion" TIMESTAMP(3),
    "remarks" TEXT,
    "sowRenewalCompletedSeq" INTEGER NOT NULL DEFAULT 0,
    "sowDatesUpdatedSeq" INTEGER NOT NULL DEFAULT 0,
    "noticeSent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SowRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SowTalent" (
    "sowId" TEXT NOT NULL,
    "talentId" INTEGER NOT NULL,

    CONSTRAINT "SowTalent_pkey" PRIMARY KEY ("sowId","talentId")
);

-- CreateTable
CREATE TABLE "PoRecord" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "poRequired" BOOLEAN NOT NULL DEFAULT false,
    "poStatus" TEXT NOT NULL DEFAULT 'Yet to Draft',
    "poNo" TEXT,
    "dateOfCommencement" TIMESTAMP(3),
    "dateOfCompletion" TIMESTAMP(3),
    "remarks" TEXT,
    "poRenewalCompletedSeq" INTEGER NOT NULL DEFAULT 0,
    "poDatesUpdatedSeq" INTEGER NOT NULL DEFAULT 0,
    "noticeSent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoTalent" (
    "poId" TEXT NOT NULL,
    "talentId" INTEGER NOT NULL,

    CONSTRAINT "PoTalent_pkey" PRIMARY KEY ("poId","talentId")
);

-- CreateTable
CREATE TABLE "RenewalEvent" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenewalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_name_key" ON "Client"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectType_name_key" ON "ProjectType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LegalEntity_name_key" ON "LegalEntity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Recruiter_name_key" ON "Recruiter"("name");

-- CreateIndex
CREATE INDEX "Talent_clientId_idx" ON "Talent"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_talentId_key" ON "Contract"("talentId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkPass_talentId_key" ON "WorkPass"("talentId");

-- CreateIndex
CREATE UNIQUE INDEX "InsurancePolicy_talentId_key" ON "InsurancePolicy"("talentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_talentId_key" ON "Payroll"("talentId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentBilling_talentId_key" ON "TalentBilling"("talentId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveTimesheet_talentId_key" ON "LeaveTimesheet"("talentId");

-- CreateIndex
CREATE UNIQUE INDEX "TimesheetSnapshot_talentId_month_key" ON "TimesheetSnapshot"("talentId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Offboarding_talentId_key" ON "Offboarding"("talentId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientBilling_clientId_key" ON "ClientBilling"("clientId");

-- CreateIndex
CREATE INDEX "RenewalEvent_entityType_entityId_idx" ON "RenewalEvent"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Talent" ADD CONSTRAINT "Talent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talent" ADD CONSTRAINT "Talent_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "ProjectType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talent" ADD CONSTRAINT "Talent_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "LegalEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Talent" ADD CONSTRAINT "Talent_caseOwnerId_fkey" FOREIGN KEY ("caseOwnerId") REFERENCES "Recruiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPass" ADD CONSTRAINT "WorkPass_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentBilling" ADD CONSTRAINT "TalentBilling_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveTimesheet" ADD CONSTRAINT "LeaveTimesheet_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetSnapshot" ADD CONSTRAINT "TimesheetSnapshot_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offboarding" ADD CONSTRAINT "Offboarding_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientBilling" ADD CONSTRAINT "ClientBilling_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SowRecord" ADD CONSTRAINT "SowRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SowTalent" ADD CONSTRAINT "SowTalent_sowId_fkey" FOREIGN KEY ("sowId") REFERENCES "SowRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SowTalent" ADD CONSTRAINT "SowTalent_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoRecord" ADD CONSTRAINT "PoRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoTalent" ADD CONSTRAINT "PoTalent_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PoRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoTalent" ADD CONSTRAINT "PoTalent_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
