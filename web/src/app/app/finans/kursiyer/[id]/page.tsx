import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { deletePaymentAction } from "@/app/actions/finance";
import { Badge, Card, EmptyState, Notice, PageHeader, PersonAvatar, ProgressBar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { INSTALLMENT_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { effectiveStatus, getStudentFinance } from "@/lib/finance";
import { date, daysBetween, money } from "@/lib/format";
import { PlanForm } from "./PlanForm";

export async function generateMetadata({ params }: PageProps<"/app/finans/kursiyer/[id]">): Promise<Metadata> {
  const user = await requirePermission("finance.read");
  const { id } = await params;
  const s = await prisma.student.findFirst({ where: { id, schoolId: user.schoolId }, select: { firstName: true, lastName: true } });
  return { title: s ? `${s.firstName} ${s.lastName} · Finans` : "Finans" };
}

export default async function StudentFinancePage({ params, searchParams }: PageProps<"/app/finans/kursiyer/[id]">) {
  const user = await requirePermission("finance.read");
  const canWrite = can(user.role, "finance.write");
  const { id } = await params;
  const sp = await searchParams;

  const d = await getStudentFinance(user.schoolId, id);
  if (!d) notFound();

  const name = `${d.student.firstName} ${d.student.lastName}`;
  const open = d.installments.filter((i) => i.status === "PENDING" || i.status === "OVERDUE");
  const paidRows = d.installments.filter((i) => i.status === "PAID");
  const hasPaidDown = paidRows.some((i) => i.seq === 0);
  const overdue = open.filter((i) => effectiveStatus(i) === "OVERDUE");

  // Aynı ehliyet sınıfındaki mevcut planların en sık görülen toplamı, yeni plan için makul bir başlangıç.
  const peers = d.plan ? [] : await prisma.paymentPlan.findMany({
    where: { schoolId: user.schoolId, student: { licenseClass: d.student.licenseClass } },
    select: { total: true }, take: 200,
  });
  const suggested = peers.length
    ? Number(Object.entries(peers.reduce<Record<string, number>>((acc, p) => { acc[p.total] = (acc[p.total] ?? 0) + 1; return acc; }, {}))
        .sort((a, b) => b[1] - a[1])[0][0]) / 100
    : 0;

  const nextMonth = new Date();
  nextMonth.setDate(1);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return (
    <>
      <PageHeader title={name} sub={`${d.student.licenseClass} sınıfı · ödeme planı ve tahsilat geçmişi`}>
        <Link href={`/app/kursiyerler/${d.student.id}`} className="btn btn-secondary btn-sm"><Icon name="user" size={15} />Kursiyer kartı</Link>
        {canWrite && <Link href={`/app/finans/tahsilat?kursiyer=${d.student.id}`} className="btn btn-primary btn-sm"><Icon name="wallet" size={15} />Tahsilat al</Link>}
      </PageHeader>

      {sp.tahsilat && <Notice kind="success">{money(Number(sp.tahsilat))} tahsilat kaydedildi.</Notice>}
      {sp.iade && <Notice kind="info">Tahsilat kaydı geri alındı; bağlı taksit yeniden bekliyor durumuna döndü.</Notice>}
      {sp.plan === "olusturuldu" && <Notice kind="success">Ödeme planı oluşturuldu.</Notice>}
      {sp.plan === "guncellendi" && <Notice kind="success">Ödeme planı yeniden kuruldu.</Notice>}
      {overdue.length > 0 && (
        <Notice kind="danger">
          {overdue.length} taksit gecikmiş durumda; toplam {money(overdue.reduce((s, i) => s + i.amount, 0))}.
          En eskisi {Math.abs(daysBetween(overdue[0].dueAt))} gün önce vadesi dolmuş.
        </Notice>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <Card>
            <div className="px-5 py-5 flex items-center gap-4 flex-wrap">
              <PersonAvatar name={name} size={44} />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-display text-[17px] font-bold tracking-[-0.01em]">{name}</span>
                <span className="text-xs text-text-2">{d.plan ? `${d.installments.length} taksitlik plan` : "Ödeme planı yok"}</span>
              </div>
              <div className="ml-auto flex items-center gap-6 flex-wrap">
                <Stat label="Toplam" value={d.plan ? money(d.total) : "—"} />
                <Stat label="Tahsil edilen" value={money(d.paid)} tone="text-success" />
                <Stat label="Kalan" value={d.plan ? money(d.rest) : "—"} />
              </div>
            </div>
            {d.plan && (
              <div className="px-5 pb-5">
                <ProgressBar value={d.percent} height={8} />
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted tabular">%{d.percent} ödendi</span>
                  {d.unlinkedTotal > 0 && (
                    <span className="ml-auto text-xs text-muted">Plan dışı tahsilat: {money(d.unlinkedTotal)}</span>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card title="Ödeme planı" sub={d.plan ? `${open.length} taksit açık` : "henüz kurulmadı"}>
            {d.installments.length === 0 ? (
              <EmptyState icon="wallet" title="Taksit tanımlı değil." desc="Sağdaki formdan ödeme planını kurabilirsiniz." />
            ) : (
              <div className="px-5 pb-5 pt-1">
                {d.installments.map((i) => {
                  const st = INSTALLMENT_STATUS_LABEL[effectiveStatus(i)] ?? INSTALLMENT_STATUS_LABEL.PENDING;
                  return (
                    <div key={i.id} className="grid gap-3 items-center py-3 border-t border-border first:border-0" style={{ gridTemplateColumns: "96px 1fr 110px 110px" }}>
                      <span className="text-[13px] font-semibold">{i.label ?? `${i.seq}. taksit`}</span>
                      <span className="text-[13px] tabular font-semibold">{money(i.amount)}</span>
                      <span className="text-[13px] tabular text-text-2">{date(i.dueAt)}</span>
                      <span className="flex justify-end"><Badge kind={st.kind} dot={st.kind === "success" || st.kind === "danger"}>{st.label}</Badge></span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="Tahsilat geçmişi" sub={`${d.payments.length} işlem`}>
            {d.payments.length === 0 ? (
              <EmptyState icon="wallet" title="Henüz tahsilat yok." />
            ) : (
              <div className="px-5 pb-5 pt-1">
                {d.payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-3 border-t border-border first:border-0">
                    <span className="w-9 h-9 rounded-md bg-success-bg text-success flex items-center justify-center shrink-0"><Icon name="check" size={17} /></span>
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[13px] font-semibold truncate">
                        {p.installment ? (p.installment.label ?? `${p.installment.seq}. taksit`) : p.note || "Plan dışı tahsilat"}
                      </span>
                      <span className="text-xs text-muted">{date(p.receivedAt)} · {PAYMENT_METHOD_LABEL[p.method] ?? p.method}</span>
                    </span>
                    <span className="ml-auto text-[13px] tabular font-semibold">{money(p.amount)}</span>
                    {canWrite && (
                      <form action={deletePaymentAction}>
                        <input type="hidden" name="paymentId" value={p.id} />
                        <button className="btn btn-ghost btn-xs" aria-label="Tahsilatı geri al" title="Tahsilatı geri al"><Icon name="refresh" size={15} /></button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {canWrite ? (
          <Card id="plan" title={d.plan ? "Planı yeniden kur" : "Ödeme planı kur"} sub={d.plan ? "açık taksitler yeniden hesaplanır" : undefined}>
            <PlanForm
              studentId={d.student.id}
              hasPlan={!!d.plan}
              hasPaidDown={hasPaidDown}
              paidSum={d.paid}
              firstSeq={paidRows.reduce((m, i) => Math.max(m, i.seq), 0) + 1}
              defaults={{
                total: d.plan ? String(d.total / 100) : suggested ? String(suggested) : "",
                downPayment: d.plan ? String(d.plan.downPayment / 100) : "",
                count: String(Math.max(1, open.length || 4)),
                firstDueAt: (open[0]?.dueAt ?? nextMonth).toISOString().slice(0, 10),
              }}
            />
          </Card>
        ) : (
          <Card title="Ödeme planı">
            <p className="px-5 py-5 text-[13px] text-text-2">Plan düzenlemek için finans yazma yetkisi gerekir.</p>
          </Card>
        )}
      </div>
    </>
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
