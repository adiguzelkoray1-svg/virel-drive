import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLiveSession } from "@/lib/auth";
import VirelLogo from "@/components/VirelLogo";
import { Icon, type IconName } from "@/components/icons";
import { DemoForm } from "@/components/DemoForm";
import { requestDemoAction } from "@/app/actions/demo";
import { DEMO_SIZES } from "@/lib/demo";
import { SCHOOL_PLAN_LIMITS } from "@/lib/constants";
import { number } from "@/lib/format";

export const metadata: Metadata = {
  title: "Virel Drive · Sürücü kursları için yönetim platformu",
  description: "Ön kayıttan sertifikaya, direksiyon dersinden tahsilata kadar tüm süreç tek platformda. 14 gün ücretsiz deneyin.",
};

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: "calendar", title: "Takvim ve direksiyon dersleri", desc: "Eğitmen ve araç bazlı haftalık planlama, çakışma tespiti, en uygun saat önerileri." },
  { icon: "users", title: "Kursiyer dosyası ve evraklar", desc: "Süreç çizelgesi, gelişim puanları, 7 zorunlu belgenin durumu tek ekranda." },
  { icon: "book", title: "Teorik eğitim ve yoklama", desc: "Dönem programı, devam takibi, devam riski altındaki kursiyerler otomatik listelenir." },
  { icon: "exam", title: "e-Sınav ve direksiyon sınavı", desc: "Hak ve eğitim şartı otomatik kontrol edilir, sonuç girilince süreç kendiliğinden ilerler." },
  { icon: "wallet", title: "Tahsilat ve ödeme planları", desc: "Taksit takibi, geciken ödeme uyarıları, gelir-gider raporu tek yerde." },
  { icon: "funnel", title: "CRM ve ön kayıt", desc: "Aday pipeline'ı, kaynak bazlı dönüşüm oranı, tek tıkla kursiyere dönüştürme." },
  { icon: "whatsapp", title: "WhatsApp ve SMS hatırlatma", desc: "Ders, ödeme ve sınav hatırlatmaları kursiyere otomatik gider." },
  { icon: "phone", title: "Mobil eğitmen ve kursiyer uygulaması", desc: "Eğitmen dersini telefonundan tamamlar, kursiyer ilerlemesini ve borcunu kendi telefonundan görür." },
];

const PLANS: { key: keyof typeof SCHOOL_PLAN_LIMITS; name: string; priceMonthly: number; features: string[] }[] = [
  {
    key: "STARTER", name: "Başlangıç", priceMonthly: 79000,
    features: ["Direksiyon dersleri, kursiyer dosyası, teorik eğitim, sınavlar", "Tahsilat ve ödeme planı takibi", "Kursiyer mobil portalı"],
  },
  {
    key: "PRO", name: "Profesyonel", priceMonthly: 219000,
    features: ["Başlangıç'taki her şey", "CRM ve ön kayıt pipeline'ı", "Raporlar ve CSV dışa aktarma", "WhatsApp/SMS hatırlatmaları", "Eğitmen mobil portalı"],
  },
  {
    key: "ENTERPRISE", name: "Kurumsal", priceMonthly: 449000,
    features: ["Profesyonel'deki her şey", "En yüksek kullanıcı/kursiyer limiti", "Öncelikli destek", "Hesap yöneticisi"],
  },
];

export default async function LandingPage() {
  const session = await getLiveSession();
  if (session) redirect(session.role === "SUPER_ADMIN" ? "/admin" : session.role === "STUDENT" ? "/kursiyer" : "/app");

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-border">
        <div className="max-w-[1160px] mx-auto px-6 h-16 flex items-center gap-8">
          <Link href="/" aria-label="Virel Drive" className="flex items-baseline gap-2"><VirelLogo size={92} /><span className="font-display text-[15px] font-semibold text-text-2">drive</span></Link>
          <nav className="hidden md:flex items-center gap-6 text-[14px] font-semibold text-text-2">
            <a href="#ozellikler" className="hover:text-text">Özellikler</a>
            <a href="#fiyatlar" className="hover:text-text">Fiyatlandırma</a>
            <a href="#demo" className="hover:text-text">Demo</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/giris" className="btn btn-secondary btn-sm">Giriş yap</Link>
            <a href="#demo" className="btn btn-primary btn-sm">Demo talep et</a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden" style={{ background: "var(--virel-gradient)" }}>
        <svg width="900" height="900" viewBox="0 0 800 900" fill="none" className="absolute -right-40 -top-40 opacity-[0.12]" aria-hidden="true"><path d="M-40 260 L400 900 L840 260" stroke="#FFFFFF" strokeWidth="160" strokeLinecap="round" strokeLinejoin="round" /><circle cx="400" cy="120" r="90" fill="#FFFFFF" /></svg>
        <div className="max-w-[1160px] mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center relative">
          <div className="flex flex-col gap-6 text-white">
            <span className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-white/15 text-[12px] font-bold tracking-wide uppercase">Sürücü kursları için</span>
            <h1 className="font-display text-[40px] sm:text-[52px] font-bold leading-[1.05] tracking-tight">Sürücü kursunuzun operasyon merkezi.</h1>
            <p className="text-[17px] leading-relaxed text-white/85 max-w-[540px]">Ön kayıttan sertifikaya, direksiyon dersinden tahsilata kadar tüm süreç Virel Drive&apos;ta. Excel&apos;e, deftere ve WhatsApp aramalarına gerek kalmadan. Kurulum yok, 14 gün ücretsiz.</p>
            <div className="flex flex-wrap gap-3">
              <a href="#demo" className="btn h-12 px-6 text-[15px] bg-white text-blue-700 hover:bg-white/90">Demo talep et<Icon name="arrow-right" size={18} /></a>
              <Link href="/giris" className="btn h-12 px-6 text-[15px] btn-ghost text-white border border-white/30 hover:bg-white/10">Zaten kullanıcıysanız giriş yapın</Link>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
              {["Kredi kartı gerekmez", "Verileriniz Türkiye mevzuatına uygun (KVKK)", "İstediğiniz an iptal"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-[13px] text-white/85"><Icon name="check" size={14} />{t}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-[16px] bg-surface shadow-2xl p-5 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-[15px] font-bold">Bugünün Programı</h3>
                <p className="text-xs text-text-2">18 ders · 2 tamamlandı</p>
              </div>
              <span className="badge b-success text-[11px]"><span className="dot" />Kurs açık</span>
            </div>
            {[
              { time: "09:00", name: "Gizem Polat", sub: "B sınıfı · Ali Kaya", status: "Tamamlandı" },
              { time: "10:00", name: "Emre Özkan", sub: "D sınıfı · Mehmet Öz", status: "Devam ediyor" },
              { time: "11:00", name: "Ceren Taş", sub: "B sınıfı · Ali Kaya", status: "Bekliyor" },
            ].map((r) => (
              <div key={r.name} className="flex items-center gap-3 py-2.5 border-t border-border first:border-t-0">
                <span className="text-[13px] font-semibold w-12 shrink-0 tabular">{r.time}</span>
                <div className="flex flex-col min-w-0"><span className="text-[13px] font-semibold truncate">{r.name}</span><span className="text-xs text-text-2 truncate">{r.sub}</span></div>
                <span className="ml-auto text-xs text-text-2 shrink-0">{r.status}</span>
              </div>
            ))}
            <div className="mt-1 p-3 rounded-[10px] bg-blue-050 text-[13px] text-blue-700 flex items-center gap-2">
              <Icon name="whatsapp" size={16} />Ayşe&apos;ye yarınki dersi için WhatsApp hatırlatması gönderildi.
            </div>
          </div>
        </div>
      </section>

      <section id="ozellikler" className="max-w-[1160px] mx-auto px-6 py-20">
        <div className="max-w-[640px] mb-12">
          <span className="text-[13px] font-bold uppercase tracking-wide text-blue">Özellikler</span>
          <h2 className="font-display text-[30px] font-bold mt-2 tracking-tight">Kağıt defterden ve dağınık uygulamalardan kurtulun.</h2>
          <p className="text-text-2 mt-3 leading-relaxed">Her modül birbirine bağlı: ders sonu değerlendirmesi kursiyer dosyasını, sınav sonucu süreç aşamasını, ödeme planı tahsilat panosunu güncelller.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-[14px] border border-border p-5 flex flex-col gap-3 bg-surface">
              <span className="w-10 h-10 rounded-[10px] bg-blue-050 text-blue-700 flex items-center justify-center"><Icon name={f.icon} size={20} /></span>
              <h3 className="font-semibold text-[15px]">{f.title}</h3>
              <p className="text-[13px] text-text-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="fiyatlar" className="bg-surface-2 py-20">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="max-w-[640px] mb-12">
            <span className="text-[13px] font-bold uppercase tracking-wide text-blue">Fiyatlandırma</span>
            <h2 className="font-display text-[30px] font-bold mt-2 tracking-tight">Kursunuza göre plan seçin.</h2>
            <p className="text-text-2 mt-3 leading-relaxed">Tüm planlar 14 günlük ücretsiz denemeyle başlar. Fiyatlar aylık, KDV hariçtir.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {PLANS.map((p, i) => {
              const limits = SCHOOL_PLAN_LIMITS[p.key];
              return (
                <div key={p.key} className={`rounded-[16px] p-6 flex flex-col gap-4 bg-surface ${i === 1 ? "ring-2 ring-blue relative" : "border border-border"}`}>
                  {i === 1 && <span className="absolute -top-3 left-6 badge b-brand text-[11px]">En çok tercih edilen</span>}
                  <div>
                    <h3 className="font-display text-lg font-bold">{p.name}</h3>
                    <p className="text-xs text-text-2 mt-1">{number(limits.userLimit)} kullanıcı · {number(limits.studentLimit)} kursiyer</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold tabular">₺{number(p.priceMonthly / 100)}</span>
                    <span className="text-text-2 text-sm">/ ay</span>
                  </div>
                  <ul className="flex flex-col gap-2.5 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[13px] text-text-2"><Icon name="check" size={14} className="text-success mt-0.5 shrink-0" />{f}</li>
                    ))}
                  </ul>
                  <a href="#demo" className={`btn h-11 justify-center ${i === 1 ? "btn-primary" : "btn-secondary"}`}>Ücretsiz denemeye başla</a>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted mt-6 max-w-[640px]">Faturalar kursunuzun kendi vergi kimliğiyle kesilir; Virel yalnızca abonelik faturası düzenler. Kurumsal için özel fiyat: demo talep edin.</p>
        </div>
      </section>

      <section id="demo" className="max-w-[1160px] mx-auto px-6 py-20 grid lg:grid-cols-[1fr_1.1fr] gap-14">
        <div>
          <span className="text-[13px] font-bold uppercase tracking-wide text-blue">Demo</span>
          <h2 className="font-display text-[30px] font-bold mt-2 tracking-tight">Kursunuza özel 30 dakikalık demo.</h2>
          <p className="text-text-2 mt-3 leading-relaxed">Mevcut işleyişinizi anlatın; Virel Drive&apos;ı sizin ders düzeninizle, kendi eğitmen ve araç listenizle canlı gösterelim.</p>
          <ul className="flex flex-col gap-3 mt-6">
            {["Ekibinizle birlikte ekran paylaşımlı görüşme", "Kursunuza uygun plan önerisi", "CSV ile kursiyer verisi aktarımı", "WhatsApp/SMS kurulum yol haritası"].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-[14px]"><span className="w-6 h-6 rounded-full bg-blue-050 text-blue-700 flex items-center justify-center shrink-0"><Icon name="check" size={13} /></span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[16px] border border-border p-6 bg-surface">
          <DemoForm action={requestDemoAction} sizes={DEMO_SIZES} />
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="max-w-[1160px] mx-auto px-6 flex flex-col sm:flex-row items-center gap-4 justify-between text-xs text-muted">
          <span className="flex items-baseline gap-1.5"><VirelLogo size={70} /><span className="font-semibold">drive</span></span>
          <span>© {new Date().getFullYear()} Virel · Sürücü kursları için yönetim platformu</span>
          <Link href="/giris" className="font-semibold text-text-2">Kurs girişi</Link>
        </div>
        <div className="max-w-[1160px] mx-auto px-6 pt-6 mt-6 border-t border-border flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
          <span className="font-semibold text-text-2">Virel ekosistemi</span>
          <a href="https://virel.com.tr" className="hover:text-text">virel.com.tr</a>
          <a href="https://vet.virel.com.tr" className="hover:text-text">Virel Vet</a>
          <a href="https://egitim.virel.com.tr" className="hover:text-text">Virel Eğitim</a>
          <a href="https://beauty.virel.com.tr" className="hover:text-text">Virel Beauty</a>
        </div>
      </footer>
    </div>
  );
}
