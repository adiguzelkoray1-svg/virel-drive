import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { signSession, verifySession, type SessionPayload } from "./jwt";
import { SESSION_COOKIE, MANAGER_ROLES } from "./constants";
import { can, type Permission } from "./permissions";

export const hashPassword = (pw: string) => bcrypt.hash(pw, 11);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return token;
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Giriş ekranı ve kök sayfa için: çerezdeki oturum gerçekten geçerli mi?
 * Kullanıcı silinmiş ya da pasifleştirilmişse JWT hâlâ imzalı kalır; bunu sormadan
 * /giris → /app → /giris sonsuz yönlendirme döngüsü oluşur.
 * Çerez burada SİLİNMEZ: Next.js render sırasında çerez yazmaya izin vermez,
 * bayat çerez zaten bir sonraki girişte üzerine yazılır.
 */
export async function getLiveSession() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.sub }, select: { isActive: true } });
  return user?.isActive ? session : null;
}

/** Oturum + veritabanındaki güncel kullanıcı. Yoksa /giris'e yönlendirir. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/giris");
  const user = await prisma.user.findUnique({ where: { id: session.sub }, include: { school: true } });
  if (!user || !user.isActive) redirect("/giris?hata=oturum");
  return user;
}

/** Kurs kullanıcısı (kiracı bağlamı). Tüm sorgular bu schoolId ile sınırlanır. */
export async function requireSchoolUser() {
  const user = await requireUser();
  if (user.role === "SUPER_ADMIN") {
    const store = await cookies();
    const asSchool = store.get("virel_drive_as_school")?.value;
    if (asSchool) {
      const school = await prisma.school.findUnique({ where: { id: asSchool } });
      if (school) return { ...user, schoolId: school.id, school, impersonating: true as const };
    }
    redirect("/admin");
  }
  if (!user.schoolId || !user.school) redirect("/giris?hata=kurs");
  return { ...user, schoolId: user.schoolId, school: user.school, impersonating: false as const };
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/app");
  return user;
}

/** Kurs kullanıcısı + yetki; yetkisizse /app'e "yetki" hatasıyla döner. */
export async function requirePermission(perm: Permission) {
  const user = await requireSchoolUser();
  if (!can(user.role, perm)) redirect(`/app?hata=yetki&islem=${perm}`);
  return user;
}

export const isManager = (role: string) => role === "SUPER_ADMIN" || (MANAGER_ROLES as string[]).includes(role);

export async function audit(params: { schoolId?: string | null; actorId?: string | null; action: string; target?: string; meta?: unknown }) {
  await prisma.auditLog.create({
    data: {
      schoolId: params.schoolId ?? null,
      actorId: params.actorId ?? null,
      action: params.action,
      target: params.target,
      meta: params.meta ? JSON.stringify(params.meta) : null,
    },
  });
}
