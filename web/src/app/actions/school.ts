"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import type { SchoolProfileState } from "@/lib/school-form";

const Schema = z.object({
  name: z.string().trim().min(2, "Kurs adı girin."),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Geçerli bir e-posta girin.").optional().or(z.literal("")),
  address: z.string().trim().optional(),
  taxNumber: z.string().trim().optional(),
  taxOffice: z.string().trim().optional(),
  mebCode: z.string().trim().optional(),
});

/** Kurs profilini günceller. Sınıf kuralları gibi burada da durum/plan değiştirilemez —
 *  bunlar yalnızca süper admin konsolundan yönetilir (bkz. app/actions/admin.ts). */
export async function updateSchoolProfileAction(_prev: SchoolProfileState, formData: FormData): Promise<SchoolProfileState> {
  const user = await requirePermission("settings.write");
  const raw = Object.fromEntries(formData);
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  await prisma.school.update({
    where: { id: user.schoolId },
    data: {
      name: v.name, city: v.city || null, district: v.district || null, phone: v.phone || null,
      email: v.email || null, address: v.address || null, taxNumber: v.taxNumber || null,
      taxOffice: v.taxOffice || null, mebCode: v.mebCode || null,
    },
  });

  await audit({ schoolId: user.schoolId, actorId: user.id, action: "school.profile.update" });
  revalidatePath("/app/kurs");
  revalidatePath("/app", "layout");
  return { ok: true };
}
