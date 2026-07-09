import { Prisma } from "@prisma/client";

const poWithRelations = Prisma.validator<Prisma.PoRecordDefaultArgs>()({
  include: { client: true, talentLinks: { select: { talentId: true } } },
});
export type PoWithRelations = Prisma.PoRecordGetPayload<typeof poWithRelations>;
export const poInclude = poWithRelations.include;

export function serializePo(r: PoWithRelations) {
  return {
    id: r.id,
    client: r.client.name,
    clientId: r.clientId,
    month: r.month,
    poRequired: r.poRequired ? "Yes" : "No",
    poStatus: r.poStatus,
    poNo: r.poNo,
    dateOfCommencement: r.dateOfCommencement,
    dateOfCompletion: r.dateOfCompletion,
    poReceivedDate: r.dateOfCompletion,
    remarks: r.remarks,
    talentIds: r.talentLinks.map((l) => l.talentId),
    poRenewalCompletedSeq: r.poRenewalCompletedSeq,
    poDatesUpdatedSeq: r.poDatesUpdatedSeq,
    noticeSent: r.noticeSent,
  };
}
