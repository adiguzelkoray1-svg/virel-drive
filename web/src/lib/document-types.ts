import "server-only";
import { prisma } from "./prisma";

export { keyFromLabel } from "./text";

export async function listDocumentTypeRules(schoolId: string, opts: { activeOnly?: boolean } = {}) {
  return prisma.documentTypeRule.findMany({
    where: { schoolId, ...(opts.activeOnly ? { isActive: true } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getDocumentTypeRule(schoolId: string, id: string) {
  return prisma.documentTypeRule.findFirst({ where: { id, schoolId } });
}
