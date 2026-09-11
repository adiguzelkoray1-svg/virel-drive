import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { getMessageTemplateRule } from "@/lib/message-templates";
import { MessageTemplateForm } from "../../MessageTemplateForm";

export async function generateMetadata({ params }: PageProps<"/app/ayarlar/mesaj-sablonlari/[id]">): Promise<Metadata> {
  const user = await requirePermission("settings.write");
  const { id } = await params;
  const rule = await getMessageTemplateRule(user.schoolId, id);
  return { title: rule ? `${rule.label} · Ayarlar` : "Ayarlar" };
}

export default async function EditMessageTemplatePage({ params }: PageProps<"/app/ayarlar/mesaj-sablonlari/[id]">) {
  const user = await requirePermission("settings.write");
  const { id } = await params;

  const rule = await getMessageTemplateRule(user.schoolId, id);
  if (!rule) notFound();

  return (
    <>
      <PageHeader title={rule.label} sub="Şablonu düzenleyin">
        <Link href="/app/ayarlar/mesaj-sablonlari" className="btn btn-secondary btn-sm"><Icon name="chev-left" size={15} />Mesaj şablonları</Link>
      </PageHeader>
      <MessageTemplateForm rule={rule} />
    </>
  );
}
