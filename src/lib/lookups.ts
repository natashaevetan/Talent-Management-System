import { prisma } from "./prisma";

export async function upsertClientByName(name: string) {
  // A client created this way (auto-created from the name typed into the Talents import
  // modal) still needs a billing row -- the other two client-creation paths always create
  // one, and code that reads client billing assumes every client has one.
  return prisma.client.upsert({ where: { name }, update: {}, create: { name, billing: { create: {} } } });
}
export async function upsertProjectTypeByName(name: string) {
  return prisma.projectType.upsert({ where: { name }, update: {}, create: { name } });
}
export async function upsertLegalEntityByName(name: string) {
  return prisma.legalEntity.upsert({ where: { name }, update: {}, create: { name } });
}
export async function upsertRecruiterByName(name: string) {
  return prisma.recruiter.upsert({ where: { name }, update: {}, create: { name } });
}
