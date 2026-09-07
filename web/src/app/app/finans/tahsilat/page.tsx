import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader, PersonAvatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { effectiveStatus, studentBalances } from "@/lib/finance";
import { money } from "@/lib/format";
import { PaymentForm, type OpenInstallment } from "./PaymentForm";

export const metadata: Metadata = { title: "Tahsilat al" };

export default async function CollectPage({ searchParams }: PageProps<"/app/finans/tahsilat">) {
  const user = await requirePermission("finance.write");
  const sp = await searchParams;
  const studentId = String(sp.kursiyer ?? "");
  const today = new Date().toISOString().slice(0, 10);

  // Kursiyer seçilmemişse: bakiyesi olan kursiyerlerden seçim listesi.
  if (!studentId) {
    const q = String(sp.q ?? "").trim();
    const all = await studentBalances(user.schoolId);
    const needle = q.toLocaleLowerCase("tr");
    const rows = all
      .filter((r) => r.rest > 0 || !r.planId)
      .filter((r) => !q || `${r.firstName} ${r.lastName}`.toLocaleLowerCase("tr").includes(needle))
      .sort((a, b) => b.overdueDays - a.overdueDays)
      .slice(0, 60);

    return (
      <>
        <PageHeader title="Tahsilat al" sub="Ödemeyi alacağınız kursiyeri seçin">
          <Link href="/app/finans" className="btn btn-secondary btn-sm"><Icon name="chev-left" size={15} />Finans</Link>
        </PageHeader>
        <Card>
          <header className="flex items-center gap-3 px-5 pt-5 pb-3 flex-wrap">
            <h2 className="h-card">Açık bakiyesi olan kursiyerler</h2>
            <form className="flex items-center gap-2 ml-auto">
              <input name="q" defaultValue={q} placeholder="Kursiyer ara…" className="input h-8 text-[13px] w-[200px]" aria-label="Kursiyer ara" />
              <button className="btn btn-secondary btn-xs">Ara</button>
            </form>
          </header>
          {rows.length === 0 ? (
            <EmptyState icon="wallet" title="Açık bakiyesi olan kursiyer yok." desc="Tüm ödeme planları kapanmış görünüyor." />
          ) : (
            <div className="px-5 pb-5">
              {rows.map((r) => {
                const name = `${r.firstName} ${r.lastName}`;
                return (
                  <Link key={r.studentId} href={`/app/finans/tahsilat?kursiyer=${r.studentId}`} className="flex items-center gap-3 py-3 border-t border-border">
                    <PersonAvatar name={name} size={32} />
                    <span className="text-sm font-semibold">{name}</span>
                    <Badge kind="brand">{r.licenseClass}</Badge>
                    {r.overdueCount > 0 && <Badge kind="danger" dot>{r.overdueDays} gün gecikti</Badge>}
                    {!r.planId && <Badge kind="warning" dot>Plan yok</Badge>}
                    <span className="ml-auto text-[13px] tabular font-semibold">{r.planId ? `${money(r.rest)} kalan` : "—"}</span>
                    <span className="text-muted"><Icon name="chev-right" size={16} /></span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </>
    );
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId: user.schoolId },
    include: { paymentPlan: { include: { installments: { orderBy: { seq: "asc" } } } } },
  });
  if (!student) {
    return (
      <>
        <PageHeader title="Tahsilat al" />
        <Card><EmptyState icon="alert" title="Kursiyer bulunamadı." action={<Link href="/app/finans/tahsilat" className="btn btn-secondary btn-sm">Listeye dön</Link>} /></Card>
      </>
    );
  }

  const name = `${student.firstName} ${student.lastName}`;
  const open: OpenInstallment[] = (student.paymentPlan?.installments ?? [])
    .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
    .map((i) => ({
      id: i.id,
      label: i.label ?? `${i.seq}. taksit`,
      amount: i.amount,
      dueAt: i.dueAt.toISOString(),
      overdue: effectiveStatus(i) === "OVERDUE",
    }));

  const paid = (student.paymentPlan?.installments ?? []).filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const total = student.paymentPlan?.total ?? 0;

  return (
    <>
      <PageHeader title="Tahsilat al" sub={`${name} · ${student.licenseClass} sınıfı`}>
        <Link href={`/app/finans/kursiyer/${student.id}`} className="btn btn-secondary btn-sm"><Icon name="wallet" size={15} />Ödeme geçmişi</Link>
        <Link href="/app/finans/tahsilat" className="btn btn-ghost btn-sm">Başka kursiyer</Link>
      </PageHeader>

      {!student.paymentPlan && (
        <div className="card px-5 py-4 flex items-center gap-3 flex-wrap">
          <Icon name="alert" size={16} className="text-warning" />
          <span className="text-[13px]">Bu kursiyer için henüz ödeme planı kurulmamış. Taksitli tahsilat yapabilmek için önce plan tanımlayın.</span>
          <Link href={`/app/finans/kursiyer/${student.id}#plan`} className="btn btn-secondary btn-xs ml-auto">Plan kur</Link>
        </div>
      )}
      {student.paymentPlan && (
        <div className="card px-5 py-3.5 flex items-center gap-6 flex-wrap text-[13px]">
          <span className="text-text-2">Toplam <b className="text-text tabular ml-1">{money(total)}</b></span>
          <span className="text-text-2">Tahsil edilen <b className="text-success tabular ml-1">{money(paid)}</b></span>
          <span className="text-text-2">Kalan <b className="text-text tabular ml-1">{money(total - paid)}</b></span>
          <span className="text-muted ml-auto">{open.length} açık taksit</span>
        </div>
      )}

      <PaymentForm studentId={student.id} studentName={name} installments={open} today={today} />
    </>
  );
}
