import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { deleteExpenseAction } from "@/app/actions/finance";
import { Badge, Card, EmptyState, Notice, PageHeader, ProgressBar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ExpenseForm } from "./ExpenseForm";
import { EXPENSE_CATEGORY_LABEL, EXPENSE_SUBCATEGORY_LABEL } from "@/lib/constants";
import { date, money } from "@/lib/format";
import { FinanceTabs } from "../tabs";

export const metadata: Metadata = { title: "Giderler" };

export default async function ExpensesPage({ searchParams }: PageProps<"/app/finans/giderler">) {
  const user = await requirePermission("finance.read");
  const canWrite = can(user.role, "finance.write");
  const sp = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  // Ay seçimi: 0 = bu ay. Gider takibi ay kapanışında yapıldığı için geçmiş aylara bakılabilmeli.
  const monthsAgo = Math.max(0, Math.min(11, Number(sp.ay) || 0));
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);

  const [expenses, vehicleCosts] = await Promise.all([
    prisma.expense.findMany({ where: { schoolId: user.schoolId, occurredAt: { gte: from, lt: to } }, include: { instructor: true }, orderBy: { occurredAt: "desc" } }),
    // Araç giderleri ayrı tabloda tutuluyor; ay toplamında görünmezse tablo yanıltıcı olur.
    prisma.vehicleCost.aggregate({ where: { schoolId: user.schoolId, occurredAt: { gte: from, lt: to } }, _sum: { amount: true }, _count: true }),
  ]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const fleet = vehicleCosts._sum.amount ?? 0;
  const byCategory = Object.keys(EXPENSE_CATEGORY_LABEL).map((key) => ({
    key,
    label: EXPENSE_CATEGORY_LABEL[key],
    amount: expenses.filter((e) => e.category === key).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { value: i, label: d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }) };
  });
  const monthLabel = from.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  return (
    <>
      <PageHeader title="Giderler" sub={`${monthLabel} · ${money(total)} kayıtlı gider`} />
      <FinanceTabs active="giderler" />

      {sp.eklendi && <Notice kind="success">Gider kaydedildi.</Notice>}
      {sp.silindi && <Notice kind="info">Gider kaydı silindi.</Notice>}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
        <Card className="min-w-0">
          <header className="flex items-center gap-3 px-5 pt-5 pb-3 flex-wrap">
            <h2 className="h-card">Gider kayıtları</h2>
            <form className="flex items-center gap-2 ml-auto">
              <select name="ay" defaultValue={String(monthsAgo)} className="input h-8 text-[13px] w-[160px]" aria-label="Ay seç">
                {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <button className="btn btn-secondary btn-xs">Göster</button>
            </form>
          </header>
          {expenses.length === 0 ? (
            <EmptyState icon="wallet" title="Bu ay gider kaydı yok." desc="Kira, personel ve fatura giderlerini buradan girebilirsiniz." />
          ) : (
            <div className="px-5 pb-5">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-3 border-t border-border">
                  <span className="w-9 h-9 rounded-md bg-blue-050 text-blue flex items-center justify-center shrink-0"><Icon name="wallet" size={17} /></span>
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold truncate">
                      {e.instructor ? e.instructor.name : e.note || EXPENSE_CATEGORY_LABEL[e.category] || e.category}
                    </span>
                    <span className="text-xs text-muted">{date(e.occurredAt)}{e.instructor && e.note ? ` · ${e.note}` : ""}</span>
                  </span>
                  {e.instructor ? (
                    <>
                      <Badge kind={e.subcategory === "AVANS" ? "warning" : "neutral"}>{EXPENSE_SUBCATEGORY_LABEL[e.subcategory ?? "MAAS"]}</Badge>
                      <Link href={`/app/egitmenler/${e.instructor.id}`} className="text-xs font-semibold text-blue">Eğitmen →</Link>
                    </>
                  ) : (
                    /* Açıklama yoksa başlık zaten kategori adı; rozeti tekrar etmeye gerek yok. */
                    e.note && <Badge kind="neutral">{EXPENSE_CATEGORY_LABEL[e.category] ?? e.category}</Badge>
                  )}
                  <span className="ml-auto text-[13px] tabular font-semibold">{money(e.amount)}</span>
                  {canWrite && (
                    <form action={deleteExpenseAction}>
                      <input type="hidden" name="expenseId" value={e.id} />
                      <button className="btn btn-ghost btn-xs" aria-label="Gideri sil"><Icon name="trash" size={15} /></button>
                    </form>
                  )}
                </div>
              ))}
              <div className="flex items-center pt-3.5 mt-1 border-t-2 border-border">
                <span className="text-[13px] font-bold">Toplam</span>
                <span className="ml-auto text-[13px] font-bold tabular">{money(total)}</span>
              </div>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          {canWrite && (
            <Card title="Gider ekle" sub="araç giderleri araç detayından girilir">
              <ExpenseForm today={today} />
            </Card>
          )}

          <Card title="Kategori dağılımı" sub={monthLabel}>
            <div className="px-5 pb-5 pt-1 flex flex-col gap-3">
              {byCategory.length === 0 ? (
                <span className="text-[13px] text-text-2 py-2">Bu ay kayıt yok.</span>
              ) : byCategory.map((c) => (
                <div key={c.key} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-text-2">{c.label}</span>
                    <span className="ml-auto text-[13px] font-semibold tabular">{money(c.amount)}</span>
                  </div>
                  <ProgressBar value={Math.round((c.amount / total) * 100)} height={6} />
                </div>
              ))}
              <div className="flex items-center gap-2 pt-3 mt-1 border-t border-border">
                <span className="text-[13px] text-text-2">Araç giderleri <span className="text-muted">({vehicleCosts._count} fiş)</span></span>
                <span className="ml-auto text-[13px] font-semibold tabular">{money(fleet)}</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Araç giderleri plakaya bağlı olduğu için ayrı tabloda tutulur ve araçlar modülünden girilir;
                aylık gelir/gider özetinde toplam gidere dahil edilir.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
