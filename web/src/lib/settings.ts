import "server-only";
import { prisma } from "./prisma";

export async function listLicenseClassRules(schoolId: string) {
  return prisma.licenseClassRule.findMany({ where: { schoolId }, orderBy: [{ isActive: "desc" }, { code: "asc" }] });
}

export async function getLicenseClassRule(schoolId: string, id: string) {
  return prisma.licenseClassRule.findFirst({ where: { id, schoolId } });
}

/** Ayarlar ekranındaki "son güncelleme" rozeti — mevzuat değeri ya da sınıf kuralı,
 *  hangisi daha yeniyse onu gösterir. */
export async function lastSettingsUpdate(schoolId: string): Promise<Date | null> {
  const [reg, rule] = await Promise.all([
    prisma.regulationSetting.findFirst({ where: { schoolId }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    prisma.licenseClassRule.findFirst({ where: { schoolId }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
  ]);
  const dates = [reg?.updatedAt, rule?.updatedAt].filter((d): d is Date => !!d);
  return dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
}
