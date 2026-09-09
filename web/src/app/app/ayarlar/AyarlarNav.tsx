"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

const LINKS: { href: string; icon: IconName; label: string }[] = [
  { href: "/app/ayarlar", icon: "shield", label: "Mevzuat ve kurs ayarları" },
  { href: "/app/ayarlar/entegrasyonlar", icon: "link", label: "Entegrasyonlar" },
];

/** Yalnızca görsel bağlam için: gerçek bir alt sayfası olmayan kategoriler "yakında"
 *  etiketiyle gösterilir, tıklanamaz bağlantı olarak sunulmaz. */
const SOON: { icon: IconName; label: string }[] = [
  { icon: "building", label: "Kurs profili" },
  { icon: "users", label: "Kullanıcılar ve roller" },
  { icon: "folder", label: "Belge kuralları" },
  { icon: "wallet", label: "Fiyat ve ödeme" },
  { icon: "message", label: "Mesaj şablonları" },
  { icon: "lock", label: "Güvenlik ve KVKK" },
  { icon: "list", label: "Denetim kaydı" },
];

export function AyarlarNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/app/ayarlar" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="card p-3.5 flex flex-col gap-1">
      {LINKS.map((s) => {
        const active = isActive(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            className={`flex items-center gap-2.5 h-[38px] px-3 rounded-md text-[13.5px] transition-colors ${
              active ? "bg-blue-050 text-text font-semibold" : "text-muted hover:bg-surface-2"
            }`}
          >
            <Icon name={s.icon} size={17} className={active ? "text-blue" : "text-muted"} />
            {s.label}
          </Link>
        );
      })}
      {SOON.map((s) => (
        <div key={s.label} className="flex items-center gap-2.5 h-[38px] px-3 rounded-md text-[13.5px] text-muted">
          <Icon name={s.icon} size={17} className="text-muted" />
          <span className="grow">{s.label}</span>
          <span className="text-[11px] text-muted bg-surface-2 rounded-full px-1.5 py-0.5">Yakında</span>
        </div>
      ))}
    </div>
  );
}
