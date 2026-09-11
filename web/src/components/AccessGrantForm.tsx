"use client";
import { useActionState, useState } from "react";
import { Icon } from "@/components/icons";
import { emptyAccessState, type AccessFormState } from "@/lib/users-form";
import { date } from "@/lib/format";

type AccessAction = (prevState: AccessFormState, formData: FormData) => Promise<AccessFormState>;

/**
 * Instructor/Student gibi zaten var olan bir profile giriş erişimi (User) bağlamak için
 * paylaşılan form — bkz. app/actions/users.ts::grantInstructorAccessAction/grantStudentAccessAction.
 *
 * `existing` her zaman geçirilir, üst bileşen bu bileşeni koşullu olarak DEĞİŞTİRMEZ (aynı yerde
 * hep aynı bileşen kalır). Sunucu aksiyonu tamamlandığında Next sayfayı zaten yeniden çekiyor —
 * üst bileşen `{instructor.user ? <Statik/> : <AccessGrantForm/>}` gibi koşullu render etseydi,
 * `instructor.user` artık dolu olduğu için bu bileşen anında unmount olur ve `state.ok` içindeki
 * tek seferlik geçici şifre hiç gösterilmeden kaybolurdu. Bu yüzden öncelik sırası: önce kendi
 * `state.ok`'u (az önce biz oluşturduysak), sonra `existing` (sayfa ilk yüklendiğinde zaten
 * bağlıysa), sonra boş form.
 */
export function AccessGrantForm({ action, entityId, defaultEmail, existing }: {
  action: AccessAction; entityId: string; defaultEmail?: string; existing?: { email: string; lastLoginAt: Date | null } | null;
}) {
  const [state, formAction, pending] = useActionState(action, emptyAccessState);
  const [copied, setCopied] = useState(false);

  if (state.ok) {
    return (
      <div className="flex flex-col gap-2.5 p-3.5 rounded-md bg-success-bg">
        <span className="text-[13px] font-semibold text-success flex items-center gap-2"><Icon name="check-circle" size={15} />Giriş erişimi oluşturuldu</span>
        <div className="flex items-center gap-3 flex-wrap text-[13px]">
          <span className="tabular">{state.email}</span>
          <span className="font-display font-bold tabular tracking-[0.04em]">{state.tempPassword}</span>
          <button
            type="button"
            className="btn btn-secondary btn-xs ml-auto"
            onClick={() => { navigator.clipboard.writeText(`${state.email} / ${state.tempPassword}`); setCopied(true); }}
          >
            <Icon name="copy" size={13} />{copied ? "Kopyalandı" : "Kopyala"}
          </button>
        </div>
        <span className="text-xs text-text-2">Bu şifre yalnızca burada gösteriliyor — not alıp kendisine elle iletin.</span>
      </div>
    );
  }

  if (existing) {
    return (
      <div className="flex items-center gap-2.5 text-[13px]">
        <Icon name="check-circle" size={15} className="text-success" />
        <span className="tabular">{existing.email}</span>
        <span className="text-xs text-muted ml-auto">{existing.lastLoginAt ? `Son giriş ${date(existing.lastLoginAt)}` : "Hiç giriş yapmadı"}</span>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex items-end gap-2 flex-wrap">
      <input type="hidden" name="id" value={entityId} />
      <label className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
        <span className="label">E-posta</span>
        <input name="email" type="email" defaultValue={defaultEmail} className="input" placeholder="ornek@eposta.com" required />
      </label>
      <button className="btn btn-secondary btn-sm" disabled={pending}><Icon name="key" size={14} />{pending ? "Oluşturuluyor…" : "Giriş erişimi oluştur"}</button>
      {state.error && <span className="w-full flex items-center gap-2 text-[13px] text-danger"><Icon name="alert" size={14} />{state.error}</span>}
    </form>
  );
}
