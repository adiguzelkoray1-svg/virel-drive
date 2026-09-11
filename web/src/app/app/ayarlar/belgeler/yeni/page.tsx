import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { DocumentTypeForm } from "../../DocumentTypeForm";

export const metadata: Metadata = { title: "Belge türü ekle" };

export default async function NewDocumentTypePage() {
  await requirePermission("settings.write");

  return (
    <>
      <PageHeader title="Belge türü ekle" sub="Kursunuza özel yeni bir zorunlu belge tanımlayın">
        <Link href="/app/ayarlar/belgeler" className="btn btn-secondary btn-sm"><Icon name="chev-left" size={15} />Belge kuralları</Link>
      </PageHeader>
      <DocumentTypeForm />
    </>
  );
}
