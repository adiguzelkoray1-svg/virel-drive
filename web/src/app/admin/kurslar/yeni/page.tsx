import Link from "next/link";
import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { NewSchoolForm } from "../NewSchoolForm";

export const metadata: Metadata = { title: "Yeni kurs ekle" };

export default async function NewSchoolPage() {
  await requireSuperAdmin();
  return (
    <>
      <PageHeader title="Yeni kurs ekle" sub="Virel Drive'a yeni bir sürücü kursu kaydedin">
        <Link href="/admin" className="btn btn-secondary btn-sm"><Icon name="chev-left" size={15} />Kurslar</Link>
      </PageHeader>
      <NewSchoolForm />
    </>
  );
}
