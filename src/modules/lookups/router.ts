import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/errorHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { upsertClientByName, upsertProjectTypeByName, upsertLegalEntityByName, upsertRecruiterByName } from "../../lib/lookups";

export const lookupsRouter = Router();
lookupsRouter.use(requireAuth);

lookupsRouter.get(
  "/project-types",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.projectType.findMany({ orderBy: { name: "asc" } }));
  })
);
lookupsRouter.post(
  "/project-types",
  asyncHandler(async (req, res) => {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) return void res.status(400).json({ error: "name is required" });
    res.status(201).json(await upsertProjectTypeByName(name.trim()));
  })
);

lookupsRouter.get(
  "/entities",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.legalEntity.findMany({ orderBy: { name: "asc" } }));
  })
);
lookupsRouter.post(
  "/entities",
  asyncHandler(async (req, res) => {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) return void res.status(400).json({ error: "name is required" });
    res.status(201).json(await upsertLegalEntityByName(name.trim()));
  })
);

lookupsRouter.get(
  "/recruiters",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.recruiter.findMany({ where: { active: true }, orderBy: { name: "asc" } }));
  })
);
lookupsRouter.post(
  "/recruiters",
  asyncHandler(async (req, res) => {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) return void res.status(400).json({ error: "name is required" });
    res.status(201).json(await upsertRecruiterByName(name.trim()));
  })
);

lookupsRouter.get(
  "/client-names",
  asyncHandler(async (_req, res) => {
    const clients = await prisma.client.findMany({ orderBy: { name: "asc" }, select: { name: true } });
    res.json(clients.map((c) => c.name));
  })
);
lookupsRouter.post(
  "/client-names",
  asyncHandler(async (req, res) => {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) return void res.status(400).json({ error: "name is required" });
    res.status(201).json(await upsertClientByName(name.trim()));
  })
);
