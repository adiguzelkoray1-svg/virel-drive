import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { toggleDocumentTypeActiveAction } from "@/app/actions/document-types";
import { Notice } from "@/components/ui";
import { Icon } from "@/components/icons";
import { listDocumentTypeRules } from "@/lib/document-types";

export const metadata: Metadata = { title: "Belge kuralları · Ayarlar" };

export default async function DocumentTypesPage({ searchParams }: PageProps<"/app/ayarlar/belgeler">) {
  const user = await requirePermission("settings.write");
  const sp = await searchParams;
  const rules = await listDocumentTypeRules(user.schoolId);

  return (
    <>
      {sp.belge === "eklendi" && <Notice kind="success">Belge türü eklendi.</Notice>}
      {sp.belge === "guncellendi" && <Notice kind="success">Belge türü güncellendi.</Notice>}
      {sp.belge === "aktif" && <Notice kind="success">Belge türü etkinleştirildi.</Notice>}
      {sp.belge === "pasif" && <Notice kind="info">Belge türü pasife alındı; yeni kursiyer kaydında artık istenmeyecek.</Notice>}

      <div className="card p-5 flex items-start gap-3">
        <span className="w-[34px] h-[34px] rounded-md bg-blue-050 text-blue flex items-center justify-center shrink-0"><Icon name="folder" size={18} /></span>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="h-card">Belge kuralları</span>
          <span className="text-[13px] text-text-2 leading-relaxed max-w-[620px]">
            Her yeni kursiyer kaydında otomatik açılacak belge türlerini buradan yönetin. Yedi
            standart belge yasal gerekliliktir; kursunuza özel bir belge eklemek isterseniz
            (ör. askerlik durum belgesi) alttan ekleyebilirsiniz. Bir tür hiçbir zaman silinmez,
            yalnızca pasife alınır — mevcut kursiyerlerin o belgesi kaybolmaz.
          </span>
        </div>
      </div>

      <div className="card">
        <header className="flex items-center gap-2.5 px-5 pt-5 pb-1">
          <h2 className="h-card">Belge türleri</h2>
          <Link href="/app/ayarlar/belgeler/yeni" className="ml-auto btn btn-secondary btn-xs"><Icon name="plus" size={14} />Belge türü ekle</Link>
        </header>
        <div className="px-5 pb-5 pt-3">
          {rules.length === 0 ? (
            <p className="text-[13px] text-text-2 py-4">Henüz belge türü tanımlanmadı.</p>
          ) : rules.map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-3 border-t border-border first:border-0">
              <Icon name="file" size={16} className="text-muted shrink-0" />
              <span className="text-[13px] font-semibold min-w-0 truncate">{r.label}{!r.isActive && <span className="text-muted font-normal"> · pasif</span>}</span>
              <span className="ml-auto text-xs text-muted shrink-0">{r.validityMonths ? `${r.validityMonths} ay geçerli` : "Süresiz"}</span>
              <span className="flex items-center gap-1 shrink-0">
                <Link href={`/app/ayarlar/belgeler/${r.id}`} className="btn btn-ghost btn-xs" aria-label="Düzenle"><Icon name="edit" size={14} /></Link>
                <form action={toggleDocumentTypeActiveAction}>
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
    </>
  );
}
