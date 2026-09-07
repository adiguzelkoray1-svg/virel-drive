"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import { DOCUMENT_TYPES } from "@/lib/constants";
import type { DocumentFormState } from "@/lib/document-form";

const TYPE_KEYS = DOCUMENT_TYPES.map((t) => t.key) as [string, ...string[]];
const STATUS_KEYS = ["MISSING", "PENDING", "REVIEW", "OK"] as const;

const Schema = z.object({
  studentId: z.string().min(1),
  type: z.enum(TYPE_KEYS),
  status: z.enum(STATUS_KEYS),
  validUntil: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

/**
 * Bir kursiyerin bir belgesinin durumunu günceller. Belge satırları her kursiyer için
 * kayıt anında yedi tür olarak açılır (bkz. seed); bu aksiyon yeni satır oluşturmaz,
 * yalnızca mevcut olanı günceller — @@unique([studentId, type]) bunu zaten garanti eder.
 * "Tamamlandı" işaretlenince doğrulama anı kaydedilir, başka duruma dönülünce silinir.
 */
export async function updateDocumentAction(_prev: DocumentFormState, formData: FormData): Promise<DocumentFormState> {
  const user = await requirePermission("document.write");
  const raw = Object.fromEntries(formData);
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const student = await prisma.student.findFirst({ where: { id: v.studentId, schoolId: user.schoolId } });
  if (!student) return { error: "Kursiyer bulunamadı." };

  await prisma.document.upsert({
    where: { studentId_type: { studentId: v.studentId, type: v.type } },
    create: {
      schoolId: user.schoolId, studentId: v.studentId, type: v.type, status: v.status,
      validUntil: v.validUntil ? new Date(`${v.validUntil}T12:00:00`) : null,
      verifiedAt: v.status === "OK" ? new Date() : null,
      note: v.note || null,
    },
    update: {
      status: v.status,
      validUntil: v.validUntil ? new Date(`${v.validUntil}T12:00:00`) : null,
      verifiedAt: v.status === "OK" ? new Date() : null,
      note: v.note || null,
    },
  });

  await audit({ schoolId: user.schoolId, actorId: user.id, action: "document.update", target: v.studentId, meta: { type: v.type, status: v.status } });
  revalidatePath("/app/belgeler");
  revalidatePath(`/app/belgeler/${v.studentId}`);
  revalidatePath(`/app/kursiyerler/${v.studentId}`);
  return {};
}
