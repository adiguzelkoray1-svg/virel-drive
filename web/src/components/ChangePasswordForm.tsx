"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { changePasswordFormAction } from "@/app/actions/account";
import { emptyChangePasswordState } from "@/lib/account-form";

/** Masaüstü Ayarlar, eğitmen ve kursiyer Profil sayfaları arasında paylaşılır — üçü de
 *  aynı `User.passwordHash`'i, aynı aksiyonla değiştirir (bkz. actions/account.ts). */
export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordFormAction, emptyChangePasswordState);

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <label className="flex flex-col gap-1.5">
        <span className="label">Mevcut şifre</span>
        <input name="currentPassword" type="password" autoComplete="current-password" className="input" required />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Yeni şifre</span>
        <input name="newPassword" type="password" autoComplete="new-password" minLength={8} className="input" required />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Yeni şifre (tekrar)</span>
        <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} className="input" required />
      </label>

      {state.error && (
        <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
          <Icon name="alert" size={15} />{state.error}
        </span>
      )}
      {state.ok && (
        <span className="flex items-center gap-2 text-[13px] text-success font-semibold">
          <Icon name="check-circle" size={15} />Şifreniz değiştirildi.
        </span>
      )}
      <button className="btn btn-primary self-start" disabled={pending}>
        <Icon name="lock" size={16} />{pending ? "Kaydediliyor…" : "Şifreyi değiştir"}
      </button>
    </form>
  );
}
