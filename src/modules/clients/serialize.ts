import { Prisma } from "@prisma/client";

const clientWithRelations = Prisma.validator<Prisma.ClientDefaultArgs>()({
  include: { billing: true },
});
export type ClientWithRelations = Prisma.ClientGetPayload<typeof clientWithRelations>;
export const clientInclude = clientWithRelations.include;

export function serializeClient(c: ClientWithRelations) {
  return {
    id: c.id,
    name: c.name,
    industry: c.industry,
    contactPerson: c.contactPerson,
    contactEmail: c.contactEmail,
    contactNumber: c.contactNumber,
    accountManager: c.accountManager,
    status: c.status === "ACTIVE" ? "Active" : "Inactive",
    billing: c.billing
      ? {
          billingType: c.billing.billingType,
          chargeRate: c.billing.chargeRate,
          currency: c.billing.currency,
          billableStart: c.billing.billableStart,
          billableEnd: c.billing.billableEnd,
          sowRequired: c.billing.sowRequired ? "Yes" : "No",
          sowStatus: c.billing.sowStatus,
          poRequired: c.billing.poRequired ? "Yes" : "No",
          poStatus: c.billing.poStatus,
          invoiceNumber: c.billing.invoiceNumber,
          invoiceDate: c.billing.invoiceDate,
          invoiceAmount: c.billing.invoiceAmount,
          invoiceStatus: c.billing.invoiceStatus,
          clientPaymentDueDate: c.billing.clientPaymentDueDate,
          clientPaymentReceivedDate: c.billing.clientPaymentReceivedDate,
        }
      : null,
  };
}
