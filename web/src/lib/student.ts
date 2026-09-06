import "server-only";
import { prisma } from "./prisma";
import { STAGE_WEIGHT, SKILLS, type StudentStage } from "./constants";
import { getRegulation, regInt } from "./regulation";

export type TimelineStep = { key: string; title: string; date: string; sub?: string; state: "done" | "now" | "todo" };

export async function getStudentDetail(schoolId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    include: {
      documents: true,
      paymentPlan: { include: { installments: { orderBy: { seq: "asc" } } } },
      exams: { orderBy: [{ type: "asc" }, { attemptNo: "asc" }] },
    },
  });
  if (!student) return null;

  const [lessons, attendance, rule, reg] = await Promise.all([
    prisma.drivingLesson.findMany({
      where: { schoolId, studentId },
      include: { instructor: true, vehicle: true, ratings: true },
      orderBy: { startsAt: "desc" },
    }),
    prisma.attendance.findMany({ where: { schoolId, studentId }, include: { theoryLesson: true } }),
    prisma.licenseClassRule.findFirst({ where: { schoolId, code: student.licenseClass } }),
    getRegulation(schoolId),
  ]);

  const minutes = (l: { startsAt: Date; endsAt: Date }) => (l.endsAt.getTime() - l.startsAt.getTime()) / 60000;
  const doneLessons = lessons.filter((l) => l.status === "DONE");
  const doneHours = doneLessons.reduce((s, l) => s + minutes(l), 0) / 60;
  const requiredHours = rule?.drivingHours ?? 14;
  const drivingPercent = Math.min(100, Math.round((doneHours / requiredHours) * 100));

  const theoryTotal = attendance.length;
  const theoryPresent = attendance.filter((a) => a.present).length;
  const attendancePercent = theoryTotal ? Math.round((theoryPresent / theoryTotal) * 100) : 0;
  const minAttendance = regInt(reg, "theoryAttendanceMinPercent", 85);

  // Gelişim alanları: her alanın tüm derslerdeki son puanı
  const skillScores = SKILLS.map((s) => {
    const ratings = lessons.flatMap((l) => l.ratings.filter((r) => r.skill === s.key).map((r) => ({ score: r.score, at: l.startsAt })));
    ratings.sort((a, b) => b.at.getTime() - a.at.getTime());
    return { key: s.key, label: s.label, score: ratings[0]?.score ?? null, samples: ratings.length };
  });
  const rated = skillScores.filter((s) => s.score !== null);
  const skillAverage = rated.length ? rated.reduce((s, r) => s + (r.score ?? 0), 0) / rated.length : null;

  const etest = student.exams.filter((e) => e.type === "ETEST");
  const drivingExams = student.exams.filter((e) => e.type === "DRIVING");
  const etestPassed = etest.find((e) => e.result === "PASSED");
  const drivingPassed = drivingExams.find((e) => e.result === "PASSED");
  const attemptsAllowed = rule?.examAttempts ?? 4;

  const docsOk = student.documents.filter((d) => d.status === "OK").length;
  const docsTotal = student.documents.length;

  const inst = student.paymentPlan?.installments ?? [];
  const paid = inst.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const total = student.paymentPlan?.total ?? 0;
  const overdue = inst.filter((i) => i.status !== "PAID" && i.dueAt < new Date());
  const nextDue = inst.find((i) => i.status !== "PAID");

  // Genel süreç yüzdesi: aşama ağırlığı + aşama içi ilerleme
  const stage = student.stage as StudentStage;
  const base = STAGE_WEIGHT[stage] ?? 0;
  const nextWeight = { PRE_REGISTRATION: 12, DOCUMENTS: 25, THEORY: 50, ETEST_WAITING: 60, DRIVING: 90, DRIVING_EXAM: 100, GRADUATED: 100 }[stage] ?? 100;
  const inStage = stage === "DRIVING" ? drivingPercent / 100 : stage === "THEORY" ? Math.min(1, theoryTotal / Math.max(1, rule?.theoryLessons ?? 12)) : stage === "DOCUMENTS" ? (docsTotal ? docsOk / docsTotal : 0) : 0;
  const overallPercent = Math.min(100, Math.round(base + (nextWeight - base) * inStage));

  const upcoming = lessons.filter((l) => l.status === "PLANNED" && l.startsAt > new Date()).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0] ?? null;

  const fmt = (d: Date | null | undefined) => (d ? d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "—");
  const timeline: TimelineStep[] = [
    { key: "pre", title: "Ön kayıt", date: fmt(student.registeredAt), state: "done" },
    { key: "reg", title: "Kayıt tamamlandı", date: fmt(student.registeredAt), sub: `${student.licenseClass} sınıfı`, state: "done" },
    { key: "docs", title: docsOk === docsTotal ? "Evraklar tamamlandı" : "Evraklar bekleniyor", date: `${docsOk}/${docsTotal} belge`, state: docsOk === docsTotal ? "done" : stage === "PRE_REGISTRATION" ? "todo" : "now" },
    { key: "theory", title: theoryTotal ? (attendancePercent >= minAttendance ? "Teorik eğitim tamamlandı" : "Teorik eğitim devam ediyor") : "Teorik eğitim", date: theoryTotal ? `%${attendancePercent} devam` : "Başlamadı", state: theoryTotal ? (stage === "THEORY" ? "now" : "done") : "todo" },
    { key: "etest", title: "e-Sınav", date: etestPassed ? `${etestPassed.score} puan · başarılı` : etest.length ? `${etest.length}. hak kullanıldı` : "Planlanmadı", state: etestPassed ? "done" : stage === "ETEST_WAITING" ? "now" : etest.length ? "now" : "todo" },
    { key: "driving", title: "Direksiyon eğitimi", date: `${Math.round(doneHours * 10) / 10} / ${requiredHours} saat`, sub: stage === "DRIVING" ? `Kalan ${Math.max(0, requiredHours - doneHours).toFixed(1)} saat` : undefined, state: doneHours >= requiredHours ? "done" : stage === "DRIVING" ? "now" : "todo" },
    { key: "exam", title: "Direksiyon sınavı", date: drivingPassed ? "Başarılı" : drivingExams.length ? `${drivingExams.length}. hak kullanıldı` : "Planlanmadı", state: drivingPassed ? "done" : stage === "DRIVING_EXAM" ? "now" : "todo" },
    { key: "cert", title: "Sertifika / mezuniyet", date: student.graduatedAt ? fmt(student.graduatedAt) : "—", state: student.stage === "GRADUATED" ? "done" : "todo" },
  ];

  return {
    student, lessons, doneLessons, attendance, rule, upcoming,
    requiredHours, doneHours, drivingPercent, attendancePercent, minAttendance, theoryTotal,
    skillScores, skillAverage,
    etest, drivingExams, etestPassed, drivingPassed, attemptsAllowed,
    docsOk, docsTotal,
    payment: { total, paid, rest: total - paid, percent: total ? Math.round((paid / total) * 100) : 0, installments: inst, overdue, nextDue },
    overallPercent, timeline,
  };
}
