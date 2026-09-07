import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Badge, Card, Chip, EmptyState, PageHeader, PersonAvatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { LEAD_SOURCE_LABEL, LEAD_STAGES } from "@/lib/constants";
import { isFollowUpDue, listLeads, staleDays } from "@/lib/crm";
import { date, number } from "@/lib/format";
import { CrmTabs } from "../tabs";

export const metadata: Metadata = { title: "Aday listesi" };

const COLS = "minmax(170px,1fr) 140px 44px 118px 118px 128px 132px 16px";

export default async function LeadListPage({ searchParams }: PageProps<"/app/crm/liste">) {
  const user = await requirePermission("lead.read");
  const canWrite = can(user.role, "lead.write");
  const sp = await searchParams;

  const stage = String(sp.asama ?? "tumu");
  const source = String(sp.kaynak ?? "tumu");
  const q = String(sp.q ?? "").trim();

  const leads = await listLeads(user.schoolId, { stage, source, q });
  const keep = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ ...(stage !== "tumu" ? { asama: stage } : {}), ...(source !== "tumu" ? { kaynak: source } : {}), ...(q ? { q } : {}), ...extra });
    for (const [k, v] of [...p.entries()]) if (v === "tumu") p.delete(k);
    return `/app/crm/liste${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Aday listesi" sub={`${number(leads.length)} aday${leads.length === 300 ? " (en yeni 300)" : ""}`}>
        {canWrite && <Link href="/app/crm/yeni" className="btn btn-primary btn-sm"><Icon name="plus" size={15} />Ön kayıt ekle</Link>}
      </PageHeader>
      <CrmTabs active="liste" />

      <Card>
        <header className="flex items-center gap-3 px-5 pt-5 pb-3 flex-wrap">
          <h2 className="h-card">Adaylar</h2>
          <form className="flex items-center gap-2 ml-auto">
            {stage !== "tumu" && <input type="hidden" name="asama" value={stage} />}
            {source !== "tumu" && <input type="hidden" name="kaynak" value={source} />}
            <input name="q" defaultValue={q} placeholder="Ad veya telefon ara…" className="input h-8 text-[13px] w-[220px]" aria-label="Aday ara" />
            <button className="btn btn-secondary btn-xs">Ara</button>
          </form>
        </header>

        <div className="flex items-center gap-2 px-5 pb-2.5 flex-wrap">
          <Chip active={stage === "tumu"} href={keep({ asama: "tumu" })}>Tüm aşamalar</Chip>
          {LEAD_STAGES.map((s) => (
            <Chip key={s.key} active={stage === s.key} href={keep({ asama: s.key })}>{s.label}</Chip>
          ))}
        </div>
        <div className="flex items-center gap-2 px-5 pb-3 flex-wrap">
          <Chip active={source === "tumu"} href={keep({ kaynak: "tumu" })}>Tüm kaynaklar</Chip>
          {Object.entries(LEAD_SOURCE_LABEL).map(([key, l]) => (
            <Chip key={key} active={source === key} href={keep({ kaynak: key })}>{l}</Chip>
          ))}
        </div>

        {leads.length === 0 ? (
          <EmptyState icon="funnel" title="Aday bulunamadı." desc="Süzgeçleri ya da aramayı değiştirin." />
        ) : (
          <div className="px-5 pb-5 overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid gap-3 items-center pb-2.5" style={{ gridTemplateColumns: COLS }}>
                <div className="th">Aday</div>
                <div className="th">Aşama</div>
                <div className="th">Sınıf</div>
                <div className="th">Kaynak</div>
                <div className="th">Son temas</div>
                <div className="th">Sonraki takip</div>
                <div className="th">Durum</div>
                <div />
              </div>
              {leads.map((l) => {
                const st = LEAD_STAGES.find((s) => s.key === l.stage);
                const due = isFollowUpDue(l);
                const stale = staleDays(l);
                return (
                  <Link key={l.id} href={`/app/crm/${l.id}`} className="grid gap-3 items-center py-3 border-t border-border" style={{ gridTemplateColumns: COLS }}>
                    <span className="flex items-center gap-2.5 min-w-0">
                      <PersonAvatar name={l.name} size={30} />
                      <span className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate">{l.name}</span>
                        <span className="text-xs text-muted tabular">{l.phone}</span>
                      </span>
                    </span>
                    <span className="text-[13px] flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: st?.color }} />
                      <span className="truncate">{st?.label ?? l.stage}</span>
                    </span>
                    <span>{l.licenseClass ? <Badge kind="brand">{l.licenseClass}</Badge> : <span className="text-muted text-[13px]">—</span>}</span>
                    <span className="text-[13px] text-text-2 truncate">{LEAD_SOURCE_LABEL[l.source] ?? l.source}</span>
                    <span className="text-[13px] text-text-2 tabular">{l.lastContactAt ? date(l.lastContactAt) : "—"}</span>
                    <span className={`text-[13px] tabular ${due ? "text-danger font-semibold" : "text-text-2"}`}>
                      {l.nextFollowUpAt ? date(l.nextFollowUpAt) : "—"}
                    </span>
                    <span>
                      {l.stage === "WON" ? <Badge kind="success" dot>Kayıt oldu</Badge>
                        : l.stage === "LOST" ? <Badge kind="neutral">{l.lostReason ?? "Kaybedildi"}</Badge>
                        : due ? <Badge kind="danger" dot>Takip gecikti</Badge>
                        : stale >= 7 ? <Badge kind="warning" dot>{stale} gün sessiz</Badge>
                        : <Badge kind="success" dot>Güncel</Badge>}
                    </span>
                    <span className="text-muted"><Icon name="chev-right" size={16} /></span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
