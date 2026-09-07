import Link from "next/link";
import type { Metadata } from "next";
import { requireInstructorUser } from "@/lib/auth";
import { instructorToday } from "@/lib/mobile";
import { Badge, PersonAvatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { THEORY_CATEGORY_LABEL } from "@/lib/constants";
import { dateLong, time } from "@/lib/format";

export const metadata: Metadata = { title: "Bugün" };

export default async function InstructorTodayPage({ searchParams }: PageProps<"/egitmen">) {
  const { user, instructor } = await requireInstructorUser();
  const sp = await searchParams;
  const data = await instructorToday(instructor.schoolId, instructor.id, instructor.branch);
  const hour = new Date().getHours();
  const greeting = hour < 6 ? "İyi geceler" : hour < 11 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";

  return (
    <>
      <div className="px-4 pt-[max(20px,env(safe-area-inset-top))] pb-3.5 flex items-center gap-2.5">
        <PersonAvatar name={user.name} size={38} />
        <div className="flex flex-col">
          <span className="text-[13px] text-text-2">{greeting}</span>
          <span className="font-display text-[18px] font-bold">{user.name}</span>
        </div>
        <Link href="/app" className="ml-auto text-xs font-semibold text-blue">Masaüstü</Link>
      </div>

      {sp.tamamlandi && (
        <div className="mx-4 mb-3 px-3.5 py-2.5 rounded-sm bg-success-bg text-[13px] flex items-center gap-2">
          <Icon name="check-circle" size={15} className="text-success" />Ders tamamlandı.
        </div>
      )}

      <div className="px-4 pb-3.5 flex gap-2.5">
        <div className="card p-3 flex-1">
          <span className="stat-lbl">Bugün</span>
          <div className="font-display text-[20px] font-bold mt-1">{data.lessons.length} ders</div>
        </div>
        <div className="card p-3 flex-1">
          <span className="stat-lbl">Bu hafta</span>
          <div className="font-display text-[20px] font-bold tabular mt-1">{data.weeklyHours} saat</div>
        </div>
      </div>

      <div className="px-4 flex items-center gap-2 pb-2">
        <span className="text-[15px] font-semibold">Bugün</span>
        <span className="text-[13px] text-muted">{dateLong(new Date())}</span>
      </div>

      <div className="flex-1 px-4 flex flex-col gap-2.5">
        {data.lessons.length === 0 ? (
          <div className="card p-4 flex items-center gap-2.5">
            <Icon name="calendar" size={18} className="text-muted" />
            <span className="text-[13px] text-text-2">Bugün planlı dersin yok.</span>
          </div>
        ) : data.branch === "DRIVING" ? (
          data.lessons.map((l) => <DrivingRow key={l.id} lesson={l} />)
        ) : (
          data.lessons.map((l) => (
            <Link key={l.id} href={`/app/teorik/${l.id}`} className="card p-3.5 flex items-center gap-3">
              <div className="flex flex-col w-[52px] shrink-0">
                <span className="font-display text-[14px] font-semibold tabular">{time(l.startsAt)}</span>
                <span className="text-xs text-muted tabular">{time(l.endsAt)}</span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[13px] font-semibold truncate">{l.topic}</span>
                <span className="text-xs text-muted truncate">{THEORY_CATEGORY_LABEL[l.category] ?? l.category} · {l.room ?? "derslik yok"}</span>
              </div>
              <span className="ml-auto shrink-0 flex items-center gap-1.5 text-xs text-muted"><Icon name="users" size={13} />{l._count.attendances}</span>
            </Link>
          ))
        )}
      </div>
    </>
  );
}

type DrivingLesson = Awaited<ReturnType<typeof instructorToday>> extends infer T ? T extends { branch: "DRIVING"; lessons: (infer L)[] } ? L : never : never;

function DrivingRow({ lesson: l }: { lesson: DrivingLesson }) {
  const now = new Date();
  // LIVE de "sıradaki" sayılır: kapatılmayı bekleyen, saati gelmiş bir ders demektir.
  const isNow = (l.status === "PLANNED" || l.status === "LIVE") && l.startsAt <= now;
  const isDone = l.status === "DONE";
  const isCancelled = l.status === "CANCELLED" || l.status === "NO_SHOW";

  if (isNow) {
    return (
      <div className="card p-4 border-blue">
        <div className="flex items-center gap-2">
          <span className="font-display text-[20px] font-bold tabular">{time(l.startsAt)}</span>
          <span className="text-[13px] text-muted tabular">–{time(l.endsAt)}</span>
          <span className="ml-auto"><Badge kind="brand" dot>Sıradaki</Badge></span>
        </div>
        <div className="flex items-center gap-2.5 mt-3.5">
          <PersonAvatar name={l.student.firstName + " " + l.student.lastName} size={38} />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[14.5px] font-semibold truncate">{l.student.firstName} {l.student.lastName}</span>
            <span className="text-xs text-muted tabular truncate">{l.student.licenseClass} sınıfı · {l.vehicle?.plate ?? "—"}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-3.5">
          <Link href={`/egitmen/ders/${l.id}`} className="btn btn-primary flex-1"><Icon name="check" size={16} />Dersi tamamla</Link>
          <a href={`tel:${l.student.phone}`} className="ibtn w-11 h-11"><Icon name="phone" size={17} /></a>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-3.5 flex items-center gap-3 ${isDone || isCancelled ? "opacity-60" : ""}`}>
      <div className="flex flex-col w-[52px] shrink-0">
        <span className="font-display text-[14px] font-semibold tabular">{time(l.startsAt)}</span>
        <span className="text-xs text-muted tabular">{time(l.endsAt)}</span>
      </div>
      <PersonAvatar name={l.student.firstName + " " + l.student.lastName} size={32} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[13.5px] font-semibold truncate">{l.student.firstName} {l.student.lastName}</span>
        <span className="text-xs text-muted tabular truncate">{l.student.licenseClass} · {l.vehicle?.plate ?? "—"}</span>
      </div>
      <span className="ml-auto shrink-0">
        {isDone ? <Badge kind="success" dot>Tamamlandı</Badge>
          : isCancelled ? <Badge kind="danger">{l.status === "NO_SHOW" ? "Gelmedi" : "İptal"}</Badge>
          : <Link href={`/egitmen/ders/${l.id}`}><Icon name="chev-right" size={17} className="text-muted" /></Link>}
      </span>
    </div>
  );
}
