"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { updateDocumentAction } from "@/app/actions/documents";
import { emptyDocumentState } from "@/lib/document-form";
import { DOCUMENT_STATUS_LABEL } from "@/lib/constants";

const STATUS_KEYS = ["MISSING", "PENDING", "REVIEW", "OK"] as const;

export function DocRowForm({ studentId, type, label, doc }: {
  studentId: string; type: string; label: string;
  doc: { status: string; validUntil: string | null; note: string | null } | null;
}) {
  const [state, action, pending] = useActionState(updateDocumentAction, emptyDocumentState);
  const status = doc?.status ?? "MISSING";
  const color = status === "OK" ? "text-success" : status === "REVIEW" ? "text-blue" : status === "PENDING" ? "text-warning" : "text-danger";
  const bg = status === "OK" ? "bg-success-bg" : status === "REVIEW" ? "bg-blue-050" : status === "PENDING" ? "bg-warning-bg" : "bg-danger-bg";

  return (
    <form action={action} className="grid gap-3 items-center py-3.5 border-t border-border first:border-t-0" style={{ gridTemplateColumns: "28px minmax(160px,1fr) 150px 150px minmax(160px,1fr) 100px" }}>
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="type" value={type} />

      <span className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${bg} ${color}`}>
        <Icon name={status === "OK" ? "check" : status === "REVIEW" ? "eye" : status === "PENDING" ? "clock" : "x"} size={14} />
      </span>
      <span className="text-[13.5px] font-semibold min-w-0 truncate">{label}</span>

      <select name="status" defaultValue={status} className="input h-9 text-[13px]">
        {STATUS_KEYS.map((k) => <option key={k} value={k}>{DOCUMENT_STATUS_LABEL[k].label}</option>)}
      </select>
      <input type="date" name="validUntil" defaultValue={doc?.validUntil ?? ""} className="input h-9 text-[13px]" title="Geçerlilik tarihi (opsiyonel)" />
      <input name="note" defaultValue={doc?.note ?? ""} placeholder="Not (opsiyonel)" className="input h-9 text-[13px]" />

      <button className="btn btn-secondary btn-xs justify-self-end" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>

      {state.error && (
        <span className="col-span-6 flex items-center gap-1.5 text-xs text-danger font-semibold -mt-1">
          <Icon name="alert" size={13} />{state.error}
        </span>
      )}
    </form>
  );
}
