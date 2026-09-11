import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { dateLong, fullName, money, moneyInWords, receiptNo } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";

export const metadata: Metadata = { title: "Tahsilat Makbuzu" };

export default async function ReceiptPrintPage({ params }: PageProps<"/app/finans/makbuz/[id]">) {
  const user = await requirePermission("finance.read");
  const { id } = await params;

  const payment = await prisma.payment.findFirst({
    where: { id, schoolId: user.schoolId },
    include: { student: true, installment: true },
  });
  if (!payment) notFound();

  return (
    <div className="max-w-[620px] mx-auto">
      <div className="print:hidden mb-4">
        <PrintButton />
      </div>

      <div className="card p-10 flex flex-col gap-7 print:shadow-none print:border-0">
        <div className="flex flex-col items-center gap-1 text-center border-b border-border pb-6">
          <h1 className="font-display text-xl font-bold">TAHSİLAT MAKBUZU</h1>
          <span className="text-[13px] text-text-2 mt-1">{user.school.name}</span>
          {user.school.address && <span className="text-xs text-muted">{user.school.address}</span>}
          {user.school.phone && <span className="text-xs text-muted">{user.school.phone}</span>}
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="Makbuz No" value={receiptNo(payment)} />
          <Field label="Tarih" value={dateLong(payment.receivedAt)} />
          <Field label="Kursiyer" value={fullName(payment.student)} />
          <Field label="Ehliyet Sınıfı" value={`${payment.student.licenseClass} sınıfı`} />
          <Field label="Ödeme Yöntemi" value={PAYMENT_METHOD_LABEL[payment.method] ?? payment.method} />
          <Field label="Açıklama" value={payment.installment ? (payment.installment.label ?? `${payment.installment.seq}. taksit`) : payment.note || "Plan dışı tahsilat"} />
        </div>

        <div className="rounded-md bg-surface-2 px-5 py-4 flex flex-col gap-1">
          <span className="text-xs text-muted uppercase tracking-wide">Tahsil Edilen Tutar</span>
          <span className="font-display text-2xl font-bold tabular">{money(payment.amount, { decimals: true })}</span>
          <span className="text-[13px] text-text-2 italic">Yalnız {moneyInWords(payment.amount)}.</span>
        </div>

        <div className="flex justify-end pt-4">
          <div className="flex flex-col gap-8 items-center">
            <span className="text-[13px] font-semibold">{user.school.name}</span>
            <div className="border-t border-border pt-1 w-[200px] text-center">
              <span className="text-xs text-muted">Yetkili İmza</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted uppercase tracking-wide">{label}</span>
      <span className="text-[14px] font-semibold">{value}</span>
    </div>
  );
}
