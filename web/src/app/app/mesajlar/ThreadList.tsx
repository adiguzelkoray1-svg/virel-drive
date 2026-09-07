"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PersonAvatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import type { ThreadPreview } from "@/lib/messages";

const CHANNEL_ICON: Record<string, "whatsapp" | "message" | "mail" | "bell"> = {
  WHATSAPP: "whatsapp",
  SMS: "message",
  EMAIL: "mail",
  PUSH: "bell",
};

/** Aktif konuşmayı vurgulamak URL'i okumayı gerektirir; arama da anlık olsun diye
 *  sunucu round-trip'i yerine burada, istemci tarafında filtrelenir. */
export function ThreadList({ threads }: { threads: ThreadPreview[] }) {
  const pathname = usePathname();
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr");
    return needle
      ? threads.filter((t) => t.name.toLocaleLowerCase("tr").includes(needle))
      : threads;
  }, [threads, q]);

  return (
    <div className="flex flex-col gap-2.5">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Kursiyer ara…"
        className="input h-9 text-[13px] w-full"
        aria-label="Kursiyer ara"
      />
      {visible.length === 0 ? (
        <p className="px-1 py-8 text-center text-[13px] text-text-2">
          {threads.length === 0 ? "Henüz mesaj yok." : "Sonuç yok."}
        </p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {visible.map((t) => {
            const active = pathname === `/app/mesajlar/${t.studentId}`;
            return (
              <Link
                key={t.studentId}
                href={`/app/mesajlar/${t.studentId}`}
                className={`flex gap-2.5 p-3 rounded-md items-start ${active ? "bg-blue-050" : "hover:bg-surface-2"}`}
              >
                <PersonAvatar name={t.name} size={34} />
                <span className="flex flex-col gap-0.5 min-w-0 grow">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[13.5px] font-semibold truncate">
                      {t.name}
                    </span>
                    <Icon
                      name={CHANNEL_ICON[t.lastChannel] ?? "message"}
                      size={13}
                      className="text-muted shrink-0"
                    />
                    <span className="ml-auto text-xs text-muted shrink-0">
                      {relativeTime(t.lastAt)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] text-text-2 truncate">
                      {t.lastDirection === "OUT" ? "Siz: " : ""}
                      {t.lastBody}
                    </span>
                    {t.unreadCount > 0 && (
                      <span className="ml-auto shrink-0 w-[18px] h-[18px] rounded-full bg-blue text-on-brand text-[11px] font-bold flex items-center justify-center">
                        {t.unreadCount}
                      </span>
                    )}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function relativeTime(d: Date | string) {
  const date = new Date(d);
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} dk`;
  if (mins < 24 * 60) return `${Math.floor(mins / 60)} sa`;
  const days = Math.floor(mins / (24 * 60));
  if (days === 1) return "dün";
  if (days < 7) return `${days} gün`;
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}
