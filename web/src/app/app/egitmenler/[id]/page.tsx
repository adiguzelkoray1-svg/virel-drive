import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInstructorDetail } from "@/lib/instructor";
import { Icon } from "@/components/icons";
import { Badge, Card, PersonAvatar, ProgressBar } from "@/components/ui";
import { EXPENSE_SUBCATEGORY_LABEL, INSTRUCTOR_BRANCH_LABEL, THEORY_CATEGORY_LABEL, VEHICLE_STATUS_LABEL, splitCsv } from "@/lib/constants";
import { date, fullName, money, time } from "@/lib/format";
import { can } from "@/lib/permissions";
import { toggleInstructorActiveAction } from "@/app/actions/instructors";
import { grantInstructorAccessAction } from "@/app/actions/users";
import { AccessGrantForm } from "@/components/AccessGrantForm";
import { StaffPaymentForm } from "@/components/StaffPaymentForm";

export async function generateMetadata({ params }: PageProps<"/app/egitmenler/[id]">): Promise<Metadata> {
  const { id } = await params;
  const user = await requirePermission("instructor.read");
  const d = await getInstructorDetail(user.schoolId, id);
  return { title: d?.instructor.name ?? "Eğitmen" };
}

const NOTICE: Record<string, string> = {
  olusturuldu: "Eğitmen eklendi.",
  guncellendi: "Bilgiler güncellendi.",
  aktif: "Eğitmen tekrar aktif olarak işaretlendi.",
  izinde: "Eğitmen izinli olarak işaretlendi.",
  eklendi: "Ödeme kaydedildi.",
};

export default async function InstructorDetailPage({ params, searchParams }: PageProps<"/app/egitmenler/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requirePermission("instructor.read");
  const d = await getInstructorDetail(user.schoolId, id);
  if (!d) notFound();

  const { instructor, upcoming, past, students, loadHours, kind } = d;
  const canWrite = can(user.role, "instructor.write");
  const canManageUsers = can(user.role, "users.manage");
  const showFinance = can(user.role, "finance.read");
  const canPay = can(user.role, "finance.write");
  const payments = showFinance
    ? await prisma.expense.findMany({ where: { schoolId: user.schoolId, instructorId: instructor.id, category: "SALARY" }, orderBy: { occurredAt: "desc" } })
    : [];
  const paidSalary = payments.filter((p) => p.subcategory !== "AVANS").reduce((s, p) => s + p.amount, 0);
  const paidAdvance = payments.filter((p) => p.subcategory === "AVANS").reduce((s, p) => s + p.amount, 0);
  const loadPercent = instructor.weeklyCapacity ? Math.round((loadHours / instructor.weeklyCapacity) * 100) : 0;
  const notice = Object.entries(NOTICE).find(([k]) => typeof sp[k] === "string")?.[1];

  const classInfo = kind === "DRIVING"
    ? splitCsv(instructor.licenseClasses).join(" · ")
    : splitCsv(instructor.subjects).map((k) => THEORY_CATEGORY_LABEL[k] ?? k).join(" · ");

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="h-page">Eğitmen</h1>
          <span className="text-text-2">Eğitmenler / {instructor.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/app/egitmenler" className="btn btn-secondary btn-sm"><Icon name="badge-id" size={15} />Eğitmenler</Link>
          {canWrite && (
            <Link href={`/app/egitmenler/yeni?duzenle=${instructor.id}`} className="btn btn-secondary btn-sm"><Icon name="edit" size={15} />Düzenle</Link>
          )}
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-success-bg">
          <Icon name="check-circle" size={16} className="text-success" />{notice}
        </div>
      )}

      <Card className="p-[22px]">
        <div className="flex items-start gap-[18px] flex-wrap">
          <PersonAvatar name={instructor.name} size={54} />
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="h-section">{instructor.name}</h2>
              <Badge kind="brand">{INSTRUCTOR_BRANCH_LABEL[instructor.branch] ?? instructor.branch}</Badge>
              <Badge kind={instructor.isActive ? "success" : "warning"} dot>{instructor.isActive ? "Aktif" : "İzinde"}</Badge>
            </div>
            <div className="flex gap-4 items-center flex-wrap text-[13px] text-text-2">
              {instructor.phone && <span className="flex items-center gap-1.5 tabular"><Icon name="phone" size={15} className="text-muted" />{instructor.phone}</span>}
              {instructor.user?.email && <span className="flex items-center gap-1.5"><Icon name="mail" size={15} className="text-muted" />{instructor.user.email}</span>}
              {instructor.mebLicenseNo && <span className="flex items-center gap-1.5 tabular"><Icon name="badge-id" size={15} className="text-muted" />MEB izin no: {instructor.mebLicenseNo}</span>}
              <span className="text-xs text-muted">{classInfo || "Sınıf/kategori tanımlanmadı"}</span>
            </div>
          </div>
          {canWrite && (
            <form action={toggleInstructorActiveAction} className="ml-auto">
              <input type="hidden" name="instructorId" value={instructor.id} />
              <button className="btn btn-secondary btn-sm">
                <Icon name={instructor.isActive ? "clock" : "check"} size={15} />
                {instructor.isActive ? "İzinli olarak işaretle" : "Aktif olarak işaretle"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-5 pt-[18px] border-t border-border flex items-center gap-6 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-baseline gap-2 mb-2.5">
              <span className="text-[13.5px] font-semibold">Bu hafta {loadHours}/{instructor.weeklyCapacity} saat</span>
              <span className="text-xs text-muted">kapasitenin %{loadPercent}&apos;i</span>
            </div>
            <ProgressBar value={loadPercent} grad height={8} />
          </div>
          <div className="flex gap-6 pl-[22px] border-l border-border flex-wrap">
            <Metric label="Kursiyer" value={String(students.length)} />
            <Metric label="Tamamlanan ders" value={String(past.length)} />
            {kind === "DRIVING" && <Metric label="Araç" value={String(instructor.vehicles.length)} />}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-4 items-start">
        <Card>
          <header className="flex items-center gap-2.5 px-5 pt-5">
            <h2 className="h-card">Yaklaşan dersler</h2>
            <Link href={kind === "DRIVING" ? `/app/dersler?egitmen=${instructor.id}` : "/app/teorik"} className="ml-auto text-[13px] font-semibold text-blue">Tümü →</Link>
          </header>
          <div className="px-5 pb-5 pt-2">
            {upcoming.length === 0 ? (
              <p className="text-[13px] text-text-2 py-6 text-center">Planlanmış ders yok.</p>
            ) : kind === "DRIVING" ? (
              upcoming.map((l) => (
                <Link key={l.id} href={`/app/dersler/${l.id}`} className="flex items-center gap-3 py-2.5 border-t border-border first:border-t-0">
                  <span className="flex flex-col w-[74px] shrink-0">
                    <span className="text-[13.5px] font-semibold tabular">{date(l.startsAt)}</span>
                    <span className="text-xs text-muted tabular">{time(l.startsAt)}</span>
                  </span>
                  <span className="text-[13px] font-medium truncate">{fullName(l.student)}</span>
                  <span className="text-xs text-muted tabular ml-auto">{l.vehicle.plate}</span>
                </Link>
              ))
            ) : (
              upcoming.map((l) => (
                <Link key={l.id} href={`/app/teorik/${l.id}`} className="flex items-center gap-3 py-2.5 border-t border-border first:border-t-0">
                  <span className="flex flex-col w-[74px] shrink-0">
                    <span className="text-[13.5px] font-semibold tabular">{date(l.startsAt)}</span>
                    <span className="text-xs text-muted tabular">{time(l.startsAt)}</span>
                  </span>
                  <span className="text-[13px] font-medium truncate">{l.topic}</span>
                  <span className="text-xs text-muted ml-auto">{l._count.attendances} kursiyer</span>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card>
          <header className="flex items-center gap-2.5 px-5 pt-5">
            <h2 className="h-card">Son dersler</h2>
          </header>
          <div className="px-5 pb-5 pt-2">
            {past.length === 0 ? (
              <p className="text-[13px] text-text-2 py-6 text-center">Henüz tamamlanmış ders yok.</p>
            ) : kind === "DRIVING" ? (
              past.map((l) => (
                <Link key={l.id} href={`/app/dersler/${l.id}`} className="flex items-center gap-3 py-2.5 border-t border-border first:border-t-0">
                  <span className="flex flex-col w-[74px] shrink-0">
                    <span className="text-[13.5px] font-semibold tabular">{date(l.startsAt)}</span>
                    <span className="text-xs text-muted tabular">{time(l.startsAt)}</span>
                  </span>
                  <span className="text-[13px] truncate">{fullName(l.student)}</span>
                  <span className="text-xs text-muted tabular ml-auto">{l.vehicle.plate}</span>
                </Link>
              ))
            ) : (
              past.map((l) => (
                <Link key={l.id} href={`/app/teorik/${l.id}`} className="flex items-center gap-3 py-2.5 border-t border-border first:border-t-0">
                  <span className="flex flex-col w-[74px] shrink-0">
                    <span className="text-[13.5px] font-semibold tabular">{date(l.startsAt)}</span>
                    <span className="text-xs text-muted tabular">{time(l.startsAt)}</span>
                  </span>
                  <span className="text-[13px] truncate">{l.topic}</span>
                  <span className="text-xs text-muted ml-auto">{l._count.attendances} kursiyer</span>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      {kind === "DRIVING" && (
        <Card title="Atanmış araçlar" sub="Bu eğitmenin varsayılan aracı olarak işaretlendiği araçlar">
          {instructor.vehicles.length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-text-2 text-center">Atanmış araç yok. Araç atamak için Araçlar sayfasından düzenleyin.</p>
          ) : (
            <div className="px-5 pb-4">
              {instructor.vehicles.map((v) => {
                const st = VEHICLE_STATUS_LABEL[v.status] ?? VEHICLE_STATUS_LABEL.ACTIVE;
                return (
                  <Link key={v.id} href={`/app/araclar/${v.id}`} className="flex items-center gap-3 py-2.5 border-t border-border first:border-t-0">
                    <Icon name="car" size={16} className="text-muted" />
                    <span className="text-[13px] font-semibold tabular">{v.plate}</span>
                    <span className="text-xs text-muted">{[v.brand, v.model].filter(Boolean).join(" ")}</span>
                    <span className="ml-auto"><Badge kind={st.kind} dot>{st.label}</Badge></span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {showFinance && (
        <Card id="odeme" title="Maaş ve avans" sub="Bu eğitmene yapılan ödemelerin hesap ekstresi">
          <div className="px-5 pb-5 pt-1 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <Metric label="Ödenen maaş" value={money(paidSalary)} />
              <Metric label="Ödenen avans" value={money(paidAdvance)} />
              <Metric label="Toplam" value={money(paidSalary + paidAdvance)} />
            </div>

            {canPay && (
              <div className="border-t border-border pt-3.5">
                <StaffPaymentForm instructorId={instructor.id} today={new Date().toISOString().slice(0, 10)} />
              </div>
            )}

            {payments.length > 0 && (
              <div className="pt-3.5 border-t border-border flex flex-col gap-1.5">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5 text-[13px] py-1">
                    <Badge kind={p.subcategory === "AVANS" ? "warning" : "neutral"}>{EXPENSE_SUBCATEGORY_LABEL[p.subcategory ?? "MAAS"]}</Badge>
                    <span className="text-text-2 truncate">{p.note || "—"}</span>
                    <span className="text-xs text-muted tabular ml-auto">{date(p.occurredAt)}</span>
                    <span className="tabular font-semibold w-[96px] text-right">{money(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {canManageUsers && (
        <Card title="Giriş erişimi" sub="Mobil eğitmen portalına (/egitmen) giriş bilgisi">
          <div className="px-5 pb-5 pt-1">
            <AccessGrantForm action={grantInstructorAccessAction} entityId={instructor.id} existing={instructor.user} />
          </div>
        </Card>
      )}

      <Card title="Kursiyerler" sub={`${students.length} kursiyer bu eğitmenle ders yaptı`}>
        {students.length === 0 ? (
          <p className="px-5 py-6 text-[13px] text-text-2 text-center">Henüz kursiyer yok.</p>
        ) : (
          <div className="px-5 pb-4 flex flex-wrap gap-2">
            {students.map((s) => (
              <Link key={s.id} href={`/app/kursiyerler/${s.id}`} className="chip">{fullName(s)}</Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="stat-lbl">{label}</span>
      <span className="font-display text-[17px] font-semibold tabular">{value}</span>
    </div>
  );
}
