import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { advanceStageAction } from "@/app/actions/leads";
import { Badge, Card, EmptyState, Notice, PageHeader, PersonAvatar, ProgressBar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { LEAD_SOURCE_LABEL } from "@/lib/constants";
import { crmSummary, followUpQueue, pipeline, sourceBreakdown } from "@/lib/crm";
import { date, number } from "@/lib/format";
import { CrmTabs } from "./tabs";

export const metadata: Metadata = { title: "CRM" };

/** "2 saat önce", "dün", "5 gün önce" — kart üzerinde tarih yerine tazelik okunur. */
function ago(d: Date | null) {
  if (!d) return "temas yok";
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} dk önce`;
  if (mins < 24 * 60) return `${Math.floor(mins / 60)} saat önce`;
  const days = Math.floor(mins / (24 * 60));
  return days === 1 ? "dün" : `${days} gün önce`;
}

export default async function CrmPage({ searchParams }: PageProps<"/app/crm">) {
  const user = await requirePermission("lead.read");
  const canWrite = can(user.role, "lead.write");
  const sp = await searchParams;

  const [cols, summary, follow, sources] = await Promise.all([
    pipeline(user.schoolId),
    crmSummary(user.schoolId),
    followUpQueue(user.schoolId, 6),
    sourceBreakdown(user.schoolId),
  ]);

  const monthDelta = summary.wonThisMonth - summary.wonPrevMonth;

  return (
    <>
      <PageHeader
        title="CRM · Ön kayıtlar"
        sub={`${number(summary.open)} açık aday · bu ay ${summary.wonThisMonth} kayıt · dönüşüm %${summary.conversion}`}
      >
        {canWrite && <Link href="/app/crm/yeni" className="btn btn-primary btn-sm"><Icon name="plus" size={15} />Ön kayıt ekle</Link>}
      </PageHeader>

      <CrmTabs active="pipeline" />

      {sp.ilerletildi && <Notice kind="success">{sp.ilerletildi} bir sonraki aşamaya taşındı.</Notice>}
      {sp.ilerletilemedi && <Notice kind="warning">Aday son aşamada; kayıt ya da kayıp kararını aday kartından verin.</Notice>}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Stat label="Açık aday" value={number(summary.open)} sub="huninin içinde" />
        <Stat
          label="Bu ay kayıt" value={number(summary.wonThisMonth)}
          sub={`geçen ay ${summary.wonPrevMonth}${monthDelta !== 0 ? ` · ${monthDelta > 0 ? "+" : ""}${monthDelta}` : ""}`}
          tone="text-success"
        />
        <Stat label="Dönüşüm oranı" value={`%${summary.conversion}`} sub="kapanmış adaylarda" />
        <Stat
          label="Takip gecikmesi" value={number(summary.dueCount)}
          sub="aday geri dönüş bekliyor" tone={summary.dueCount > 0 ? "text-danger" : undefined}
        />
        <Stat
          label="Ortalama kapanış"
          value={summary.avgDays !== null ? `${summary.avgDays.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} gün` : "—"}
          sub="ilk temastan kayda"
        />
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="grid gap-3.5 items-start min-w-[1320px]" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
          {cols.map((c) => (
            <div key={c.key} className="flex flex-col gap-2.5 min-w-0">
              <div className="flex items-center gap-2 px-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="text-[13.5px] font-semibold truncate">{c.label}</span>
                <span className="ml-auto text-[13px] text-muted tabular">{c.total}</span>
              </div>
              <div className="rounded-md bg-surface-2 p-2.5 flex flex-col gap-2.5 min-h-[280px]">
                {c.leads.length === 0 && <span className="text-[13px] text-muted text-center py-6">Aday yok</span>}
                {c.leads.map((l) => {
                  const due = !!l.nextFollowUpAt && l.nextFollowUpAt < new Date();
                  return (
                    <div key={l.id} className="rounded-sm bg-surface border border-border p-3 flex flex-col gap-2">
                      <Link href={`/app/crm/${l.id}`} className="flex items-center gap-2 min-w-0">
                        <PersonAvatar name={l.name} size={26} />
                        <span className="text-[13.5px] font-semibold truncate">{l.name}</span>
                      </Link>
                      <div className="flex items-center gap-1.5 text-[13px] text-muted min-w-0">
                        {l.licenseClass && <Badge kind="brand">{l.licenseClass}</Badge>}
                        <span className="truncate">{LEAD_SOURCE_LABEL[l.source] ?? l.source}</span>
                        <span className="ml-auto shrink-0">{ago(l.lastContactAt)}</span>
                      </div>
                      {due && c.key !== "WON" && (
                        <span className="flex items-center gap-1.5 text-[13px] text-warning font-semibold">
                          <Icon name="clock" size={13} />Takip zamanı geldi
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="btn btn-ghost btn-xs" aria-label="Ara"><Icon name="phone" size={14} /></a>
                        <a
                          href={`https://wa.me/9${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                          className="btn btn-ghost btn-xs" aria-label="WhatsApp"
                        ><Icon name="whatsapp" size={14} /></a>
                        {canWrite && c.key !== "MEETING" && c.key !== "WON" && (
                          <form action={advanceStageAction} className="ml-auto">
                            <input type="hidden" name="leadId" value={l.id} />
                            <button className="btn btn-secondary btn-xs">İlerlet</button>
                          </form>
                        )}
                        {(c.key === "MEETING" || c.key === "WON") && (
                          <Link href={`/app/crm/${l.id}`} className="btn btn-secondary btn-xs ml-auto">Aç</Link>
                        )}
                      </div>
                    </div>
                  );
                })}
                {c.total > c.leads.length && (
                  <Link href={`/app/crm/liste?asama=${c.key}`} className="text-[13px] text-muted text-center py-1.5">
                    +{c.total - c.leads.length} aday
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <Card>
          <header className="flex items-center gap-2.5 px-5 pt-5">
            <h2 className="h-card">Kaybetmeden önce</h2>
            {follow.length > 0 && <Badge kind="danger" dot>{follow.length} aday</Badge>}
            <Link href="/app/on-kayitlar" className="ml-auto text-[13px] font-semibold text-blue">Takip listesi →</Link>
          </header>
          <p className="px-5 pt-1.5 text-[13px] text-text-2 leading-relaxed">
            Geri dönüş yapılmayan adaylar. Zamanında aranmayan aday, kaybedilen kayıttır.
          </p>
          {follow.length === 0 ? (
            <EmptyState icon="check-circle" title="Bekleyen takip yok." desc="Tüm adaylara zamanında dönülmüş." />
          ) : (
            <div className="px-5 pb-5 pt-1">
              {follow.map(({ lead, due, dueDays, stale }) => (
                <div key={lead.id} className="flex items-start gap-3 py-3 border-t border-border">
                  <PersonAvatar name={lead.name} size={30} />
                  <Link href={`/app/crm/${lead.id}`} className="flex flex-col gap-0.5 min-w-0 grow">
                    <span className="text-[13.5px] font-semibold truncate">{lead.name}</span>
                    <span className="text-[13px] text-text-2 leading-snug">
                      {due
                        ? `Takip tarihi ${dueDays} gün geçti (${date(lead.nextFollowUpAt!)}).`
                        : `${stale} gündür temas edilmedi.`}
                    </span>
                  </Link>
                  <a
                    href={`https://wa.me/9${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="btn btn-secondary btn-xs shrink-0"
                  ><Icon name="whatsapp" size={13} />WhatsApp</a>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Aday kaynakları" sub="son 90 gün">
          <div className="px-5 pb-5 pt-1">
            {sources.rows.length === 0 ? (
              <p className="text-[13px] text-text-2 py-4">Son 90 günde aday kaydı yok.</p>
            ) : sources.rows.map((r) => (
              <div key={r.source} className="flex items-center gap-3 py-2.5 border-t border-border first:border-0">
                <span className="text-[13px] w-[100px] shrink-0">{LEAD_SOURCE_LABEL[r.source] ?? r.source}</span>
                <span className="grow"><ProgressBar value={r.share} height={6} /></span>
                <span className="text-[13px] text-text-2 tabular w-[42px] text-right">%{r.share}</span>
                {/* Dönüşüm yanında örneklem de yazılır: 1/1'lik bir %100 ile 9/12'lik bir %75 aynı şey değil. */}
                <span className="text-[13px] tabular w-[120px] text-right">
                  {r.conversion !== null
                    ? <><span className="font-semibold">%{r.conversion}</span> <span className="text-muted">({r.won}/{r.closed})</span></>
                    : <span className="text-muted">kapanan yok</span>}
                </span>
              </div>
            ))}
            <div className="flex items-start gap-2 mt-3 pt-3.5 border-t border-border">
              <Icon name="info" size={15} className="text-muted shrink-0 mt-0.5" />
              <span className="text-[13px] text-text-2 leading-relaxed">
                {sources.best
                  ? `${LEAD_SOURCE_LABEL[sources.best.source] ?? sources.best.source} adaylarının kayda dönüşme oranı %${sources.best.conversion} ile en yüksek kanal (${sources.best.won}/${sources.best.closed} kapanmış aday).`
                  : "Kanalları karşılaştırmak için henüz yeterli veri yok: en az beş adayı kapanmış iki kanal gerekir."}
              </span>
            </div>
          </div>
        </Card>
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
