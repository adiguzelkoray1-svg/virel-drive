import nodemailer from "nodemailer";

/** E-posta gönderimi. SMTP_* değişkenleri tanımlıysa gerçek gönderim; değilse sunucu günlüğüne yazar (geliştirme). */
export async function sendMail(opts: { to: string; subject: string; text: string; html?: string }): Promise<{ delivered: boolean }> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
  if (!SMTP_HOST) {
    console.log(`\n[mail · geliştirme] Kime: ${opts.to}\nKonu: ${opts.subject}\n${opts.text}\n`);
    return { delivered: false };
  }
  const port = Number(SMTP_PORT ?? 587);
  // Bağlantı kurulamazsa isteği sonsuza kadar bekletme; hata mesajı net dönsün (Railway bazı planlarda giden SMTP'yi kapatır)
  const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: SMTP_USER ? { user: SMTP_USER.trim(), pass: (SMTP_PASS ?? "").replace(/\s/g, "") } : undefined, connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 30_000, ...(process.env.SMTP_IP_FAMILY === "4" ? { family: 4 } : {}) } as Parameters<typeof nodemailer.createTransport>[0]);
  await transport.sendMail({ from: MAIL_FROM ?? "Virel Drive <no-reply@virel.com.tr>", to: opts.to, subject: opts.subject, text: opts.text, html: opts.html });
  return { delivered: true };
}

export const mailConfigured = () => Boolean(process.env.SMTP_HOST);
