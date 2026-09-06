import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import { THEORY_CATEGORIES } from "@/lib/constants";
import { TheoryForm } from "./TheoryForm";

export const metadata: Metadata = { title: "Teorik ders" };

const DEFAULT_ROOMS = ["Derslik 1", "Derslik 2", "Derslik 3"];

export default async function NewTheoryLessonPage({ searchParams }: PageProps<"/app/teorik/yeni">) {
  const user = await requirePermission("theory.write");
  const schoolId = user.schoolId;
  const sp = await searchParams;
  const lessonId = typeof sp.ders === "string" ? sp.ders : undefined;

  const [teachers, existing, rooms, lastTerm] = await Promise.all([
    prisma.instructor.findMany({ where: { schoolId, branch: "THEORY", isActive: true }, orderBy: { name: "asc" } }),
    lessonId ? prisma.theoryLesson.findFirst({ where: { id: lessonId, schoolId } }) : Promise.resolve(null),
    prisma.theoryLesson.findMany({ where: { schoolId, room: { not: null } }, distinct: ["room"], select: { room: true } }),
    prisma.theoryLesson.findFirst({ where: { schoolId, term: { not: null } }, orderBy: { startsAt: "desc" }, select: { term: true } }),
  ]);

  const roomList = [...new Set([...rooms.map((r) => r.room!), ...DEFAULT_ROOMS])].sort();
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <>
      <PageHeader
        title={existing ? "Teorik dersi düzenle" : "Yeni teorik ders"}
        sub="Öğretmen ve derslik çakışması anlık kontrol edilir"
      >
        <Link href="/app/teorik" className="btn btn-secondary btn-sm"><Icon name="book" size={15} />Programa dön</Link>
      </PageHeader>

      <div className="max-w-[820px]">
        <TheoryForm
          categories={THEORY_CATEGORIES.map((c) => ({ key: c.key, label: c.label }))}
          teachers={teachers.map((t) => ({ id: t.id, label: t.name }))}
          rooms={roomList}
          lessonId={existing?.id}
          submitLabel={existing ? "Değişiklikleri kaydet" : "Dersi programa ekle"}
          defaults={{
            category: existing?.category,
            topic: existing?.topic,
            instructorId: existing?.instructorId ?? undefined,
            room: existing?.room ?? undefined,
            term: existing?.term ?? lastTerm?.term ?? undefined,
            date: existing ? iso(existing.startsAt) : iso(tomorrow),
            start: existing ? hhmm(existing.startsAt) : "10:00",
            end: existing ? hhmm(existing.endsAt) : "11:30",
          }}
        />
      </div>
    </>
  );
}
