"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import { joinCsv } from "@/lib/constants";
import type { InstructorFormState } from "@/lib/instructor-form";

const Schema = z.object({
  name: z.string().trim().min(2, "Ad soyad girin."),
  phone: z.string().trim().optional(),
  mebLicenseNo: z.string().trim().optional(),
  branch: z.enum(["DRIVING", "THEORY"]),
  weeklyCapacity: z.coerce.number().int().min(1, "Haftalık kapasite en az 1 saat olmalı.").max(80, "Haftalık kapasite 80 saati aşamaz."),
});

/** Eğitmen oluşturma/güncelleme. licenseClasses ve subjects formdan çoklu değer olarak gelir
 *  (checkbox listesi); virgülle birleştirilip tek sütuna yazılır. */
export async function instructorFormAction(_prev: InstructorFormState, formData: FormData): Promise<InstructorFormState> {
  const user = await requirePermission("instructor.write");
  const raw = Object.fromEntries(formData);
  const licenseClasses = formData.getAll("licenseClasses").map(String);
  const subjects = formData.getAll("subjects").map(String);
  // Object.fromEntries(formData) aynı isimli çoklu alanlarda (checkbox listesi) yalnızca SON
  // değeri tutar; bu yüzden licenseClasses/subjects ayrıca getAll() ile okunup CSV olarak
  // values'a yazılır — formun hata sonrası doğru seçenekleri geri göstermesi buna dayanır.
  const values = {
    ...Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v ?? "")])),
    licenseClasses: joinCsv(licenseClasses), subjects: joinCsv(subjects),
  };

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return { values, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;
  if (v.branch === "DRIVING" && licenseClasses.length === 0) {
    return { values, error: "En az bir ehliyet sınıfı seçin." };
  }
  if (v.branch === "THEORY" && subjects.length === 0) {
    return { values, error: "En az bir ders kategorisi seçin." };
  }

  const instructorId = String(raw.instructorId ?? "") || undefined;
  const data = {
    name: v.name, phone: v.phone || null, mebLicenseNo: v.mebLicenseNo || null, branch: v.branch, weeklyCapacity: v.weeklyCapacity,
    licenseClasses: v.branch === "DRIVING" ? joinCsv(licenseClasses) : "",
    subjects: v.branch === "THEORY" ? joinCsv(subjects) : null,
  };

  if (instructorId) {
    const existing = await prisma.instructor.findFirst({ where: { id: instructorId, schoolId: user.schoolId } });
    if (!existing) return { values, error: "Eğitmen bulunamadı." };
    await prisma.instructor.update({ where: { id: instructorId }, data });
    await audit({ schoolId: user.schoolId, actorId: user.id, action: "instructor.update", target: instructorId });
    revalidatePath("/app/egitmenler");
    redirect(`/app/egitmenler/${instructorId}?guncellendi=1`);
  }

  const created = await prisma.instructor.create({ data: { schoolId: user.schoolId, isActive: true, ...data } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "instructor.create", target: created.id });
  revalidatePath("/app/egitmenler");
  redirect(`/app/egitmenler/${created.id}?olusturuldu=1`);
}

/** Eğitmeni izinli/aktif olarak işaretler. Pasif eğitmene yeni ders atanamaz (uygunluk kontrolünde elenir değil,
 *  yeni ders/program formlarında listelenmez). */
export async function toggleInstructorActiveAction(formData: FormData) {
  const user = await requirePermission("instructor.write");
  const id = String(formData.get("instructorId") ?? "");
  const instructor = await prisma.instructor.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!instructor) redirect("/app/egitmenler?hata=bulunamadi");

  await prisma.instructor.update({ where: { id }, data: { isActive: !instructor.isActive } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: instructor.isActive ? "instructor.deactivate" : "instructor.activate", target: id });
  revalidatePath("/app/egitmenler");
  redirect(`/app/egitmenler/${id}?durum=${instructor.isActive ? "izinde" : "aktif"}`);
}
