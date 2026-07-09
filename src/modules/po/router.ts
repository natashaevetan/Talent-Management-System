import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { serializePo, poInclude } from "./serialize";
import { nextRenewalSeq } from "../../lib/renewalRules";

export const poRouter = Router();
poRouter.use(requireAuth);

async function reserialize(id: string) {
  const r = await prisma.poRecord.findUniqueOrThrow({ where: { id }, include: poInclude });
  return serializePo(r);
}

poRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const records = await prisma.poRecord.findMany({ include: poInclude, orderBy: { month: "desc" } });
    res.json(records.map(serializePo));
  })
);

poRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const b = req.body as Record<string, unknown>;
    const current = await prisma.poRecord.findUniqueOrThrow({ where: { id } });

    const data: Record<string, unknown> = {};
    if ("poStatus" in b) data.poStatus = b.poStatus;
    if ("remarks" in b) data.remarks = b.remarks;
    if ("poNo" in b) data.poNo = b.poNo;
    if ("poRequired" in b) data.poRequired = b.poRequired === "Yes" || b.poRequired === true;
    for (const key of ["dateOfCommencement", "dateOfCompletion"]) {
      if (key in b) data[key] = b[key] ? new Date(b[key] as string) : null;
    }

    const newStart = ("dateOfCommencement" in data ? (data.dateOfCommencement as Date | null) : current.dateOfCommencement);
    const newEnd = ("dateOfCompletion" in data ? (data.dateOfCompletion as Date | null) : current.dateOfCompletion);
    const datesChanged =
      (newStart?.getTime() ?? null) !== (current.dateOfCommencement?.getTime() ?? null) ||
      (newEnd?.getTime() ?? null) !== (current.dateOfCompletion?.getTime() ?? null);
    const newStatus = (data.poStatus as string | undefined) ?? current.poStatus;
    const completingNow = newStatus === "Completed" && current.poStatus !== "Completed";

    if (datesChanged || completingNow) {
      const seq = nextRenewalSeq(
        { completedSeq: current.poRenewalCompletedSeq, datesUpdatedSeq: current.poDatesUpdatedSeq },
        { completingNow, datesChanged }
      );
      data.poRenewalCompletedSeq = seq.completedSeq;
      if (datesChanged) data.poDatesUpdatedSeq = seq.datesUpdatedSeq;
    }

    await prisma.poRecord.update({ where: { id }, data });
    res.json(await reserialize(id));
  })
);

poRouter.post(
  "/:id/notice",
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    await prisma.poRecord.update({ where: { id }, data: { noticeSent: true } });
    res.json(await reserialize(id));
  })
);

poRouter.put(
  "/:id/talents",
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const { talentIds } = req.body as { talentIds?: number[] };
    if (!Array.isArray(talentIds)) return void res.status(400).json({ error: "talentIds must be an array" });

    await prisma.$transaction([
      prisma.poTalent.deleteMany({ where: { poId: id } }),
      prisma.poTalent.createMany({ data: talentIds.map((talentId) => ({ poId: id, talentId })) }),
    ]);
    res.json(await reserialize(id));
  })
);
