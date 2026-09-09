import Netgsm, { SendSmsErrorCode } from "@netgsm/sms";

export type NetgsmCredentials = { netgsmUsername: string | null; netgsmPassword: string | null; netgsmHeader: string | null };

/** NetGSM `no` alanı başında 0 olmadan 10 haneli bekliyor: "5XXXXXXXXX".
 *  Kursiyer telefonları uygulamada hep "0" ile başlayan 11 hane olarak tutuluyor. */
const toNetgsmNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
};

export const smsConfigured = (creds: NetgsmCredentials) =>
  Boolean(creds.netgsmUsername && creds.netgsmPassword && creds.netgsmHeader);

/** SMS gönderimi — her kurs kendi NetGSM hesabından gönderir, paylaşılan bir platform hesabı
 *  yok (bkz. School.netgsmUsername vb.). Kurs kendi bilgilerini Ayarlar › Entegrasyonlar'dan
 *  girmemişse gerçek gönderim yapmadan sunucu günlüğüne yazar (bkz. lib/mail.ts ile aynı
 *  gerekçe) — kimlik bilgisi olmadan da Mesajlar modülü çalışmaya devam eder. */
export async function sendSms(creds: NetgsmCredentials, to: string, text: string): Promise<{ delivered: boolean; jobId?: string; error?: string }> {
  if (!smsConfigured(creds)) {
    console.log(`\n[sms · geliştirme] Kime: ${to}\n${text}\n`);
    return { delivered: false };
  }

  const netgsm = new Netgsm({ username: creds.netgsmUsername!, password: creds.netgsmPassword!, appname: "Virel Drive" });

  try {
    const res = await netgsm.sendRestSms({
      msgheader: creds.netgsmHeader!,
      encoding: "TR",
      messages: [{ msg: text, no: toNetgsmNumber(to) }],
    });
    if (res.code !== SendSmsErrorCode.SUCCESS) return { delivered: false, error: res.description };
    return { delivered: true, jobId: res.jobid };
  } catch (e) {
    console.error("[sms] NetGSM gönderim hatası:", e);
    // Netgsm SDK'sı hata durumunda Error değil, {status, code, description} şeklinde düz bir
    // nesne fırlatıyor (bkz. node_modules/@netgsm/sms/dist/netgsm.js::handleResponse) —
    // e instanceof Error hep false döner, bu yüzden description'ı ayrıca kontrol ediyoruz.
    const description = typeof e === "object" && e !== null && "description" in e ? String(e.description) : undefined;
    return { delivered: false, error: description ?? (e instanceof Error ? e.message : "Bilinmeyen hata") };
  }
}
