import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PersonAvatar } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { date, fullName } from "@/lib/format";

export const metadata: Metadata = { title: "Kursiyer Kimlik Kartı" };

export default async function StudentIdCardPage({ params }: PageProps<"/app/kursiyerler/[id]/kimlik-karti">) {
  const user = await requirePermission("student.read");
  const { id } = await params;

  const student = await prisma.student.findFirst({ where: { id, schoolId: user.schoolId } });
  if (!student) notFound();
  const name = fullName(student);

  return (
    <div className="max-w-[420px] mx-auto">
      <div className="print:hidden mb-4">
        <PrintButton />
      </div>

      <div className="card p-6 flex flex-col items-center gap-3.5 text-center print:shadow-none print:border-2">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide">{user.school.name}</span>
        <h1 className="font-display text-[15px] font-bold">KURSİYER KİMLİK KARTI</h1>

        <PersonAvatar name={name} size={72} />

        <div className="flex flex-col gap-0.5">
          <span className="text-lg font-bold">{name}</span>
          <span className="text-[13px] text-text-2">{student.licenseClass} sınıfı</span>
        </div>

        <div className="w-full grid grid-cols-2 gap-x-4 gap-y-3 pt-3.5 border-t border-border text-left">
          <Field label="Dosya No" value={student.fileNo ?? "—"} />
          <Field label="Kayıt Tarihi" value={date(student.registeredAt)} />
          <Field label="T.C. Kimlik No" value={student.nationalId ?? "—"} />
          <Field label="Telefon" value={student.phone} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted uppercase tracking-wide">{label}</span>
      <span className="text-[13px] font-semibold tabular">{value}</span>
    </div>
  );
}
