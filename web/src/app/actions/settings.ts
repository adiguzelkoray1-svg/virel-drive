"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import { setRegulation } from "@/lib/regulation";
import { REGULATION_BOOL_FIELDS, REGULATION_NUMBER_FIELDS } from "@/lib/constants";
import type { RegulationFormState, ClassRuleFormState } from "@/lib/settings-form";

/**
 * Ders/devam ve sınav/süreç kurallarının tamamını tek seferde kaydeder. Sayısal alanlar
 * pozitif tam sayı olmalı; onay kutusu işaretli değilse formda hiç yer almaz (HTML checkbox
 * kuralı), bu yüzden değeri "0" değil "işaretli olanların listesi"nden çıkarılır.
 */
export async function updateRegulationAction(_prev: RegulationFormState, formData: FormData): Promise<RegulationFormState> {
  const user = await requirePermission("settings.write");

  for (const f of REGULATION_NUMBER_FIELDS) {
    const raw = formData.get(f.key);
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return { error: `${f.label} pozitif bir sayı olmalı.` };
  }

  await Promise.all([
    ...REGULATION_NUMBER_FIELDS.map((f) => setRegulation(user.schoolId, f.key, String(Math.round(Number(formData.get(f.key)))))),
    ...REGULATION_BOOL_FIELDS.map((f) => setRegulation(user.schoolId, f.key, formData.get(f.key) === "1" ? "1" : "0")),
  ]);

  await audit({ schoolId: user.schoolId, actorId: user.id, action: "regulation.update" });
  revalidatePath("/app/ayarlar");
  return { ok: true };
}

const RuleSchema = z.object({
  code: z.string().trim().min(1, "Sınıf kodu girin.").max(6, "Sınıf kodu en fazla 6 karakter olabilir.").transform((v) => v.toLocaleUpperCase("tr")),
  vehicleKind: z.string().trim().min(1, "Araç türü seçin."),
  drivingHours: z.coerce.number().int().min(0, "Direksiyon saati negatif olamaz."),
  theoryLessons: z.coerce.number().int().min(0, "Teorik ders sayısı negatif olamaz."),
  examAttempts: z.coerce.number().int().min(1, "En az 1 sınav hakkı olmalı.").max(10, "En fazla 10 sınav hakkı tanımlanabilir."),
  passScore: z.coerce.number().int().min(0).max(100, "Başarı barajı 0-100 arasında olmalı."),
});

/** Sertifika sınıfı ekleme/düzenleme. Kod kurs içinde benzersizdir (@@unique([schoolId, code])) —
 *  öğrenciler ve araçlar bu koda serbest metinle (FK olmadan) referans verdiği için silme yerine
 *  yalnızca etkin/pasif işaretlenebilir; mevcut kayıtlar geriye dönük bozulmasın diye. */
export async function licenseClassRuleFormAction(_prev: ClassRuleFormState, formData: FormData): Promise<ClassRuleFormState> {
  const user = await requirePermission("settings.write");
  const raw = Object.fromEntries(formData);
  const values = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v ?? "")]));

  const parsed = RuleSchema.safeParse(raw);
  if (!parsed.success) return { values, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const ruleId = String(raw.ruleId ?? "") || undefined;
  const clash = await prisma.licenseClassRule.findFirst({
    where: { schoolId: user.schoolId, code: v.code, ...(ruleId ? { id: { not: ruleId } } : {}) },
  });
  if (clash) return { values, error: `${v.code} sınıfı zaten tanımlı.` };

  if (ruleId) {
    const existing = await prisma.licenseClassRule.findFirst({ where: { id: ruleId, schoolId: user.schoolId } });
    if (!existing) return { values, error: "Sınıf bulunamadı." };
    await prisma.licenseClassRule.update({ where: { id: ruleId }, data: v });
    await audit({ schoolId: user.schoolId, actorId: user.id, action: "class-rule.update", target: ruleId, meta: { code: v.code } });
  } else {
    const created = await prisma.licenseClassRule.create({ data: { schoolId: user.schoolId, ...v } });
    await audit({ schoolId: user.schoolId, actorId: user.id, action: "class-rule.create", target: created.id, meta: { code: v.code } });
  }

  revalidatePath("/app/ayarlar");
  redirect(`/app/ayarlar?sinif=${ruleId ? "guncellendi" : "eklendi"}`);
}

/** Sınıfı etkin/pasif yapar. Pasif sınıf yeni kursiyer/araç kaydında seçilemez ama
 *  geçmiş kayıtları etkilemez — araclar/yeni ve kursiyer formları isActive:true süzer. */
export async function toggleLicenseClassActiveAction(formData: FormData) {
  const user = await requirePermission("settings.write");
  const id = String(formData.get("ruleId") ?? "");
  const rule = await prisma.licenseClassRule.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!rule) redirect("/app/ayarlar?hata=bulunamadi");

  await prisma.licenseClassRule.update({ where: { id }, data: { isActive: !rule.isActive } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: rule.isActive ? "class-rule.deactivate" : "class-rule.activate", target: id, meta: { code: rule.code } });
  revalidatePath("/app/ayarlar");
  redirect(`/app/ayarlar?sinif=${rule.isActive ? "pasif" : "aktif"}`);
}
