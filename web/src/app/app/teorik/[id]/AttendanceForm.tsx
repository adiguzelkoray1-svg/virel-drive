"use client";
import { useActionState, useState } from "react";
import { Icon } from "@/components/icons";
import { PersonAvatar } from "@/components/ui";
import { saveAttendanceAction, type AttendanceState } from "@/app/actions/theory";

export type RosterRow = {
  id: string; name: string; licenseClass: string; present: boolean | null; recorded: boolean;
};

export function AttendanceForm({ lessonId, roster, alreadyDone, canComplete }: {
  lessonId: string; roster: RosterRow[]; alreadyDone: boolean; canComplete: boolean;
}) {
  const [state, action, pending] = useActionState<AttendanceState, FormData>(saveAttendanceAction, {});
  // Kayıtlı yoklama varsa onu, yoksa herkesi "var" kabul et: eğitmen yalnızca gelmeyeni işaretler.
  const [present, setPresent] = useState<Record<string, boolean>>(
    () => Object.fromEntries(roster.map((r) => [r.id, r.recorded ? r.present === true : true])),
  );

  const presentCount = roster.filter((r) => present[r.id]).length;
  const setAll = (v: boolean) => setPresent(Object.fromEntries(roster.map((r) => [r.id, v])));

  return (
    <form action={action}>
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="roster" value={roster.map((r) => r.id).join(",")} />

      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border flex-wrap">
        <span className="text-[13px] font-semibold tabular">{presentCount} / {roster.length} katıldı</span>
        <span className="text-xs text-muted">%{roster.length ? Math.round((presentCount / roster.length) * 100) : 0}</span>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => setAll(true)} className="btn btn-secondary btn-xs">Tümü var</button>
          <button type="button" onClick={() => setAll(false)} className="btn btn-secondary btn-xs">Tümü yok</button>
        </div>
      </div>

      <div className="px-5 max-h-[520px] overflow-y-auto">
        {roster.map((r) => (
          <label key={r.id} className="flex items-center gap-3 py-2.5 border-t border-border first:border-t-0 cursor-pointer">
            <PersonAvatar name={r.name} size={30} />
            <span className="flex flex-col gap-px min-w-0 flex-1">
              <span className="text-[13.5px] font-semibold truncate">{r.name}</span>
              <span className="text-xs text-muted">{r.licenseClass} sınıfı{r.recorded ? "" : " · ilk yoklama"}</span>
            </span>
            {present[r.id] && <input type="hidden" name="present" value={r.id} />}
            <span className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-semibold ${present[r.id] ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
              <Icon name={present[r.id] ? "check" : "x"} size={13} strokeWidth={2.4} />
              {present[r.id] ? "Var" : "Yok"}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={!!present[r.id]}
              onChange={(e) => setPresent((p) => ({ ...p, [r.id]: e.target.checked }))}
            />
          </label>
        ))}
      </div>

      {state.error && (
        <div className="mx-5 mt-3 flex items-start gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-danger-bg" role="alert">
          <Icon name="alert" size={16} className="shrink-0 mt-0.5 text-danger" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5 px-5 py-4 border-t border-border flex-wrap">
        {canComplete && !alreadyDone && (
          <label className="flex items-center gap-2 text-[13px] text-text-2">
            <input type="checkbox" name="complete" value="1" defaultChecked className="w-4 h-4 accent-blue" />
            Yoklamayı kaydedince dersi tamamlanmış say
          </label>
        )}
        <button className="btn btn-primary btn-sm ml-auto" disabled={pending}>
          <Icon name="check" size={15} />{pending ? "Kaydediliyor…" : alreadyDone ? "Yoklamayı güncelle" : "Yoklamayı kaydet"}
        </button>
      </div>
    </form>
  );
}
