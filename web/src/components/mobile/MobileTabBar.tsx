"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

export type MobileTab = { href: string; label: string; icon: IconName };

/** Alt sekme çubuğu — masaüstü sidebar'ın mobil karşılığı. Kök yol (ör. /kursiyer)
 *  yalnızca tam eşleşince aktif sayılır, aksi halde her alt sayfa "Ana sayfa"yı da aktif gösterirdi. */
export function MobileTabBar({ tabs, root }: { tabs: MobileTab[]; root: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === root ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-surface border-t border-border">
      <div className="max-w-[480px] mx-auto flex" style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
        {tabs.map((t) => {
          const active = isActive(t.href);
          return (
            <Link key={t.href} href={t.href} className="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-1">
              <Icon name={t.icon} size={21} className={active ? "text-blue" : "text-muted"} />
              <span className={`text-[11px] ${active ? "text-blue font-semibold" : "text-muted"}`}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
