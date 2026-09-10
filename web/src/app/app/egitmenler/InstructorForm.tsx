"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { instructorFormAction } from "@/app/actions/instructors";
import { emptyInstructorState } from "@/lib/instructor-form";
import { splitCsv } from "@/lib/constants";

export function InstructorForm({ instructorId, classOptions, categoryOptions, defaults, submitLabel }: {
  instructorId?: string;
  classOptions: string[];
  categoryOptions: { key: string; label: string }[];
  defaults: { name?: string; phone?: string; mebLicenseNo?: string; branch?: string; weeklyCapacity?: number; licenseClasses?: string[]; subjects?: string[] };
  submitLabel: string;
}) {
  const [state, action, pending] = useActionState(instructorFormAction, emptyInstructorState);
  const back = state.values;
  const [branch, setBranch] = useState<"DRIVING" | "THEORY">((back?.branch as "DRIVING" | "THEORY") || (defaults.branch as "DRIVING" | "THEORY") || "DRIVING");
  // form.reset() (bkz. README "<select> alanları ve form.reset()") checkbox'ları da native
  // checked özelliğine döndürür; formKey ile anahtarlanan her checkbox hatadan sonra taze
  // bir düğüm olarak oluşturulup defaultChecked'i doğru uygular.
  const formKey = JSON.stringify(back ?? {});
  const selectedClasses = back?.licenseClasses !== undefined ? splitCsv(back.licenseClasses) : (defaults.licenseClasses ?? []);
  const selectedSubjects = back?.subjects !== undefined ? splitCsv(back.subjects) : (defaults.subjects ?? []);

  return (
    <form action={action} className="card p-[22px] flex flex-col gap-5">
      {instructorId && <input type="hidden" name="instructorId" value={instructorId} />}

      <div className="flex gap-2">
        <button type="button" onClick={() => setBranch("DRIVING")} className={`btn btn-sm flex-1 ${branch === "DRIVING" ? "btn-primary" : "btn-secondary"}`}>Direksiyon Eğitmeni</button>
        <button type="button" onClick={() => setBranch("THEORY")} className={`btn btn-sm flex-1 ${branch === "THEORY" ? "btn-primary" : "btn-secondary"}`}>Teorik Öğretmen</button>
        <input type="hidden" name="branch" value={branch} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label">Ad soyad</span>
          <input key={`name-${formKey}`} name="name" defaultValue={back?.name ?? defaults.name ?? ""} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Telefon <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`phone-${formKey}`} name="phone" defaultValue={back?.phone ?? defaults.phone ?? ""} className="input" placeholder="05XX XXX XX XX" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Haftalık kapasite (saat)</span>
          <input key={`cap-${formKey}`} name="weeklyCapacity" type="number" min={1} max={80} defaultValue={back?.weeklyCapacity ?? defaults.weeklyCapacity ?? 40} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">MEB izin no <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`meb-${formKey}`} name="mebLicenseNo" defaultValue={back?.mebLicenseNo ?? defaults.mebLicenseNo ?? ""} className="input" placeholder="Özel MTSK Modülü personel kaydı" />
        </label>
      </div>

      {branch === "DRIVING" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="label mb-1.5">Ehliyet sınıfları</legend>
          <div className="flex flex-wrap gap-2">
            {classOptions.map((c) => (
              <label key={`${c}-${formKey}`} className="chip cursor-pointer" data-active={selectedClasses.includes(c)}>
                <input type="checkbox" name="licenseClasses" value={c} defaultChecked={selectedClasses.includes(c)} className="sr-only" />
                {c}
              </label>
            ))}
          </div>
          {classOptions.length === 0 && <span className="hint text-warning">Önce Ayarlar › Mevzuat&apos;tan sertifika sınıfı tanımlanmalı.</span>}
        </fieldset>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="label mb-1.5">Ders kategorileri</legend>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((c) => (
              <label key={`${c.key}-${formKey}`} className="chip cursor-pointer" data-active={selectedSubjects.includes(c.key)}>
                <input type="checkbox" name="subjects" value={c.key} defaultChecked={selectedSubjects.includes(c.key)} className="sr-only" />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {state.error && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-danger-bg" role="alert">
          <Icon name="alert" size={16} className="shrink-0 mt-0.5 text-danger" /><span>{state.error}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <Link href="/app/egitmenler" className="btn btn-secondary btn-sm">Vazgeç</Link>
        <button className="btn btn-primary btn-sm ml-auto" disabled={pending}>
          <Icon name="check" size={15} />{pending ? "Kaydediliyor…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
