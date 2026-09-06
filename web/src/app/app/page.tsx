import Link from "next/link";
import type { Metadata } from "next";
import { requireSchoolUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { Badge, Card, PageHeader, ProgressBar } from "@/components/ui";
import { operationalAlerts, todaySchedule, financeSummary, weeklyLessonLoad, startOfDay, endOfDay, addDays } from "@/lib/dashboard";
import { LESSON_STATUS_LABEL } from "@/lib/constants";
import { money, time, dateLong } from "@/lib/format";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Dashboard" };

const greeting = () => {
  const h = new Date().getHours();
  return h < 11 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";
};

export default async function DashboardPage() {
  const user = await requireSchoolUser();
  const schoolId = user.schoolId;
  const showFinance = can(user.role, "finance.read");

  const [activeStudents, today, alerts, upcomingExams, finance, week] = await Promise.all([
    prisma.student.count({ where: { schoolId, status: "ACTIVE" } }),
    todaySchedule(schoolId),
    operationalAlerts(schoolId),
    prisma.exam.count({ where: { schoolId, status: { in: ["PLANNED", "APPLIED"] }, scheduledAt: { gte: startOfDay(), lte: addDays(new Date(), 30) } } }),
    showFinance ? financeSummary(schoolId) : null,
    weeklyLessonLoad(schoolId),
  ]);

  const newThisMonth = await prisma.student.count({
    where: { schoolId, registeredAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
  });
  const doneToday = today.items.filter((i) => i.status === "DONE").length;
  // Uzun günlerde kart taşmasın: ilk 9 ders gösterilir, gerisi takvime bağlanır.
  const visible = today.items.slice(0, 9);
  const hidden = today.items.length - visible.length;

  return (
    <>
      <PageHeader title={`${greeting()}, ${user.name.split(" ")[0]}.`} sub="Kursunuzun bugünkü operasyon özeti.">
        <Link href="/app/kursiyerler/yeni" className="btn btn-secondary btn-sm"><Icon name="users" size={15} />Kursiyer</Link>
        {showFinance && <Link href="/app/finans/tahsilat" className="btn btn-secondary btn-sm"><Icon name="wallet" size={15} />Tahsilat</Link>}
        <Link href="/app/on-kayitlar/yeni" className="btn btn-secondary btn-sm"><Icon name="inbox-in" size={15} />Ön kayıt</Link>
        <Link href="/app/dersler/yeni" className="btn btn-primary btn-sm"><Icon name="plus" size={15} />Direksiyon dersi</Link>
      </PageHeader>

      <div className={`grid gap-4 ${showFinance ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-2 lg:grid-cols-4"}`}>
        <StatCard label="Aktif kursiyer" value={String(activeStudents)} sub={`bu ay +${newThisMonth}`} subTone="success" icon="users" />
        <StatCard label="Bugünkü direksiyon" value={String(today.drivingCount)} sub={`${doneToday} tamamlandı`} icon="wheel" />
        <StatCard label="Bugünkü teorik" value={String(today.theoryCount)} sub="derslik programı" icon="book" />
        <StatCard label="Yaklaşan sınav" value={String(upcomingExams)} sub="30 gün içinde" icon="exam" />
        {finance && <StatCard label="Bekleyen tahsilat" value={money(finance.pending)} sub={`${money(finance.overdue)} gecikmiş`} subTone="danger" icon="wallet" />}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.42fr_1fr] gap-4 items-start">
        <Card>
          <header className="flex items-center gap-3 px-5 pt-5 pb-1 flex-wrap">
            <h2 className="h-card">Bugün</h2>
            <span className="text-xs text-muted">{dateLong(new Date())} · {today.items.length} ders</span>
            <Link href="/app/takvim" className="ml-auto text-[13px] font-semibold text-blue">Takvimi aç →</Link>
          </header>
          <div className="px-5 pb-4">
            {today.items.length === 0 ? (
              <div className="py-10 text-center">
                <p className="h-card">Bugün planlanmış ders yok.</p>
                <p className="text-[13px] text-text-2 mt-1">Takvimden yeni bir direksiyon dersi oluşturabilirsiniz.</p>
                <Link href="/app/dersler/yeni" className="btn btn-secondary btn-sm mt-4"><Icon name="plus" size={15} />İlk dersi planla</Link>
              </div>
            ) : (
              visible.map((it) => {
                const st = LESSON_STATUS_LABEL[it.status] ?? LESSON_STATUS_LABEL.PLANNED;
                return (
                  <Link key={`${it.type}-${it.id}`} href={it.href} className="grid grid-cols-[62px_30px_1fr_auto] gap-3.5 items-center py-3 border-t border-border first:border-t-0">
                    <span className="flex flex-col">
                      <span className="font-display text-[15px] font-semibold tabular">{time(it.startsAt)}</span>
                      <span className="text-xs text-muted tabular">{time(it.endsAt)}</span>
                    </span>
                    <span className={`w-[30px] h-[30px] rounded-sm flex items-center justify-center ${it.type === "theory" ? "bg-success-bg text-success" : "bg-blue-050 text-blue"}`}>
                      <Icon name={it.type === "theory" ? "book" : "wheel"} size={16} />
                    </span>
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-semibold truncate">{it.title}</span>
                      <span className="text-xs text-text-2 truncate">{it.meta}</span>
                    </span>
                    <Badge kind={st.kind} dot>{st.label}</Badge>
                  </Link>
                );
              })
            )}
            {hidden > 0 && (
              <Link href="/app/takvim" className="flex items-center justify-center gap-2 py-3 border-t border-border text-[13px] font-semibold text-blue">
                Diğer {hidden} ders <Icon name="chev-right" size={15} />
              </Link>
            )}
          </div>
        </Card>

        <Card id="dikkat">
          <header className="flex items-center gap-2.5 px-5 pt-5 pb-1">
            <h2 className="h-card">Dikkat gerektirenler</h2>
            {alerts.length > 0 && <Badge kind="danger" dot>{alerts.length}</Badge>}
          </header>
          <div className="px-5 pb-4">
            {alerts.length === 0 ? (
              <div className="py-10 text-center">
                <span className="w-11 h-11 rounded-md bg-success-bg text-success inline-flex items-center justify-center"><Icon name="check-circle" size={22} /></span>
                <p className="h-card mt-3">Bekleyen bir sorun yok.</p>
                <p className="text-[13px] text-text-2 mt-1">Çakışma, gecikmiş ödeme veya eksik evrak bulunmuyor.</p>
              </div>
            ) : (
              alerts.map((a, i) => {
                const tone = a.kind === "danger" ? "bg-danger-bg text-danger" : a.kind === "warning" ? "bg-warning-bg text-warning" : "bg-blue-050 text-blue";
                return (
                  <div key={i} className="flex gap-3 items-start py-3 border-t border-border first:border-t-0">
                    <span className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${tone}`}><Icon name={a.icon} size={15} /></span>
                    <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-[13.5px] font-semibold leading-snug">{a.title}</span>
                      <span className="text-xs text-text-2">{a.detail}</span>
                    </span>
                    <Link href={a.href} className="text-[13px] font-semibold text-blue whitespace-nowrap pt-0.5">{a.action}</Link>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.42fr_1fr] gap-4 items-start">
        <Card>
          <header className="flex items-center gap-2.5 px-5 pt-5 pb-1 flex-wrap">
            <h2 className="h-card">Bu hafta ders yoğunluğu</h2>
            <span className="text-xs text-muted">{week.instructorCount} eğitmen · {week.vehicleCount} araç · {Math.round(week.totalHours)} saat</span>
            <span className="ml-auto font-display text-xl font-bold tabular">%{week.average}</span>
          </header>
          <div className="px-5 pb-5 pt-4 flex gap-3 items-end">
            {week.days.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="h-24 w-full flex items-end">
                  <div className="w-full rounded-t-md" style={{ height: `${Math.max(4, d.percent)}%`, background: d.percent >= 70 ? "var(--virel-blue)" : d.percent >= 40 ? "#5AA9F0" : "var(--virel-blue-100)" }} title={`${d.label}: %${d.percent}`} />
                </div>
                <span className="text-xs text-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {finance ? (
          <Card>
            <header className="flex items-center gap-2.5 px-5 pt-5 pb-1">
              <h2 className="h-card">Tahsilat</h2>
              <Link href="/app/finans" className="ml-auto text-[13px] font-semibold text-blue">Finans →</Link>
            </header>
            <div className="px-5 pb-5">
              <MoneyRow label="Bugün" value={money(finance.today)} sub={`${finance.todayCount} tahsilat`} />
              <MoneyRow label="Bu ay" value={money(finance.month)} sub="tahsil edilen" />
              <MoneyRow label="Bekleyen" value={money(finance.pending)} sub={`${finance.pendingCount} taksit`} />
              <MoneyRow label="Gecikmiş" value={money(finance.overdue)} sub="vadesi geçti" tone="text-danger" />
              <div className="mt-3.5"><ProgressBar value={finance.month + finance.pending ? (finance.month / (finance.month + finance.pending)) * 100 : 0} grad /></div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-muted">Bu ay gider {money(finance.expenses)}</span>
                <span className="text-xs text-text-2 font-semibold">Net {money(finance.month - finance.expenses)}</span>
              </div>
            </div>
          </Card>
        ) : (
          <Card title="Rolünüz" sub="Finans bilgileri bu rolde görünmez">
            <div className="px-5 py-5 text-[13px] text-text-2 leading-relaxed">
              Direksiyon eğitmeni ve teorik öğretmen rolleri kursun finans verilerini görmez.
              Kendi derslerinizi <Link href="/app/dersler" className="text-blue font-semibold">Direksiyon Dersleri</Link> ekranından takip edebilirsiniz.
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value, sub, subTone, icon }: { label: string; value: string; sub: string; subTone?: "success" | "danger"; icon: string }) {
  const tone = subTone === "success" ? "text-success" : subTone === "danger" ? "text-danger" : "text-muted";
  return (
    <div className="card p-[18px] flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="stat-lbl">{label}</span>
        <Icon name={icon} size={18} className="ml-auto text-muted" />
      </div>
      <span className="kpi mt-1.5">{value}</span>
      <span className={`text-xs ${tone}`}>{sub}</span>
    </div>
  );
}

function MoneyRow({ label, value, sub, tone = "" }: { label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className="flex items-baseline gap-2.5 py-2.5 border-t border-border first:border-t-0">
      <span className="text-[13px] text-text-2 w-28 shrink-0">{label}</span>
      <span className={`font-display text-[17px] font-semibold tabular ${tone}`}>{value}</span>
      <span className="text-xs text-muted ml-auto">{sub}</span>
    </div>
  );
}
