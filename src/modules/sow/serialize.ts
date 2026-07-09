import { Prisma } from "@prisma/client";

const sowWithRelations = Prisma.validator<Prisma.SowRecordDefaultArgs>()({
  include: { client: true, talentLinks: { select: { talentId: true } } },
});
export type SowWithRelations = Prisma.SowRecordGetPayload<typeof sowWithRelations>;
export const sowInclude = sowWithRelations.include;

export function serializeSow(r: SowWithRelations) {
  return {
    id: r.id,
    client: r.client.name,
    clientId: r.clientId,
    project: r.project,
    sowRequired: r.sowRequired ? "Yes" : "No",
    sowStatus: r.sowStatus,
    dateOfCommencement: r.dateOfCommencement,
    dateOfCompletion: r.dateOfCompletion,
    validTo: r.dateOfCompletion,
    remarks: r.remarks,
    talentIds: r.talentLinks.map((l) => l.talentId),
    sowRenewalCompletedSeq: r.sowRenewalCompletedSeq,
    sowDatesUpdatedSeq: r.sowDatesUpdatedSeq,
    noticeSent: r.noticeSent,
  };
}
