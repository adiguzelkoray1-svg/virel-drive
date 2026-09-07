"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requireInstructorUser, requireStudentUser } from "@/lib/auth";

export type MobileReviewState = { error?: string };

/**
 * Mobil ders değerlendirmesi — masaüstündeki completeLessonAction ile aynı iş kuralı
 * (bkz. app/actions/lessons.ts), ama tamamlanınca mobil portala döner. Mantığı ayrı
 * tutmamın nedeni bu: aynı transaction'ı paylaşıp yalnızca redirect hedefi farklı olsun
 * diye masaüstü akışına dokunmak istemedim.
 */
export async function completeLessonMobileAction(_prev: MobileReviewState, formData: FormData): Promise<MobileReviewState> {
  const { user, instructor } = await requireInstructorUser();
  const id = String(formData.get("lessonId") ?? "");
  const reviewNote = String(formData.get("reviewNote") ?? "").trim();

  const lesson = await prisma.drivingLesson.findFirst({ where: { id, schoolId: instructor.schoolId, instructorId: instructor.id } });
  if (!lesson) return { error: "Ders bulunamadı." };
  if (lesson.status === "CANCELLED") return { error: "İptal edilmiş ders tamamlanamaz." };
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
        create: { schoolId: instructor.schoolId, lessonId: id, skill: r.skill, score: r.score },
        update: { score: r.score },
      }),
    ),
  ]);
  await audit({ schoolId: instructor.schoolId, actorId: user.id, action: "lesson.complete", target: id, meta: { ratings: ratings.length, via: "mobile" } });
  revalidatePath("/egitmen");
  redirect(`/egitmen?tamamlandi=1`);
}

const MessageSchema = z.object({ body: z.string().trim().min(1, "Mesaj boş olamaz.").max(1000, "Mesaj çok uzun.") });

/** Kursiyerin kursa mesaj göndermesi — MessageLog'a gelen (IN) kayıt olarak düşer,
 *  masaüstündeki Mesajlar gelen kutusunda aynen görünür (bkz. lib/messages.ts). */
export async function sendStudentMessageAction(_prev: { error?: string }, formData: FormData) {
  const { student } = await requireStudentUser();
  const parsed = MessageSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Mesaj boş olamaz." };

  await prisma.messageLog.create({
    data: { schoolId: student.schoolId, studentId: student.id, channel: "PUSH", direction: "IN", status: "DELIVERED", body: parsed.data.body, sentAt: new Date() },
  });
  revalidatePath("/kursiyer/mesajlar");
  revalidatePath("/app/mesajlar");
  return {};
}
