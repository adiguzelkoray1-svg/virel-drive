"use client";
import { useActionState, useState } from "react";
import { Icon } from "@/components/icons";
import { createUserAction } from "@/app/actions/users";
import { emptyUserState } from "@/lib/users-form";
import { ROLE_LABEL } from "@/lib/constants";

const CREATABLE_ROLES = ["OWNER", "MANAGER", "SECRETARY", "ACCOUNTANT"] as const;

export function UserForm() {
  const [state, action, pending] = useActionState(createUserAction, emptyUserState);
  const [copied, setCopied] = useState(false);

  if (state.ok) {
    return (
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-md bg-success-bg text-success flex items-center justify-center shrink-0"><Icon name="check" size={18} /></span>
          <span className="h-card">Kullanıcı oluşturuldu</span>
        </div>
        <p className="text-[13px] text-text-2 leading-relaxed">
          Bu geçici şifre yalnızca burada, bir kez gösteriliyor — kendisine elle iletmeniz gerekiyor.
        </p>
        <div className="rounded-sm bg-surface-2 p-4 flex items-center gap-4 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <span className="stat-lbl">E-posta</span>
            <span className="text-[13px] font-semibold tabular">{state.email}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="stat-lbl">Geçici şifre</span>
            <span className="font-display text-[18px] font-bold tracking-[0.06em] tabular">{state.tempPassword}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm ml-auto"
            onClick={() => { navigator.clipboard.writeText(`${state.email} / ${state.tempPassword}`); setCopied(true); }}
          >
            <Icon name="copy" size={14} />{copied ? "Kopyalandı" : "Kopyala"}
          </button>
        </div>
      </div>
    );
  }

  const back = state.values;
  const k = JSON.stringify(back ?? {});

  return (
    <form action={action} className="card p-5 flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label">Ad soyad</span>
          <input key={`name-${k}`} name="name" defaultValue={back?.name ?? ""} className="input" placeholder="Ayşe Yılmaz" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">E-posta</span>
          <input key={`email-${k}`} name="email" type="email" defaultValue={back?.email ?? ""} className="input" placeholder="ayse@kurs.com" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Rol</span>
          <select key={`role-${k}`} name="role" defaultValue={back?.role ?? "SECRETARY"} className="input">
            {CREATABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </label>
      </div>
      <span className="hint">Direksiyon eğitmeni / teorik öğretmen için Eğitmenler sayfasından ilgili kişinin profiline giriş erişimi ekleyin.</span>

      {state.error && (
        <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
          <Icon name="alert" size={15} />{state.error}
        </span>
      )}
      <button className="btn btn-primary self-start" disabled={pending}>
        <Icon name="plus" size={16} />{pending ? "Oluşturuluyor…" : "Kullanıcı ekle"}
      </button>
    </form>
  );
}
