import type { Metadata } from "next";
import { requireStudentUser } from "@/lib/auth";
import { getThread } from "@/lib/messages";
import { dateLong, time } from "@/lib/format";
import { StudentComposer } from "./Composer";

export const metadata: Metadata = { title: "Mesajlar" };

export default async function StudentMessagesPage() {
  const { student: s } = await requireStudentUser();
  const thread = await getThread(s.schoolId, s.id);
  const messages = thread?.messages ?? [];

  const groups: { label: string; items: typeof messages }[] = [];
  for (const m of messages) {
    const at = m.sentAt ?? m.createdAt;
    const label = dayLabel(at);
    const g = groups[groups.length - 1];
    if (g && g.label === label) g.items.push(m);
    else groups.push({ label, items: [m] });
  }

  return (
    <div className="flex flex-col h-[100dvh]">
      <header className="px-4 pt-[max(20px,env(safe-area-inset-top))] pb-3 border-b border-border shrink-0 bg-surface">
        <h1 className="font-display text-[18px] font-bold">Kursla mesajlaş</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.length === 0 ? (
          <p className="m-auto text-[13px] text-text-2 text-center">Henüz mesajın yok. Aşağıdan kursa yazabilirsin.</p>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-2">
              <div className="flex justify-center"><span className="chip pointer-events-none">{g.label}</span></div>
              {g.items.map((m) => (
                <div key={m.id} className={`flex ${m.direction === "IN" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3.5 py-2.5 text-[13.5px] leading-relaxed ${m.direction === "IN" ? "bg-blue text-on-brand rounded-[14px_14px_4px_14px]" : "bg-surface-2 rounded-[14px_14px_14px_4px]"}`}>
                    <div>{m.body}</div>
                    <div className={`text-[11px] mt-1 ${m.direction === "IN" ? "text-right opacity-75" : "text-muted"}`}>{time(m.sentAt ?? m.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 pb-24"><StudentComposer /></div>
    </div>
  );
}

function dayLabel(d: Date) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Dün";
  return dateLong(d);
}
