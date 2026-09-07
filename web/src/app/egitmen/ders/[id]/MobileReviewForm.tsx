"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { completeLessonMobileAction } from "@/app/actions/mobile";
import { SCORE_LABEL, SKILLS } from "@/lib/constants";

export function MobileReviewForm({ lessonId, note, scores }: { lessonId: string; note: string | null; scores: Record<string, number> }) {
  const [state, action, pending] = useActionState(completeLessonMobileAction, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="lessonId" value={lessonId} />

      <div className="card p-3.5 pt-1">
        {SKILLS.map((s) => (
          <div key={s.key} className="flex items-center gap-2.5 py-2.5 border-t border-border first:border-0">
            <span className="text-[13px] flex-1 min-w-0">{s.label}</span>
            <span className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer" title={SCORE_LABEL[n]}>
                  <input type="radio" name={`skill_${s.key}`} value={n} defaultChecked={scores[s.key] === n} className="peer sr-only" />
                  <span className="w-[26px] h-[26px] rounded-full border border-border flex items-center justify-center text-[12px] font-bold text-muted peer-checked:bg-blue peer-checked:border-blue peer-checked:text-on-brand">
                    {n}
                  </span>
                </label>
              ))}
            </span>
          </div>
        ))}
      </div>

      <label className="card p-3.5 flex flex-col gap-1.5">
        <span className="label">Not</span>
        <textarea name="reviewNote" rows={3} defaultValue={note ?? ""} className="input" placeholder="Park manevrasında referans noktaları tekrar çalışılmalı." />
      </label>

      {state.error && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-danger-bg" role="alert">
          <Icon name="alert" size={16} className="shrink-0 mt-0.5 text-danger" />
          <span>{state.error}</span>
        </div>
      )}

      <button className="btn btn-primary w-full h-[46px]" disabled={pending}>
        <Icon name="check" size={17} />{pending ? "Kaydediliyor…" : "Dersi kapat"}
      </button>
      <p className="hint text-center -mt-1">Puan girmek zorunlu değil; girilen alanlar kursiyerin gelişim kartına işlenir.</p>
    </form>
  );
}
