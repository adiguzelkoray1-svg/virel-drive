"use client";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { number } from "@/lib/format";

export type PricingPlan = {
  key: string; name: string; userLimit: number; studentLimit: number;
  priceMonthly: number; priceOneTime: number; priceMaintenanceYearly: number;
  features: string[];
};

/** Kuruş cinsinden fiyatları TL'ye çevirip biçimlendirir (bkz. lib/format.ts::money — burada
 *  ondalıksız `number()` kullanılıyor çünkü plan fiyatları hep tam TL). */
const tl = (kurus: number) => `₺${number(kurus / 100)}`;

export function PricingTabs({ plans }: { plans: PricingPlan[] }) {
  const [mode, setMode] = useState<"monthly" | "oneTime">("monthly");

  return (
    <div>
      <div className="inline-flex p-1 rounded-full bg-surface border border-border mb-8">
        {([
          { key: "monthly", label: "Aylık abonelik" },
          { key: "oneTime", label: "Tek seferlik lisans" },
        ] as const).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setMode(t.key)}
            className={`px-4 h-9 rounded-full text-[13.5px] font-semibold transition-colors ${
              mode === t.key ? "bg-blue text-white" : "text-text-2 hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {plans.map((p, i) => (
          <div key={p.key} className={`rounded-[16px] p-6 flex flex-col gap-4 bg-surface ${i === 1 ? "ring-2 ring-blue relative" : "border border-border"}`}>
            {i === 1 && <span className="absolute -top-3 left-6 badge b-brand text-[11px]">En çok tercih edilen</span>}
            <div>
              <h3 className="font-display text-lg font-bold">{p.name}</h3>
              <p className="text-xs text-text-2 mt-1">{number(p.userLimit)} kullanıcı · {number(p.studentLimit)} kursiyer</p>
            </div>

            {mode === "monthly" ? (
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold tabular">{tl(p.priceMonthly)}</span>
                <span className="text-text-2 text-sm">/ ay</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold tabular">{tl(p.priceOneTime)}</span>
                  <span className="text-text-2 text-sm">tek seferlik</span>
                </div>
                <span className="text-xs text-text-2">2. yıldan itibaren yıllık <b className="text-text tabular">{tl(p.priceMaintenanceYearly)}</b> bakım ve barındırma</span>
              </div>
            )}

            <ul className="flex flex-col gap-2.5 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-text-2"><Icon name="check" size={14} className="text-success mt-0.5 shrink-0" />{f}</li>
              ))}
            </ul>

            <a href="#demo" className={`btn h-11 justify-center ${i === 1 ? "btn-primary" : "btn-secondary"}`}>
              {mode === "monthly" ? "Ücretsiz denemeye başla" : "Teklif alın"}
            </a>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted mt-6 max-w-[640px]">
        {mode === "monthly"
          ? "Faturalar kursunuzun kendi vergi kimliğiyle kesilir; Virel yalnızca abonelik faturası düzenler. Kurumsal için özel fiyat: demo talep edin."
          : "Tek seferlik lisans, yazılımı süresiz kullanma hakkıdır; sunucu, veritabanı, yedekleme ve güncelleme maliyetini karşılayan yıllık bakım-barındırma bedeli ilk yıl lisansa dahildir. Fiyatlar KDV hariçtir."}
      </p>
    </div>
  );
}
