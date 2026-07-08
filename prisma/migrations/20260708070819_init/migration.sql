-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STANDARD',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactNumber" TEXT,
    "accountManager" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "LegalEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Recruiter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Talent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nric" TEXT NOT NULL,
    "dateOfBirth" DATETIME,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Talent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Talent_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "ProjectType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Talent_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "LegalEntity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Talent_caseOwnerId_fkey" FOREIGN KEY ("caseOwnerId") REFERENCES "Recruiter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talentId" INTEGER NOT NULL,
    "contractStart" DATETIME NOT NULL,
    "contractEnd" DATETIME NOT NULL,
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkPass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talentId" INTEGER NOT NULL,
    "workPassType" TEXT NOT NULL DEFAULT 'EP',
    "passIssueDate" DATETIME,
    "passExpiry" DATETIME,
    "passStatus" TEXT NOT NULL DEFAULT 'Not Started',
    "ipaDate" DATETIME,
    "passportExpiry" DATETIME,
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkPass_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InsurancePolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talentId" INTEGER NOT NULL,
    "policyType" TEXT NOT NULL DEFAULT 'Not Required',
    "policyIssueDate" DATETIME,
    "policyExpiry" DATETIME,
    "policyRenewalRequired" BOOLEAN NOT NULL DEFAULT false,
    "policyRenewalStatus" TEXT NOT NULL DEFAULT 'Not Started',
    "policyRemarks" TEXT,
    "insuranceNoticeSent" BOOLEAN NOT NULL DEFAULT false,
    "policyRenewalCompletedSeq" INTEGER NOT NULL DEFAULT 0,
    "policyDatesUpdatedSeq" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InsurancePolicy_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talentId" INTEGER NOT NULL,
    "salary" REAL NOT NULL DEFAULT 0,
    "cpf" REAL NOT NULL DEFAULT 0,
    "skillsDevelopmentLevy" REAL NOT NULL DEFAULT 0,
    "wica" REAL NOT NULL DEFAULT 0,
    "medicalInsuranceCost" REAL NOT NULL DEFAULT 0,
    "allowances" REAL NOT NULL DEFAULT 0,
    "claimsReimbursements" REAL NOT NULL DEFAULT 0,
    "overtime" REAL NOT NULL DEFAULT 0,
    "noPayLeaveDeduction" REAL NOT NULL DEFAULT 0,
    "otherStatutoryCosts" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payroll_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TalentBilling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talentId" INTEGER NOT NULL,
    "chargeRate" REAL NOT NULL DEFAULT 0,
    "billingType" TEXT NOT NULL DEFAULT 'Monthly',
    "talentInvoiceNumber" TEXT,
    "talentInvoiceDate" DATETIME,
    "talentInvoiceDueDate" DATETIME,
    "talentInvoiceAmount" REAL,
    "invoiceStatus" TEXT NOT NULL DEFAULT 'Pending',
    "talentInvoicePaidDate" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TalentBilling_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeaveTimesheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talentId" INTEGER NOT NULL,
    "annualLeaveEntitlement" REAL NOT NULL DEFAULT 14,
    "annualLeaveTaken" REAL NOT NULL DEFAULT 0,
    "sickLeaveEntitlement" REAL NOT NULL DEFAULT 14,
    "sickLeaveTaken" REAL NOT NULL DEFAULT 0,
    "offInLieuEntitlement" REAL NOT NULL DEFAULT 0,
    "offInLieuTaken" REAL NOT NULL DEFAULT 0,
    "unpaidLeaveTaken" REAL NOT NULL DEFAULT 0,
    "mcUpload" TEXT,
    "leaveApprovalStatus" TEXT,
    "timesheetMonth" DATETIME,
    "workingDays" INTEGER,
    "timesheetSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "submissionDate" DATETIME,
    "clientApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvalDate" DATETIME,
    "overtimeHours" REAL NOT NULL DEFAULT 0,
    "absenceDays" REAL NOT NULL DEFAULT 0,
    "timesheetRemarks" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaveTimesheet_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimesheetSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talentId" INTEGER NOT NULL,
    "month" DATETIME NOT NULL,
    "workingDays" INTEGER,
    "timesheetSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "submissionDate" DATETIME,
    "clientApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvalDate" DATETIME,
    "overtimeHours" REAL NOT NULL DEFAULT 0,
    "absenceDays" REAL NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimesheetSnapshot_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offboarding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "talentId" INTEGER NOT NULL,
    "lastWorkingDay" DATETIME,
    "resignationReason" TEXT,
    "noticeServed" TEXT,
    "workPassCancellationDate" DATETIME,
    "clientNotified" TEXT,
    "replacementRequired" TEXT,
    "finalInvoiceIssued" TEXT,
    "exitDocsCompleted" TEXT,
    "offboardingRemarks" TEXT,
    "offboardingChecklist" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Offboarding_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientBilling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "billingType" TEXT,
    "chargeRate" REAL,
    "currency" TEXT NOT NULL DEFAULT 'SGD',
    "billableStart" DATETIME,
    "billableEnd" DATETIME,
    "sowRequired" BOOLEAN NOT NULL DEFAULT false,
    "sowStatus" TEXT,
    "poRequired" BOOLEAN NOT NULL DEFAULT false,
    "poStatus" TEXT,
    "invoiceNumber" TEXT,
    "invoiceDate" DATETIME,
    "invoiceAmount" REAL,
    "invoiceStatus" TEXT,
    "clientPaymentDueDate" DATETIME,
    "clientPaymentReceivedDate" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientBilling_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SowRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "sowRequired" BOOLEAN NOT NULL DEFAULT false,
    "sowStatus" TEXT NOT NULL DEFAULT 'Yet to Draft',
    "dateOfCommencement" DATETIME,
    "dateOfCompletion" DATETIME,
    "remarks" TEXT,
    "sowRenewalCompletedSeq" INTEGER NOT NULL DEFAULT 0,
    "sowDatesUpdatedSeq" INTEGER NOT NULL DEFAULT 0,
    "noticeSent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SowRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SowTalent" (
    "sowId" TEXT NOT NULL,
    "talentId" INTEGER NOT NULL,

    PRIMARY KEY ("sowId", "talentId"),
    CONSTRAINT "SowTalent_sowId_fkey" FOREIGN KEY ("sowId") REFERENCES "SowRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SowTalent_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PoRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "month" DATETIME NOT NULL,
    "poRequired" BOOLEAN NOT NULL DEFAULT false,
    "poStatus" TEXT NOT NULL DEFAULT 'Yet to Draft',
    "poNo" TEXT,
    "dateOfCommencement" DATETIME,
    "dateOfCompletion" DATETIME,
    "remarks" TEXT,
    "poRenewalCompletedSeq" INTEGER NOT NULL DEFAULT 0,
    "poDatesUpdatedSeq" INTEGER NOT NULL DEFAULT 0,
    "noticeSent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PoRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PoTalent" (
    "poId" TEXT NOT NULL,
    "talentId" INTEGER NOT NULL,

    PRIMARY KEY ("poId", "talentId"),
    CONSTRAINT "PoTalent_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PoRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PoTalent_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RenewalEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
