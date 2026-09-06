"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import { attemptInfo, examEligibility, nextStageAfter } from "@/lib/exam";
import type { ExamFormState } from "@/lib/exam-form";

const ScheduleSchema = z.object({
  studentId: z.string().min(1, "Kursiyer seçin."),
  type: z.enum(["ETEST", "DRIVING"]),
  date: z.string().min(1, "Tarih seçin."),
  time: z.string().optional(),
  place: z.string().optional(),
  override: z.string().optional(),
});

/** Sınav başvurusu / planlaması. Hak ve eğitim şartı kontrol edilir; mevzuat izin veriyorsa
 *  yetkili kullanıcı "override" ile yine de kaydedebilir (ör. resmî muafiyet). */
export async function scheduleExamAction(_prev: ExamFormState, formData: FormData): Promise<ExamFormState> {
  const user = await requirePermission("exam.write");
  const raw = Object.fromEntries(formData);
  const values = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v ?? "")]));

  const parsed = ScheduleSchema.safeParse(raw);
  if (!parsed.success) return { values, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const [eligibility, attempts, pending] = await Promise.all([
    examEligibility(user.schoolId, v.studentId, v.type),
    attemptInfo(user.schoolId, v.studentId, v.type),
    prisma.exam.findFirst({ where: { schoolId: user.schoolId, studentId: v.studentId, type: v.type, status: { in: ["PLANNED", "APPLIED"] } } }),
  ]);

  if (attempts.passed) return { values, error: "Kursiyer bu sınav türünü zaten başarıyla tamamladı." };
  // Aynı türde zaten bekleyen bir başvuru varsa yeni kayıt açılmaz; aksi hâlde attemptNo
  // yalnızca DONE sınavlardan sayıldığı için iki "1. hak" kaydı oluşurdu.
  if (pending) {
    return { values, error: `Kursiyerin zaten planlanmış bir sınavı var (${pending.attemptNo}. hak). Yeni sınav planlamadan önce mevcut kaydı iptal edin ya da sonuçlandırın.` };
  }
  if (attempts.remaining <= 0 && v.override !== "1") {
    return { values, overridable: true, error: `Sınav hakkı doldu (${attempts.used}/${attempts.allowed}). Hak sayısı Ayarlar › Mevzuat'tan değiştirilebilir.` };
  }
  if (!eligibility.ok && v.override !== "1") {
    return { values, overridable: true, error: eligibility.reason };
  }

  const scheduledAt = v.time ? new Date(`${v.date}T${v.time}:00`) : new Date(`${v.date}T09:00:00`);

  const exam = await prisma.exam.create({
    data: {
      schoolId: user.schoolId, studentId: v.studentId, type: v.type,
      attemptNo: attempts.used + 1, scheduledAt, place: v.place || null, status: "PLANNED",
    },
  });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "exam.schedule", target: exam.id, meta: { type: v.type, attemptNo: exam.attemptNo } });
  revalidatePath("/app/sinavlar");
  revalidatePath(`/app/kursiyerler/${v.studentId}`);
  redirect(`/app/sinavlar/${exam.id}?planlandi=1`);
}

const ResultSchema = z.object({
  examId: z.string().min(1),
  result: z.enum(["PASSED", "FAILED"]),
  score: z.string().optional(),
  failReason: z.string().optional(),
});

/** Sonuç girer. Geçtiyse kursiyer sürecini otomatik ilerletir (e-Sınav → direksiyon eğitimi,
 *  direksiyon sınavı → mezuniyet). */
export async function recordExamResultAction(_prev: ExamFormState, formData: FormData): Promise<ExamFormState> {
  const user = await requirePermission("exam.write");
  const raw = Object.fromEntries(formData);
  const parsed = ResultSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const exam = await prisma.exam.findFirst({ where: { id: v.examId, schoolId: user.schoolId }, include: { student: true } });
  if (!exam) return { error: "Sınav bulunamadı." };
  if (exam.status === "DONE") return { error: "Bu sınavın sonucu zaten girilmiş." };

  const score = v.score ? Number(v.score) : null;
  if (score !== null && (!Number.isInteger(score) || score < 0 || score > 100)) return { error: "Puan 0-100 arasında olmalı." };

  const nextStage = nextStageAfter(exam.type as "ETEST" | "DRIVING", v.result, exam.student.stage);

  await prisma.$transaction([
    prisma.exam.update({
      where: { id: exam.id },
      data: { status: "DONE", result: v.result, score, failReason: v.result === "FAILED" ? v.failReason || null : null },
    }),
    ...(nextStage
      ? [prisma.student.update({
          where: { id: exam.studentId },
          data: { stage: nextStage, ...(nextStage === "GRADUATED" ? { graduatedAt: new Date() } : {}) },
        })]
      : []),
  ]);

  await audit({
    schoolId: user.schoolId, actorId: user.id, action: "exam.result", target: exam.id,
    meta: { result: v.result, score, nextStage },
  });
  revalidatePath("/app/sinavlar");
  revalidatePath(`/app/kursiyerler/${exam.studentId}`);
  revalidatePath("/app");
  redirect(`/app/sinavlar/${exam.id}?sonuclandi=1`);
}

export async function cancelExamAction(formData: FormData) {
  const user = await requirePermission("exam.write");
  const id = String(formData.get("examId") ?? "");
  const exam = await prisma.exam.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!exam) redirect("/app/sinavlar?hata=bulunamadi");
  if (exam.status === "DONE") redirect(`/app/sinavlar/${id}?hata=tamamlanan-iptal`);

  await prisma.exam.update({ where: { id }, data: { status: "CANCELLED" } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "exam.cancel", target: id });
  revalidatePath("/app/sinavlar");
  redirect(`/app/sinavlar/${id}?iptal=1`);
}
