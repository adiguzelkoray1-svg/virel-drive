import "server-only";
import { prisma } from "./prisma";
import { getRegulation, regBool } from "./regulation";

export type AttemptInfo = { used: number; allowed: number; remaining: number; passed: boolean };

/**
 * Bir kursiyerin bir sınav türündeki hak durumu. Hak sayısı LicenseClassRule'dan (mevzuata
 * bağlı, kurs bazında yapılandırılabilir) gelir; koda gömülü değildir.
 */
export async function attemptInfo(schoolId: string, studentId: string, type: "ETEST" | "DRIVING"): Promise<AttemptInfo> {
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId }, select: { licenseClass: true } });
  const rule = student ? await prisma.licenseClassRule.findFirst({ where: { schoolId, code: student.licenseClass } }) : null;
  const allowed = rule?.examAttempts ?? 4;

  const exams = await prisma.exam.findMany({ where: { schoolId, studentId, type, status: "DONE" } });
  const used = exams.length;
  const passed = exams.some((e) => e.result === "PASSED");
  return { used, allowed, remaining: Math.max(0, allowed - used), passed };
}

/** Kursiyerin sınava girmeye uygunluğu — mevzuat ayarına göre eğitim şartı kontrolü. */
export async function examEligibility(schoolId: string, studentId: string, type: "ETEST" | "DRIVING") {
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) return { ok: false, reason: "Kursiyer bulunamadı." };

  if (type === "ETEST") {
    if (!["THEORY", "ETEST_WAITING"].includes(student.stage)) {
      return { ok: false, reason: "Kursiyer teorik eğitim aşamasında değil." };
    }
    return { ok: true };
  }

  // DRIVING sınavı: mevzuat ayarı açıkken eğitim saati dolmadan başvuru engellenir.
  const [reg, rule, doneCount] = await Promise.all([
    getRegulation(schoolId),
    prisma.licenseClassRule.findFirst({ where: { schoolId, code: student.licenseClass } }),
    prisma.drivingLesson.count({ where: { schoolId, studentId, status: "DONE" } }),
  ]);
  const required = rule?.drivingHours ?? 14;
  const done = (doneCount * 90) / 60; // TODO: mevzuat ders süresini kullan (regInt drivingLessonMinutes)
  if (regBool(reg, "blockExamWithoutHours") && done < required) {
    return { ok: false, reason: `Direksiyon eğitimi tamamlanmadı: ${done.toFixed(1)}/${required} saat.` };
  }
  return { ok: true };
}

/** Sınav sonucu kursiyerin sürecini ilerletir: e-Sınav geçince direksiyon eğitimine, direksiyon
 *  sınavı geçince mezuniyete geçer. Bu, "sistem sınav haklarını otomatik takip etmeli" kuralının
 *  doğal uzantısıdır. */
export function nextStageAfter(type: "ETEST" | "DRIVING", result: "PASSED" | "FAILED", currentStage: string) {
  if (result === "PASSED") {
    if (type === "ETEST" && currentStage === "ETEST_WAITING") return "DRIVING";
    if (type === "DRIVING" && currentStage === "DRIVING_EXAM") return "GRADUATED";
  }
  if (result === "FAILED") {
    if (type === "ETEST" && currentStage === "THEORY") return "ETEST_WAITING"; // ilk denemede başvuru gördü sayılır
  }
  return null;
}

export type ExamSummary = {
  upcoming: number;
  etestPassRate: number; etestTotal: number;
  drivingPassRate: number; drivingTotal: number;
  lastAttemptRisk: number; // 1 hakkı kalan kursiyer sayısı
};

export async function examSummary(schoolId: string): Promise<ExamSummary> {
  const now = new Date();
  const [upcoming, done] = await Promise.all([
    prisma.exam.count({ where: { schoolId, status: { in: ["PLANNED", "APPLIED"] }, scheduledAt: { gte: now } } }),
    prisma.exam.findMany({ where: { schoolId, status: "DONE" }, select: { type: true, result: true } }),
  ]);
  const etest = done.filter((e) => e.type === "ETEST");
  const driving = done.filter((e) => e.type === "DRIVING");
  const pct = (rows: typeof done) => (rows.length ? Math.round((rows.filter((r) => r.result === "PASSED").length / rows.length) * 100) : 0);

  // Son hakkı kalan: bu türde (allowed - used === 1) olan aktif kursiyerler — kaba tahmin,
  // tüm aktif kursiyerleri tek tek dolaşmak yerine sınav kaydı olanlar üzerinden sayılır.
  const activeStudents = await prisma.student.findMany({
    where: { schoolId, status: "ACTIVE", stage: { in: ["ETEST_WAITING", "DRIVING_EXAM"] } },
    select: { id: true, stage: true, licenseClass: true },
  });
  let lastAttemptRisk = 0;
  for (const s of activeStudents) {
    const type = s.stage === "ETEST_WAITING" ? "ETEST" : "DRIVING";
    const info = await attemptInfo(schoolId, s.id, type);
    if (!info.passed && info.remaining === 1) lastAttemptRisk++;
  }

  return { upcoming, etestPassRate: pct(etest), etestTotal: etest.length, drivingPassRate: pct(driving), drivingTotal: driving.length, lastAttemptRisk };
}
