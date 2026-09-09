"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { updateIntegrationsAction } from "@/app/actions/settings";
import { emptyIntegrationsState } from "@/lib/settings-form";

type Values = { netgsmUsername: string | null; netgsmPassword: string | null; netgsmHeader: string | null };

export function IntegrationsForm({ values }: { values: Values }) {
  const [state, action, pending] = useActionState(updateIntegrationsAction, emptyIntegrationsState);
  const connected = Boolean(values.netgsmUsername && values.netgsmPassword && values.netgsmHeader);

  return (
    <form action={action} className="card flex flex-col gap-4">
      <header className="flex items-center gap-2.5 px-5 pt-5">
        <h2 className="h-card">NetGSM (SMS)</h2>
        <span className={`ml-auto text-xs font-semibold rounded-full px-2 py-0.5 ${connected ? "bg-success-bg text-success" : "bg-surface-2 text-muted"}`}>
          {connected ? "Bağlı" : "Bağlı değil"}
        </span>
      </header>

      <div className="px-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label">Kullanıcı adı</span>
          <input name="netgsmUsername" type="text" defaultValue={values.netgsmUsername ?? ""} className="input" autoComplete="off" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Şifre</span>
          <input name="netgsmPassword" type="password" defaultValue={values.netgsmPassword ?? ""} className="input" autoComplete="new-password" />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="label">Mesaj başlığı (header)</span>
          <input name="netgsmHeader" type="text" defaultValue={values.netgsmHeader ?? ""} className="input" autoComplete="off" />
          <span className="hint">NetGSM panelinizde onaylı gönderici başlığınız — genellikle kurs adınızdır.</span>
        </label>
      </div>

      <div className="flex items-center gap-3 px-5 pb-5">
        {state.error && (
          <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
            <Icon name="alert" size={15} />{state.error}
          </span>
        )}
        {state.ok && !state.error && (
          <span className="flex items-center gap-2 text-[13px] text-success font-semibold">
            <Icon name="check-circle" size={15} />Kaydedildi.
          </span>
        )}
        <button className="btn btn-primary ml-auto" disabled={pending}>
          <Icon name="check" size={16} />{pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
