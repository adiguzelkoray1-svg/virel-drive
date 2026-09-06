import "server-only";
import { prisma } from "./prisma";
import { startOfWeek, addDays } from "./calendar";

/** Araç başına bu haftaki kullanım: planlanan/yapılan ders saati ve doluluk yüzdesi.
 *  Kapasite, araç başına günlük 8 saatlik pratik eğitim penceresi kabul edilir. */
const WEEKLY_CAPACITY_HOURS = 8 * 6; // hafta içi + cumartesi

export type VehicleRow = {
  id: string; plate: string; brand: string | null; model: string | null; year: number | null;
  licenseClass: string; usage: string; status: string; km: number;
  inspectionUntil: Date | null; insuranceUntil: Date | null; nextServiceKm: number | null;
  instructorName: string | null;
  usageHours: number; usagePercent: number;
  /** Bakım/muayene uyarısı — dashboard'daki uyarılarla aynı eşikleri kullanır. */
  alert: { kind: "danger" | "warning" | "neutral"; text: string };
};

export async function listVehicles(schoolId: string): Promise<VehicleRow[]> {
  const weekStart = startOfWeek();
  const weekEnd = addDays(weekStart, 7);
  const now = new Date();

  const [vehicles, lessons] = await Promise.all([
    prisma.vehicle.findMany({ where: { schoolId }, include: { instructor: true }, orderBy: [{ status: "asc" }, { plate: "asc" }] }),
    prisma.drivingLesson.findMany({
      where: { schoolId, startsAt: { gte: weekStart, lt: weekEnd }, status: { in: ["PLANNED", "LIVE", "DONE"] } },
      select: { vehicleId: true, startsAt: true, endsAt: true },
    }),
  ]);

  const minutesByVehicle = new Map<string, number>();
  for (const l of lessons) {
    const mins = (l.endsAt.getTime() - l.startsAt.getTime()) / 60000;
    minutesByVehicle.set(l.vehicleId, (minutesByVehicle.get(l.vehicleId) ?? 0) + mins);
  }

  return vehicles.map((v) => {
    const usageHours = Math.round(((minutesByVehicle.get(v.id) ?? 0) / 60) * 10) / 10;
    const usagePercent = Math.min(100, Math.round((usageHours / WEEKLY_CAPACITY_HOURS) * 100));

    let alert: VehicleRow["alert"] = { kind: "neutral", text: "Planlı bakım yok" };
    if (v.status === "MAINTENANCE") {
      alert = { kind: "danger", text: "Bakımda" };
    } else if (v.nextServiceKm !== null && v.nextServiceKm - v.km <= 500) {
      alert = { kind: "warning", text: `Bakıma ${Math.max(0, v.nextServiceKm - v.km).toLocaleString("tr-TR")} km kaldı` };
    } else if (v.inspectionUntil && v.inspectionUntil.getTime() - now.getTime() < 30 * 86_400_000) {
      const days = Math.max(0, Math.round((v.inspectionUntil.getTime() - now.getTime()) / 86_400_000));
      alert = { kind: "warning", text: `Muayene ${days} gün` };
    } else if (v.nextServiceKm !== null) {
      alert = { kind: "neutral", text: `${(v.nextServiceKm - v.km).toLocaleString("tr-TR")} km sonra bakım` };
    }

    return {
      id: v.id, plate: v.plate, brand: v.brand, model: v.model, year: v.year,
      licenseClass: v.licenseClass, usage: v.usage, status: v.status, km: v.km,
      inspectionUntil: v.inspectionUntil, insuranceUntil: v.insuranceUntil, nextServiceKm: v.nextServiceKm,
      instructorName: v.instructor?.name ?? null,
      usageHours, usagePercent, alert,
    };
  });
}

export type CostRow = { vehicleId: string; plate: string; byType: Record<string, number>; total: number; perKm: number | null };

/** Verilen ay için araç bazında gider dökümü ve km başına maliyet.
 *  Km başına maliyet, aracın o ay yaptığı ders kilometresi bilinmediği için toplam
 *  kilometreye göre değil, ayın gider toplamı / o ayki tahmini km ile hesaplanır. */
export async function vehicleCosts(schoolId: string, monthsAgo = 0) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const to = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);

  const [vehicles, costs, lessons] = await Promise.all([
    prisma.vehicle.findMany({ where: { schoolId }, orderBy: { plate: "asc" }, select: { id: true, plate: true } }),
    prisma.vehicleCost.findMany({ where: { schoolId, occurredAt: { gte: from, lt: to } }, select: { vehicleId: true, type: true, amount: true } }),
    prisma.drivingLesson.findMany({
      where: { schoolId, startsAt: { gte: from, lt: to }, status: "DONE" },
      select: { vehicleId: true, startsAt: true, endsAt: true },
    }),
  ]);

  // Ders saati başına ~25 km kabul edilir (şehir içi direksiyon eğitimi ortalaması).
  const KM_PER_HOUR = 25;
  // Az ders yapılmış araçta km başına maliyet anlamsız derecede oynar (bir tek sigorta
  // kalemi ₺250/km gibi görünebilir). Eşiğin altında oran hiç gösterilmez.
  const MIN_HOURS_FOR_PER_KM = 10;
  const kmByVehicle = new Map<string, number>();
  for (const l of lessons) {
    const hours = (l.endsAt.getTime() - l.startsAt.getTime()) / 3_600_000;
    kmByVehicle.set(l.vehicleId, (kmByVehicle.get(l.vehicleId) ?? 0) + hours * KM_PER_HOUR);
  }

  const minKm = MIN_HOURS_FOR_PER_KM * KM_PER_HOUR;
  const rows: CostRow[] = vehicles.map((v) => {
    const mine = costs.filter((c) => c.vehicleId === v.id);
    const byType: Record<string, number> = {};
    for (const c of mine) byType[c.type] = (byType[c.type] ?? 0) + c.amount;
    const total = mine.reduce((s, c) => s + c.amount, 0);
    const km = kmByVehicle.get(v.id) ?? 0;
    return { vehicleId: v.id, plate: v.plate, byType, total, perKm: km >= minKm ? Math.round(total / km) : null };
  });

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const totalKm = [...kmByVehicle.values()].reduce((s, k) => s + k, 0);

  // Filo ortalaması yalnızca yeterli veri varsa: aksi hâlde ayın ilk günlerinde
  // "tam ay gideri / birkaç günlük km" gibi yanıltıcı bir oran çıkar.
  const avgPerKm = totalKm >= minKm * vehicles.length * 0.5 ? Math.round(grandTotal / totalKm) : null;
  return { rows, from, to, grandTotal, avgPerKm, totalKm: Math.round(totalKm) };
}

export async function vehicleSummary(schoolId: string, monthsAgo = 0) {
  const [rows, thisMonth, lastMonth] = await Promise.all([
    listVehicles(schoolId),
    vehicleCosts(schoolId, monthsAgo),
    vehicleCosts(schoolId, monthsAgo + 1),
  ]);

  const active = rows.filter((r) => r.status === "ACTIVE");
  const avgUsage = active.length ? Math.round(active.reduce((s, r) => s + r.usagePercent, 0) / active.length) : 0;
  const changePercent = lastMonth.grandTotal > 0
    ? Math.round(((thisMonth.grandTotal - lastMonth.grandTotal) / lastMonth.grandTotal) * 100)
    : null;

  return {
    total: rows.length,
    active: active.length,
    maintenance: rows.filter((r) => r.status === "MAINTENANCE").length,
    passive: rows.filter((r) => r.status === "PASSIVE").length,
    examVehicles: rows.filter((r) => r.usage === "EXAM").length,
    monthlyCost: thisMonth.grandTotal,
    changePercent,
    avgPerKm: thisMonth.avgPerKm,
    avgUsage,
    upcomingMaintenance: rows.filter((r) => r.alert.kind === "warning" || r.alert.kind === "danger").length,
  };
}

/** Araç detayı: profil, bu haftaki dersler, gider geçmişi. */
export async function getVehicleDetail(schoolId: string, vehicleId: string) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, schoolId }, include: { instructor: true } });
  if (!vehicle) return null;

  const now = new Date();
  const [upcoming, costs, doneCount] = await Promise.all([
    prisma.drivingLesson.findMany({
      where: { schoolId, vehicleId, startsAt: { gte: now }, status: { in: ["PLANNED", "LIVE"] } },
      include: { student: true, instructor: true }, orderBy: { startsAt: "asc" }, take: 8,
    }),
    prisma.vehicleCost.findMany({ where: { schoolId, vehicleId }, orderBy: { occurredAt: "desc" }, take: 20 }),
    prisma.drivingLesson.count({ where: { schoolId, vehicleId, status: "DONE" } }),
  ]);

  const totalCost = await prisma.vehicleCost.aggregate({ where: { schoolId, vehicleId }, _sum: { amount: true } });
  return { vehicle, upcoming, costs, doneCount, totalCost: totalCost._sum.amount ?? 0 };
}
