"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import { checkTheoryAvailability } from "@/lib/theory";
import type { TheoryFormState } from "@/lib/theory-form";

/** Çakışma kontrolü için konu ve kategori gerekmez: yalnızca zaman, öğretmen ve derslik. */
const ScheduleSchema = z.object({
  instructorId: z.string().optional(),
  room: z.string().optional(),
  date: z.string().min(1, "Tarih seçin."),
  start: z.string().min(1, "Başlangıç saati seçin."),
  end: z.string().min(1, "Bitiş saati seçin."),
});

const Schema = z.object({
  category: z.string().min(1, "Kategori seçin."),
  topic: z.string().trim().min(2, "Konu yazın."),
  instructorId: z.string().optional(),
  room: z.string().optional(),
  term: z.string().optional(),
  date: z.string().min(1, "Tarih seçin."),
  start: z.string().min(1, "Başlangıç saati seçin."),
  end: z.string().min(1, "Bitiş saati seçin."),
});

const toDate = (date: string, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(`${date}T00:00:00`);
  d.setHours(h, m ?? 0, 0, 0);
  return d;
};

export async function checkTheoryAction(formData: FormData): Promise<TheoryFormState> {
  return runTheory(formData, "check");
}
export async function theoryFormAction(_prev: TheoryFormState, formData: FormData): Promise<TheoryFormState> {
  return runTheory(formData, "save");
}

async function runTheory(formData: FormData, intent: "check" | "save"): Promise<TheoryFormState> {
  const user = await requirePermission("theory.write");
  const raw = Object.fromEntries(formData);
  const values = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v ?? "")]));

  // Kontrol turunda yalnızca zaman alanları doğrulanır; kaydetmede tüm form doğrulanır.
  const schedule = ScheduleSchema.safeParse(raw);
  if (!schedule.success) {
    return { checks: [], ready: false, values, error: intent === "save" ? schedule.error.issues[0]?.message ?? "Alanları kontrol edin." : undefined };
  }
  const sch = schedule.data;
  const startsAt = toDate(sch.date, sch.start);
  const endsAt = toDate(sch.date, sch.end);
  if (endsAt <= startsAt) return { checks: [], ready: false, values, error: "Bitiş saati başlangıçtan sonra olmalı." };

  const lessonId = String(raw.lessonId ?? "") || undefined;
  const checks = await checkTheoryAvailability({
    schoolId: user.schoolId, instructorId: sch.instructorId || null, room: sch.room || null, startsAt, endsAt, excludeLessonId: lessonId,
  });
  const ready = checks.every((c) => c.ok);
  if (intent === "check") return { checks, ready, values };

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return { checks, ready, values, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;
  if (!ready) return { checks, ready, values, error: checks.find((c) => !c.ok)?.detail ?? "Çakışma var." };

  const data = {
    category: v.category, topic: v.topic, room: v.room || null, term: v.term || null,
    instructorId: v.instructorId || null, startsAt, endsAt,
  };

  if (lessonId) {
    const existing = await prisma.theoryLesson.findFirst({ where: { id: lessonId, schoolId: user.schoolId } });
    if (!existing) return { checks, ready, values, error: "Ders bulunamadı." };
    await prisma.theoryLesson.update({ where: { id: lessonId }, data });
    await audit({ schoolId: user.schoolId, actorId: user.id, action: "theory.update", target: lessonId });
    revalidatePath("/app/teorik");
    redirect(`/app/teorik/${lessonId}?guncellendi=1`);
  }

  const lesson = await prisma.theoryLesson.create({ data: { schoolId: user.schoolId, status: "PLANNED", ...data } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "theory.create", target: lesson.id });
  revalidatePath("/app/teorik");
  redirect(`/app/teorik/${lesson.id}?olusturuldu=1`);
}

export type AttendanceState = { error?: string; saved?: number };

/**
 * Yoklama kaydeder. Listedeki her kursiyer için var/yok yazılır; işaretlenmeyen kursiyer
 * "yok" sayılır. Kayıt sonrası ders DONE olur — devam oranı bu satırlardan hesaplanır.
 */
export async function saveAttendanceAction(_prev: AttendanceState, formData: FormData): Promise<AttendanceState> {
  const user = await requirePermission("attendance.write");
  const lessonId = String(formData.get("lessonId") ?? "");
  const roster = String(formData.get("roster") ?? "").split(",").filter(Boolean);
  const complete = formData.get("complete") === "1";

  const lesson = await prisma.theoryLesson.findFirst({ where: { id: lessonId, schoolId: user.schoolId } });
  if (!lesson) return { error: "Ders bulunamadı." };
  if (lesson.status === "CANCELLED") return { error: "İptal edilmiş derse yoklama alınamaz." };
  if (roster.length === 0) return { error: "Yoklama listesi boş." };

  const present = new Set(formData.getAll("present").map(String));
  await prisma.$transaction([
    ...roster.map((studentId) =>
      prisma.attendance.upsert({
        where: { theoryLessonId_studentId: { theoryLessonId: lessonId, studentId } },
        create: { schoolId: user.schoolId, theoryLessonId: lessonId, studentId, present: present.has(studentId) },
        update: { present: present.has(studentId) },
      }),
    ),
    ...(complete ? [prisma.theoryLesson.update({ where: { id: lessonId }, data: { status: "DONE" } })] : []),
  ]);

  await audit({
    schoolId: user.schoolId, actorId: user.id, action: "theory.attendance", target: lessonId,
    meta: { total: roster.length, present: present.size, completed: complete },
  });
  revalidatePath("/app/teorik");
  revalidatePath("/app");
  redirect(`/app/teorik/${lessonId}?yoklama=${present.size}`);
}

export async function cancelTheoryAction(formData: FormData) {
  const user = await requirePermission("theory.write");
  const id = String(formData.get("lessonId") ?? "");
  const lesson = await prisma.theoryLesson.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!lesson) redirect("/app/teorik?hata=ders-yok");

  await prisma.theoryLesson.update({ where: { id }, data: { status: lesson.status === "CANCELLED" ? "PLANNED" : "CANCELLED" } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: lesson.status === "CANCELLED" ? "theory.reopen" : "theory.cancel", target: id });
  revalidatePath("/app/teorik");
  redirect(`/app/teorik/${id}?${lesson.status === "CANCELLED" ? "acildi=1" : "iptal=1"}`);
}
