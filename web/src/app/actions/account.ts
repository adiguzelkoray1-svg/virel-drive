"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import type { ChangePasswordFormState } from "@/lib/account-form";

const Schema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifrenizi girin."),
  newPassword: z.string().min(8, "Yeni şifre en az 8 karakter olmalı."),
  confirmPassword: z.string().min(1, "Yeni şifreyi tekrar girin."),
});

/**
 * Herhangi bir rolün (masaüstü personel, eğitmen, kursiyer, süper admin) kendi şifresini
 * değiştirmesi — `requireUser()` role bakmadığı için tek bir aksiyon üçü arasında paylaşılıyor
 * (bkz. paylaşılan `ChangePasswordForm`). Bundan önce bir kullanıcının şifresini yalnızca
 * bir yönetici, "Kullanıcılar ve roller"deki geçici şifre akışıyla değiştirebiliyordu —
 * kendi şifresini unutmadan, kendi isteğiyle değiştirmenin hiçbir yolu yoktu.
 */
export async function changePasswordFormAction(_prev: ChangePasswordFormState, formData: FormData): Promise<ChangePasswordFormState> {
  const user = await requireUser();
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  if (v.newPassword !== v.confirmPassword) return { error: "Yeni şifreler eşleşmiyor." };
  if (!(await verifyPassword(v.currentPassword, user.passwordHash))) return { error: "Mevcut şifre yanlış." };
  if (v.newPassword === v.currentPassword) return { error: "Yeni şifre eskisiyle aynı olamaz." };

  const passwordHash = await hashPassword(v.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "account.password-change", target: user.id });

  return { ok: true };
}
