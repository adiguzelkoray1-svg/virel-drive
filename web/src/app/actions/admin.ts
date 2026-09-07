"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { audit, hashPassword, requireUser, requireSuperAdmin, startImpersonation, stopImpersonation } from "@/lib/auth";
import { SCHOOL_PLAN_LIMITS, IMPERSONATE_COOKIE } from "@/lib/constants";
import type { SchoolFormState, PlanFormState } from "@/lib/admin-form";

const slugify = (s: string) =>
  s.toLocaleLowerCase("tr").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "kurs";

/** Herkese açık, hatırlanması kolay bir geçici şifre — büyük harf ve rakam karışımı,
 *  karıştırıcı karakterler (0/O, 1/I/l) elenmiş. */
const genTempPassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => chars[crypto.randomInt(chars.length)]).join("");
};

const SchoolSchema = z.object({
  name: z.string().trim().min(2, "Kurs adı girin."),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Geçerli bir e-posta girin.").optional().or(z.literal("")),
  plan: z.enum(["TRIAL", "STARTER", "PRO", "ENTERPRISE"]),
  ownerName: z.string().trim().min(2, "Kurs sahibinin adını girin."),
  ownerEmail: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin."),
});

/**
 * Yeni bir kurs (kiracı) ve ilk OWNER kullanıcısını açar. Geçici şifre yalnızca burada,
 * bir kerelik gösterilir — e-posta gönderme altyapısı olmadığı için admin bunu elle iletir.
 * Bu yüzden bu aksiyon başarıda yönlendirmez: şifre URL'e sızmasın diye aynı sayfada durum
 * olarak döner.
 */
export async function createSchoolAction(_prev: SchoolFormState & { tempPassword?: string; ownerEmail?: string }, formData: FormData) {
  const admin = await requireSuperAdmin();
  const raw = Object.fromEntries(formData);
  const values = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v ?? "")]));

  const parsed = SchoolSchema.safeParse(raw);
  if (!parsed.success) return { values, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const emailClash = await prisma.user.findUnique({ where: { email: v.ownerEmail } });
  if (emailClash) return { values, error: `${v.ownerEmail} zaten kullanımda.` };

  let slug = slugify(v.name);
  if (await prisma.school.findUnique({ where: { slug } })) slug = `${slug}-${crypto.randomInt(1000, 9999)}`;

  const limits = SCHOOL_PLAN_LIMITS[v.plan];
  const tempPassword = genTempPassword();

  const school = await prisma.$transaction(async (tx) => {
    const created = await tx.school.create({
      data: {
        name: v.name, slug, city: v.city || null, district: v.district || null, phone: v.phone || null, email: v.email || null,
        status: "TRIAL", plan: v.plan, userLimit: limits.userLimit, studentLimit: limits.studentLimit,
        trialEndsAt: new Date(Date.now() + 14 * 86_400_000),
      },
    });
    await tx.user.create({ data: { email: v.ownerEmail, name: v.ownerName, role: "OWNER", passwordHash: await hashPassword(tempPassword), schoolId: created.id } });
    return created;
  });

  await audit({ actorId: admin.id, action: "school.create", target: school.id, meta: { name: v.name, plan: v.plan } });
  revalidatePath("/admin");
  return { ok: true as const, tempPassword, ownerEmail: v.ownerEmail, schoolId: school.id };
}

const StatusSchema = z.enum(["PENDING", "TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "DELETED"]);

/** Kurs durumunu değiştirir. İlk kez ACTIVE'e geçişte onay tarihi damgalanır —
 *  "onaylandı" anının ne zaman olduğu ayrı bir bilgi, durum geriye dönse bile kaybolmasın diye. */
export async function updateSchoolStatusAction(formData: FormData) {
  const admin = await requireSuperAdmin();
  const schoolId = String(formData.get("schoolId") ?? "");
  const status = StatusSchema.safeParse(formData.get("status"));
  if (!status.success) redirect(`/admin/kurslar/${schoolId}?hata=durum`);

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) redirect("/admin?hata=bulunamadi");

  await prisma.school.update({
    where: { id: schoolId },
    data: { status: status.data, approvedAt: status.data === "ACTIVE" && !school.approvedAt ? new Date() : undefined },
  });
  await audit({ schoolId, actorId: admin.id, action: "school.status", target: schoolId, meta: { from: school.status, to: status.data } });
  revalidatePath("/admin");
  revalidatePath(`/admin/kurslar/${schoolId}`);
  redirect(`/admin/kurslar/${schoolId}?durum=guncellendi`);
}

const PlanSchema = z.object({
  schoolId: z.string().min(1),
  plan: z.enum(["TRIAL", "STARTER", "PRO", "ENTERPRISE"]),
  userLimit: z.coerce.number().int().min(1, "En az 1 kullanıcı hakkı olmalı."),
  studentLimit: z.coerce.number().int().min(1, "En az 1 kursiyer hakkı olmalı."),
});

/** Plan ve kullanım limitlerini günceller. Limitler plana göre otomatik önerilir ama
 *  elle de değiştirilebilir — kurumsal bir müşteriye özel bir limit tanımlamak isteyebilir. */
export async function updateSchoolPlanAction(_prev: PlanFormState, formData: FormData): Promise<PlanFormState> {
  const admin = await requireSuperAdmin();
  const raw = Object.fromEntries(formData);
  const parsed = PlanSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const school = await prisma.school.findUnique({ where: { id: v.schoolId } });
  if (!school) return { error: "Kurs bulunamadı." };

  const [userCount, studentCount] = await Promise.all([
    prisma.user.count({ where: { schoolId: v.schoolId } }),
    prisma.student.count({ where: { schoolId: v.schoolId } }),
  ]);
  if (v.userLimit < userCount) return { error: `Kullanıcı limiti mevcut ${userCount} kullanıcının altına düşürülemez.` };
  if (v.studentLimit < studentCount) return { error: `Kursiyer limiti mevcut ${studentCount} kursiyerin altına düşürülemez.` };

  await prisma.school.update({ where: { id: v.schoolId }, data: { plan: v.plan, userLimit: v.userLimit, studentLimit: v.studentLimit } });
  await audit({ schoolId: v.schoolId, actorId: admin.id, action: "school.plan", target: v.schoolId, meta: { plan: v.plan, userLimit: v.userLimit, studentLimit: v.studentLimit } });
  revalidatePath(`/admin/kurslar/${v.schoolId}`);
  revalidatePath("/admin");
  return { ok: true };
}

/** Süper admin bir kursu kendi arayüzünden görüntülemeye başlar. */
export async function startImpersonationAction(formData: FormData) {
  const admin = await requireSuperAdmin();
  const schoolId = String(formData.get("schoolId") ?? "");
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) redirect("/admin?hata=bulunamadi");

  await startImpersonation(schoolId);
  await audit({ schoolId, actorId: admin.id, action: "school.impersonate.start", target: schoolId });
  redirect("/app");
}

/** Kurs görünümünden konsola dönüş. requireUser yeterli — impersonating olmayan bir
 *  kullanıcı bu formu zaten göremez (bkz. app/app/layout.tsx). Denetim kaydına start ile
 *  simetrik bir stop yazılır; aksi halde kayıtta bir kursun ne zaman görüntülenmeye
 *  başlandığı görünür ama ne zaman bırakıldığı hiç görünmezdi. */
export async function stopImpersonationAction() {
  const admin = await requireUser();
  const schoolId = (await cookies()).get(IMPERSONATE_COOKIE)?.value;
  await stopImpersonation();
  if (schoolId) await audit({ schoolId, actorId: admin.id, action: "school.impersonate.stop", target: schoolId });
  redirect("/admin");
}
