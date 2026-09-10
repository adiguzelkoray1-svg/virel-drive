"use client";
import { useActionState, useState } from "react";
import { Icon } from "@/components/icons";
import { createPaymentLinkAction } from "@/app/actions/payment-links";
import { emptyPaymentLinkState } from "@/lib/payment-link-form";
import { SCHOOL_PLAN_LABEL, SCHOOL_PLAN_PRICE } from "@/lib/constants";

const SELLABLE_PLANS = Object.keys(SCHOOL_PLAN_PRICE);

export function PaymentLinkForm({ schoolId }: { schoolId: string }) {
  const [state, action, pending] = useActionState(createPaymentLinkAction, emptyPaymentLinkState);
  const [copied, setCopied] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <input type="hidden" name="schoolId" value={schoolId} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="label">Plan</span>
          <select
            name="plan" defaultValue={SELLABLE_PLANS[0]} className="input"
            onChange={(e) => {
              const price = SCHOOL_PLAN_PRICE[e.target.value];
              const form = e.target.form!;
              if (price) (form.elements.namedItem("amount") as HTMLInputElement).value = String(price.oneTime / 100);
            }}
          >
            {SELLABLE_PLANS.map((k) => <option key={k} value={k}>{SCHOOL_PLAN_LABEL[k]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Tutar (₺)</span>
          <input name="amount" type="number" min={1} step="0.01" defaultValue={SCHOOL_PLAN_PRICE[SELLABLE_PLANS[0]].oneTime / 100} className="input" required />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="label">Not (opsiyonel)</span>
        <input name="description" type="text" placeholder="Örn. Kurumsal paket, 2. şube indirimi uygulandı" className="input" />
        <span className="hint">Tutar plana göre önerilir; anlaşılan özel bir fiyat varsa değiştirin.</span>
      </label>

      <div className="flex items-center gap-3">
        {state.error && <span className="flex items-center gap-2 text-[13px] text-danger font-semibold"><Icon name="alert" size={15} />{state.error}</span>}
        <button className="btn btn-secondary btn-sm" disabled={pending}><Icon name="link" size={14} />{pending ? "Oluşturuluyor…" : "Ödeme linki oluştur"}</button>
      </div>

      {state.url && (
        <div className="flex items-center gap-2 p-2.5 rounded-md bg-blue-050">
          <input readOnly value={state.url} onFocus={(e) => e.target.select()} className="flex-1 min-w-0 bg-transparent text-[13px] outline-none" />
          <button
            type="button"
            className="btn btn-secondary btn-xs shrink-0"
            onClick={() => { navigator.clipboard.writeText(state.url!); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          >
            <Icon name={copied ? "check" : "copy"} size={13} />{copied ? "Kopyalandı" : "Kopyala"}
          </button>
        </div>
      )}
    </form>
  );
}
