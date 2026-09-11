"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { messageTemplateFormAction } from "@/app/actions/message-templates";
import { emptyMessageTemplateState } from "@/lib/message-template-form";

export function MessageTemplateForm({ rule }: { rule?: { id: string; label: string; body: string } }) {
  const [state, action, pending] = useActionState(messageTemplateFormAction, emptyMessageTemplateState);
  const back = state.values;
  const k = JSON.stringify(back ?? {});
  const val = (name: string, fallback: string) => back?.[name] ?? fallback;

  return (
    <form action={action} className="card p-5 flex flex-col gap-4">
      {rule && <input type="hidden" name="ruleId" value={rule.id} />}

      <label className="flex flex-col gap-1.5">
        <span className="label">Şablon adı</span>
        <input key={`label-${k}`} name="label" defaultValue={val("label", rule?.label ?? "")} className="input" placeholder="Sınav sonucu bilgilendirmesi" required />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Mesaj metni</span>
        <textarea
          key={`body-${k}`} name="body" defaultValue={val("body", rule?.body ?? "")} className="input min-h-[100px] py-2.5" required
          placeholder="Sayın {ad}, ..."
        />
        <span className="hint">Gönderim anında <code>{"{ad}"}</code> kursiyerin adıyla, <code>{"{kurs}"}</code> kursunuzun adıyla değiştirilir.</span>
      </label>

      {state.error && (
        <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
          <Icon name="alert" size={15} />{state.error}
        </span>
      )}
      <button className="btn btn-primary self-start" disabled={pending}>
        <Icon name="check" size={16} />{pending ? "Kaydediliyor…" : rule ? "Değişiklikleri kaydet" : "Şablon ekle"}
      </button>
    </form>
  );
}
