import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Icon } from "@/components/icons";
import { Badge, Card, Chip, EmptyState, PageHeader, PersonAvatar, ProgressBar } from "@/components/ui";
import { financeOverview, monthlySeries, studentBalances } from "@/lib/finance";
import { date, money, number } from "@/lib/format";
import { FinanceTabs } from "./tabs";

export const metadata: Metadata = { title: "Finans" };

const FILTERS = [
  { key: "tumu", label: "Tümü" },
  { key: "geciken", label: "Geciken" },
  { key: "bu-hafta", label: "Bu hafta vadesi gelen" },
  { key: "plansiz", label: "Planı olmayan" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const EMPTY: Record<FilterKey, { title: string; desc: string }> = {
  tumu: { title: "Kayıt bulunamadı.", desc: "Filtreyi ya da aramayı değiştirin." },
  geciken: { title: "Geciken ödeme yok.", desc: "Tüm taksitler vadesinde tahsil edilmiş görünüyor." },
  "bu-hafta": { title: "Bu hafta vadesi gelen taksit yok.", desc: "Önümüzdeki yedi gün içinde tahsil edilecek taksit bulunmuyor." },
  plansiz: { title: "Planı olmayan kursiyer yok.", desc: "Kayıtlı tüm kursiyerlerin ödeme planı tanımlanmış." },
};

const COLS = "minmax(180px,1fr) 44px 106px 106px 106px 118px 150px 132px 16px";

export default async function FinancePage({ searchParams }: PageProps<"/app/finans">) {
  const user = await requirePermission("finance.read");
  const canWrite = can(user.role, "finance.write");
  const sp = await searchParams;

  const filter = (FILTERS.find((f) => f.key === sp.filtre)?.key ?? "tumu") as FilterKey;
  const q = String(sp.q ?? "").trim();

  const [overview, series, all] = await Promise.all([
    financeOverview(user.schoolId),
    monthlySeries(user.schoolId),
    studentBalances(user.schoolId, filter),
  ]);

  const needle = q.toLocaleLowerCase("tr");
  const rows = q
    ? all.filter((r) => `${r.firstName} ${r.lastName}`.toLocaleLowerCase("tr").includes(needle))
    : all;

  // Grafikte çubuk yükseklikleri, dönemin en büyük değerine göre oranlanır.
  const peak = Math.max(1, ...series.flatMap((m) => [m.income, m.expense]));
  const monthLabel = new Date().toLocaleDateString("tr-TR", { month: "long" });

  return (
    <>
      <PageHeader title="Finans" sub="Tahsilat, ödeme planları, gelir ve gider">
        {canWrite && <Link href="/app/finans/giderler" className="btn btn-secondary btn-sm"><Icon name="plus" size={15} />Gider ekle</Link>}
        {canWrite && <Link href="/app/finans/tahsilat" className="btn btn-primary btn-sm"><Icon name="wallet" size={15} />Tahsilat al</Link>}
      </PageHeader>

      <FinanceTabs active="genel" />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Stat label="Bugünkü tahsilat" value={money(overview.todayTotal)} sub={`${overview.todayCount} işlem`} />
        <Stat label="Bu ay tahsilat" value={money(overview.monthIncome)} sub={`${monthLabel} · ${overview.monthCount} işlem`} tone="text-success" />
        <Stat label="Bekleyen" value={money(overview.pendingTotal)} sub={`${overview.pendingCount} taksit`} />
        <Stat label="Geciken" value={money(overview.overdueTotal)} sub={`${overview.overdueCount} taksit`} tone={overview.overdueTotal > 0 ? "text-danger" : undefined} />
        <Stat label="Bu ay gider" value={money(overview.monthExpense)} sub="araç · personel · kira" />
        <Stat label="Net durum" value={money(overview.monthNet)} sub={`yıl başından beri ${money(overview.yearIncome - overview.yearExpense)}`} tone={overview.monthNet >= 0 ? "text-blue" : "text-danger"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
        <Card className="min-w-0">
          <header className="flex items-center gap-3 px-5 pt-5 pb-3 flex-wrap">
            <h2 className="h-card">Kursiyer bazında tahsilat</h2>
            <form className="flex items-center gap-2 ml-auto">
              {filter !== "tumu" && <input type="hidden" name="filtre" value={filter} />}
              <input name="q" defaultValue={q} placeholder="Kursiyer ara…" className="input h-8 text-[13px] w-[200px]" aria-label="Kursiyer ara" />
              <button className="btn btn-secondary btn-xs">Ara</button>
            </form>
          </header>
          <div className="flex items-center gap-2 px-5 pb-3 flex-wrap">
            {FILTERS.map((f) => (
              <Chip key={f.key} active={f.key === filter} href={`/app/finans?filtre=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>
                {f.label}
              </Chip>
            ))}
            <span className="ml-auto text-xs text-muted">{number(rows.length)} kursiyer</span>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon="wallet"
              title={EMPTY[filter].title}
              desc={q ? "Aramaya uyan kursiyer yok." : EMPTY[filter].desc}
            />
          ) : (
            <div className="px-5 pb-5 overflow-x-auto">
              <div className="min-w-[940px]">
                <div className="grid gap-3 items-center pb-2.5" style={{ gridTemplateColumns: COLS }}>
                  <div className="th">Kursiyer</div>
                  <div className="th">Sınıf</div>
                  <div className="th">Toplam</div>
                  <div className="th">Ödenen</div>
                  <div className="th">Kalan</div>
                  <div className="th">Sonraki vade</div>
                  <div className="th">İlerleme</div>
                  <div className="th">Durum</div>
                  <div />
                </div>
                {rows.map((r) => {
                  const name = `${r.firstName} ${r.lastName}`;
                  const status = !r.planId
                    ? { label: "Plan yok", kind: "warning" as const }
                    : r.overdueCount > 0
                      ? { label: `${r.overdueDays} gün gecikti`, kind: "danger" as const }
                      : r.rest === 0
                        ? { label: "Tamamlandı", kind: "success" as const }
                        : { label: "Güncel", kind: "success" as const };
                  return (
                    <Link key={r.studentId} href={`/app/finans/kursiyer/${r.studentId}`} className="grid gap-3 items-center py-3 border-t border-border" style={{ gridTemplateColumns: COLS }}>
                      <span className="flex items-center gap-2.5 min-w-0">
                        <PersonAvatar name={name} size={32} />
                        <span className="text-sm font-semibold truncate">{name}</span>
                      </span>
                      <span><Badge kind="brand">{r.licenseClass}</Badge></span>
                      <span className="text-[13px] tabular">{r.planId ? money(r.total) : "—"}</span>
                      <span className="text-[13px] tabular font-semibold text-success">{r.planId ? money(r.paid) : "—"}</span>
                      <span className="text-[13px] tabular font-semibold">{r.planId ? money(r.rest) : "—"}</span>
                      <span className="text-[13px] tabular text-text-2">{r.nextDueAt ? date(r.nextDueAt) : "—"}</span>
                      <span className="flex flex-col gap-1.5">
                        <ProgressBar value={r.percent} height={5} />
                        <span className="text-xs text-muted tabular">%{r.percent} ödendi</span>
                      </span>
                      <span><Badge kind={status.kind} dot>{status.label}</Badge></span>
                      <span className="text-muted"><Icon name="chev-right" size={16} /></span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Gelir / gider" sub="son 6 ay">
            <div className="px-5 pb-5 pt-4">
              <div className="flex items-end gap-2.5 h-[136px]">
                {series.map((m) => (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                    <div className="w-full flex items-end gap-1 h-[118px]">
                      <div className="flex-1 rounded-t-[5px] bg-blue" style={{ height: `${Math.max(2, (m.income / peak) * 100)}%` }} title={`Gelir ${money(m.income)}`} />
                      <div className="flex-1 rounded-t-[5px] bg-blue-100" style={{ height: `${Math.max(2, (m.expense / peak) * 100)}%` }} title={`Gider ${money(m.expense)}`} />
                    </div>
                    <span className="text-xs text-muted">{m.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3.5 border-t border-border">
                <Legend color="bg-blue" label="Gelir" />
                <Legend color="bg-blue-100" label="Gider" />
                <span className="ml-auto text-[13px] font-semibold tabular">{money(series[series.length - 1]?.net ?? 0)} net</span>
              </div>
            </div>
          </Card>

          <Card title="Bu ayın özeti">
            <div className="px-5 pb-5 pt-1 flex flex-col">
              <SummaryRow label="Tahsil edilen" value={money(overview.monthIncome)} />
              <SummaryRow label="Gider" value={`− ${money(overview.monthExpense)}`} />
              <SummaryRow label="Net" value={money(overview.monthNet)} strong />
              <SummaryRow label="Aktif kursiyer" value={number(overview.activeStudents)} />
              <SummaryRow
                label="Kursiyer başına aylık gelir"
                value={overview.activeStudents ? money(Math.round(overview.monthIncome / overview.activeStudents)) : "—"}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className="card p-[18px] flex flex-col gap-1">
      <span className="stat-lbl">{label}</span>
      <span className={`kpi mt-1.5 ${tone ?? ""}`}>{value}</span>
      <span className="text-xs text-muted">{sub}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-text-2">
      <span className={`w-2.5 h-2.5 rounded-[3px] ${color}`} />{label}
    </span>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className={`text-[13px] ${strong ? "font-semibold" : "text-text-2"}`}>{label}</span>
      <span className={`text-[13px] tabular ${strong ? "font-bold" : "font-semibold"}`}>{value}</span>
    </div>
  );
}
