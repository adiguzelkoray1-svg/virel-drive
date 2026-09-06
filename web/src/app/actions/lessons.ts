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

/** Form aksiyonu: mevcut dersi günceller. Dersin kendisi çakışma sayılmaz. */
export async function updateLessonAction(_prev: LessonFormState, formData: FormData): Promise<LessonFormState> {
  return run(formData, "update");
}

async function run(formData: FormData, intent: "check" | "create" | "update"): Promise<LessonFormState> {
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

  const lessonId = String(raw.lessonId ?? "") || undefined;
  const checks = await checkLessonAvailability({
    schoolId: user.schoolId, studentId: v.studentId, instructorId: v.instructorId, vehicleId: v.vehicleId, startsAt, endsAt,
    excludeLessonId: lessonId,
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
  if (intent === "check") return { checks, ready, info, values };

  const reg = await getRegulation(user.schoolId);
  if (!ready && regBool(reg, "blockConflictingLessons")) {
    return { checks, ready: false, info, values, error: checks.find((c) => !c.ok)?.detail ?? "Uygunluk kontrolü geçilemedi." };
  }

  const data = {
    studentId: v.studentId, instructorId: v.instructorId, vehicleId: v.vehicleId,
    startsAt, endsAt, kind: v.kind, note: v.note || null,
  };

  if (intent === "update") {
    if (!lessonId) return { checks, ready, info, values, error: "Ders bulunamadı." };
    const existing = await prisma.drivingLesson.findFirst({ where: { id: lessonId, schoolId: user.schoolId } });
    if (!existing) return { checks, ready, info, values, error: "Ders bulunamadı." };
    if (existing.status === "DONE" || existing.status === "CANCELLED") {
      return { checks, ready, info, values, error: "Tamamlanmış ya da iptal edilmiş ders düzenlenemez." };
    }
    await prisma.drivingLesson.update({ where: { id: lessonId }, data });
    await audit({
      schoolId: user.schoolId, actorId: user.id, action: "lesson.update", target: lessonId,
      meta: { from: { startsAt: existing.startsAt, instructorId: existing.instructorId, vehicleId: existing.vehicleId }, to: data },
    });
    revalidatePath("/app/takvim");
    revalidatePath(`/app/dersler/${lessonId}`);
    redirect(`/app/dersler/${lessonId}?guncellendi=1`);
  }

  const lesson = await prisma.drivingLesson.create({ data: { schoolId: user.schoolId, status: "PLANNED", ...data } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "lesson.create", target: lesson.id, meta: { startsAt, instructorId: v.instructorId, vehicleId: v.vehicleId } });
  revalidatePath("/app/takvim");
  revalidatePath("/app");
  redirect(`/app/takvim?olusturuldu=${lesson.id}`);
}

// ---------------- Ders durumu: iptal, gelmedi, tamamla ----------------

/**
 * Dersi iptal eder. Mevzuattaki iptal süresi içinde yapılan iptaller kayda "geç iptal"
 * olarak yazılır; kurs bu bilgiyi kursiyerin hakkını düşürmek için kullanabilir.
 */
export async function cancelLessonAction(formData: FormData) {
  const user = await requirePermission("lesson.write");
  const id = String(formData.get("lessonId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  const lesson = await prisma.drivingLesson.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!lesson) redirect("/app/takvim?hata=ders-yok");
  if (lesson.status === "DONE") redirect(`/app/dersler/${id}?hata=tamamlanan-iptal`);

  const reg = await getRegulation(user.schoolId);
  const limitHours = Number(reg.lessonCancelHours) || 24;
  const hoursLeft = (lesson.startsAt.getTime() - Date.now()) / 3_600_000;
  const late = hoursLeft < limitHours;

  await prisma.drivingLesson.update({
    where: { id },
    data: {
      status: "CANCELLED",
      note: [lesson.note, reason ? `İptal nedeni: ${reason}` : null, late ? `Geç iptal (${limitHours} saatten az kala)` : null].filter(Boolean).join(" · ") || null,
    },
  });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "lesson.cancel", target: id, meta: { reason, late, hoursLeft: Math.round(hoursLeft) } });
  revalidatePath("/app/takvim");
  revalidatePath("/app");
  redirect(`/app/dersler/${id}?iptal=1`);
}

/** Kursiyer derse gelmedi. */
export async function noShowLessonAction(formData: FormData) {
  const user = await requirePermission("lesson.write");
  const id = String(formData.get("lessonId") ?? "");
  const lesson = await prisma.drivingLesson.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!lesson) redirect("/app/takvim?hata=ders-yok");

  await prisma.drivingLesson.update({ where: { id }, data: { status: "NO_SHOW" } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "lesson.no_show", target: id });
  revalidatePath("/app/takvim");
  redirect(`/app/dersler/${id}?gelmedi=1`);
}

/** Planlanan dersi tekrar açar (iptal ya da gelmedi durumundan geri alır). */
export async function reopenLessonAction(formData: FormData) {
  const user = await requirePermission("lesson.write");
  const id = String(formData.get("lessonId") ?? "");
  const lesson = await prisma.drivingLesson.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!lesson) redirect("/app/takvim?hata=ders-yok");
  if (lesson.status === "DONE") redirect(`/app/dersler/${id}?hata=tamamlanan-geri-alinamaz`);

  await prisma.drivingLesson.update({ where: { id }, data: { status: "PLANNED" } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "lesson.reopen", target: id });
  revalidatePath("/app/takvim");
  redirect(`/app/dersler/${id}?acildi=1`);
}

export type ReviewState = { error?: string };

/**
 * Dersi tamamlar: eğitmen değerlendirmesi ve gelişim alanı puanları kaydedilir.
 * Puan girmek zorunlu değildir; girilen alanlar dersin üzerine yazılır.
 */
export async function completeLessonAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const user = await requirePermission("lesson.review");
  const id = String(formData.get("lessonId") ?? "");
  const reviewNote = String(formData.get("reviewNote") ?? "").trim();

  const lesson = await prisma.drivingLesson.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!lesson) return { error: "Ders bulunamadı." };
  if (lesson.status === "CANCELLED") return { error: "İptal edilmiş ders tamamlanamaz. Önce dersi yeniden açın." };
  if (lesson.startsAt > new Date()) return { error: "Başlamamış bir ders tamamlanamış sayılamaz." };

  const ratings: { skill: string; score: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("skill_")) continue;
    const score = Number(value);
    if (!Number.isInteger(score) || score < 1 || score > 5) continue;
    ratings.push({ skill: key.slice(6), score });
  }

  await prisma.$transaction([
    prisma.drivingLesson.update({ where: { id }, data: { status: "DONE", reviewNote: reviewNote || null } }),
    ...ratings.map((r) =>
      prisma.skillRating.upsert({
        where: { lessonId_skill: { lessonId: id, skill: r.skill } },
        create: { schoolId: user.schoolId, lessonId: id, skill: r.skill, score: r.score },
        update: { score: r.score },
      }),
    ),
  ]);
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "lesson.complete", target: id, meta: { ratings: ratings.length } });
  revalidatePath("/app/takvim");
  revalidatePath(`/app/kursiyerler/${lesson.studentId}`);
  redirect(`/app/dersler/${id}?tamamlandi=1`);
}
