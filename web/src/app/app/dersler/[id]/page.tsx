import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRegulation, regInt } from "@/lib/regulation";
import { Icon } from "@/components/icons";
import { Badge, Card, PageHeader, PersonAvatar, ProgressBar } from "@/components/ui";
import { LESSON_KIND_LABEL, LESSON_STATUS_LABEL } from "@/lib/constants";
import { date, dateLong, fullName, time } from "@/lib/format";
import { can } from "@/lib/permissions";
import { cancelLessonAction, noShowLessonAction, reopenLessonAction, updateLessonAction } from "@/app/actions/lessons";
import { LessonForm } from "../LessonForm";
import { ReviewForm } from "./ReviewForm";

export const metadata: Metadata = { title: "Direksiyon dersi" };

const NOTICE: Record<string, { text: string; kind: "success" | "warning" | "danger" }> = {
  guncellendi: { text: "Ders güncellendi.", kind: "success" },
  tamamlandi: { text: "Ders tamamlandı ve değerlendirme kaydedildi.", kind: "success" },
  iptal: { text: "Ders iptal edildi.", kind: "warning" },
  gelmedi: { text: "Ders 'gelmedi' olarak işaretlendi.", kind: "warning" },
  acildi: { text: "Ders yeniden planlandı.", kind: "success" },
};
const ERROR: Record<string, string> = {
  "tamamlanan-iptal": "Tamamlanmış bir ders iptal edilemez.",
  "tamamlanan-geri-alinamaz": "Tamamlanmış bir ders yeniden açılamaz.",
};

export default async function LessonDetailPage({ params, searchParams }: PageProps<"/app/dersler/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requirePermission("lesson.read");
  const schoolId = user.schoolId;

  const lesson = await prisma.drivingLesson.findFirst({
    where: { id, schoolId },
    include: { student: true, instructor: true, vehicle: true, ratings: true },
  });
  if (!lesson) notFound();

  const now = new Date();
  const canWrite = can(user.role, "lesson.write");
  const canReview = can(user.role, "lesson.review");
  const editable = canWrite && (lesson.status === "PLANNED" || lesson.status === "LIVE" || lesson.status === "NO_SHOW");
  const started = lesson.startsAt <= now;
  const st = LESSON_STATUS_LABEL[lesson.status] ?? LESSON_STATUS_LABEL.PLANNED;

  const [students, instructors, vehicles, reg, rule, doneCount] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId, OR: [{ status: "ACTIVE" }, { id: lesson.studentId }] },
      orderBy: { firstName: "asc" },
      select: { id: true, firstName: true, lastName: true, licenseClass: true },
    }),
    prisma.instructor.findMany({ where: { schoolId, branch: "DRIVING", isActive: true }, orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ where: { schoolId, OR: [{ status: "ACTIVE" }, { id: lesson.vehicleId }] }, orderBy: { plate: "asc" } }),
    getRegulation(schoolId),
    prisma.licenseClassRule.findFirst({ where: { schoolId, code: lesson.student.licenseClass } }),
    prisma.drivingLesson.count({ where: { schoolId, studentId: lesson.studentId, status: "DONE" } }),
  ]);

  const minutes = regInt(reg, "drivingLessonMinutes", 90);
  const cancelHours = regInt(reg, "lessonCancelHours", 24);
  const hoursLeft = (lesson.startsAt.getTime() - now.getTime()) / 3_600_000;
  const lateCancel = hoursLeft > 0 && hoursLeft < cancelHours;

  const required = rule?.drivingHours ?? 14;
  const doneHours = (doneCount * minutes) / 60;
  const scores = Object.fromEntries(lesson.ratings.map((r) => [r.skill, r.score]));

  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const notice = typeof sp.guncellendi === "string" ? NOTICE.guncellendi
    : typeof sp.tamamlandi === "string" ? NOTICE.tamamlandi
    : typeof sp.iptal === "string" ? NOTICE.iptal
    : typeof sp.gelmedi === "string" ? NOTICE.gelmedi
    : typeof sp.acildi === "string" ? NOTICE.acildi : null;
  const error = typeof sp.hata === "string" ? ERROR[sp.hata] : null;

  return (
    <>
      <PageHeader title="Direksiyon dersi" sub={`Direksiyon Dersleri / ${fullName(lesson.student)} · ${dateLong(lesson.startsAt)}`}>
        <Link href="/app/takvim" className="btn btn-secondary btn-sm"><Icon name="calendar" size={15} />Takvim</Link>
        <Link href={`/app/kursiyerler/${lesson.studentId}`} className="btn btn-secondary btn-sm"><Icon name="user" size={15} />Kursiyer kartı</Link>
      </PageHeader>

      {notice && (
        <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-sm text-[13px] ${notice.kind === "success" ? "bg-success-bg" : "bg-warning-bg"}`}>
          <Icon name={notice.kind === "success" ? "check-circle" : "info"} size={16} className={notice.kind === "success" ? "text-success" : "text-warning"} />
          {notice.text}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-danger-bg" role="alert">
          <Icon name="alert" size={16} className="text-danger" />{error}
        </div>
      )}

      <Card className="p-[22px]">
        <div className="flex items-start gap-[18px] flex-wrap">
          <PersonAvatar name={fullName(lesson.student)} size={54} />
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link href={`/app/kursiyerler/${lesson.studentId}`} className="h-section text-text hover:text-blue">{fullName(lesson.student)}</Link>
              <Badge kind="brand">{lesson.student.licenseClass} sınıfı</Badge>
              <Badge kind={st.kind} dot>{st.label}</Badge>
            </div>
            <div className="flex gap-4 items-center flex-wrap text-[13px] text-text-2">
              <span className="flex items-center gap-1.5"><Icon name="clock" size={15} className="text-muted" /><span className="tabular">{date(lesson.startsAt)} · {time(lesson.startsAt)}–{time(lesson.endsAt)}</span></span>
              <span className="flex items-center gap-1.5"><Icon name="badge-id" size={15} className="text-muted" />{lesson.instructor.name}</span>
              <span className="flex items-center gap-1.5"><Icon name="car" size={15} className="text-muted" /><span className="tabular">{lesson.vehicle.plate}</span></span>
              <span className="flex items-center gap-1.5"><Icon name="wheel" size={15} className="text-muted" />{LESSON_KIND_LABEL[lesson.kind] ?? lesson.kind}</span>
            </div>
            {lesson.note && <span className="text-[13px] text-muted mt-1">{lesson.note}</span>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_352px] gap-4 items-start">
        <div className="flex flex-col gap-4">
          {editable ? (
            <LessonForm
              students={students.map((s) => ({ id: s.id, label: `${s.firstName} ${s.lastName}`, sub: s.licenseClass }))}
              instructors={instructors.map((i) => ({ id: i.id, label: i.name, sub: i.licenseClasses }))}
              vehicles={vehicles.map((v) => ({ id: v.id, label: v.plate, sub: [v.brand, v.model].filter(Boolean).join(" ") || undefined }))}
              kinds={Object.entries(LESSON_KIND_LABEL).map(([key, label]) => ({ key, label }))}
              defaults={{
                studentId: lesson.studentId, instructorId: lesson.instructorId, vehicleId: lesson.vehicleId,
                kind: lesson.kind, date: iso(lesson.startsAt), start: hhmm(lesson.startsAt), end: hhmm(lesson.endsAt),
                note: lesson.note ?? "",
              }}
              durationMinutes={minutes}
              submitAction={updateLessonAction}
              lessonId={lesson.id}
              submitLabel="Değişiklikleri kaydet"
              cancelHref="/app/takvim"
            />
          ) : (
            <Card title="Ders bilgileri" sub={lesson.status === "DONE" ? "Tamamlanmış ders düzenlenemez" : "İptal edilmiş ders düzenlenemez"}>
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                <Info label="Kursiyer" value={fullName(lesson.student)} />
                <Info label="Eğitmen" value={lesson.instructor.name} />
                <Info label="Araç" value={lesson.vehicle.plate} />
                <Info label="Ders türü" value={LESSON_KIND_LABEL[lesson.kind] ?? lesson.kind} />
                <Info label="Tarih" value={date(lesson.startsAt)} />
                <Info label="Saat" value={`${time(lesson.startsAt)} – ${time(lesson.endsAt)}`} />
              </div>
            </Card>
          )}

          {canWrite && (
            <Card title="Ders durumu" sub={`İptal süresi mevzuat ayarında ${cancelHours} saat`}>
              <div className="px-5 py-4 flex flex-col gap-4">
                {lesson.status === "DONE" ? (
                  <p className="text-[13px] text-text-2 leading-relaxed">
                    Bu ders tamamlandı ve kursiyerin eğitim saatine işlendi. Değerlendirmeyi sağdaki karttan güncelleyebilirsiniz.
                  </p>
                ) : lesson.status === "CANCELLED" || lesson.status === "NO_SHOW" ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-[13px] text-text-2 flex-1 min-w-[240px]">
                      {lesson.status === "CANCELLED" ? "Ders iptal edildi." : "Kursiyer derse gelmedi."} Aynı ders kaydını yeniden planlayabilirsiniz.
                    </p>
                    <form action={reopenLessonAction}>
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <button className="btn btn-secondary btn-sm"><Icon name="refresh" size={15} />Yeniden planla</button>
                    </form>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {started && canReview && (
                        <a href="#degerlendirme" className="btn btn-primary btn-sm"><Icon name="check" size={15} />Dersi tamamla</a>
                      )}
                      <form action={noShowLessonAction}>
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <button className="btn btn-secondary btn-sm"><Icon name="x-circle" size={15} />Kursiyer gelmedi</button>
                      </form>
                      {!started && (
                        <span className="text-xs text-muted">
                          Ders {hoursLeft >= 1 ? `${Math.round(hoursLeft)} saat` : "birazdan"} sonra başlıyor.
                        </span>
                      )}
                    </div>

                    <form action={cancelLessonAction} className="pt-4 border-t border-border flex flex-col gap-3">
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      {lateCancel && (
                        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-warning-bg">
                          <Icon name="alert" size={16} className="shrink-0 mt-0.5 text-warning" />
                          <span>
                            Derse {Math.max(0, Math.round(hoursLeft))} saat kaldı. Mevzuat ayarına göre {cancelHours} saatten az kala yapılan iptal
                            <b> geç iptal</b> olarak kaydedilir.
                          </span>
                        </div>
                      )}
                      <div className="flex items-end gap-2.5 flex-wrap">
                        <label className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
                          <span className="label">İptal nedeni</span>
                          <input name="reason" className="input h-9 text-[13px]" placeholder="Kursiyer talebi, araç arızası…" />
                        </label>
                        <button className="btn btn-danger btn-sm"><Icon name="x" size={15} />Dersi iptal et</button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <header className="flex items-center gap-2.5 px-5 pt-5">
              <h2 className="h-card">Kursiyer</h2>
              <Link href={`/app/kursiyerler/${lesson.studentId}`} className="ml-auto text-[13px] font-semibold text-blue">Kart →</Link>
            </header>
            <div className="px-5 pb-5 pt-3.5">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-[13px] text-text-2">Direksiyon eğitimi</span>
                <span className="ml-auto font-display text-[15px] font-semibold tabular">{Math.round(doneHours * 10) / 10}/{required} saat</span>
              </div>
              <ProgressBar value={(doneHours / required) * 100} height={6} />
              <p className="text-xs text-muted mt-2">
                {doneHours >= required ? "Zorunlu eğitim tamamlandı." : `Kalan ${(required - doneHours).toFixed(1).replace(".", ",")} saat.`}
              </p>
            </div>
          </Card>

          {canReview && (started || lesson.status === "DONE") ? (
            <Card id="degerlendirme">
              <header className="flex items-center gap-2.5 px-5 pt-5 flex-wrap">
                <h2 className="h-card">Ders değerlendirmesi</h2>
                {lesson.status === "DONE" && <Badge kind="success" dot>Tamamlandı</Badge>}
              </header>
              <ReviewForm lessonId={lesson.id} note={lesson.reviewNote} scores={scores} completed={lesson.status === "DONE"} />
            </Card>
          ) : canReview ? (
            <Card title="Ders değerlendirmesi" sub="Ders başladıktan sonra girilir">
              <p className="px-5 py-6 text-[13px] text-text-2 leading-relaxed text-center">
                Gelişim alanları ve eğitmen notu, ders saati geldiğinde bu karttan girilir.
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="stat-lbl">{label}</span>
      <span className="text-[13.5px] font-semibold tabular">{value}</span>
    </div>
  );
}
