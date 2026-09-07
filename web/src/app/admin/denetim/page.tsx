import Link from "next/link";
import type { Metadata } from "next";
import { globalAuditLog } from "@/lib/admin";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import { dateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Denetim Kaydı" };

export default async function GlobalAuditPage() {
  const rows = await globalAuditLog(80);

  return (
    <>
      <PageHeader title="Denetim Kaydı" sub="Tüm kurslardaki son işlemler" />
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon="list" title="Henüz kayıt yok." />
        ) : (
          <div className="px-5 pb-5 pt-3 overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid gap-3 pb-2" style={{ gridTemplateColumns: "170px minmax(160px,1fr) 160px 130px" }}>
                {["Zaman", "İşlem", "Kurs", "Yapan"].map((h) => <div key={h} className="th">{h}</div>)}
              </div>
              {rows.map((a) => (
                <div key={a.id} className="grid gap-3 items-center py-2.5 border-t border-border" style={{ gridTemplateColumns: "170px minmax(160px,1fr) 160px 130px" }}>
                  <span className="text-[13px] text-text-2 tabular">{dateTime(a.createdAt)}</span>
                  <span className="text-[13px] font-mono truncate">{a.action}</span>
                  <span className="text-[13px] text-text-2 truncate">
                    {a.school ? <Link href={`/admin/kurslar/${a.schoolId}`} className="text-blue font-semibold">{a.school.name}</Link> : "—"}
                  </span>
                  <span className="text-xs text-muted truncate">{a.actor ? `${a.actor.name} · ${ROLE_LABEL[a.actor.role as Role] ?? a.actor.role}` : "Sistem"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
