"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { licenseClassRuleFormAction } from "@/app/actions/settings";
import { emptyClassRuleState } from "@/lib/settings-form";
import { VEHICLE_KIND_OPTIONS } from "@/lib/constants";

export function ClassRuleForm({ rule }: {
  rule?: { id: string; code: string; vehicleKind: string; drivingHours: number; theoryLessons: number; examAttempts: number; passScore: number };
}) {
  const [state, action, pending] = useActionState(licenseClassRuleFormAction, emptyClassRuleState);
  // Form aksiyonu sonrası React alanları sıfırlar; <select> seçimini kaybetmesin diye
  // her alan, dönen değerlere bağlı benzersiz bir key ile yeniden kurulur.
  const back = state.values;
  const k = JSON.stringify(back ?? {});
  const val = (name: string, fallback: string) => back?.[name] ?? fallback;

  return (
    <form action={action} className="card p-5 flex flex-col gap-4">
      {rule && <input type="hidden" name="ruleId" value={rule.id} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label">Sınıf kodu</span>
          <input
            key={`code-${k}`} name="code" defaultValue={val("code", rule?.code ?? "")} className={`input uppercase ${rule ? "bg-surface-2 text-text-2" : ""}`} placeholder="B"
            maxLength={6} required readOnly={!!rule}
          />
          {rule && <span className="hint">Kod sonradan değiştirilemez; öğrenciler ve araçlar buna metinle referans verir.</span>}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Araç türü</span>
          <select key={`vehicleKind-${k}`} name="vehicleKind" defaultValue={val("vehicleKind", rule?.vehicleKind ?? VEHICLE_KIND_OPTIONS[0])} className="input">
            {VEHICLE_KIND_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Direksiyon eğitimi (saat)</span>
          <input key={`drivingHours-${k}`} name="drivingHours" type="number" min={0} defaultValue={val("drivingHours", String(rule?.drivingHours ?? 14))} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Teorik ders (adet)</span>
          <input key={`theoryLessons-${k}`} name="theoryLessons" type="number" min={0} defaultValue={val("theoryLessons", String(rule?.theoryLessons ?? 12))} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Sınav hakkı</span>
          <input key={`examAttempts-${k}`} name="examAttempts" type="number" min={1} max={10} defaultValue={val("examAttempts", String(rule?.examAttempts ?? 4))} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Başarı barajı (puan)</span>
          <input key={`passScore-${k}`} name="passScore" type="number" min={0} max={100} defaultValue={val("passScore", String(rule?.passScore ?? 70))} className="input" required />
        </label>
      </div>

      {state.error && (
        <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
          <Icon name="alert" size={15} />{state.error}
        </span>
      )}
      <button className="btn btn-primary self-start" disabled={pending}>
        <Icon name="check" size={16} />{pending ? "Kaydediliyor…" : rule ? "Değişiklikleri kaydet" : "Sınıfı ekle"}
      </button>
    </form>
  );
}
