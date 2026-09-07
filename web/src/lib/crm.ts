import "server-only";
import { prisma } from "./prisma";
import { startOfDay } from "./dashboard";
import { LEAD_STAGES } from "./constants";

/** Kapanmış aşamalar: huniden çıkmış adaylar. */
export const CLOSED_STAGES = ["WON", "LOST"] as const;
export const OPEN_STAGES = LEAD_STAGES.map((s) => s.key).filter((k) => !CLOSED_STAGES.includes(k as never));

export type LeadRow = Awaited<ReturnType<typeof prisma.lead.findMany>>[number];

/** Takip tarihi geçmiş ve hâlâ kapanmamış aday: "aranmayı bekliyor" sayılır. */
export const isFollowUpDue = (l: { stage: string; nextFollowUpAt: Date | null }, now = new Date()) =>
  !!l.nextFollowUpAt && !CLOSED_STAGES.includes(l.stage as never) && l.nextFollowUpAt < startOfDay(now);

/** Son temastan bu yana geçen gün. Hiç temas edilmemişse kayıt tarihinden sayılır. */
export const staleDays = (l: { lastContactAt: Date | null; createdAt: Date }, now = new Date()) =>
  Math.floor((now.getTime() - (l.lastContactAt ?? l.createdAt).getTime()) / 86_400_000);

/** Aşamalara bölünmüş pipeline. Her sütun en yeni temas edilenden başlar. */
export async function pipeline(schoolId: string) {
  const leads = await prisma.lead.findMany({
    where: { schoolId, stage: { in: [...OPEN_STAGES, "WON"] } },
    orderBy: [{ nextFollowUpAt: "asc" }, { lastContactAt: "desc" }],
  });

  return LEAD_STAGES.filter((s) => s.key !== "LOST").map((s) => ({
    ...s,
    // "Kayıt oldu" sütunu geçmişin tamamını değil son dönemi gösterir; aksi halde
    // huninin sonu zamanla sınırsız büyür ve sütun okunamaz hâle gelir.
    leads: leads.filter((l) => l.stage === s.key).slice(0, s.key === "WON" ? 12 : 40),
    total: leads.filter((l) => l.stage === s.key).length,
  }));
}

export async function crmSummary(schoolId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [open, wonThisMonth, wonPrevMonth, allClosed, dueLeads] = await Promise.all([
    prisma.lead.count({ where: { schoolId, stage: { in: OPEN_STAGES } } }),
    prisma.lead.count({ where: { schoolId, stage: "WON", wonAt: { gte: monthStart } } }),
    prisma.lead.count({ where: { schoolId, stage: "WON", wonAt: { gte: prevStart, lt: monthStart } } }),
    prisma.lead.findMany({ where: { schoolId, stage: { in: ["WON", "LOST"] } }, select: { stage: true, createdAt: true, wonAt: true } }),
    prisma.lead.findMany({ where: { schoolId, stage: { in: OPEN_STAGES }, nextFollowUpAt: { lt: startOfDay(now) } }, select: { id: true } }),
  ]);

  const won = allClosed.filter((l) => l.stage === "WON");
  // Kapanış süresi yalnızca wonAt'i olan adaylardan hesaplanır; demo öncesi kayıtlarda boş olabilir.
  const withWonAt = won.filter((l) => l.wonAt);
  const avgDays = withWonAt.length
    ? withWonAt.reduce((s, l) => s + (l.wonAt!.getTime() - l.createdAt.getTime()) / 86_400_000, 0) / withWonAt.length
    : null;

  return {
    open,
    wonThisMonth, wonPrevMonth,
    conversion: allClosed.length ? Math.round((won.length / allClosed.length) * 100) : 0,
    dueCount: dueLeads.length,
    avgDays,
  };
}

/** Kaynak kırılımı ve kaynağın kayda dönüşme oranı — bütçenin nereye gideceğini bu belirler. */
export async function sourceBreakdown(schoolId: string, days = 90) {
  const from = new Date(Date.now() - days * 86_400_000);
  const leads = await prisma.lead.findMany({
    where: { schoolId, createdAt: { gte: from } },
    select: { source: true, stage: true },
  });

  const rows = Object.entries(
    leads.reduce<Record<string, { total: number; won: number; closed: number }>>((acc, l) => {
      const r = (acc[l.source] ??= { total: 0, won: 0, closed: 0 });
      r.total++;
      if (l.stage === "WON") { r.won++; r.closed++; }
      if (l.stage === "LOST") r.closed++;
      return acc;
    }, {}),
  ).map(([source, r]) => ({
    source, total: r.total, closed: r.closed, won: r.won,
    share: leads.length ? Math.round((r.total / leads.length) * 100) : 0,
    // Dönüşüm oranı yalnızca kapanmış adaylardan; huninin ortasındakiler henüz sayılmaz.
    conversion: r.closed ? Math.round((r.won / r.closed) * 100) : null,
  })).sort((a, b) => b.total - a.total);

  // "En yüksek kanal" iddiası hem asgari örneklem hem de karşılaştırılacak ikinci bir
  // kanal ister; tek başına kalan kanalı "en yüksek" diye sunmak yanıltıcı olur.
  const comparable = rows.filter((r) => r.conversion !== null && r.closed >= 5)
    .sort((a, b) => (b.conversion ?? 0) - (a.conversion ?? 0));
  const best = comparable.length >= 2 ? comparable[0] : null;
  return { rows, total: leads.length, best, comparableCount: comparable.length };
}

/** Geri dönüş bekleyen adaylar: takip tarihi geçmiş ya da uzun süredir temas edilmemiş. */
export async function followUpQueue(schoolId: string, limit = 20) {
  const now = new Date();
  const leads = await prisma.lead.findMany({
    where: { schoolId, stage: { in: OPEN_STAGES } },
    orderBy: [{ nextFollowUpAt: "asc" }],
  });

  return leads
    .map((l) => ({
      lead: l,
      due: isFollowUpDue(l, now),
      stale: staleDays(l, now),
      // Gün farkı iki tarihin gün başlangıcından hesaplanır; saat 14:00'e kurulmuş
      // dün vadeli bir takip "0 gün geçti" diye görünmesin.
      dueDays: l.nextFollowUpAt ? Math.round((startOfDay(now).getTime() - startOfDay(l.nextFollowUpAt).getTime()) / 86_400_000) : 0,
    }))
    // Takip tarihi geçenler ilk; sonra 4 günden uzun süredir sessiz kalanlar.
    .filter((r) => r.due || r.stale >= 4)
    .sort((a, b) => (b.due ? 1 : 0) - (a.due ? 1 : 0) || b.dueDays - a.dueDays || b.stale - a.stale)
    .slice(0, limit);
}

export async function getLead(schoolId: string, id: string) {
  return prisma.lead.findFirst({
    where: { id, schoolId },
    include: { student: { select: { id: true, firstName: true, lastName: true, stage: true, status: true } } },
  });
}

export type LeadListFilter = { stage?: string; source?: string; q?: string };

export async function listLeads(schoolId: string, f: LeadListFilter) {
  const q = (f.q ?? "").trim();
  const digits = q.replace(/\D/g, "");
  return prisma.lead.findMany({
    where: {
      schoolId,
      ...(f.stage && f.stage !== "tumu" ? { stage: f.stage } : {}),
      ...(f.source && f.source !== "tumu" ? { source: f.source } : {}),
      ...(q
        ? {
            OR: [
              // Ada göre arama kelime kelime eşleşir; "ali veli" hem adı hem soyadı yakalasın diye.
              ...q.split(/\s+/).map((w) => ({ name: { contains: w, mode: "insensitive" as const } })),
              // Telefonda en az 3 rakam istenir, yoksa `contains: ""` her kaydı döndürür.
              ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    take: 300,
  });
}
