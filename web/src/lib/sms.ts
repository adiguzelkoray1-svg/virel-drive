import Netgsm, { SendSmsErrorCode } from "@netgsm/sms";

/** NetGSM `no` alanı başında 0 olmadan 10 haneli bekliyor: "5XXXXXXXXX".
 *  Kursiyer telefonları uygulamada hep "0" ile başlayan 11 hane olarak tutuluyor. */
const toNetgsmNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
};

/** SMS gönderimi. `NETGSM_USERNAME`/`NETGSM_PASSWORD`/`NETGSM_HEADER` tanımlı değilse
 *  gerçek gönderim yapmadan sunucu günlüğüne yazar (bkz. lib/mail.ts ile aynı gerekçe) —
 *  yerelde/prod dışı ortamlarda gerçek bir NetGSM hesabı olmadan da Mesajlar modülü çalışır. */
export async function sendSms(to: string, text: string): Promise<{ delivered: boolean; jobId?: string; error?: string }> {
  const { NETGSM_USERNAME, NETGSM_PASSWORD, NETGSM_HEADER } = process.env;
  if (!NETGSM_USERNAME || !NETGSM_PASSWORD || !NETGSM_HEADER) {
    console.log(`\n[sms · geliştirme] Kime: ${to}\n${text}\n`);
    return { delivered: false };
  }

  const netgsm = new Netgsm({ username: NETGSM_USERNAME, password: NETGSM_PASSWORD, appname: "Virel Drive" });

  try {
    const res = await netgsm.sendRestSms({
      msgheader: NETGSM_HEADER,
      encoding: "TR",
      messages: [{ msg: text, no: toNetgsmNumber(to) }],
    });
    if (res.code !== SendSmsErrorCode.SUCCESS) return { delivered: false, error: res.description };
    return { delivered: true, jobId: res.jobid };
  } catch (e) {
    console.error("[sms] NetGSM gönderim hatası:", e);
    return { delivered: false, error: e instanceof Error ? e.message : "Bilinmeyen hata" };
  }
}

export const smsConfigured = () => Boolean(process.env.NETGSM_USERNAME);
