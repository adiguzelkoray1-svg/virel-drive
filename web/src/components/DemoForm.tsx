"use client";
import { useActionState } from "react";
import { Field, Notice } from "@/components/ui";
import { Icon } from "@/components/icons";
import type { DemoState } from "@/app/actions/demo";

type Size = { key: string; label: string };

export function DemoForm({ action, sizes }: { action: (s: DemoState, f: FormData) => Promise<DemoState>; sizes: Size[] }) {
  const [state, formAction, pending] = useActionState(action, {});
  if (state.ok) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-10">
        <span className="w-14 h-14 rounded-full bg-success-bg text-success flex items-center justify-center"><Icon name="check-circle" size={28} /></span>
        <h3 className="font-display text-xl font-bold">Talebiniz alındı</h3>
        <p className="text-[14px] text-text-2 max-w-[360px]">En kısa sürede sizinle iletişime geçip kursunuza özel bir demo planlayacağız.</p>
      </div>
    );
  }
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Notice kind="danger">{state.error}</Notice>}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Kurs adı *"><input name="schoolName" required className="input h-11" placeholder="Yıldız Sürücü Kursu" /></Field>
        <Field label="Şehir"><input name="city" className="input h-11" placeholder="Ankara" /></Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Ad Soyad *"><input name="name" required className="input h-11" placeholder="Adınız" /></Field>
        <Field label="Telefon"><input name="phone" type="tel" className="input h-11" placeholder="05xx xxx xx xx" /></Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="E-posta *"><input name="email" type="email" required className="input h-11" placeholder="ad@kursunuz.com" /></Field>
        <Field label="Kurs büyüklüğü"><select name="size" className="input h-11" defaultValue=""><option value="">Seçin</option>{sizes.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></Field>
      </div>
      <Field label="Not" hint="Hangi modüller sizin için öncelikli? Uygun gün/saat?"><textarea name="message" rows={3} className="input py-2.5 h-auto" /></Field>
      <label className="flex items-start gap-2 text-[13px] text-text-2"><input type="checkbox" name="kvkk" required className="mt-0.5 w-4 h-4 accent-[var(--virel-blue)]" /><span>KVKK aydınlatma metnini okudum; demo için benimle iletişime geçilmesini kabul ediyorum.</span></label>
      <button disabled={pending} className="btn btn-primary h-[46px] text-[15px]">{pending ? "Gönderiliyor…" : "Demo Talep Et"}</button>
    </form>
  );
}
