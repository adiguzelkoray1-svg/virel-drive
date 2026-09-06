"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/auth";
import type { VehicleFormState, CostFormState } from "@/lib/vehicle-form";

const VehicleSchema = z.object({
  plate: z.string().trim().min(5, "Plaka girin.").transform((p) => p.toLocaleUpperCase("tr")),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  year: z.string().trim().optional(),
  licenseClass: z.string().min(1, "Ehliyet sınıfı seçin."),
  usage: z.enum(["TRAINING", "EXAM"]),
  status: z.enum(["ACTIVE", "MAINTENANCE", "PASSIVE"]),
  km: z.coerce.number().int().min(0, "Kilometre negatif olamaz."),
  nextServiceKm: z.string().trim().optional(),
  fuelType: z.string().trim().optional(),
  inspectionUntil: z.string().trim().optional(),
  insuranceUntil: z.string().trim().optional(),
  instructorId: z.string().trim().optional(),
});

const optionalDate = (v?: string) => (v ? new Date(`${v}T12:00:00`) : null);
const optionalInt = (v?: string) => (v && Number.isFinite(Number(v)) ? Number(v) : null);

/** Araç oluşturma/güncelleme. Plaka kurs içinde benzersizdir (schema'da @@unique). */
export async function vehicleFormAction(_prev: VehicleFormState, formData: FormData): Promise<VehicleFormState> {
  const user = await requirePermission("vehicle.write");
  const raw = Object.fromEntries(formData);
  const values = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v ?? "")]));

  const parsed = VehicleSchema.safeParse(raw);
  if (!parsed.success) return { values, error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const nextServiceKm = optionalInt(v.nextServiceKm);
  if (nextServiceKm !== null && nextServiceKm < v.km) {
    return { values, error: "Sonraki bakım kilometresi güncel kilometreden küçük olamaz." };
  }

  const vehicleId = String(raw.vehicleId ?? "") || undefined;
  // Plaka çakışması: aynı kursta iki araç aynı plakayı taşıyamaz.
  const clash = await prisma.vehicle.findFirst({
    where: { schoolId: user.schoolId, plate: v.plate, ...(vehicleId ? { id: { not: vehicleId } } : {}) },
  });
  if (clash) return { values, error: `${v.plate} plakası zaten kayıtlı.` };

  const data = {
    plate: v.plate, brand: v.brand || null, model: v.model || null, year: optionalInt(v.year),
    licenseClass: v.licenseClass, usage: v.usage, status: v.status, km: v.km,
    nextServiceKm, fuelType: v.fuelType || null,
    inspectionUntil: optionalDate(v.inspectionUntil), insuranceUntil: optionalDate(v.insuranceUntil),
    instructorId: v.instructorId || null,
  };

  if (vehicleId) {
    const existing = await prisma.vehicle.findFirst({ where: { id: vehicleId, schoolId: user.schoolId } });
    if (!existing) return { values, error: "Araç bulunamadı." };
    await prisma.vehicle.update({ where: { id: vehicleId }, data });
    await audit({ schoolId: user.schoolId, actorId: user.id, action: "vehicle.update", target: vehicleId });
    revalidatePath("/app/araclar");
    redirect(`/app/araclar/${vehicleId}?guncellendi=1`);
  }

  const created = await prisma.vehicle.create({ data: { schoolId: user.schoolId, ...data } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "vehicle.create", target: created.id });
  revalidatePath("/app/araclar");
  redirect(`/app/araclar/${created.id}?olusturuldu=1`);
}

const CostSchema = z.object({
  vehicleId: z.string().min(1),
  type: z.enum(["FUEL", "SERVICE", "TIRE", "INSURANCE", "INSPECTION", "REPAIR", "OTHER"]),
  amount: z.coerce.number().positive("Tutar sıfırdan büyük olmalı."),
  km: z.string().trim().optional(),
  note: z.string().trim().optional(),
  occurredAt: z.string().min(1, "Tarih seçin."),
  updateKm: z.string().optional(),
  nextServiceKm: z.string().trim().optional(),
});

/**
 * Araca gider kaydı ekler. Girilen kilometre aracın güncel kilometresinden büyükse
 * (ve "aracın kilometresini güncelle" işaretliyse) araç kilometresi de ilerletilir —
 * yakıt/bakım fişi girerken km bilgisi zaten elde olduğu için ayrı bir adım olmasın diye.
 */
export async function addVehicleCostAction(_prev: CostFormState, formData: FormData): Promise<CostFormState> {
  const user = await requirePermission("vehicle.write");
  const parsed = CostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Alanları kontrol edin." };
  const v = parsed.data;

  const vehicle = await prisma.vehicle.findFirst({ where: { id: v.vehicleId, schoolId: user.schoolId } });
  if (!vehicle) return { error: "Araç bulunamadı." };

  const km = optionalInt(v.km);
  const nextServiceKm = optionalInt(v.nextServiceKm);
  // Tutar TL olarak girilir, kuruş olarak saklanır.
  const amount = Math.round(v.amount * 100);

  await prisma.$transaction([
    prisma.vehicleCost.create({
      data: {
        schoolId: user.schoolId, vehicleId: v.vehicleId, type: v.type, amount, km,
        note: v.note || null, occurredAt: new Date(`${v.occurredAt}T12:00:00`),
      },
    }),
    ...(v.updateKm === "1" && km !== null && km > vehicle.km
      ? [prisma.vehicle.update({ where: { id: v.vehicleId }, data: { km } })]
      : []),
    ...(nextServiceKm !== null
      ? [prisma.vehicle.update({ where: { id: v.vehicleId }, data: { nextServiceKm } })]
      : []),
  ]);

  await audit({ schoolId: user.schoolId, actorId: user.id, action: "vehicle.cost", target: v.vehicleId, meta: { type: v.type, amount } });
  revalidatePath(`/app/araclar/${v.vehicleId}`);
  revalidatePath("/app/araclar");
  redirect(`/app/araclar/${v.vehicleId}?gider=1`);
}

/** Aracı bakıma alır ya da bakımdan çıkarır. Bakımdaki araç derse atanamaz
 *  (uygunluk kontrolü lib/availability.ts içinde bunu zaten reddediyor). */
export async function toggleMaintenanceAction(formData: FormData) {
  const user = await requirePermission("vehicle.write");
  const id = String(formData.get("vehicleId") ?? "");
  const vehicle = await prisma.vehicle.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!vehicle) redirect("/app/araclar?hata=bulunamadi");

  const next = vehicle.status === "MAINTENANCE" ? "ACTIVE" : "MAINTENANCE";
  await prisma.vehicle.update({ where: { id }, data: { status: next } });
  await audit({ schoolId: user.schoolId, actorId: user.id, action: next === "MAINTENANCE" ? "vehicle.maintenance_in" : "vehicle.maintenance_out", target: id });

  // Bakıma alınan aracın gelecekteki planlı dersleri çakışma listesine düşer; kullanıcı
  // takvimden taşımalı. Sayı, uyarı olarak detay sayfasında gösterilir.
  const affected = await prisma.drivingLesson.count({
    where: { schoolId: user.schoolId, vehicleId: id, startsAt: { gte: new Date() }, status: { in: ["PLANNED", "LIVE"] } },
  });

  revalidatePath("/app/araclar");
  revalidatePath("/app/takvim");
  redirect(`/app/araclar/${id}?bakim=${next === "MAINTENANCE" ? "girdi" : "cikti"}&etkilenen=${affected}`);
}
