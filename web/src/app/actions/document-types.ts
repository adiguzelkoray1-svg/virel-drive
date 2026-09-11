"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import { keyFromLabel } from "@/lib/document-types";
import type { DocumentTypeFormState } from "@/lib/document-type-form";

const Schema = z.object({
  label: z.string().trim().min(2, "Belge adı girin.").max(80, "Belge adı en fazla 80 karakter olabilir."),
  validityMonths: z.string().trim().optional(),
});

/**
 * Belge türü ekleme/düzenleme. Anahtar (key) LicenseClassRule'daki `code` gibi sonradan
 * değişmez — ama orada kullanıcı kendi kodunu yazarken burada etiketten otomatik türetilir
 * (kullanıcıya teknik bir anahtar sormaya gerek yok). Aynı okulda anahtar çakışırsa sayı eklenir.
 */
export async function documentTypeFormAction(_prev: DocumentTypeFormState, formData: FormData): Promise<DocumentTypeFormState> {
  const user = await requirePermission("settings.write");
  const raw = Object.fromEntries(formData);
  const values = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v ?? "")]));

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return { values, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;
  const validityMonths = v.validityMonths ? Number(v.validityMonths) : null;
  if (validityMonths !== null && (!Number.isFinite(validityMonths) || validityMonths <= 0)) {
    return { values, error: "Geçerlilik süresi pozitif bir ay sayısı olmalı." };
  }

  const ruleId = String(raw.ruleId ?? "") || undefined;

  if (ruleId) {
    const existing = await prisma.documentTypeRule.findFirst({ where: { id: ruleId, schoolId: user.schoolId } });
    if (!existing) return { values, error: "Belge türü bulunamadı." };
    await prisma.documentTypeRule.update({ where: { id: ruleId }, data: { label: v.label, validityMonths } });
    await audit({ schoolId: user.schoolId, actorId: user.id, action: "document-type.update", target: ruleId, meta: { label: v.label } });
    revalidatePath("/app/ayarlar/belgeler");
    revalidatePath("/app/belgeler");
    redirect("/app/ayarlar/belgeler?belge=guncellendi");
  }

  let key = keyFromLabel(v.label);
  if (await prisma.documentTypeRule.findUnique({ where: { schoolId_key: { schoolId: user.schoolId, key } } })) {
    key = `${key}_${Math.floor(Math.random() * 900 + 100)}`;
  }
  const count = await prisma.documentTypeRule.count({ where: { schoolId: user.schoolId } });
  const created = await prisma.documentTypeRule.create({
    data: { schoolId: user.schoolId, key, label: v.label, validityMonths, sortOrder: count },
  });

  // Yeni tür, o an kursta olan aktif/mezun kursiyerlere de MISSING olarak açılır — aksi halde
  // openDocumentSlots'ın çözdüğü "0/0 belgeyle yanlışlıkla tamam görünme" hatasının tersi
  // yaşanır: var olan kursiyerlerin tamamı bu yeni türü hiç almadığı için aniden eksik görünür.
  const activeStudents = await prisma.student.findMany({ where: { schoolId: user.schoolId, status: { in: ["ACTIVE", "GRADUATED"] } }, select: { id: true } });
  if (activeStudents.length > 0) {
    await prisma.document.createMany({
      data: activeStudents.map((s) => ({ schoolId: user.schoolId, studentId: s.id, type: key, status: "MISSING" })),
    });
  }

  await audit({ schoolId: user.schoolId, actorId: user.id, action: "document-type.create", target: created.id, meta: { label: v.label, backfilled: activeStudents.length } });
  revalidatePath("/app/ayarlar/belgeler");
  revalidatePath("/app/belgeler");
  redirect("/app/ayarlar/belgeler?belge=eklendi");
}

/**
 * Belge türünü etkin/pasif yapar. Sınıf kuralında olduğu gibi hiçbir zaman silinmez: mevcut
 * kursiyerlerin bu türdeki `Document` satırı serbest metin `type` referansı taşır, kural
 * silinse bile o kayıtların anlamlı kalması gerekir. Pasif tür yeni kursiyer kaydında
 * otomatik açılmaz (`openDocumentSlots`), ama var olan kayıtlarda görünmeye devam eder.
 */
export async function toggleDocumentTypeActiveAction(formData: FormData) {
  const user = await requirePermission("settings.write");
  const id = String(formData.get("ruleId") ?? "");
  const rule = await prisma.documentTypeRule.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!rule) redirect("/app/ayarlar/belgeler?hata=bulunamadi");

  await prisma.documentTypeRule.update({ where: { id }, data: { isActive: !rule.isActive } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: rule.isActive ? "document-type.deactivate" : "document-type.activate", target: id, meta: { label: rule.label } });
  revalidatePath("/app/ayarlar/belgeler");
  revalidatePath("/app/belgeler");
  redirect(`/app/ayarlar/belgeler?belge=${rule.isActive ? "pasif" : "aktif"}`);
}
