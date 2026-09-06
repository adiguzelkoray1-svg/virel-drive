import "server-only";
import { prisma } from "./prisma";
import { getRegulation, regInt } from "./regulation";

export type AvailabilityCheck = { ok: boolean; kind: "instructor" | "vehicle" | "student" | "limit"; label: string; detail: string };

/**
 * Direksiyon dersi oluşturulmadan önce eğitmen, araç ve kursiyer uygunluğunu birlikte kontrol eder.
 * Brief'in kuralı: çakışma varsa ders oluşturulmaz ve nedeni açıkça yazılır.
 */
export async function checkLessonAvailability(input: {
  schoolId: string;
  studentId: string;
  instructorId: string;
  vehicleId: string;
  startsAt: Date;
  endsAt: Date;
  excludeLessonId?: string;
}): Promise<AvailabilityCheck[]> {
  const { schoolId, startsAt, endsAt, excludeLessonId } = input;
  const overlap = { startsAt: { lt: endsAt }, endsAt: { gt: startsAt } };
  const not = excludeLessonId ? { id: { not: excludeLessonId } } : {};
  const active = { status: { in: ["PLANNED", "LIVE"] } };

  const [instructorClash, vehicleClash, studentClash, theoryClash, instructor, vehicle, student] = await Promise.all([
    prisma.drivingLesson.findFirst({ where: { schoolId, instructorId: input.instructorId, ...overlap, ...active, ...not }, include: { student: true } }),
    prisma.drivingLesson.findFirst({ where: { schoolId, vehicleId: input.vehicleId, ...overlap, ...active, ...not }, include: { student: true } }),
    prisma.drivingLesson.findFirst({ where: { schoolId, studentId: input.studentId, ...overlap, ...active, ...not }, include: { instructor: true } }),
    prisma.attendance.findFirst({
      where: { schoolId, studentId: input.studentId, theoryLesson: { ...overlap, status: { in: ["PLANNED", "LIVE"] } } },
      include: { theoryLesson: true },
    }),
    prisma.instructor.findFirst({ where: { id: input.instructorId, schoolId } }),
    prisma.vehicle.findFirst({ where: { id: input.vehicleId, schoolId } }),
    prisma.student.findFirst({ where: { id: input.studentId, schoolId } }),
  ]);

  const checks: AvailabilityCheck[] = [];

  checks.push(
    instructorClash
      ? { ok: false, kind: "instructor", label: "Eğitmen meşgul", detail: `${instructor?.name ?? "Eğitmen"} bu saatte ${instructorClash.student.firstName} ${instructorClash.student.lastName} ile derste.` }
      : { ok: true, kind: "instructor", label: "Eğitmen müsait", detail: `${instructor?.name ?? "Eğitmen"} bu aralıkta boşta.` },
  );

  if (vehicle?.status === "MAINTENANCE") {
    checks.push({ ok: false, kind: "vehicle", label: "Araç bakımda", detail: `${vehicle.plate} plakalı araç bakımda olduğu için derse atanamaz.` });
  } else {
    checks.push(
      vehicleClash
        ? { ok: false, kind: "vehicle", label: "Araç kullanımda", detail: `${vehicle?.plate ?? "Araç"} plakalı araç bu saatte kullanımda.` }
        : { ok: true, kind: "vehicle", label: "Araç müsait", detail: `${vehicle?.plate ?? "Araç"} aynı saatte başka derse atanmamış.` },
    );
  }

  if (studentClash) {
    checks.push({ ok: false, kind: "student", label: "Kursiyer meşgul", detail: `Kursiyerin bu saatte ${studentClash.instructor.name} ile dersi var.` });
  } else if (theoryClash) {
    checks.push({ ok: false, kind: "student", label: "Kursiyer teorik derste", detail: `Kursiyer bu saatte "${theoryClash.theoryLesson.topic}" dersinde.` });
  } else {
    checks.push({ ok: true, kind: "student", label: "Kursiyer müsait", detail: "Kursiyerin bu aralıkta başka dersi yok." });
  }

  // Günlük ders limiti — mevzuat ayarından gelir.
  const reg = await getRegulation(schoolId);
  const dailyMax = regInt(reg, "dailyMaxLessonHours", 2);
  const dayStart = new Date(startsAt); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(startsAt); dayEnd.setHours(23, 59, 59, 999);
  const sameDay = await prisma.drivingLesson.findMany({
    where: { schoolId, studentId: input.studentId, startsAt: { gte: dayStart, lte: dayEnd }, status: { in: ["PLANNED", "LIVE", "DONE"] }, ...not },
  });
  const plannedMin = sameDay.reduce((sum, l) => sum + (l.endsAt.getTime() - l.startsAt.getTime()) / 60000, 0);
  const newMin = (endsAt.getTime() - startsAt.getTime()) / 60000;
  const overLimit = (plannedMin + newMin) / 60 > dailyMax;
  checks.push(
    overLimit
      ? { ok: false, kind: "limit", label: "Günlük ders limiti aşılıyor", detail: `${student?.firstName ?? "Kursiyer"} için günlük azami ${dailyMax} saat (Mevzuat ayarı).` }
      : { ok: true, kind: "limit", label: "Kursiyer günlük limiti uygun", detail: `Günlük azami ${dailyMax} saat aşılmıyor.` },
  );

  return checks;
}

export const isPlannable = (checks: AvailabilityCheck[]) => checks.every((c) => c.ok);
