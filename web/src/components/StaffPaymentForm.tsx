"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { expenseFormAction } from "@/app/actions/finance";
import { emptyExpenseState } from "@/lib/finance-form";

/** Eğitmen ve idari kullanıcı (Kullanıcılar) detay sayfaları arasında paylaşılır — ikisi de
 *  aynı Expense satırını, yalnızca farklı bir kimlik alanına (instructorId/staffUserId)
 *  bağlayarak yazıyor (bkz. actions/finance.ts::expenseFormAction). */
export function StaffPaymentForm({ instructorId, staffUserId, today }: { instructorId?: string; staffUserId?: string; today: string }) {
  const [state, action, pending] = useActionState(expenseFormAction, emptyExpenseState);
  const back = state.values;
  const k = JSON.stringify(back ?? {});

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <input type="hidden" name="category" value="SALARY" />
      {instructorId && <input type="hidden" name="instructorId" value={instructorId} />}
      {staffUserId && <input type="hidden" name="staffUserId" value={staffUserId} />}

      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="label">Tür</span>
          <select key={`subcategory-${k}`} name="subcategory" defaultValue={back?.subcategory ?? "MAAS"} className="input">
            <option value="MAAS">Maaş</option>
            <option value="AVANS">Avans</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Tutar (₺)</span>
          <input key={`amount-${k}`} name="amount" type="number" min={1} step="0.01" defaultValue={back?.amount ?? ""} className="input" placeholder="15000" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Tarih</span>
          <input key={`occurredAt-${k}`} type="date" name="occurredAt" defaultValue={back?.occurredAt ?? today} max={today} className="input" required />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="label">Açıklama <span className="text-muted font-normal">(opsiyonel)</span></span>
        <input key={`note-${k}`} name="note" defaultValue={back?.note ?? ""} className="input" placeholder="Eylül ayı maaşı" />
      </label>

      {state.error && (
        <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
          <Icon name="alert" size={15} />{state.error}
        </span>
      )}
      <button className="btn btn-primary btn-sm self-start" disabled={pending}>
        <Icon name="plus" size={16} />{pending ? "Kaydediliyor…" : "Ödemeyi kaydet"}
      </button>
    </form>
  );
}
