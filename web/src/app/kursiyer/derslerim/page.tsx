import type { Metadata } from "next";
import { requireStudentUser } from "@/lib/auth";
import { getStudentDetail } from "@/lib/student";
import { Badge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { date, time } from "@/lib/format";

export const metadata: Metadata = { title: "Derslerim" };

const STATUS_BADGE: Record<string, { label: string; kind: "success" | "danger" | "brand" | "neutral" }> = {
  DONE: { label: "Tamamlandı", kind: "success" },
  CANCELLED: { label: "İptal", kind: "danger" },
  NO_SHOW: { label: "Gelmedi", kind: "danger" },
  PLANNED: { label: "Planlandı", kind: "brand" },
  LIVE: { label: "Devam ediyor", kind: "brand" },
};

export default async function StudentLessonsPage() {
  const { student: s } = await requireStudentUser();
  const d = await getStudentDetail(s.schoolId, s.id);
  if (!d) return null;

  const upcoming = d.lessons.filter((l) => l.startsAt > new Date() && l.status !== "CANCELLED").sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const past = d.lessons.filter((l) => !(l.startsAt > new Date() && l.status !== "CANCELLED"));

  return (
    <div className="px-4 pt-[max(20px,env(safe-area-inset-top))] pb-4 flex flex-col gap-4">
      <div>
        <h1 className="font-display text-[22px] font-bold">Derslerim</h1>
        <p className="text-[13px] text-text-2 mt-0.5">{d.doneHours.toFixed(1)} / {d.requiredHours} saat tamamlandı</p>
      </div>

      {upcoming.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[13px] font-semibold text-text-2">Yaklaşan</span>
          {upcoming.map((l) => <LessonRow key={l.id} lesson={l} />)}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <span className="text-[13px] font-semibold text-text-2">Geçmiş</span>
        {past.length === 0 ? (
          <p className="text-[13px] text-text-2 py-4 text-center">Henüz ders geçmişin yok.</p>
        ) : past.map((l) => <LessonRow key={l.id} lesson={l} />)}
      </div>
    </div>
  );
}

type StudentDetail = NonNullable<Awaited<ReturnType<typeof getStudentDetail>>>;

function LessonRow({ lesson: l }: { lesson: StudentDetail["lessons"][number] }) {
  const st = STATUS_BADGE[l.status] ?? STATUS_BADGE.PLANNED;
  return (
    <div className="card p-3.5 flex items-center gap-3">
      <div className="flex flex-col w-[52px] shrink-0">
        <span className="font-display text-[14px] font-semibold tabular">{time(l.startsAt)}</span>
        <span className="text-xs text-muted tabular">{date(l.startsAt)}</span>
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold truncate"><Icon name="badge-id" size={13} className="text-muted" />{l.instructor.name}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted tabular"><Icon name="car" size={13} />{l.vehicle?.plate ?? "—"}</span>
      </div>
      <span className="ml-auto shrink-0"><Badge kind={st.kind} dot={st.kind !== "neutral"}>{st.label}</Badge></span>
    </div>
  );
}
