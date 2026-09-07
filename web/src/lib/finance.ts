import "server-only";
import { prisma } from "./prisma";
import { startOfDay, endOfDay } from "./dashboard";

/** Taksit durumu veritabanında PENDING kalabilir; vadesi geçmişse ekranda GECİKTİ sayılır.
 *  Böylece durum alanını her gece güncelleyen bir işe (cron) bağımlı kalınmaz. */
export const effectiveStatus = (i: { status: string; dueAt: Date }, now = new Date()) =>
  i.status === "PENDING" && i.dueAt < startOfDay(now) ? "OVERDUE" : i.status;

export type StudentBalance = {
  studentId: string; firstName: string; lastName: string; licenseClass: string; stage: string;
  planId: string | null; total: number; paid: number; rest: number; percent: number;
  installmentCount: number; paidCount: number;
  overdueCount: number; overdueAmount: number; overdueDays: number;
  nextDueAt: Date | null; nextDueAmount: number;
};

/** Kursiyer bazında bakiye tablosu. Ödeme planı olmayan kursiyer de listelenir
 *  (plan kurulmamış olması başlı başına takip edilmesi gereken bir durumdur). */
export async function studentBalances(schoolId: string, filter: "tumu" | "geciken" | "bu-hafta" | "plansiz" = "tumu") {
  const now = new Date();
  const students = await prisma.student.findMany({
    where: { schoolId, status: { in: ["ACTIVE", "GRADUATED"] } },
    include: { paymentPlan: { include: { installments: { orderBy: { seq: "asc" } } } } },
    orderBy: [{ firstName: "asc" }],
  });

  const rows: StudentBalance[] = students.map((s) => {
    const inst = s.paymentPlan?.installments ?? [];
    const paid = inst.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.amount, 0);
    const total = s.paymentPlan?.total ?? 0;
    const overdue = inst.filter((i) => effectiveStatus(i, now) === "OVERDUE");
    const pending = inst.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED").sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
    const oldestOverdue = overdue.length ? Math.min(...overdue.map((o) => o.dueAt.getTime())) : null;

    return {
      studentId: s.id, firstName: s.firstName, lastName: s.lastName, licenseClass: s.licenseClass, stage: s.stage,
      planId: s.paymentPlan?.id ?? null,
      total, paid, rest: total - paid, percent: total ? Math.round((paid / total) * 100) : 0,
      installmentCount: inst.length, paidCount: inst.filter((i) => i.status === "PAID").length,
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((sum, i) => sum + i.amount, 0),
      overdueDays: oldestOverdue ? Math.floor((now.getTime() - oldestOverdue) / 86_400_000) : 0,
      nextDueAt: pending[0]?.dueAt ?? null, nextDueAmount: pending[0]?.amount ?? 0,
    };
  });

  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);
  switch (filter) {
    case "geciken": return rows.filter((r) => r.overdueCount > 0).sort((a, b) => b.overdueDays - a.overdueDays);
    case "bu-hafta": return rows.filter((r) => r.nextDueAt && r.nextDueAt <= weekAhead && r.overdueCount === 0);
    case "plansiz": return rows.filter((r) => !r.planId && r.stage !== "PRE_REGISTRATION");
    default: return rows;
  }
}

export async function financeOverview(schoolId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [today, month, year, expensesMonth, expensesYear, fleetMonth, fleetYear, pending, allStudents] = await Promise.all([
    prisma.payment.aggregate({ where: { schoolId, receivedAt: { gte: startOfDay(), lte: endOfDay() } }, _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({ where: { schoolId, receivedAt: { gte: monthStart } }, _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({ where: { schoolId, receivedAt: { gte: yearStart } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { schoolId, occurredAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { schoolId, occurredAt: { gte: yearStart } }, _sum: { amount: true } }),
    // Araç giderleri ayrı tabloda; net durum doğru çıksın diye toplam gidere eklenir.
    prisma.vehicleCost.aggregate({ where: { schoolId, occurredAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.vehicleCost.aggregate({ where: { schoolId, occurredAt: { gte: yearStart } }, _sum: { amount: true } }),
    prisma.installment.findMany({ where: { schoolId, status: { in: ["PENDING", "OVERDUE"] } }, select: { amount: true, dueAt: true, status: true } }),
    prisma.student.count({ where: { schoolId, status: "ACTIVE" } }),
  ]);

  const overdue = pending.filter((i) => effectiveStatus(i, now) === "OVERDUE");
  const monthIncome = month._sum.amount ?? 0;
  const monthExpense = (expensesMonth._sum.amount ?? 0) + (fleetMonth._sum.amount ?? 0);

  return {
    todayTotal: today._sum.amount ?? 0, todayCount: today._count,
    monthIncome, monthCount: month._count, monthExpense, monthNet: monthIncome - monthExpense,
    yearIncome: year._sum.amount ?? 0, yearExpense: (expensesYear._sum.amount ?? 0) + (fleetYear._sum.amount ?? 0),
    pendingTotal: pending.reduce((s, i) => s + i.amount, 0), pendingCount: pending.length,
    overdueTotal: overdue.reduce((s, i) => s + i.amount, 0), overdueCount: overdue.length,
    activeStudents: allStudents,
  };
}

/** Son 6 ayın gelir/gider serisi — grafik için. */
export async function monthlySeries(schoolId: string, months = 6) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [payments, expenses, fleet] = await Promise.all([
    prisma.payment.findMany({ where: { schoolId, receivedAt: { gte: from } }, select: { amount: true, receivedAt: true } }),
    prisma.expense.findMany({ where: { schoolId, occurredAt: { gte: from } }, select: { amount: true, occurredAt: true } }),
    prisma.vehicleCost.findMany({ where: { schoolId, occurredAt: { gte: from } }, select: { amount: true, occurredAt: true } }),
  ]);
  const allExpenses = [...expenses, ...fleet];

  return Array.from({ length: months }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const income = payments.filter((p) => p.receivedAt >= start && p.receivedAt < end).reduce((s, p) => s + p.amount, 0);
    const expense = allExpenses.filter((e) => e.occurredAt >= start && e.occurredAt < end).reduce((s, e) => s + e.amount, 0);
    return { label: start.toLocaleDateString("tr-TR", { month: "short" }), income, expense, net: income - expense };
  });
}

/** Tek kursiyerin ödeme planı ve tahsilat geçmişi. */
export async function getStudentFinance(schoolId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    include: { paymentPlan: { include: { installments: { orderBy: { seq: "asc" } } } } },
  });
  if (!student) return null;

  const payments = await prisma.payment.findMany({
    where: { schoolId, studentId }, orderBy: { receivedAt: "desc" }, include: { installment: true },
  });

  const inst = student.paymentPlan?.installments ?? [];
  const paid = inst.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const total = student.paymentPlan?.total ?? 0;

  return {
    student, plan: student.paymentPlan, installments: inst, payments,
    paid, total, rest: total - paid, percent: total ? Math.round((paid / total) * 100) : 0,
    // Plan dışı (serbest) tahsilatlar: taksite bağlanmamış ödemeler.
    unlinkedTotal: payments.filter((p) => !p.installmentId).reduce((s, p) => s + p.amount, 0),
  };
}
