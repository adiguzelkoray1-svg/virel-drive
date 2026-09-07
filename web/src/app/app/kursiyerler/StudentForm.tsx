"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import type { StudentFormState } from "@/lib/student-form";
import { emptyStudentState } from "@/lib/student-form";

type Defaults = {
  firstName: string; lastName: string; phone: string; email: string; nationalId: string;
  birthDate: string; address: string; licenseClass: string; fileNo: string;
};

export function StudentForm({ action, studentId, defaults, licenseClasses, submitLabel }: {
  action: (s: StudentFormState, f: FormData) => Promise<StudentFormState>;
  studentId?: string;
  defaults: Defaults;
  licenseClasses: string[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, emptyStudentState);
  const back = state.values;
  const k = JSON.stringify(back ?? {});

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      {studentId && <input type="hidden" name="id" value={studentId} />}

      <div className="grid sm:grid-cols-2 gap-3.5">
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
          <span className="label">TC Kimlik No <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`nationalId-${k}`} name="nationalId" inputMode="numeric" maxLength={11} defaultValue={back?.nationalId ?? defaults.nationalId} className="input" placeholder="11 haneli" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Doğum tarihi <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`birthDate-${k}`} name="birthDate" type="date" defaultValue={back?.birthDate ?? defaults.birthDate} className="input" />
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
          <input key={`fileNo-${k}`} name="fileNo" defaultValue={back?.fileNo ?? defaults.fileNo} className="input" placeholder="2026-0174" />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="label">Adres <span className="text-muted font-normal">(opsiyonel)</span></span>
        <textarea key={`address-${k}`} name="address" rows={2} defaultValue={back?.address ?? defaults.address} className="input py-2.5 h-auto" />
      </label>

      {state.error && (
        <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
          <Icon name="alert" size={15} />{state.error}
        </span>
      )}
      <button className="btn btn-primary btn-sm self-start" disabled={pending}>
        <Icon name="user" size={16} />{pending ? "Kaydediliyor…" : submitLabel}
      </button>
    </form>
  );
}
