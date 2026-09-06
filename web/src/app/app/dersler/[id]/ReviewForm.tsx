"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { completeLessonAction, type ReviewState } from "@/app/actions/lessons";
import { SCORE_LABEL, SKILLS } from "@/lib/constants";

export function ReviewForm({ lessonId, note, scores, completed }: {
  lessonId: string;
  note: string | null;
  scores: Record<string, number>;
  completed: boolean;
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(completeLessonAction, {});

  return (
    <form action={action} className="px-5 pb-5">
      <input type="hidden" name="lessonId" value={lessonId} />

      <div className="pt-1">
        {SKILLS.map((s) => (
          <div key={s.key} className="flex items-center gap-3 py-2 border-t border-border first:border-t-0">
            <span className="text-[13px] flex-1 min-w-0">{s.label}</span>
            <span className="text-xs text-muted w-[92px] text-right hidden sm:block">{scores[s.key] ? SCORE_LABEL[scores[s.key]] : ""}</span>
            <span className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer" title={SCORE_LABEL[n]}>
                  <input type="radio" name={`skill_${s.key}`} value={n} defaultChecked={scores[s.key] === n} className="peer sr-only" />
                  <span className="w-[22px] h-[22px] rounded-full border border-border flex items-center justify-center text-[11px] font-bold text-muted peer-checked:bg-blue peer-checked:border-blue peer-checked:text-on-brand">
                    {n}
                  </span>
                </label>
              ))}
            </span>
          </div>
        ))}
      </div>

      <label className="flex flex-col gap-1.5 mt-4">
        <span className="label">Eğitmen notu</span>
        <textarea name="reviewNote" rows={3} defaultValue={note ?? ""} className="input" placeholder="Park manevrasında referans noktaları tekrar çalışılmalı." />
      </label>

      {state.error && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-danger-bg mt-3" role="alert">
          <Icon name="alert" size={16} className="shrink-0 mt-0.5 text-danger" />
          <span>{state.error}</span>
        </div>
      )}

      <button className="btn btn-primary btn-sm mt-4 w-full" disabled={pending}>
        <Icon name="check" size={15} />
        {pending ? "Kaydediliyor…" : completed ? "Değerlendirmeyi güncelle" : "Dersi tamamla"}
      </button>
      <p className="hint mt-2">Puan girmek zorunlu değil; girilen alanlar kursiyerin gelişim kartına işlenir.</p>
    </form>
  );
}
