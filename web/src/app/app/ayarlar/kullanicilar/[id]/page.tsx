import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { Badge, Card, Notice, PersonAvatar } from "@/components/ui";
import { ADMIN_STAFF_ROLES, EXPENSE_SUBCATEGORY_LABEL, ROLE_LABEL, type Role } from "@/lib/constants";
import { date, dateTime, money } from "@/lib/format";
import { can } from "@/lib/permissions";
import { StaffPaymentForm } from "@/components/StaffPaymentForm";

export async function generateMetadata({ params }: PageProps<"/app/ayarlar/kullanicilar/[id]">): Promise<Metadata> {
  const { id } = await params;
  const admin = await requirePermission("users.manage");
  const target = await prisma.user.findFirst({ where: { id, schoolId: admin.schoolId }, select: { name: true } });
  return { title: target?.name ?? "Kullanıcı" };
}

export default async function StaffUserDetailPage({ params, searchParams }: PageProps<"/app/ayarlar/kullanicilar/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const admin = await requirePermission("users.manage");
  const target = await prisma.user.findFirst({ where: { id, schoolId: admin.schoolId } });
  if (!target) notFound();

  // Eğitmen/teorik öğretmen rollerinin kendi hesap ekstresi Eğitmenler sayfasındaki
  // profilinde tutulur (Instructor'a bağlı) — burada ikinci, kopuk bir ekstre açılmasın.
  const isAdminStaff = ADMIN_STAFF_ROLES.includes(target.role as Role);

  const showFinance = can(admin.role, "finance.read");
  const canPay = can(admin.role, "finance.write");
  const payments = showFinance && isAdminStaff
    ? await prisma.expense.findMany({ where: { schoolId: admin.schoolId, staffUserId: target.id, category: "SALARY" }, orderBy: { occurredAt: "desc" } })
    : [];
  const paidSalary = payments.filter((p) => p.subcategory !== "AVANS").reduce((s, p) => s + p.amount, 0);
  const paidAdvance = payments.filter((p) => p.subcategory === "AVANS").reduce((s, p) => s + p.amount, 0);
  const notice = sp.eklendi === "1" ? "Ödeme kaydedildi." : null;

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="h-page">Kullanıcı</h1>
          <span className="text-text-2">Kullanıcılar / {target.name}</span>
        </div>
        <Link href="/app/ayarlar/kullanicilar" className="btn btn-secondary btn-sm"><Icon name="users" size={15} />Kullanıcılar</Link>
      </div>

      {notice && <Notice kind="success">{notice}</Notice>}

      <Card className="p-[22px]">
        <div className="flex items-start gap-[18px] flex-wrap">
          <PersonAvatar name={target.name} size={54} />
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="h-section">{target.name}</h2>
              <Badge kind={target.role === "OWNER" ? "brand" : "neutral"}>{ROLE_LABEL[target.role as Role] ?? target.role}</Badge>
              {!target.isActive && <Badge kind="danger">Pasif</Badge>}
            </div>
            <div className="flex gap-4 items-center flex-wrap text-[13px] text-text-2">
              <span className="flex items-center gap-1.5"><Icon name="mail" size={15} className="text-muted" />{target.email}</span>
              <span className="text-xs text-muted">{target.lastLoginAt ? `Son giriş ${dateTime(target.lastLoginAt)}` : "Hiç giriş yapmadı"}</span>
            </div>
          </div>
        </div>
      </Card>

      {!isAdminStaff && (
        <Card>
          <p className="px-5 py-6 text-[13px] text-text-2 text-center">
            Bu kullanıcının maaş/avans hesap ekstresi kendi Eğitmenler sayfasındaki profilinde tutulur.
          </p>
        </Card>
      )}

      {isAdminStaff && showFinance && (
        <Card id="odeme" title="Maaş ve avans" sub="Bu kullanıcıya yapılan ödemelerin hesap ekstresi">
          <div className="px-5 pb-5 pt-1 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <Metric label="Ödenen maaş" value={money(paidSalary)} />
              <Metric label="Ödenen avans" value={money(paidAdvance)} />
              <Metric label="Toplam" value={money(paidSalary + paidAdvance)} />
            </div>

            {canPay && (
              <div className="border-t border-border pt-3.5">
                <StaffPaymentForm staffUserId={target.id} today={new Date().toISOString().slice(0, 10)} />
              </div>
            )}

            {payments.length > 0 && (
              <div className="pt-3.5 border-t border-border flex flex-col gap-1.5">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5 text-[13px] py-1">
                    <Badge kind={p.subcategory === "AVANS" ? "warning" : "neutral"}>{EXPENSE_SUBCATEGORY_LABEL[p.subcategory ?? "MAAS"]}</Badge>
                    <span className="text-text-2 truncate">{p.note || "—"}</span>
                    <span className="text-xs text-muted tabular ml-auto">{date(p.occurredAt)}</span>
                    <span className="tabular font-semibold w-[96px] text-right">{money(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="stat-lbl">{label}</span>
      <span className="font-display text-[17px] font-semibold tabular">{value}</span>
    </div>
  );
}
