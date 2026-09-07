import type { Metadata } from "next";
import { requireInstructorUser } from "@/lib/auth";
import { instructorStudents } from "@/lib/mobile";
import { Badge, EmptyState, PersonAvatar } from "@/components/ui";
import { STAGE_LABEL, type StudentStage } from "@/lib/constants";
import { maskPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Kursiyerlerim" };

export default async function InstructorStudentsPage() {
  const { instructor } = await requireInstructorUser();
  const students = await instructorStudents(instructor.schoolId, instructor.id, instructor.branch);

  return (
    <div className="px-4 pt-[max(20px,env(safe-area-inset-top))] pb-4 flex flex-col gap-3">
      <h1 className="font-display text-[22px] font-bold">Kursiyerlerim</h1>

      {students.length === 0 ? (
        <div className="card"><EmptyState icon="users" title="Henüz kursiyerin yok." /></div>
      ) : (
        <div className="flex flex-col gap-2">
          {students.map((s) => (
            <a key={s.id} href={`tel:${s.phone}`} className="card p-3.5 flex items-center gap-3">
              <PersonAvatar name={`${s.firstName} ${s.lastName}`} size={38} />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[13.5px] font-semibold truncate">{s.firstName} {s.lastName}</span>
                <span className="text-xs text-muted tabular truncate">{maskPhone(s.phone)}</span>
              </div>
              <span className="ml-auto shrink-0 flex items-center gap-1.5">
                <Badge kind="brand">{s.licenseClass}</Badge>
                <Badge kind="neutral">{STAGE_LABEL[s.stage as StudentStage] ?? s.stage}</Badge>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
