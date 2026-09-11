import "server-only";
import { prisma } from "./prisma";
import { getRegulation, regInt } from "./regulation";
import { countCertificatesNeedingAttention } from "./driving-certificate";

export const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const endOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export type Alert = { kind: "danger" | "warning" | "brand"; icon: string; title: string; detail: string; action: string; href: string };

/** Dashboard'un "Dikkat gerektirenler" listesi — sistemin kendi bulduğu operasyon sorunları. */
export async function operationalAlerts(schoolId: string): Promise<Alert[]> {
  const now = new Date();
  const weekEnd = addDays(now, 7);
  const alerts: Alert[] = [];

  const [lessons, overdue, missingDocs, examReady, vehicles, staleLeads, reg] = await Promise.all([
    prisma.drivingLesson.findMany({
      where: { schoolId, status: { in: ["PLANNED", "LIVE"] }, startsAt: { gte: startOfDay(now), lte: weekEnd } },
      include: { instructor: true, vehicle: true, student: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.installment.findMany({ where: { schoolId, status: { in: ["OVERDUE", "PENDING"] }, dueAt: { lt: startOfDay(now) } }, include: { plan: { include: { student: true } } } }),
    prisma.document.groupBy({ by: ["studentId"], where: { schoolId, status: { in: ["MISSING", "PENDING"] }, student: { status: "ACTIVE", stage: { in: ["PRE_REGISTRATION", "DOCUMENTS", "THEORY"] } } }, _count: true }),
    prisma.student.count({ where: { schoolId, status: "ACTIVE", stage: "ETEST_WAITING" } }),
    prisma.vehicle.findMany({ where: { schoolId, status: { in: ["ACTIVE", "MAINTENANCE"] } } }),
    prisma.lead.findMany({
      where: { schoolId, stage: { notIn: ["WON", "LOST"] }, nextFollowUpAt: { lt: startOfDay(now) } },
      select: { nextFollowUpAt: true }, orderBy: { nextFollowUpAt: "asc" },
    }),
    getRegulation(schoolId),
  ]);

  // 1. Çakışma: aynı eğitmen ya da aynı araç, kesişen saat
  const clashes: string[] = [];
  for (let i = 0; i < lessons.length; i++) {
    for (let j = i + 1; j < lessons.length; j++) {
      const a = lessons[i], b = lessons[j];
      if (a.startsAt >= b.endsAt || b.startsAt >= a.endsAt) continue;
      if (a.instructorId === b.instructorId) clashes.push(`${a.instructor.name} · ${a.startsAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`);
      else if (a.vehicleId === b.vehicleId) clashes.push(`${a.vehicle.plate} · ${a.startsAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`);
    }
  }
  if (clashes.length) {
    alerts.push({ kind: "danger", icon: "alert", title: clashes.length === 1 ? "Ders çakışması" : `${clashes.length} ders çakışması`, detail: [...new Set(clashes)].slice(0, 2).join(" · "), action: "Çöz", href: "/app/takvim" });
  }

  // 2. Gecikmiş tahsilat
  if (overdue.length) {
    const students = new Set(overdue.map((i) => i.plan.studentId));
    const total = overdue.reduce((s, i) => s + i.amount, 0);
    const oldest = Math.max(...overdue.map((i) => Math.round((now.getTime() - i.dueAt.getTime()) / 86_400_000)));
    alerts.push({ kind: "danger", icon: "wallet", title: `${students.size} kursiyerin ödemesi gecikti`, detail: `Toplam ₺${(total / 100).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} · en eskisi ${oldest} gün`, action: "Listele", href: "/app/finans?filtre=geciken" });
  }

  // 3. Geri dönüş bekleyen aday — zamanında aranmayan aday kaybedilen kayıttır.
  if (staleLeads.length) {
    const oldest = Math.round((startOfDay(now).getTime() - startOfDay(staleLeads[0].nextFollowUpAt!).getTime()) / 86_400_000);
    alerts.push({
      kind: "warning", icon: "funnel",
      title: `${staleLeads.length} adayın takip tarihi geçti`,
      detail: `En eskisi ${oldest} gün önce aranacaktı.`,
      action: "Ara", href: "/app/on-kayitlar",
    });
  }

  // 4. Eksik evrak
  if (missingDocs.length) {
    alerts.push({ kind: "warning", icon: "folder", title: `${missingDocs.length} kursiyerde evrak eksik`, detail: "Kayıt süreci tamamlanamıyor.", action: "Görüntüle", href: "/app/belgeler?filtre=eksik" });
  }

  // 5. Devam riski
  const minAttendance = regInt(reg, "theoryAttendanceMinPercent", 85);
  const rows = await prisma.attendance.findMany({ where: { schoolId }, select: { studentId: true, present: true } });
  if (rows.length) {
    const byStudent = new Map<string, { t: number; p: number }>();
    for (const r of rows) {
      const c = byStudent.get(r.studentId) ?? { t: 0, p: 0 };
      c.t++; if (r.present) c.p++;
      byStudent.set(r.studentId, c);
    }
    const risky = [...byStudent.values()].filter((c) => c.t >= 4 && (c.p / c.t) * 100 < minAttendance).length;
    if (risky) alerts.push({ kind: "warning", icon: "book", title: `${risky} kursiyer teorik devamsızlıkta sınırda`, detail: `%${minAttendance} altına inen kursiyer e-Sınav başvurusu yapamaz.`, action: "İncele", href: "/app/teorik" });
  }

  // 6. e-Sınav için hazır
  if (examReady) alerts.push({ kind: "brand", icon: "exam", title: `${examReady} kursiyer e-Sınav için hazır`, detail: "Başvuru dönemi kapanmadan işlem yapın.", action: "Başvur", href: "/app/sinavlar/yeni?tur=ETEST" });

  // 7. Direksiyon eğitimi bitmek üzere
  const nearFinish = await prisma.student.count({ where: { schoolId, status: "ACTIVE", stage: "DRIVING" } });
  if (nearFinish) {
    const rules = await prisma.licenseClassRule.findMany({ where: { schoolId } });
    const need = new Map(rules.map((r) => [r.code, r.drivingHours]));
    const done = await prisma.drivingLesson.groupBy({ by: ["studentId"], where: { schoolId, status: "DONE" }, _count: { _all: true } });
    const students = await prisma.student.findMany({ where: { schoolId, status: "ACTIVE", stage: "DRIVING" }, select: { id: true, licenseClass: true } });
    const doneMap = new Map(done.map((d) => [d.studentId, d._count._all]));
    const almost = students.filter((s) => {
      const req = need.get(s.licenseClass) ?? 14;
      const hrs = ((doneMap.get(s.id) ?? 0) * 90) / 60;
      return req - hrs <= 3 && req - hrs > 0;
    }).length;
    if (almost) alerts.push({ kind: "brand", icon: "wheel", title: `${almost} kursiyerin direksiyon eğitimi bitmek üzere`, detail: "Sınav planlaması yapılmalı.", action: "Planla", href: "/app/sinavlar/yeni?tur=DRIVING" });
  }

  // 8. Araç bakımı / muayenesi
  for (const v of vehicles) {
    if (v.nextServiceKm && v.nextServiceKm - v.km <= 500) {
      alerts.push({ kind: "warning", icon: "wrench", title: `${v.plate} bakımına ${Math.max(0, v.nextServiceKm - v.km).toLocaleString("tr-TR")} km kaldı`, detail: `Güncel kilometre ${v.km.toLocaleString("tr-TR")}.`, action: "Randevu", href: "/app/araclar" });
    } else if (v.inspectionUntil && v.inspectionUntil.getTime() - now.getTime() < 30 * 86_400_000) {
      const days = Math.max(0, Math.round((v.inspectionUntil.getTime() - now.getTime()) / 86_400_000));
      alerts.push({ kind: "warning", icon: "car", title: `${v.plate} muayenesine ${days} gün kaldı`, detail: "Muayene tarihi geçerse araç eğitimde kullanılamaz.", action: "Görüntüle", href: "/app/araclar" });
    }
  }

  // 9. K Sınıfı Sürücü Aday Belgesi — süresi/hakkı biten ya da hiç düzenlenmemiş kursiyer,
  // sınavda içeri alınmaz (bkz. lib/driving-certificate.ts).
  const kCertAttention = await countCertificatesNeedingAttention(schoolId);
  if (kCertAttention) {
    alerts.push({ kind: "danger", icon: "shield", title: `${kCertAttention} kursiyerin K belgesi eksik/yenilenmeli`, detail: "Süresi/hakkı biten belgeyle sınava girilemez.", action: "İncele", href: "/app/kursiyerler?filtre=direksiyon" });
  }

  return alerts.slice(0, 8);
}

export async function todaySchedule(schoolId: string) {
  const [driving, theory] = await Promise.all([
    prisma.drivingLesson.findMany({
      where: { schoolId, startsAt: { gte: startOfDay(), lte: endOfDay() } },
      include: { student: true, instructor: true, vehicle: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.theoryLesson.findMany({
      where: { schoolId, startsAt: { gte: startOfDay(), lte: endOfDay() } },
      include: { instructor: true, _count: { select: { attendances: true } } },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const items = [
    ...driving.map((l) => ({
      id: l.id, type: "drive" as const, startsAt: l.startsAt, endsAt: l.endsAt, status: l.status,
      title: `${l.student.firstName} ${l.student.lastName}`,
      meta: `${l.student.licenseClass} sınıfı · ${l.instructor.name} · ${l.vehicle.plate}`,
      href: `/app/kursiyerler/${l.studentId}`,
    })),
    ...theory.map((l) => ({
      id: l.id, type: "theory" as const, startsAt: l.startsAt, endsAt: l.endsAt, status: l.status,
      title: `Teorik · ${l.topic}`,
      meta: `${l.instructor?.name ?? "Öğretmen"} · ${l.room ?? "Derslik"} · ${l._count.attendances} kursiyer`,
      href: `/app/teorik/${l.id}`,
    })),
  ].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  return { items, drivingCount: driving.length, theoryCount: theory.length };
}

export async function financeSummary(schoolId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [today, month, pending, overdue, expenses] = await Promise.all([
    prisma.payment.aggregate({ where: { schoolId, receivedAt: { gte: startOfDay(), lte: endOfDay() } }, _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({ where: { schoolId, receivedAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.installment.aggregate({ where: { schoolId, status: { in: ["PENDING", "OVERDUE"] } }, _sum: { amount: true }, _count: true }),
    prisma.installment.aggregate({ where: { schoolId, status: { in: ["PENDING", "OVERDUE"] }, dueAt: { lt: startOfDay() } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { schoolId, occurredAt: { gte: monthStart } }, _sum: { amount: true } }),
  ]);
  return {
    today: today._sum.amount ?? 0, todayCount: today._count,
    month: month._sum.amount ?? 0,
    pending: pending._sum.amount ?? 0, pendingCount: pending._count,
    overdue: overdue._sum.amount ?? 0,
    expenses: expenses._sum.amount ?? 0,
  };
}

/**
 * Bu haftanın gün gün ders yoğunluğu.
 * Kapasite direksiyon eğitmeni sayısına göre ölçülür: kursun asıl darboğazı araç değil eğitmendir.
 */
export async function weeklyLessonLoad(schoolId: string) {
  const monday = startOfDay();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const [lessons, instructorCount, vehicleCount] = await Promise.all([
    prisma.drivingLesson.findMany({
      where: { schoolId, startsAt: { gte: monday, lt: addDays(monday, 7) }, status: { in: ["PLANNED", "LIVE", "DONE"] } },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.instructor.count({ where: { schoolId, branch: "DRIVING", isActive: true } }),
    prisma.vehicle.count({ where: { schoolId, status: "ACTIVE" } }),
  ]);
  const names = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const capacityPerDay = instructorCount * 8; // eğitmen başına günlük 8 saatlik pratik kapasite
  const days = names.map((label, i) => {
    const from = addDays(monday, i), to = addDays(monday, i + 1);
    const minutes = lessons.filter((l) => l.startsAt >= from && l.startsAt < to).reduce((s, l) => s + (l.endsAt.getTime() - l.startsAt.getTime()) / 60000, 0);
    return { label, hours: minutes / 60, percent: capacityPerDay ? Math.min(100, Math.round((minutes / 60 / capacityPerDay) * 100)) : 0 };
  });
  const totalHours = days.reduce((s, d) => s + d.hours, 0);
  // Pazar kapalı: ortalama hafta içi + cumartesi üzerinden hesaplanır.
  const workDays = days.slice(0, 6);
  return { days, totalHours, vehicleCount, instructorCount, average: Math.round(workDays.reduce((s, d) => s + d.percent, 0) / workDays.length) };
}
