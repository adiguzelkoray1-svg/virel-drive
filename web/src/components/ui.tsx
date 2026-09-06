import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import type { BadgeKind } from "@/lib/constants";
import { initials } from "@/lib/format";

export function Badge({ kind = "neutral", dot, children }: { kind?: BadgeKind; dot?: boolean; children: ReactNode }) {
  return (
    <span className={`badge b-${kind}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export function Card({ children, className = "", title, sub, right, id }: { children: ReactNode; className?: string; title?: string; sub?: string; right?: ReactNode; id?: string }) {
  return (
    <section id={id} className={`card ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 lg:gap-4 px-4 lg:px-5 py-4 border-b border-border">
          <div className="flex flex-col gap-0.5 min-w-0">
            <h3 className="h-card">{title}</h3>
            {sub && <span className="text-xs text-text-2">{sub}</span>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, delta, deltaKind = "neutral", icon }: { label: string; value: string; delta?: string; deltaKind?: "success" | "danger" | "warning" | "neutral"; icon: IconName }) {
  const color = { success: "text-success", danger: "text-danger", warning: "text-warning", neutral: "text-text-2" }[deltaKind];
  return (
    <div className="card flex-1 basis-0 p-4 lg:p-5 flex flex-col gap-3 lg:gap-3.5 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-text-2">{label}</span>
        <span className="w-[30px] h-[30px] rounded-sm bg-blue-050 text-blue flex items-center justify-center"><Icon name={icon} size={16} /></span>
      </div>
      <div className="flex items-baseline gap-x-2.5 gap-y-0.5 flex-wrap">
        <span className="kpi">{value}</span>
        {delta && <span className={`text-xs font-semibold ${color}`}>{delta}</span>}
      </div>
    </div>
  );
}

const TINTS = ["bg-blue-050 text-blue-700", "bg-success-bg text-success", "bg-warning-bg text-warning", "bg-danger-bg text-danger", "bg-surface-2 text-text-2"];
export function PersonAvatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const tint = className ?? TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
  return <span className={`avatar ${tint}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>{initials(name)}</span>;
}

export function ProgressBar({ value, grad, height = 8 }: { value: number; grad?: boolean; height?: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`bar ${grad ? "bar-grad" : ""}`} style={{ height }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Kalan sınav hakkı: dolu/boş nokta dizisi. Toplam hak mevzuat ayarından gelir. */
export function ExamAttempts({ used, total }: { used: number; total: number }) {
  const left = Math.max(0, total - used);
  const danger = left <= 1;
  return (
    <span className="flex items-center gap-2">
      <span className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="w-2 h-2 rounded-full" style={{ background: i < used ? (danger ? "var(--virel-danger)" : "var(--virel-blue)") : "var(--virel-border)" }} />
        ))}
      </span>
      <span className="text-xs text-muted tabular">{left}/{total} hak</span>
    </span>
  );
}

export function Chip({ children, active, href }: { children: ReactNode; active?: boolean; href?: string }) {
  const cls = "chip";
  return href ? <Link href={href} className={cls} data-active={active}>{children}</Link> : <span className={cls} data-active={active}>{children}</span>;
}

export function Tabs({ items, active }: { items: { key: string; label: string; href: string }[]; active: string }) {
  return (
    <div className="flex gap-5 border-b border-border tabs-scroll">
      {items.map((t) => (
        <Link key={t.key} href={t.href} className="tab" data-active={t.key === active}>{t.label}</Link>
      ))}
    </div>
  );
}

export function EmptyState({ icon = "folder", title, desc, action }: { icon?: IconName; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center px-6 py-10">
      <span className="w-12 h-12 rounded-md bg-surface-2 text-muted flex items-center justify-center"><Icon name={icon} size={22} /></span>
      <div className="flex flex-col gap-1">
        <span className="h-card">{title}</span>
        {desc && <span className="text-[13px] text-text-2 max-w-sm">{desc}</span>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div className="flex flex-col gap-1">
        <h1 className="h-page">{title}</h1>
        {sub && <span className="text-text-2">{sub}</span>}
      </div>
      {children && <div className="flex items-center gap-2 lg:gap-2.5 flex-wrap">{children}</div>}
    </div>
  );
}

export function LinkButton({ href, kind = "primary", size = "", icon, children }: { href: string; kind?: "primary" | "secondary" | "outline" | "ghost" | "danger"; size?: "" | "btn-sm" | "btn-xs"; icon?: IconName; children: ReactNode }) {
  return (
    <Link href={href} className={`btn btn-${kind} ${size}`}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </Link>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "warning" | "danger" | "success"; children: ReactNode }) {
  const cls = { info: "bg-blue-050 text-blue-700", warning: "bg-warning-bg text-text", danger: "bg-danger-bg text-text", success: "bg-success-bg text-text" }[kind];
  return <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-sm text-[13px] leading-relaxed ${cls}`}><Icon name={kind === "info" ? "info" : kind === "success" ? "check-circle" : "alert"} size={16} className="shrink-0 mt-0.5" /><span className="min-w-0">{children}</span></div>;
}
