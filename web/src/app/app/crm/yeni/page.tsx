import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { LeadForm } from "../LeadForm";

export const metadata: Metadata = { title: "Ön kayıt ekle" };

export default async function NewLeadPage() {
  const user = await requirePermission("lead.write");
  const rules = await prisma.licenseClassRule.findMany({ where: { schoolId: user.schoolId, isActive: true }, orderBy: { code: "asc" } });

  return (
    <>
      <PageHeader title="Ön kayıt ekle" sub="Telefonla, Instagram'dan ya da kapıdan gelen adayı kaydedin">
        <Link href="/app/crm" className="btn btn-secondary btn-sm"><Icon name="chev-left" size={15} />CRM</Link>
      </PageHeader>
      <LeadForm licenseClasses={rules.map((r) => r.code)} />
    </>
  );
}
