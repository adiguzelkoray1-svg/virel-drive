"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { documentTypeFormAction } from "@/app/actions/document-types";
import { emptyDocumentTypeState } from "@/lib/document-type-form";

export function DocumentTypeForm({ rule }: { rule?: { id: string; label: string; validityMonths: number | null } }) {
  const [state, action, pending] = useActionState(documentTypeFormAction, emptyDocumentTypeState);
  const back = state.values;
  const k = JSON.stringify(back ?? {});
  const val = (name: string, fallback: string) => back?.[name] ?? fallback;

  return (
    <form action={action} className="card p-5 flex flex-col gap-4">
      {rule && <input type="hidden" name="ruleId" value={rule.id} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label">Belge adı</span>
          <input key={`label-${k}`} name="label" defaultValue={val("label", rule?.label ?? "")} className="input" placeholder="Askerlik durum belgesi" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Geçerlilik süresi (ay) <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input
            key={`validityMonths-${k}`} name="validityMonths" type="number" min={1}
            defaultValue={val("validityMonths", rule?.validityMonths != null ? String(rule.validityMonths) : "")}
            className="input" placeholder="Boş bırakılırsa süresiz"
          />
        </label>
      </div>

      {state.error && (
        <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
          <Icon name="alert" size={15} />{state.error}
        </span>
      )}
      <button className="btn btn-primary self-start" disabled={pending}>
        <Icon name="check" size={16} />{pending ? "Kaydediliyor…" : rule ? "Değişiklikleri kaydet" : "Belge türü ekle"}
      </button>
    </form>
  );
}
