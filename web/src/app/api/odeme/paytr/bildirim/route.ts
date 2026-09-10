// PayTR bildirim ucu — Virel'in PayTR panelinde Bildirim URL olarak ayarlanır.
// merchant_oid = DRV<paymentLink.id>T<ek>
import { prisma } from "@/lib/prisma";
import { paytrVerifyNotification, platformPaytr } from "@/lib/providers/paytr";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cfg = platformPaytr();
  if (!cfg) return new Response("not configured", { status: 503 });
  const f = await req.formData().catch(() => null);
  if (!f) return new Response("bad request", { status: 400 });
  const n = { merchant_oid: String(f.get("merchant_oid") ?? ""), status: String(f.get("status") ?? ""), total_amount: String(f.get("total_amount") ?? ""), hash: String(f.get("hash") ?? "") };
  if (!paytrVerifyNotification(cfg, n)) return new Response("PAYTR notification failed: bad hash", { status: 400 });

  const id = n.merchant_oid.replace(/^DRV/, "").split("T")[0]!;
  const link = await prisma.paymentLink.findUnique({ where: { id } });
  if (!link || link.status === "PAID") return new Response("OK");
  if (n.status !== "success") return new Response("OK");

  await prisma.$transaction([
    prisma.paymentLink.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } }),
    prisma.school.update({ where: { id: link.schoolId }, data: { plan: link.plan, status: "ACTIVE", trialEndsAt: null } }),
    // İlk kez ACTIVE'e geçiyorsa onay tarihi damgalanır — updateSchoolStatusAction'daki aynı gerekçe:
    // zaten onaylanmış bir kursun onay tarihini bu plan yükseltmesiyle ezmemek için.
    prisma.school.updateMany({ where: { id: link.schoolId, approvedAt: null }, data: { approvedAt: new Date() } }),
    prisma.auditLog.create({ data: { schoolId: link.schoolId, action: "payment-link.paid", target: link.id, meta: JSON.stringify({ provider: "PAYTR", oid: n.merchant_oid, amount: n.total_amount, plan: link.plan }) } }),
  ]);
  return new Response("OK");
}
