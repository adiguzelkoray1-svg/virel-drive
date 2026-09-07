import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { Card, PageHeader } from "@/components/ui";
import { createStudentAction, updateStudentAction } from "@/app/actions/student";
import { StudentForm } from "../StudentForm";

export const metadata: Metadata = { title: "Kursiyer ekle" };

export default async function NewStudentPage({ searchParams }: PageProps<"/app/kursiyerler/yeni">) {
  const user = await requirePermission("student.write");
  const schoolId = user.schoolId;
  const sp = await searchParams;
  const editId = typeof sp.duzenle === "string" ? sp.duzenle : undefined;

  const [rules, existing] = await Promise.all([
    prisma.licenseClassRule.findMany({ where: { schoolId, isActive: true }, orderBy: { code: "asc" } }),
    editId ? prisma.student.findFirst({ where: { id: editId, schoolId } }) : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader title={existing ? "Kursiyeri düzenle" : "Kursiyer ekle"} sub="Ön kayıt aşamasıyla süreç başlar">
        <Link href={existing ? `/app/kursiyerler/${existing.id}` : "/app/kursiyerler"} className="btn btn-secondary btn-sm"><Icon name="users" size={15} />{existing ? "Kursiyer detayı" : "Kursiyerler"}</Link>
      </PageHeader>

      <Card className="p-5 max-w-[640px]">
        <StudentForm
          action={existing ? updateStudentAction : createStudentAction}
          studentId={existing?.id}
          submitLabel={existing ? "Değişiklikleri kaydet" : "Kursiyeri ekle"}
          licenseClasses={rules.map((r) => r.code)}
          defaults={{
            firstName: existing?.firstName ?? "", lastName: existing?.lastName ?? "", phone: existing?.phone ?? "",
            email: existing?.email ?? "", nationalId: existing?.nationalId ?? "",
            birthDate: existing?.birthDate ? existing.birthDate.toISOString().slice(0, 10) : "",
            address: existing?.address ?? "", licenseClass: existing?.licenseClass ?? "", fileNo: existing?.fileNo ?? "",
          }}
        />
      </Card>
    </>
  );
}
