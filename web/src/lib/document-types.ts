import "server-only";
import { prisma } from "./prisma";

/** Yeni bir tür eklerken etiketten anahtar türetir (LicenseClassRule'daki `code` gibi kullanıcıdan
 *  ayrıca bir teknik anahtar istemeye gerek yok). Türkçe karakterler katlanır, boşluk `_` olur. */
export const keyFromLabel = (label: string) =>
  label.toLocaleUpperCase("tr").replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U").replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C")
    .replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "BELGE";

export async function listDocumentTypeRules(schoolId: string, opts: { activeOnly?: boolean } = {}) {
  return prisma.documentTypeRule.findMany({
    where: { schoolId, ...(opts.activeOnly ? { isActive: true } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getDocumentTypeRule(schoolId: string, id: string) {
  return prisma.documentTypeRule.findFirst({ where: { id, schoolId } });
}
