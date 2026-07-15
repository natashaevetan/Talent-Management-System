import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { serializeClient, clientInclude } from "./serialize";
import { getPermissionSettings, canViewFinancials } from "../../lib/permissions";

export const clientsRouter = Router();
clientsRouter.use(requireAuth);

async function canViewFinancialsForRequest(req: import("express").Request): Promise<boolean> {
  const settings = await getPermissionSettings();
  return canViewFinancials(req.session.userRole, settings);
}

async function reserializeByName(name: string, req: import("express").Request) {
  const client = await prisma.client.findUniqueOrThrow({ where: { name }, include: clientInclude });
  return serializeClient(client, await canViewFinancialsForRequest(req));
}

clientsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const clients = await prisma.client.findMany({ include: clientInclude, orderBy: { name: "asc" } });
    const canViewFin = await canViewFinancialsForRequest(req);
    res.json(clients.map((c) => serializeClient(c, canViewFin)));
  })
);

interface CreateClientBody {
  name: string;
  industry?: string;
  status?: string;
  contactPerson?: string;
  accountManager?: string;
  contactEmail?: string;
  contactNumber?: string;
}

clientsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const b = req.body as CreateClientBody;
    if (!b.name?.trim()) return void res.status(400).json({ error: "name is required" });

    const existing = await prisma.client.findUnique({ where: { name: b.name.trim() } });
    if (existing) return void res.status(409).json({ error: `A client named "${b.name.trim()}" already exists.` });

    await prisma.client.create({
      data: {
        name: b.name.trim(),
        industry: b.industry ?? null,
        status: b.status === "Inactive" ? "INACTIVE" : "ACTIVE",
        contactPerson: b.contactPerson ?? null,
        accountManager: b.accountManager ?? null,
        contactEmail: b.contactEmail ?? null,
        contactNumber: b.contactNumber ?? null,
        billing: { create: {} },
      },
    });
    res.status(201).json(await reserializeByName(b.name.trim(), req));
  })
);

interface ImportClientRow {
  name?: string;
  industry?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactNumber?: string;
  accountManager?: string;
  status?: string;
}

clientsRouter.post(
  "/import",
  asyncHandler(async (req, res) => {
    const { rows } = req.body as { rows?: ImportClientRow[] };
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: "rows must be a non-empty array" });
      return;
    }

    let created = 0;
    let updated = 0;
    const skipped: { row: number; name: string; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const name = (r.name ?? "").toString().trim();
      if (!name) {
        skipped.push({ row: i + 1, name: "(no name)", reason: "insufficient data" });
        continue;
      }

      const data = {
        industry: r.industry ? String(r.industry).trim() : null,
        contactPerson: r.contactPerson ? String(r.contactPerson).trim() : null,
        contactEmail: r.contactEmail ? String(r.contactEmail).trim() : null,
        contactNumber: r.contactNumber ? String(r.contactNumber).trim() : null,
        accountManager: r.accountManager ? String(r.accountManager).trim() : null,
        status: (String(r.status ?? "").trim().toLowerCase() === "inactive" ? "INACTIVE" : "ACTIVE") as "ACTIVE" | "INACTIVE",
      };

      const existing = await prisma.client.findUnique({ where: { name } });
      if (existing) {
        await prisma.client.update({ where: { name }, data });
        updated++;
      } else {
        await prisma.client.create({ data: { name, ...data, billing: { create: {} } } });
        created++;
      }
    }

    res.json({ created, updated, skipped });
  })
);

clientsRouter.patch(
  "/:name",
  asyncHandler(async (req, res) => {
    const name = decodeURIComponent(req.params.name as string);
    const b = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of ["industry", "contactPerson", "accountManager", "contactEmail", "contactNumber"]) {
      if (key in b) data[key] = b[key];
    }
    if ("status" in b) data.status = b.status === "Inactive" ? "INACTIVE" : "ACTIVE";

    await prisma.client.update({ where: { name }, data });
    res.json(await reserializeByName(name, req));
  })
);

clientsRouter.patch(
  "/:name/billing",
  asyncHandler(async (req, res) => {
    const name = decodeURIComponent(req.params.name as string);
    const b = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of ["billingType", "currency", "sowStatus", "poStatus", "invoiceNumber", "invoiceStatus"]) {
      if (key in b) data[key] = b[key];
    }
    if ("chargeRate" in b) data.chargeRate = Number(b.chargeRate);
    if ("invoiceAmount" in b) data.invoiceAmount = Number(b.invoiceAmount);
    if ("sowRequired" in b) data.sowRequired = b.sowRequired === "Yes" || b.sowRequired === true;
    if ("poRequired" in b) data.poRequired = b.poRequired === "Yes" || b.poRequired === true;
    for (const key of ["billableStart", "billableEnd", "invoiceDate", "clientPaymentDueDate", "clientPaymentReceivedDate"]) {
      if (key in b) data[key] = b[key] ? new Date(b[key] as string) : null;
    }

    const client = await prisma.client.findUniqueOrThrow({ where: { name } });
    await prisma.clientBilling.update({ where: { clientId: client.id }, data });
    res.json(await reserializeByName(name, req));
  })
);
