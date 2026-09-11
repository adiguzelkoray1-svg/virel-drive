"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import { genTempPassword } from "@/lib/school";
import type { UserFormState, AccessFormState } from "@/lib/users-form";

/** Direksiyon eğitmeni/teorik öğretmen bu sayfadan oluşturulmaz — profili (branş, ehliyet
 *  sınıfı/ders kategorisi) Eğitmenler formunda ayrıca toplanıyor; giriş erişimi de oradan
 *  (Instructor kaydına bağlı olarak) veriliyor, aksi halde aynı bilgiyi iki yerde tutardık. */
const UserSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad girin."),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin."),
  role: z.enum(["OWNER", "MANAGER", "SECRETARY", "ACCOUNTANT"]),
});

export async function createUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const admin = await requirePermission("users.manage");
  const raw = Object.fromEntries(formData);
  const values = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v ?? "")]));

  const parsed = UserSchema.safeParse(raw);
  if (!parsed.success) return { values, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const clash = await prisma.user.findUnique({ where: { email: v.email } });
  if (clash) return { values, error: `${v.email} zaten kullanımda.` };

  const tempPassword = genTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 11);
  const created = await prisma.user.create({ data: { schoolId: admin.schoolId, name: v.name, email: v.email, role: v.role, passwordHash, isActive: true } });

  await audit({ schoolId: admin.schoolId, actorId: admin.id, action: "user.create", target: created.id, meta: { role: v.role } });
  revalidatePath("/app/ayarlar/kullanicilar");
  return { ok: true, email: v.email, tempPassword };
}

/**
 * Kullanıcıyı pasife alır/aktif eder. İki güvenlik korkuluğu: kimse kendi hesabını pasife
 * alamaz (yanlışlıkla kendini kilitleme), ve kursta etkin son OWNER pasife alınamaz —
 * aksi halde kursun hiçbir kullanıcı-yönetim yetkisi kalmayan bir duruma düşmesi mümkün olurdu.
 */
export async function toggleUserActiveAction(formData: FormData) {
  const admin = await requirePermission("users.manage");
  const id = String(formData.get("userId") ?? "");
  const target = await prisma.user.findFirst({ where: { id, schoolId: admin.schoolId } });
  if (!target) redirect("/app/ayarlar/kullanicilar?hata=bulunamadi");
  if (target.id === admin.id) redirect("/app/ayarlar/kullanicilar?hata=kendini");

  if (target.isActive && target.role === "OWNER") {
    const activeOwners = await prisma.user.count({ where: { schoolId: admin.schoolId, role: "OWNER", isActive: true } });
    if (activeOwners <= 1) redirect("/app/ayarlar/kullanicilar?hata=sonowner");
  }

  await prisma.user.update({ where: { id }, data: { isActive: !target.isActive } });
  await audit({ schoolId: admin.schoolId, actorId: admin.id, action: target.isActive ? "user.deactivate" : "user.activate", target: id });
  revalidatePath("/app/ayarlar/kullanicilar");
  redirect(`/app/ayarlar/kullanicilar?durum=${target.isActive ? "pasif" : "aktif"}`);
}

const AccessSchema = z.object({ email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin.") });

/** Zaten var olan bir Instructor kaydına giriş erişimi (User) bağlar. Eğitmenler formu
 *  yalnızca profili oluşturur, giriş bilgisi vermez — bu yüzden şu ana kadar eklenen hiçbir
 *  eğitmen /egitmen mobil portalına giremiyordu (yalnızca seed verisi User+Instructor'ı
 *  birlikte oluşturuyordu). */
export async function grantInstructorAccessAction(_prev: AccessFormState, formData: FormData): Promise<AccessFormState> {
  const admin = await requirePermission("users.manage");
  const instructorId = String(formData.get("id") ?? "");
  const parsed = AccessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Geçerli bir e-posta girin." };

  const instructor = await prisma.instructor.findFirst({ where: { id: instructorId, schoolId: admin.schoolId } });
  if (!instructor) return { error: "Eğitmen bulunamadı." };
  if (instructor.userId) return { error: "Bu eğitmenin zaten bir giriş erişimi var." };

  const clash = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (clash) return { error: `${parsed.data.email} zaten kullanımda.` };

  const tempPassword = genTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 11);
  const role = instructor.branch === "THEORY" ? "THEORY_TEACHER" : "DRIVING_INSTRUCTOR";

  const created = await prisma.user.create({ data: { schoolId: admin.schoolId, name: instructor.name, email: parsed.data.email, role, passwordHash, isActive: true } });
  await prisma.instructor.update({ where: { id: instructorId }, data: { userId: created.id } });

  await audit({ schoolId: admin.schoolId, actorId: admin.id, action: "user.grant_instructor_access", target: created.id, meta: { instructorId } });
  revalidatePath(`/app/egitmenler/${instructorId}`);
  revalidatePath("/app/ayarlar/kullanicilar");
  return { ok: true, email: parsed.data.email, tempPassword };
}

/** Zaten var olan bir Student kaydına kursiyer portalı (/kursiyer) erişimi bağlar —
 *  Kursiyer ekleme formu yalnızca dosyayı açar, giriş bilgisi vermez; aynı gerekçe
 *  grantInstructorAccessAction ile birebir aynı. */
export async function grantStudentAccessAction(_prev: AccessFormState, formData: FormData): Promise<AccessFormState> {
  const admin = await requirePermission("users.manage");
  const studentId = String(formData.get("id") ?? "");
  const parsed = AccessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Geçerli bir e-posta girin." };

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: admin.schoolId } });
  if (!student) return { error: "Kursiyer bulunamadı." };
  if (student.userId) return { error: "Bu kursiyerin zaten bir portal erişimi var." };

  const clash = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (clash) return { error: `${parsed.data.email} zaten kullanımda.` };

  const tempPassword = genTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 11);

  const created = await prisma.user.create({ data: { schoolId: admin.schoolId, name: `${student.firstName} ${student.lastName}`, email: parsed.data.email, role: "STUDENT", passwordHash, isActive: true } });
  await prisma.student.update({ where: { id: studentId }, data: { userId: created.id } });

  await audit({ schoolId: admin.schoolId, actorId: admin.id, action: "user.grant_student_access", target: created.id, meta: { studentId } });
  revalidatePath(`/app/kursiyerler/${studentId}`);
  return { ok: true, email: parsed.data.email, tempPassword };
}
