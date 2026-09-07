"use client";
import { useActionState, useState } from "react";
import { Icon } from "@/components/icons";
import { paymentFormAction } from "@/app/actions/finance";
import { emptyPaymentState } from "@/lib/finance-form";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { date, money } from "@/lib/format";

export type OpenInstallment = { id: string; label: string; amount: number; dueAt: string; overdue: boolean };

export function PaymentForm({ studentId, studentName, installments, today }: {
  studentId: string; studentName: string; installments: OpenInstallment[]; today: string;
}) {
  const [state, action, pending] = useActionState(paymentFormAction, emptyPaymentState);
  // Vadesi gelen/geçen ilk taksit varsayılan olarak işaretli gelir — kasadaki en sık işlem bu.
  const [checked, setChecked] = useState<string[]>(installments[0] ? [installments[0].id] : []);
  const [extra, setExtra] = useState("");

  const selectedTotal = installments.filter((i) => checked.includes(i.id)).reduce((s, i) => s + i.amount, 0);
  const extraKurus = Number(extra) > 0 ? Math.round(Number(extra) * 100) : 0;
  const total = selectedTotal + extraKurus;

  const toggle = (id: string) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="studentId" value={studentId} />

      <section className="card">
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <h3 className="h-card">Kapatılacak taksitler</h3>
          <span className="text-[13px] text-text-2">{studentName}</span>
        </header>
        {installments.length === 0 ? (
          <p className="px-5 py-5 text-[13px] text-text-2">
            Açık taksit yok. Aşağıdan plan dışı bir tahsilat girebilirsiniz.
          </p>
        ) : (
          <div className="px-5 pb-4 pt-1">
            {installments.map((i) => (
              <label key={i.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0 cursor-pointer">
                <input
                  type="checkbox" name="installmentIds" value={i.id}
                  checked={checked.includes(i.id)} onChange={() => toggle(i.id)}
                  className="w-4 h-4 accent-blue shrink-0"
                />
                <span className="text-[13px] font-semibold w-[92px] shrink-0">{i.label}</span>
                <span className="text-[13px] tabular font-semibold">{money(i.amount)}</span>
                <span className={`text-[13px] tabular ml-auto ${i.overdue ? "text-danger font-semibold" : "text-text-2"}`}>
                  {i.overdue ? "gecikti · " : "vade "}{date(i.dueAt)}
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <header className="px-5 py-4 border-b border-border"><h3 className="h-card">Tahsilat bilgileri</h3></header>
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="label">Ödeme yöntemi</span>
            <select name="method" defaultValue={state.values?.method ?? "CASH"} className="input">
              {Object.entries(PAYMENT_METHOD_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Tarih</span>
            <input type="date" name="receivedAt" defaultValue={state.values?.receivedAt ?? today} max={today} className="input" required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Plan dışı tutar (₺) <span className="text-muted font-normal">(opsiyonel)</span></span>
            <input
              name="extra" type="number" min={0} step="0.01" className="input" placeholder="0"
              value={extra} onChange={(e) => setExtra(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-3">
            <span className="label">Açıklama <span className="text-muted font-normal">(opsiyonel)</span></span>
            <input name="note" defaultValue={state.values?.note ?? ""} className="input" placeholder="Ek ders ücreti, sınav harcı…" />
          </label>
        </div>

        <div className="px-5 py-4 border-t border-border flex items-center gap-4 flex-wrap">
          <div className="flex flex-col">
            <span className="stat-lbl">Tahsil edilecek</span>
            <span className="font-display text-[22px] font-bold tabular tracking-[-0.01em]">{money(total)}</span>
          </div>
          {state.error && (
            <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
              <Icon name="alert" size={15} />{state.error}
            </span>
          )}
          <button className="btn btn-primary ml-auto" disabled={pending || total === 0}>
            <Icon name="wallet" size={16} />{pending ? "Kaydediliyor…" : "Tahsilatı kaydet"}
          </button>
        </div>
      </section>
    </form>
  );
}
