// PayTR iFrame API. Virel'in kendi PayTR hesabı — kursların ücretli plana geçiş ödemesi
// (tek seferlik lisans veya abonelik) buradan tahsil edilir. Paylaşılan bir kurs hesabı
// kavramı yok, tıpkı NetGSM'in tersine burada gerçekten platform hesabı kullanılıyor çünkü
// para kurstan Virel'e gidiyor (bkz. lib/payment-link.ts).
// Belgeler: https://dev.paytr.com/iframe-api
import { createHmac } from "node:crypto";

export type PaytrConfig = { merchantId: string; merchantKey: string; merchantSalt: string; testMode?: boolean };

const hmac = (key: string, data: string) => createHmac("sha256", key).update(data).digest("base64");

export type PaytrTokenInput = {
  merchantOid: string; // yalnızca harf/rakam, benzersiz
  userIp: string; email: string; amountKurus: number;
  basketName: string; userName: string; userAddress?: string; userPhone?: string;
  okUrl: string; failUrl: string; timeoutMin?: number; maxInstallment?: number;
};

/** paytr_token = base64(HMAC-SHA256(merchant_key, merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode + merchant_salt)) */
export function paytrBuildRequest(cfg: PaytrConfig, p: PaytrTokenInput): Record<string, string> {
  const basket = Buffer.from(JSON.stringify([[p.basketName, (p.amountKurus / 100).toFixed(2), 1]])).toString("base64");
  const noInstallment = "0"; const maxInstallment = String(p.maxInstallment ?? 0); const currency = "TL"; const testMode = cfg.testMode ? "1" : "0";
  const amount = String(Math.round(p.amountKurus));
  const token = hmac(cfg.merchantKey, cfg.merchantId + p.userIp + p.merchantOid + p.email + amount + basket + noInstallment + maxInstallment + currency + testMode + cfg.merchantSalt);
  return {
    merchant_id: cfg.merchantId, user_ip: p.userIp, merchant_oid: p.merchantOid, email: p.email, payment_amount: amount, paytr_token: token,
    user_basket: basket, debug_on: "1", no_installment: noInstallment, max_installment: maxInstallment, user_name: p.userName.slice(0, 60),
    user_address: (p.userAddress || "Türkiye").slice(0, 120), user_phone: (p.userPhone || "05000000000").replace(/\D/g, "").slice(0, 15) || "05000000000",
    merchant_ok_url: p.okUrl, merchant_fail_url: p.failUrl, timeout_limit: String(p.timeoutMin ?? 30), currency, test_mode: testMode, lang: "tr",
  };
}

export type PaytrTokenResult = { status: "success" | "failed"; token?: string; reason?: string };
export async function paytrGetToken(cfg: PaytrConfig, p: PaytrTokenInput): Promise<PaytrTokenResult> {
  const body = new URLSearchParams(paytrBuildRequest(cfg, p));
  try {
    const r = await fetch("https://www.paytr.com/odeme/api/get-token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, signal: AbortSignal.timeout(20_000) });
    const j = (await r.json()) as PaytrTokenResult;
    return j.status === "success" && j.token ? j : { status: "failed", reason: j.reason ?? `HTTP ${r.status}` };
  } catch (e) { return { status: "failed", reason: (e as Error).message }; }
}
export const paytrIframeUrl = (token: string) => `https://www.paytr.com/odeme/guvenli/${token}`;

/** merchant_oid üretir — sunucu bileşeni render'ı içinde doğrudan `Date.now()` çağırmak
 *  `react-hooks/purity` kuralını tetikliyor (React Compiler saflık kontrolü); bu yüzden
 *  çağrı buraya, bileşen gövdesinin dışına alındı. */
export const paytrMerchantOid = (prefix: string, id: string) => `${prefix}${id}T${Date.now().toString(36)}`;

/** Bildirim (callback) doğrulaması: hash = base64(HMAC-SHA256(merchant_key, merchant_oid + merchant_salt + status + total_amount)) */
export function paytrVerifyNotification(cfg: PaytrConfig, n: { merchant_oid: string; status: string; total_amount: string; hash: string }): boolean {
  const expected = hmac(cfg.merchantKey, n.merchant_oid + cfg.merchantSalt + n.status + n.total_amount);
  return expected === n.hash;
}

/** Virel'in kendi PayTR hesabı (plan ödemesi tahsilatı). Env yoksa null — ödeme linki
 *  sayfası bu durumda "henüz açık değil" mesajı gösterir, hiçbir yeri çökertmez. */
export function platformPaytr(): PaytrConfig | null {
  const { PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT, PAYTR_TEST_MODE } = process.env;
  if (!PAYTR_MERCHANT_ID || !PAYTR_MERCHANT_KEY || !PAYTR_MERCHANT_SALT) return null;
  return { merchantId: PAYTR_MERCHANT_ID, merchantKey: PAYTR_MERCHANT_KEY, merchantSalt: PAYTR_MERCHANT_SALT, testMode: PAYTR_TEST_MODE === "1" };
}
