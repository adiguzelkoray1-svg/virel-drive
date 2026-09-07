"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { updateRegulationAction } from "@/app/actions/settings";
import { emptyRegulationState } from "@/lib/settings-form";
import { REGULATION_BOOL_FIELDS, REGULATION_NUMBER_FIELDS } from "@/lib/constants";

export function RegulationForm({ values }: { values: Record<string, string> }) {
  const [state, action, pending] = useActionState(updateRegulationAction, emptyRegulationState);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="card">
        <h2 className="h-card px-5 pt-5">Ders ve devam kuralları</h2>
        <div className="px-5 pb-5 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REGULATION_NUMBER_FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1.5">
              <span className="label">{f.label}</span>
              <div className="input flex items-center gap-2">
                <input name={f.key} type="number" min={1} defaultValue={values[f.key]} className="w-full bg-transparent outline-none tabular" required />
                <span className="text-xs text-muted shrink-0">{f.suffix}</span>
              </div>
              {"hint" in f && f.hint && <span className="hint">{f.hint}</span>}
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="h-card px-5 pt-5">Sınav ve süreç kuralları</h2>
        <div className="px-5 pb-5 pt-3 grid grid-cols-1 md:grid-cols-2 gap-x-8">
          {REGULATION_BOOL_FIELDS.map((f) => (
            <label key={f.key} className="flex items-center gap-3 py-3 border-t border-border cursor-pointer">
              <input type="checkbox" name={f.key} value="1" defaultChecked={values[f.key] === "1"} className="w-4 h-4 accent-blue shrink-0" />
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[13px] font-semibold">{f.label}</span>
                <span className="text-xs text-muted leading-snug">{f.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {state.error && (
          <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
            <Icon name="alert" size={15} />{state.error}
          </span>
        )}
        {state.ok && !state.error && (
          <span className="flex items-center gap-2 text-[13px] text-success font-semibold">
            <Icon name="check-circle" size={15} />Kaydedildi.
          </span>
        )}
        <button className="btn btn-primary ml-auto" disabled={pending}>
          <Icon name="check" size={16} />{pending ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
        </button>
      </div>
    </form>
  );
}
