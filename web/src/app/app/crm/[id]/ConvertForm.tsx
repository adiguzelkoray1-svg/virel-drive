"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { convertLeadAction } from "@/app/actions/leads";
import { emptyConvertState } from "@/lib/lead-form";

export function ConvertForm({ leadId, defaults, licenseClasses }: {
  leadId: string;
  defaults: { firstName: string; lastName: string; phone: string; email: string; licenseClass: string };
  licenseClasses: string[];
}) {
  const [state, action, pending] = useActionState(convertLeadAction, emptyConvertState);
  const back = state.values;
  const k = JSON.stringify(back ?? {});

  return (
    <form action={action} className="px-5 pb-5 pt-1 flex flex-col gap-3.5">
      <input type="hidden" name="leadId" value={leadId} />
      <p className="text-[13px] text-text-2 leading-relaxed">
        Aday ön kayıt aşamasında bir kursiyer kaydına dönüşür ve bu aday kartına bağlanır.
        Ad soyad tek alanda tutulduğu için ayırmayı kontrol edin.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="label">Ad</span>
          <input key={`firstName-${k}`} name="firstName" defaultValue={back?.firstName ?? defaults.firstName} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Soyad</span>
          <input key={`lastName-${k}`} name="lastName" defaultValue={back?.lastName ?? defaults.lastName} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Telefon</span>
          <input key={`phone-${k}`} name="phone" defaultValue={back?.phone ?? defaults.phone} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">E-posta <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`email-${k}`} name="email" type="email" defaultValue={back?.email ?? defaults.email} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Ehliyet sınıfı</span>
          <select key={`licenseClass-${k}`} name="licenseClass" defaultValue={back?.licenseClass ?? defaults.licenseClass} className="input" required>
            <option value="">Seçin</option>
            {licenseClasses.map((c) => <option key={c} value={c}>{c} sınıfı</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Dosya no <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`fileNo-${k}`} name="fileNo" defaultValue={back?.fileNo ?? ""} className="input" placeholder="2026-0174" />
        </label>
      </div>

      {state.error && (
        <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
          <Icon name="alert" size={15} />{state.error}
        </span>
      )}
      <button className="btn btn-primary btn-sm self-start" disabled={pending}>
        <Icon name="user" size={16} />{pending ? "Oluşturuluyor…" : "Kursiyere dönüştür"}
      </button>
    </form>
  );
}
