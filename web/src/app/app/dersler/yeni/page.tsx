import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { LESSON_KIND_LABEL } from "@/lib/constants";
import { getRegulation, regInt } from "@/lib/regulation";
import { LessonForm } from "./LessonForm";

export const metadata: Metadata = { title: "Yeni direksiyon dersi" };

export default async function NewLessonPage({ searchParams }: PageProps<"/app/dersler/yeni">) {
  const user = await requirePermission("lesson.write");
  const schoolId = user.schoolId;
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const [students, instructors, vehicles, minutes, rules] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId, status: "ACTIVE", stage: { in: ["DRIVING", "DRIVING_EXAM", "ETEST_WAITING"] } },
      orderBy: [{ firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, licenseClass: true },
    }),
    prisma.instructor.findMany({ where: { schoolId, branch: "DRIVING", isActive: true }, orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ where: { schoolId, status: "ACTIVE" }, orderBy: { plate: "asc" } }),
    getRegulation(schoolId).then((r) => regInt(r, "drivingLessonMinutes", 90)),
    prisma.licenseClassRule.findMany({ where: { schoolId } }),
  ]);

  // Tamamlanan eğitim saati yalnızca DONE derslerden gelir (planlı ders henüz yapılmamıştır).
  const doneLessons = await prisma.drivingLesson.groupBy({
    by: ["studentId"],
    where: { schoolId, status: "DONE", studentId: { in: students.map((s) => s.id) } },
    _count: { _all: true },
  });
  const doneMap = new Map(doneLessons.map((d) => [d.studentId, d._count._all]));

  const need = new Map(rules.map((r) => [r.code, r.drivingHours]));
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return (
    <>
      <PageHeader title="Yeni direksiyon dersi" sub="Eğitmen, araç ve kursiyer uygunluğu anlık kontrol edilir">
        <Link href="/app/takvim" className="btn btn-secondary btn-sm"><Icon name="calendar" size={15} />Takvime dön</Link>
      </PageHeader>

      <div className="max-w-[820px]">
        <LessonForm
          students={students.map((s) => ({
            id: s.id,
            label: `${s.firstName} ${s.lastName}`,
            sub: `${s.licenseClass} · ${Math.round((((doneMap.get(s.id) ?? 0) * minutes) / 60) * 10) / 10}/${need.get(s.licenseClass) ?? 14} saat`,
          }))}
          instructors={instructors.map((i) => ({ id: i.id, label: i.name, sub: i.licenseClasses }))}
          vehicles={vehicles.map((v) => ({ id: v.id, label: v.plate, sub: [v.brand, v.model].filter(Boolean).join(" ") || undefined }))}
          kinds={Object.entries(LESSON_KIND_LABEL).map(([key, label]) => ({ key, label }))}
          defaults={{
            studentId: str("kursiyer"),
            instructorId: str("egitmen"),
            vehicleId: str("arac"),
            date: str("tarih") ?? iso(tomorrow),
            start: str("saat") ?? "14:00",
          }}
          durationMinutes={minutes}
        />
      </div>
    </>
  );
}
