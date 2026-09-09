"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import { sendSms } from "@/lib/sms";
import type { SendMessageState } from "@/lib/message-form";

const Schema = z.object({
  studentId: z.string().min(1),
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL", "PUSH"]),
  template: z.string().trim().optional(),
  body: z.string().trim().min(1, "Mesaj boş olamaz.").max(2000, "Mesaj çok uzun."),
});

/**
 * Mesaj gönderir. SMS kanalı, kurs kendi NetGSM bilgilerini Ayarlar › Entegrasyonlar'dan
 * girmişse gerçekten NetGSM üzerinden gider (bkz. lib/sms.ts); WhatsApp/e-posta/push hâlâ
 * simüle ediliyor (bkz. README "Mesajlar hakkında") — o kanallar için gönderim anında durum
 * doğrudan SENT olarak yazılır. Bir sağlayıcı daha bağlandığında burası da aynı desenle genişler.
 */
export async function sendMessageAction(_prev: SendMessageState, formData: FormData): Promise<SendMessageState> {
  const user = await requirePermission("message.send");
  const raw = Object.fromEntries(formData);
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return { body: String(raw.body ?? ""), error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const student = await prisma.student.findFirst({ where: { id: v.studentId, schoolId: user.schoolId } });
  if (!student) return { error: "Kursiyer bulunamadı." };

  let status = "SENT";
  let errorNote: string | null = null;
  if (v.channel === "SMS") {
    const school = await prisma.school.findUniqueOrThrow({
      where: { id: user.schoolId },
      select: { netgsmUsername: true, netgsmPassword: true, netgsmHeader: true },
    });
    const result = await sendSms(school, student.phone, v.body);
    // Kurs kendi NetGSM bilgilerini girmemişse result.error hiç yok — o zaman diğer kanallar gibi
    // simüle edilmiş SENT sayılır. Gerçekten yapılandırılmışken NetGSM hata dönerse FAILED yazılır.
    if (result.error) status = "FAILED";
    errorNote = result.error ?? null;
  }

  await prisma.messageLog.create({
    data: {
      schoolId: user.schoolId, studentId: v.studentId, channel: v.channel,
      template: v.template || null, body: v.body, direction: "OUT", status, sentAt: new Date(),
    },
  });

  await audit({ schoolId: user.schoolId, actorId: user.id, action: "message.send", target: v.studentId, meta: { channel: v.channel, ...(errorNote ? { error: errorNote } : {}) } });
  revalidatePath(`/app/mesajlar/${v.studentId}`);
  revalidatePath("/app/mesajlar");
  if (errorNote) return { body: v.body, error: `SMS gönderilemedi: ${errorNote}` };
  return {};
}

/**
 * Bir kursiyerle olan konuşmayı okundu işaretler. Form göndermeden, konuşma ekranı
 * açıldığında istemci tarafından doğrudan çağrılır (bkz. MarkThreadRead bileşeni) —
 * lib/availability.ts'deki desenle aynı gerekçe: bu bir form aksiyonu değil.
 */
export async function markThreadReadAction(studentId: string) {
  const user = await requirePermission("message.send");
  const result = await prisma.messageLog.updateMany({
    where: { schoolId: user.schoolId, studentId, direction: "IN", status: { not: "READ" } },
    data: { status: "READ" },
  });
  if (result.count > 0) {
    revalidatePath("/app/mesajlar");
    revalidatePath("/app", "layout");
  }
}
