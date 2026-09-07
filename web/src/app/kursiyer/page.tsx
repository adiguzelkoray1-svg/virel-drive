import Link from "next/link";
import type { Metadata } from "next";
import { requireStudentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStudentDetail } from "@/lib/student";
import { Icon } from "@/components/icons";
import { Badge, ProgressBar } from "@/components/ui";
import { date, money, time } from "@/lib/format";

export const metadata: Metadata = { title: "Ana sayfa" };

export default async function StudentHomePage() {
  const { user, student: s } = await requireStudentUser();
  const [d, school] = await Promise.all([
    getStudentDetail(s.schoolId, s.id),
    prisma.school.findUnique({ where: { id: s.schoolId } }),
  ]);
  if (!d) return null;
  const nextStep = d.timeline.find((t) => t.state === "now") ?? d.timeline.find((t) => t.state === "todo");
  const remainingHours = Math.max(0, d.requiredHours - d.doneHours);

  return (
    <>
      <div className="virel-gradient-bg px-5 pt-[max(20px,env(safe-area-inset-top))] pb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-display text-[19px] font-bold">Merhaba {user.name.split(" ")[0]} 👋</span>
            <span className="text-[13px] opacity-85 mt-0.5">{school?.name ?? "Sürücü kursu"} · {s.licenseClass} sınıfı</span>
          </div>
          <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center ml-auto shrink-0"><Icon name="bell" size={17} /></span>
        </div>

        <div className="mt-4 bg-white/15 rounded-[16px] p-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] opacity-90">Ehliyet sürecin</span>
            <span className="font-display text-[26px] font-bold tabular ml-auto">%{d.overallPercent}</span>
          </div>
          <div className="h-2 rounded-full bg-white/25 mt-2.5 overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${d.overallPercent}%` }} />
          </div>
          {nextStep && (
            <div className="text-[13px] opacity-90 mt-2.5">Sonraki adım: <b>{nextStep.title.toLocaleLowerCase("tr")}</b>{nextStep.sub ? ` · ${nextStep.sub}` : ""}</div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 flex flex-col gap-3">
        {d.upcoming ? (
          <div className="card p-4">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold">Yaklaşan ders</span>
              <span className="ml-auto"><Badge kind="brand">{isTomorrow(d.upcoming.startsAt) ? "Yarın" : date(d.upcoming.startsAt)}</Badge></span>
            </div>
            <div className="flex items-center gap-3.5 mt-3.5">
              <div className="flex flex-col">
                <span className="font-display text-[24px] font-bold tabular">{time(d.upcoming.startsAt)}</span>
                <span className="text-[13px] text-muted tabular">–{time(d.upcoming.endsAt)}</span>
              </div>
              <div className="w-px h-9 bg-border" />
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[13px]"><Icon name="badge-id" size={14} className="text-muted" />{d.upcoming.instructor.name}</span>
                <span className="flex items-center gap-1.5 text-[13px] tabular"><Icon name="car" size={14} className="text-muted" />{d.upcoming.vehicle?.plate ?? "—"}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3.5">
              {school?.phone && (
                <a href={`tel:${school.phone}`} className="btn btn-secondary btn-sm flex-1"><Icon name="phone" size={15} />Ara</a>
              )}
              <Link href="/kursiyer/mesajlar" className="btn btn-secondary btn-sm flex-1"><Icon name="message" size={15} />Kursa yaz</Link>
            </div>
          </div>
        ) : (
          <div className="card p-4 flex items-center gap-3">
            <Icon name="calendar" size={18} className="text-muted" />
            <span className="text-[13px] text-text-2">Planlanmış bir dersin yok.</span>
          </div>
        )}

        <div className="flex gap-3">
          <div className="card p-3.5 flex-1">
            <span className="stat-lbl">Kalan ders</span>
            <div className="font-display text-[20px] font-bold tabular mt-1">{remainingHours.toFixed(1)} saat</div>
            <div className="mt-2"><ProgressBar value={d.drivingPercent} height={5} /></div>
          </div>
          <div className="card p-3.5 flex-1">
            <span className="stat-lbl">Kalan borç</span>
            <div className="font-display text-[20px] font-bold tabular mt-1 text-blue">{money(d.payment.rest)}</div>
            <div className="text-xs text-muted mt-1.5">{d.payment.nextDue ? `Vade ${date(d.payment.nextDue.dueAt)}` : "Vade yok"}</div>
          </div>
        </div>

        {(() => {
          const passedExam = d.etestPassed ?? d.drivingPassed;
          if (!passedExam) return null;
          return (
            <Link href="/kursiyer/ilerlemem" className="card p-3.5 flex items-center gap-3">
              <span className="w-8 h-8 rounded-md bg-success-bg text-success flex items-center justify-center shrink-0"><Icon name="exam" size={16} /></span>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold">
                  {d.etestPassed ? `e-Sınav sonucun: ${d.etestPassed.score} puan` : `Direksiyon sınavın başarılı`}
                </span>
                <span className="text-xs text-muted">{passedExam.scheduledAt ? date(passedExam.scheduledAt) : "—"} · başarılı</span>
              </div>
              <Icon name="chev-right" size={16} className="text-muted ml-auto shrink-0" />
            </Link>
          );
        })()}
      </div>
    </>
  );
}

function isTomorrow(d: Date) {
  const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(0, 0, 0, 0);
  const e = new Date(t); e.setHours(23, 59, 59, 999);
  return d >= t && d <= e;
}
