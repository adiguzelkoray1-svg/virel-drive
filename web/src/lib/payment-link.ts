import "server-only";
import { prisma } from "./prisma";

export async function listPaymentLinks(schoolId: string) {
  return prisma.paymentLink.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" } });
}

/** Ödeme sayfası için: kurs bilgisiyle birlikte tek bir link. Giriş gerektirmez —
 *  bkz. app/odeme/lisans/[id] üstündeki not. */
export async function getPaymentLinkForCheckout(id: string) {
  return prisma.paymentLink.findUnique({ where: { id }, include: { school: true } });
}
