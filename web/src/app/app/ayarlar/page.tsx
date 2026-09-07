import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { toggleLicenseClassActiveAction } from "@/app/actions/settings";
import { Badge, Notice, PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { getRegulation } from "@/lib/regulation";
import { listLicenseClassRules, lastSettingsUpdate } from "@/lib/settings";
import { dateLong } from "@/lib/format";
import { RegulationForm } from "./RegulationForm";

export const metadata: Metadata = { title: "Ayarlar" };

/** Yalnızca görsel bağlam için: gerçek bir alt sayfası olmayan kategoriler "yakında"
 *  etiketiyle gösterilir, tıklanamaz bağlantı olarak sunulmaz. */
const OTHER_SECTIONS = [
  { icon: "building", label: "Kurs profili" },
  { icon: "users", label: "Kullanıcılar ve roller" },
  { icon: "folder", label: "Belge kuralları" },
  { icon: "wallet", label: "Fiyat ve ödeme" },
  { icon: "message", label: "Mesaj şablonları" },
  { icon: "link", label: "Entegrasyonlar" },
  { icon: "lock", label: "Güvenlik ve KVKK" },
  { icon: "list", label: "Denetim kaydı" },
] as const;

export default async function SettingsPage({ searchParams }: PageProps<"/app/ayarlar">) {
  const user = await requirePermission("settings.write");
  const sp = await searchParams;

  const [reg, rules, lastUpdate] = await Promise.all([
    getRegulation(user.schoolId),
    listLicenseClassRules(user.schoolId),
    lastSettingsUpdate(user.schoolId),
  ]);

  return (
    <>
      <PageHeader title="Ayarlar" sub="Kurs, mevzuat, kullanıcı ve entegrasyon ayarları" />

      {sp.sinif === "eklendi" && <Notice kind="success">Sınıf eklendi.</Notice>}
      {sp.sinif === "guncellendi" && <Notice kind="success">Sınıf güncellendi.</Notice>}
      {sp.sinif === "aktif" && <Notice kind="success">Sınıf etkinleştirildi.</Notice>}
      {sp.sinif === "pasif" && <Notice kind="info">Sınıf pasife alındı; yeni kayıtlarda seçilemez.</Notice>}

      <div className="grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)] gap-5 items-start">
        <div className="card p-3.5 flex flex-col gap-1">
          <div className="flex items-center gap-2.5 h-[38px] px-3 rounded-md bg-blue-050 text-text font-semibold text-[13.5px]">
            <Icon name="shield" size={17} className="text-blue" />Mevzuat ve kurs ayarları
          </div>
          {OTHER_SECTIONS.map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 h-[38px] px-3 rounded-md text-[13.5px] text-muted">
              <Icon name={s.icon} size={17} className="text-muted" />
              <span className="grow">{s.label}</span>
              <span className="text-[11px] text-muted bg-surface-2 rounded-full px-1.5 py-0.5">Yakında</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5 min-w-0">
          <div className="card p-5 flex items-start gap-3">
            <span className="w-[34px] h-[34px] rounded-md bg-blue-050 text-blue flex items-center justify-center shrink-0"><Icon name="shield" size={18} /></span>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="h-card">Mevzuat ve kurs ayarları</span>
              <span className="text-[13px] text-text-2 leading-relaxed max-w-[620px]">
                Ders süreleri, sınav hakları, sertifika sınıfları ve eğitim kuralları burada tanımlanır.
                Mevzuat değiştiğinde yalnızca bu ekran güncellenir; sistem genelinde tüm kontroller bu değerleri kullanır.
              </span>
            </div>
            <span className="ml-auto shrink-0"><Badge kind="neutral">{lastUpdate ? `Son güncelleme: ${dateLong(lastUpdate)}` : "Henüz güncellenmedi"}</Badge></span>
          </div>

          <div className="card">
            <header className="flex items-center gap-2.5 px-5 pt-5 pb-1">
              <h2 className="h-card">Sertifika sınıfları ve eğitim kuralları</h2>
              <Link href="/app/ayarlar/sinif/yeni" className="ml-auto btn btn-secondary btn-xs"><Icon name="plus" size={14} />Sınıf ekle</Link>
            </header>
            <div className="px-5 pb-5 pt-3 overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid gap-3 pb-2" style={{ gridTemplateColumns: "70px 1fr 150px 130px 110px 110px 88px" }}>
                  {["Sınıf", "Araç türü", "Direksiyon eğitimi", "Teorik ders", "Sınav hakkı", "Başarı barajı", ""].map((h) => (
                    <div key={h} className="th">{h}</div>
                  ))}
                </div>
                {rules.length === 0 ? (
                  <p className="text-[13px] text-text-2 py-4">Henüz sertifika sınıfı tanımlanmadı.</p>
                ) : rules.map((r) => (
                  <div key={r.id} className="grid gap-3 items-center py-3 border-t border-border" style={{ gridTemplateColumns: "70px 1fr 150px 130px 110px 110px 88px" }}>
                    <span><Badge kind={r.isActive ? "brand" : "neutral"}>{r.code}</Badge></span>
                    <span className="text-[13px] text-text-2">{r.vehicleKind}{!r.isActive && <span className="text-muted"> · pasif</span>}</span>
                    <span className="text-[13px] tabular">{r.drivingHours} saat</span>
                    <span className="text-[13px] tabular">{r.theoryLessons} ders</span>
                    <span className="text-[13px] tabular">{r.examAttempts} hak</span>
                    <span className="text-[13px] tabular">{r.passScore} puan</span>
                    <span className="flex items-center justify-end gap-1">
                      <Link href={`/app/ayarlar/sinif/${r.id}`} className="btn btn-ghost btn-xs" aria-label="Düzenle"><Icon name="edit" size={14} /></Link>
                      <form action={toggleLicenseClassActiveAction}>
                        <input type="hidden" name="ruleId" value={r.id} />
                        <button className="btn btn-ghost btn-xs" aria-label={r.isActive ? "Pasife al" : "Etkinleştir"} title={r.isActive ? "Pasife al" : "Etkinleştir"}>
                          <Icon name={r.isActive ? "x-circle" : "check-circle"} size={14} />
                        </button>
                      </form>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <RegulationForm values={reg} />

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
        </div>
      </div>
    </>
  );
}
