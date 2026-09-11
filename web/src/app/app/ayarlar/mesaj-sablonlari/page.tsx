import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { toggleMessageTemplateActiveAction } from "@/app/actions/message-templates";
import { Notice } from "@/components/ui";
import { Icon } from "@/components/icons";
import { listMessageTemplateRules } from "@/lib/message-templates";

export const metadata: Metadata = { title: "Mesaj şablonları · Ayarlar" };

export default async function MessageTemplatesPage({ searchParams }: PageProps<"/app/ayarlar/mesaj-sablonlari">) {
  const user = await requirePermission("settings.write");
  const sp = await searchParams;
  const rules = await listMessageTemplateRules(user.schoolId);

  return (
    <>
      {sp.sablon === "eklendi" && <Notice kind="success">Şablon eklendi.</Notice>}
      {sp.sablon === "guncellendi" && <Notice kind="success">Şablon güncellendi.</Notice>}
      {sp.sablon === "aktif" && <Notice kind="success">Şablon etkinleştirildi.</Notice>}
      {sp.sablon === "pasif" && <Notice kind="info">Şablon pasife alındı; konuşma ekranında artık görünmeyecek.</Notice>}

      <div className="card p-5 flex items-start gap-3">
        <span className="w-[34px] h-[34px] rounded-md bg-blue-050 text-blue flex items-center justify-center shrink-0"><Icon name="message" size={18} /></span>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="h-card">Mesaj şablonları</span>
          <span className="text-[13px] text-text-2 leading-relaxed max-w-[620px]">
            Mesajlar ekranında konuşma sırasında tek tıkla kullanılan hazır metinler. Kendi
            dilinizde yeni bir şablon ekleyebilir, mevcutları düzenleyebilir ya da pasife
            alabilirsiniz — hiçbir zaman silinmez.
          </span>
        </div>
      </div>

      <div className="card">
        <header className="flex items-center gap-2.5 px-5 pt-5 pb-1">
          <h2 className="h-card">Şablonlar</h2>
          <Link href="/app/ayarlar/mesaj-sablonlari/yeni" className="ml-auto btn btn-secondary btn-xs"><Icon name="plus" size={14} />Şablon ekle</Link>
        </header>
        <div className="px-5 pb-5 pt-3">
          {rules.length === 0 ? (
            <p className="text-[13px] text-text-2 py-4">Henüz şablon tanımlanmadı.</p>
          ) : rules.map((r) => (
            <div key={r.id} className="flex items-start gap-3 py-3 border-t border-border first:border-0">
              <Icon name="file" size={16} className="text-muted shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-[13px] font-semibold truncate">{r.label}{!r.isActive && <span className="text-muted font-normal"> · pasif</span>}</span>
                <span className="text-xs text-muted leading-relaxed line-clamp-2">{r.body}</span>
              </div>
              <span className="flex items-center gap-1 shrink-0">
                <Link href={`/app/ayarlar/mesaj-sablonlari/${r.id}`} className="btn btn-ghost btn-xs" aria-label="Düzenle"><Icon name="edit" size={14} /></Link>
                <form action={toggleMessageTemplateActiveAction}>
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
