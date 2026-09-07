"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { leadFormAction } from "@/app/actions/leads";
import { emptyLeadState } from "@/lib/lead-form";
import { LEAD_SOURCE_LABEL, LEAD_STAGES } from "@/lib/constants";

export function LeadForm({ lead, licenseClasses }: {
  lead?: {
    id: string; name: string; phone: string; email: string | null; licenseClass: string | null;
    source: string; stage: string; nextFollowUpAt: string | null; notes: string | null;
  };
  licenseClasses: string[];
}) {
  const [state, action, pending] = useActionState(leadFormAction, emptyLeadState);
  // Form aksiyonu sonrası React alanları sıfırlar; <select> seçimini kaybetmesin diye
  // her alan, dönen değerlere bağlı benzersiz bir key ile yeniden kurulur.
  const back = state.values;
  const k = JSON.stringify(back ?? {});
  const val = (name: keyof NonNullable<typeof back>, fallback = "") => back?.[name] ?? fallback;
  // Aynı telefonla açık aday uyarısı bir kez gösterilir; ikinci kaydetmede geçilir.
  const duplicate = !!state.error?.includes("Yine de eklemek");

  return (
    <form action={action} className="card p-5 flex flex-col gap-4">
      {lead && <input type="hidden" name="leadId" value={lead.id} />}
      {duplicate && <input type="hidden" name="force" value="1" />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="label">Ad soyad</span>
          <input key={`name-${k}`} name="name" defaultValue={val("name", lead?.name ?? "")} className="input" placeholder="Ceren Aksoy" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Telefon</span>
          <input key={`phone-${k}`} name="phone" defaultValue={val("phone", lead?.phone ?? "")} className="input" placeholder="0532 000 00 00" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">E-posta <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`email-${k}`} name="email" type="email" defaultValue={val("email", lead?.email ?? "")} className="input" placeholder="ceren@ornek.com" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">İlgilendiği sınıf</span>
          <select key={`licenseClass-${k}`} name="licenseClass" defaultValue={val("licenseClass", lead?.licenseClass ?? "")} className="input">
            <option value="">Belirtilmedi</option>
            {licenseClasses.map((c) => <option key={c} value={c}>{c} sınıfı</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Nereden geldi</span>
          <select key={`source-${k}`} name="source" defaultValue={val("source", lead?.source ?? "INSTAGRAM")} className="input">
            {Object.entries(LEAD_SOURCE_LABEL).map(([key, l]) => <option key={key} value={key}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Aşama</span>
          <select key={`stage-${k}`} name="stage" defaultValue={val("stage", lead?.stage ?? "NEW")} className="input">
            {LEAD_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Sonraki takip <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`nextFollowUpAt-${k}`} type="date" name="nextFollowUpAt" defaultValue={val("nextFollowUpAt", lead?.nextFollowUpAt ?? "")} className="input" />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="label">Not <span className="text-muted font-normal">(opsiyonel)</span></span>
        <textarea key={`notes-${k}`} name="notes" defaultValue={val("notes", lead?.notes ?? "")} className="input min-h-[88px] py-2.5" placeholder="Hafta sonu ders isteyip istemediği, bütçesi, kararsız olduğu konular…" />
      </label>

      {state.error && (
        <span className={`flex items-center gap-2 text-[13px] font-semibold ${duplicate ? "text-warning" : "text-danger"}`}>
          <Icon name="alert" size={15} />{state.error}
        </span>
      )}
      <button className="btn btn-primary self-start" disabled={pending}>
        <Icon name="check" size={16} />{pending ? "Kaydediliyor…" : lead ? "Değişiklikleri kaydet" : duplicate ? "Yine de ekle" : "Adayı ekle"}
      </button>
    </form>
  );
}
