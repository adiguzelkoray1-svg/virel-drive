"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { vehicleFormAction } from "@/app/actions/vehicles";
import { emptyVehicleState } from "@/lib/vehicle-form";
import { VEHICLE_STATUS_LABEL, VEHICLE_USAGE_LABEL } from "@/lib/constants";

type Option = { id: string; label: string };

export function VehicleForm({ vehicleId, classOptions, instructors, defaults, submitLabel }: {
  vehicleId?: string;
  classOptions: string[];
  instructors: Option[];
  defaults: {
    plate?: string; brand?: string; model?: string; year?: number | null; licenseClass?: string;
    usage?: string; status?: string; km?: number; nextServiceKm?: number | null; fuelType?: string;
    inspectionUntil?: string; insuranceUntil?: string; instructorId?: string;
  };
  submitLabel: string;
}) {
  const [state, action, pending] = useActionState(vehicleFormAction, emptyVehicleState);
  const back = state.values;
  // Hata sonrası native form.reset() alanları defaultValue'ya döndürür; formKey ile
  // her alan taze bir düğüm olarak kurulup sunucudan dönen değeri gösterir
  // (bkz. README "<select> alanları ve form.reset()").
  const formKey = JSON.stringify(back ?? {});
  const val = (k: keyof typeof defaults, fallback = "") => back?.[k] ?? (defaults[k] !== null && defaults[k] !== undefined ? String(defaults[k]) : fallback);

  return (
    <form action={action} className="card p-[22px] flex flex-col gap-5">
      {vehicleId && <input type="hidden" name="vehicleId" value={vehicleId} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label">Plaka</span>
          <input key={`plate-${formKey}`} name="plate" defaultValue={val("plate")} className="input tabular" placeholder="06 ABC 123" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Marka</span>
          <input key={`brand-${formKey}`} name="brand" defaultValue={val("brand")} className="input" placeholder="Renault" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Model</span>
          <input key={`model-${formKey}`} name="model" defaultValue={val("model")} className="input" placeholder="Clio" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label">Model yılı</span>
          <input key={`year-${formKey}`} name="year" type="number" min={1980} max={2100} defaultValue={val("year")} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Ehliyet sınıfı</span>
          <select key={`cls-${formKey}`} name="licenseClass" defaultValue={val("licenseClass", classOptions[0] ?? "B")} className="input" required>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Kullanım</span>
          <select key={`usage-${formKey}`} name="usage" defaultValue={val("usage", "TRAINING")} className="input">
            {Object.entries(VEHICLE_USAGE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label">Durum</span>
          <select key={`status-${formKey}`} name="status" defaultValue={val("status", "ACTIVE")} className="input">
            {Object.entries(VEHICLE_STATUS_LABEL).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Kilometre</span>
          <input key={`km-${formKey}`} name="km" type="number" min={0} defaultValue={val("km", "0")} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Sonraki bakım km <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`nsk-${formKey}`} name="nextServiceKm" type="number" min={0} defaultValue={val("nextServiceKm")} className="input" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label">Yakıt <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`fuel-${formKey}`} name="fuelType" defaultValue={val("fuelType")} className="input" placeholder="Dizel" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Muayene bitiş</span>
          <input key={`insp-${formKey}`} type="date" name="inspectionUntil" defaultValue={val("inspectionUntil")} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Sigorta bitiş</span>
          <input key={`ins-${formKey}`} type="date" name="insuranceUntil" defaultValue={val("insuranceUntil")} className="input" />
        </label>

        <label className="flex flex-col gap-1.5 md:col-span-3">
          <span className="label">Varsayılan eğitmen <span className="text-muted font-normal">(opsiyonel)</span></span>
          <select key={`inst-${formKey}`} name="instructorId" defaultValue={val("instructorId")} className="input">
            <option value="">Atanmadı</option>
            {instructors.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
        </label>
      </div>

      {state.error && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-danger-bg" role="alert">
          <Icon name="alert" size={16} className="shrink-0 mt-0.5 text-danger" /><span>{state.error}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <Link href="/app/araclar" className="btn btn-secondary btn-sm">Vazgeç</Link>
        <button className="btn btn-primary btn-sm ml-auto" disabled={pending}>
          <Icon name="check" size={15} />{pending ? "Kaydediliyor…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
