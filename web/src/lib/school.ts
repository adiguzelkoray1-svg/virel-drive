import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "./prisma";
import { SCHOOL_PLAN_LIMITS, DEFAULT_LICENSE_CLASSES, REGULATION_DEFAULTS } from "./constants";

/** Bilerek `server-only` korumasız — bu dosya hem `createSchoolAction`'dan hem
 *  `tests/school-creation.test.ts`'ten (düz `tsx`, Next.js bağlamı olmadan) çağrılır. */

export const slugify = (s: string) =>
  s.toLocaleLowerCase("tr").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "kurs";

/** Herkese açık, hatırlanması kolay bir geçici şifre — büyük harf ve rakam karışımı,
 *  karıştırıcı karakterler (0/O, 1/I/l) elenmiş. */
export const genTempPassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => chars[crypto.randomInt(chars.length)]).join("");
};

export type NewSchoolInput = {
  name: string; city?: string; district?: string; phone?: string; email?: string;
  plan: "TRIAL" | "STARTER" | "PRO" | "ENTERPRISE"; ownerName: string; ownerEmail: string;
};

/**
 * Yeni bir kurs (kiracı), ilk OWNER kullanıcısı ve kursun hemen kullanılabilir olması için
 * gereken başlangıç verisini (sertifika sınıfları + mevzuat ayarları) tek işlemde açar.
 *
 * Bu ikisi eksik kalırsa kurs kursiyer bile ekleyemez: kursiyer formundaki "Ehliyet sınıfı"
 * seçimi LicenseClassRule'a bağlıdır, boşsa hiç seçenek çıkmaz (gerçek bir production hatası —
 * bkz. tests/school-creation.test.ts). RegulationSetting yazılmasa da `getRegulation()` REGULATION_DEFAULTS'a
 * düşer, o yüzden onsuz da çalışır ama ayarlar ekranı "hiç kaydedilmemiş" gösterirdi.
 */
export async function createSchoolWithDefaults(input: NewSchoolInput) {
  let slug = slugify(input.name);
  if (await prisma.school.findUnique({ where: { slug } })) slug = `${slug}-${crypto.randomInt(1000, 9999)}`;

  const limits = SCHOOL_PLAN_LIMITS[input.plan];
  const tempPassword = genTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 11);

  const school = await prisma.$transaction(async (tx) => {
    const created = await tx.school.create({
      data: {
        name: input.name, slug, city: input.city || null, district: input.district || null,
        phone: input.phone || null, email: input.email || null,
        status: "TRIAL", plan: input.plan, userLimit: limits.userLimit, studentLimit: limits.studentLimit,
        trialEndsAt: new Date(Date.now() + 14 * 86_400_000),
      },
    });
    await tx.user.create({ data: { email: input.ownerEmail, name: input.ownerName, role: "OWNER", passwordHash, schoolId: created.id } });
    await tx.licenseClassRule.createMany({ data: DEFAULT_LICENSE_CLASSES.map((c) => ({ schoolId: created.id, ...c, examAttempts: 4, passScore: 70 })) });
    await tx.regulationSetting.createMany({ data: Object.entries(REGULATION_DEFAULTS).map(([key, value]) => ({ schoolId: created.id, key, value })) });
    return created;
  });

  return { school, tempPassword };
}
