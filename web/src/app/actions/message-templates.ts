"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import { keyFromLabel } from "@/lib/message-templates";
import type { MessageTemplateFormState } from "@/lib/message-template-form";

const Schema = z.object({
  label: z.string().trim().min(2, "Şablon adı girin.").max(60, "Şablon adı en fazla 60 karakter olabilir."),
  body: z.string().trim().min(2, "Mesaj metni girin.").max(500, "Mesaj metni en fazla 500 karakter olabilir."),
});

/** Şablon ekleme/düzenleme. Anahtar (key) DocumentTypeRule'daki gibi etiketten otomatik
 *  türetiliyor — kullanıcıya teknik bir anahtar sormaya gerek yok. */
export async function messageTemplateFormAction(_prev: MessageTemplateFormState, formData: FormData): Promise<MessageTemplateFormState> {
  const user = await requirePermission("settings.write");
  const raw = Object.fromEntries(formData);
  const values = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v ?? "")]));

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return { values, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const ruleId = String(raw.ruleId ?? "") || undefined;

  if (ruleId) {
    const existing = await prisma.messageTemplateRule.findFirst({ where: { id: ruleId, schoolId: user.schoolId } });
    if (!existing) return { values, error: "Şablon bulunamadı." };
    await prisma.messageTemplateRule.update({ where: { id: ruleId }, data: { label: v.label, body: v.body } });
    await audit({ schoolId: user.schoolId, actorId: user.id, action: "message-template.update", target: ruleId, meta: { label: v.label } });
    revalidatePath("/app/ayarlar/mesaj-sablonlari");
    revalidatePath("/app/mesajlar");
    redirect("/app/ayarlar/mesaj-sablonlari?sablon=guncellendi");
  }

  let key = keyFromLabel(v.label);
  if (await prisma.messageTemplateRule.findUnique({ where: { schoolId_key: { schoolId: user.schoolId, key } } })) {
    key = `${key}_${Math.floor(Math.random() * 900 + 100)}`;
  }
  const count = await prisma.messageTemplateRule.count({ where: { schoolId: user.schoolId } });
  const created = await prisma.messageTemplateRule.create({
    data: { schoolId: user.schoolId, key, label: v.label, body: v.body, sortOrder: count },
  });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "message-template.create", target: created.id, meta: { label: v.label } });
  revalidatePath("/app/ayarlar/mesaj-sablonlari");
  revalidatePath("/app/mesajlar");
  redirect("/app/ayarlar/mesaj-sablonlari?sablon=eklendi");
}

/** Şablonu etkin/pasif yapar. Diğer kurallar gibi hiçbir zaman silinmez. */
export async function toggleMessageTemplateActiveAction(formData: FormData) {
  const user = await requirePermission("settings.write");
  const id = String(formData.get("ruleId") ?? "");
  const rule = await prisma.messageTemplateRule.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!rule) redirect("/app/ayarlar/mesaj-sablonlari?hata=bulunamadi");

  await prisma.messageTemplateRule.update({ where: { id }, data: { isActive: !rule.isActive } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: rule.isActive ? "message-template.deactivate" : "message-template.activate", target: id, meta: { label: rule.label } });
  revalidatePath("/app/ayarlar/mesaj-sablonlari");
  revalidatePath("/app/mesajlar");
  redirect(`/app/ayarlar/mesaj-sablonlari?sablon=${rule.isActive ? "pasif" : "aktif"}`);
}
