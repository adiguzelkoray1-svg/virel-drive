import type { Metadata } from "next";
import { requireStudentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { PersonAvatar } from "@/components/ui";
import { STAGE_LABEL, type StudentStage } from "@/lib/constants";
import { date, fullName, maskPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Profil" };

export default async function StudentProfilePage() {
  const { user, student: s } = await requireStudentUser();
  const school = await prisma.school.findUnique({ where: { id: s.schoolId } });
  const name = fullName(s);

  return (
    <div className="px-4 pt-[max(20px,env(safe-area-inset-top))] pb-4 flex flex-col gap-3">
      <h1 className="font-display text-[22px] font-bold">Profil</h1>

      <div className="card p-4 flex items-center gap-3.5">
        <PersonAvatar name={name} size={48} />
        <div className="flex flex-col min-w-0">
          <span className="text-[15px] font-bold truncate">{name}</span>
          <span className="text-[13px] text-muted">{school?.name}</span>
        </div>
      </div>

      <div className="card p-4 flex flex-col gap-3.5">
        <Row label="E-posta" value={user.email} />
        <Row label="Telefon" value={maskPhone(s.phone)} />
        <Row label="Ehliyet sınıfı" value={`${s.licenseClass} sınıfı`} />
        <Row label="Süreç aşaması" value={STAGE_LABEL[s.stage as StudentStage] ?? s.stage} />
        <Row label="Kayıt tarihi" value={date(s.registeredAt)} />
        {s.fileNo && <Row label="Dosya no" value={s.fileNo} />}
      </div>

      <form action="/api/auth/cikis" method="post">
        <button className="btn btn-secondary w-full justify-center"><Icon name="logout" size={16} />Çıkış yap</button>
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
