// Kurs ödeme sayfası: süper adminin oluşturduğu bir ödeme linkine tıklayan kurs sahibi,
// giriş yapmadan Virel'in PayTR hesabına planının bedelini öder (bkz. app/actions/payment-links.ts).
// Genel (public) bir sayfa — link zaten cuid kadar tahmin edilemez, ayrıca bir token katmanına gerek yok.
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import VirelLogo from "@/components/VirelLogo";
import { Icon } from "@/components/icons";
import { getPaymentLinkForCheckout } from "@/lib/payment-link";
import { paytrGetToken, paytrIframeUrl, paytrMerchantOid, platformPaytr } from "@/lib/providers/paytr";
import { SCHOOL_PLAN_LABEL } from "@/lib/constants";
import { money } from "@/lib/format";
import { PaytrFrame } from "@/components/PaytrFrame";

export const metadata = { title: "Lisans Ödemesi" };
export const dynamic = "force-dynamic";

export default async function LicensePaymentPage({ params }: PageProps<"/odeme/lisans/[id]">) {
  const { id } = await params;
  const link = await getPaymentLinkForCheckout(id);
  if (!link) notFound();

  if (link.status === "PAID") {
    return (
      <CenteredCard>
        <div className="p-8 text-center flex flex-col items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-success-bg text-success flex items-center justify-center"><Icon name="check-circle" size={24} /></span>
          <h1 className="font-display text-lg font-bold">Bu ödeme tamamlandı</h1>
          <p className="text-[13px] text-text-2">{link.school.name} için {SCHOOL_PLAN_LABEL[link.plan] ?? link.plan} planı ödemesi daha önce alındı.</p>
        </div>
      </CenteredCard>
    );
  }
  if (link.status === "CANCELLED") {
    return (
      <CenteredCard>
        <div className="p-8 text-center flex flex-col items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center"><Icon name="alert" size={24} /></span>
          <h1 className="font-display text-lg font-bold">Bu ödeme linki iptal edildi</h1>
          <p className="text-[13px] text-text-2">Güncel bir link için bizimle iletişime geçin.</p>
        </div>
      </CenteredCard>
    );
  }

  const cfg = platformPaytr();
  if (!cfg) {
    return (
      <CenteredCard>
        <div className="p-8 text-center flex flex-col items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-blue-050 text-blue flex items-center justify-center"><Icon name="info" size={24} /></span>
          <h1 className="font-display text-lg font-bold">Online ödeme şu an açık değil</h1>
          <p className="text-[13px] text-text-2">{link.school.name} için {SCHOOL_PLAN_LABEL[link.plan] ?? link.plan} planı — {money(link.amountKurus)}. Ödemeyi tamamlamak için bizimle iletişime geçin.</p>
        </div>
      </CenteredCard>
    );
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "85.34.78.112";
  const base = (process.env.APP_URL ?? "").replace(/\/$/, "");
  const merchantOid = paytrMerchantOid("DRV", link.id);
  const r = await paytrGetToken(cfg, {
    merchantOid, userIp: ip, email: link.school.email || "fatura@virel.com.tr", amountKurus: link.amountKurus,
    basketName: `Virel Drive · ${SCHOOL_PLAN_LABEL[link.plan] ?? link.plan} lisansı`, userName: link.school.name,
    userAddress: link.school.address ?? undefined, userPhone: link.school.phone ?? undefined, maxInstallment: 12,
    okUrl: `${base}/odeme/lisans/${link.id}?durum=islemde`, failUrl: `${base}/odeme/lisans/${link.id}?durum=basarisiz`,
  });

  return (
    <CenteredCard>
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <span className="w-10 h-10 rounded-[10px] bg-blue-050 text-blue-700 flex items-center justify-center"><Icon name="lock" size={18} /></span>
        <span className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-bold">Virel Drive lisans ödemesi</span>
          <span className="text-xs text-text-2 truncate">{link.school.name} · {SCHOOL_PLAN_LABEL[link.plan] ?? link.plan}{link.description ? ` · ${link.description}` : ""}</span>
        </span>
        <span className="font-display text-xl font-bold tabular">{money(link.amountKurus)}</span>
      </div>
      {r.status === "success" && r.token ? (
        <PaytrFrame src={paytrIframeUrl(r.token)} />
      ) : (
        <div className="p-6 text-center text-[13px] text-text-2">
          <span className="block text-sm font-semibold text-danger mb-1">Ödeme sayfası açılamadı</span>
          {r.reason ?? "PayTR yanıt vermedi"}. Lütfen bizimle iletişime geçin.
        </div>
      )}
    </CenteredCard>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center px-4 py-8 gap-6">
      <div className="flex items-baseline gap-2"><VirelLogo size={100} /><span className="font-display text-[15px] font-semibold text-text-2">drive</span></div>
      <div className="card w-full max-w-[640px] overflow-hidden">{children}</div>
    </div>
  );
}
