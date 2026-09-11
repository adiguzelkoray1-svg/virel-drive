import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { getDocumentTypeRule } from "@/lib/document-types";
import { DocumentTypeForm } from "../../DocumentTypeForm";

export async function generateMetadata({ params }: PageProps<"/app/ayarlar/belgeler/[id]">): Promise<Metadata> {
  const user = await requirePermission("settings.write");
  const { id } = await params;
  const rule = await getDocumentTypeRule(user.schoolId, id);
  return { title: rule ? `${rule.label} · Ayarlar` : "Ayarlar" };
}

export default async function EditDocumentTypePage({ params }: PageProps<"/app/ayarlar/belgeler/[id]">) {
  const user = await requirePermission("settings.write");
  const { id } = await params;

  const rule = await getDocumentTypeRule(user.schoolId, id);
  if (!rule) notFound();

  return (
    <>
      <PageHeader title={rule.label} sub="Belge türünü düzenleyin">
        <Link href="/app/ayarlar/belgeler" className="btn btn-secondary btn-sm"><Icon name="chev-left" size={15} />Belge kuralları</Link>
      </PageHeader>
      <DocumentTypeForm rule={rule} />
    </>
  );
}
