import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { LeadForm } from "../../LeadForm";

export const metadata: Metadata = { title: "Adayı düzenle" };

export default async function EditLeadPage({ params }: PageProps<"/app/crm/[id]/duzenle">) {
  const user = await requirePermission("lead.write");
  const { id } = await params;

  const [lead, rules] = await Promise.all([
    prisma.lead.findFirst({ where: { id, schoolId: user.schoolId } }),
    prisma.licenseClassRule.findMany({ where: { schoolId: user.schoolId, isActive: true }, orderBy: { code: "asc" } }),
  ]);
  if (!lead) notFound();

  return (
    <>
      <PageHeader title="Adayı düzenle" sub={lead.name}>
        <Link href={`/app/crm/${lead.id}`} className="btn btn-secondary btn-sm"><Icon name="chev-left" size={15} />Aday kartı</Link>
      </PageHeader>
      <LeadForm
        licenseClasses={rules.map((r) => r.code)}
        lead={{
          id: lead.id, name: lead.name, phone: lead.phone, email: lead.email,
          licenseClass: lead.licenseClass, source: lead.source, stage: lead.stage,
          nextFollowUpAt: lead.nextFollowUpAt ? lead.nextFollowUpAt.toISOString().slice(0, 10) : null,
          notes: lead.notes,
        }}
      />
    </>
  );
}
