"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requireSuperAdmin } from "@/lib/auth";
import type { PaymentLinkFormState } from "@/lib/payment-link-form";

const Schema = z.object({
  schoolId: z.string().min(1),
  plan: z.enum(["STARTER", "PRO", "ENTERPRISE"]),
  amount: z.coerce.number().positive("Tutar pozitif bir sayı olmalı."),
  description: z.string().trim().max(200).optional(),
});

/**
 * Satış görüşmesi sonrası bir ödeme linki oluşturur; tutar plana göre öneriliyor ama elle
 * değiştirilebilir (pazarlıkla anlaşılan özel bir fiyat olabilir). Link genel bir URL'dir —
 * kurs sahibi bunu tıklayınca giriş yapmadan öder (bkz. app/odeme/lisans/[id]); admin bu
 * URL'yi kendisi kopyalayıp e-posta/WhatsApp ile iletir, otomatik gönderim yapılmaz.
 */
export async function createPaymentLinkAction(_prev: PaymentLinkFormState, formData: FormData): Promise<PaymentLinkFormState> {
  const admin = await requireSuperAdmin();
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const school = await prisma.school.findUnique({ where: { id: v.schoolId } });
  if (!school) return { error: "Kurs bulunamadı." };

  const link = await prisma.paymentLink.create({
    data: { schoolId: v.schoolId, plan: v.plan, amountKurus: Math.round(v.amount * 100), description: v.description || null, createdById: admin.id },
  });

  await audit({ schoolId: v.schoolId, actorId: admin.id, action: "payment-link.create", target: link.id, meta: { plan: v.plan, amountKurus: link.amountKurus } });
  revalidatePath(`/admin/kurslar/${v.schoolId}`);
  const base = (process.env.APP_URL ?? "").replace(/\/$/, "");
  return { url: `${base}/odeme/lisans/${link.id}` };
}

/** Henüz ödenmemiş bir linki iptal eder — yanlış tutar girildiğinde veya anlaşma
 *  değiştiğinde eski linkin çalışmaya devam etmesini önlemek için. */
export async function cancelPaymentLinkAction(formData: FormData) {
  const admin = await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  const link = await prisma.paymentLink.findUnique({ where: { id } });
  if (!link) redirect("/admin");
  if (link.status === "PENDING") {
    await prisma.paymentLink.update({ where: { id }, data: { status: "CANCELLED" } });
    await audit({ schoolId: link.schoolId, actorId: admin.id, action: "payment-link.cancel", target: id });
    revalidatePath(`/admin/kurslar/${link.schoolId}`);
  }
  redirect(`/admin/kurslar/${link.schoolId}`);
}
