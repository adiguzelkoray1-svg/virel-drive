"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import { addMonths, K_CERT_VALIDITY_MONTHS } from "@/lib/driving-certificate";

const Schema = z.object({
  studentId: z.string().min(1),
  startedAt: z.string().min(1),
});

/**
 * K Sınıfı Sürücü Aday Belgesi düzenler/yeniler. İlk kez de, yenilemede de aynı aksiyon —
 * her çağrı yeni bir dönem (yeni satır) açar, eskisi silinmez (bkz. şemadaki not). Tarih
 * dışında girilecek bir şey yok; kurs müdürü/personel yalnızca "akan trafikte eğitime
 * başlama tarihi"ni onaylıyor, bitiş tarihi mevzuata göre (+6 ay) otomatik hesaplanır.
 */
export async function issueDrivingCertificateAction(formData: FormData) {
  const user = await requirePermission("student.write");
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  const studentId = String(formData.get("studentId") ?? "");
  if (!parsed.success) redirect(`/app/kursiyerler/${studentId}?hata=k-belgesi`);
  const v = parsed.data;

  const student = await prisma.student.findFirst({ where: { id: v.studentId, schoolId: user.schoolId } });
  if (!student) redirect("/app/kursiyerler?hata=bulunamadi");

  const startedAt = new Date(`${v.startedAt}T00:00:00`);
  if (Number.isNaN(startedAt.getTime())) redirect(`/app/kursiyerler/${v.studentId}?hata=k-belgesi`);
  const expiresAt = addMonths(startedAt, K_CERT_VALIDITY_MONTHS);

  const created = await prisma.drivingCandidateCertificate.create({
    data: { schoolId: user.schoolId, studentId: v.studentId, startedAt, expiresAt },
  });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "k-certificate.issue", target: created.id, meta: { studentId: v.studentId, startedAt: startedAt.toISOString() } });

  revalidatePath(`/app/kursiyerler/${v.studentId}`);
  redirect(`/app/kursiyerler/${v.studentId}?kbelgesi=duzenlendi#k-belgesi`);
}
