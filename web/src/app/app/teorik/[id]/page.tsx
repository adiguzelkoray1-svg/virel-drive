import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { Badge, Card, PageHeader, ProgressBar } from "@/components/ui";
import { THEORY_CATEGORY_LABEL } from "@/lib/constants";
import { rosterFor } from "@/lib/theory";
import { getRegulation, regInt } from "@/lib/regulation";
import { date, dateLong, fullName, time } from "@/lib/format";
import { can } from "@/lib/permissions";
import { cancelTheoryAction } from "@/app/actions/theory";
import { AttendanceForm } from "./AttendanceForm";

export const metadata: Metadata = { title: "Teorik ders" };

const STATUS: Record<string, { label: string; kind: "success" | "brand" | "neutral" | "warning" }> = {
  DONE: { label: "Tamamlandı", kind: "success" },
  LIVE: { label: "Devam ediyor", kind: "brand" },
  PLANNED: { label: "Planlandı", kind: "neutral" },
  CANCELLED: { label: "İptal", kind: "warning" },
};

export default async function TheoryLessonPage({ params, searchParams }: PageProps<"/app/teorik/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requirePermission("theory.read");
  const schoolId = user.schoolId;
  const now = new Date();

  const lesson = await prisma.theoryLesson.findFirst({ where: { id, schoolId }, include: { instructor: true } });
  if (!lesson) notFound();

  const [roster, reg, absentees] = await Promise.all([
    rosterFor(schoolId, id),
    getRegulation(schoolId),
    prisma.attendance.findMany({
      where: { schoolId, theoryLessonId: id, present: false },
      include: { student: { select: { id: true, firstName: true, lastName: true } } },
    }),
  ]);

  const canWrite = can(user.role, "theory.write");
  const canTakeAttendance = can(user.role, "attendance.write") && lesson.status !== "CANCELLED";
  const st = STATUS[lesson.status] ?? STATUS.PLANNED;
  const started = lesson.startsAt <= now;
  const recorded = roster.filter((r) => r.recorded).length;
  const present = roster.filter((r) => r.present === true).length;
  const percent = recorded ? Math.round((present / recorded) * 100) : 0;
  const minPercent = regInt(reg, "theoryAttendanceMinPercent", 85);

  const notice = typeof sp.yoklama === "string" ? `Yoklama kaydedildi · ${sp.yoklama} kursiyer katıldı.`
    : typeof sp.olusturuldu === "string" ? "Teorik ders programa eklendi."
    : typeof sp.guncellendi === "string" ? "Ders güncellendi."
    : typeof sp.iptal === "string" ? "Ders iptal edildi."
    : typeof sp.acildi === "string" ? "Ders yeniden planlandı." : null;

  return (
    <>
      <PageHeader title="Teorik ders" sub={`Teorik Eğitim / ${lesson.topic} · ${dateLong(lesson.startsAt)}`}>
        <Link href="/app/teorik" className="btn btn-secondary btn-sm"><Icon name="book" size={15} />Programa dön</Link>
        {canWrite && lesson.status !== "CANCELLED" && (
          <Link href={`/app/teorik/yeni?ders=${lesson.id}`} className="btn btn-secondary btn-sm"><Icon name="edit" size={15} />Düzenle</Link>
        )}
      </PageHeader>

      {notice && (
        <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-success-bg">
          <Icon name="check-circle" size={16} className="text-success" />{notice}
        </div>
      )}

      <Card className="p-[22px]">
        <div className="flex items-start gap-[18px] flex-wrap">
          <div className="w-[54px] h-[54px] rounded-md bg-success-bg text-success flex items-center justify-center shrink-0">
            <Icon name="book" size={26} />
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="h-section">{lesson.topic}</h1>
              <Badge kind="neutral">{THEORY_CATEGORY_LABEL[lesson.category] ?? lesson.category}</Badge>
              <Badge kind={st.kind} dot={lesson.status === "DONE" || lesson.status === "LIVE"}>{st.label}</Badge>
            </div>
            <div className="flex gap-4 items-center flex-wrap text-[13px] text-text-2">
              <span className="flex items-center gap-1.5"><Icon name="clock" size={15} className="text-muted" /><span className="tabular">{date(lesson.startsAt)} · {time(lesson.startsAt)}–{time(lesson.endsAt)}</span></span>
              <span className="flex items-center gap-1.5"><Icon name="badge-id" size={15} className="text-muted" />{lesson.instructor?.name ?? "Öğretmen atanmadı"}</span>
              <span className="flex items-center gap-1.5"><Icon name="building" size={15} className="text-muted" />{lesson.room ?? "Derslik yok"}</span>
              {lesson.term && <span className="flex items-center gap-1.5"><Icon name="calendar" size={15} className="text-muted" />Dönem {lesson.term}</span>}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
        <Card>
          <header className="flex items-center gap-2.5 px-5 pt-5 pb-1 flex-wrap">
            <h2 className="h-card">Yoklama</h2>
            <span className="text-xs text-muted">{roster.length} kursiyer</span>
            {recorded > 0 && <Badge kind={percent >= minPercent ? "success" : "warning"} dot>%{percent} katılım</Badge>}
          </header>

          {!canTakeAttendance ? (
            <p className="px-5 py-8 text-[13px] text-text-2 text-center leading-relaxed">
              {lesson.status === "CANCELLED" ? "İptal edilmiş derse yoklama alınamaz." : "Yoklama almak için yetkiniz yok."}
            </p>
          ) : !started ? (
            <p className="px-5 py-8 text-[13px] text-text-2 text-center leading-relaxed">
              Ders {date(lesson.startsAt)} {time(lesson.startsAt)}&apos;te başlıyor. Yoklama ders saatinde alınır.
            </p>
          ) : roster.length === 0 ? (
            <p className="px-5 py-8 text-[13px] text-text-2 text-center leading-relaxed">
              Teorik eğitimde aktif kursiyer yok. Kursiyerlerin aşaması &quot;Teorik eğitim&quot; olduğunda listede görünür.
            </p>
          ) : (
            <AttendanceForm
              lessonId={lesson.id}
              alreadyDone={lesson.status === "DONE"}
              canComplete={canWrite}
              roster={roster.map((r) => ({
                id: r.student.id,
                name: fullName(r.student),
                licenseClass: r.student.licenseClass,
                present: r.present,
                recorded: r.recorded,
              }))}
            />
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="h-card px-5 pt-5">Katılım</h2>
            <div className="px-5 pb-5 pt-3.5">
              {recorded === 0 ? (
                <p className="text-[13px] text-text-2 leading-relaxed">Henüz yoklama alınmadı.</p>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-[13px] text-text-2">Katılan</span>
                    <span className="ml-auto font-display text-[17px] font-semibold tabular">{present}/{recorded}</span>
                  </div>
                  <ProgressBar value={percent} height={6} />
                  <p className="text-xs text-muted mt-2">
                    Devam sınırı %{minPercent}. {percent >= minPercent ? "Bu ders sınırın üstünde." : "Bu ders sınırın altında kaldı."}
                  </p>
                  {absentees.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-border">
                      <span className="stat-lbl">Gelmeyenler ({absentees.length})</span>
                      <div className="flex flex-col gap-1.5 mt-2">
                        {absentees.slice(0, 8).map((a) => (
                          <Link key={a.id} href={`/app/kursiyerler/${a.student.id}`} className="text-[13px] text-text-2 hover:text-blue truncate">
                            {fullName(a.student)}
                          </Link>
                        ))}
                        {absentees.length > 8 && <span className="text-xs text-muted">+{absentees.length - 8} kursiyer</span>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {canWrite && (
            <Card title="Ders durumu">
              <div className="px-5 py-4 flex flex-col gap-3">
                <p className="text-[13px] text-text-2 leading-relaxed">
                  {lesson.status === "CANCELLED"
                    ? "Ders iptal edildi. Yeniden planlayarak programa geri alabilirsiniz."
                    : "Ders iptal edilirse programdan düşer; alınmış yoklama silinmez."}
                </p>
                <form action={cancelTheoryAction}>
                  <input type="hidden" name="lessonId" value={lesson.id} />
                  <button className={`btn btn-sm ${lesson.status === "CANCELLED" ? "btn-secondary" : "btn-danger"}`}>
                    <Icon name={lesson.status === "CANCELLED" ? "refresh" : "x"} size={15} />
                    {lesson.status === "CANCELLED" ? "Yeniden planla" : "Dersi iptal et"}
                  </button>
                </form>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
