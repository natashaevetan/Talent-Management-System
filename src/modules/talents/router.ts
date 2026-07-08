import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { serializeTalent, talentInclude } from "./serialize";
import { toJson } from "../../lib/json";
import { upsertClientByName, upsertProjectTypeByName, upsertLegalEntityByName, upsertRecruiterByName } from "../../lib/lookups";

export const talentsRouter = Router();
talentsRouter.use(requireAuth);

talentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === "true";
    const talents = await prisma.talent.findMany({
      where: includeInactive ? {} : { active: true },
      include: talentInclude,
      orderBy: { id: "desc" },
    });
    res.json(talents.map(serializeTalent));
  })
);

talentsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const talent = await prisma.talent.findUnique({ where: { id }, include: talentInclude });
    if (!talent) return void res.status(404).json({ error: "Talent not found" });
    res.json(serializeTalent(talent));
  })
);

interface CreateTalentBody {
  firstName: string;
  lastName: string;
  client: string;
  projectType: string;
  entity: string;
  caseOwner: string;
  jobTitle?: string;
  workLocation?: string;
  salary?: number;
  chargeRate?: number;
  billingType?: string;
  contractStart?: string;
  contractEnd?: string;
  workPassType?: string;
  passExpiry?: string;
}

talentsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = req.body as CreateTalentBody;
    if (!body.firstName || !body.lastName || !body.client || !body.projectType || !body.entity || !body.caseOwner) {
      return void res.status(400).json({ error: "firstName, lastName, client, projectType, entity, and caseOwner are required" });
    }

    const [client, projectType, entity, caseOwner] = await Promise.all([
      upsertClientByName(body.client),
      upsertProjectTypeByName(body.projectType),
      upsertLegalEntityByName(body.entity),
      upsertRecruiterByName(body.caseOwner),
    ]);

    const today = new Date();
    const contractStart = body.contractStart ? new Date(body.contractStart) : today;
    const contractEnd = body.contractEnd ? new Date(body.contractEnd) : new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    const passExpiry = body.passExpiry ? new Date(body.passExpiry) : contractEnd;
    const salary = body.salary ?? 0;
    const chargeRate = body.chargeRate ?? 0;
    const billingType = body.billingType ?? "Monthly";

    const talent = await prisma.talent.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        name: `${body.firstName} ${body.lastName}`,
        nric: "",
        jobTitle: body.jobTitle ?? null,
        workLocation: body.workLocation ?? null,
        skillset: toJson([]),
        clientId: client.id,
        projectTypeId: projectType.id,
        entityId: entity.id,
        caseOwnerId: caseOwner.id,
        contract: {
          create: {
            contractStart,
            contractEnd,
            contractStatus: "Drafted",
            contractRenewalRequired: false,
            contractRenewalStatus: "Not Started",
          },
        },
        workPass: {
          create: {
            workPassType: body.workPassType ?? "EP",
            passExpiry,
            passStatus: "Not Started",
          },
        },
        insurance: { create: { policyType: "Not Required" } },
        payroll: { create: { salary, cpf: Math.round(salary * 0.17) } },
        leaveTimesheet: { create: {} },
        offboarding: { create: { lastWorkingDay: contractEnd } },
      },
      include: talentInclude,
    });

    await prisma.talentBilling.create({
      data: { talentId: talent.id, chargeRate, billingType, invoiceStatus: "Pending" },
    });

    const full = await prisma.talent.findUniqueOrThrow({ where: { id: talent.id }, include: talentInclude });
    res.status(201).json(serializeTalent(full));
  })
);

async function reserialize(id: number) {
  const talent = await prisma.talent.findUniqueOrThrow({ where: { id }, include: talentInclude });
  return serializeTalent(talent);
}

talentsRouter.patch(
  "/:id/personal",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const b = req.body as Record<string, unknown>;

    const data: Record<string, unknown> = {};
    for (const key of ["firstName", "lastName", "nric", "sex", "nationality", "maritalStatus", "address", "contactNumber", "email", "bankAccount", "jobTitle", "workLocation"]) {
      if (key in b) data[key] = b[key];
    }
    if ("dependants" in b) data.dependants = b.dependants === null ? null : Number(b.dependants);
    if ("dateOfBirth" in b) data.dateOfBirth = b.dateOfBirth ? new Date(b.dateOfBirth as string) : null;
    if ("skillset" in b) data.skillset = toJson(b.skillset);
    if (data.firstName || data.lastName) {
      const current = await prisma.talent.findUniqueOrThrow({ where: { id } });
      data.name = `${data.firstName ?? current.firstName} ${data.lastName ?? current.lastName}`;
    }
    if ("client" in b && typeof b.client === "string") data.clientId = (await upsertClientByName(b.client)).id;
    if ("projectType" in b && typeof b.projectType === "string") data.projectTypeId = (await upsertProjectTypeByName(b.projectType)).id;
    if ("entity" in b && typeof b.entity === "string") data.entityId = (await upsertLegalEntityByName(b.entity)).id;
    if ("caseOwner" in b && typeof b.caseOwner === "string") data.caseOwnerId = (await upsertRecruiterByName(b.caseOwner)).id;

    await prisma.talent.update({ where: { id }, data });
    res.json(await reserialize(id));
  })
);

talentsRouter.patch(
  "/:id/workpass",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const b = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of ["workPassType", "passStatus", "medicalCheckupStatus", "medicalInsuranceStatus", "wicaCoverageStatus", "renewalStatus", "educationVerificationStatus", "passLifecycleStatus", "passRenewalRemarks"]) {
      if (key in b) data[key] = b[key];
    }
    for (const key of ["passIssueDate", "passExpiry", "ipaDate", "passportExpiry"]) {
      if (key in b) data[key] = b[key] ? new Date(b[key] as string) : null;
    }
    if ("renewalRequired" in b) data.renewalRequired = b.renewalRequired === "Yes" || b.renewalRequired === true;
    if ("workPassNoticeSent" in b) data.workPassNoticeSent = Boolean(b.workPassNoticeSent);

    await prisma.workPass.update({ where: { talentId: id }, data });
    res.json(await reserialize(id));
  })
);

talentsRouter.patch(
  "/:id/insurance",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const b = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of ["policyType", "policyRenewalStatus", "policyRemarks"]) {
      if (key in b) data[key] = b[key];
    }
    for (const key of ["policyIssueDate", "policyExpiry"]) {
      if (key in b) data[key] = b[key] ? new Date(b[key] as string) : null;
    }
    if ("policyRenewalRequired" in b) data.policyRenewalRequired = b.policyRenewalRequired === "Yes" || b.policyRenewalRequired === true;
    if ("insuranceNoticeSent" in b) data.insuranceNoticeSent = Boolean(b.insuranceNoticeSent);

    await prisma.insurancePolicy.update({ where: { talentId: id }, data });
    res.json(await reserialize(id));
  })
);

talentsRouter.patch(
  "/:id/payroll",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const b = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of ["salary", "cpf", "skillsDevelopmentLevy", "wica", "medicalInsuranceCost", "allowances", "claimsReimbursements", "overtime", "noPayLeaveDeduction", "otherStatutoryCosts"]) {
      if (key in b) data[key] = Number(b[key]);
    }
    await prisma.payroll.update({ where: { talentId: id }, data });
    res.json(await reserialize(id));
  })
);

talentsRouter.patch(
  "/:id/billing",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const b = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of ["billingType", "talentInvoiceNumber", "invoiceStatus"]) {
      if (key in b) data[key] = b[key];
    }
    if ("chargeRate" in b) data.chargeRate = Number(b.chargeRate);
    if ("talentInvoiceAmount" in b) data.talentInvoiceAmount = Number(b.talentInvoiceAmount);
    for (const key of ["talentInvoiceDate", "talentInvoiceDueDate", "talentInvoicePaidDate"]) {
      if (key in b) data[key] = b[key] ? new Date(b[key] as string) : null;
    }
    await prisma.talentBilling.update({ where: { talentId: id }, data });
    res.json(await reserialize(id));
  })
);

talentsRouter.patch(
  "/:id/leave-timesheet",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const b = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of ["mcUpload", "leaveApprovalStatus", "timesheetRemarks"]) {
      if (key in b) data[key] = b[key];
    }
    for (const key of ["annualLeaveEntitlement", "annualLeaveTaken", "sickLeaveEntitlement", "sickLeaveTaken", "offInLieuEntitlement", "offInLieuTaken", "unpaidLeaveTaken", "workingDays", "overtimeHours", "absenceDays"]) {
      if (key in b) data[key] = Number(b[key]);
    }
    if ("timesheetSubmitted" in b) data.timesheetSubmitted = b.timesheetSubmitted === "Yes" || b.timesheetSubmitted === true;
    if ("clientApproved" in b) data.clientApproved = b.clientApproved === "Yes" || b.clientApproved === true;
    for (const key of ["submissionDate", "approvalDate", "timesheetMonth"]) {
      if (key in b) data[key] = b[key] ? new Date(b[key] as string) : null;
    }
    await prisma.leaveTimesheet.update({ where: { talentId: id }, data });
    res.json(await reserialize(id));
  })
);

talentsRouter.patch(
  "/:id/offboarding",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const b = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of ["resignationReason", "noticeServed", "clientNotified", "replacementRequired", "finalInvoiceIssued", "exitDocsCompleted", "offboardingRemarks"]) {
      if (key in b) data[key] = b[key];
    }
    for (const key of ["lastWorkingDay", "workPassCancellationDate"]) {
      if (key in b) data[key] = b[key] ? new Date(b[key] as string) : null;
    }
    if ("offboardingChecklist" in b) data.offboardingChecklist = toJson(b.offboardingChecklist);
    await prisma.offboarding.update({ where: { talentId: id }, data });
    res.json(await reserialize(id));
  })
);

talentsRouter.post(
  "/:id/move-to-offboarding",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const lastWorkingDay = new Date();
    lastWorkingDay.setDate(lastWorkingDay.getDate() + 14);
    await prisma.contract.update({ where: { talentId: id }, data: { contractEnd: lastWorkingDay, contractLifecycleStatus: "Notice Period" } });
    await prisma.offboarding.update({ where: { talentId: id }, data: { lastWorkingDay } });
    res.json(await reserialize(id));
  })
);

talentsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.talent.update({ where: { id }, data: { active: false } });
    res.status(204).end();
  })
);
