import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireInstructorUser } from "@/lib/auth";
import { getLessonForReview } from "@/lib/mobile";
import { PersonAvatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { date, time } from "@/lib/format";
import { MobileReviewForm } from "./MobileReviewForm";

export const metadata: Metadata = { title: "Ders değerlendirmesi" };

export default async function InstructorLessonReviewPage({ params }: PageProps<"/egitmen/ders/[id]">) {
  const { instructor } = await requireInstructorUser();
  const { id } = await params;

  const d = await getLessonForReview(instructor.schoolId, instructor.id, id);
  if (!d) notFound();
  const { lesson: l } = d;
  const name = `${l.student.firstName} ${l.student.lastName}`;

  return (
    <div className="px-4 pt-[max(20px,env(safe-area-inset-top))] pb-4 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <Link href="/egitmen" className="ibtn ibtn-ghost"><Icon name="chev-left" size={19} /></Link>
        <span className="font-display text-[18px] font-bold">Ders değerlendirmesi</span>
      </div>

      <div className="card p-3.5 flex items-center gap-3">
        <PersonAvatar name={name} size={40} />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[15px] font-semibold truncate">{name}</span>
          <span className="text-xs text-muted tabular">{date(l.startsAt)} · {time(l.startsAt)}–{time(l.endsAt)} · {l.vehicle?.plate ?? "—"}</span>
        </div>
      </div>

      <MobileReviewForm lessonId={l.id} note={l.reviewNote} scores={d.scores} />
    </div>
  );
}
