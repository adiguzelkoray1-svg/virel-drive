import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import { THEORY_CATEGORIES, splitCsv } from "@/lib/constants";
import { InstructorForm } from "../InstructorForm";

export const metadata: Metadata = { title: "Eğitmen ekle" };

export default async function NewInstructorPage({ searchParams }: PageProps<"/app/egitmenler/yeni">) {
  const user = await requirePermission("instructor.write");
  const schoolId = user.schoolId;
  const sp = await searchParams;
  const editId = typeof sp.duzenle === "string" ? sp.duzenle : undefined;

  const [rules, existing] = await Promise.all([
    prisma.licenseClassRule.findMany({ where: { schoolId, isActive: true }, orderBy: { code: "asc" } }),
    editId ? prisma.instructor.findFirst({ where: { id: editId, schoolId } }) : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader title={existing ? "Eğitmeni düzenle" : "Eğitmen ekle"} sub="Branş, sınıf/kategori ve haftalık kapasite">
        <Link href="/app/egitmenler" className="btn btn-secondary btn-sm"><Icon name="badge-id" size={15} />Eğitmenler</Link>
      </PageHeader>

      <div className="max-w-[640px]">
        <InstructorForm
          instructorId={existing?.id}
          classOptions={rules.map((r) => r.code)}
          categoryOptions={THEORY_CATEGORIES.map((c) => ({ key: c.key, label: c.label }))}
          submitLabel={existing ? "Değişiklikleri kaydet" : "Eğitmeni ekle"}
          defaults={{
            name: existing?.name, phone: existing?.phone ?? undefined, mebLicenseNo: existing?.mebLicenseNo ?? undefined, branch: existing?.branch,
            weeklyCapacity: existing?.weeklyCapacity,
            licenseClasses: existing ? splitCsv(existing.licenseClasses) : undefined,
            subjects: existing ? splitCsv(existing.subjects) : undefined,
          }}
        />
      </div>
    </>
  );
}
