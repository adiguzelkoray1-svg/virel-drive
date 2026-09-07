import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { advanceStageAction } from "@/app/actions/leads";
import { Badge, Card, EmptyState, Notice, PageHeader, PersonAvatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { LEAD_SOURCE_LABEL, LEAD_STAGES } from "@/lib/constants";
import { OPEN_STAGES, followUpQueue } from "@/lib/crm";
import { date, dateTime, number } from "@/lib/format";

export const metadata: Metadata = { title: "Ön Kayıtlar" };

/**
 * Ön kayıt gelen kutusu. CRM pipeline'ı huninin tamamını gösterir; bu ekran
 * yalnızca bugün elle iş gerektiren iki yığını gösterir: hiç dokunulmamış yeni
 * başvurular ve takibi gecikmiş adaylar. Kenar çubuğundaki rozet de bu iştir.
 */
export default async function InboxPage({ searchParams }: PageProps<"/app/on-kayitlar">) {
  const user = await requirePermission("lead.read");
  const canWrite = can(user.role, "lead.write");
  const sp = await searchParams;

  const [fresh, follow, openCount] = await Promise.all([
    prisma.lead.findMany({ where: { schoolId: user.schoolId, stage: "NEW" }, orderBy: { createdAt: "desc" } }),
    followUpQueue(user.schoolId, 30),
    prisma.lead.count({ where: { schoolId: user.schoolId, stage: { in: OPEN_STAGES } } }),
  ]);

  // Yeni başvurular her iki listede birden görünmesin; gelen kutusu tekrar etmemeli.
  const followRows = follow.filter((r) => r.lead.stage !== "NEW");

  return (
    <>
      <PageHeader
        title="Ön Kayıtlar"
        sub={`${number(fresh.length)} yeni başvuru · ${number(followRows.length)} gecikmiş takip · toplam ${number(openCount)} açık aday`}
      >
        <Link href="/app/crm" className="btn btn-secondary btn-sm"><Icon name="funnel" size={15} />Pipeline</Link>
        {canWrite && <Link href="/app/crm/yeni" className="btn btn-primary btn-sm"><Icon name="plus" size={15} />Ön kayıt ekle</Link>}
      </PageHeader>

      {sp.ilerletildi && <Notice kind="success">{sp.ilerletildi} bir sonraki aşamaya taşındı.</Notice>}

      <Card>
        <header className="flex items-center gap-2.5 px-5 pt-5 pb-1">
          <h2 className="h-card">Yeni başvurular</h2>
          {fresh.length > 0 && <Badge kind="brand" dot>{fresh.length}</Badge>}
          <span className="ml-auto text-xs text-muted">Henüz aranmamış adaylar</span>
        </header>
        {fresh.length === 0 ? (
          <EmptyState icon="check-circle" title="Yeni başvuru yok." desc="Gelen tüm başvurular ele alınmış." />
        ) : (
          <div className="px-5 pb-5 pt-1">
            {fresh.map((l) => (
              <div key={l.id} className="flex items-center gap-3 py-3 border-t border-border first:border-0 flex-wrap">
                <PersonAvatar name={l.name} size={32} />
                <Link href={`/app/crm/${l.id}`} className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold truncate">{l.name}</span>
                  <span className="text-xs text-muted tabular">{l.phone}</span>
                </Link>
                {l.licenseClass && <Badge kind="brand">{l.licenseClass}</Badge>}
                <Badge kind="neutral">{LEAD_SOURCE_LABEL[l.source] ?? l.source}</Badge>
                <span className="text-[13px] text-text-2 tabular ml-auto">{dateTime(l.createdAt)}</span>
                <div className="flex items-center gap-1.5">
                  <a href={`tel:${l.phone.replace(/\D/g, "")}`} className="btn btn-ghost btn-xs" aria-label="Ara"><Icon name="phone" size={14} /></a>
                  <a
                    href={`https://wa.me/9${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="btn btn-ghost btn-xs" aria-label="WhatsApp"
                  ><Icon name="whatsapp" size={14} /></a>
                  {canWrite && (
                    <form action={advanceStageAction}>
                      <input type="hidden" name="leadId" value={l.id} />
                      <button className="btn btn-secondary btn-xs">Bilgi verildi</button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <header className="flex items-center gap-2.5 px-5 pt-5 pb-1">
          <h2 className="h-card">Geri dönüş bekleyenler</h2>
          {followRows.length > 0 && <Badge kind="danger" dot>{followRows.length}</Badge>}
          <span className="ml-auto text-xs text-muted">Takip tarihi geçmiş ya da uzun süredir sessiz</span>
        </header>
        {followRows.length === 0 ? (
          <EmptyState icon="check-circle" title="Bekleyen takip yok." desc="Tüm adaylara zamanında dönülmüş." />
        ) : (
          <div className="px-5 pb-5 pt-1">
            {followRows.map(({ lead, due, dueDays, stale }) => {
              const st = LEAD_STAGES.find((s) => s.key === lead.stage);
              return (
                <div key={lead.id} className="flex items-center gap-3 py-3 border-t border-border first:border-0 flex-wrap">
                  <PersonAvatar name={lead.name} size={32} />
                  <Link href={`/app/crm/${lead.id}`} className="flex flex-col gap-0.5 min-w-0 grow">
                    <span className="text-sm font-semibold truncate">{lead.name}</span>
                    <span className="text-[13px] text-text-2 leading-snug">
                      {due
                        ? `${date(lead.nextFollowUpAt!)} tarihinde aranacaktı, ${dueDays} gün geçti.`
                        : `${stale} gündür temas edilmedi.`}
                    </span>
                  </Link>
                  {st && (
                    <span className="text-[13px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: st.color }} />{st.label}
                    </span>
                  )}
                  <Badge kind={due ? "danger" : "warning"} dot>{due ? `${dueDays} gün gecikme` : `${stale} gün sessiz`}</Badge>
                  <div className="flex items-center gap-1.5">
                    <a href={`tel:${lead.phone.replace(/\D/g, "")}`} className="btn btn-ghost btn-xs" aria-label="Ara"><Icon name="phone" size={14} /></a>
                    <a
                      href={`https://wa.me/9${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                      className="btn btn-secondary btn-xs"
                    ><Icon name="whatsapp" size={13} />Yaz</a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
