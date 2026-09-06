import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { Badge, Card, EmptyState, ExamAttempts, PageHeader, PersonAvatar, Tabs } from "@/components/ui";
import { EXAM_STATUS_LABEL } from "@/lib/constants";
import { examSummary, attemptInfo } from "@/lib/exam";
import { date, dateTime, fullName } from "@/lib/format";

export const metadata: Metadata = { title: "Sınavlar" };

const TABS = [
  { key: "etest", label: "e-Sınav" },
  { key: "surus", label: "Direksiyon Sınavı" },
  { key: "sonuclar", label: "Sınav Sonuçları" },
  { key: "haklar", label: "Sınav Hakları" },
] as const;

const COLS = "minmax(180px,1fr) 90px 118px 200px 130px 150px 18px";

export default async function ExamsPage({ searchParams }: PageProps<"/app/sinavlar">) {
  const user = await requirePermission("exam.read");
  const schoolId = user.schoolId;
  const sp = await searchParams;
  const tab = typeof sp.sekme === "string" && TABS.some((t) => t.key === sp.sekme) ? sp.sekme : "etest";

  const summary = await examSummary(schoolId);

  return (
    <>
      <PageHeader title="Sınavlar" sub="e-Sınav, direksiyon sınavı, sonuçlar ve haklar">
        <Link href="/app/takvim" className="btn btn-secondary btn-sm"><Icon name="calendar" size={15} />Sınav takvimi</Link>
        <Link href="/app/sinavlar/yeni" className="btn btn-primary btn-sm"><Icon name="plus" size={15} />Sınav planla</Link>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-[18px] flex flex-col gap-1">
          <span className="stat-lbl">Yaklaşan sınav</span>
          <span className="kpi mt-1.5">{summary.upcoming}</span>
        </div>
        <div className="card p-[18px] flex flex-col gap-1">
          <span className="stat-lbl">e-Sınav başarı oranı</span>
          <span className="kpi mt-1.5 text-success">%{summary.etestPassRate}</span>
          <span className="text-xs text-muted">{summary.etestTotal} sınav</span>
        </div>
        <div className="card p-[18px] flex flex-col gap-1">
          <span className="stat-lbl">Direksiyon başarı oranı</span>
          <span className="kpi mt-1.5">%{summary.drivingPassRate}</span>
          <span className="text-xs text-muted">{summary.drivingTotal} sınav</span>
        </div>
        <div className="card p-[18px] flex flex-col gap-1">
          <span className="stat-lbl">Son hakkı kalan</span>
          <span className={`kpi mt-1.5 ${summary.lastAttemptRisk > 0 ? "text-danger" : ""}`}>{summary.lastAttemptRisk}</span>
          <span className="text-xs text-muted">kursiyer</span>
        </div>
      </div>

      <Tabs items={TABS.map((t) => ({ key: t.key, label: t.label, href: `/app/sinavlar?sekme=${t.key}` }))} active={tab} />

      {tab === "etest" && <ExamTypeTable schoolId={schoolId} type="ETEST" />}
      {tab === "surus" && <ExamTypeTable schoolId={schoolId} type="DRIVING" />}
      {tab === "sonuclar" && <ResultsTable schoolId={schoolId} />}
      {tab === "haklar" && <AttemptRights schoolId={schoolId} />}
    </>
  );
}

async function ExamTypeTable({ schoolId, type }: { schoolId: string; type: "ETEST" | "DRIVING" }) {
  const exams = await prisma.exam.findMany({
    where: { schoolId, type, status: { in: ["PLANNED", "APPLIED"] } },
    include: { student: true },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <Card title={type === "ETEST" ? "Yaklaşan e-Sınavlar" : "Yaklaşan direksiyon sınavları"} sub={`${exams.length} sınav`}>
      {exams.length === 0 ? (
        <EmptyState
          icon="exam"
          title="Planlanmış sınav yok."
          desc="Kursiyer sınava hazır olduğunda buradan planlayabilirsiniz."
          action={<Link href="/app/sinavlar/yeni" className="btn btn-secondary btn-sm"><Icon name="plus" size={15} />Sınav planla</Link>}
        />
      ) : (
        <div className="px-5 pb-4">
          <div className="grid gap-3 items-center pb-2.5" style={{ gridTemplateColumns: COLS }}>
            {["Kursiyer", "Sınıf", "Hak", "Tarih / yer", "Durum", "Başvuru", ""].map((h, i) => <div key={i} className="th">{h}</div>)}
          </div>
          {exams.map((e) => {
            const st = EXAM_STATUS_LABEL[e.status] ?? EXAM_STATUS_LABEL.PLANNED;
            return (
              <Link key={e.id} href={`/app/sinavlar/${e.id}`} className="grid gap-3 items-center py-3 border-t border-border" style={{ gridTemplateColumns: COLS }}>
                <span className="flex items-center gap-2.5 min-w-0">
                  <PersonAvatar name={fullName(e.student)} size={30} />
                  <span className="text-sm font-semibold truncate">{fullName(e.student)}</span>
                </span>
                <Badge kind="brand">{e.student.licenseClass}</Badge>
                <span className="text-[13px] text-text-2 tabular">{e.attemptNo}. hak</span>
                <span className="flex flex-col gap-px min-w-0">
                  <span className="text-[13px] tabular">{e.scheduledAt ? dateTime(e.scheduledAt) : "Tarih belirlenmedi"}</span>
                  {e.place && <span className="text-xs text-muted truncate">{e.place}</span>}
                </span>
                <Badge kind={st.kind}>{st.label}</Badge>
                <span className="text-xs text-muted">{date(e.createdAt)}</span>
                <Icon name="chev-right" size={16} className="text-muted" />
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

async function ResultsTable({ schoolId }: { schoolId: string }) {
  const exams = await prisma.exam.findMany({
    where: { schoolId, status: "DONE" },
    include: { student: true },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });

  return (
    <Card title="Son sınav sonuçları" sub={`${exams.length} sonuç`}>
      {exams.length === 0 ? (
        <EmptyState icon="exam" title="Henüz sonuçlanan sınav yok." />
      ) : (
        <div className="px-5 pb-4">
          <div className="grid grid-cols-[minmax(180px,1fr)_90px_100px_110px_90px_1fr_18px] gap-3 items-center pb-2.5">
            {["Kursiyer", "Sınıf", "Tür", "Sonuç", "Puan", "Başarısızlık nedeni", ""].map((h, i) => <div key={i} className="th">{h}</div>)}
          </div>
          {exams.map((e) => (
            <Link key={e.id} href={`/app/sinavlar/${e.id}`} className="grid grid-cols-[minmax(180px,1fr)_90px_100px_110px_90px_1fr_18px] gap-3 items-center py-3 border-t border-border">
              <span className="flex items-center gap-2.5 min-w-0">
                <PersonAvatar name={fullName(e.student)} size={30} />
                <span className="text-sm font-semibold truncate">{fullName(e.student)}</span>
              </span>
              <Badge kind="brand">{e.student.licenseClass}</Badge>
              <span className="text-[13px] text-text-2">{e.type === "ETEST" ? "e-Sınav" : "Direksiyon"}</span>
              <Badge kind={e.result === "PASSED" ? "success" : "danger"} dot>{e.result === "PASSED" ? "Başarılı" : "Başarısız"}</Badge>
              <span className="text-[13px] tabular">{e.score ?? "—"}</span>
              <span className="text-[13px] text-text-2 truncate">{e.failReason ?? "—"}</span>
              <Icon name="chev-right" size={16} className="text-muted" />
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

async function AttemptRights({ schoolId }: { schoolId: string }) {
  const students = await prisma.student.findMany({
    where: { schoolId, status: "ACTIVE", stage: { in: ["ETEST_WAITING", "DRIVING_EXAM"] } },
    orderBy: { firstName: "asc" },
  });
  const rows = await Promise.all(
    students.map(async (s) => {
      const type = s.stage === "ETEST_WAITING" ? ("ETEST" as const) : ("DRIVING" as const);
      const info = await attemptInfo(schoolId, s.id, type);
      return { student: s, type, info };
    }),
  );

  return (
    <Card title="Sınav hakları" sub="Aktif sınav sürecindeki kursiyerler">
      <div className="px-5 pt-1 pb-3">
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-blue-050">
          <Icon name="info" size={16} className="shrink-0 mt-0.5 text-blue" />
          <span>
            Hak sayısı sınıf bazında <b>Ayarlar › Mevzuat ve Kurs Ayarları</b>&apos;ndan (LicenseClassRule.examAttempts)
            yapılandırılır; koda gömülü değildir. Mevzuat değişirse burada otomatik güncellenir.
          </span>
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="exam" title="Aktif sınav sürecinde kursiyer yok." />
      ) : (
        <div className="px-5 pb-4">
          {rows.map(({ student: s, type, info }) => (
            <Link key={s.id} href={`/app/kursiyerler/${s.id}`} className="flex items-center gap-3 py-3 border-t border-border">
              <PersonAvatar name={fullName(s)} size={32} />
              <span className="flex flex-col gap-px min-w-0 flex-1">
                <span className="text-sm font-semibold truncate">{fullName(s)}</span>
                <span className="text-xs text-muted">{type === "ETEST" ? "e-Sınav" : "Direksiyon sınavı"} · {s.licenseClass} sınıfı</span>
              </span>
              <ExamAttempts used={info.used} total={info.allowed} />
              {info.remaining === 1 && !info.passed && <Badge kind="danger" dot>Son hak</Badge>}
              {info.remaining === 0 && !info.passed && <Badge kind="danger" dot>Hak bitti</Badge>}
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
