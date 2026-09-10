import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { Icon } from "@/components/icons";
import { Badge, Card, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { VEHICLE_COST_LABEL, VEHICLE_STATUS_LABEL, VEHICLE_USAGE_LABEL } from "@/lib/constants";
import { listVehicles, vehicleCosts, vehicleSummary } from "@/lib/vehicle";
import { date, money, number } from "@/lib/format";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Araçlar" };

const COST_TYPES = ["FUEL", "SERVICE", "TIRE", "INSURANCE", "REPAIR", "PENALTY", "OTHER"] as const;
const COST_COLS = `132px repeat(${COST_TYPES.length}, 1fr) 132px 120px`;

export default async function VehiclesPage({ searchParams }: PageProps<"/app/araclar">) {
  const user = await requirePermission("vehicle.read");
  const schoolId = user.schoolId;
  const canWrite = can(user.role, "vehicle.write");
  const sp = await searchParams;
  // Ay seçimi: 0 = bu ay. Ayın başındayken giderler tam ay, kilometre birkaç günlük olduğu
  // için km başına maliyet yanıltıcı yükselir; kullanıcı tam bir aya geçebilsin diye seçici var.
  const monthsAgo = Math.max(0, Math.min(11, Number(sp.ay) || 0));

  const [vehicles, summary, costs] = await Promise.all([
    listVehicles(schoolId),
    vehicleSummary(schoolId, monthsAgo),
    vehicleCosts(schoolId, monthsAgo),
  ]);

  const monthLabel = costs.from.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    return { value: i, label: d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }) };
  });

  return (
    <>
      <PageHeader
        title="Araçlar"
        sub={`${summary.total} araç · ${summary.active} aktif · ${summary.maintenance} bakımda · ${summary.examVehicles} sınav aracı`}
      >
        {canWrite && <Link href="/app/araclar/yeni" className="btn btn-primary btn-sm"><Icon name="plus" size={15} />Araç ekle</Link>}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-[18px] flex flex-col gap-1">
          <span className="stat-lbl">{monthsAgo === 0 ? "Bu ayki araç maliyeti" : "Aylık araç maliyeti"}</span>
          <span className="kpi mt-1.5">{money(summary.monthlyCost)}</span>
          <span className="text-xs text-muted">
            {monthLabel}{summary.changePercent !== null ? ` · önceki aya göre ${summary.changePercent >= 0 ? "+" : ""}%${summary.changePercent}` : ""}
          </span>
        </div>
        <div className="card p-[18px] flex flex-col gap-1">
          <span className="stat-lbl">Km başına maliyet</span>
          <span className="kpi mt-1.5">{summary.avgPerKm !== null ? money(summary.avgPerKm, { decimals: true }) : "—"}</span>
          <span className="text-xs text-muted">{summary.avgPerKm !== null ? "filo ortalaması" : "ay için yeterli ders verisi yok"}</span>
        </div>
        <div className="card p-[18px] flex flex-col gap-1">
          <span className="stat-lbl">Ortalama doluluk</span>
          <span className="kpi mt-1.5">%{summary.avgUsage}</span>
          <span className="text-xs text-muted">bu haftaki ders saatine göre</span>
        </div>
        <div className="card p-[18px] flex flex-col gap-1">
          <span className="stat-lbl">Bakım / muayene uyarısı</span>
          <span className={`kpi mt-1.5 ${summary.upcomingMaintenance > 0 ? "text-warning" : ""}`}>{summary.upcomingMaintenance}</span>
          <span className="text-xs text-muted">araç ilgilenilmeyi bekliyor</span>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <EmptyState
            icon="car"
            title="Henüz araç eklenmemiş."
            desc="Direksiyon dersi planlayabilmek için en az bir araç gerekir."
            action={canWrite ? <Link href="/app/araclar/yeni" className="btn btn-secondary btn-sm"><Icon name="plus" size={15} />Araç ekle</Link> : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const st = VEHICLE_STATUS_LABEL[v.status] ?? VEHICLE_STATUS_LABEL.ACTIVE;
            const alertColor = v.alert.kind === "danger" ? "text-danger" : v.alert.kind === "warning" ? "text-warning" : "text-muted";
            return (
              <Link key={v.id} href={`/app/araclar/${v.id}`} className="card p-5 flex flex-col">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-md bg-blue-050 text-blue flex items-center justify-center shrink-0"><Icon name="car" size={21} /></span>
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-display text-[17px] font-bold tracking-[-0.01em] tabular">{v.plate}</span>
                    <span className="text-xs text-text-2 truncate">{[v.brand, v.model].filter(Boolean).join(" ")}{v.year ? ` · ${v.year}` : ""}</span>
                  </span>
                  <span className="ml-auto flex flex-col items-end gap-1.5">
                    <Badge kind={st.kind} dot>{st.label}</Badge>
                    <Badge kind="brand">{v.licenseClass} sınıfı</Badge>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-2.5 gap-y-3 mt-4">
                  <Field label="Kilometre" value={`${number(v.km)} km`} />
                  <Field label="Kullanım" value={VEHICLE_USAGE_LABEL[v.usage] ?? v.usage} />
                  <Field label="Eğitmen" value={v.instructorName ?? "Atanmadı"} />
                  <Field label="Muayene" value={v.inspectionUntil ? date(v.inspectionUntil) : "—"} />
                </div>

                <div className="mt-4 pt-3.5 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] text-text-2">Bu hafta doluluk</span>
                    <span className="text-[13px] font-semibold tabular ml-auto">%{v.usagePercent}</span>
                  </div>
                  <ProgressBar value={v.usagePercent} height={6} />
                  <div className={`flex items-center gap-1.5 mt-3 ${alertColor}`}>
                    <Icon name="wrench" size={15} />
                    <span className="text-[13px] font-semibold">{v.alert.text}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Card>
        <header className="flex items-center gap-2.5 px-5 pt-5 pb-3 flex-wrap">
          <h2 className="h-card">Araç maliyet takibi</h2>
          <form className="flex items-center gap-2">
            <select name="ay" defaultValue={String(monthsAgo)} className="input h-8 text-[13px] w-[160px]" aria-label="Ay seç">
              {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <button className="btn btn-secondary btn-xs">Göster</button>
          </form>
          <span className="ml-auto text-xs text-muted">Km başına maliyet, ders saati × 25 km varsayımıyla; ayda 10 saatten az kullanılan araçta hesaplanmaz.</span>
        </header>
        <div className="px-5 pb-5 overflow-x-auto">
          <div className="min-w-[880px]">
            <div className="grid gap-3 items-center pb-2.5" style={{ gridTemplateColumns: COST_COLS }}>
              <div className="th">Plaka</div>
              {COST_TYPES.map((t) => <div key={t} className="th">{VEHICLE_COST_LABEL[t]}</div>)}
              <div className="th">Toplam</div>
              <div className="th">Km başına</div>
            </div>
            {costs.rows.map((r) => (
              <Link key={r.vehicleId} href={`/app/araclar/${r.vehicleId}`} className="grid gap-3 items-center py-3 border-t border-border" style={{ gridTemplateColumns: COST_COLS }}>
                <span className="text-[13px] font-semibold tabular">{r.plate}</span>
                {COST_TYPES.map((t) => (
                  <span key={t} className="text-[13px] text-text-2 tabular">{r.byType[t] ? money(r.byType[t]) : "—"}</span>
                ))}
                <span className="text-[13px] font-semibold tabular">{money(r.total)}</span>
                <span className="text-[13px] font-semibold tabular">{r.perKm !== null ? money(r.perKm, { decimals: true }) : "—"}</span>
              </Link>
            ))}
            <div className="grid gap-3 items-center pt-3.5 mt-1 border-t-2 border-border" style={{ gridTemplateColumns: COST_COLS }}>
              <span className="text-[13px] font-bold">Toplam</span>
              {COST_TYPES.map((t) => (
                <span key={t} className="text-[13px] font-bold tabular">
                  {money(costs.rows.reduce((s, r) => s + (r.byType[t] ?? 0), 0))}
                </span>
              ))}
              <span className="text-[13px] font-bold tabular">{money(costs.grandTotal)}</span>
              <span className="text-[13px] font-bold tabular">{costs.avgPerKm !== null ? money(costs.avgPerKm, { decimals: true }) : "—"}</span>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="stat-lbl">{label}</div>
      <div className="text-[13px] font-semibold mt-0.5 tabular truncate">{value}</div>
    </div>
  );
}
