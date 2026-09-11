import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { schoolAuditLog } from "@/lib/audit";
import { Card, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import { dateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Denetim kaydı · Ayarlar" };

export default async function SchoolAuditPage({ searchParams }: PageProps<"/app/ayarlar/denetim">) {
  const user = await requirePermission("settings.write");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.sayfa) || 1);

  const { rows, total, pages } = await schoolAuditLog(user.schoolId, { q, page });

  const qs = (over: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    for (const [k, v] of Object.entries(over)) {
      if (v) p.set(k, String(v));
      else p.delete(k);
    }
    const s = p.toString();
    return s ? `/app/ayarlar/denetim?${s}` : "/app/ayarlar/denetim";
  };

  return (
    <>
      <div className="card p-5 flex items-start gap-3">
        <span className="w-[34px] h-[34px] rounded-md bg-blue-050 text-blue flex items-center justify-center shrink-0"><Icon name="list" size={18} /></span>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="h-card">Denetim kaydı</span>
          <span className="text-[13px] text-text-2 leading-relaxed max-w-[620px]">
            Kursunuzda kim, ne zaman, ne yaptı — kursiyer/eğitmen/plan değişiklikleri, giriş
            erişimi verme, ödeme ve ayar güncellemeleri dahil her önemli işlem burada listelenir.
          </span>
        </div>
      </div>

      <Card>
        <header className="flex items-center gap-3 px-5 pt-5 pb-3 flex-wrap">
          <h2 className="h-card">İşlemler</h2>
          <span className="text-xs text-muted">{total} kayıt</span>
          <form className="ml-auto flex items-center gap-2">
            <input name="q" defaultValue={q} placeholder="İşlem ya da kişi ara…" className="input h-8 text-[13px] w-[220px]" aria-label="Ara" />
            <button className="btn btn-secondary btn-xs">Ara</button>
          </form>
        </header>

        {rows.length === 0 ? (
          <EmptyState icon="list" title="Kayıt bulunamadı." desc={q ? "Aramayı değiştirin." : "Henüz kayıtlı işlem yok."} />
        ) : (
          <div className="px-5 pb-5 pt-1 overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid gap-3 pb-2" style={{ gridTemplateColumns: "160px minmax(200px,1fr) 180px" }}>
                {["Zaman", "İşlem", "Yapan"].map((h) => <div key={h} className="th">{h}</div>)}
              </div>
              {rows.map((a) => (
                <div key={a.id} className="grid gap-3 items-center py-2.5 border-t border-border" style={{ gridTemplateColumns: "160px minmax(200px,1fr) 180px" }}>
                  <span className="text-[13px] text-text-2 tabular">{dateTime(a.createdAt)}</span>
                  <span className="text-[13px] font-mono truncate" title={a.action}>{a.action}</span>
                  <span className="text-[13px] text-text-2 truncate">
                    {a.actor ? `${a.actor.name} · ${ROLE_LABEL[a.actor.role as Role] ?? a.actor.role}` : "Sistem"}
                  </span>
                </div>
              ))}
            </div>

            {pages > 1 && (
              <div className="flex items-center gap-2.5 pt-4 mt-1 border-t border-border">
                <span className="text-xs text-muted tabular">Sayfa {page} / {pages}</span>
                <div className="ml-auto flex gap-1.5">
                  <Link href={qs({ sayfa: Math.max(1, page - 1) })} className="ibtn" aria-disabled={page === 1}><Icon name="chev-left" size={16} /></Link>
                  <Link href={qs({ sayfa: Math.min(pages, page + 1) })} className="ibtn"><Icon name="chev-right" size={16} /></Link>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
