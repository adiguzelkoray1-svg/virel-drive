"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, clearSessionCookie, setSessionCookie, verifyPassword } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin."),
  password: z.string().min(1, "Şifre girin."),
});

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Bilgileri kontrol edin." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Kullanıcı yoksa da aynı mesaj: hesap sayımı (user enumeration) yapılmasın.
  if (!user || !user.isActive || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "E-posta veya şifre hatalı." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await setSessionCookie({ sub: user.id, role: user.role, schoolId: user.schoolId, name: user.name, email: user.email });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "auth.login" });

  // Kursiyerin masaüstü panelinde hiçbir yetkisi yok (bkz. permissions.ts), bu yüzden
  // doğrudan mobil kursiyer portalına gider. Eğitmenler hem /app'i hem /egitmen'i
  // kullanabildiği için masaüstünde kalır; mobil görünüme oradan bir bağlantıyla geçer.
  redirect(user.role === "SUPER_ADMIN" ? "/admin" : user.role === "STUDENT" ? "/kursiyer" : "/app");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/giris");
}
