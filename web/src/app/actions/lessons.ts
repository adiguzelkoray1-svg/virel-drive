"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import { checkLessonAvailability, isPlannable } from "@/lib/availability";
import type { LessonFormState } from "@/lib/lesson-form";
import { getRegulation, regBool } from "@/lib/regulation";

const Schema = z.object({
  studentId: z.string().min(1, "Kursiyer seçin."),
  instructorId: z.string().min(1, "Eğitmen seçin."),
  vehicleId: z.string().min(1, "Araç seçin."),
  date: z.string().min(1, "Tarih seçin."),
  start: z.string().min(1, "Başlangıç saati seçin."),
  end: z.string().min(1, "Bitiş saati seçin."),
  kind: z.string().default("CITY"),
  note: z.string().optional(),
});

const toDate = (date: string, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(`${date}T00:00:00`);
  d.setHours(h, m ?? 0, 0, 0);
  return d;
};

/** Yalnızca uygunluğu hesaplar; form göndermez, hiçbir şey yazmaz. */
export async function checkAvailabilityAction(formData: FormData): Promise<LessonFormState> {
  return run(formData, "check");
}

/** Form aksiyonu: kontrolleri geçerse dersi oluşturur ve takvime döner. */
export async function lessonFormAction(_prev: LessonFormState, formData: FormData): Promise<LessonFormState> {
  return run(formData, "create");
}

async function run(formData: FormData, intent: "check" | "create"): Promise<LessonFormState> {
  const user = await requirePermission("lesson.write");

  const raw = Object.fromEntries(formData);
  const values = {
    studentId: String(raw.studentId ?? ""), instructorId: String(raw.instructorId ?? ""), vehicleId: String(raw.vehicleId ?? ""),
    kind: String(raw.kind ?? "CITY"), date: String(raw.date ?? ""), start: String(raw.start ?? ""), end: String(raw.end ?? ""),
    note: String(raw.note ?? ""),
  };
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return { checks: [], ready: false, values, error: intent === "create" ? parsed.error.issues[0]?.message ?? "Alanları kontrol edin." : undefined };
  }
  const v = parsed.data;
  const startsAt = toDate(v.date, v.start);
  const endsAt = toDate(v.date, v.end);
  if (endsAt <= startsAt) return { checks: [], ready: false, values, error: "Bitiş saati başlangıçtan sonra olmalı." };

  const checks = await checkLessonAvailability({
    schoolId: user.schoolId, studentId: v.studentId, instructorId: v.instructorId, vehicleId: v.vehicleId, startsAt, endsAt,
  });

  // Bilgi satırı: bu ders sonunda zorunlu eğitimin ne kadarı tamamlanır?
  const [rule, done] = await Promise.all([
    prisma.licenseClassRule.findFirst({ where: { schoolId: user.schoolId, code: (await prisma.student.findFirst({ where: { id: v.studentId, schoolId: user.schoolId }, select: { licenseClass: true } }))?.licenseClass ?? "B" } }),
    prisma.drivingLesson.findMany({ where: { schoolId: user.schoolId, studentId: v.studentId, status: "DONE" }, select: { startsAt: true, endsAt: true } }),
  ]);
  const doneHours = done.reduce((s, l) => s + (l.endsAt.getTime() - l.startsAt.getTime()) / 3_600_000, 0);
  const newHours = (endsAt.getTime() - startsAt.getTime()) / 3_600_000;
  const required = rule?.drivingHours ?? 14;
  const info = `Bu ders sonunda ${required} saatlik zorunlu direksiyon eğitiminin ${(Math.round((doneHours + newHours) * 10) / 10).toString().replace(".", ",")} saati tamamlanır.`;

  const ready = isPlannable(checks);
  if (intent !== "create") return { checks, ready, info, values };

  const reg = await getRegulation(user.schoolId);
  if (!ready && regBool(reg, "blockConflictingLessons")) {
    return { checks, ready: false, info, values, error: checks.find((c) => !c.ok)?.detail ?? "Uygunluk kontrolü geçilemedi." };
  }

  const lesson = await prisma.drivingLesson.create({
    data: {
      schoolId: user.schoolId, studentId: v.studentId, instructorId: v.instructorId, vehicleId: v.vehicleId,
      startsAt, endsAt, kind: v.kind, status: "PLANNED", note: v.note || null,
    },
  });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "lesson.create", target: lesson.id, meta: { startsAt, instructorId: v.instructorId, vehicleId: v.vehicleId } });
  revalidatePath("/app/takvim");
  revalidatePath("/app");
  redirect(`/app/takvim?olusturuldu=${lesson.id}`);
}
