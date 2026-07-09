import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { serializeTalent, talentInclude } from "./serialize";
import { toJson } from "../../lib/json";
import { upsertClientByName, upsertProjectTypeByName, upsertLegalEntityByName, upsertRecruiterByName } from "../../lib/lookups";
import { nextRenewalSeq, isExpiryWithinRenewalWindow } from "../../lib/renewalRules";

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
    if (typeof b.name === "string" && b.name.trim()) {
      // Personal tab edits the full name as one field; split it back into first/last so they stay in sync.
      const parts = b.name.trim().split(/\s+/);
      data.name = b.name.trim();
      data.lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      data.firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0];
    } else if (data.firstName || data.lastName) {
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

async function writeRenewalEvent(
  entityType: string,
  entityId: string,
  userId: string | undefined,
  events: { eventType: string; fromValue?: string | null; toValue?: string | null }[]
) {
  if (events.length === 0) return;
  await prisma.renewalEvent.createMany({
    data: events.map((e) => ({ entityType, entityId, userId, eventType: e.eventType, fromValue: e.fromValue ?? null, toValue: e.toValue ?? null })),
  });
}

talentsRouter.patch(
  "/:id/contract",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const b = req.body as Record<string, unknown>;
    const current = await prisma.contract.findUniqueOrThrow({ where: { talentId: id } });

    const data: Record<string, unknown> = {};
    for (const key of ["contractStatus", "noticePeriod", "contractUpload", "signedContractUpload", "contractRenewalStatus", "contractLifecycleStatus", "remarks", "renewalRemarks", "sowStatus", "poStatus"]) {
      if (key in b) data[key] = b[key];
    }
    for (const key of ["contractStart", "contractEnd"]) {
      if (key in b) data[key] = new Date(b[key] as string);
    }
    if ("contractRenewalRequired" in b) data.contractRenewalRequired = b.contractRenewalRequired === "Yes" || b.contractRenewalRequired === true;
    if ("sowRequired" in b) data.sowRequired = b.sowRequired === "Yes" || b.sowRequired === true;
    if ("poRequired" in b) data.poRequired = b.poRequired === "Yes" || b.poRequired === true;
    if ("contractNoticeSent" in b) data.contractNoticeSent = Boolean(b.contractNoticeSent);

    const events: { eventType: string; fromValue?: string; toValue?: string }[] = [];

    const newEnd = (data.contractEnd as Date | undefined) ?? current.contractEnd;
    const newStart = (data.contractStart as Date | undefined) ?? current.contractStart;
    const datesChanged = newEnd.getTime() !== current.contractEnd.getTime() || newStart.getTime() !== current.contractStart.getTime();
    const newRenewalStatus = (data.contractRenewalStatus as string | undefined) ?? current.contractRenewalStatus;
    const completingNow = newRenewalStatus === "Completed" && current.contractRenewalStatus !== "Completed";

    if ("contractRenewalStatus" in data && data.contractRenewalStatus !== current.contractRenewalStatus) {
      events.push({ eventType: "STATUS_CHANGED", fromValue: current.contractRenewalStatus, toValue: newRenewalStatus });
      if (completingNow) events.push({ eventType: "STATUS_MARKED_COMPLETED", toValue: newRenewalStatus });
    }
    const currentSeq = { completedSeq: current.renewalCompletedSeq, datesUpdatedSeq: current.datesUpdatedSeq };
    if (datesChanged) {
      events.push({ eventType: "DATES_UPDATED", fromValue: current.contractEnd.toISOString(), toValue: newEnd.toISOString() });
      const seq = nextRenewalSeq(currentSeq, { completingNow, datesChanged });
      data.renewalCompletedSeq = seq.completedSeq;
      data.datesUpdatedSeq = seq.datesUpdatedSeq;
    } else if (completingNow) {
      const seq = nextRenewalSeq(currentSeq, { completingNow, datesChanged: false });
      data.renewalCompletedSeq = seq.completedSeq;
    }

    // Status auto-recovery: an Expired/Terminated contract whose end date moves to the future
    // is presumed renewed.
    const effectiveStatus = (data.contractStatus as string | undefined) ?? current.contractStatus;
    if ((effectiveStatus === "Expired" || effectiveStatus === "Terminated") && newEnd.getTime() > Date.now()) {
      data.contractStatus = "Signed";
    }
    // Auto-recompute "renewal required" from the new end date, unless the caller explicitly set it.
    if ("contractEnd" in data && !("contractRenewalRequired" in data)) {
      data.contractRenewalRequired = isExpiryWithinRenewalWindow(newEnd);
    }

    await prisma.contract.update({ where: { talentId: id }, data });
    await writeRenewalEvent("contract", String(id), req.session.userId, events);
    res.json(await reserialize(id));
  })
);

talentsRouter.patch(
  "/:id/workpass",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const b = req.body as Record<string, unknown>;
    const current = await prisma.workPass.findUniqueOrThrow({ where: { talentId: id } });

    const data: Record<string, unknown> = {};
    for (const key of ["workPassType", "passStatus", "medicalCheckupStatus", "medicalInsuranceStatus", "wicaCoverageStatus", "renewalStatus", "educationVerificationStatus", "passLifecycleStatus", "passRenewalRemarks"]) {
      if (key in b) data[key] = b[key];
    }
    for (const key of ["passIssueDate", "passExpiry", "ipaDate", "passportExpiry"]) {
      if (key in b) data[key] = b[key] ? new Date(b[key] as string) : null;
    }
    if ("renewalRequired" in b) data.renewalRequired = b.renewalRequired === "Yes" || b.renewalRequired === true;
    if ("workPassNoticeSent" in b) data.workPassNoticeSent = Boolean(b.workPassNoticeSent);

    const events: { eventType: string; fromValue?: string; toValue?: string }[] = [];

    const newExpiry = ("passExpiry" in data ? (data.passExpiry as Date | null) : current.passExpiry) ?? current.passExpiry;
    const currentExpiry = current.passExpiry;
    const datesChanged = !!newExpiry && (!currentExpiry || newExpiry.getTime() !== currentExpiry.getTime());
    const newRenewalStatus = (data.renewalStatus as string | undefined) ?? current.renewalStatus;
    const completingNow = newRenewalStatus === "Completed" && current.renewalStatus !== "Completed";

    if ("renewalStatus" in data && data.renewalStatus !== current.renewalStatus) {
      events.push({ eventType: "STATUS_CHANGED", fromValue: current.renewalStatus, toValue: newRenewalStatus });
      if (completingNow) events.push({ eventType: "STATUS_MARKED_COMPLETED", toValue: newRenewalStatus });
    }
    if (datesChanged) {
      events.push({ eventType: "DATES_UPDATED", fromValue: currentExpiry?.toISOString(), toValue: newExpiry?.toISOString() });
      const seq = nextRenewalSeq(
        { completedSeq: current.passRenewalCompletedSeq, datesUpdatedSeq: current.passDatesUpdatedSeq },
        { completingNow, datesChanged }
      );
      data.passRenewalCompletedSeq = seq.completedSeq;
      data.passDatesUpdatedSeq = seq.datesUpdatedSeq;
    } else if (completingNow) {
      const seq = nextRenewalSeq(
        { completedSeq: current.passRenewalCompletedSeq, datesUpdatedSeq: current.passDatesUpdatedSeq },
        { completingNow, datesChanged: false }
      );
      data.passRenewalCompletedSeq = seq.completedSeq;
    }

    const effectivePassStatus = (data.passStatus as string | undefined) ?? current.passStatus;
    if (effectivePassStatus === "Expired" && newExpiry && newExpiry.getTime() > Date.now()) {
      data.passStatus = "Issued";
    }
    if ("passExpiry" in data && newExpiry && !("renewalRequired" in data)) {
      data.renewalRequired = isExpiryWithinRenewalWindow(newExpiry);
    }

    await prisma.workPass.update({ where: { talentId: id }, data });
    await writeRenewalEvent("workpass", String(id), req.session.userId, events);
    res.json(await reserialize(id));
  })
);

talentsRouter.patch(
  "/:id/insurance",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const b = req.body as Record<string, unknown>;
    const current = await prisma.insurancePolicy.findUniqueOrThrow({ where: { talentId: id } });

    const data: Record<string, unknown> = {};
    for (const key of ["policyType", "policyRenewalStatus", "policyRemarks"]) {
      if (key in b) data[key] = b[key];
    }
    for (const key of ["policyIssueDate", "policyExpiry"]) {
      if (key in b) data[key] = b[key] ? new Date(b[key] as string) : null;
    }
    if ("policyRenewalRequired" in b) data.policyRenewalRequired = b.policyRenewalRequired === "Yes" || b.policyRenewalRequired === true;
    if ("insuranceNoticeSent" in b) data.insuranceNoticeSent = Boolean(b.insuranceNoticeSent);

    const events: { eventType: string; fromValue?: string; toValue?: string }[] = [];

    const newExpiry = ("policyExpiry" in data ? (data.policyExpiry as Date | null) : current.policyExpiry) ?? current.policyExpiry;
    const currentExpiry = current.policyExpiry;
    const datesChanged = !!newExpiry && (!currentExpiry || newExpiry.getTime() !== currentExpiry.getTime());
    const newRenewalStatus = (data.policyRenewalStatus as string | undefined) ?? current.policyRenewalStatus;
    const completingNow = newRenewalStatus === "Completed" && current.policyRenewalStatus !== "Completed";

    if ("policyRenewalStatus" in data && data.policyRenewalStatus !== current.policyRenewalStatus) {
      events.push({ eventType: "STATUS_CHANGED", fromValue: current.policyRenewalStatus, toValue: newRenewalStatus });
      if (completingNow) events.push({ eventType: "STATUS_MARKED_COMPLETED", toValue: newRenewalStatus });
    }
    if (datesChanged) {
      events.push({ eventType: "DATES_UPDATED", fromValue: currentExpiry?.toISOString(), toValue: newExpiry?.toISOString() });
      const seq = nextRenewalSeq(
        { completedSeq: current.policyRenewalCompletedSeq, datesUpdatedSeq: current.policyDatesUpdatedSeq },
        { completingNow, datesChanged }
      );
      data.policyRenewalCompletedSeq = seq.completedSeq;
      data.policyDatesUpdatedSeq = seq.datesUpdatedSeq;
    } else if (completingNow) {
      const seq = nextRenewalSeq(
        { completedSeq: current.policyRenewalCompletedSeq, datesUpdatedSeq: current.policyDatesUpdatedSeq },
        { completingNow, datesChanged: false }
      );
      data.policyRenewalCompletedSeq = seq.completedSeq;
    }

    if ("policyExpiry" in data && newExpiry && !("policyRenewalRequired" in data)) {
      data.policyRenewalRequired = isExpiryWithinRenewalWindow(newExpiry);
    }

    await prisma.insurancePolicy.update({ where: { talentId: id }, data });
    await writeRenewalEvent("insurance", String(id), req.session.userId, events);
    res.json(await reserialize(id));
  })
);

talentsRouter.post(
  "/:id/contract/notice",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const current = await prisma.contract.findUniqueOrThrow({ where: { talentId: id } });
    const data: Record<string, unknown> = { contractNoticeSent: true, contractRenewalRequired: true };
    if (current.contractRenewalStatus === "Not Started") data.contractRenewalStatus = "In Progress";
    await prisma.contract.update({ where: { talentId: id }, data });
    await writeRenewalEvent("contract", String(id), req.session.userId, [{ eventType: "NOTICE_SENT" }]);
    res.json(await reserialize(id));
  })
);

talentsRouter.post(
  "/:id/workpass/notice",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const current = await prisma.workPass.findUniqueOrThrow({ where: { talentId: id } });
    const data: Record<string, unknown> = { workPassNoticeSent: true, renewalRequired: true };
    if (current.renewalStatus === "Not Started") data.renewalStatus = "In Progress";
    await prisma.workPass.update({ where: { talentId: id }, data });
    await writeRenewalEvent("workpass", String(id), req.session.userId, [{ eventType: "NOTICE_SENT" }]);
    res.json(await reserialize(id));
  })
);

talentsRouter.post(
  "/:id/insurance/notice",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.insurancePolicy.update({ where: { talentId: id }, data: { insuranceNoticeSent: true } });
    await writeRenewalEvent("insurance", String(id), req.session.userId, [{ eventType: "NOTICE_SENT" }]);
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
