import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { serializeSow, sowInclude } from "./serialize";
import { nextRenewalSeq } from "../../lib/renewalRules";

export const sowRouter = Router();
sowRouter.use(requireAuth);

async function reserialize(id: string) {
  const r = await prisma.sowRecord.findUniqueOrThrow({ where: { id }, include: sowInclude });
  return serializeSow(r);
}

sowRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const records = await prisma.sowRecord.findMany({ include: sowInclude, orderBy: { updatedAt: "desc" } });
    res.json(records.map(serializeSow));
  })
);

sowRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const b = req.body as Record<string, unknown>;
    const current = await prisma.sowRecord.findUniqueOrThrow({ where: { id } });

    const data: Record<string, unknown> = {};
    if ("sowStatus" in b) data.sowStatus = b.sowStatus;
    if ("remarks" in b) data.remarks = b.remarks;
    if ("sowRequired" in b) data.sowRequired = b.sowRequired === "Yes" || b.sowRequired === true;
    for (const key of ["dateOfCommencement", "dateOfCompletion"]) {
      if (key in b) data[key] = b[key] ? new Date(b[key] as string) : null;
    }

    const newStart = ("dateOfCommencement" in data ? (data.dateOfCommencement as Date | null) : current.dateOfCommencement);
    const newEnd = ("dateOfCompletion" in data ? (data.dateOfCompletion as Date | null) : current.dateOfCompletion);
    const datesChanged =
      (newStart?.getTime() ?? null) !== (current.dateOfCommencement?.getTime() ?? null) ||
      (newEnd?.getTime() ?? null) !== (current.dateOfCompletion?.getTime() ?? null);
    const newStatus = (data.sowStatus as string | undefined) ?? current.sowStatus;
    const completingNow = newStatus === "Completed" && current.sowStatus !== "Completed";

    if (datesChanged || completingNow) {
      const seq = nextRenewalSeq(
        { completedSeq: current.sowRenewalCompletedSeq, datesUpdatedSeq: current.sowDatesUpdatedSeq },
        { completingNow, datesChanged }
      );
      data.sowRenewalCompletedSeq = seq.completedSeq;
      if (datesChanged) data.sowDatesUpdatedSeq = seq.datesUpdatedSeq;
    }

    await prisma.sowRecord.update({ where: { id }, data });
    res.json(await reserialize(id));
  })
);

sowRouter.post(
  "/:id/notice",
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    await prisma.sowRecord.update({ where: { id }, data: { noticeSent: true } });
    res.json(await reserialize(id));
  })
);

sowRouter.put(
  "/:id/talents",
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const { talentIds } = req.body as { talentIds?: number[] };
    if (!Array.isArray(talentIds)) return void res.status(400).json({ error: "talentIds must be an array" });

    await prisma.$transaction([
      prisma.sowTalent.deleteMany({ where: { sowId: id } }),
      prisma.sowTalent.createMany({ data: talentIds.map((talentId) => ({ sowId: id, talentId })) }),
    ]);
    res.json(await reserialize(id));
  })
);
