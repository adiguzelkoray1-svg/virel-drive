import type { Metadata } from "next";
import { requireSchoolUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader, ProgressBar } from "@/components/ui";
import { SCHOOL_PLAN_LABEL, SCHOOL_STATUS_LABEL } from "@/lib/constants";
import { date, number } from "@/lib/format";
import { SchoolProfileForm } from "./SchoolProfileForm";

export const metadata: Metadata = { title: "Kurs Profili" };

export default async function SchoolProfilePage() {
  const user = await requireSchoolUser();
  const canEdit = can(user.role, "settings.write");

  const [school, userCount, studentCount] = await Promise.all([
    prisma.school.findUnique({ where: { id: user.schoolId } }),
    prisma.user.count({ where: { schoolId: user.schoolId } }),
    prisma.student.count({ where: { schoolId: user.schoolId } }),
  ]);
  if (!school) return null;

  const st = SCHOOL_STATUS_LABEL[school.status] ?? SCHOOL_STATUS_LABEL.PENDING;
  const userPct = school.userLimit ? Math.min(100, Math.round((userCount / school.userLimit) * 100)) : 0;
  const studentPct = school.studentLimit ? Math.min(100, Math.round((studentCount / school.studentLimit) * 100)) : 0;

  return (
    <>
      <PageHeader title="Kurs Profili" sub="Kursunuzun temel bilgileri ve abonelik durumu" />

      <Card>
        <div className="px-5 py-4 flex items-center gap-3 flex-wrap">
          <Badge kind={st.kind} dot>{st.label}</Badge>
          <Badge kind="brand">{SCHOOL_PLAN_LABEL[school.plan] ?? school.plan}</Badge>
          {school.trialEndsAt && school.status === "TRIAL" && (
            <span className="text-xs text-muted">Deneme bitişi: {date(school.trialEndsAt)}</span>
          )}
          <span className="ml-auto text-xs text-muted">
            Plan ve limit değişiklikleri yalnızca Virel Drive tarafından yapılır.
          </span>
        </div>
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-text-2">Kullanıcı</span>
              <span className="ml-auto text-[13px] font-semibold tabular">{userCount}/{school.userLimit}</span>
            </div>
            <ProgressBar value={userPct} height={6} />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-text-2">Kursiyer</span>
              <span className="ml-auto text-[13px] font-semibold tabular">{number(studentCount)}/{number(school.studentLimit)}</span>
            </div>
            <ProgressBar value={studentPct} height={6} />
          </div>
        </div>
      </Card>

      {canEdit ? (
        <SchoolProfileForm school={school} />
      ) : (
        <Card title="Kurs bilgileri" sub="değiştirmek için yönetici yetkisi gerekir">
          <div className="px-5 pb-5 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <Field label="Kurs adı" value={school.name} />
            <Field label="Şehir / İlçe" value={[school.district, school.city].filter(Boolean).join(", ") || "—"} />
            <Field label="Telefon" value={school.phone ?? "—"} />
            <Field label="E-posta" value={school.email ?? "—"} />
            <Field label="Adres" value={school.address ?? "—"} />
            <Field label="Vergi no" value={school.taxNumber ?? "—"} />
          </div>
        </Card>
      )}
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="stat-lbl">{label}</div>
      <div className="text-[13px] font-semibold mt-0.5 truncate">{value}</div>
    </div>
  );
}
