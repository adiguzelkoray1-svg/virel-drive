"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import VirelLogo from "@/components/VirelLogo";
import { PersonAvatar } from "@/components/ui";

export type NavItem = { href: string; label: string; icon: IconName; count?: number };
export type NavGroup = NavItem[];

export function Sidebar({ groups, context, user, footer }: {
  groups: NavGroup[];
  context: { title: string; sub: string; initials: string };
  user: { name: string; title: string };
  footer?: NavItem[];
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/app" ? pathname === href : pathname.startsWith(href));
  return (
    <aside className="w-[244px] shrink-0 flex flex-col px-4 pt-5 pb-4 bg-surface border-r border-border">
      <div className="flex items-baseline gap-2 px-2 pb-[18px]">
        <VirelLogo size={104} />
        <span className="font-display text-[15px] font-semibold text-text-2 tracking-[-0.01em]">drive</span>
      </div>

      <div className="flex items-center gap-2.5 h-11 px-2.5 rounded-sm border border-border">
        <span className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center text-[11px] font-bold bg-blue-050 text-blue-700">{context.initials}</span>
        <span className="flex flex-col min-w-0 flex-1">
          <span className="text-[13px] font-semibold truncate">{context.title}</span>
          <span className="text-[11px] truncate text-muted">{context.sub}</span>
        </span>
        <Icon name="updown" size={16} className="text-muted" />
      </div>

      <nav className="flex flex-col gap-0.5 mt-[18px]">
        {groups.map((g, gi) => (
          <div key={gi} className="contents">
            {gi > 0 && <div className="h-px my-2.5 mx-2 bg-border" />}
            {g.map((it) => (
              <Link key={it.href} href={it.href} className="nav-item" data-active={isActive(it.href)}>
                <Icon name={it.icon} size={18} />
                <span>{it.label}</span>
                {it.count ? <span className="ml-auto text-xs font-semibold text-blue-700 bg-blue-050 rounded-full px-[7px]">{it.count}</span> : null}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex-1 min-h-4" />
      {footer && (
        <>
          <div className="h-px mb-2.5 mx-2 bg-border" />
          <nav className="flex flex-col gap-0.5">
            {footer.map((it) => (
              <Link key={it.href} href={it.href} className="nav-item" data-active={isActive(it.href)}>
                <Icon name={it.icon} size={18} /><span>{it.label}</span>
              </Link>
            ))}
          </nav>
        </>
      )}
      <div className="flex items-center gap-2.5 px-2 py-2.5 mt-2.5 rounded-sm border border-border">
        <PersonAvatar name={user.name} size={34} className="bg-blue text-on-brand" />
        <span className="flex flex-col flex-1 min-w-0">
          <span className="text-[13px] font-semibold truncate">{user.name}</span>
          <span className="text-xs truncate text-text-2">{user.title}</span>
        </span>
        <form action="/api/auth/cikis" method="post">
          <button className="ibtn ibtn-ghost w-8 h-8" title="Çıkış yap" aria-label="Çıkış yap"><Icon name="logout" size={16} /></button>
        </form>
      </div>
    </aside>
  );
}
