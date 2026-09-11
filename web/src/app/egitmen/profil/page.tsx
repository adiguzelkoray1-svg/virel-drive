import type { Metadata } from "next";
import { requireInstructorUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { PersonAvatar } from "@/components/ui";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { INSTRUCTOR_BRANCH_LABEL } from "@/lib/constants";

export const metadata: Metadata = { title: "Profil" };

export default async function InstructorProfilePage() {
  const { user, instructor } = await requireInstructorUser();
  const school = await prisma.school.findUnique({ where: { id: instructor.schoolId } });

  return (
    <div className="px-4 pt-[max(20px,env(safe-area-inset-top))] pb-4 flex flex-col gap-3">
      <h1 className="font-display text-[22px] font-bold">Profil</h1>

      <div className="card p-4 flex items-center gap-3.5">
        <PersonAvatar name={user.name} size={48} />
        <div className="flex flex-col min-w-0">
          <span className="text-[15px] font-bold truncate">{user.name}</span>
          <span className="text-[13px] text-muted">{school?.name}</span>
        </div>
      </div>

      <div className="card p-4 flex flex-col gap-3.5">
        <Row label="E-posta" value={user.email} />
        <Row label="Telefon" value={instructor.phone ?? "—"} />
        <Row label="Branş" value={INSTRUCTOR_BRANCH_LABEL[instructor.branch] ?? instructor.branch} />
        <Row label="Ehliyet sınıfları" value={instructor.licenseClasses} />
        <Row label="Haftalık kapasite" value={`${instructor.weeklyCapacity} saat`} />
      </div>

      <div className="card p-4 flex flex-col gap-3.5">
        <span className="text-[13px] font-bold">Şifre değiştir</span>
        <ChangePasswordForm />
      </div>

      <a href="/app" className="btn btn-secondary w-full justify-center"><Icon name="grid" size={16} />Masaüstü görünüme geç</a>
      <form action="/api/auth/cikis" method="post">
        <button className="btn btn-ghost w-full justify-center"><Icon name="logout" size={16} />Çıkış yap</button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border-t border-border pt-3.5 first:border-0 first:pt-0">
      <span className="text-[13px] text-text-2">{label}</span>
      <span className="ml-auto text-[13px] font-semibold text-right">{value}</span>
    </div>
  );
}
