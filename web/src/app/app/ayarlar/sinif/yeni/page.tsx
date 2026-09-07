import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ClassRuleForm } from "../../ClassRuleForm";

export const metadata: Metadata = { title: "Sınıf ekle" };

export default async function NewClassRulePage() {
  await requirePermission("settings.write");

  return (
    <>
      <PageHeader title="Sınıf ekle" sub="Yeni bir sertifika sınıfı ve eğitim kuralları tanımlayın">
        <Link href="/app/ayarlar" className="btn btn-secondary btn-sm"><Icon name="chev-left" size={15} />Ayarlar</Link>
      </PageHeader>
      <ClassRuleForm />
    </>
  );
}
