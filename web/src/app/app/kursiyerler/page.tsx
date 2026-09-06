import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { Badge, Card, Chip, EmptyState, PageHeader, PersonAvatar, ProgressBar } from "@/components/ui";
import { STAGE_LABEL, STUDENT_STATUS_LABEL, type StudentStage } from "@/lib/constants";
import { date, fullName, maskPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Kursiyerler" };

const PAGE_SIZE = 25;

const FILTERS = [
  { key: "tumu", label: "Tümü", where: {} },
  { key: "aktif", label: "Aktif", where: { status: "ACTIVE" } },
  { key: "on-kayit", label: "Ön kayıt", where: { stage: "PRE_REGISTRATION" } },
  { key: "teorik", label: "Teorik", where: { stage: "THEORY" } },
  { key: "esinav", label: "e-Sınav bekliyor", where: { stage: "ETEST_WAITING" } },
  { key: "direksiyon", label: "Direksiyon", where: { stage: "DRIVING" } },
  { key: "sinav", label: "Direksiyon sınavı", where: { stage: "DRIVING_EXAM" } },
  { key: "mezun", label: "Mezun", where: { stage: "GRADUATED" } },
  { key: "pasif", label: "Pasif", where: { status: "PASSIVE" } },
] as const;

export default async function StudentsPage({ searchParams }: PageProps<"/app/kursiyerler">) {
  const user = await requirePermission("student.read");
  const schoolId = user.schoolId;
  const sp = await searchParams;
  const filterKey = typeof sp.filtre === "string" ? sp.filtre : "tumu";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.sayfa) || 1);

  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0];
  const where = {
    schoolId,
    ...filter.where,
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q.replace(/\D/g, "") } },
            { fileNo: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [students, total, counts, rules] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: [{ status: "asc" }, { registeredAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        paymentPlan: { include: { installments: true } },
        exams: { orderBy: { attemptNo: "desc" } },
        _count: { select: { drivingLessons: true } },
      },
    }),
    prisma.student.count({ where }),
    Promise.all(FILTERS.map((f) => prisma.student.count({ where: { schoolId, ...f.where } }))),
    prisma.licenseClassRule.findMany({ where: { schoolId } }),
  ]);

  const need = new Map(rules.map((r) => [r.code, r.drivingHours]));
  const ids = students.map((s) => s.id);
  const [doneLessons, attendance] = await Promise.all([
    prisma.drivingLesson.groupBy({ by: ["studentId"], where: { schoolId, studentId: { in: ids }, status: "DONE" }, _count: { _all: true } }),
    prisma.attendance.findMany({ where: { schoolId, studentId: { in: ids } }, select: { studentId: true, present: true } }),
  ]);
  const doneMap = new Map(doneLessons.map((d) => [d.studentId, d._count._all]));
  const attMap = new Map<string, { t: number; p: number }>();
  for (const a of attendance) {
    const c = attMap.get(a.studentId) ?? { t: 0, p: 0 };
    c.t++; if (a.present) c.p++;
    attMap.set(a.studentId, c);
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (over: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (filterKey !== "tumu") p.set("filtre", filterKey);
    if (q) p.set("q", q);
    for (const [k, v] of Object.entries(over)) v ? p.set(k, String(v)) : p.delete(k);
    const s = p.toString();
    return s ? `/app/kursiyerler?${s}` : "/app/kursiyerler";
  };

  return (
    <>
      <PageHeader title="Kursiyerler" sub={`${counts[1]} aktif · ${counts[2]} ön kayıt · ${total} kayıt listeleniyor`}>
        <Link href="/app/kursiyerler?disa=csv" className="btn btn-secondary btn-sm"><Icon name="download" size={15} />Dışa aktar</Link>
        <Link href="/app/kursiyerler/yeni" className="btn btn-primary btn-sm"><Icon name="plus" size={15} />Kursiyer ekle</Link>
      </PageHeader>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f, i) => (
          <Chip key={f.key} href={`/app/kursiyerler?filtre=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} active={f.key === filterKey}>
            {f.label} {counts[i]}
          </Chip>
        ))}
      </div>

      <Card>
        <form className="flex items-center gap-3 px-5 pt-5 pb-3.5 flex-wrap">
          {filterKey !== "tumu" && <input type="hidden" name="filtre" value={filterKey} />}
          <div className="relative w-[300px] max-w-full">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input name="q" defaultValue={q} className="input h-9 pl-9 text-[13px]" placeholder="Ad, telefon veya dosya no ara…" aria-label="Kursiyer ara" />
          </div>
          <button className="btn btn-secondary btn-sm">Ara</button>
          {q && <Link href={qs({ q: "" })} className="btn btn-ghost btn-sm">Temizle</Link>}
          <span className="text-xs text-muted ml-auto tabular">{total} kayıttan {students.length} tanesi</span>
        </form>

        {students.length === 0 ? (
          <EmptyState
            icon="users"
            title={q ? "Aramanıza uyan kursiyer yok." : "Bu filtrede kursiyer yok."}
            desc={q ? "Farklı bir ad, telefon ya da dosya numarası deneyin." : "Yeni bir kursiyer ekleyerek başlayabilirsiniz."}
            action={<Link href="/app/kursiyerler/yeni" className="btn btn-secondary btn-sm"><Icon name="plus" size={15} />Kursiyer ekle</Link>}
          />
        ) : (
          <div className="px-5 pb-4">
            <div className="grid grid-cols-[minmax(180px,1fr)_40px_88px_122px_84px_108px_124px_118px_68px_18px] gap-3 items-center pb-2.5">
              {["Kursiyer", "Sınıf", "Kayıt", "Aşama", "Teorik", "Direksiyon", "Sınav", "Ödeme", "Durum", ""].map((h, i) => (
                <div key={i} className="th">{h}</div>
              ))}
            </div>
            {students.map((s) => {
              const req = need.get(s.licenseClass) ?? 14;
              const doneHours = ((doneMap.get(s.id) ?? 0) * 90) / 60;
              const drivePct = Math.min(100, Math.round((doneHours / req) * 100));
              const att = attMap.get(s.id);
              const theoryPct = att && att.t ? Math.round((att.p / att.t) * 100) : s.stage === "PRE_REGISTRATION" || s.stage === "DOCUMENTS" ? 0 : 100;

              const etest = s.exams.find((e) => e.type === "ETEST" && e.result === "PASSED");
              const lastExam = s.exams[0];
              const exam = etest
                ? { label: `e-Sınav ${etest.score ?? ""}`.trim(), kind: "success" as const }
                : lastExam?.status === "APPLIED" || lastExam?.status === "PLANNED"
                  ? { label: lastExam.type === "ETEST" ? "e-Sınav planlı" : "Direksiyon planlı", kind: "brand" as const }
                  : { label: "—", kind: "neutral" as const };

              const inst = s.paymentPlan?.installments ?? [];
              const overdue = inst.filter((i) => i.status !== "PAID" && i.dueAt < new Date());
              const pay = !s.paymentPlan
                ? { label: "Plan yok", kind: "neutral" as const }
                : overdue.length
                  ? { label: `${Math.round((Date.now() - Math.min(...overdue.map((o) => o.dueAt.getTime()))) / 86_400_000)} gün gecikti`, kind: "danger" as const }
                  : inst.every((i) => i.status === "PAID")
                    ? { label: "Tamamlandı", kind: "success" as const }
                    : { label: "Güncel", kind: "success" as const };

              const status = STUDENT_STATUS_LABEL[s.status] ?? STUDENT_STATUS_LABEL.ACTIVE;

              return (
                <Link key={s.id} href={`/app/kursiyerler/${s.id}`} className="grid grid-cols-[minmax(180px,1fr)_40px_88px_122px_84px_108px_124px_118px_68px_18px] gap-3 items-center py-3 border-t border-border">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <PersonAvatar name={fullName(s)} size={34} />
                    <span className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate">{fullName(s)}</span>
                      <span className="text-xs text-muted tabular">{maskPhone(s.phone)}</span>
                    </span>
                  </span>
                  <Badge kind="brand">{s.licenseClass}</Badge>
                  <span className="text-[13px] text-text-2 tabular">{date(s.registeredAt)}</span>
                  <span className="text-[13px]">{STAGE_LABEL[s.stage as StudentStage] ?? s.stage}</span>
                  <span className="flex flex-col gap-1.5"><ProgressBar value={theoryPct} height={5} /><span className="text-xs text-muted tabular">%{theoryPct}</span></span>
                  <span className="flex flex-col gap-1.5"><ProgressBar value={drivePct} height={5} /><span className="text-xs text-muted tabular">{doneHours}/{req} saat</span></span>
                  <Badge kind={exam.kind} dot={exam.kind !== "neutral"}>{exam.label}</Badge>
                  <Badge kind={pay.kind} dot={pay.kind !== "neutral"}>{pay.label}</Badge>
                  <Badge kind={status.kind}>{status.label}</Badge>
                  <Icon name="chev-right" size={16} className="text-muted" />
                </Link>
              );
            })}

            {pages > 1 && (
              <div className="flex items-center gap-2.5 pt-4 mt-1 border-t border-border">
                <span className="text-xs text-muted tabular">Sayfa {page} / {pages}</span>
                <div className="ml-auto flex gap-1.5">
                  <Link href={qs({ sayfa: Math.max(1, page - 1) })} className="ibtn" aria-disabled={page === 1}><Icon name="chev-left" size={16} /></Link>
                  <Link href={qs({ sayfa: Math.min(pages, page + 1) })} className="ibtn"><Icon name="chev-right" size={16} /></Link>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
