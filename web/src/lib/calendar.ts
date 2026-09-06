import "server-only";
import { prisma } from "./prisma";
import { getRegulation, regInt } from "./regulation";

export const START_HOUR = 8;
export const END_HOUR = 20;
export const SLOT_MINUTES = 30;
export const ROWS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

export const startOfWeek = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // pazartesi
  return x;
};
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/** Bir dersin takvim ızgarasındaki satır aralığı (1 tabanlı). */
export function rowSpan(startsAt: Date, endsAt: Date) {
  const from = (startsAt.getHours() - START_HOUR) * 60 + startsAt.getMinutes();
  const to = (endsAt.getHours() - START_HOUR) * 60 + endsAt.getMinutes();
  const first = Math.max(1, Math.floor(from / SLOT_MINUTES) + 1);
  const last = Math.min(ROWS + 1, Math.ceil(to / SLOT_MINUTES) + 1);
  return { first, last: Math.max(first + 1, last) };
}

export type CalendarEvent = {
  id: string; kind: "drive" | "theory" | "exam" | "busy" | "clash";
  day: number; startsAt: Date; endsAt: Date;
  title: string; meta: string; href: string; clash?: string;
  /** Aynı saatte birden fazla ders varsa gün sütunu şeritlere bölünür. */
  lane: number; lanes: number;
};

/** Aynı gün içinde kesişen dersleri yan yana şeritlere dağıtır (aralık boyama). */
function assignLanes(events: CalendarEvent[]) {
  for (let day = 0; day < 7; day++) {
    const dayEvents = events.filter((e) => e.day === day).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    const laneEnds: number[] = [];
    for (const e of dayEvents) {
      let lane = laneEnds.findIndex((end) => end <= e.startsAt.getTime());
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(0); }
      laneEnds[lane] = e.endsAt.getTime();
      e.lane = lane;
    }
    // Kesişen kümeler farklı yoğunlukta olabilir; sütun genişliği gün genelinde sabit tutulur.
    const lanes = Math.max(1, laneEnds.length);
    for (const e of dayEvents) e.lanes = lanes;
  }
  return events;
}

export async function weekCalendar(schoolId: string, weekStart: Date, filter?: { instructorId?: string; vehicleId?: string }) {
  const weekEnd = addDays(weekStart, 7);
  const [driving, theory, exams] = await Promise.all([
    prisma.drivingLesson.findMany({
      where: {
        schoolId, startsAt: { gte: weekStart, lt: weekEnd }, status: { notIn: ["CANCELLED"] },
        ...(filter?.instructorId ? { instructorId: filter.instructorId } : {}),
        ...(filter?.vehicleId ? { vehicleId: filter.vehicleId } : {}),
      },
      include: { student: true, instructor: true, vehicle: true },
      orderBy: { startsAt: "asc" },
    }),
    filter?.instructorId || filter?.vehicleId
      ? Promise.resolve([])
      : prisma.theoryLesson.findMany({
          where: { schoolId, startsAt: { gte: weekStart, lt: weekEnd }, status: { not: "CANCELLED" } },
          include: { instructor: true, _count: { select: { attendances: true } } },
          orderBy: { startsAt: "asc" },
        }),
    filter?.instructorId || filter?.vehicleId
      ? Promise.resolve([])
      : prisma.exam.findMany({
          where: { schoolId, scheduledAt: { gte: weekStart, lt: weekEnd }, status: { in: ["PLANNED", "APPLIED"] } },
          include: { student: true },
        }),
  ]);

  // Çakışma: aynı eğitmen ya da aynı araç, kesişen saat
  const clashOf = new Map<string, string>();
  for (let i = 0; i < driving.length; i++) {
    for (let j = i + 1; j < driving.length; j++) {
      const a = driving[i], b = driving[j];
      if (a.startsAt >= b.endsAt || b.startsAt >= a.endsAt) continue;
      const reason = a.instructorId === b.instructorId ? `${a.instructor.name} aynı saatte iki derste` : a.vehicleId === b.vehicleId ? `${a.vehicle.plate} aynı saatte iki derste` : null;
      if (!reason) continue;
      clashOf.set(a.id, reason);
      clashOf.set(b.id, reason);
    }
  }

  const dayOf = (d: Date) => Math.floor((new Date(d).setHours(0, 0, 0, 0) - weekStart.getTime()) / 86_400_000);

  const events: CalendarEvent[] = [
    ...driving.map((l): CalendarEvent => ({
      lane: 0, lanes: 1,
      id: l.id,
      kind: clashOf.has(l.id) ? "clash" : l.status === "CANCELLED" ? "busy" : "drive",
      day: dayOf(l.startsAt), startsAt: l.startsAt, endsAt: l.endsAt,
      title: `${l.student.firstName} ${l.student.lastName[0]}.`,
      meta: `${l.instructor.name.split(" ")[0]} · ${l.vehicle.plate}`,
      href: `/app/kursiyerler/${l.studentId}`,
      clash: clashOf.get(l.id),
    })),
    ...theory.map((l): CalendarEvent => ({
      lane: 0, lanes: 1,
      id: l.id, kind: "theory", day: dayOf(l.startsAt), startsAt: l.startsAt, endsAt: l.endsAt,
      title: l.topic.split(" · ")[0], meta: `${l.room ?? "Derslik"} · ${l._count.attendances} kursiyer`, href: "/app/teorik",
    })),
    ...exams.filter((e) => e.scheduledAt).map((e): CalendarEvent => ({
      lane: 0, lanes: 1,
      id: e.id, kind: "exam", day: dayOf(e.scheduledAt!), startsAt: e.scheduledAt!, endsAt: new Date(e.scheduledAt!.getTime() + 3 * 3600_000),
      title: e.type === "ETEST" ? "e-Sınav" : "Direksiyon sınavı", meta: `${e.student.firstName} ${e.student.lastName[0]}. · ${e.place ?? ""}`.trim(), href: "/app/sinavlar",
    })),
  ].filter((e) => e.day >= 0 && e.day < 7);
  assignLanes(events);

  const totalMinutes = driving.reduce((s, l) => s + (l.endsAt.getTime() - l.startsAt.getTime()) / 60000, 0);
  const clashes = [...new Set(clashOf.values())];

  return { events, driving, theory, totalHours: totalMinutes / 60, clashes, clashLessons: driving.filter((l) => clashOf.has(l.id)) };
}

export type Suggestion = { startsAt: Date; endsAt: Date; instructorId: string; instructorName: string; vehicleId: string; plate: string; why: string };

/** Eğitmen + araç + (varsa) kursiyer uygunluğunun kesiştiği ilk boş saatler. */
export async function suggestSlots(schoolId: string, opts: { studentId?: string; limit?: number } = {}): Promise<Suggestion[]> {
  const limit = opts.limit ?? 4;
  const reg = await getRegulation(schoolId);
  const duration = regInt(reg, "drivingLessonMinutes", 90);
  const from = new Date();
  const to = addDays(from, 7);

  const [instructors, vehicles, lessons, studentLessons] = await Promise.all([
    prisma.instructor.findMany({ where: { schoolId, branch: "DRIVING", isActive: true } }),
    prisma.vehicle.findMany({ where: { schoolId, status: "ACTIVE" } }),
    prisma.drivingLesson.findMany({ where: { schoolId, startsAt: { gte: from, lt: to }, status: { in: ["PLANNED", "LIVE"] } }, select: { instructorId: true, vehicleId: true, startsAt: true, endsAt: true } }),
    opts.studentId
      ? prisma.drivingLesson.findMany({ where: { schoolId, studentId: opts.studentId, startsAt: { gte: from, lt: to }, status: { in: ["PLANNED", "LIVE"] } }, select: { startsAt: true, endsAt: true } })
      : Promise.resolve([]),
  ]);

  const busy = (list: { startsAt: Date; endsAt: Date }[], s: Date, e: Date) => list.some((l) => l.startsAt < e && s < l.endsAt);
  const out: Suggestion[] = [];
  const hours = [9, 10, 11, 13, 14, 15, 16, 17];

  for (let day = 0; day < 7 && out.length < limit; day++) {
    const d = addDays(new Date(new Date().setHours(0, 0, 0, 0)), day);
    if (d.getDay() === 0) continue; // pazar kapalı
    for (const hour of hours) {
      if (out.length >= limit) break;
      const s = new Date(d); s.setHours(hour, 0, 0, 0);
      if (s <= new Date()) continue;
      const e = new Date(s.getTime() + duration * 60000);
      if (opts.studentId && busy(studentLessons, s, e)) continue;

      for (const inst of instructors) {
        if (busy(lessons.filter((l) => l.instructorId === inst.id), s, e)) continue;
        const vehicle = vehicles.find((v) => !busy(lessons.filter((l) => l.vehicleId === v.id), s, e) && (v.instructorId === inst.id || !v.instructorId));
        if (!vehicle) continue;
        const dayUsage = lessons.filter((l) => l.startsAt.toDateString() === s.toDateString()).length;
        out.push({
          startsAt: s, endsAt: e, instructorId: inst.id, instructorName: inst.name, vehicleId: vehicle.id, plate: vehicle.plate,
          why: dayUsage < 6 ? "Bu günde doluluk düşük" : "Eğitmenin boş bloğu",
        });
        break;
      }
    }
  }
  return out;
}

export type DayColumn = { id: string; label: string; sub?: string; kind: "instructor" | "room" };
export type DayEvent = CalendarEvent & { column: number };

/**
 * Gün görünümü: sütunlar eğitmenlerdir (kursun asıl kaynağı). Teorik dersler
 * ayrı bir "Derslik" sütununda toplanır. Hafta görünümünün aksine burada
 * kursiyer, eğitmen, araç ve saat aynı anda okunabilir.
 */
export async function dayCalendar(schoolId: string, day: Date) {
  const from = new Date(day); from.setHours(0, 0, 0, 0);
  const to = new Date(from); to.setDate(to.getDate() + 1);

  const [instructors, driving, theory] = await Promise.all([
    prisma.instructor.findMany({ where: { schoolId, branch: "DRIVING", isActive: true }, orderBy: { name: "asc" } }),
    prisma.drivingLesson.findMany({
      where: { schoolId, startsAt: { gte: from, lt: to }, status: { not: "CANCELLED" } },
      include: { student: true, instructor: true, vehicle: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.theoryLesson.findMany({
      where: { schoolId, startsAt: { gte: from, lt: to }, status: { not: "CANCELLED" } },
      include: { instructor: true, _count: { select: { attendances: true } } },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const columns: DayColumn[] = [
    ...instructors.map((i): DayColumn => ({ id: i.id, label: i.name, sub: i.licenseClasses, kind: "instructor" })),
    ...(theory.length ? [{ id: "theory", label: "Teorik", sub: "derslikler", kind: "room" as const }] : []),
  ];
  const indexOf = new Map(columns.map((c, i) => [c.id, i]));

  // Aynı eğitmenin kesişen dersleri = çakışma
  const clashOf = new Map<string, string>();
  for (let i = 0; i < driving.length; i++) {
    for (let j = i + 1; j < driving.length; j++) {
      const a = driving[i], b = driving[j];
      if (a.startsAt >= b.endsAt || b.startsAt >= a.endsAt) continue;
      if (a.instructorId === b.instructorId) { const r = `${a.instructor.name} aynı saatte iki derste`; clashOf.set(a.id, r); clashOf.set(b.id, r); }
      else if (a.vehicleId === b.vehicleId) { const r = `${a.vehicle.plate} aynı saatte iki derste`; clashOf.set(a.id, r); clashOf.set(b.id, r); }
    }
  }

  const events: DayEvent[] = [
    ...driving.map((l): DayEvent => ({
      lane: 0, lanes: 1, column: indexOf.get(l.instructorId) ?? 0,
      id: l.id, kind: clashOf.has(l.id) ? "clash" : "drive", day: 0,
      startsAt: l.startsAt, endsAt: l.endsAt,
      title: `${l.student.firstName} ${l.student.lastName}`,
      meta: `${l.student.licenseClass} · ${l.vehicle.plate}`,
      href: `/app/kursiyerler/${l.studentId}`, clash: clashOf.get(l.id),
    })),
    ...theory.map((l): DayEvent => ({
      lane: 0, lanes: 1, column: indexOf.get("theory") ?? columns.length - 1,
      id: l.id, kind: "theory", day: 0, startsAt: l.startsAt, endsAt: l.endsAt,
      title: l.topic, meta: `${l.room ?? "Derslik"} · ${l.instructor?.name ?? ""} · ${l._count.attendances} kursiyer`,
      href: "/app/teorik",
    })),
  ];

  // Sütun içinde kesişenleri yan yana koy
  for (let c = 0; c < columns.length; c++) {
    const list = events.filter((e) => e.column === c).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    const ends: number[] = [];
    for (const e of list) {
      let lane = ends.findIndex((end) => end <= e.startsAt.getTime());
      if (lane === -1) { lane = ends.length; ends.push(0); }
      ends[lane] = e.endsAt.getTime();
      e.lane = lane;
    }
    for (const e of list) e.lanes = Math.max(1, ends.length);
  }

  const minutes = driving.reduce((s, l) => s + (l.endsAt.getTime() - l.startsAt.getTime()) / 60000, 0);
  return { columns, events, driving, theory, totalHours: minutes / 60, clashes: [...new Set(clashOf.values())], clashLessons: driving.filter((l) => clashOf.has(l.id)) };
}
