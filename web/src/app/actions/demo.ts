"use server";
import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mail";
import { requireSuperAdmin, audit } from "@/lib/auth";
import { DEMO_SIZES } from "@/lib/demo";

export type DemoState = { error?: string; ok?: boolean };

const schema = z.object({
  schoolName: z.string().min(2, "Kurs adı en az 2 karakter").max(120),
  name: z.string().min(2, "Adınız gerekli").max(120),
  email: z.string().email("Geçerli bir e-posta girin"),
  phone: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  size: z.string().optional(),
  message: z.string().max(2000).optional(),
});

/** Tanıtım sayfasındaki "Demo talep et" formu: kayıt oluşturur, süper admine e-posta bırakır. */
export async function requestDemoAction(_prev: DemoState, form: FormData): Promise<DemoState> {
  if (String(form.get("website") ?? "")) return { ok: true }; // bal küpü: botlar doldurur, sessizce yut
  const raw = Object.fromEntries(["schoolName", "name", "email", "phone", "city", "size", "message"].map((k) => [k, String(form.get(k) ?? "").trim()]));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (form.get("kvkk") !== "on") return { error: "Devam etmek için KVKK aydınlatma metnini onaylamanız gerekir." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = rateLimit(`demo:${ip}`, 5, 60 * 60_000);
  if (!rl.ok) return { error: "Çok fazla talep gönderildi. Lütfen daha sonra tekrar deneyin." };
  const d = parsed.data;
  const size = DEMO_SIZES.some((s) => s.key === d.size) ? d.size : null;
  const r = await prisma.demoRequest.create({ data: { schoolName: d.schoolName, name: d.name, email: d.email.toLowerCase(), phone: d.phone || null, city: d.city || null, size, message: d.message || null } });
  const to = process.env.DEMO_NOTIFY_EMAIL || process.env.SUPER_ADMIN_EMAIL;
  if (to) {
    await sendMail({
      to, subject: `Yeni demo talebi · ${d.schoolName}`,
      text: `${d.name} (${d.email}${d.phone ? ", " + d.phone : ""}) — ${d.schoolName}${d.city ? " / " + d.city : ""}\nBüyüklük: ${size ?? "—"}\n\n${d.message ?? ""}\n\nTalebi aç: /admin/demo-talepleri#demo-${r.id}`,
    }).catch((e) => console.error("[demo] bildirim e-postası gönderilemedi", e));
  }
  await sendMail({
    to: d.email, subject: "Virel Drive demo talebiniz alındı",
    text: `Merhaba ${d.name},\n\n${d.schoolName} için demo talebinizi aldık. En kısa sürede sizinle iletişime geçeceğiz.\n\nVirel Drive`,
  }).catch(() => null);
  revalidatePath("/admin/demo-talepleri");
  return { ok: true };
}

export async function setDemoStatusAction(form: FormData) {
  const admin = await requireSuperAdmin();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!["NEW", "CONTACTED", "CONVERTED", "CLOSED"].includes(status)) return;
  const note = form.has("note") ? String(form.get("note") ?? "").trim() || null : undefined;
  const r = await prisma.demoRequest.update({ where: { id }, data: { status, ...(note !== undefined ? { note } : {}) } });
  await audit({ actorId: admin.id, action: "demo.status", target: r.schoolName, meta: { status } });
  revalidatePath("/admin/demo-talepleri");
}

/** Demo talebini kalıcı olarak siler (test kayıtları, mükerrerler). Denetim kaydına düşer. */
export async function deleteDemoRequestAction(form: FormData) {
  const admin = await requireSuperAdmin();
  const id = String(form.get("id") ?? "");
  if (!id) return;
  const r = await prisma.demoRequest.findUnique({ where: { id } });
  if (!r) return;
  await prisma.demoRequest.delete({ where: { id } });
  await audit({ actorId: admin.id, action: "demo.delete", target: r.schoolName, meta: { email: r.email, source: r.source } });
  revalidatePath("/admin/demo-talepleri");
}
