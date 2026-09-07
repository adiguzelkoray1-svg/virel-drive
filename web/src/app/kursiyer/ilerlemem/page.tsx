import type { Metadata } from "next";
import { requireStudentUser } from "@/lib/auth";
import { getStudentDetail, type TimelineStep } from "@/lib/student";
import { Badge } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";

export const metadata: Metadata = { title: "İlerlemem" };

const STATE_STYLE: Record<TimelineStep["state"], { bg: string; fg: string; icon: IconName }> = {
  done: { bg: "bg-success-bg", fg: "text-success", icon: "check" },
  now: { bg: "bg-blue-050", fg: "text-blue", icon: "clock" },
  todo: { bg: "bg-surface-2", fg: "text-muted", icon: "chev-right" },
};

export default async function StudentProgressPage() {
  const { student: s } = await requireStudentUser();
  const d = await getStudentDetail(s.schoolId, s.id);
  if (!d) return null;

  return (
    <div className="px-4 pt-[max(20px,env(safe-area-inset-top))] pb-4 flex flex-col gap-3">
      <div>
        <h1 className="font-display text-[22px] font-bold">İlerlemem</h1>
        <p className="text-[13px] text-text-2 mt-0.5">Sürecini kimseye sormadan gör.</p>
      </div>

      <div className="card p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[14px] font-semibold">Genel ilerleme</span>
          <span className="font-display text-[22px] font-bold tabular ml-auto">%{d.overallPercent}</span>
        </div>
        <div className="h-2 rounded-full bg-surface-2 mt-2.5 overflow-hidden">
          <div className="h-full bg-blue rounded-full" style={{ width: `${d.overallPercent}%` }} />
        </div>
      </div>

      {d.timeline.map((t) => {
        const st = STATE_STYLE[t.state];
        return (
          <div key={t.key} className={`card p-3.5 flex items-center gap-3 ${t.state === "now" ? "border-blue" : ""}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${st.bg} ${st.fg}`}><Icon name={st.icon} size={15} /></span>
            <div className="flex flex-col min-w-0">
              <span className={`text-[13.5px] font-semibold ${t.state === "todo" ? "text-muted" : ""}`}>{t.title}</span>
              <span className="text-xs text-muted">{t.date}{t.sub ? ` · ${t.sub}` : ""}</span>
            </div>
            {t.state === "now" && <span className="ml-auto shrink-0"><Badge kind="brand" dot>Şu an</Badge></span>}
          </div>
        );
      })}
    </div>
  );
}
