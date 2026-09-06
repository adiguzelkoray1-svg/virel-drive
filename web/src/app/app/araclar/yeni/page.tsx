import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import { VehicleForm } from "../VehicleForm";

export const metadata: Metadata = { title: "Araç ekle" };

const isoDate = (d: Date | null) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "");

export default async function NewVehiclePage({ searchParams }: PageProps<"/app/araclar/yeni">) {
  const user = await requirePermission("vehicle.write");
  const schoolId = user.schoolId;
  const sp = await searchParams;
  const editId = typeof sp.duzenle === "string" ? sp.duzenle : undefined;

  const [rules, instructors, existing] = await Promise.all([
    prisma.licenseClassRule.findMany({ where: { schoolId, isActive: true }, orderBy: { code: "asc" } }),
    prisma.instructor.findMany({ where: { schoolId, branch: "DRIVING", isActive: true }, orderBy: { name: "asc" } }),
    editId ? prisma.vehicle.findFirst({ where: { id: editId, schoolId } }) : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader title={existing ? "Aracı düzenle" : "Araç ekle"} sub="Plaka, sınıf, kullanım, bakım ve eğitmen ataması">
        <Link href="/app/araclar" className="btn btn-secondary btn-sm"><Icon name="car" size={15} />Araçlar</Link>
      </PageHeader>

      <div className="max-w-[860px]">
        <VehicleForm
          vehicleId={existing?.id}
          classOptions={rules.map((r) => r.code)}
          instructors={instructors.map((i) => ({ id: i.id, label: i.name }))}
          submitLabel={existing ? "Değişiklikleri kaydet" : "Aracı ekle"}
          defaults={{
            plate: existing?.plate, brand: existing?.brand ?? undefined, model: existing?.model ?? undefined,
            year: existing?.year, licenseClass: existing?.licenseClass, usage: existing?.usage, status: existing?.status,
            km: existing?.km, nextServiceKm: existing?.nextServiceKm, fuelType: existing?.fuelType ?? undefined,
            inspectionUntil: isoDate(existing?.inspectionUntil ?? null),
            insuranceUntil: isoDate(existing?.insuranceUntil ?? null),
            instructorId: existing?.instructorId ?? undefined,
          }}
        />
      </div>
    </>
  );
}
