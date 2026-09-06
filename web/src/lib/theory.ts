import "server-only";
import { prisma } from "./prisma";
import { THEORY_CATEGORIES } from "./constants";
import { getRegulation, regInt } from "./regulation";

/** Teorik eğitime dahil aşamalar: dersleri bitmiş kursiyerin geçmiş yoklaması da sayılır. */
export const THEORY_STAGES = ["THEORY", "ETEST_WAITING", "DRIVING", "DRIVING_EXAM", "GRADUATED"];
/** Yoklama alınırken listelenecek kursiyerler: hâlâ teorik eğitimde olanlar. */
export const ACTIVE_THEORY_STAGES = ["THEORY"];

export type AttendanceCheck = { ok: boolean; label: string; detail: string };

/** Teorik derste çakışma: aynı öğretmen ya da aynı derslik, kesişen saat. */
export async function checkTheoryAvailability(input: {
  schoolId: string; instructorId?: string | null; room?: string | null;
  startsAt: Date; endsAt: Date; excludeLessonId?: string;
}): Promise<AttendanceCheck[]> {
  const { schoolId, startsAt, endsAt, excludeLessonId } = input;
  const overlap = { startsAt: { lt: endsAt }, endsAt: { gt: startsAt }, status: { in: ["PLANNED", "LIVE"] } };
  const not = excludeLessonId ? { id: { not: excludeLessonId } } : {};
  const checks: AttendanceCheck[] = [];

  if (input.instructorId) {
    const clash = await prisma.theoryLesson.findFirst({ where: { schoolId, instructorId: input.instructorId, ...overlap, ...not }, include: { instructor: true } });
    checks.push(clash
      ? { ok: false, label: "Öğretmen meşgul", detail: `${clash.instructor?.name ?? "Öğretmen"} bu saatte "${clash.topic}" dersinde.` }
      : { ok: true, label: "Öğretmen müsait", detail: "Bu aralıkta başka dersi yok." });
  }
  if (input.room) {
    const clash = await prisma.theoryLesson.findFirst({ where: { schoolId, room: input.room, ...overlap, ...not } });
    checks.push(clash
      ? { ok: false, label: "Derslik dolu", detail: `${input.room} bu saatte "${clash.topic}" dersi için kullanılıyor.` }
      : { ok: true, label: "Derslik müsait", detail: `${input.room} bu aralıkta boş.` });
  }
  return checks;
}

/** Dönem özeti: kategori ilerlemesi, ortalama devam, devam riski taşıyan kursiyerler. */
export async function theorySummary(schoolId: string, term?: string) {
  const where = { schoolId, ...(term ? { term } : {}) };
  const [lessons, rows, reg, rules] = await Promise.all([
    prisma.theoryLesson.findMany({ where, select: { id: true, category: true, status: true, startsAt: true, endsAt: true } }),
    prisma.attendance.findMany({
      where: { schoolId, theoryLesson: where },
      select: { studentId: true, present: true },
    }),
    getRegulation(schoolId),
    prisma.licenseClassRule.findMany({ where: { schoolId } }),
  ]);

  const now = new Date();
  const categories = THEORY_CATEGORIES.map((c) => {
    const all = lessons.filter((l) => l.category === c.key);
    const done = all.filter((l) => l.status === "DONE" || l.endsAt < now).length;
    return { key: c.key, label: c.label, total: all.length, done, percent: all.length ? Math.round((done / all.length) * 100) : 0 };
  });

  const byStudent = new Map<string, { total: number; present: number }>();
  for (const r of rows) {
    const c = byStudent.get(r.studentId) ?? { total: 0, present: 0 };
    c.total++; if (r.present) c.present++;
    byStudent.set(r.studentId, c);
  }
  const minPercent = regInt(reg, "theoryAttendanceMinPercent", 85);
  const rates = [...byStudent.entries()].map(([studentId, c]) => ({ studentId, total: c.total, present: c.present, percent: Math.round((c.present / c.total) * 100) }));
  const average = rates.length ? Math.round(rates.reduce((s, r) => s + r.percent, 0) / rates.length) : 0;

  const doneCount = lessons.filter((l) => l.status === "DONE").length;
  return {
    lessonCount: lessons.length,
    doneCount,
    percent: lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0,
    categories,
    average,
    minPercent,
    rates,
    requiredLessons: rules.find((r) => r.code === "B")?.theoryLessons ?? 12,
  };
}

/** Devam oranı sınırın altına inen aktif kursiyerler. */
export async function attendanceRisks(schoolId: string) {
  const [rows, reg] = await Promise.all([
    prisma.attendance.findMany({
      where: { schoolId, student: { status: "ACTIVE" } },
      select: { studentId: true, present: true, student: { select: { id: true, firstName: true, lastName: true, stage: true, licenseClass: true } } },
    }),
    getRegulation(schoolId),
  ]);
  const min = regInt(reg, "theoryAttendanceMinPercent", 85);

  const map = new Map<string, { student: (typeof rows)[number]["student"]; total: number; present: number }>();
  for (const r of rows) {
    const c = map.get(r.studentId) ?? { student: r.student, total: 0, present: 0 };
    c.total++; if (r.present) c.present++;
    map.set(r.studentId, c);
  }
  return [...map.values()]
    .filter((c) => c.total >= 4)
    .map((c) => ({ ...c, percent: Math.round((c.present / c.total) * 100), missed: c.total - c.present }))
    .filter((c) => c.percent < min)
    .sort((a, b) => a.percent - b.percent);
}

/** Yoklama listesi: derse kayıtlı olanlar + hâlâ teorik eğitimdeki aktif kursiyerler. */
export async function rosterFor(schoolId: string, lessonId: string) {
  const [existing, active] = await Promise.all([
    prisma.attendance.findMany({
      where: { schoolId, theoryLessonId: lessonId },
      include: { student: { select: { id: true, firstName: true, lastName: true, licenseClass: true, stage: true } } },
    }),
    prisma.student.findMany({
      where: { schoolId, status: "ACTIVE", stage: { in: ACTIVE_THEORY_STAGES } },
      select: { id: true, firstName: true, lastName: true, licenseClass: true, stage: true },
      orderBy: [{ firstName: "asc" }],
    }),
  ]);

  const marked = new Map(existing.map((a) => [a.studentId, a]));
  const students = [...active];
  for (const a of existing) if (!students.some((s) => s.id === a.studentId)) students.push(a.student);
  students.sort((a, b) => a.firstName.localeCompare(b.firstName, "tr"));

  return students.map((s) => ({
    student: s,
    present: marked.get(s.id)?.present ?? null,
    recorded: marked.has(s.id),
  }));
}
