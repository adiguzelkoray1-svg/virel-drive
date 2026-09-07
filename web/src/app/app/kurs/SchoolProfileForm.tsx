"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { updateSchoolProfileAction } from "@/app/actions/school";
import { emptySchoolProfileState } from "@/lib/school-form";

type School = {
  name: string; city: string | null; district: string | null; phone: string | null; email: string | null;
  address: string | null; taxNumber: string | null; taxOffice: string | null; mebCode: string | null;
};

export function SchoolProfileForm({ school }: { school: School }) {
  const [state, action, pending] = useActionState(updateSchoolProfileAction, emptySchoolProfileState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="label">Kurs adı</span>
          <input name="name" defaultValue={school.name} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Şehir</span>
          <input name="city" defaultValue={school.city ?? ""} className="input" placeholder="Ankara" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">İlçe</span>
          <input name="district" defaultValue={school.district ?? ""} className="input" placeholder="Çankaya" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Telefon</span>
          <input name="phone" defaultValue={school.phone ?? ""} className="input" placeholder="0312 000 00 00" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Kurumsal e-posta</span>
          <input name="email" type="email" defaultValue={school.email ?? ""} className="input" placeholder="info@kurs.com" />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="label">Adres</span>
          <input name="address" defaultValue={school.address ?? ""} className="input" placeholder="Kızılay Mah. 1234. Sk. No:5, Çankaya/Ankara" />
        </label>
      </div>

      <div className="card p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label">Vergi no</span>
          <input name="taxNumber" defaultValue={school.taxNumber ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Vergi dairesi</span>
          <input name="taxOffice" defaultValue={school.taxOffice ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">MEB kurum kodu</span>
          <input name="mebCode" defaultValue={school.mebCode ?? ""} className="input" />
        </label>
      </div>

      <div className="flex items-center gap-3">
        {state.error && <span className="flex items-center gap-2 text-[13px] text-danger font-semibold"><Icon name="alert" size={15} />{state.error}</span>}
        {state.ok && !state.error && <span className="flex items-center gap-2 text-[13px] text-success font-semibold"><Icon name="check-circle" size={15} />Kaydedildi.</span>}
        <button className="btn btn-primary ml-auto" disabled={pending}>
          <Icon name="check" size={16} />{pending ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
        </button>
      </div>
    </form>
  );
}
