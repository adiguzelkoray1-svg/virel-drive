"use client";
import { useActionState, useState } from "react";
import { Icon } from "@/components/icons";
import { planFormAction } from "@/app/actions/finance";
import { buildInstallments, emptyPlanState } from "@/lib/finance-form";
import { money } from "@/lib/format";

export function PlanForm({ studentId, hasPlan, hasPaidDown, paidSum, firstSeq, defaults }: {
  studentId: string; hasPlan: boolean; hasPaidDown: boolean; paidSum: number; firstSeq: number;
  defaults: { total: string; downPayment: string; count: string; firstDueAt: string };
}) {
  const [state, action, pending] = useActionState(planFormAction, emptyPlanState);
  const back = state.values;
  const [total, setTotal] = useState(back?.total ?? defaults.total);
  const [down, setDown] = useState(back?.downPayment ?? defaults.downPayment);
  const [count, setCount] = useState(back?.count ?? defaults.count);

  // Önizleme, sunucu aksiyonuyla aynı buildInstallments fonksiyonunu kullanır;
  // ekranda görülen taksit tutarı kaydedilenle birebir aynı olur.
  const totalK = Math.round((Number(total) || 0) * 100);
  // Peşinat zaten tahsil edilmişse kalan bakiyeden ikinci kez düşülmez — sunucu da aynısını yapar.
  const downK = hasPaidDown ? 0 : Math.round((Number(down) || 0) * 100);
  const n = Math.max(1, Math.min(24, Number(count) || 1));
  const remaining = totalK - paidSum - downK;
  const valid = totalK > 0 && remaining >= 0 && totalK >= paidSum;
  const rows = valid && remaining > 0 ? buildInstallments(remaining + downK, downK, n) : [];

  return (
    <form action={action} className="px-5 pb-5 pt-1 flex flex-col gap-3.5">
      <input type="hidden" name="studentId" value={studentId} />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="label">Toplam ücret (₺)</span>
          <input name="total" type="number" min={1} step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Peşinat (₺)</span>
          <input name="downPayment" type="number" min={0} step="0.01" value={down} onChange={(e) => setDown(e.target.value)} className="input" />
          {hasPaidDown && <span className="hint">Peşinat tahsil edilmiş; kalan bakiyeye eklenmez.</span>}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Taksit sayısı</span>
          <input name="count" type="number" min={1} max={24} value={count} onChange={(e) => setCount(e.target.value)} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">İlk vade</span>
          <input type="date" name="firstDueAt" defaultValue={back?.firstDueAt ?? defaults.firstDueAt} className="input" required />
        </label>
      </div>

      {!hasPlan && downK > 0 && (
        <label className="flex items-center gap-2 text-[13px] text-text-2">
          <input type="checkbox" name="downPaid" value="1" className="w-4 h-4 accent-blue" />
          Peşinat şimdi tahsil edildi olarak işaretlensin
        </label>
      )}

      {paidSum > 0 && (
        <p className="text-xs text-muted leading-relaxed">
          Bu kursiyerden <b className="tabular">{money(paidSum)}</b> tahsil edilmiş. Ödenmiş taksitlere dokunulmaz;
          yalnızca açık taksitler silinip kalan <b className="tabular">{money(Math.max(0, remaining))}</b> yeni vadelere bölünür.
        </p>
      )}

      {rows.length > 0 && (
        <div className="rounded-sm bg-surface-2 px-3.5 py-3 flex flex-col gap-1.5">
          <span className="stat-lbl">Önizleme</span>
          {downK > 0 && <PreviewRow label="Peşinat" amount={downK} />}
          {rows.map((amount, i) => <PreviewRow key={i} label={`${firstSeq + i}. taksit`} amount={amount} />)}
        </div>
      )}

      {state.error && (
        <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
          <Icon name="alert" size={15} />{state.error}
        </span>
      )}
      <button className="btn btn-primary btn-sm self-start" disabled={pending || !valid}>
        <Icon name="check" size={16} />{pending ? "Kaydediliyor…" : hasPlan ? "Planı yeniden kur" : "Planı oluştur"}
      </button>
    </form>
  );
}

function PreviewRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center text-[13px]">
      <span className="text-text-2">{label}</span>
      <span className="ml-auto font-semibold tabular">{money(amount)}</span>
    </div>
  );
}
