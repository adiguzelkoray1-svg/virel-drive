import "server-only";
import { prisma } from "./prisma";

export { keyFromLabel } from "./text";

export async function listMessageTemplateRules(schoolId: string, opts: { activeOnly?: boolean } = {}) {
  return prisma.messageTemplateRule.findMany({
    where: { schoolId, ...(opts.activeOnly ? { isActive: true } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getMessageTemplateRule(schoolId: string, id: string) {
  return prisma.messageTemplateRule.findFirst({ where: { id, schoolId } });
}
