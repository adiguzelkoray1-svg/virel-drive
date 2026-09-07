import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Badge, Card, Notice, PageHeader, PersonAvatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { LEAD_SOURCE_LABEL, LEAD_STAGES, STAGE_LABEL } from "@/lib/constants";
import { getLead, isFollowUpDue, staleDays } from "@/lib/crm";
import { date, dateLong } from "@/lib/format";
import { ContactForm } from "./ContactForm";
import { ConvertForm } from "./ConvertForm";

export async function generateMetadata({ params }: PageProps<"/app/crm/[id]">): Promise<Metadata> {
  const user = await requirePermission("lead.read");
  const { id } = await params;
  const lead = await prisma.lead.findFirst({ where: { id, schoolId: user.schoolId }, select: { name: true } });
  return { title: lead ? `${lead.name} · CRM` : "CRM" };
}

export default async function LeadDetailPage({ params, searchParams }: PageProps<"/app/crm/[id]">) {
  const user = await requirePermission("lead.read");
  const canWrite = can(user.role, "lead.write");
  const canCreateStudent = can(user.role, "student.write");
  const { id } = await params;
  const sp = await searchParams;

  const lead = await getLead(user.schoolId, id);
  if (!lead) notFound();

  const rules = await prisma.licenseClassRule.findMany({ where: { schoolId: user.schoolId, isActive: true }, orderBy: { code: "asc" } });
  const stage = LEAD_STAGES.find((s) => s.key === lead.stage);
  const due = isFollowUpDue(lead);
  const stale = staleDays(lead);
  const today = new Date().toISOString().slice(0, 10);
  // Varsayılan takip tarihi üç iş günü sonrası; danışman dilerse değiştirir.
  const suggestedDate = new Date();
  suggestedDate.setDate(suggestedDate.getDate() + 3);
  const suggested = suggestedDate.toISOString().slice(0, 10);
  const [firstName, ...rest] = lead.name.trim().split(/\s+/);
  const digits = lead.phone.replace(/\D/g, "");

  return (
    <>
      <PageHeader title={lead.name} sub={`${LEAD_SOURCE_LABEL[lead.source] ?? lead.source} · ${dateLong(lead.createdAt)} tarihinde başvurdu`}>
        <a href={`tel:${digits}`} className="btn btn-secondary btn-sm"><Icon name="phone" size={15} />Ara</a>
        <a href={`https://wa.me/9${digits}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
          <Icon name="whatsapp" size={15} />WhatsApp
        </a>
        {canWrite && <Link href={`/app/crm/${lead.id}/duzenle`} className="btn btn-ghost btn-sm"><Icon name="edit" size={15} />Düzenle</Link>}
      </PageHeader>

      {sp.olusturuldu && <Notice kind="success">Aday kaydedildi.</Notice>}
      {sp.guncellendi && <Notice kind="success">Aday bilgileri güncellendi.</Notice>}
      {sp.temas && <Notice kind="success">Görüşme kaydedildi.</Notice>}
      {due && <Notice kind="warning">Takip tarihi geçti ({date(lead.nextFollowUpAt!)}). Adaya bugün dönülmeli.</Notice>}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <Card>
            <div className="px-5 py-5 flex items-center gap-4 flex-wrap">
              <PersonAvatar name={lead.name} size={44} />
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-display text-[17px] font-bold tracking-[-0.01em]">{lead.name}</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {stage && <Badge kind={lead.stage === "LOST" ? "neutral" : lead.stage === "WON" ? "success" : "brand"} dot>{stage.label}</Badge>}
                  {lead.licenseClass && <Badge kind="brand">{lead.licenseClass} sınıfı</Badge>}
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-4">
              <Field label="Telefon" value={lead.phone} />
              <Field label="E-posta" value={lead.email ?? "—"} />
              <Field label="Son temas" value={lead.lastContactAt ? `${date(lead.lastContactAt)} (${stale} gün)` : "Hiç"} />
              <Field
                label="Sonraki takip"
                value={lead.nextFollowUpAt ? date(lead.nextFollowUpAt) : "Planlanmadı"}
                tone={due ? "text-danger" : undefined}
              />
            </div>
            {lead.stage === "LOST" && lead.lostReason && (
              <div className="px-5 pb-5">
                <div className="rounded-sm bg-surface-2 px-3.5 py-3 text-[13px]">
                  <span className="text-text-2">Kaybetme nedeni: </span><b>{lead.lostReason}</b>
                </div>
              </div>
            )}
          </Card>

          {lead.student && (
            <Card>
              <div className="px-5 py-4 flex items-center gap-3 flex-wrap">
                <span className="w-9 h-9 rounded-md bg-success-bg text-success flex items-center justify-center shrink-0"><Icon name="check" size={18} /></span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold">Kursiyere dönüştürüldü</span>
                  <span className="text-xs text-muted">
                    {lead.student.firstName} {lead.student.lastName} · {STAGE_LABEL[lead.student.stage as keyof typeof STAGE_LABEL] ?? lead.student.stage}
                    {lead.wonAt ? ` · ${date(lead.wonAt)}` : ""}
                  </span>
                </div>
                <Link href={`/app/kursiyerler/${lead.student.id}`} className="btn btn-secondary btn-sm ml-auto">
                  <Icon name="user" size={15} />Kursiyer kartı
                </Link>
              </div>
            </Card>
          )}

          <Card title="Görüşme geçmişi" sub="en yenisi üstte">
            {lead.notes ? (
              <div className="px-5 pb-5 pt-1 flex flex-col">
                {lead.notes.split("\n").filter(Boolean).map((line, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-2.5 border-t border-border first:border-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue mt-2 shrink-0" />
                    <span className="text-[13px] leading-relaxed">{line}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 pb-5 pt-1 text-[13px] text-text-2">Henüz görüşme notu yok.</p>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {canWrite ? (
            <Card title="Görüşme kaydet" sub="aşama ve sonraki takip birlikte güncellenir">
              <ContactForm
                leadId={lead.id} stage={lead.stage} canWin={!!lead.studentId}
                today={today} suggestedFollowUp={suggested}
              />
            </Card>
          ) : (
            <Card title="Görüşme kaydet">
              <p className="px-5 py-5 text-[13px] text-text-2">Görüşme kaydetmek için aday yazma yetkisi gerekir.</p>
            </Card>
          )}

          {!lead.student && canCreateStudent && lead.stage !== "LOST" && (
            <Card title="Kursiyere dönüştür" sub="kayıt kesinleştiğinde">
              <ConvertForm
                leadId={lead.id}
                defaults={{
                  firstName, lastName: rest.join(" "), phone: lead.phone,
                  email: lead.email ?? "", licenseClass: lead.licenseClass ?? "",
                }}
                licenseClasses={rules.map((r) => r.code)}
              />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className="stat-lbl">{label}</div>
      <div className={`text-[13px] font-semibold mt-0.5 truncate ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
