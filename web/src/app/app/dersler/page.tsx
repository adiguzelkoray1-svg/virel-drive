import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { Badge, Card, Chip, EmptyState, PageHeader, PersonAvatar } from "@/components/ui";
import { LESSON_KIND_LABEL, LESSON_STATUS_LABEL } from "@/lib/constants";
import { date, fullName, time } from "@/lib/format";
import { addDays, startOfDay, endOfDay } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Direksiyon dersleri" };

const PAGE_SIZE = 30;
const COLS = "150px minmax(170px,1fr) 44px 150px 118px 132px 128px 18px";

const FILTERS = [
  { key: "bugun", label: "Bugün" },
  { key: "hafta", label: "Bu hafta" },
  { key: "planli", label: "Planlı" },
  { key: "tamamlanan", label: "Tamamlanan" },
  { key: "iptal", label: "İptal / gelmedi" },
  { key: "tumu", label: "Tümü" },
] as const;

function whereFor(key: string) {
  const now = new Date();
  switch (key) {
    case "bugun": return { startsAt: { gte: startOfDay(), lte: endOfDay() } };
    case "hafta": return { startsAt: { gte: startOfDay(), lte: addDays(now, 7) } };
    case "planli": return { status: { in: ["PLANNED", "LIVE"] } };
    case "tamamlanan": return { status: "DONE" };
    case "iptal": return { status: { in: ["CANCELLED", "NO_SHOW"] } };
    default: return {};
  }
}

export default async function LessonsPage({ searchParams }: PageProps<"/app/dersler">) {
  const user = await requirePermission("lesson.read");
  const schoolId = user.schoolId;
  const sp = await searchParams;

  const studentId = typeof sp.kursiyer === "string" ? sp.kursiyer : undefined;
  // Kursiyer süzgeciyle gelindiğinde varsayılan "tümü": o kursiyerin bu hafta dersi olmayabilir.
  const filterKey = typeof sp.filtre === "string" && FILTERS.some((f) => f.key === sp.filtre) ? sp.filtre : studentId ? "tumu" : "hafta";
  const instructorId = typeof sp.egitmen === "string" && sp.egitmen ? sp.egitmen : undefined;
  const page = Math.max(1, Number(sp.sayfa) || 1);

  const where = { schoolId, ...whereFor(filterKey), ...(studentId ? { studentId } : {}), ...(instructorId ? { instructorId } : {}) };

  const [lessons, total, counts, instructors, student] = await Promise.all([
    prisma.drivingLesson.findMany({
      where,
      include: { student: true, instructor: true, vehicle: true },
      orderBy: { startsAt: filterKey === "tamamlanan" || filterKey === "iptal" ? "desc" : "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.drivingLesson.count({ where }),
    Promise.all(FILTERS.map((f) => prisma.drivingLesson.count({ where: { schoolId, ...whereFor(f.key), ...(studentId ? { studentId } : {}) } }))),
    prisma.instructor.findMany({ where: { schoolId, branch: "DRIVING", isActive: true }, orderBy: { name: "asc" } }),
    studentId ? prisma.student.findFirst({ where: { id: studentId, schoolId } }) : Promise.resolve(null),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const base: Record<string, string | number | undefined> = { filtre: filterKey, kursiyer: studentId, egitmen: instructorId, ...over };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, String(v));
    const s = p.toString();
    return s ? `/app/dersler?${s}` : "/app/dersler";
  };

  return (
    <>
      <PageHeader
        title="Direksiyon dersleri"
        sub={student ? `${fullName(student)} · ${total} ders` : `${total} ders listeleniyor`}
      >
        {student && <Link href="/app/dersler" className="btn btn-secondary btn-sm"><Icon name="x" size={15} />Kursiyer filtresini kaldır</Link>}
        <Link href="/app/takvim" className="btn btn-secondary btn-sm"><Icon name="calendar" size={15} />Takvim</Link>
        <Link href="/app/dersler/yeni" className="btn btn-primary btn-sm"><Icon name="plus" size={15} />Yeni ders</Link>
      </PageHeader>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f, i) => (
          <Chip key={f.key} href={qs({ filtre: f.key, sayfa: undefined })} active={f.key === filterKey}>{f.label} {counts[i]}</Chip>
        ))}
      </div>

      <Card>
        <form className="flex items-center gap-3 px-5 pt-5 pb-3.5 flex-wrap">
          <input type="hidden" name="filtre" value={filterKey} />
          {studentId && <input type="hidden" name="kursiyer" value={studentId} />}
          <select name="egitmen" defaultValue={instructorId ?? ""} className="input h-9 text-[13px] w-[190px]" aria-label="Eğitmen filtresi">
            <option value="">Eğitmen: Tümü</option>
            {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm">Uygula</button>
          <span className="text-xs text-muted ml-auto tabular">{total} dersten {lessons.length} tanesi</span>
        </form>

        {lessons.length === 0 ? (
          <EmptyState
            icon="wheel"
            title="Bu filtrede ders yok."
            desc="Takvimden ya da buradan yeni bir direksiyon dersi planlayabilirsiniz."
            action={<Link href="/app/dersler/yeni" className="btn btn-secondary btn-sm"><Icon name="plus" size={15} />Ders planla</Link>}
          />
        ) : (
          <div className="px-5 pb-4">
            <div className="grid gap-3 items-center pb-2.5" style={{ gridTemplateColumns: COLS }}>
              {["Tarih / saat", "Kursiyer", "Sınıf", "Eğitmen", "Araç", "Tür", "Durum", ""].map((h, i) => <div key={i} className="th">{h}</div>)}
            </div>
            {lessons.map((l) => {
              const st = LESSON_STATUS_LABEL[l.status] ?? LESSON_STATUS_LABEL.PLANNED;
              return (
                <Link key={l.id} href={`/app/dersler/${l.id}`} className="grid gap-3 items-center py-3 border-t border-border" style={{ gridTemplateColumns: COLS }}>
                  <span className="flex flex-col">
                    <span className="text-[13.5px] font-semibold tabular">{date(l.startsAt)}</span>
                    <span className="text-xs text-muted tabular">{time(l.startsAt)}–{time(l.endsAt)}</span>
                  </span>
                  <span className="flex items-center gap-2.5 min-w-0">
                    <PersonAvatar name={fullName(l.student)} size={30} />
                    <span className="text-sm font-semibold truncate">{fullName(l.student)}</span>
                  </span>
                  <Badge kind="brand">{l.student.licenseClass}</Badge>
                  <span className="text-[13px] text-text-2 truncate">{l.instructor.name}</span>
                  <span className="text-[13px] text-text-2 tabular">{l.vehicle.plate}</span>
                  <span className="text-[13px] text-text-2">{LESSON_KIND_LABEL[l.kind] ?? l.kind}</span>
                  <Badge kind={st.kind} dot>{st.label}</Badge>
                  <Icon name="chev-right" size={16} className="text-muted" />
                </Link>
              );
            })}

            {pages > 1 && (
              <div className="flex items-center gap-2.5 pt-4 mt-1 border-t border-border">
                <span className="text-xs text-muted tabular">Sayfa {page} / {pages}</span>
                <div className="ml-auto flex gap-1.5">
                  <Link href={qs({ sayfa: Math.max(1, page - 1) })} className="ibtn"><Icon name="chev-left" size={16} /></Link>
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
