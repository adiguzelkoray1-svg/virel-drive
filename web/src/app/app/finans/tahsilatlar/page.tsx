import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader, PersonAvatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { date, money, number } from "@/lib/format";
import { FinanceTabs } from "../tabs";

export const metadata: Metadata = { title: "Tahsilatlar" };

const RANGES = [
  { key: "bugun", label: "Bugün", days: 0 },
  { key: "hafta", label: "Son 7 gün", days: 7 },
  { key: "ay", label: "Bu ay", days: -1 },
  { key: "90", label: "Son 90 gün", days: 90 },
] as const;

export default async function PaymentsPage({ searchParams }: PageProps<"/app/finans/tahsilatlar">) {
  const user = await requirePermission("finance.read");
  const canWrite = can(user.role, "finance.write");
  const sp = await searchParams;
  const range = RANGES.find((r) => r.key === sp.aralik) ?? RANGES[2];

  const now = new Date();
  const from = range.days === -1
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : range.days === 0
      ? new Date(new Date().setHours(0, 0, 0, 0))
      : new Date(now.getTime() - range.days * 86_400_000);

  const payments = await prisma.payment.findMany({
    where: { schoolId: user.schoolId, receivedAt: { gte: from } },
    orderBy: { receivedAt: "desc" },
    include: { student: { select: { id: true, firstName: true, lastName: true, licenseClass: true } }, installment: true },
    take: 300,
  });

  const total = payments.reduce((s, p) => s + p.amount, 0);
  const byMethod = Object.keys(PAYMENT_METHOD_LABEL).map((key) => ({
    key, label: PAYMENT_METHOD_LABEL[key],
    amount: payments.filter((p) => p.method === key).reduce((s, p) => s + p.amount, 0),
    count: payments.filter((p) => p.method === key).length,
  }));

  return (
    <>
      <PageHeader title="Tahsilatlar" sub={`${number(payments.length)} işlem · ${money(total)}`}>
        {canWrite && <Link href="/app/finans/tahsilat" className="btn btn-primary btn-sm"><Icon name="wallet" size={15} />Tahsilat al</Link>}
      </PageHeader>
      <FinanceTabs active="tahsilatlar" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {byMethod.map((m) => (
          <div key={m.key} className="card p-[18px] flex flex-col gap-1">
            <span className="stat-lbl">{m.label}</span>
            <span className="kpi mt-1.5">{money(m.amount)}</span>
            <span className="text-xs text-muted">{m.count} işlem</span>
          </div>
        ))}
      </div>

      <Card>
        <header className="flex items-center gap-2.5 px-5 pt-5 pb-3 flex-wrap">
          <h2 className="h-card">İşlem dökümü</h2>
          <div className="flex items-center gap-2 ml-auto">
            {RANGES.map((r) => (
              <Link key={r.key} href={`/app/finans/tahsilatlar?aralik=${r.key}`} className="chip" data-active={r.key === range.key}>
                {r.label}
              </Link>
            ))}
          </div>
        </header>
        {payments.length === 0 ? (
          <EmptyState icon="wallet" title="Bu aralıkta tahsilat yok." desc="Farklı bir tarih aralığı seçin." />
        ) : (
          <div className="px-5 pb-5">
            {payments.map((p) => {
              const name = `${p.student.firstName} ${p.student.lastName}`;
              return (
                <div key={p.id} className="flex items-center gap-3 py-3 border-t border-border">
                  <PersonAvatar name={name} size={32} />
                  <Link href={`/app/finans/kursiyer/${p.student.id}`} className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold truncate">{name}</span>
                    <span className="text-xs text-muted truncate">
                      {p.installment ? (p.installment.label ?? `${p.installment.seq}. taksit`) : p.note || "Plan dışı tahsilat"}
                    </span>
                  </Link>
                  <Badge kind="brand">{p.student.licenseClass}</Badge>
                  <Badge kind="neutral">{PAYMENT_METHOD_LABEL[p.method] ?? p.method}</Badge>
                  <span className="ml-auto text-[13px] tabular text-text-2">{date(p.receivedAt)}</span>
                  <span className="text-[13px] tabular font-semibold w-[104px] text-right">{money(p.amount)}</span>
                </div>
              );
            })}
            <div className="flex items-center pt-3.5 mt-1 border-t-2 border-border">
              <span className="text-[13px] font-bold">Toplam</span>
              <span className="ml-auto text-[13px] font-bold tabular">{money(total)}</span>
            </div>
            {payments.length === 300 && (
              <p className="text-xs text-muted mt-3">En yeni 300 işlem gösteriliyor; daha eskisi için aralığı daraltın.</p>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
