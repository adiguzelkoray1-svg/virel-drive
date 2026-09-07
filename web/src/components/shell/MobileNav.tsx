"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import VirelLogo from "@/components/VirelLogo";

/**
 * Masaüstü konsolunun (hem /app hem /admin) mobil karşılığı yok — sidebar `hidden lg:flex`
 * olduğu için telefon genişliğinde hiçbir gezinme öğesi görünmüyordu (tarayıcıda rol rol
 * denerken fark edildi: dashboard içeriği görünüyor ama başka bir yere gidilemiyor, çıkış
 * bile yapılamıyordu). Bu, o sidebar'ı bir kaydırmalı panel olarak açan minimal bir üst çubuk;
 * masaüstündeki tablo/takvim gibi veri yoğun sayfaların kendisini mobile uyarlamaz — bu,
 * brief'in kasıtlı ayrımıyla (masaüstü personel konsolu / mobil eğitmen-kursiyer uygulaması)
 * tutarlı bir sınır, sayfa sayfa yeniden tasarım değil.
 */
export function MobileNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Rota değişince çekmece kapanır — bir efekt yerine render sırasında ayarlanıyor
  // (React'in "you might not need an effect" deseni), her navigasyonda ekstra render turu olmasın diye.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <>
      <div className="lg:hidden h-14 bg-surface border-b border-border flex items-center px-4 gap-3 shrink-0">
        <button onClick={() => setOpen(true)} className="ibtn" aria-label="Menüyü aç">
          <Icon name="menu" size={20} />
        </button>
        <VirelLogo size={84} />
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <button className="absolute inset-0 bg-black/40" aria-label="Menüyü kapat" onClick={() => setOpen(false)} />
          <div className="relative z-10 h-full flex">
            {children}
            <button
              onClick={() => setOpen(false)}
              aria-label="Menüyü kapat"
              className="absolute top-4 -right-11 w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-text-2"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
