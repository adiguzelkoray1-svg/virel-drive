import Link from "next/link";
import type { Metadata } from "next";
import { requireInstructorUser } from "@/lib/auth";
import { instructorWeek } from "@/lib/mobile";
import { Badge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { THEORY_CATEGORY_LABEL } from "@/lib/constants";
import { dayName, time } from "@/lib/format";

export const metadata: Metadata = { title: "Takvim" };

const STATUS_BADGE: Record<string, { label: string; kind: "success" | "danger" | "brand" }> = {
  DONE: { label: "Tamamlandı", kind: "success" },
  CANCELLED: { label: "İptal", kind: "danger" },
  NO_SHOW: { label: "Gelmedi", kind: "danger" },
  PLANNED: { label: "Planlandı", kind: "brand" },
  LIVE: { label: "Devam ediyor", kind: "brand" },
};

export default async function InstructorWeekPage() {
  const { instructor } = await requireInstructorUser();
  const lessons = await instructorWeek(instructor.schoolId, instructor.id, instructor.branch);
  type WeekLesson = Awaited<ReturnType<typeof instructorWeek>>[number];

  const groups: { key: string; label: string; items: WeekLesson[] }[] = [];
  for (const l of lessons) {
    const key = l.startsAt.toDateString();
    const g = groups.find((x) => x.key === key);
    const label = `${dayName(l.startsAt)}, ${l.startsAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}`;
    if (g) g.items.push(l);
    else groups.push({ key, label, items: [l] });
  }

  return (
    <div className="px-4 pt-[max(20px,env(safe-area-inset-top))] pb-4 flex flex-col gap-4">
      <h1 className="font-display text-[22px] font-bold">Bu hafta</h1>

      {groups.length === 0 ? (
        <div className="card p-4 flex items-center gap-2.5">
          <Icon name="calendar" size={18} className="text-muted" />
          <span className="text-[13px] text-text-2">Bu hafta planlı dersin yok.</span>
        </div>
      ) : groups.map((g) => (
        <div key={g.key} className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-text-2">{g.label}</span>
          {g.items.map((l) => {
            const st = STATUS_BADGE[l.status] ?? STATUS_BADGE.PLANNED;
            const href = instructor.branch === "DRIVING" ? `/egitmen/ders/${l.id}` : `/app/teorik/${l.id}`;
            return (
              <Link key={l.id} href={href} className="card p-3.5 flex items-center gap-3">
                <div className="flex flex-col w-[52px] shrink-0">
                  <span className="font-display text-[14px] font-semibold tabular">{time(l.startsAt)}</span>
                  <span className="text-xs text-muted tabular">{time(l.endsAt)}</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  {"student" in l ? (
                    <>
                      <span className="text-[13px] font-semibold truncate">{l.student.firstName} {l.student.lastName}</span>
                      <span className="text-xs text-muted tabular">{l.vehicle?.plate ?? "—"}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[13px] font-semibold truncate">{l.topic}</span>
                      <span className="text-xs text-muted truncate">{THEORY_CATEGORY_LABEL[l.category] ?? l.category}</span>
                    </>
                  )}
                </div>
                <span className="ml-auto shrink-0"><Badge kind={st.kind} dot>{st.label}</Badge></span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
