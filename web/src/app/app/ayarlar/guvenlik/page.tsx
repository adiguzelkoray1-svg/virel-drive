import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { Icon } from "@/components/icons";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export const metadata: Metadata = { title: "Güvenlik ve KVKK · Ayarlar" };

export default async function SecuritySettingsPage() {
  await requireUser();

  return (
    <>
      <div className="card p-5 flex items-start gap-3">
        <span className="w-[34px] h-[34px] rounded-md bg-blue-050 text-blue flex items-center justify-center shrink-0"><Icon name="lock" size={18} /></span>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="h-card">Güvenlik ve KVKK</span>
          <span className="text-[13px] text-text-2 leading-relaxed max-w-[620px]">
            Kendi hesap şifrenizi buradan değiştirebilirsiniz. Bir kullanıcının şifresini
            unuttuğunda sıfırlamak için hâlâ &quot;Kullanıcılar ve roller&quot;deki geçici şifre
            akışı kullanılır — bu, oturumu açıkken kendi isteğinizle değiştirmenizdir.
          </span>
        </div>
      </div>

      <div className="card">
        <header className="px-5 pt-5 pb-1">
          <h2 className="h-card">Şifre değiştir</h2>
        </header>
        <div className="px-5 pb-5 pt-3 max-w-[360px]">
          <ChangePasswordForm />
        </div>
      </div>
    </>
  );
}
