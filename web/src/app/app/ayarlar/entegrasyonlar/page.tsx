import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { IntegrationsForm } from "./IntegrationsForm";

export const metadata: Metadata = { title: "Entegrasyonlar · Ayarlar" };

export default async function IntegrationsPage() {
  const user = await requirePermission("settings.write");
  const school = await prisma.school.findUniqueOrThrow({
    where: { id: user.schoolId },
    select: { netgsmUsername: true, netgsmPassword: true, netgsmHeader: true },
  });

  return (
    <>
      <div className="card p-5 flex items-start gap-3">
        <span className="w-[34px] h-[34px] rounded-md bg-blue-050 text-blue flex items-center justify-center shrink-0"><Icon name="link" size={18} /></span>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="h-card">Entegrasyonlar</span>
          <span className="text-[13px] text-text-2 leading-relaxed max-w-[620px]">
            SMS göndermek için kendi NetGSM hesabınızı bağlayın. Bu bilgiler yalnızca kursunuza aittir;
            Virel Drive&apos;ın paylaşılan bir SMS hesabı yoktur — her kurs SMS&apos;lerini kendi NetGSM hesabından gönderir.
          </span>
        </div>
      </div>

      <IntegrationsForm values={school} />

      <div className="card p-5 flex items-start gap-3">
        <Icon name="info" size={17} className="text-muted shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Resmî sistem entegrasyonları</span>
          <span className="text-[13px] text-text-2 leading-relaxed max-w-[680px]">
            MEBBİS / Özel MTSK modülüne bağlantı yalnızca resmî ve izin verilen bir API bulunduğunda kurulur.
            Böyle bir API bu sürümde yok; Virel Drive sahte bir entegrasyon göstermez — veri aktarımı
            manuel giriş ve resmî çıktıların elle işlenmesiyle yapılır.
          </span>
        </div>
      </div>
    </>
  );
}
