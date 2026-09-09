import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { PersonAvatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { STAGE_LABEL, type StudentStage } from "@/lib/constants";
import { getThread } from "@/lib/messages";
import { dateLong, time } from "@/lib/format";
import { MarkThreadRead } from "./MarkThreadRead";
import { Composer } from "./Composer";

export async function generateMetadata({ params }: PageProps<"/app/mesajlar/[id]">): Promise<Metadata> {
  const user = await requirePermission("message.send");
  const { id } = await params;
  const d = await getThread(user.schoolId, id);
  return { title: d ? `${d.student.firstName} ${d.student.lastName} · Mesajlar` : "Mesajlar" };
}

export default async function ThreadPage({ params }: PageProps<"/app/mesajlar/[id]">) {
  const user = await requirePermission("message.send");
  const { id } = await params;

  const d = await getThread(user.schoolId, id);
  if (!d) notFound();

  const name = `${d.student.firstName} ${d.student.lastName}`;
  const lastChannel = [...d.messages].reverse().find((m) => m.direction === "OUT")?.channel ?? "WHATSAPP";

  // Gün ayraçları için mesajlar günlere bölünür ("Bugün", "Dün", tam tarih).
  const groups: { label: string; items: typeof d.messages }[] = [];
  for (const m of d.messages) {
    const at = m.sentAt ?? m.createdAt;
    const label = dayLabel(at);
    const g = groups[groups.length - 1];
    if (g && g.label === label) g.items.push(m);
    else groups.push({ label, items: [m] });
  }

  return (
    <section className="card min-w-0 flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: 480 }}>
      <MarkThreadRead studentId={d.student.id} />

      <header className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
        <PersonAvatar name={name} size={38} />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold truncate">{name}</span>
          <span className="text-xs text-muted truncate">
            {d.student.licenseClass} sınıfı · {STAGE_LABEL[d.student.stage as StudentStage] ?? d.student.stage}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Link href={`/app/kursiyerler/${d.student.id}`} className="btn btn-secondary btn-xs"><Icon name="user" size={14} />Kursiyer kartı</Link>
          <a href={`tel:${d.student.phone.replace(/\D/g, "")}`} className="btn btn-ghost btn-xs" aria-label="Ara"><Icon name="phone" size={15} /></a>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-h-0">
        {d.messages.length === 0 ? (
          <p className="m-auto text-[13px] text-text-2">Henüz mesaj yok. Aşağıdan ilk mesajı gönderin.</p>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-2.5">
              <div className="flex justify-center"><span className="chip pointer-events-none">{g.label}</span></div>
              {g.items.map((m) => (
                <div key={m.id} className={`flex ${m.direction === "OUT" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                      m.direction === "OUT" ? "bg-blue text-on-brand rounded-[14px_14px_4px_14px]" : "bg-surface-2 rounded-[14px_14px_14px_4px]"
                    }`}
                  >
                    <div>{m.body}</div>
                    <div className={`text-[11px] mt-1 ${m.direction === "OUT" ? "text-right opacity-75" : "text-muted"}`}>
                      {time(m.sentAt ?? m.createdAt)}
                    </div>
                    {m.status === "FAILED" && (
                      <div className="text-[11px] mt-0.5 text-right font-semibold text-danger">Gönderilemedi</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="px-5 pb-5 shrink-0">
        <Composer studentId={d.student.id} firstName={d.student.firstName} defaultChannel={lastChannel} />
      </div>
    </section>
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
