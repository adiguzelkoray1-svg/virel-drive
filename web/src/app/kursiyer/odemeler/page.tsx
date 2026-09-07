import type { Metadata } from "next";
import { requireStudentUser } from "@/lib/auth";
import { getStudentDetail } from "@/lib/student";
import { Badge, EmptyState, ProgressBar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { INSTALLMENT_STATUS_LABEL } from "@/lib/constants";
import { date, money } from "@/lib/format";

export const metadata: Metadata = { title: "Ödemeler" };

export default async function StudentPaymentsPage() {
  const { student: s } = await requireStudentUser();
  const d = await getStudentDetail(s.schoolId, s.id);
  if (!d) return null;
  const { payment: p } = d;

  return (
    <div className="px-4 pt-[max(20px,env(safe-area-inset-top))] pb-4 flex flex-col gap-3">
      <h1 className="font-display text-[22px] font-bold">Ödemeler</h1>

      {p.installments.length === 0 ? (
        <div className="card"><EmptyState icon="wallet" title="Ödeme planın henüz kurulmadı." desc="Kurs yönetimiyle iletişime geçebilirsin." /></div>
      ) : (
        <>
          <div className="card p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Stat label="Toplam" value={money(p.total)} />
              <Stat label="Ödenen" value={money(p.paid)} tone="text-success" />
              <Stat label="Kalan" value={money(p.rest)} tone="text-blue" />
            </div>
            <div className="mt-3.5"><ProgressBar value={p.percent} height={7} /></div>
            <div className="text-xs text-muted mt-2">%{p.percent} ödendi</div>
          </div>

          {p.overdue.length > 0 && (
            <div className="card p-3.5 flex items-center gap-2.5 border-danger">
              <Icon name="alert" size={16} className="text-danger shrink-0" />
              <span className="text-[13px] text-text">{p.overdue.length} taksidin vadesi geçti. Kurs yönetimiyle iletişime geç.</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {p.installments.map((i) => {
              const st = INSTALLMENT_STATUS_LABEL[i.status === "PENDING" && i.dueAt < new Date() ? "OVERDUE" : i.status] ?? INSTALLMENT_STATUS_LABEL.PENDING;
              return (
                <div key={i.id} className="card p-3.5 flex items-center gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold">{i.label ?? `${i.seq}. taksit`}</span>
                    <span className="text-xs text-muted tabular">Vade {date(i.dueAt)}</span>
                  </div>
                  <span className="ml-auto text-[13px] font-semibold tabular shrink-0">{money(i.amount)}</span>
                  <span className="shrink-0"><Badge kind={st.kind} dot={st.kind === "success" || st.kind === "danger"}>{st.label}</Badge></span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col">
      <span className="stat-lbl">{label}</span>
      <span className={`text-[15px] font-bold tabular mt-0.5 ${tone ?? ""}`}>{value}</span>
    </div>
  );
}
