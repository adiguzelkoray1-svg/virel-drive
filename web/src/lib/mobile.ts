import "server-only";
import { prisma } from "./prisma";
import { startOfDay, endOfDay } from "./dashboard";
import { startOfWeek, addDays } from "./calendar";
import { weeklyLoadOf } from "./instructor";

/**
 * Eğitmenin mobil "Bugün" ekranı. Yalnızca direksiyon eğitmeni tasarım kanvasındaki gibi
 * derse özel bir akış sunar (ders tamamlama + değerlendirme); teorik öğretmenin bugünkü
 * dersleri de listelenir ama yoklama alma masaüstündeki tam ekrana yönlendirilir —
 * ayrı bir mobil yoklama arayüzü bu sürümün kapsamı dışında (tasarımda da yok).
 */
export async function instructorToday(schoolId: string, instructorId: string, branch: string) {
  const from = startOfDay();
  const to = endOfDay();
  const weekStart = startOfWeek();
  const weekEnd = addDays(weekStart, 7);

  if (branch === "DRIVING") {
    const [lessons, weekMinutes, weeklyHours] = await Promise.all([
      prisma.drivingLesson.findMany({
        where: { schoolId, instructorId, startsAt: { gte: from, lte: to } },
        include: { student: true, vehicle: true },
        orderBy: { startsAt: "asc" },
      }),
      prisma.drivingLesson.findMany({
        where: { schoolId, instructorId, startsAt: { gte: weekStart, lt: weekEnd }, status: { in: ["PLANNED", "LIVE", "DONE"] } },
        select: { id: true },
      }).then((r) => r.length),
      weeklyLoadOf(schoolId, instructorId, "DRIVING"),
    ]);
    return { branch: "DRIVING" as const, lessons, weeklyHours, weeklyCount: weekMinutes };
  }

  const lessons = await prisma.theoryLesson.findMany({
    where: { schoolId, instructorId, startsAt: { gte: from, lte: to } },
    include: { _count: { select: { attendances: true } } },
    orderBy: { startsAt: "asc" },
  });
  const weeklyHours = await weeklyLoadOf(schoolId, instructorId, "THEORY");
  return { branch: "THEORY" as const, lessons, weeklyHours, weeklyCount: lessons.length };
}

/** Ders değerlendirme ekranı için tek ders + mevcut puanlar. Eğitmen yalnızca kendi
 *  dersini görebilir — instructorId eşleşmesi bunu garanti eder. */
export async function getLessonForReview(schoolId: string, instructorId: string, lessonId: string) {
  const lesson = await prisma.drivingLesson.findFirst({
    where: { id: lessonId, schoolId, instructorId },
    include: { student: true, vehicle: true, ratings: true },
  });
  if (!lesson) return null;
  const scores = Object.fromEntries(lesson.ratings.map((r) => [r.skill, r.score]));
  return { lesson, scores };
}

/** Eğitmenin bu haftaki ders listesi — mobil takvim sekmesi (masaüstündeki grid takvimin
 *  aksine, telefonda anlamlı olan tek biçim: kronolojik liste). */
export async function instructorWeek(schoolId: string, instructorId: string, branch: string) {
  const weekStart = startOfWeek();
  const weekEnd = addDays(weekStart, 7);

  if (branch === "DRIVING") {
    return prisma.drivingLesson.findMany({
      where: { schoolId, instructorId, startsAt: { gte: weekStart, lt: weekEnd } },
      include: { student: true, vehicle: true },
      orderBy: { startsAt: "asc" },
    });
  }
  return prisma.theoryLesson.findMany({
    where: { schoolId, instructorId, startsAt: { gte: weekStart, lt: weekEnd } },
    include: { _count: { select: { attendances: true } } },
    orderBy: { startsAt: "asc" },
  });
}

/** Eğitmenin kendi kursiyer listesi — direksiyon eğitmeninde ders yaptığı, teorik
 *  öğretmende yoklamasını aldığı kursiyerler. */
export async function instructorStudents(schoolId: string, instructorId: string, branch: string) {
  if (branch === "DRIVING") {
    const rows = await prisma.drivingLesson.findMany({
      where: { schoolId, instructorId }, distinct: ["studentId"], select: { student: true },
      orderBy: { startsAt: "desc" },
    });
    return rows.map((r) => r.student);
  }
  const rows = await prisma.attendance.findMany({
    where: { schoolId, theoryLesson: { instructorId } }, distinct: ["studentId"], select: { student: true },
  });
  return rows.map((r) => r.student);
}
