import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { MessageTemplateForm } from "../../MessageTemplateForm";

export const metadata: Metadata = { title: "Şablon ekle" };

export default async function NewMessageTemplatePage() {
  await requirePermission("settings.write");

  return (
    <>
      <PageHeader title="Şablon ekle" sub="Konuşma ekranında tek tıkla kullanılacak yeni bir mesaj">
        <Link href="/app/ayarlar/mesaj-sablonlari" className="btn btn-secondary btn-sm"><Icon name="chev-left" size={15} />Mesaj şablonları</Link>
      </PageHeader>
      <MessageTemplateForm />
    </>
  );
}
