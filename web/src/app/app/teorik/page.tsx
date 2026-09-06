import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { Badge, Card, Chip, EmptyState, PageHeader, PersonAvatar, ProgressBar } from "@/components/ui";
import { THEORY_CATEGORY_LABEL } from "@/lib/constants";
import { attendanceRisks, theorySummary } from "@/lib/theory";
import { date, fullName, time } from "@/lib/format";
import { can } from "@/lib/permissions";
import { startOfDay } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Teorik eğitim" };

const COLS = "104px 116px 150px minmax(180px,1fr) 132px 96px 128px 120px 18px";
const STATUS: Record<string, { label: string; kind: "success" | "brand" | "neutral" | "warning" }> = {
  DONE: { label: "Tamamlandı", kind: "success" },
  LIVE: { label: "Devam ediyor", kind: "brand" },
  PLANNED: { label: "Planlandı", kind: "neutral" },
  CANCELLED: { label: "İptal", kind: "warning" },
};

const FILTERS = [
  { key: "yaklasan", label: "Yaklaşan" },
  { key: "gecmis", label: "Geçmiş" },
  { key: "yoklama", label: "Yoklama bekleyen" },
  { key: "tumu", label: "Tümü" },
] as const;

export default async function TheoryPage({ searchParams }: PageProps<"/app/teorik">) {
  const user = await requirePermission("theory.read");
  const schoolId = user.schoolId;
  const sp = await searchParams;
  const filterKey = typeof sp.filtre === "string" && FILTERS.some((f) => f.key === sp.filtre) ? sp.filtre : "yaklasan";
  const canWrite = can(user.role, "theory.write");
  const now = new Date();

  const whereFor = (key: string) => {
    switch (key) {
      case "yaklasan": return { startsAt: { gte: startOfDay() }, status: { not: "CANCELLED" } };
      case "gecmis": return { endsAt: { lt: now } };
      case "yoklama": return { endsAt: { lt: now }, status: { in: ["PLANNED", "LIVE"] } };
      default: return {};
    }
  };

  const [summary, risks, lessons, counts, terms] = await Promise.all([
    theorySummary(schoolId),
    attendanceRisks(schoolId),
    prisma.theoryLesson.findMany({
      where: { schoolId, ...whereFor(filterKey) },
      include: { instructor: true, _count: { select: { attendances: true } } },
      orderBy: { startsAt: filterKey === "gecmis" ? "desc" : "asc" },
      take: 20,
    }),
    Promise.all(FILTERS.map((f) => prisma.theoryLesson.count({ where: { schoolId, ...whereFor(f.key) } }))),
    prisma.theoryLesson.findMany({ where: { schoolId, term: { not: null } }, distinct: ["term"], select: { term: true }, orderBy: { term: "desc" }, take: 1 }),
  ]);

  // Yoklaması alınmış derslerde kaç kişinin katıldığını göstermek için tek sorguda topla
  const presentCounts = await prisma.attendance.groupBy({
    by: ["theoryLessonId"],
    where: { schoolId, present: true, theoryLessonId: { in: lessons.map((l) => l.id) } },
    _count: { _all: true },
  });
  const presentMap = new Map(presentCounts.map((p) => [p.theoryLessonId, p._count._all]));

  return (
    <>
      <PageHeader
        title="Teorik eğitim"
        sub={`Dönem ${terms[0]?.term ?? "—"} · ${summary.lessonCount} ders · ortalama devam %${summary.average}`}
      >
        {canWrite && <Link href="/app/teorik/yeni" className="btn btn-primary btn-sm"><Icon name="plus" size={15} />Ders planla</Link>}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.categories.map((c) => (
          <div key={c.key} className="card p-[18px] flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="stat-lbl">{c.label}</span>
              <span className="text-xs text-muted ml-auto tabular">{c.done}/{c.total} ders</span>
            </div>
            <span className="kpi mt-1.5 mb-2.5">%{c.percent}</span>
            <ProgressBar value={c.percent} height={6} />
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f, i) => (
          <Chip key={f.key} href={`/app/teorik?filtre=${f.key}`} active={f.key === filterKey}>{f.label} {counts[i]}</Chip>
        ))}
      </div>

      <Card>
        <header className="flex items-center gap-2.5 px-5 pt-5 pb-3 flex-wrap">
          <h2 className="h-card">Ders programı</h2>
          <span className="text-xs text-muted">{FILTERS.find((f) => f.key === filterKey)?.label.toLocaleLowerCase("tr")} dersler</span>
          {counts[2] > 0 && filterKey !== "yoklama" && (
            <Link href="/app/teorik?filtre=yoklama" className="ml-auto text-[13px] font-semibold text-warning">
              {counts[2]} dersin yoklaması alınmamış →
            </Link>
          )}
        </header>

        {lessons.length === 0 ? (
          <EmptyState
            icon="book"
            title="Bu filtrede ders yok."
            desc="Dönem programına yeni bir teorik ders ekleyebilirsiniz."
            action={canWrite ? <Link href="/app/teorik/yeni" className="btn btn-secondary btn-sm"><Icon name="plus" size={15} />Ders planla</Link> : undefined}
          />
        ) : (
          <div className="px-5 pb-4">
            <div className="grid gap-3 items-center pb-2.5" style={{ gridTemplateColumns: COLS }}>
              {["Tarih", "Saat", "Kategori", "Konu", "Öğretmen", "Derslik", "Katılım", "Durum", ""].map((h, i) => <div key={i} className="th">{h}</div>)}
            </div>
            {lessons.map((l) => {
              const st = STATUS[l.status] ?? STATUS.PLANNED;
              const recorded = l._count.attendances;
              const present = presentMap.get(l.id) ?? 0;
              const pct = recorded ? Math.round((present / recorded) * 100) : 0;
              const needsAttendance = l.endsAt < now && l.status !== "DONE" && l.status !== "CANCELLED";
              return (
                <Link key={l.id} href={`/app/teorik/${l.id}`} className="grid gap-3 items-center py-3 border-t border-border" style={{ gridTemplateColumns: COLS }}>
                  <span className="text-[13.5px] font-semibold tabular">{date(l.startsAt)}</span>
                  <span className="text-[13px] text-text-2 tabular">{time(l.startsAt)}–{time(l.endsAt)}</span>
                  <Badge kind="neutral">{THEORY_CATEGORY_LABEL[l.category] ?? l.category}</Badge>
                  <span className="text-[13px] truncate">{l.topic}</span>
                  <span className="text-[13px] text-text-2 truncate">{l.instructor?.name ?? "—"}</span>
                  <span className="text-[13px] text-text-2">{l.room ?? "—"}</span>
                  <span>
                    {recorded ? (
                      <span className="flex flex-col gap-1">
                        <span className="text-xs tabular">{present}/{recorded} · %{pct}</span>
                        <ProgressBar value={pct} height={4} />
                      </span>
                    ) : (
                      <span className={`text-xs ${needsAttendance ? "text-warning font-semibold" : "text-muted"}`}>{needsAttendance ? "Yoklama bekliyor" : "—"}</span>
                    )}
                  </span>
                  <Badge kind={st.kind} dot={l.status === "LIVE" || l.status === "DONE"}>{st.label}</Badge>
                  <Icon name="chev-right" size={16} className="text-muted" />
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <Card>
          <header className="flex items-center gap-2.5 px-5 pt-5">
            <h2 className="h-card">Devam riski</h2>
            {risks.length > 0 && <Badge kind="warning" dot>{risks.length} kursiyer</Badge>}
          </header>
          <div className="px-5 pb-5 pt-1">
            <p className="text-[13px] text-text-2 leading-relaxed mb-1">
              Devam oranı %{summary.minPercent} altına inen kursiyer e-Sınav başvurusu yapamaz. Sınır
              <b> Ayarlar › Mevzuat</b> ekranından değişir.
            </p>
            {risks.length === 0 ? (
              <p className="text-[13px] text-muted py-4 text-center">Devam oranı sınırın altına inen kursiyer yok.</p>
            ) : (
              risks.slice(0, 6).map((r) => (
                <Link key={r.student.id} href={`/app/kursiyerler/${r.student.id}`} className="flex items-center gap-3 py-2.5 border-t border-border">
                  <PersonAvatar name={fullName(r.student)} size={30} />
                  <span className="flex flex-col gap-px min-w-0">
                    <span className="text-[13.5px] font-semibold truncate">{fullName(r.student)}</span>
                    <span className="text-xs text-muted">{r.missed} derse gelmedi · {r.total} ders</span>
                  </span>
                  <Badge kind={r.percent < summary.minPercent - 10 ? "danger" : "warning"} dot>%{r.percent} devam</Badge>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="h-card px-5 pt-5">Dönem özeti</h2>
          <div className="px-5 pb-5 pt-3.5">
            <div className="grid grid-cols-4 gap-2.5">
              <Stat label="Toplam ders" value={String(summary.lessonCount)} />
              <Stat label="Tamamlanan" value={String(summary.doneCount)} />
              <Stat label="Ort. devam" value={`%${summary.average}`} tone="text-success" />
              <Stat label="Zorunlu ders" value={String(summary.requiredLessons)} />
            </div>
            <div className="mt-5"><ProgressBar value={summary.percent} grad height={7} /></div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted">Dönemin %{summary.percent}&apos;i tamamlandı</span>
              <span className="text-xs text-text-2 font-semibold">{summary.lessonCount - summary.doneCount} ders kaldı</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="stat-lbl">{label}</div>
      <div className={`font-display text-xl font-bold tabular ${tone}`}>{value}</div>
    </div>
  );
}
