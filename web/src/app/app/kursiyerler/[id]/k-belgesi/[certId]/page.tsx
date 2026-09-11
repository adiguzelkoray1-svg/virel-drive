import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getCertificate } from "@/lib/driving-certificate";
import { dateLong, fullName } from "@/lib/format";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "K Sınıfı Sürücü Aday Belgesi" };

export default async function DrivingCertificatePrintPage({ params }: PageProps<"/app/kursiyerler/[id]/k-belgesi/[certId]">) {
  const user = await requirePermission("student.read");
  const { id, certId } = await params;

  const cert = await getCertificate(user.schoolId, certId);
  if (!cert || cert.studentId !== id) notFound();
  const s = cert.student;

  return (
    <div className="max-w-[720px] mx-auto">
      <div className="print:hidden mb-4">
        <PrintButton />
      </div>

      <div className="card p-10 flex flex-col gap-8 print:shadow-none print:border-0">
        <div className="flex flex-col items-center gap-1 text-center border-b border-border pb-6">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">Ek-5</span>
          <h1 className="font-display text-xl font-bold">K SINIFI SÜRÜCÜ ADAY BELGESİ</h1>
          <span className="text-[13px] text-text-2 mt-1">{user.school.name}</span>
          {user.school.address && <span className="text-xs text-muted">{user.school.address}</span>}
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="Adı Soyadı" value={fullName(s)} />
          <Field label="T.C. Kimlik No" value={s.nationalId ?? "—"} />
          <Field label="Sertifika Sınıfı" value={`${s.licenseClass} sınıfı`} />
          <Field label="Dosya No" value={s.fileNo ?? "—"} />
          <Field label="Belge Başlangıç Tarihi" value={dateLong(cert.startedAt)} />
          <Field label="Belge Geçerlilik Sonu" value={dateLong(cert.expiresAt)} />
        </div>

        <p className="text-[13px] text-text-2 leading-relaxed">
          Bu belge, Millî Eğitim Bakanlığı Özel Motorlu Taşıt Sürücüleri Kursu Yönetmeliği
          madde 19 uyarınca, yukarıda kimliği belirtilen sürücü adayının karayollarındaki akan
          trafik içinde direksiyon eğitimi alması ve sınava girebilmesi için kurs müdürlüğünce
          düzenlenmiştir. Belge, düzenlendiği tarihten itibaren 6 (altı) ay süreyle geçerlidir.
        </p>

        <div className="grid grid-cols-2 gap-8 mt-4">
          <SignatureBlock title="Direksiyon Usta Öğreticisi" hint="Ad Soyad / İmza (ders sonunda doldurulur)" />
          <SignatureBlock title="Sınav Uygulama ve Değerlendirme Komisyonu Başkanı" hint="Ad Soyad / İmza (sınavda doldurulur)" />
        </div>

        <div className="flex justify-end pt-2">
          <SignatureBlock title="Kurs Müdürü" hint="Ad Soyad / İmza / Tarih" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted uppercase tracking-wide">{label}</span>
      <span className="text-[14px] font-semibold">{value}</span>
    </div>
  );
}

function SignatureBlock({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col gap-8">
      <span className="text-[13px] font-semibold">{title}</span>
      <div className="border-t border-border pt-1">
        <span className="text-xs text-muted">{hint}</span>
      </div>
    </div>
  );
}
