import Link from "next/link";
import type { Metadata } from "next";
import { adminOverview, listSchools } from "@/lib/admin";
import { Badge, Card, Chip, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { SCHOOL_PLAN_LABEL, SCHOOL_STATUS_LABEL } from "@/lib/constants";
import { date, number } from "@/lib/format";

export const metadata: Metadata = { title: "Süper Admin" };

const STATUS_FILTERS = [
  { key: "tumu", label: "Tümü" }, { key: "PENDING", label: "Onay bekliyor" }, { key: "TRIAL", label: "Deneme" },
  { key: "ACTIVE", label: "Aktif" }, { key: "PAST_DUE", label: "Ödeme gecikti" }, { key: "SUSPENDED", label: "Askıya alındı" },
] as const;

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const status = typeof sp.durum === "string" ? sp.durum : "tumu";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const [overview, schools] = await Promise.all([adminOverview(), listSchools({ status, q })]);

  return (
    <>
      <PageHeader title="Kurslar" sub="Virel Drive'a kayıtlı tüm sürücü kursları">
        <Link href="/admin/kurslar/yeni" className="btn btn-primary btn-sm"><Icon name="plus" size={15} />Yeni kurs ekle</Link>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Stat label="Toplam kurs" value={number(overview.schools)} sub="tüm durumlar" />
        <Stat label="Aktif" value={number(overview.active)} sub="ücretli/onaylı" tone="text-success" />
        <Stat label="Deneme sürümü" value={number(overview.trial)} sub={overview.trialsEndingSoon ? `${overview.trialsEndingSoon} tanesi 7 gün içinde bitiyor` : "hiçbiri yakında bitmiyor"} tone={overview.trialsEndingSoon ? "text-warning" : undefined} />
        <Stat label="Onay bekliyor" value={number(overview.pending)} sub="yeni kayıt" tone={overview.pending ? "text-warning" : undefined} />
        <Stat label="Askıda / gecikmiş" value={number(overview.suspended)} sub="ödeme ya da ihlal" tone={overview.suspended ? "text-danger" : undefined} />
        <Stat label="Sistem geneli" value={number(overview.users)} sub={`kullanıcı · ${number(overview.students)} kursiyer`} />
      </div>

      <Card>
        <header className="flex items-center gap-3 px-5 pt-5 pb-3 flex-wrap">
          <h2 className="h-card">Kurslar</h2>
          <form className="flex items-center gap-2 ml-auto">
            {status !== "tumu" && <input type="hidden" name="durum" value={status} />}
            <input name="q" defaultValue={q} placeholder="Kurs adı, alan adı ya da şehir…" className="input h-8 text-[13px] w-[240px]" aria-label="Kurs ara" />
            <button className="btn btn-secondary btn-xs">Ara</button>
          </form>
        </header>
        <div className="flex items-center gap-2 px-5 pb-3 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <Chip key={f.key} active={status === f.key} href={`/admin?durum=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>{f.label}</Chip>
          ))}
        </div>

        {schools.length === 0 ? (
          <EmptyState icon="building" title="Kurs bulunamadı." desc="Aramayı ya da süzgeci değiştirin." />
        ) : (
          <div className="px-5 pb-5 overflow-x-auto">
            <div className="min-w-[880px]">
              <div className="grid gap-3 pb-2" style={{ gridTemplateColumns: "minmax(180px,1fr) 120px 130px 130px 150px 130px 16px" }}>
                {["Kurs", "Plan", "Kullanıcı", "Kursiyer", "Kayıt tarihi", "Durum", ""].map((h) => <div key={h} className="th">{h}</div>)}
              </div>
              {schools.map((s) => {
                const st = SCHOOL_STATUS_LABEL[s.status] ?? SCHOOL_STATUS_LABEL.PENDING;
                const userPct = s.userLimit ? Math.min(100, Math.round((s._count.users / s.userLimit) * 100)) : 0;
                const studentPct = s.studentLimit ? Math.min(100, Math.round((s._count.students / s.studentLimit) * 100)) : 0;
                return (
                  <Link key={s.id} href={`/admin/kurslar/${s.id}`} className="grid gap-3 items-center py-3 border-t border-border" style={{ gridTemplateColumns: "minmax(180px,1fr) 120px 130px 130px 150px 130px 16px" }}>
                    <span className="flex flex-col min-w-0">
                      <span className="text-[13.5px] font-semibold truncate">{s.name}</span>
                      <span className="text-xs text-muted truncate">{[s.district, s.city].filter(Boolean).join(", ") || s.slug}</span>
                    </span>
                    <span><Badge kind="brand">{SCHOOL_PLAN_LABEL[s.plan] ?? s.plan}</Badge></span>
                    <span className="flex flex-col gap-1">
                      <span className="text-[13px] tabular">{s._count.users}/{s.userLimit}</span>
                      <ProgressBar value={userPct} height={4} />
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="text-[13px] tabular">{s._count.students}/{s.studentLimit}</span>
                      <ProgressBar value={studentPct} height={4} />
                    </span>
                    <span className="text-[13px] text-text-2 tabular">{date(s.createdAt)}</span>
                    <span><Badge kind={st.kind} dot>{st.label}</Badge></span>
                    <span className="text-muted"><Icon name="chev-right" size={16} /></span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className="card p-[18px] flex flex-col gap-1">
      <span className="stat-lbl">{label}</span>
      <span className={`kpi mt-1.5 ${tone ?? ""}`}>{value}</span>
      <span className="text-xs text-muted">{sub}</span>
    </div>
  );
}
