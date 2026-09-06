import "server-only";
import { prisma } from "./prisma";
import { startOfWeek, addDays } from "./calendar";

/** Bir eğitmenin bu haftaki ders saati (direksiyon dakikası + teorik dakikası) ve doluluk yüzdesi. */
export async function weeklyLoadOf(schoolId: string, instructorId: string, branch: string) {
  const weekStart = startOfWeek();
  const weekEnd = addDays(weekStart, 7);

  const minutes = branch === "DRIVING"
    ? (await prisma.drivingLesson.findMany({
        where: { schoolId, instructorId, startsAt: { gte: weekStart, lt: weekEnd }, status: { in: ["PLANNED", "LIVE", "DONE"] } },
        select: { startsAt: true, endsAt: true },
      })).reduce((s, l) => s + (l.endsAt.getTime() - l.startsAt.getTime()) / 60000, 0)
    : (await prisma.theoryLesson.findMany({
        where: { schoolId, instructorId, startsAt: { gte: weekStart, lt: weekEnd }, status: { in: ["PLANNED", "LIVE", "DONE"] } },
        select: { startsAt: true, endsAt: true },
      })).reduce((s, l) => s + (l.endsAt.getTime() - l.startsAt.getTime()) / 60000, 0);

  return Math.round((minutes / 60) * 10) / 10;
}

export type InstructorRow = {
  id: string; name: string; phone: string | null; branch: string; licenseClasses: string; subjects: string | null;
  weeklyCapacity: number; isActive: boolean; vehiclePlate: string | null;
  loadHours: number; loadPercent: number; studentCount: number; successRate: number | null;
};

/** Eğitmen listesi için toplu istatistik: haftalık yük, öğrenci sayısı, sınav başarı oranı. */
export async function listInstructors(schoolId: string, branch?: "DRIVING" | "THEORY"): Promise<InstructorRow[]> {
  const instructors = await prisma.instructor.findMany({
    where: { schoolId, ...(branch ? { branch } : {}) },
    include: { vehicles: { where: { status: { not: "PASSIVE" } }, take: 1, orderBy: { plate: "asc" } } },
    orderBy: { name: "asc" },
  });

  const weekStart = startOfWeek();
  const weekEnd = addDays(weekStart, 7);

  const rows = await Promise.all(instructors.map(async (i) => {
    const loadHours = await weeklyLoadOf(schoolId, i.id, i.branch);
    const loadPercent = i.weeklyCapacity ? Math.min(999, Math.round((loadHours / i.weeklyCapacity) * 100)) : 0;

    if (i.branch === "DRIVING") {
      const [studentCount, done] = await Promise.all([
        prisma.drivingLesson.findMany({ where: { schoolId, instructorId: i.id }, distinct: ["studentId"], select: { studentId: true } }).then((r) => r.length),
        prisma.drivingLesson.count({ where: { schoolId, instructorId: i.id, status: "DONE" } }),
      ]);
      // Başarı oranı yaklaşıktır: bir kursiyer birden çok eğitmenle ders yapmış olabilir ve
      // sınavı hangi eğitmenin "kazandırdığı" veriden çıkarılamaz — bu yüzden kursiyerin
      // sınavı, ders yaptığı her eğitmenin oranına sayılır.
      const exams = await prisma.exam.findMany({
        where: { schoolId, type: "DRIVING", status: "DONE", student: { drivingLessons: { some: { instructorId: i.id } } } },
        select: { result: true },
      });
      const successRate = exams.length ? Math.round((exams.filter((e) => e.result === "PASSED").length / exams.length) * 100) : null;
      return { i, loadHours, loadPercent, studentCount, successRate, done };
    }

    const studentCount = await prisma.attendance.findMany({
      where: { schoolId, theoryLesson: { instructorId: i.id } }, distinct: ["studentId"], select: { studentId: true },
    }).then((r) => r.length);
    return { i, loadHours, loadPercent, studentCount, successRate: null, done: 0 };
  }));

  void weekEnd; // yalnızca weekStart/weekEnd aralığı weeklyLoadOf içinde kullanılıyor
  return rows.map(({ i, loadHours, loadPercent, studentCount, successRate }) => ({
    id: i.id, name: i.name, phone: i.phone, branch: i.branch, licenseClasses: i.licenseClasses, subjects: i.subjects,
    weeklyCapacity: i.weeklyCapacity, isActive: i.isActive, vehiclePlate: i.vehicles[0]?.plate ?? null,
    loadHours, loadPercent, studentCount, successRate,
  }));
}

export type InstructorSummary = {
  totalLoadHours: number; totalCapacity: number; loadPercent: number;
  busiest: { name: string; loadHours: number; capacity: number; percent: number } | null;
  avgSuccessRate: number | null;
  studentsPerDrivingInstructor: number | null;
  driving: number; theory: number; onLeave: number;
};

export async function instructorSummary(schoolId: string): Promise<InstructorSummary> {
  const [all, driving] = await Promise.all([listInstructors(schoolId), listInstructors(schoolId, "DRIVING")]);

  const active = all.filter((i) => i.isActive);
  const totalLoadHours = Math.round(active.reduce((s, i) => s + i.loadHours, 0) * 10) / 10;
  const totalCapacity = active.reduce((s, i) => s + i.weeklyCapacity, 0);
  const busiestRow = [...active].sort((a, b) => b.loadPercent - a.loadPercent)[0] ?? null;

  const drivingRates = driving.map((i) => i.successRate).filter((r): r is number => r !== null);
  const avgSuccessRate = drivingRates.length ? Math.round(drivingRates.reduce((s, r) => s + r, 0) / drivingRates.length) : null;

  const activeDriving = driving.filter((i) => i.isActive);
  const totalDrivingStudents = activeDriving.reduce((s, i) => s + i.studentCount, 0);

  return {
    totalLoadHours, totalCapacity, loadPercent: totalCapacity ? Math.round((totalLoadHours / totalCapacity) * 100) : 0,
    busiest: busiestRow ? { name: busiestRow.name, loadHours: busiestRow.loadHours, capacity: busiestRow.weeklyCapacity, percent: busiestRow.loadPercent } : null,
    avgSuccessRate,
    studentsPerDrivingInstructor: activeDriving.length ? Math.round((totalDrivingStudents / activeDriving.length) * 10) / 10 : null,
    driving: all.filter((i) => i.branch === "DRIVING").length,
    theory: all.filter((i) => i.branch === "THEORY").length,
    onLeave: all.filter((i) => !i.isActive).length,
  };
}

/** Eğitmen detay sayfası: profil, atanmış araçlar, yaklaşan ve geçmiş dersler, öğrenci listesi. */
export async function getInstructorDetail(schoolId: string, instructorId: string) {
  const instructor = await prisma.instructor.findFirst({
    where: { id: instructorId, schoolId },
    include: { vehicles: true, user: { select: { email: true, lastLoginAt: true } } },
  });
  if (!instructor) return null;

  const now = new Date();
  if (instructor.branch === "DRIVING") {
    const [upcoming, past, students] = await Promise.all([
      prisma.drivingLesson.findMany({
        where: { schoolId, instructorId, startsAt: { gte: now }, status: { in: ["PLANNED", "LIVE"] } },
        include: { student: true, vehicle: true }, orderBy: { startsAt: "asc" }, take: 8,
      }),
      prisma.drivingLesson.findMany({
        where: { schoolId, instructorId, status: "DONE" },
        include: { student: true, vehicle: true }, orderBy: { startsAt: "desc" }, take: 8,
      }),
      prisma.drivingLesson.findMany({ where: { schoolId, instructorId }, distinct: ["studentId"], select: { student: true } }),
    ]);
    const loadHours = await weeklyLoadOf(schoolId, instructorId, "DRIVING");
    return { instructor, upcoming, past, students: students.map((s) => s.student), loadHours, kind: "DRIVING" as const };
  }

  const [upcoming, past, roster] = await Promise.all([
    prisma.theoryLesson.findMany({
      where: { schoolId, instructorId, startsAt: { gte: now }, status: { in: ["PLANNED", "LIVE"] } },
      orderBy: { startsAt: "asc" }, take: 8, include: { _count: { select: { attendances: true } } },
    }),
    prisma.theoryLesson.findMany({
      where: { schoolId, instructorId, status: "DONE" },
      orderBy: { startsAt: "desc" }, take: 8, include: { _count: { select: { attendances: true } } },
    }),
    prisma.attendance.findMany({ where: { schoolId, theoryLesson: { instructorId } }, distinct: ["studentId"], select: { student: true } }),
  ]);
  const loadHours = await weeklyLoadOf(schoolId, instructorId, "THEORY");
  return { instructor, upcoming, past, students: roster.map((r) => r.student), loadHours, kind: "THEORY" as const };
}
