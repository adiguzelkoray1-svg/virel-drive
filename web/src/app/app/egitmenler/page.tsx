import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { Icon } from "@/components/icons";
import { Badge, Card, EmptyState, PageHeader, PersonAvatar, ProgressBar } from "@/components/ui";
import { INSTRUCTOR_BRANCH_LABEL, THEORY_CATEGORY_LABEL, splitCsv } from "@/lib/constants";
import { instructorSummary, listInstructors } from "@/lib/instructor";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Eğitmenler" };

const FILTERS = [
  { key: "tumu", label: "Tümü" },
  { key: "direksiyon", label: "Direksiyon" },
  { key: "teorik", label: "Teorik" },
] as const;

const COLS = "minmax(200px,1fr) 168px 150px 160px 108px 104px 96px 18px";

export default async function InstructorsPage({ searchParams }: PageProps<"/app/egitmenler">) {
  const user = await requirePermission("instructor.read");
  const schoolId = user.schoolId;
  const sp = await searchParams;
  const filterKey = typeof sp.filtre === "string" && FILTERS.some((f) => f.key === sp.filtre) ? sp.filtre : "tumu";
  const branch = filterKey === "direksiyon" ? "DRIVING" : filterKey === "teorik" ? "THEORY" : undefined;
  const canWrite = can(user.role, "instructor.write");

  const [rows, summary] = await Promise.all([listInstructors(schoolId, branch), instructorSummary(schoolId)]);

  return (
    <>
      <PageHeader
        title="Eğitmenler"
        sub={`${summary.driving + summary.theory} eğitmen · ${summary.driving} direksiyon · ${summary.theory} teorik · ${summary.onLeave} izinde`}
      >
        {canWrite && <Link href="/app/egitmenler/yeni" className="btn btn-primary btn-sm"><Icon name="plus" size={15} />Eğitmen ekle</Link>}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-[18px] flex flex-col gap-1">
          <span className="stat-lbl">Haftalık ders yükü</span>
          <span className="kpi mt-1.5">{summary.totalLoadHours} saat</span>
          <span className="text-xs text-muted">kapasitenin %{summary.loadPercent}&apos;i</span>
        </div>
        <div className="card p-[18px] flex flex-col gap-1">
          <span className="stat-lbl">En yoğun eğitmen</span>
          <span className="kpi mt-1.5 truncate" title={summary.busiest?.name}>{summary.busiest?.name ?? "—"}</span>
          <span className={`text-xs ${summary.busiest && summary.busiest.percent >= 90 ? "text-danger" : "text-muted"}`}>
            {summary.busiest ? `${summary.busiest.loadHours}/${summary.busiest.capacity} saat · %${summary.busiest.percent}` : "veri yok"}
          </span>
        </div>
        <div className="card p-[18px] flex flex-col gap-1">
          <span className="stat-lbl">Ortalama sınav başarısı</span>
          <span className="kpi mt-1.5 text-success">{summary.avgSuccessRate !== null ? `%${summary.avgSuccessRate}` : "—"}</span>
          <span className="text-xs text-muted">direksiyon eğitmenleri</span>
        </div>
        <div className="card p-[18px] flex flex-col gap-1">
          <span className="stat-lbl">Kursiyer / eğitmen</span>
          <span className="kpi mt-1.5">{summary.studentsPerDrivingInstructor ?? "—"}</span>
          <span className="text-xs text-muted">direksiyon eğitmeni başına</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <Link key={f.key} href={`/app/egitmenler?filtre=${f.key}`} className="chip" data-active={f.key === filterKey}>{f.label}</Link>
        ))}
      </div>

      <Card title="Eğitmen listesi" sub={`${rows.length} eğitmen`}>
        {rows.length === 0 ? (
          <EmptyState
            icon="badge-id"
            title="Bu filtrede eğitmen yok."
            action={canWrite ? <Link href="/app/egitmenler/yeni" className="btn btn-secondary btn-sm"><Icon name="plus" size={15} />Eğitmen ekle</Link> : undefined}
          />
        ) : (
          <div className="px-5 pb-4">
            <div className="grid gap-3 items-center pb-2.5" style={{ gridTemplateColumns: COLS }}>
              {["Eğitmen", "Sınıf / branş", "Araç / derslik", "Bu hafta yük", "Kursiyer", "Başarı", "Durum", ""].map((h, i) => <div key={i} className="th">{h}</div>)}
            </div>
            {rows.map((i) => {
              const branchLabel = INSTRUCTOR_BRANCH_LABEL[i.branch] ?? i.branch;
              const classInfo = i.branch === "DRIVING"
                ? splitCsv(i.licenseClasses).join(" · ")
                : splitCsv(i.subjects).map((k) => THEORY_CATEGORY_LABEL[k] ?? k).join(" · ");
              return (
                <Link key={i.id} href={`/app/egitmenler/${i.id}`} className="grid gap-3 items-center py-3.5 border-t border-border" style={{ gridTemplateColumns: COLS }}>
                  <span className="flex items-center gap-2.5 min-w-0">
                    <PersonAvatar name={i.name} size={34} />
                    <span className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate">{i.name}</span>
                      <span className="text-xs text-muted truncate">{branchLabel}</span>
                    </span>
                  </span>
                  <span className="text-[13px] text-text-2 truncate" title={classInfo || undefined}>{classInfo || "—"}</span>
                  <span className="text-[13px] text-text-2 tabular truncate">{i.vehiclePlate ?? (i.branch === "DRIVING" ? "Atanmadı" : "—")}</span>
                  <span className="flex flex-col gap-1.5">
                    <span className="text-[13px] tabular">{i.loadHours}/{i.weeklyCapacity} saat</span>
                    <ProgressBar value={Math.min(100, i.loadPercent)} height={5} />
                  </span>
                  <span className="td tabular">{i.studentCount} kursiyer</span>
                  <span className="td tabular">{i.successRate !== null ? `%${i.successRate}` : "—"}</span>
                  <Badge kind={i.isActive ? "success" : "warning"} dot>{i.isActive ? "Aktif" : "İzinde"}</Badge>
                  <Icon name="chev-right" size={16} className="text-muted" />
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
