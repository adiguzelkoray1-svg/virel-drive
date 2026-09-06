import "server-only";
import { prisma } from "./prisma";
import { REGULATION_DEFAULTS } from "./constants";

export { REGULATION_DEFAULTS };

export type RegulationKey = keyof typeof REGULATION_DEFAULTS;

export async function getRegulation(schoolId: string): Promise<Record<RegulationKey, string>> {
  const rows = await prisma.regulationSetting.findMany({ where: { schoolId } });
  const map = { ...REGULATION_DEFAULTS } as Record<string, string>;
  for (const r of rows) map[r.key] = r.value;
  return map as Record<RegulationKey, string>;
}

export const regInt = (reg: Record<string, string>, key: RegulationKey, fallback: number) => {
  const n = Number(reg[key]);
  return Number.isFinite(n) ? n : fallback;
};
export const regBool = (reg: Record<string, string>, key: RegulationKey) => reg[key] === "1" || reg[key] === "true";

export async function setRegulation(schoolId: string, key: string, value: string) {
  await prisma.regulationSetting.upsert({
    where: { schoolId_key: { schoolId, key } },
    create: { schoolId, key, value },
    update: { value },
  });
}
