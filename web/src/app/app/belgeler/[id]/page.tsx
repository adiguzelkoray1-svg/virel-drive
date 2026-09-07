import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Badge, Card, PageHeader, PersonAvatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { getStudentDocuments } from "@/lib/documents";
import { date } from "@/lib/format";
import { DocRowForm } from "./DocRowForm";

export async function generateMetadata({ params }: PageProps<"/app/belgeler/[id]">): Promise<Metadata> {
  const user = await requirePermission("document.read");
  const { id } = await params;
  const d = await getStudentDocuments(user.schoolId, id);
  return { title: d ? `${d.student.firstName} ${d.student.lastName} · Belgeler` : "Belgeler" };
}

export default async function StudentDocumentsPage({ params }: PageProps<"/app/belgeler/[id]">) {
  const user = await requirePermission("document.read");
  const canWrite = can(user.role, "document.write");
  const { id } = await params;

  const d = await getStudentDocuments(user.schoolId, id);
  if (!d) notFound();

  const name = `${d.student.firstName} ${d.student.lastName}`;
  const ok = d.rows.filter((r) => r.doc?.status === "OK").length;
  const missing = d.rows.filter((r) => (r.doc?.status ?? "MISSING") === "MISSING").length;

  return (
    <>
      <PageHeader title={name} sub={`${d.student.licenseClass} sınıfı · kayıt ${date(d.student.registeredAt)}`}>
        <Link href={`/app/kursiyerler/${d.student.id}`} className="btn btn-secondary btn-sm"><Icon name="user" size={15} />Kursiyer kartı</Link>
        <Link href="/app/belgeler" className="btn btn-ghost btn-sm">Belgeler</Link>
      </PageHeader>

      <Card>
        <div className="px-5 py-5 flex items-center gap-4 flex-wrap">
          <PersonAvatar name={name} size={44} />
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-display text-[17px] font-bold tracking-[-0.01em]">{name}</span>
            <div className="flex items-center gap-2">
              <Badge kind={ok === d.rows.length ? "success" : missing > 0 ? "danger" : "warning"} dot>
                {ok}/{d.rows.length} tamam
              </Badge>
              {missing > 0 && <Badge kind="danger">{missing} eksik</Badge>}
            </div>
          </div>
        </div>

        {!canWrite && (
          <div className="px-5 pb-2">
            <p className="text-[13px] text-text-2">Belge durumunu değiştirmek için evrak yazma yetkisi gerekir.</p>
          </div>
        )}

        <div className="px-5 pb-5">
          <div className="grid gap-3 pb-2" style={{ gridTemplateColumns: "28px minmax(160px,1fr) 150px 150px minmax(160px,1fr) 100px" }}>
            <div />
            <div className="th">Belge</div>
            <div className="th">Durum</div>
            <div className="th">Geçerlilik</div>
            <div className="th">Not</div>
            <div />
          </div>
          {d.rows.map((r) => (
            canWrite ? (
              <DocRowForm
                key={r.type} studentId={d.student.id} type={r.type} label={r.label}
                doc={r.doc ? { status: r.doc.status, validUntil: r.doc.validUntil ? r.doc.validUntil.toISOString().slice(0, 10) : null, note: r.doc.note } : null}
              />
            ) : (
              <ReadOnlyRow key={r.type} label={r.label} status={r.doc?.status ?? "MISSING"} validUntil={r.doc?.validUntil ?? null} note={r.doc?.note ?? null} />
            )
          ))}
        </div>
      </Card>
    </>
  );
}

function ReadOnlyRow({ label, status, validUntil, note }: { label: string; status: string; validUntil: Date | null; note: string | null }) {
  const color = status === "OK" ? "text-success" : status === "REVIEW" ? "text-blue" : status === "PENDING" ? "text-warning" : "text-danger";
  const bg = status === "OK" ? "bg-success-bg" : status === "REVIEW" ? "bg-blue-050" : status === "PENDING" ? "bg-warning-bg" : "bg-danger-bg";
  return (
    <div className="grid gap-3 items-center py-3.5 border-t border-border first:border-t-0" style={{ gridTemplateColumns: "28px minmax(160px,1fr) 150px 150px minmax(160px,1fr) 100px" }}>
      <span className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${bg} ${color}`}>
        <Icon name={status === "OK" ? "check" : status === "REVIEW" ? "eye" : status === "PENDING" ? "clock" : "x"} size={14} />
      </span>
      <span className="text-[13.5px] font-semibold min-w-0 truncate">{label}</span>
      <span className="text-[13px] text-text-2">{status}</span>
      <span className="text-[13px] text-text-2 tabular">{validUntil ? date(validUntil) : "—"}</span>
      <span className="text-[13px] text-text-2 truncate">{note ?? "—"}</span>
      <span />
    </div>
  );
}
