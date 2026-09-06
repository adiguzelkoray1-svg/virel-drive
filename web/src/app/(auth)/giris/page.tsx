import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLiveSession } from "@/lib/auth";
import { Icon } from "@/components/icons";
import VirelLogo from "@/components/VirelLogo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Giriş" };

const POINTS = ["Direksiyon planlaması çakışmasız", "Kursiyer süreci tek ekranda", "Tahsilat ve sınav takibi otomatik"];

export default async function LoginPage({ searchParams }: PageProps<"/giris">) {
  if (await getLiveSession()) redirect("/app");
  const { hata } = await searchParams;
  const notice = hata === "oturum" ? "Oturumunuz sona erdi, tekrar giriş yapın." : hata === "kurs" ? "Hesabınız bir kursa bağlı değil. Kurs yöneticinizle görüşün." : null;

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-[46%] max-w-[620px] flex-col px-14 py-14 text-on-brand" style={{ background: "var(--virel-gradient)" }}>
        <div className="flex items-baseline gap-2.5">
          <VirelLogo size={112} tone="white" />
          <span className="font-display text-[17px] font-semibold text-white/85">drive</span>
        </div>
        <div className="flex-1" />
        <h1 className="font-display text-[38px] font-bold tracking-[-0.02em] leading-[1.15]">
          Sürücü kursunuzun<br />operasyon merkezi.
        </h1>
        <p className="text-base leading-relaxed text-white/85 mt-4 max-w-[420px]">
          Ön kayıttan sertifikaya kadar tüm süreç tek yerde. Excel&apos;e, deftere ve WhatsApp aramalarına gerek kalmadan.
        </p>
        <ul className="flex flex-col gap-3.5 mt-8">
          {POINTS.map((p) => (
            <li key={p} className="flex items-center gap-3">
              <span className="w-[22px] h-[22px] rounded-full bg-white/20 flex items-center justify-center"><Icon name="check" size={13} strokeWidth={2.6} /></span>
              <span className="text-sm text-white/92">{p}</span>
            </li>
          ))}
        </ul>
        <div className="flex-1" />
        <span className="text-[13px] text-white/70">Virel dikey SaaS ailesi · Vet · Eğitim · Drive</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface">
        <div className="w-full max-w-[400px] flex flex-col">
          <div className="lg:hidden mb-8 flex items-baseline gap-2"><VirelLogo size={104} /><span className="font-display text-[15px] font-semibold text-text-2">drive</span></div>
          <h2 className="font-display text-[28px] font-bold tracking-[-0.02em]">Giriş yapın</h2>
          <p className="text-text-2 mt-2">Kurs hesabınızla devam edin.</p>
          {notice && <p className="mt-4 text-[13px] px-3.5 py-3 rounded-sm bg-warning-bg">{notice}</p>}
          <LoginForm />
          <p className="text-[13px] text-muted mt-8 leading-relaxed">
            Kursunuz henüz Virel Drive kullanmıyor mu? <span className="text-blue font-semibold">Demo talep edin.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
