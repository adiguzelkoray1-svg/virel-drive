"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import { LEAD_STAGES } from "@/lib/constants";
import type { LeadFormState, ContactFormState, ConvertFormState } from "@/lib/lead-form";

const STAGE_KEYS = LEAD_STAGES.map((s) => s.key) as [string, ...string[]];
const SOURCE_KEYS = ["INSTAGRAM", "WEB", "REFERRAL", "PHONE", "WALK_IN", "OTHER"] as const;

const atNoon = (v: string) => new Date(`${v}T12:00:00`);
const values = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string").map(([k, v]) => [k, String(v)]));

const LeadSchema = z.object({
  name: z.string().trim().min(3, "Ad soyad girin."),
  phone: z.string().trim().min(10, "Geçerli bir telefon girin."),
  email: z.string().trim().email("Geçerli bir e-posta girin.").optional().or(z.literal("")),
  licenseClass: z.string().trim().optional(),
  source: z.enum(SOURCE_KEYS),
  stage: z.enum(STAGE_KEYS),
  nextFollowUpAt: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

/** Aday ekleme/düzenleme. Telefon kurs içinde tekrar ederse uyarır ama engellemez:
 *  aynı kişi farklı kampanyadan yeniden başvurabilir, karar danışmanın olmalı. */
export async function leadFormAction(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const user = await requirePermission("lead.write");
  const back = values(formData);
  const parsed = LeadSchema.safeParse(back);
  if (!parsed.success) return { values: back, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const leadId = String(back.leadId ?? "") || undefined;
  const phone = v.phone.replace(/\s+/g, " ");

  if (!leadId) {
    const digits = phone.replace(/\D/g, "");
    const clash = await prisma.lead.findFirst({
      where: { schoolId: user.schoolId, phone: { contains: digits.slice(-7) }, stage: { notIn: ["WON", "LOST"] } },
    });
    if (clash && back.force !== "1") {
      return { values: back, error: `${clash.name} aynı telefonla açık bir aday olarak kayıtlı. Yine de eklemek için tekrar kaydedin.` };
    }
  }

  const data = {
    name: v.name, phone, email: v.email || null, licenseClass: v.licenseClass || null,
    source: v.source, stage: v.stage,
    nextFollowUpAt: v.nextFollowUpAt ? atNoon(v.nextFollowUpAt) : null,
    notes: v.notes || null,
  };

  if (leadId) {
    const existing = await prisma.lead.findFirst({ where: { id: leadId, schoolId: user.schoolId } });
    if (!existing) return { values: back, error: "Aday bulunamadı." };
    await prisma.lead.update({
      where: { id: leadId },
      // Aşama forma göre değişirse kayıt anı da güncellenmeli.
      data: { ...data, wonAt: v.stage === "WON" ? (existing.wonAt ?? new Date()) : null },
    });
    await audit({ schoolId: user.schoolId, actorId: user.id, action: "lead.update", target: leadId });
    revalidatePath("/app/crm");
    redirect(`/app/crm/${leadId}?guncellendi=1`);
  }

  const created = await prisma.lead.create({
    data: { schoolId: user.schoolId, ...data, wonAt: v.stage === "WON" ? new Date() : null },
  });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "lead.create", target: created.id, meta: { source: v.source } });
  revalidatePath("/app/crm");
  revalidatePath("/app/on-kayitlar");
  redirect(`/app/crm/${created.id}?olusturuldu=1`);
}

const ContactSchema = z.object({
  leadId: z.string().min(1),
  channel: z.string().min(1),
  stage: z.enum(STAGE_KEYS),
  nextFollowUpAt: z.string().trim().optional(),
  note: z.string().trim().optional(),
  lostReason: z.string().trim().optional(),
});

/**
 * Temas kaydı: görüşmeyi not defterine yazar, aşamayı günceller ve bir sonraki
 * takip tarihini belirler. Aday takibinin tamamı bu tek akıştan yürür — ayrı bir
 * "aşama değiştir" ekranı, danışmanın görüşmeyi kaydetmeden aşama atlamasına yol açardı.
 */
export async function logContactAction(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const user = await requirePermission("lead.write");
  const back = values(formData);
  const parsed = ContactSchema.safeParse(back);
  if (!parsed.success) return { values: back, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const lead = await prisma.lead.findFirst({ where: { id: v.leadId, schoolId: user.schoolId } });
  if (!lead) return { values: back, error: "Aday bulunamadı." };
  if (v.stage === "LOST" && !v.lostReason) return { values: back, error: "Kaybedildi işaretlemek için neden seçin." };
  if (v.stage === "WON" && !lead.studentId) {
    return { values: back, error: "Kayıt oldu işaretlemek için adayı kursiyere dönüştürün." };
  }

  const now = new Date();
  const channelLabel = String(back.channelLabel ?? v.channel);
  // Görüşme notları eskiden yeniye değil, en yenisi üstte olacak şekilde biriktirilir.
  const entry = v.note
    ? `${now.toLocaleDateString("tr-TR")} · ${channelLabel}: ${v.note}`
    : `${now.toLocaleDateString("tr-TR")} · ${channelLabel} ile görüşüldü`;

  await prisma.lead.update({
    where: { id: v.leadId },
    data: {
      stage: v.stage,
      lastContactAt: now,
      nextFollowUpAt: v.nextFollowUpAt ? atNoon(v.nextFollowUpAt) : null,
      lostReason: v.stage === "LOST" ? v.lostReason || null : null,
      notes: lead.notes ? `${entry}\n${lead.notes}` : entry,
    },
  });

  await audit({ schoolId: user.schoolId, actorId: user.id, action: "lead.contact", target: v.leadId, meta: { channel: v.channel, stage: v.stage } });
  revalidatePath("/app/crm");
  revalidatePath("/app/on-kayitlar");
  redirect(`/app/crm/${v.leadId}?temas=1`);
}

/** Pipeline kartındaki "Aşamayı ilerlet": bir sonraki açık aşamaya taşır.
 *  Kayıt oldu / kaybedildi buradan seçilemez; ikisi de ayrı bir karar gerektirir. */
export async function advanceStageAction(formData: FormData) {
  const user = await requirePermission("lead.write");
  const id = String(formData.get("leadId") ?? "");
  const lead = await prisma.lead.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!lead) redirect("/app/crm?hata=bulunamadi");

  const order = ["NEW", "INFORMED", "QUOTED", "FOLLOW_UP", "MEETING"];
  const idx = order.indexOf(lead.stage);
  if (idx === -1 || idx === order.length - 1) redirect(`/app/crm/${id}?ilerletilemedi=1`);

  await prisma.lead.update({
    where: { id },
    data: { stage: order[idx + 1], lastContactAt: new Date() },
  });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "lead.advance", target: id, meta: { from: lead.stage, to: order[idx + 1] } });
  revalidatePath("/app/crm");
  revalidatePath("/app/on-kayitlar");
  redirect(`/app/crm?ilerletildi=${encodeURIComponent(lead.name)}`);
}

const ConvertSchema = z.object({
  leadId: z.string().min(1),
  firstName: z.string().trim().min(2, "Ad girin."),
  lastName: z.string().trim().min(2, "Soyad girin."),
  phone: z.string().trim().min(10, "Geçerli bir telefon girin."),
  email: z.string().trim().email("Geçerli bir e-posta girin.").optional().or(z.literal("")),
  licenseClass: z.string().min(1, "Ehliyet sınıfı seçin."),
  fileNo: z.string().trim().optional(),
});

/**
 * Adayı kursiyere dönüştürür: yeni kursiyer ön kayıt aşamasında açılır, aday
 * "Kayıt oldu" olarak kapanır ve ikisi birbirine bağlanır. Bağlantı sayesinde
 * dönüşüm oranı ile kursiyerin hangi kanaldan geldiği sonradan izlenebilir.
 */
export async function convertLeadAction(_prev: ConvertFormState, formData: FormData): Promise<ConvertFormState> {
  const user = await requirePermission("student.write");
  const back = values(formData);
  const parsed = ConvertSchema.safeParse(back);
  if (!parsed.success) return { values: back, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const lead = await prisma.lead.findFirst({ where: { id: v.leadId, schoolId: user.schoolId } });
  if (!lead) return { values: back, error: "Aday bulunamadı." };
  if (lead.studentId) return { values: back, error: "Bu aday zaten kursiyere dönüştürülmüş." };

  if (v.fileNo) {
    const clash = await prisma.student.findFirst({ where: { schoolId: user.schoolId, fileNo: v.fileNo } });
    if (clash) return { values: back, error: `${v.fileNo} dosya numarası ${clash.firstName} ${clash.lastName} için kullanılıyor.` };
  }

  const student = await prisma.student.create({
    data: {
      schoolId: user.schoolId, firstName: v.firstName, lastName: v.lastName, phone: v.phone,
      email: v.email || null, licenseClass: v.licenseClass, fileNo: v.fileNo || null,
      stage: "PRE_REGISTRATION", status: "ACTIVE",
      notes: `${lead.name} adıyla ${new Date(lead.createdAt).toLocaleDateString("tr-TR")} tarihinde ön kayıt olarak geldi.`,
    },
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: { stage: "WON", wonAt: new Date(), lastContactAt: new Date(), nextFollowUpAt: null, studentId: student.id },
  });

  await audit({ schoolId: user.schoolId, actorId: user.id, action: "lead.convert", target: lead.id, meta: { studentId: student.id } });
  revalidatePath("/app/crm");
  revalidatePath("/app/on-kayitlar");
  revalidatePath("/app/kursiyerler");
  redirect(`/app/kursiyerler/${student.id}?adaydan=1`);
}
