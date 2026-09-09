// Ana site (virel.com.tr) → demo talebi köprüsü.
// POST JSON {orgName, name, email, phone?, city?, size?, message?} + Authorization: Bearer <HUB_SECRET>
// Kayıt bu ürünün DemoRequest tablosuna source=HUB olarak düşer; süper admin /admin/demo-talepleri'nde görür.
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mail";
import { DEMO_SIZES } from "@/lib/demo";

export const dynamic = "force-dynamic";

// Ana site "orgName" gönderir; bu üründe alan adı "schoolName" (kurs adı).
const hubSchema = z.object({
  orgName: z.string().min(2, "Kurs adı en az 2 karakter").max(120),
  sector: z.string().optional(),
  name: z.string().min(2, "Adınız gerekli").max(120),
  email: z.string().email("Geçerli bir e-posta girin"),
  phone: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  size: z.string().optional(),
  message: z.string().max(2000).optional(),
});

function authorized(req: Request) {
  const secret = process.env.HUB_SECRET;
  if (!secret || secret.length < 16) return false;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "hub";
  if (!rateLimit(`hub-demo:${ip}`, 60, 60 * 60_000).ok) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }); }
  const parsed = hubSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 422 });
  const d = parsed.data;
  const size = DEMO_SIZES.some((s) => s.key === d.size) ? d.size! : null;
  const r = await prisma.demoRequest.create({ data: { schoolName: d.orgName, name: d.name, email: d.email.toLowerCase(), phone: d.phone || null, city: d.city || null, size, message: d.message || null, source: "HUB" } });
  const to = process.env.DEMO_NOTIFY_EMAIL || process.env.SUPER_ADMIN_EMAIL;
  if (to) {
    await sendMail({
      to, subject: `Yeni demo talebi · ${d.orgName} (ana site)`,
      text: `${d.name} (${d.email}${d.phone ? ", " + d.phone : ""}) — ${d.orgName}${d.city ? " / " + d.city : ""}\nBüyüklük: ${size ?? "—"}\nKaynak: virel.com.tr\n\n${d.message ?? ""}\n\nTalebi aç: /admin/demo-talepleri#demo-${r.id}`,
    }).catch((e) => console.error("[demo] bildirim e-postası gönderilemedi", e));
  }
  await sendMail({
    to: d.email, subject: "Virel Drive demo talebiniz alındı",
    text: `Merhaba ${d.name},\n\n${d.orgName} için demo talebinizi aldık. En kısa sürede sizinle iletişime geçeceğiz.\n\nVirel Drive`,
  }).catch(() => null);
  revalidatePath("/admin/demo-talepleri");
  return NextResponse.json({ ok: true, id: r.id }, { status: 201 });
}

/** Ana sitenin bağlantı testi için. */
export async function GET(req: Request) {
  return NextResponse.json({ ok: true, service: "virel-drive", authorized: authorized(req) });
}
