import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Badge, Card, PersonAvatar, ProgressBar } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";
import { reportsOverview, resolveReportRange } from "@/lib/reports";
import { money, number } from "@/lib/format";

export const metadata: Metadata = { title: "Raporlar" };

export default async function ReportsPage({ searchParams }: PageProps<"/app/raporlar">) {
  const user = await requirePermission("report.read");
  const canExport = can(user.role, "export");
  const sp = await searchParams;
  const flat = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));

  const range = resolveReportRange(flat);
  const data = await reportsOverview(user.schoolId, range);
  const { kpis, funnel, classDistribution, instructorPerformance, heatmap, quickAnswers } = data;

  const exportHref = `/app/raporlar/export?aralik=${range.key}${range.key === "ozel" ? `&baslangic=${flat.baslangic}&bitis=${flat.bitis}` : ""}`;
  const todayIso = new Date().toISOString().slice(0, 10);
  const sixMonthsAgoIso = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().slice(0, 10);

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="h-page">Kurs performans merkezi</h1>
          <span className="text-text-2">{range.label} · tüm veriler kurs bazında</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/app/raporlar" className="chip" data-active={range.key === "6ay"}>6 ay</Link>
          <Link href="/app/raporlar?aralik=yil" className="chip" data-active={range.key === "yil"}>Yıl</Link>
          <form className="flex items-center gap-1.5">
            <input type="hidden" name="aralik" value="ozel" />
            <input type="date" name="baslangic" defaultValue={range.key === "ozel" ? flat.baslangic : sixMonthsAgoIso} max={todayIso} className="input h-8 text-[13px] w-[140px]" />
            <span className="text-muted text-xs">–</span>
            <input type="date" name="bitis" defaultValue={range.key === "ozel" ? flat.bitis : todayIso} max={todayIso} className="input h-8 text-[13px] w-[140px]" />
            <button className="chip" data-active={range.key === "ozel"}>Özel</button>
          </form>
          {canExport && (
            <a href={exportHref} className="btn btn-secondary btn-sm"><Icon name="download" size={15} />CSV</a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Stat label="Toplam kursiyer" value={number(kpis.totalStudents)} sub={`${kpis.activeCount} aktif · ${kpis.graduatedCount} mezun`} />
        <Stat label="Kayıt dönüşümü" value={`%${kpis.conversion}`} sub={kpis.closedInRange ? `${kpis.closedInRange} kapanan adaydan ${kpis.wonInRange} kayıt` : "seçili aralıkta kapanan aday yok"} />
        <Stat label="e-Sınav başarısı" value={kpis.eTestPass !== null ? `%${kpis.eTestPass}` : "—"} sub="seçili aralık" tone={kpis.eTestPass !== null && kpis.eTestPass >= 70 ? "text-success" : undefined} />
        <Stat label="Direksiyon başarısı" value={kpis.drivingPass !== null ? `%${kpis.drivingPass}` : "—"} sub="seçili aralık" tone={kpis.drivingPass !== null && kpis.drivingPass < 70 ? "text-warning" : undefined} />
        <Stat label="Kursiyer başına gelir" value={money(kpis.revenuePerStudent)} sub="ortalama paket" />
        <Stat label="Tahsilat oranı" value={`%${kpis.collectionRate}`} sub="planlanan / tahsil edilen" />
      </div>

      <Card>
        <header className="flex items-center gap-2.5 px-5 pt-5 pb-1">
          <h2 className="h-card">Tek ekranda cevaplar</h2>
          <span className="text-xs text-muted">yönetim soruları · tıklayınca ilgili rapora gider</span>
        </header>
        <div className="px-5 pb-4 pt-2 grid grid-cols-1 md:grid-cols-2 gap-x-8">
          {quickAnswers.map((q) => (
            <Link key={q.q} href={q.href} className="flex items-center gap-2.5 py-3 border-t border-border">
              <span className="w-7 h-7 rounded-sm bg-surface-2 text-text-2 flex items-center justify-center shrink-0"><Icon name={q.icon as IconName} size={15} /></span>
              <span className="text-[13px] font-semibold min-w-0 truncate">{q.q}</span>
              <span className="ml-auto text-[13px] text-text-2 truncate">{q.a}</span>
              <Icon name="chev-right" size={15} className="text-muted shrink-0" />
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4 items-start">
        <Card title="Kayıt hunisi" sub={`${range.label} · adaydan kayda`}>
          <div className="px-5 pb-5 pt-1">
            {funnel.every((f) => f.count === 0) ? (
              <p className="text-[13px] text-text-2 py-4">Seçili aralıkta aday kaydı yok.</p>
            ) : funnel.map((f) => (
              <div key={f.key} className="flex items-center gap-3 py-2.5 border-t border-border first:border-0">
                <span className="text-[13px] w-[136px] shrink-0">{f.label}</span>
                <span className="grow"><ProgressBar value={f.percent} height={9} grad /></span>
                <span className="text-[13px] font-semibold tabular w-[40px] text-right">{f.count}</span>
                <span className="text-xs text-muted tabular w-[38px] text-right">%{f.percent}</span>
              </div>
            ))}
            <p className="text-xs text-muted pt-2 mt-1 border-t border-border leading-relaxed">
              Kaybedilen adaylar yalnızca ilk basamakta sayılır; hangi aşamada kaybedildikleri ayrıca izlenmez.
            </p>
          </div>
        </Card>

        <Card title="Ehliyet sınıfı dağılımı" sub="tüm aktif ve mezun kursiyerler">
          <div className="px-5 pb-5 pt-1">
            {classDistribution.length === 0 ? (
              <p className="text-[13px] text-text-2 py-4">Kayıtlı kursiyer yok.</p>
            ) : (
              <>
                <div className="flex h-3.5 rounded-full overflow-hidden gap-0.5">
                  {classDistribution.map((c) => <span key={c.code} className={c.color} style={{ width: `${c.percent}%` }} />)}
                </div>
                <div className="flex flex-col mt-3.5">
                  {classDistribution.map((c) => (
                    <div key={c.code} className="flex items-center gap-2.5 py-2 border-t border-border first:border-0">
                      <span className={`w-2.5 h-2.5 rounded-[3px] shrink-0 ${c.color}`} />
                      <span className="text-[13px]">{c.code} sınıfı</span>
                      <span className="ml-auto text-[13px] font-semibold tabular">{c.count}</span>
                      <span className="text-xs text-muted tabular w-[38px] text-right">%{c.percent}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4 items-start">
        <Card>
          <header className="flex items-center gap-2.5 px-5 pt-5 pb-1">
            <h2 className="h-card">Eğitmen performansı</h2>
            <span className="text-xs text-muted">direksiyon eğitmenleri · bu hafta</span>
          </header>
          {instructorPerformance.length === 0 ? (
            <p className="px-5 pb-5 pt-2 text-[13px] text-text-2">Direksiyon eğitmeni yok.</p>
          ) : (
            <div className="px-5 pb-5 pt-2 overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid gap-3 pb-2" style={{ gridTemplateColumns: "minmax(150px,1fr) 96px 108px 130px" }}>
                  <div className="th">Eğitmen</div>
                  <div className="th">Kursiyer</div>
                  <div className="th">Sınav başarısı</div>
                  <div className="th">Doluluk</div>
                </div>
                {instructorPerformance.map((i) => (
                  <Link
                    key={i.id} href={`/app/egitmenler/${i.id}`}
                    className="grid gap-3 items-center py-3 border-t border-border first:border-0"
                    style={{ gridTemplateColumns: "minmax(150px,1fr) 96px 108px 130px" }}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <PersonAvatar name={i.name} size={30} />
                      <span className="text-[13.5px] font-semibold truncate">{i.name}</span>
                      {!i.isActive && <Badge kind="neutral">İzinli</Badge>}
                    </span>
                    <span className="text-[13px] tabular text-text-2">{i.studentCount} kursiyer</span>
                    <span className={`text-[13px] tabular font-semibold ${i.successRate !== null ? (i.successRate >= 70 ? "text-success" : "text-warning") : "text-muted"}`}>
                      {i.successRate !== null ? `%${i.successRate}` : "—"}
                    </span>
                    <span className="flex flex-col gap-1">
                      <ProgressBar value={Math.min(100, i.loadPercent)} height={5} />
                      <span className="text-xs text-muted tabular">%{i.loadPercent} doluluk</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <header className="flex items-center gap-2.5 px-5 pt-5 pb-1">
            <h2 className="h-card">Ders yoğunluğu</h2>
            <span className="text-xs text-muted">gün / saat · {range.label}</span>
          </header>
          <div className="px-5 pb-5 pt-3">
            <div className="flex flex-col gap-1">
              {heatmap.grid.map((rowVals, d) => (
                <div key={d} className="grid gap-1 items-center" style={{ gridTemplateColumns: `36px repeat(${heatmap.hours.length}, 1fr)` }}>
                  <span className="text-xs text-muted">{heatmap.dayLabels[d]}</span>
                  {rowVals.map((v, h) => <span key={h} className={`h-[20px] rounded-[4px] ${HEAT_CLASS[v]}`} />)}
                </div>
              ))}
              <div className="grid gap-1 mt-1.5" style={{ gridTemplateColumns: `36px repeat(${heatmap.hours.length}, 1fr)` }}>
                <span />
                {heatmap.hours.map((h) => <span key={h} className="text-[11px] text-muted tabular text-center">{h}</span>)}
              </div>
            </div>
            <div className="flex items-start gap-2 mt-3.5 pt-3.5 border-t border-border">
              <Icon name="info" size={15} className="text-muted shrink-0 mt-0.5" />
              <span className="text-[13px] text-text-2 leading-relaxed">{heatmap.note}</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

const HEAT_CLASS: Record<number, string> = {
  0: "bg-surface-2", 1: "bg-blue-050", 2: "bg-blue-100", 3: "bg-blue-300", 4: "bg-blue", 5: "bg-blue-800",
};

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className="card p-[18px] flex flex-col gap-1">
      <span className="stat-lbl">{label}</span>
      <span className={`kpi mt-1.5 ${tone ?? ""}`}>{value}</span>
      <span className="text-xs text-muted">{sub}</span>
    </div>
  );
}
