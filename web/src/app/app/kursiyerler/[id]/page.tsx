import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { getStudentDetail } from "@/lib/student";
import { Icon } from "@/components/icons";
import { Badge, Card, ExamAttempts, Notice, PageHeader, PersonAvatar, ProgressBar } from "@/components/ui";
import { DOCUMENT_STATUS_LABEL, SCORE_LABEL, STAGE_LABEL, STUDENT_STATUS_LABEL, INSTALLMENT_STATUS_LABEL, type StudentStage } from "@/lib/constants";
import { listDocumentTypeRules } from "@/lib/document-types";
import { date, fullName, maskNationalId, maskPhone, money, time } from "@/lib/format";
import { can } from "@/lib/permissions";
import { grantStudentAccessAction } from "@/app/actions/users";
import { AccessGrantForm } from "@/components/AccessGrantForm";

export async function generateMetadata({ params }: PageProps<"/app/kursiyerler/[id]">): Promise<Metadata> {
  const { id } = await params;
  const user = await requirePermission("student.read");
  const d = await getStudentDetail(user.schoolId, id);
  return { title: d ? fullName(d.student) : "Kursiyer" };
}

export default async function StudentDetailPage({ params, searchParams }: PageProps<"/app/kursiyerler/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requirePermission("student.read");
  const [d, documentTypes] = await Promise.all([
    getStudentDetail(user.schoolId, id),
    listDocumentTypeRules(user.schoolId),
  ]);
  if (!d) notFound();

  const s = d.student;
  const showFinance = can(user.role, "finance.read");
  const showDocEdit = can(user.role, "document.write");
  const showEdit = can(user.role, "student.write");
  const canManageUsers = can(user.role, "users.manage");
  const status = STUDENT_STATUS_LABEL[s.status] ?? STUDENT_STATUS_LABEL.ACTIVE;
  const docLabel = new Map<string, string>(documentTypes.map((t) => [t.key, t.label]));
  const nextStep =
    s.stage === "DRIVING" ? `direksiyon eğitiminin kalan ${Math.max(0, d.requiredHours - d.doneHours).toFixed(1)} saati`
    : s.stage === "THEORY" ? "teorik eğitimin tamamlanması"
    : s.stage === "ETEST_WAITING" ? "e-Sınav başvurusu"
    : s.stage === "DRIVING_EXAM" ? "direksiyon sınavı"
    : s.stage === "GRADUATED" ? "tamamlandı" : "evrakların tamamlanması";

  return (
    <>
      <PageHeader title="Kursiyer" sub={`Kursiyerler / ${fullName(s)}`} />

      {sp.adaydan && (
        <Notice kind="success">
          Aday kaydından kursiyere dönüştürüldü. Süreç ön kayıt aşamasından başlar; sıradaki adım evrakların tamamlanması.
        </Notice>
      )}

      <Card className="p-[22px]">
        <div className="flex items-start gap-[18px] flex-wrap">
          <PersonAvatar name={fullName(s)} size={62} />
          <div className="flex flex-col gap-[7px] min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="h-section">{fullName(s)}</h1>
              <Badge kind="brand">{s.licenseClass} sınıfı</Badge>
              <Badge kind={status.kind} dot>{status.label}</Badge>
            </div>
            <div className="flex gap-4 items-center flex-wrap">
              <span className="text-[13px] text-text-2 tabular">{maskPhone(s.phone)}</span>
              {s.nationalId && <span className="text-xs text-muted tabular">TC: {maskNationalId(s.nationalId)}</span>}
              {s.birthDate && <span className="text-xs text-muted">Doğum: {date(s.birthDate)}</span>}
              <span className="text-xs text-muted">Kayıt: {date(s.registeredAt)}</span>
              {s.fileNo && <span className="text-xs text-muted tabular">Dosya no: {s.fileNo}</span>}
              <span className="text-xs text-muted">Aşama: {STAGE_LABEL[s.stage as StudentStage] ?? s.stage}</span>
            </div>
            {s.address && <span className="text-xs text-muted">{s.address}</span>}
            {s.notes && <span className="text-xs text-muted italic">{s.notes}</span>}
          </div>
          <div className="ml-auto flex gap-2 items-center">
            {showEdit && <Link href={`/app/kursiyerler/yeni?duzenle=${s.id}`} className="btn btn-secondary btn-sm"><Icon name="edit" size={15} />Düzenle</Link>}
            <Link href={`/app/mesajlar/${s.id}`} className="btn btn-secondary btn-sm"><Icon name="message" size={15} />Mesaj</Link>
            {showFinance && <Link href={`/app/finans/tahsilat?kursiyer=${s.id}`} className="btn btn-secondary btn-sm"><Icon name="wallet" size={15} />Tahsilat</Link>}
            <Link href={`/app/dersler/yeni?kursiyer=${s.id}`} className="btn btn-primary btn-sm"><Icon name="plus" size={15} />Ders planla</Link>
          </div>
        </div>

        <div className="mt-5 pt-[18px] border-t border-border flex items-center gap-6 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-baseline gap-2 mb-2.5 flex-wrap">
              <span className="text-[13.5px] font-semibold">Ehliyet sürecinde %{d.overallPercent} tamamlandı</span>
              <span className="text-xs text-muted">Sonraki adım: {nextStep}</span>
            </div>
            <ProgressBar value={d.overallPercent} grad height={9} />
          </div>
          <div className="flex gap-6 pl-[22px] border-l border-border flex-wrap">
            <Metric label="Teorik" value={d.theoryTotal ? `%${d.attendancePercent}` : "—"} />
            <Metric label="e-Sınav" value={d.etestPassed ? String(d.etestPassed.score ?? "—") : "—"} />
            <Metric label="Direksiyon" value={`${Math.round(d.doneHours * 10) / 10}/${d.requiredHours} s`} />
            {showFinance && <Metric label="Kalan borç" value={money(d.payment.rest)} tone="text-blue" />}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[342px_1fr_292px] gap-4 items-start">
        <Card>
          <h2 className="h-card px-5 pt-5">Süreç</h2>
          <div className="px-5 pb-5 pt-3.5">
            {d.timeline.map((step, i) => (
              <div key={step.key} className="flex gap-3 min-h-[52px]">
                <div className="flex flex-col items-center">
                  <span className={`tick tick-${step.state}`}>
                    <Icon name={step.state === "done" ? "check" : step.state === "now" ? "clock" : "chev-right"} size={13} strokeWidth={2.4} />
                  </span>
                  {i < d.timeline.length - 1 && <span className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className="flex flex-col gap-0.5 pb-3.5">
                  <span className={`text-[13.5px] ${step.state === "todo" ? "font-medium text-muted" : "font-semibold"}`}>{step.title}</span>
                  <span className="text-xs text-text-2 tabular">{step.date}</span>
                  {step.sub && <span className="text-xs text-muted">{step.sub}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <header className="flex items-center gap-2.5 px-5 pt-5 flex-wrap">
              <h2 className="h-card">Direksiyon gelişimi</h2>
              <span className="text-xs text-muted">Eğitmen değerlendirmesi</span>
              {d.skillAverage !== null && <span className="ml-auto text-[13px] font-semibold text-text-2">Ortalama {d.skillAverage.toFixed(1).replace(".", ",")} / 5</span>}
            </header>
            <div className="px-5 pb-5 pt-2">
              {d.skillAverage === null ? (
                <p className="text-[13px] text-text-2 py-6 text-center">Henüz değerlendirme girilmemiş. Eğitmen ders sonunda gelişim alanlarını puanlar.</p>
              ) : (
                d.skillScores.map((sk) => (
                  <div key={sk.key} className="flex items-center gap-3 py-2.5 border-t border-border first:border-t-0">
                    <span className="text-[13px] flex-1">{sk.label}</span>
                    <span className={`text-[13px] w-[104px] text-right ${sk.score === null ? "text-muted" : sk.score <= 2 ? "text-warning" : sk.score === 3 ? "text-text-2" : "text-success"}`}>
                      {sk.score === null ? "—" : SCORE_LABEL[sk.score]}
                    </span>
                    <span className="flex gap-1 w-[65px] justify-end">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className="w-[9px] h-[9px] rounded-full" style={{ background: sk.score !== null && n <= sk.score ? "var(--virel-blue)" : "var(--virel-border)" }} />
                      ))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <header className="flex items-center gap-2.5 px-5 pt-5">
              <h2 className="h-card">Son dersler</h2>
              <Link href={`/app/dersler?kursiyer=${s.id}`} className="ml-auto text-[13px] font-semibold text-blue">{d.lessons.length} dersin tümü →</Link>
            </header>
            <div className="px-5 pb-5 pt-2">
              {d.doneLessons.length === 0 ? (
                <p className="text-[13px] text-text-2 py-6 text-center">Henüz tamamlanmış ders yok.</p>
              ) : (
                d.doneLessons.slice(0, 4).map((l, i) => (
                  <div key={l.id} className="py-3 border-t border-border first:border-t-0 flex gap-3.5">
                    <div className="w-[132px] shrink-0 flex flex-col gap-0.5">
                      <span className="text-[13.5px] font-semibold">{d.doneLessons.length - i}. ders</span>
                      <span className="text-xs text-muted tabular">{date(l.startsAt)} · {time(l.startsAt)}</span>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex gap-2 items-center">
                        <span className="text-[13px] text-text-2">{l.instructor.name}</span>
                        <span className="text-xs text-muted">·</span>
                        <span className="text-[13px] text-text-2 tabular">{l.vehicle.plate}</span>
                      </div>
                      {l.reviewNote && <span className="text-[13px] text-text-2 leading-relaxed">{l.reviewNote}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <header className="flex items-center gap-2.5 px-5 pt-5">
              <h2 className="h-card">Yaklaşan ders</h2>
              {d.upcoming && <Badge kind="brand">{date(d.upcoming.startsAt) === date(new Date()) ? "Bugün" : date(d.upcoming.startsAt)}</Badge>}
            </header>
            <div className="px-5 pb-5 pt-3.5">
              {d.upcoming ? (
                <div className="p-3.5 rounded-md bg-blue-050 flex flex-col gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-xl font-bold tabular">{time(d.upcoming.startsAt)}</span>
                    <span className="text-[13px] text-text-2">–{time(d.upcoming.endsAt)}</span>
                  </div>
                  <span className="flex items-center gap-2 text-[13px]"><Icon name="badge-id" size={15} className="text-blue-700" />{d.upcoming.instructor.name}</span>
                  <span className="flex items-center gap-2 text-[13px] tabular"><Icon name="car" size={15} className="text-blue-700" />{d.upcoming.vehicle.plate}</span>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-[13px] text-text-2">Planlanmış ders yok.</p>
                  <Link href={`/app/dersler/yeni?kursiyer=${s.id}`} className="btn btn-secondary btn-xs mt-3"><Icon name="plus" size={14} />Ders planla</Link>
                </div>
              )}
            </div>
          </Card>

          {canManageUsers && (
            <Card title="Kursiyer portalı" sub="Mobil kursiyer erişimi (/kursiyer)">
              <div className="px-5 pb-5 pt-1">
                <AccessGrantForm action={grantStudentAccessAction} entityId={s.id} defaultEmail={s.email ?? undefined} existing={s.user} />
              </div>
            </Card>
          )}

          {showFinance && (
            <Card>
              <div className="flex items-center gap-3 px-5 pt-5">
                <h2 className="h-card">Ödeme planı</h2>
                <Link href={`/app/finans/kursiyer/${s.id}`} className="ml-auto text-[13px] font-semibold text-blue">Finans detayı →</Link>
              </div>
              <div className="px-5 pb-5">
                {d.payment.installments.length === 0 ? (
                  <p className="text-[13px] text-text-2 py-5 text-center">Ödeme planı oluşturulmamış.</p>
                ) : (
                  <>
                    <Row label="Toplam ücret" value={money(d.payment.total)} />
                    <Row label="Ödenen" value={money(d.payment.paid)} tone="text-success" />
                    <Row label="Kalan" value={money(d.payment.rest)} tone="text-blue" strong />
                    <Row label="Sonraki taksit" value={d.payment.nextDue ? date(d.payment.nextDue.dueAt) : "—"} />
                    {d.payment.overdue.length > 0 && <Row label="Gecikmiş" value={`${d.payment.overdue.length} taksit`} tone="text-danger" />}
                    <div className="mt-3.5"><ProgressBar value={d.payment.percent} height={6} /></div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-xs text-muted">{d.payment.installments.filter((i) => i.status === "PAID").length} / {d.payment.installments.length} taksit ödendi</span>
                      <span className="text-xs text-text-2 font-semibold">%{d.payment.percent}</span>
                    </div>
                    <div className="mt-4 pt-3.5 border-t border-border flex flex-col gap-1.5">
                      {d.payment.installments.map((i) => {
                        const st = INSTALLMENT_STATUS_LABEL[i.status === "PENDING" && i.dueAt < new Date() ? "OVERDUE" : i.status] ?? INSTALLMENT_STATUS_LABEL.PENDING;
                        return (
                          <div key={i.id} className="flex items-center gap-2 text-[13px]">
                            <span className="w-[68px] shrink-0">{i.label}</span>
                            <span className="tabular font-semibold">{money(i.amount)}</span>
                            <span className="text-xs text-muted tabular ml-auto">{date(i.dueAt)}</span>
                            <Badge kind={st.kind} dot={st.kind === "success"}>{st.label}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          <Card>
            <header className="flex items-center gap-2.5 px-5 pt-5">
              <h2 className="h-card">Evraklar</h2>
              <Badge kind={d.docsOk === d.docsTotal ? "success" : "warning"} dot>{d.docsOk}/{d.docsTotal} tamam</Badge>
              {showDocEdit && <Link href={`/app/belgeler/${s.id}`} className="ml-auto text-[13px] font-semibold text-blue">Belgeleri düzenle →</Link>}
            </header>
            <div className="px-5 pb-5 pt-2">
              {s.documents.map((doc) => {
                const st = DOCUMENT_STATUS_LABEL[doc.status] ?? DOCUMENT_STATUS_LABEL.PENDING;
                const color = doc.status === "OK" ? "text-success" : doc.status === "REVIEW" ? "text-blue" : doc.status === "PENDING" ? "text-warning" : "text-danger";
                return (
                  <div key={doc.id} className="flex items-center gap-2.5 py-2 border-t border-border first:border-t-0">
                    <Icon name={doc.status === "OK" ? "check-circle" : doc.status === "REVIEW" ? "eye" : doc.status === "PENDING" ? "clock" : "alert"} size={15} className={color} />
                    <span className="text-[13px] min-w-0 truncate">{docLabel.get(doc.type) ?? doc.type}</span>
                    <span className="text-xs text-muted ml-auto">{st.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <header className="flex items-center gap-2.5 px-5 pt-5">
              <h2 className="h-card">Sınavlar</h2>
              {(s.stage === "THEORY" || s.stage === "ETEST_WAITING") && (
                <Link href={`/app/sinavlar/yeni?tur=ETEST&kursiyer=${s.id}`} className="ml-auto text-[13px] font-semibold text-blue">e-Sınav planla</Link>
              )}
              {(s.stage === "DRIVING" || s.stage === "DRIVING_EXAM") && (
                <Link href={`/app/sinavlar/yeni?tur=DRIVING&kursiyer=${s.id}`} className="ml-auto text-[13px] font-semibold text-blue">Sınav planla</Link>
              )}
            </header>
            <div className="px-5 pb-5 pt-3 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[13px] w-[86px]">e-Sınav</span>
                <ExamAttempts used={d.etest.filter((e) => e.status === "DONE").length} total={d.attemptsAllowed} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] w-[86px]">Direksiyon</span>
                <ExamAttempts used={d.drivingExams.filter((e) => e.status === "DONE").length} total={d.attemptsAllowed} />
              </div>

              {[...d.etest, ...d.drivingExams].length > 0 && (
                <div className="flex flex-col gap-1.5 pt-2 mt-1 border-t border-border">
                  {[...d.etest, ...d.drivingExams]
                    .sort((a, b) => (b.scheduledAt?.getTime() ?? 0) - (a.scheduledAt?.getTime() ?? 0))
                    .slice(0, 4)
                    .map((e) => (
                      <Link key={e.id} href={`/app/sinavlar/${e.id}`} className="flex items-center gap-2 text-[13px] hover:text-blue">
                        <span className="text-text-2">{e.type === "ETEST" ? "e-Sınav" : "Direksiyon"} · {e.attemptNo}. hak</span>
                        <span className="ml-auto">
                          {e.status === "DONE" ? (
                            <Badge kind={e.result === "PASSED" ? "success" : "danger"} dot>{e.result === "PASSED" ? "Başarılı" : "Başarısız"}</Badge>
                          ) : (
                            <Badge kind="brand">{e.scheduledAt ? date(e.scheduledAt) : "Planlandı"}</Badge>
                          )}
                        </span>
                      </Link>
                    ))}
                </div>
              )}

              <p className="text-xs text-muted leading-relaxed mt-1">
                Hak sayısı mevzuata bağlıdır ve <b>Ayarlar › Mevzuat</b> ekranından değiştirilir.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="stat-lbl">{label}</span>
      <span className={`font-display text-[17px] font-semibold tabular ${tone}`}>{value}</span>
    </div>
  );
}

function Row({ label, value, tone = "", strong }: { label: string; value: string; tone?: string; strong?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-t border-border first:border-t-0">
      <span className="text-[13px] text-text-2">{label}</span>
      <span className={`ml-auto text-[13.5px] tabular ${strong ? "font-bold" : "font-semibold"} ${tone}`}>{value}</span>
    </div>
  );
}
