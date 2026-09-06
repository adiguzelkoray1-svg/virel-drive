import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { Badge, Card, ExamAttempts, PageHeader, PersonAvatar } from "@/components/ui";
import { EXAM_STATUS_LABEL, STAGE_LABEL, type StudentStage } from "@/lib/constants";
import { attemptInfo } from "@/lib/exam";
import { dateTime, fullName } from "@/lib/format";
import { can } from "@/lib/permissions";
import { cancelExamAction } from "@/app/actions/exams";
import { ResultForm } from "./ResultForm";

export const metadata: Metadata = { title: "Sınav" };

const NOTICE: Record<string, string> = {
  planlandi: "Sınav planlandı.",
  sonuclandi: "Sonuç kaydedildi.",
  iptal: "Sınav iptal edildi.",
};

export default async function ExamDetailPage({ params, searchParams }: PageProps<"/app/sinavlar/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requirePermission("exam.read");
  const schoolId = user.schoolId;

  const exam = await prisma.exam.findFirst({ where: { id, schoolId }, include: { student: true } });
  if (!exam) notFound();

  const canWrite = can(user.role, "exam.write");
  const type = exam.type as "ETEST" | "DRIVING";
  const info = await attemptInfo(schoolId, exam.studentId, type);
  const st = EXAM_STATUS_LABEL[exam.status] ?? EXAM_STATUS_LABEL.PLANNED;

  const notice = Object.entries(NOTICE).find(([k]) => typeof sp[k] === "string")?.[1];

  return (
    <>
      <PageHeader title="Sınav" sub={`Sınavlar / ${fullName(exam.student)} · ${type === "ETEST" ? "e-Sınav" : "Direksiyon Sınavı"}`}>
        <Link href="/app/sinavlar" className="btn btn-secondary btn-sm"><Icon name="exam" size={15} />Sınavlar</Link>
        <Link href={`/app/kursiyerler/${exam.studentId}`} className="btn btn-secondary btn-sm"><Icon name="user" size={15} />Kursiyer kartı</Link>
      </PageHeader>

      {notice && (
        <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-success-bg">
          <Icon name="check-circle" size={16} className="text-success" />{notice}
        </div>
      )}

      <Card className="p-[22px]">
        <div className="flex items-start gap-[18px] flex-wrap">
          <PersonAvatar name={fullName(exam.student)} size={54} />
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link href={`/app/kursiyerler/${exam.studentId}`} className="h-section text-text hover:text-blue">{fullName(exam.student)}</Link>
              <Badge kind="brand">{exam.student.licenseClass} sınıfı</Badge>
              <Badge kind={st.kind} dot={exam.status === "DONE"}>{st.label}</Badge>
            </div>
            <div className="flex gap-4 items-center flex-wrap text-[13px] text-text-2">
              <span className="flex items-center gap-1.5"><Icon name="exam" size={15} className="text-muted" />{type === "ETEST" ? "e-Sınav" : "Direksiyon sınavı"} · {exam.attemptNo}. hak</span>
              {exam.scheduledAt && <span className="flex items-center gap-1.5 tabular"><Icon name="clock" size={15} className="text-muted" />{dateTime(exam.scheduledAt)}</span>}
              {exam.place && <span className="flex items-center gap-1.5"><Icon name="building" size={15} className="text-muted" />{exam.place}</span>}
              <span className="text-xs text-muted">Kursiyer aşaması: {STAGE_LABEL[exam.student.stage as StudentStage] ?? exam.student.stage}</span>
            </div>
          </div>
          <div className="ml-auto"><ExamAttempts used={info.used} total={info.allowed} /></div>
        </div>

        {exam.status === "DONE" && (
          <div className="mt-5 pt-[18px] border-t border-border flex items-center gap-4 flex-wrap">
            <Badge kind={exam.result === "PASSED" ? "success" : "danger"} dot>{exam.result === "PASSED" ? "Başarılı" : "Başarısız"}</Badge>
            {exam.score !== null && <span className="text-[13px] text-text-2">Puan: <b className="tabular">{exam.score}</b></span>}
            {exam.failReason && <span className="text-[13px] text-text-2">Neden: {exam.failReason}</span>}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 items-start">
        {canWrite && exam.status !== "DONE" && exam.status !== "CANCELLED" && (
          <Card title="Sonucu kaydet" sub="Sınav gerçekleştikten sonra doldurun">
            <div className="px-5 pb-5 pt-1"><ResultForm examId={exam.id} type={type} /></div>
          </Card>
        )}

        {exam.status === "DONE" && (
          <Card title="Sınav tamamlandı" sub="Sonuç kaydedildi, değiştirmek için destek ile iletişime geçin">
            <p className="px-5 py-6 text-[13px] text-text-2 leading-relaxed">
              {exam.result === "PASSED"
                ? type === "ETEST"
                  ? "Kursiyer bu sonuçla direksiyon eğitimi aşamasına geçti."
                  : "Kursiyer bu sonuçla mezun oldu."
                : "Kursiyer bu sınav türünde tekrar başvurabilir (hakkı varsa)."}
            </p>
          </Card>
        )}

        {exam.status === "CANCELLED" && (
          <Card title="Sınav iptal edildi">
            <p className="px-5 py-6 text-[13px] text-text-2">Bu sınav kaydı iptal edilmiştir; kursiyerin hakkını etkilemez.</p>
          </Card>
        )}

        <div className="flex flex-col gap-4">
          {canWrite && exam.status !== "DONE" && exam.status !== "CANCELLED" && (
            <Card title="Sınav durumu">
              <div className="px-5 py-4">
                <form action={cancelExamAction}>
                  <input type="hidden" name="examId" value={exam.id} />
                  <button className="btn btn-danger btn-sm w-full"><Icon name="x" size={15} />Sınavı iptal et</button>
                </form>
              </div>
            </Card>
          )}

          <Card title="Sınav hakkı">
            <div className="px-5 pb-5 pt-1 flex flex-col gap-3">
              <ExamAttempts used={info.used} total={info.allowed} />
              <p className="text-xs text-muted leading-relaxed">
                Hak sayısı sınıf bazında mevzuat ayarındadır; <b>Ayarlar › Mevzuat</b>&apos;tan değiştirilir.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
