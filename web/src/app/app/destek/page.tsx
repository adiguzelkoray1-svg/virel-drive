import type { Metadata } from "next";
import { requireSchoolUser } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Destek" };

/** Gerçek bir destek talebi/ticket sistemi bu sürümde yok — Virel Drive'a ulaşmanın
 *  tek yolu bu sayfadaki gerçek iletişim kanalları (e-posta/telefon). Sahte bir
 *  "talep oluştur" formu göstermedim; olmayan bir işleve arkasında hiçbir şey
 *  olmayan bir düğme koymaktansa doğrudan iletişim yolunu sunmayı tercih ettim. */
export default async function SupportPage() {
  await requireSchoolUser();

  return (
    <>
      <PageHeader title="Destek" sub="Virel Drive ekibine ulaşın" />

      <Card>
        <div className="px-5 py-5 flex items-start gap-3.5">
          <span className="w-10 h-10 rounded-md bg-blue-050 text-blue flex items-center justify-center shrink-0"><Icon name="help" size={19} /></span>
          <div className="flex flex-col gap-1.5">
            <span className="h-card">Bir sorunuz mu var?</span>
            <span className="text-[13px] text-text-2 leading-relaxed max-w-[560px]">
              Uygulamayla ilgili bir soru, hata bildirimi ya da özellik talebiniz için doğrudan
              bize ulaşabilirsiniz. Bu sürümde uygulama içi bir destek kutusu yok; e-posta ve
              telefon en hızlı yol.
            </span>
          </div>
        </div>

        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="mailto:destek@virel.com.tr" className="flex items-center gap-3 p-3.5 rounded-sm border border-border hover:bg-surface-2">
            <span className="w-9 h-9 rounded-md bg-surface-2 text-text-2 flex items-center justify-center shrink-0"><Icon name="mail" size={17} /></span>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-semibold">E-posta</span>
              <span className="text-[13px] text-blue truncate">destek@virel.com.tr</span>
            </div>
          </a>
          <a href="tel:+908502400067" className="flex items-center gap-3 p-3.5 rounded-sm border border-border hover:bg-surface-2">
            <span className="w-9 h-9 rounded-md bg-surface-2 text-text-2 flex items-center justify-center shrink-0"><Icon name="phone" size={17} /></span>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-semibold">Telefon</span>
              <span className="text-[13px] text-blue tabular">0850 240 00 67</span>
            </div>
          </a>
        </div>
      </Card>

      <Card title="Sık sorulan sorular">
        <div className="px-5 pb-5 pt-1 flex flex-col">
          <Faq q="Kursiyer ve eğitmen sayım limitimi aştım, ne olur?" a="Yeni kayıt eklenemez; plan ya da limit yükseltmesi için bizimle iletişime geçin." />
          <Faq q="Mevzuat değerlerini (ders süresi, sınav hakkı vb.) nereden değiştiririm?" a="Ayarlar → Mevzuat ve kurs ayarları ekranından; değişiklik anında tüm sisteme yansır." />
          <Faq q="Bir kullanıcının şifresini unuttum, ne yapmalıyım?" a="Bu sürümde uygulama içi şifre sıfırlama yok; bize ulaşırsanız hesabınız için geçici bir şifre oluştururuz." />
        </div>
      </Card>
    </>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="py-3 border-t border-border first:border-0">
      <div className="text-[13.5px] font-semibold">{q}</div>
      <div className="text-[13px] text-text-2 mt-1 leading-relaxed">{a}</div>
    </div>
  );
}
