"use client";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Icon } from "@/components/icons";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="flex flex-col gap-[18px] mt-[30px]">
      <label className="flex flex-col gap-1.5">
        <span className="label">E-posta</span>
        <div className="relative">
          <Icon name="mail" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input name="email" type="email" autoComplete="email" required className="input h-[46px] pl-10" placeholder="ahmet@yildizsurucukursu.com" aria-invalid={!!state.error} />
        </div>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Şifre</span>
        <div className="relative">
          <Icon name="lock" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input name="password" type="password" autoComplete="current-password" required className="input h-[46px] pl-10" placeholder="••••••••••" aria-invalid={!!state.error} />
        </div>
      </label>

      {state.error && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-danger-bg text-text" role="alert">
          <Icon name="alert" size={16} className="shrink-0 mt-0.5 text-danger" />
          <span>{state.error}</span>
        </div>
      )}

      <button className="btn btn-primary h-[46px] mt-1.5" disabled={pending}>{pending ? "Giriş yapılıyor…" : "Giriş yap"}</button>
    </form>
  );
}
