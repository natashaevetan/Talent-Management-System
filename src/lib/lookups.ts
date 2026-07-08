import { prisma } from "./prisma";

export async function upsertClientByName(name: string) {
  return prisma.client.upsert({ where: { name }, update: {}, create: { name } });
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
