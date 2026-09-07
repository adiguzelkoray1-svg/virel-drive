import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { getLicenseClassRule } from "@/lib/settings";
import { ClassRuleForm } from "../../ClassRuleForm";

export async function generateMetadata({ params }: PageProps<"/app/ayarlar/sinif/[id]">): Promise<Metadata> {
  const user = await requirePermission("settings.write");
  const { id } = await params;
  const rule = await getLicenseClassRule(user.schoolId, id);
  return { title: rule ? `${rule.code} sınıfı · Ayarlar` : "Ayarlar" };
}

export default async function EditClassRulePage({ params }: PageProps<"/app/ayarlar/sinif/[id]">) {
  const user = await requirePermission("settings.write");
  const { id } = await params;

  const rule = await getLicenseClassRule(user.schoolId, id);
  if (!rule) notFound();

  return (
    <>
      <PageHeader title={`${rule.code} sınıfı`} sub="Eğitim kurallarını düzenleyin">
        <Link href="/app/ayarlar" className="btn btn-secondary btn-sm"><Icon name="chev-left" size={15} />Ayarlar</Link>
      </PageHeader>
      <ClassRuleForm rule={rule} />
    </>
  );
}
