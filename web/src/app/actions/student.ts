"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/auth";
import { openDocumentSlots } from "@/lib/student";
import type { StudentFormState } from "@/lib/student-form";

const values = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string").map(([k, v]) => [k, String(v)]));

const StudentSchema = z.object({
  firstName: z.string().trim().min(2, "Ad girin."),
  lastName: z.string().trim().min(2, "Soyad girin."),
  phone: z.string().trim().min(10, "Geçerli bir telefon girin."),
  email: z.string().trim().email("Geçerli bir e-posta girin.").optional().or(z.literal("")),
  nationalId: z.string().trim().regex(/^\d{11}$/, "TC kimlik no 11 haneli olmalı.").optional().or(z.literal("")),
  birthDate: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  licenseClass: z.string().min(1, "Ehliyet sınıfı seçin."),
  fileNo: z.string().trim().optional(),
});

export async function createStudentAction(_prev: StudentFormState, formData: FormData): Promise<StudentFormState> {
  const user = await requirePermission("student.write");
  const back = values(formData);
  const parsed = StudentSchema.safeParse(back);
  if (!parsed.success) return { values: back, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  if (v.fileNo) {
    const clash = await prisma.student.findFirst({ where: { schoolId: user.schoolId, fileNo: v.fileNo } });
    if (clash) return { values: back, error: `${v.fileNo} dosya numarası ${clash.firstName} ${clash.lastName} için kullanılıyor.` };
  }

  const student = await prisma.student.create({
    data: {
      schoolId: user.schoolId, firstName: v.firstName, lastName: v.lastName, phone: v.phone,
      email: v.email || null, nationalId: v.nationalId || null, birthDate: v.birthDate ? new Date(v.birthDate) : null,
      address: v.address || null, licenseClass: v.licenseClass, fileNo: v.fileNo || null,
      stage: "PRE_REGISTRATION", status: "ACTIVE",
    },
  });

  await openDocumentSlots(user.schoolId, student.id);
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "student.create", target: student.id });
  revalidatePath("/app/kursiyerler");
  redirect(`/app/kursiyerler/${student.id}`);
}

export async function updateStudentAction(_prev: StudentFormState, formData: FormData): Promise<StudentFormState> {
  const user = await requirePermission("student.write");
  const back = values(formData);
  const id = String(formData.get("id") ?? "");
  const parsed = StudentSchema.safeParse(back);
  if (!parsed.success) return { values: back, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const existing = await prisma.student.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!existing) return { values: back, error: "Kursiyer bulunamadı." };

  if (v.fileNo) {
    const clash = await prisma.student.findFirst({ where: { schoolId: user.schoolId, fileNo: v.fileNo, id: { not: id } } });
    if (clash) return { values: back, error: `${v.fileNo} dosya numarası ${clash.firstName} ${clash.lastName} için kullanılıyor.` };
  }

  await prisma.student.update({
    where: { id },
    data: {
      firstName: v.firstName, lastName: v.lastName, phone: v.phone, email: v.email || null,
      nationalId: v.nationalId || null, birthDate: v.birthDate ? new Date(v.birthDate) : null,
      address: v.address || null, licenseClass: v.licenseClass, fileNo: v.fileNo || null,
    },
  });

  await audit({ schoolId: user.schoolId, actorId: user.id, action: "student.update", target: id });
  revalidatePath("/app/kursiyerler");
  revalidatePath(`/app/kursiyerler/${id}`);
  redirect(`/app/kursiyerler/${id}`);
}
