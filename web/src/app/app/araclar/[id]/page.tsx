import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getVehicleDetail } from "@/lib/vehicle";
import { Icon } from "@/components/icons";
import { Badge, Card, PageHeader } from "@/components/ui";
import { VEHICLE_COST_LABEL, VEHICLE_STATUS_LABEL, VEHICLE_USAGE_LABEL } from "@/lib/constants";
import { date, fullName, money, number, time } from "@/lib/format";
import { can } from "@/lib/permissions";
import { toggleMaintenanceAction } from "@/app/actions/vehicles";
import { CostForm } from "./CostForm";

export async function generateMetadata({ params }: PageProps<"/app/araclar/[id]">): Promise<Metadata> {
  const { id } = await params;
  const user = await requirePermission("vehicle.read");
  const d = await getVehicleDetail(user.schoolId, id);
  return { title: d?.vehicle.plate ?? "Araç" };
}

export default async function VehicleDetailPage({ params, searchParams }: PageProps<"/app/araclar/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requirePermission("vehicle.read");
  const d = await getVehicleDetail(user.schoolId, id);
  if (!d) notFound();

  const { vehicle: v, upcoming, costs, doneCount, totalCost } = d;
  const canWrite = can(user.role, "vehicle.write");
  const st = VEHICLE_STATUS_LABEL[v.status] ?? VEHICLE_STATUS_LABEL.ACTIVE;
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const notice = typeof sp.olusturuldu === "string" ? "Araç eklendi."
    : typeof sp.guncellendi === "string" ? "Araç bilgileri güncellendi."
    : typeof sp.gider === "string" ? "Gider kaydedildi."
    : sp.bakim === "girdi" ? `Araç bakıma alındı.${sp.etkilenen && sp.etkilenen !== "0" ? ` ${sp.etkilenen} planlı ders başka araca taşınmalı.` : ""}`
    : sp.bakim === "cikti" ? "Araç bakımdan çıkarıldı, tekrar kullanılabilir."
    : null;

  const serviceLeft = v.nextServiceKm !== null ? v.nextServiceKm - v.km : null;

  return (
    <>
      <PageHeader title="Araç" sub={`Araçlar / ${v.plate}`}>
        <Link href="/app/araclar" className="btn btn-secondary btn-sm"><Icon name="car" size={15} />Araçlar</Link>
        {canWrite && <Link href={`/app/araclar/yeni?duzenle=${v.id}`} className="btn btn-secondary btn-sm"><Icon name="edit" size={15} />Düzenle</Link>}
      </PageHeader>

      {notice && (
        <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-sm text-[13px] ${sp.bakim === "girdi" ? "bg-warning-bg" : "bg-success-bg"}`}>
          <Icon name={sp.bakim === "girdi" ? "alert" : "check-circle"} size={16} className={sp.bakim === "girdi" ? "text-warning" : "text-success"} />
          {notice}
        </div>
      )}

      <Card className="p-[22px]">
        <div className="flex items-start gap-[18px] flex-wrap">
          <span className="w-[54px] h-[54px] rounded-md bg-blue-050 text-blue flex items-center justify-center shrink-0"><Icon name="car" size={26} /></span>
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="h-section tabular">{v.plate}</h1>
              <Badge kind="brand">{v.licenseClass} sınıfı</Badge>
              <Badge kind={st.kind} dot>{st.label}</Badge>
              <Badge kind="neutral">{VEHICLE_USAGE_LABEL[v.usage] ?? v.usage}</Badge>
            </div>
            <div className="flex gap-4 items-center flex-wrap text-[13px] text-text-2">
              <span>{[v.brand, v.model].filter(Boolean).join(" ") || "Marka/model girilmedi"}{v.year ? ` · ${v.year}` : ""}</span>
              {v.fuelType && <span className="flex items-center gap-1.5"><Icon name="fuel" size={15} className="text-muted" />{v.fuelType}</span>}
              {v.instructor && (
                <Link href={`/app/egitmenler/${v.instructor.id}`} className="flex items-center gap-1.5 hover:text-blue">
                  <Icon name="badge-id" size={15} className="text-muted" />{v.instructor.name}
                </Link>
              )}
            </div>
          </div>
          {canWrite && (
            <form action={toggleMaintenanceAction} className="ml-auto">
              <input type="hidden" name="vehicleId" value={v.id} />
              <button className={`btn btn-sm ${v.status === "MAINTENANCE" ? "btn-secondary" : "btn-danger"}`}>
                <Icon name="wrench" size={15} />
                {v.status === "MAINTENANCE" ? "Bakımdan çıkar" : "Bakıma al"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-5 pt-[18px] border-t border-border flex gap-6 flex-wrap">
          <Metric label="Kilometre" value={`${number(v.km)} km`} />
          <Metric label="Sonraki bakım" value={serviceLeft !== null ? `${number(Math.max(0, serviceLeft))} km sonra` : "—"} tone={serviceLeft !== null && serviceLeft <= 500 ? "text-warning" : ""} />
          <Metric label="Muayene" value={v.inspectionUntil ? date(v.inspectionUntil) : "—"} />
          <Metric label="Sigorta" value={v.insuranceUntil ? date(v.insuranceUntil) : "—"} />
          <Metric label="Tamamlanan ders" value={String(doneCount)} />
          <Metric label="Toplam gider" value={money(totalCost)} />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 items-start">
        <div className="flex flex-col gap-4">
          <Card title="Yaklaşan dersler" sub={`${upcoming.length} planlı ders`}>
            {upcoming.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-text-2 text-center">Bu araca planlanmış ders yok.</p>
            ) : (
              <div className="px-5 pb-4">
                {upcoming.map((l) => (
                  <Link key={l.id} href={`/app/dersler/${l.id}`} className="flex items-center gap-3 py-2.5 border-t border-border first:border-t-0">
                    <span className="flex flex-col w-[86px] shrink-0">
                      <span className="text-[13.5px] font-semibold tabular">{date(l.startsAt)}</span>
                      <span className="text-xs text-muted tabular">{time(l.startsAt)}–{time(l.endsAt)}</span>
                    </span>
                    <span className="text-[13px] font-medium truncate">{fullName(l.student)}</span>
                    <span className="text-xs text-muted truncate ml-auto">{l.instructor.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card title="Gider geçmişi" sub={`Son ${costs.length} kayıt · toplam ${money(totalCost)}`}>
            {costs.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-text-2 text-center">Bu araca gider kaydı girilmemiş.</p>
            ) : (
              <div className="px-5 pb-4">
                <div className="grid grid-cols-[110px_120px_110px_1fr] gap-3 items-center pb-2.5">
                  {["Tarih", "Tür", "Tutar", "Not / km"].map((h) => <div key={h} className="th">{h}</div>)}
                </div>
                {costs.map((c) => (
                  <div key={c.id} className="grid grid-cols-[110px_120px_110px_1fr] gap-3 items-center py-2.5 border-t border-border">
                    <span className="text-[13px] tabular">{date(c.occurredAt)}</span>
                    <span className="text-[13px] text-text-2">{VEHICLE_COST_LABEL[c.type] ?? c.type}</span>
                    <span className="text-[13px] font-semibold tabular">{money(c.amount)}</span>
                    <span className="text-xs text-muted truncate">
                      {[c.note, c.km !== null ? `${number(c.km)} km` : null].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {canWrite ? (
          <Card title="Gider ekle" sub="Yakıt, bakım, lastik, sigorta, muayene">
            <CostForm vehicleId={v.id} currentKm={v.km} today={todayIso} />
          </Card>
        ) : (
          <Card title="Gider ekle" sub="Yetkiniz yok">
            <p className="px-5 py-6 text-[13px] text-text-2 leading-relaxed">
              Araç giderlerini yalnızca kurs sahibi ve yönetici girebilir.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="stat-lbl">{label}</span>
      <span className={`font-display text-[17px] font-semibold tabular ${tone}`}>{value}</span>
    </div>
  );
}
