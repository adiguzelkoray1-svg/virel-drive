"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { addVehicleCostAction } from "@/app/actions/vehicles";
import { emptyCostState } from "@/lib/vehicle-form";
import { VEHICLE_COST_LABEL } from "@/lib/constants";

export function CostForm({ vehicleId, currentKm, today }: { vehicleId: string; currentKm: number; today: string }) {
  const [state, action, pending] = useActionState(addVehicleCostAction, emptyCostState);

  return (
    <form action={action} className="px-5 pb-5 pt-1 flex flex-col gap-3.5">
      <input type="hidden" name="vehicleId" value={vehicleId} />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="label">Gider türü</span>
          <select name="type" defaultValue="FUEL" className="input">
            {Object.entries(VEHICLE_COST_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Tutar (₺)</span>
          <input name="amount" type="number" min={1} step="0.01" className="input" placeholder="1250" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Tarih</span>
          <input type="date" name="occurredAt" defaultValue={today} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Kilometre <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input name="km" type="number" min={0} className="input" placeholder={String(currentKm)} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="label">Not <span className="text-muted font-normal">(opsiyonel)</span></span>
        <input name="note" className="input" placeholder="Periyodik bakım, yağ + filtre" />
      </label>

      <label className="flex items-center gap-2 text-[13px] text-text-2">
        <input type="checkbox" name="updateKm" value="1" defaultChecked className="w-4 h-4 accent-blue" />
        Girilen kilometre aracın güncel kilometresini de güncellesin
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="label">Sonraki bakım km <span className="text-muted font-normal">(opsiyonel)</span></span>
        <input name="nextServiceKm" type="number" min={0} className="input" placeholder="Bakım yaptıysanız yeni hedefi yazın" />
      </label>

      {state.error && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-danger-bg" role="alert">
          <Icon name="alert" size={16} className="shrink-0 mt-0.5 text-danger" /><span>{state.error}</span>
        </div>
      )}

      <button className="btn btn-primary btn-sm" disabled={pending}>
        <Icon name="plus" size={15} />{pending ? "Kaydediliyor…" : "Gideri kaydet"}
      </button>
    </form>
  );
}
