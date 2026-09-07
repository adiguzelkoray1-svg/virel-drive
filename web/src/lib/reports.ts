import "server-only";
import { prisma } from "./prisma";
import { listInstructors } from "./instructor";
import { financeOverview } from "./finance";
import { LEAD_STAGES } from "./constants";
import { date } from "./format";

export type ReportRange = { from: Date; to: Date; label: string; key: "6ay" | "yil" | "ozel" };

/** Rapor aralığını URL parametrelerinden çözer. Geçersiz ya da eksik "özel" aralık
 *  sessizce son 6 aya düşer — kırık bir tarih girdisiyle sayfa asla patlamaz. */
export function resolveReportRange(sp: Record<string, string | string[] | undefined>): ReportRange {
  const now = new Date();
  const aralik = typeof sp.aralik === "string" ? sp.aralik : "";

  if (aralik === "yil") {
    return { from: new Date(now.getFullYear(), 0, 1), to: now, label: `${now.getFullYear()} yılı`, key: "yil" };
  }
  if (aralik === "ozel" && typeof sp.baslangic === "string" && typeof sp.bitis === "string") {
    const from = new Date(`${sp.baslangic}T00:00:00`);
    const to = new Date(`${sp.bitis}T23:59:59`);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from <= to) {
      return { from, to, label: `${date(from)} – ${date(to)}`, key: "ozel" };
    }
  }
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return { from, to: now, label: "Son 6 ay", key: "6ay" };
}

const FUNNEL_ORDER = LEAD_STAGES.filter((s) => s.key !== "LOST"); // WON dahil, en sondaki tabaka
const CLASS_COLOR: Record<string, string> = { B: "bg-blue", A2: "bg-turquoise", A: "bg-blue-300", C: "bg-mint", D: "bg-navy" };

export async function reportsOverview(schoolId: string, range: ReportRange) {
  const { from, to } = range;
  const now = new Date();

  const [
    activeCount, graduatedCount,
    leadsInRange, wonInRange, lostInRange, lostReasons,
    examsInRange,
    plans,
    lessonTimes,
    lessonsForVehicle,
    driving, vehicles,
    overdue, delayedStudents,
  ] = await Promise.all([
    prisma.student.count({ where: { schoolId, status: "ACTIVE" } }),
    prisma.student.count({ where: { schoolId, status: "GRADUATED" } }),
    prisma.lead.findMany({ where: { schoolId, createdAt: { gte: from, lte: to } }, select: { stage: true } }),
    prisma.lead.count({ where: { schoolId, stage: "WON", wonAt: { gte: from, lte: to } } }),
    prisma.lead.count({ where: { schoolId, stage: "LOST", updatedAt: { gte: from, lte: to } } }),
    prisma.lead.groupBy({ by: ["lostReason"], where: { schoolId, stage: "LOST", updatedAt: { gte: from, lte: to }, lostReason: { not: null } }, _count: true }),
    prisma.exam.findMany({ where: { schoolId, status: "DONE", scheduledAt: { gte: from, lte: to } }, select: { type: true, result: true } }),
    prisma.paymentPlan.findMany({ where: { schoolId, total: { gt: 0 } }, select: { total: true } }),
    prisma.$transaction([
      prisma.drivingLesson.findMany({ where: { schoolId, startsAt: { gte: from, lte: to } }, select: { startsAt: true } }),
      prisma.theoryLesson.findMany({ where: { schoolId, startsAt: { gte: from, lte: to } }, select: { startsAt: true } }),
    ]),
    prisma.drivingLesson.findMany({ where: { schoolId, startsAt: { gte: from, lte: to } }, select: { vehicleId: true, startsAt: true, endsAt: true } }),
    listInstructors(schoolId, "DRIVING"),
    prisma.vehicle.findMany({ where: { schoolId }, select: { id: true, plate: true } }),
    financeOverview(schoolId),
    // "Süreci gecikiyor": kayıttan 120 günden uzun süre geçmiş ama henüz sınav/mezuniyet aşamasında değil.
    // 120 gün, mevzuatın varsayılan 14 haftalık dönem uzunluğunun (termWeeks) yaklaşık 1,2 katıdır —
    // kesin bir mevzuat değeri değil, yalnızca "normalden gecikti" için kabaca bir eşik.
    prisma.student.findMany({
      where: { schoolId, status: "ACTIVE", stage: { notIn: ["DRIVING_EXAM", "GRADUATED"] }, registeredAt: { lt: new Date(now.getTime() - 120 * 86_400_000) } },
      select: { registeredAt: true },
    }),
  ]);

  // ---------- KPI'lar ----------
  const totalPlanned = plans.reduce((s, p) => s + p.total, 0);
  const installmentAgg = await prisma.installment.aggregate({ where: { schoolId, status: "PAID" }, _sum: { amount: true } });
  const collectionRate = totalPlanned ? Math.round(((installmentAgg._sum.amount ?? 0) / totalPlanned) * 100) : 0;
  const revenuePerStudent = plans.length ? Math.round(totalPlanned / plans.length) : 0;

  const passRate = (type: "ETEST" | "DRIVING") => {
    const rows = examsInRange.filter((e) => e.type === type);
    return rows.length ? Math.round((rows.filter((e) => e.result === "PASSED").length / rows.length) * 100) : null;
  };
  const eTestPass = passRate("ETEST");
  const drivingPass = passRate("DRIVING");

  const closedInRange = wonInRange + lostInRange;
  const conversion = closedInRange ? Math.round((wonInRange / closedInRange) * 100) : 0;

  // ---------- Kayıt hunisi ----------
  // Lead'in aşama geçmişi tutulmadığı için "en az bu aşamaya ulaştı" cari aşamadan çıkarılır;
  // hangi aşamada kaybedildiği bilinmediğinden LOST adaylar yalnızca ilk (Aday) tabakada sayılır.
  const totalLeads = leadsInRange.length;
  const funnel = FUNNEL_ORDER.map((stage, idx) => {
    const count = idx === 0
      ? totalLeads
      : leadsInRange.filter((l) => l.stage !== "LOST" && FUNNEL_ORDER.findIndex((s) => s.key === l.stage) >= idx).length;
    return { key: stage.key, label: idx === 0 ? "Aday (ön kayıt)" : stage.label, count, percent: totalLeads ? Math.round((count / totalLeads) * 100) : 0 };
  });

  // ---------- Ehliyet sınıfı dağılımı ----------
  const byClass = await prisma.student.groupBy({ by: ["licenseClass"], where: { schoolId, status: { in: ["ACTIVE", "GRADUATED"] } }, _count: true });
  const classTotal = byClass.reduce((s, c) => s + c._count, 0);
  const classDistribution = [...byClass]
    .sort((a, b) => b._count - a._count)
    .map((c) => ({ code: c.licenseClass, count: c._count, percent: classTotal ? Math.round((c._count / classTotal) * 100) : 0, color: CLASS_COLOR[c.licenseClass] ?? "bg-muted" }));

  // ---------- Eğitmen performansı (direksiyon) ----------
  const instructorPerformance = [...driving].sort((a, b) => b.loadPercent - a.loadPercent);

  // ---------- Ders yoğunluğu ısı haritası ----------
  const [drivingTimes, theoryTimes] = lessonTimes;
  const HOUR_START = 8, HOUR_END = 19; // 08:00–19:00 arası saatlik dilimler
  const grid = Array.from({ length: 7 }, () => Array(HOUR_END - HOUR_START).fill(0));
  for (const t of [...drivingTimes, ...theoryTimes]) {
    const day = (t.startsAt.getDay() + 6) % 7; // Pazartesi=0 ... Pazar=6
    const hour = t.startsAt.getHours();
    if (hour >= HOUR_START && hour < HOUR_END) grid[day][hour - HOUR_START]++;
  }
  const maxCell = Math.max(1, ...grid.flat());
  const heatmap = grid.map((row) => row.map((v) => (v === 0 ? 0 : Math.min(5, Math.ceil((v / maxCell) * 5)))));
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  let busiestCell = { day: 0, hour: hours[0], value: -1 };
  let emptySlots = 0;
  grid.forEach((row, d) => row.forEach((v, h) => {
    if (v > busiestCell.value) busiestCell = { day: d, hour: hours[h], value: v };
    if (v === 0) emptySlots++;
  }));
  const heatmapNote = busiestCell.value > 0
    ? `${DAY_LABELS[busiestCell.day]} ${String(busiestCell.hour).padStart(2, "0")}:00 en yoğun saat; seçili aralıkta ${emptySlots} boş saat dilimi var.`
    : "Seçili aralıkta ders kaydı yok.";

  // ---------- Hızlı cevaplar ----------
  const busiestInstructor = instructorPerformance.filter((i) => i.isActive)[0] ?? null;

  const vehicleMinutes = new Map<string, number>();
  for (const l of lessonsForVehicle) vehicleMinutes.set(l.vehicleId, (vehicleMinutes.get(l.vehicleId) ?? 0) + (l.endsAt.getTime() - l.startsAt.getTime()) / 60000);
  const topVehicleEntry = [...vehicleMinutes.entries()].sort((a, b) => b[1] - a[1])[0];
  const topVehicle = topVehicleEntry ? { id: topVehicleEntry[0], plate: vehicles.find((v) => v.id === topVehicleEntry[0])?.plate ?? "—", hours: Math.round((topVehicleEntry[1] / 60) * 10) / 10 } : null;

  const topClass = classDistribution[0] ?? null;
  const weakerExam = eTestPass !== null && drivingPass !== null
    ? (eTestPass <= drivingPass ? { label: "e-Sınav", rate: eTestPass } : { label: "Direksiyon sınavı", rate: drivingPass })
    : eTestPass !== null ? { label: "e-Sınav", rate: eTestPass } : drivingPass !== null ? { label: "Direksiyon sınavı", rate: drivingPass } : null;

  const topLostReason = [...lostReasons].sort((a, b) => b._count - a._count)[0]?.lostReason ?? null;

  const delayedDays = delayedStudents.length
    ? Math.round(delayedStudents.reduce((s, x) => s + (now.getTime() - x.registeredAt.getTime()) / 86_400_000, 0) / delayedStudents.length)
    : 0;

  const quickAnswers = [
    { icon: "badge-id", q: "Hangi eğitmen daha yoğun?", a: busiestInstructor ? `${busiestInstructor.name} · %${busiestInstructor.loadPercent} doluluk` : "Yeterli veri yok", href: busiestInstructor ? `/app/egitmenler/${busiestInstructor.id}` : "/app/egitmenler" },
    { icon: "car", q: "Hangi araç daha çok kullanılıyor?", a: topVehicle ? `${topVehicle.plate} · ${topVehicle.hours} saat` : "Seçili aralıkta veri yok", href: topVehicle ? `/app/araclar/${topVehicle.id}` : "/app/araclar" },
    { icon: "clock", q: "Hangi saatlerde boşluk var?", a: `${emptySlots} saat dilimi boş`, href: "/app/takvim" },
    { icon: "users", q: "Hangi sınıftan çok kayıt geliyor?", a: topClass ? `${topClass.code} sınıfı · %${topClass.percent}` : "Kayıtlı kursiyer yok", href: "/app/kursiyerler" },
    { icon: "exam", q: "Hangi sınavda başarı düşük?", a: weakerExam ? `${weakerExam.label} · %${weakerExam.rate}` : "Seçili aralıkta sınav yok", href: "/app/sinavlar" },
    { icon: "wallet", q: "Hangi ödemeler gecikti?", a: overdue.overdueCount ? `${overdue.overdueCount} taksit · ₺${(overdue.overdueTotal / 100).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}` : "Geciken ödeme yok", href: "/app/finans?filtre=geciken" },
    { icon: "funnel", q: "Hangi adaylar kaybedildi?", a: lostInRange ? `Seçili aralıkta ${lostInRange} aday${topLostReason ? ` · en sık "${topLostReason}"` : ""}` : "Seçili aralıkta kayıp yok", href: "/app/crm/liste?asama=LOST" },
    { icon: "wheel", q: "Hangi kursiyerin süreci gecikiyor?", a: delayedStudents.length ? `${delayedStudents.length} kursiyer ortalama ${delayedDays} gündür sürüyor` : "Gecikmiş kursiyer yok", href: "/app/kursiyerler" },
  ] as const;

  return {
    range,
    kpis: {
      activeCount, graduatedCount, totalStudents: activeCount + graduatedCount,
      // "Kayıt dönüşümü" kapanan (kayıt olan + kaybedilen) adaylar üzerinden hesaplanır —
      // huni kartındaki "Aday (ön kayıt)" tabakasıyla karıştırılmamalı: o, aralıkta açılan
      // adayların ne kadarının şu an kayıtlı olduğunu (kohort), bu ise aralıkta kapanan
      // adayların ne kadarının kazanıldığını (dönem faaliyeti) gösterir.
      conversion, closedInRange, wonInRange,
      eTestPass, drivingPass,
      revenuePerStudent, collectionRate,
    },
    funnel,
    classDistribution,
    instructorPerformance,
    heatmap: { grid: heatmap, hours, dayLabels: DAY_LABELS, note: heatmapNote },
    quickAnswers,
  };
}
