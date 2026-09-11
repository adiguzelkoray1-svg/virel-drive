import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateClassPricingAction } from "@/app/actions/settings";
import { Notice } from "@/components/ui";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Fiyat ve ödeme · Ayarlar" };

const NOTICE: Record<string, { kind: "success" | "danger"; text: string }> = {
  guncellendi: { kind: "success", text: "Fiyat ayarları kaydedildi." },
  bulunamadi: { kind: "danger", text: "Sınıf bulunamadı." },
  fiyat: { kind: "danger", text: "Toplam ücret girildiyse sıfırdan büyük olmalı." },
  pesinat: { kind: "danger", text: "Peşinat negatif olamaz." },
  "pesinat-fazla": { kind: "danger", text: "Peşinat toplam ücretten büyük olamaz." },
  taksit: { kind: "danger", text: "Taksit sayısı girildiyse 1-24 arasında olmalı." },
};

export default async function PricingSettingsPage({ searchParams }: PageProps<"/app/ayarlar/fiyatlandirma">) {
  const user = await requirePermission("settings.write");
  const sp = await searchParams;
  const notice = typeof sp.hata === "string" ? NOTICE[sp.hata] : typeof sp.fiyat === "string" ? NOTICE[sp.fiyat] : null;

  const rules = await prisma.licenseClassRule.findMany({
    where: { schoolId: user.schoolId, isActive: true },
    orderBy: { code: "asc" },
  });

  return (
    <>
      {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

      <div className="card p-5 flex items-start gap-3">
        <span className="w-[34px] h-[34px] rounded-md bg-blue-050 text-blue flex items-center justify-center shrink-0"><Icon name="wallet" size={18} /></span>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="h-card">Fiyat ve ödeme</span>
          <span className="text-[13px] text-text-2 leading-relaxed max-w-[620px]">
            Her ehliyet sınıfı için varsayılan toplam ücret, peşinat ve taksit sayısı. Finans
            ekranında yeni bir ödeme planı kurulurken bu değerler otomatik önerilir — kursiyer
            eklerken her seferinde yeniden yazmanıza gerek kalmaz. Boş bırakılan bir alan için
            plan formu, o sınıftaki mevcut planların en sık görülen tutarını önermeye devam eder.
          </span>
        </div>
      </div>

      <div className="card">
        <header className="px-5 pt-5 pb-1">
          <h2 className="h-card">Sınıf başına varsayılanlar</h2>
        </header>
        <div className="px-5 pb-5 pt-3">
          {rules.length === 0 ? (
            <p className="text-[13px] text-text-2 py-4">
              Henüz etkin bir ehliyet sınıfı yok — önce &quot;Mevzuat ve kurs ayarları&quot;ndan bir sınıf ekleyin.
            </p>
          ) : rules.map((r) => (
            <form
              key={r.id} action={updateClassPricingAction}
              className="grid grid-cols-[64px_1fr_1fr_100px_auto] items-end gap-3 py-3.5 border-t border-border first:border-0"
            >
              <input type="hidden" name="ruleId" value={r.id} />
              <span className="text-[13px] font-semibold pb-2.5">{r.code}</span>
              <label className="flex flex-col gap-1.5">
                <span className="label">Toplam ücret (₺)</span>
                <input
                  name="price" type="number" min={0} step="0.01" className="input"
                  defaultValue={r.defaultPrice ? String(r.defaultPrice / 100) : ""} placeholder="Örn. 45000"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="label">Peşinat (₺)</span>
                <input
                  name="downPayment" type="number" min={0} step="0.01" className="input"
                  defaultValue={r.defaultDownPayment ? String(r.defaultDownPayment / 100) : ""} placeholder="Örn. 10000"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="label">Taksit</span>
                <input
                  name="installmentCount" type="number" min={1} max={24} className="input"
                  defaultValue={r.defaultInstallmentCount ?? ""} placeholder="4"
                />
              </label>
              <button className="btn btn-secondary btn-sm"><Icon name="check" size={14} />Kaydet</button>
            </form>
          ))}
        </div>
      </div>
    </>
  );
}
