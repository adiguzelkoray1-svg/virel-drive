"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { createSchoolAction } from "@/app/actions/admin";
import { emptySchoolState } from "@/lib/admin-form";
import { SCHOOL_PLAN_LABEL } from "@/lib/constants";

type Result = { ok?: boolean; tempPassword?: string; ownerEmail?: string; schoolId?: string; error?: string; values?: Record<string, string> };

export function NewSchoolForm() {
  const [state, action, pending] = useActionState<Result, FormData>(createSchoolAction, emptySchoolState);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  if (state.ok) {
    return (
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-md bg-success-bg text-success flex items-center justify-center shrink-0"><Icon name="check" size={18} /></span>
          <span className="h-card">Kurs oluşturuldu</span>
        </div>
        <p className="text-[13px] text-text-2 leading-relaxed">
          Bu geçici şifre yalnızca burada, bir kez gösteriliyor — e-posta gönderme altyapısı olmadığı için
          kurs sahibine elle iletmeniz gerekiyor. Sayfadan ayrılmadan önce not alın.
        </p>
        <div className="rounded-sm bg-surface-2 p-4 flex items-center gap-4 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <span className="stat-lbl">E-posta</span>
            <span className="text-[13px] font-semibold tabular">{state.ownerEmail}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="stat-lbl">Geçici şifre</span>
            <span className="font-display text-[18px] font-bold tracking-[0.06em] tabular">{state.tempPassword}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm ml-auto"
            onClick={() => { navigator.clipboard.writeText(`${state.ownerEmail} / ${state.tempPassword}`); setCopied(true); }}
          >
            <Icon name="copy" size={14} />{copied ? "Kopyalandı" : "Kopyala"}
          </button>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href={`/admin/kurslar/${state.schoolId}`} className="btn btn-primary btn-sm">Kurs sayfasına git</Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.push("/admin/kurslar/yeni")}>Başka kurs ekle</button>
        </div>
      </div>
    );
  }

  const back = state.values;
  const k = JSON.stringify(back ?? {});
  const val = (name: string) => back?.[name] ?? "";

  return (
    <form action={action} className="card p-5 flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label">Kurs adı</span>
          <input key={`name-${k}`} name="name" defaultValue={val("name")} className="input" placeholder="Yıldız Sürücü Kursu" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Plan</span>
          <select key={`plan-${k}`} name="plan" defaultValue={val("plan") || "TRIAL"} className="input">
            {Object.entries(SCHOOL_PLAN_LABEL).map(([key, l]) => <option key={key} value={key}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Şehir <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`city-${k}`} name="city" defaultValue={val("city")} className="input" placeholder="Ankara" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">İlçe <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`district-${k}`} name="district" defaultValue={val("district")} className="input" placeholder="Çankaya" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Telefon <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`phone-${k}`} name="phone" defaultValue={val("phone")} className="input" placeholder="0312 000 00 00" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Kurumsal e-posta <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`email-${k}`} name="email" type="email" defaultValue={val("email")} className="input" placeholder="info@kurs.com" />
        </label>
      </div>

      <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label">Kurs sahibinin adı</span>
          <input key={`ownerName-${k}`} name="ownerName" defaultValue={val("ownerName")} className="input" placeholder="Ahmet Yılmaz" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Kurs sahibinin e-postası</span>
          <input key={`ownerEmail-${k}`} name="ownerEmail" type="email" defaultValue={val("ownerEmail")} className="input" placeholder="ahmet@kurs.com" required />
          <span className="hint">Giriş bilgisi olarak kullanılacak; geçici şifre kayıttan sonra bir kez gösterilir.</span>
        </label>
      </div>

      {state.error && (
        <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
          <Icon name="alert" size={15} />{state.error}
        </span>
      )}
      <button className="btn btn-primary self-start" disabled={pending}>
        <Icon name="plus" size={16} />{pending ? "Oluşturuluyor…" : "Kursu oluştur"}
      </button>
    </form>
  );
}
