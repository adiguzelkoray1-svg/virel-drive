"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { expenseFormAction } from "@/app/actions/finance";
import { emptyExpenseState } from "@/lib/finance-form";
import { EXPENSE_CATEGORY_LABEL } from "@/lib/constants";

export function ExpenseForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(expenseFormAction, emptyExpenseState);
  // Form aksiyonu sonrası React alanları sıfırlar; <select> kendi seçimini kaybetmesin diye
  // her alan, dönen değerlere bağlı benzersiz bir key ile yeniden kurulur.
  const back = state.values;
  const k = JSON.stringify(back ?? {});

  return (
    <form action={action} className="px-5 pb-5 pt-1 flex flex-col gap-3.5">
      <label className="flex flex-col gap-1.5">
        <span className="label">Kategori</span>
        <select key={`category-${k}`} name="category" defaultValue={back?.category ?? "RENT"} className="input">
          {Object.entries(EXPENSE_CATEGORY_LABEL).map(([key, l]) => <option key={key} value={key}>{l}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="label">Tutar (₺)</span>
          <input key={`amount-${k}`} name="amount" type="number" min={1} step="0.01" defaultValue={back?.amount ?? ""} className="input" placeholder="12500" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Tarih</span>
          <input key={`occurredAt-${k}`} type="date" name="occurredAt" defaultValue={back?.occurredAt ?? today} max={today} className="input" required />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="label">Açıklama <span className="text-muted font-normal">(opsiyonel)</span></span>
        <input key={`note-${k}`} name="note" defaultValue={back?.note ?? ""} className="input" placeholder="Eylül ayı dükkân kirası" />
      </label>

      {state.error && (
        <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
          <Icon name="alert" size={15} />{state.error}
        </span>
      )}
      <button className="btn btn-primary btn-sm self-start" disabled={pending}>
        <Icon name="plus" size={16} />{pending ? "Kaydediliyor…" : "Gideri kaydet"}
      </button>
    </form>
  );
}
