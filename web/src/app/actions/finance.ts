"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import { buildInstallments } from "@/lib/finance-form";
import type { PaymentFormState, ExpenseFormState, PlanFormState } from "@/lib/finance-form";

/** Tutarlar formda TL girilir, veritabanında kuruş saklanır. */
const toKurus = (tl: number) => Math.round(tl * 100);
const atNoon = (v: string) => new Date(`${v}T12:00:00`);
const values = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string").map(([k, v]) => [k, String(v)]));

const PaymentSchema = z.object({
  studentId: z.string().min(1, "Kursiyer seçin."),
  method: z.enum(["CASH", "CARD", "TRANSFER", "ONLINE"]),
  receivedAt: z.string().min(1, "Tarih seçin."),
  extra: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

/**
 * Tahsilat kaydı. İki bileşeni var:
 *  - İşaretlenen taksitler: her biri için ayrı bir Payment satırı açılır ve taksit ÖDENDİ olur.
 *    Ayrı satır tutmak, "hangi ödeme hangi taksiti kapattı" sorusunu sonradan cevaplanabilir kılar.
 *  - Plan dışı tutar: taksite bağlanmayan ek tahsilat (ek ders ücreti, sınav harcı vb.).
 * Kısmi taksit ödemesi bilinçli olarak desteklenmiyor; taksit ya kapanır ya bekler.
 * Kursiyer kısmi ödemek isterse plan yeniden kurulur (ödeme planı formu bunu yapar).
 */
export async function paymentFormAction(_prev: PaymentFormState, formData: FormData): Promise<PaymentFormState> {
  const user = await requirePermission("finance.write");
  const back = values(formData);
  const parsed = PaymentSchema.safeParse(back);
  if (!parsed.success) return { values: back, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const student = await prisma.student.findFirst({ where: { id: v.studentId, schoolId: user.schoolId } });
  if (!student) return { values: back, error: "Kursiyer bulunamadı." };

  const ids = formData.getAll("installmentIds").map(String).filter(Boolean);
  const extraTl = Number(v.extra ?? "");
  const extra = Number.isFinite(extraTl) && extraTl > 0 ? toKurus(extraTl) : 0;
  if (ids.length === 0 && extra === 0) {
    return { values: back, error: "Kapatılacak taksit seçin ya da plan dışı bir tutar girin." };
  }
  if (v.extra && !Number.isFinite(extraTl)) return { values: back, error: "Plan dışı tutar sayı olmalı." };

  const installments = ids.length
    ? await prisma.installment.findMany({ where: { id: { in: ids }, schoolId: user.schoolId, plan: { studentId: v.studentId } } })
    : [];
  if (installments.length !== ids.length) return { values: back, error: "Seçilen taksitlerden biri bulunamadı." };
  const already = installments.find((i) => i.status === "PAID");
  if (already) return { values: back, error: `${already.label ?? `${already.seq}. taksit`} zaten tahsil edilmiş. Sayfayı yenileyin.` };

  const receivedAt = atNoon(v.receivedAt);
  if (receivedAt.getTime() > Date.now() + 86_400_000) return { values: back, error: "İleri tarihli tahsilat kaydedilemez." };

  const common = { schoolId: user.schoolId, studentId: v.studentId, method: v.method, receivedAt, note: v.note || null };
  const total = installments.reduce((s, i) => s + i.amount, 0) + extra;

  await prisma.$transaction([
    ...installments.map((i) =>
      prisma.payment.create({ data: { ...common, installmentId: i.id, amount: i.amount } })),
    ...(extra > 0 ? [prisma.payment.create({ data: { ...common, amount: extra } })] : []),
    ...(installments.length
      ? [prisma.installment.updateMany({ where: { id: { in: ids } }, data: { status: "PAID", paidAt: receivedAt } })]
      : []),
  ]);

  await audit({ schoolId: user.schoolId, actorId: user.id, action: "payment.create", target: v.studentId, meta: { amount: total, method: v.method, installments: ids.length } });
  revalidatePath("/app/finans");
  revalidatePath(`/app/kursiyerler/${v.studentId}`);
  revalidatePath("/app");
  redirect(`/app/finans/kursiyer/${v.studentId}?tahsilat=${total}`);
}

/** Tahsilatı geri alır: ödeme satırı silinir, bağlı taksit yeniden BEKLİYOR olur.
 *  Yanlış girilen kaydın düzeltilmesi için; silme değil düzeltme amaçlı kullanılmalı. */
export async function deletePaymentAction(formData: FormData) {
  const user = await requirePermission("finance.write");
  const id = String(formData.get("paymentId") ?? "");
  const payment = await prisma.payment.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!payment) redirect("/app/finans?hata=bulunamadi");

  await prisma.$transaction([
    ...(payment.installmentId
      ? [prisma.installment.update({ where: { id: payment.installmentId }, data: { status: "PENDING", paidAt: null } })]
      : []),
    prisma.payment.delete({ where: { id } }),
  ]);

  await audit({ schoolId: user.schoolId, actorId: user.id, action: "payment.delete", target: payment.studentId, meta: { amount: payment.amount } });
  revalidatePath("/app/finans");
  revalidatePath(`/app/kursiyerler/${payment.studentId}`);
  redirect(`/app/finans/kursiyer/${payment.studentId}?iade=1`);
}

const ExpenseSchema = z.object({
  category: z.enum(["RENT", "SALARY", "VEHICLE", "UTILITY", "MARKETING", "OTHER"]),
  amount: z.coerce.number().positive("Tutar sıfırdan büyük olmalı."),
  occurredAt: z.string().min(1, "Tarih seçin."),
  note: z.string().trim().optional(),
  instructorId: z.string().trim().optional(),
  staffUserId: z.string().trim().optional(),
  subcategory: z.enum(["MAAS", "AVANS"]).optional(),
});

/**
 * Gider kaydı. Araç giderleri araç detayından girildiğinde VehicleCost'a yazılır; buradaki
 * "Araç" kategorisi plakaya bağlanamayan genel filo giderleri içindir. `instructorId`/
 * `staffUserId`/`subcategory` yalnızca eğitmen ya da idari kullanıcı detayındaki "Maaş ve
 * avans" formundan gelir (kategori orada sabit SALARY) — Giderler ekranındaki genel form
 * bunları hiç göndermez, o yüzden eski davranış (bağlı olmayan genel personel gideri) hiç
 * bozulmadı.
 */
export async function expenseFormAction(_prev: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  const user = await requirePermission("finance.write");
  const back = values(formData);
  const parsed = ExpenseSchema.safeParse(back);
  if (!parsed.success) return { values: back, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const occurredAt = atNoon(v.occurredAt);
  if (occurredAt.getTime() > Date.now() + 86_400_000) return { values: back, error: "İleri tarihli gider kaydedilemez." };

  let instructorId: string | null = null;
  if (v.instructorId) {
    const instructor = await prisma.instructor.findFirst({ where: { id: v.instructorId, schoolId: user.schoolId } });
    if (!instructor) return { values: back, error: "Eğitmen bulunamadı." };
    instructorId = instructor.id;
  }
  let staffUserId: string | null = null;
  if (v.staffUserId) {
    const staffUser = await prisma.user.findFirst({ where: { id: v.staffUserId, schoolId: user.schoolId } });
    if (!staffUser) return { values: back, error: "Kullanıcı bulunamadı." };
    staffUserId = staffUser.id;
  }
  const linked = instructorId ?? staffUserId;

  const created = await prisma.expense.create({
    data: {
      schoolId: user.schoolId, category: v.category, amount: toKurus(v.amount), note: v.note || null, occurredAt,
      instructorId, staffUserId, subcategory: linked ? (v.subcategory ?? "MAAS") : null,
    },
  });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "expense.create", target: created.id, meta: { category: v.category, amount: toKurus(v.amount), instructorId, staffUserId } });
  revalidatePath("/app/finans/giderler");
  revalidatePath("/app/finans");
  if (instructorId) {
    revalidatePath(`/app/egitmenler/${instructorId}`);
    redirect(`/app/egitmenler/${instructorId}?eklendi=1#odeme`);
  }
  if (staffUserId) {
    revalidatePath(`/app/ayarlar/kullanicilar/${staffUserId}`);
    redirect(`/app/ayarlar/kullanicilar/${staffUserId}?eklendi=1#odeme`);
  }
  redirect("/app/finans/giderler?eklendi=1");
}

export async function deleteExpenseAction(formData: FormData) {
  const user = await requirePermission("finance.write");
  const id = String(formData.get("expenseId") ?? "");
  const expense = await prisma.expense.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!expense) redirect("/app/finans/giderler?hata=bulunamadi");

  await prisma.expense.delete({ where: { id } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "expense.delete", target: id, meta: { amount: expense.amount } });
  revalidatePath("/app/finans/giderler");
  revalidatePath("/app/finans");
  redirect("/app/finans/giderler?silindi=1");
}

const PlanSchema = z.object({
  studentId: z.string().min(1, "Kursiyer seçin."),
  total: z.coerce.number().positive("Toplam ücret sıfırdan büyük olmalı."),
  downPayment: z.coerce.number().min(0).default(0),
  count: z.coerce.number().int().min(1, "En az bir taksit olmalı.").max(24, "En fazla 24 taksit tanımlanabilir."),
  firstDueAt: z.string().min(1, "İlk vade tarihini seçin."),
  downPaid: z.string().optional(),
});

/**
 * Ödeme planı kurar ya da yeniden yapılandırır.
 * Yeniden yapılandırmada ödenmiş taksitlere dokunulmaz: yalnızca açık taksitler silinip
 * kalan bakiye (toplam − tahsil edilen) yeni vade planına bölünür. Böylece geçmiş
 * tahsilat kayıtları ve onların bağlı olduğu taksitler korunur.
 */
export async function planFormAction(_prev: PlanFormState, formData: FormData): Promise<PlanFormState> {
  const user = await requirePermission("finance.write");
  const back = values(formData);
  const parsed = PlanSchema.safeParse(back);
  if (!parsed.success) return { values: back, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const student = await prisma.student.findFirst({
    where: { id: v.studentId, schoolId: user.schoolId },
    include: { paymentPlan: { include: { installments: true } } },
  });
  if (!student) return { values: back, error: "Kursiyer bulunamadı." };

  const total = toKurus(v.total);
  const down = toKurus(v.downPayment);
  if (down > total) return { values: back, error: "Peşinat toplam ücretten büyük olamaz." };

  const paidRows = (student.paymentPlan?.installments ?? []).filter((i) => i.status === "PAID");
  const paidSum = paidRows.reduce((s, i) => s + i.amount, 0);
  if (paidSum > total) {
    return { values: back, error: `Bu kursiyerden zaten ₺${(paidSum / 100).toLocaleString("tr-TR")} tahsil edilmiş; toplam ücret bundan düşük olamaz.` };
  }
  // Yeniden yapılandırmada peşinat çoktan tahsil edilmiş olabilir; kalan bakiyeden düşülmez.
  const hasPaidDown = paidRows.some((i) => i.seq === 0);
  const effectiveDown = hasPaidDown ? 0 : down;
  const remaining = total - paidSum - effectiveDown;
  if (remaining < 0) return { values: back, error: "Peşinat kalan bakiyeden büyük olamaz." };

  const amounts = remaining > 0 ? buildInstallments(remaining + effectiveDown, effectiveDown, v.count) : [];
  const first = atNoon(v.firstDueAt);
  const maxSeq = paidRows.reduce((m, i) => Math.max(m, i.seq), 0);

  const rows: { seq: number; label: string; amount: number; dueAt: Date; status: string; paidAt: Date | null }[] = [];
  if (effectiveDown > 0) {
    rows.push({
      seq: 0, label: "Peşinat", amount: effectiveDown, dueAt: first,
      status: v.downPaid === "1" ? "PAID" : "PENDING", paidAt: v.downPaid === "1" ? new Date() : null,
    });
  }
  amounts.forEach((amount, idx) => {
    const dueAt = new Date(first);
    // Peşinat ilk vadede tahsil edilir, taksitler sonraki aylarda başlar.
    dueAt.setMonth(dueAt.getMonth() + idx + (effectiveDown > 0 ? 1 : 0));
    // Numara sıradan devam eder; yeniden yapılandırmada "1. taksit" iki kez görünmesin.
    const seq = maxSeq + idx + 1;
    rows.push({ seq, label: `${seq}. taksit`, amount, dueAt, status: "PENDING", paidAt: null });
  });

  const planId = student.paymentPlan?.id;
  await prisma.$transaction(async (tx) => {
    const plan = planId
      ? await tx.paymentPlan.update({ where: { id: planId }, data: { total, downPayment: down } })
      : await tx.paymentPlan.create({ data: { schoolId: user.schoolId, studentId: v.studentId, total, downPayment: down } });

    if (planId) {
      // Açık taksitler silinir; ödenmiş olanlar (ve onlara bağlı Payment satırları) kalır.
      await tx.installment.deleteMany({ where: { planId, status: { not: "PAID" } } });
    }
    if (rows.length) {
      await tx.installment.createMany({
        data: rows.map((r) => ({ schoolId: user.schoolId, planId: plan.id, ...r })),
      });
    }
  });

  await audit({ schoolId: user.schoolId, actorId: user.id, action: planId ? "plan.update" : "plan.create", target: v.studentId, meta: { total, count: rows.length } });
  revalidatePath("/app/finans");
  revalidatePath(`/app/kursiyerler/${v.studentId}`);
  redirect(`/app/finans/kursiyer/${v.studentId}?plan=${planId ? "guncellendi" : "olusturuldu"}`);
}
