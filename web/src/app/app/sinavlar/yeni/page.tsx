import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import { STAGE_LABEL, type StudentStage } from "@/lib/constants";
import { ScheduleForm } from "./ScheduleForm";

export const metadata: Metadata = { title: "Sınav planla" };

export default async function NewExamPage({ searchParams }: PageProps<"/app/sinavlar/yeni">) {
  const user = await requirePermission("exam.write");
  const schoolId = user.schoolId;
  const sp = await searchParams;

  const students = await prisma.student.findMany({
    where: { schoolId, status: "ACTIVE", stage: { in: ["THEORY", "ETEST_WAITING", "DRIVING", "DRIVING_EXAM"] } },
    orderBy: { firstName: "asc" },
    select: { id: true, firstName: true, lastName: true, licenseClass: true, stage: true },
  });

  const defaultType = typeof sp.tur === "string" && sp.tur === "DRIVING" ? "DRIVING" : "ETEST";
  const defaultStudentId = typeof sp.kursiyer === "string" ? sp.kursiyer : undefined;

  return (
    <>
      <PageHeader title="Sınav planla" sub="Sınav hakkı ve eğitim şartı otomatik kontrol edilir">
        <Link href="/app/sinavlar" className="btn btn-secondary btn-sm"><Icon name="exam" size={15} />Sınavlar</Link>
      </PageHeader>

      <div className="max-w-[620px]">
        <ScheduleForm
          students={students.map((s) => ({
            id: s.id, label: `${s.firstName} ${s.lastName}`, sub: STAGE_LABEL[s.stage as StudentStage] ?? s.stage,
            stage: s.stage, licenseClass: s.licenseClass,
          }))}
          defaultType={defaultType}
          defaultStudentId={defaultStudentId}
        />
      </div>
    </>
  );
}
