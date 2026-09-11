import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Card, PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { messageSummary, threadList } from "@/lib/messages";
import { listMessageTemplateRules } from "@/lib/message-templates";
import { smsConfigured } from "@/lib/sms";
import { prisma } from "@/lib/prisma";
import { number } from "@/lib/format";
import { ThreadList } from "./ThreadList";

export default async function MessagesLayout({ children }: LayoutProps<"/app/mesajlar">) {
  const user = await requirePermission("message.send");
  // Arama istemci tarafında yapılır (bkz. ThreadList) — layout'lar searchParams almaz
  // ve küçük bir thread listesi için sunucu round-trip'i gereksizdir.
  const [threads, summary, school, templates] = await Promise.all([
    threadList(user.schoolId),
    messageSummary(user.schoolId),
    prisma.school.findUniqueOrThrow({ where: { id: user.schoolId }, select: { netgsmUsername: true, netgsmPassword: true, netgsmHeader: true } }),
    listMessageTemplateRules(user.schoolId, { activeOnly: true }),
  ]);

  return (
    <>
      <PageHeader title="Mesajlar" sub="WhatsApp · SMS · e-posta · uygulama bildirimi" />

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_300px] gap-4 items-start">
        <Card className="min-w-0">
          <header className="flex items-center gap-2.5 px-4 pt-4 pb-2.5">
            <h2 className="h-card">Gelen kutusu</h2>
            <span className="ml-auto text-xs text-muted">{threads.length}</span>
          </header>
          <div className="px-2.5 pb-3 max-h-[680px] overflow-y-auto">
            <ThreadList threads={threads} />
          </div>
        </Card>

        <div className="min-w-0">{children}</div>

        <div className="flex flex-col gap-4">
          <Card title="Şablonlar" sub="konuşma ekranında tek tıkla kullanılır">
            <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
              {templates.map((t) => (
                <div key={t.key} className="flex items-center gap-2.5 py-2 border-t border-border first:border-0">
                  <span className="w-7 h-7 rounded-sm bg-blue-050 text-blue flex items-center justify-center shrink-0"><Icon name="file" size={14} /></span>
                  <span className="text-[13px] truncate">{t.label}</span>
                </div>
              ))}
              <p className="text-xs text-muted leading-relaxed pt-2 border-t border-border">
                Bu sürümde otomatik/zamanlanmış gönderim yok; şablonlar yalnızca konuşma ekranında elle kullanılabilir.
              </p>
              {can(user.role, "settings.write") && (
                <Link href="/app/ayarlar/mesaj-sablonlari" className="text-[13px] font-semibold text-blue">Şablonları düzenle →</Link>
              )}
            </div>
          </Card>

          <Card title="Bu ay">
            <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-y-3.5 gap-x-2">
              <Stat label="Gönderilen" value={number(summary.sentThisMonth)} />
              <Stat label="Yanıt oranı" value={`%${summary.responseRate}`} />
              {summary.topChannel && (
                <Stat label="En çok kullanılan" value={`%${summary.topChannel.share}`} sub={summary.topChannel.channel === "WHATSAPP" ? "WhatsApp" : summary.topChannel.channel === "SMS" ? "SMS" : "E-posta"} />
              )}
            </div>
          </Card>

          <Card>
            <div className="px-4 py-4 flex items-start gap-2.5">
              <Icon name="info" size={15} className="text-muted shrink-0 mt-0.5" />
              <p className="text-[13px] text-text-2 leading-relaxed">
                {smsConfigured(school)
                  ? "SMS, kursunuzun NetGSM hesabı üzerinden gerçekten gönderiliyor. WhatsApp ve e-posta henüz bir sağlayıcıya bağlı değil; bu ekran o ikisinin gönderimini kurs içinde simüle eder."
                  : <>WhatsApp ve e-posta gerçek bir sağlayıcıya bağlı değil; bu ekran gönderimi kurs içinde simüle eder. SMS için kendi NetGSM hesabınızı <a href="/app/ayarlar/entegrasyonlar" className="text-blue underline">Ayarlar › Entegrasyonlar</a>&apos;dan bağlayabilirsiniz.</>}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="stat-lbl">{label}</span>
      <span className="text-[19px] font-bold tabular font-display">{value}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  );
}
