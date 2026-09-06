import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { Badge, Card } from "@/components/ui";
import { weekCalendar, dayCalendar, suggestSlots, startOfWeek, addDays, rowSpan, ROWS, START_HOUR, END_HOUR } from "@/lib/calendar";
import { date, time } from "@/lib/format";

export const metadata: Metadata = { title: "Takvim" };

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const KIND_ICON = { drive: "wheel", theory: "book", exam: "exam", busy: "wrench", clash: "alert" } as const;

export default async function CalendarPage({ searchParams }: PageProps<"/app/takvim">) {
  const user = await requirePermission("lesson.read");
  const schoolId = user.schoolId;
  const sp = await searchParams;

  const view = sp.gorunum === "hafta" ? "hafta" : "gun";
  const offset = Number(sp.hafta) || 0;   // hafta görünümünde hafta, gün görünümünde gün kaydırması
  const weekStart = addDays(startOfWeek(), offset * 7);
  const dayDate = addDays(new Date(new Date().setHours(0, 0, 0, 0)), offset);
  const instructorId = typeof sp.egitmen === "string" && sp.egitmen ? sp.egitmen : undefined;
  const vehicleId = typeof sp.arac === "string" && sp.arac ? sp.arac : undefined;

  const [cal, dayCal, suggestions, instructors, vehicles] = await Promise.all([
    weekCalendar(schoolId, weekStart, { instructorId, vehicleId }),
    dayCalendar(schoolId, dayDate),
    suggestSlots(schoolId, { limit: 4 }),
    prisma.instructor.findMany({ where: { schoolId, branch: "DRIVING", isActive: true }, orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ where: { schoolId, status: "ACTIVE" }, orderBy: { plate: "asc" } }),
  ]);

  const weekEnd = addDays(weekStart, 6);
  const dayLabel = `${dayDate.getDate()} ${MONTHS[dayDate.getMonth()]} ${dayDate.getFullYear()}, ${["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"][dayDate.getDay()]}`;
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${weekStart.getDate()} – ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`
    : `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
  const label = view === "gun" ? dayLabel : weekLabel;
  const active = view === "gun" ? dayCal : cal;

  const todayIdx = Math.floor((new Date(new Date().setHours(0, 0, 0, 0)).getTime() - weekStart.getTime()) / 86_400_000);
  const qs = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const base: Record<string, string | number | undefined> = { gorunum: view === "hafta" ? "hafta" : undefined, hafta: offset || undefined, egitmen: instructorId, arac: vehicleId, ...over };
    for (const [k, v] of Object.entries(base)) if (v !== undefined && v !== "" && v !== 0) p.set(k, String(v));
    const s = p.toString();
    return s ? `/app/takvim?${s}` : "/app/takvim";
  };

  return (
    <>
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex gap-1.5">
          <Link href={qs({ hafta: offset - 1 })} className="ibtn" aria-label="Önceki hafta"><Icon name="chev-left" size={16} /></Link>
          <Link href={qs({ hafta: offset + 1 })} className="ibtn" aria-label="Sonraki hafta"><Icon name="chev-right" size={16} /></Link>
        </div>
        <h1 className="h-card ml-1">{label}</h1>
        {offset !== 0 && <Link href={qs({ hafta: undefined })} className="btn btn-secondary btn-xs">Bugün</Link>}
        <span className="seg ml-2">
          <Link href={qs({ gorunum: undefined, hafta: undefined })} data-active={view === "gun"}>Gün</Link>
          <Link href={qs({ gorunum: "hafta", hafta: undefined })} data-active={view === "hafta"}>Hafta</Link>
        </span>

        <div className="ml-auto flex gap-2 items-center flex-wrap">
          <form className="flex gap-2 items-center">
            {offset !== 0 && <input type="hidden" name="hafta" value={offset} />}
            <select name="egitmen" defaultValue={instructorId ?? ""} className="input h-9 text-[13px] w-[168px]" aria-label="Eğitmen filtresi">
              <option value="">Eğitmen: Tümü</option>
              {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <select name="arac" defaultValue={vehicleId ?? ""} className="input h-9 text-[13px] w-[168px]" aria-label="Araç filtresi">
              <option value="">Araç: Tümü</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
            </select>
            <button className="btn btn-secondary btn-sm">Uygula</button>
          </form>
          <Link href="/app/dersler/yeni" className="btn btn-primary btn-sm"><Icon name="plus" size={15} />Yeni ders</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_306px] gap-4 items-start">
        <Card className="p-5 overflow-x-auto">
          {view === "gun" ? (
            <div className="min-w-[720px]">
              <div className="grid pb-2.5" style={{ gridTemplateColumns: `62px repeat(${dayCal.columns.length}, 1fr)` }}>
                <div />
                {dayCal.columns.map((c) => (
                  <div key={c.id} className="text-center flex flex-col gap-px py-1">
                    <span className="text-[13px] font-semibold truncate">{c.label}</span>
                    <span className="text-xs text-muted truncate">{c.sub}</span>
                  </div>
                ))}
              </div>

              <div className="grid relative" style={{ gridTemplateColumns: `62px repeat(${dayCal.columns.length}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 26px)` }}>
                {Array.from({ length: ROWS }, (_, r) => (
                  <div key={`dl-${r}`} className="border-t" style={{ gridColumn: `2 / ${dayCal.columns.length + 2}`, gridRow: r + 1, borderColor: r % 2 === 0 ? "var(--virel-border)" : "var(--virel-surface-2)" }} />
                ))}
                {dayCal.columns.map((_, c) => (
                  <div key={`dc-${c}`} className="border-l border-border" style={{ gridColumn: c + 2, gridRow: `1 / ${ROWS + 1}` }} />
                ))}
                {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                  <div key={`dt-${i}`} className="text-xs text-muted tabular text-right pr-2.5" style={{ gridColumn: 1, gridRow: `${i * 2 + 1} / ${i * 2 + 3}` }}>
                    {String(START_HOUR + i).padStart(2, "0")}:00
                  </div>
                ))}
                {dayCal.events.map((e) => {
                  const { first, last } = rowSpan(e.startsAt, e.endsAt);
                  const width = 100 / e.lanes;
                  return (
                    <Link
                      key={`${e.kind}-${e.id}`}
                      href={e.href}
                      className={`slot slot-${e.kind} my-px`}
                      style={{ gridColumn: e.column + 2, gridRow: `${first} / ${last}`, width: `calc(${width}% - 4px)`, marginLeft: `calc(${e.lane * width}% + 2px)` }}
                      title={e.clash ?? `${time(e.startsAt)}–${time(e.endsAt)} · ${e.title} · ${e.meta}`}
                    >
                      <span className="flex items-center gap-1.5 font-semibold truncate">
                        <Icon name={KIND_ICON[e.kind]} size={12} strokeWidth={2} />{e.title}
                      </span>
                      <span className="block opacity-80 mt-px truncate">{e.meta}</span>
                      <span className="block opacity-60 tabular">{time(e.startsAt)}–{time(e.endsAt)}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="flex gap-4 pt-3.5 mt-3 border-t border-border flex-wrap">
                {[["var(--virel-blue)", "Direksiyon"], ["var(--virel-success)", "Teorik"], ["var(--virel-danger)", "Çakışma"]].map(([c, l]) => (
                  <span key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: c }} /><span className="text-xs text-text-2">{l}</span></span>
                ))}
                <span className="text-xs text-muted ml-auto">Sütunlar eğitmenlerdir; teorik dersler ayrı sütunda toplanır.</span>
              </div>
            </div>
          ) : (
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[62px_repeat(7,1fr)] pb-2.5">
              <div />
              {DAY_NAMES.map((d, i) => (
                <div key={d} className={`text-center flex flex-col gap-px py-1 rounded-sm ${i === todayIdx ? "bg-blue-050" : ""}`}>
                  <span className="text-xs text-muted">{d}</span>
                  <span className={`font-display text-[15px] font-semibold ${i === todayIdx ? "text-blue-700" : ""}`}>{addDays(weekStart, i).getDate()}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[62px_repeat(7,1fr)] relative" style={{ gridTemplateRows: `repeat(${ROWS}, 26px)` }}>
              {Array.from({ length: ROWS }, (_, r) => (
                <div key={`line-${r}`} className="border-t" style={{ gridColumn: "2 / 9", gridRow: r + 1, borderColor: r % 2 === 0 ? "var(--virel-border)" : "var(--virel-surface-2)" }} />
              ))}
              {Array.from({ length: 7 }, (_, c) => (
                <div key={`col-${c}`} className="border-l border-border" style={{ gridColumn: c + 2, gridRow: `1 / ${ROWS + 1}` }} />
              ))}
              {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                <div key={`t-${i}`} className="text-xs text-muted tabular text-right pr-2.5" style={{ gridColumn: 1, gridRow: `${i * 2 + 1} / ${i * 2 + 3}` }}>
                  {String(START_HOUR + i).padStart(2, "0")}:00
                </div>
              ))}

              {cal.events.map((e) => {
                const { first, last } = rowSpan(e.startsAt, e.endsAt);
                const width = 100 / e.lanes;
                const dense = e.lanes > 2;
                return (
                  <Link
                    key={`${e.kind}-${e.id}`}
                    href={e.href}
                    className={`slot slot-${e.kind} my-px ${dense ? "px-1.5 py-1" : ""}`}
                    style={{
                      gridColumn: e.day + 2, gridRow: `${first} / ${last}`,
                      width: `calc(${width}% - 4px)`, marginLeft: `calc(${e.lane * width}% + 2px)`,
                    }}
                    title={e.clash ?? `${time(e.startsAt)}–${time(e.endsAt)} · ${e.title} · ${e.meta}`}
                  >
                    <span className="flex items-center gap-1 font-semibold truncate">
                      {!dense && <Icon name={KIND_ICON[e.kind]} size={12} strokeWidth={2} />}{e.title}
                    </span>
                    {!dense && <span className="block opacity-80 mt-px truncate">{e.meta}</span>}
                    <span className="block opacity-60 tabular truncate">{time(e.startsAt)}{dense ? "" : `–${time(e.endsAt)}`}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex gap-4 pt-3.5 mt-3 border-t border-border flex-wrap">
              {[["var(--virel-blue)", "Direksiyon"], ["var(--virel-success)", "Teorik"], ["var(--virel-warning)", "Sınav"], ["var(--virel-danger)", "Çakışma"]].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: c }} /><span className="text-xs text-text-2">{l}</span></span>
              ))}
            </div>
          </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          {active.clashes.length > 0 && (
            <Card>
              <header className="flex items-center gap-2 px-5 pt-5">
                <Icon name="alert" size={17} className="text-danger" />
                <h2 className="h-card">Çakışma</h2>
                <Badge kind="danger" dot>{active.clashes.length}</Badge>
              </header>
              <div className="px-5 pb-5 pt-3">
                {active.clashLessons.slice(0, 2).map((l) => (
                  <div key={l.id} className="p-3.5 rounded-md bg-danger-bg mb-2 last:mb-0">
                    <div className="text-[13.5px] font-semibold leading-snug">
                      {date(l.startsAt)} {time(l.startsAt)} · {l.vehicle.plate} plakalı araç bu saatte kullanımda.
                    </div>
                    <div className="text-[13px] text-text-2 mt-1.5 leading-relaxed">
                      {l.student.firstName} {l.student.lastName} · {l.instructor.name}. Aracı ya da saati değiştirin.
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link href={`/app/dersler/${l.id}`} className="btn btn-primary btn-xs">Dersi düzenle</Link>
                      <Link href={`/app/kursiyerler/${l.studentId}`} className="btn btn-secondary btn-xs">Kursiyer</Link>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <header className="flex items-center gap-2.5 px-5 pt-5">
              <h2 className="h-card">En uygun saatler</h2>
              <span className="text-xs text-muted">7 gün</span>
            </header>
            <div className="px-5 pb-5">
              <p className="text-[13px] text-text-2 leading-relaxed mt-2 mb-1">Eğitmen, araç ve kursiyer uygunluğu birlikte kontrol edildi.</p>
              {suggestions.length === 0 ? (
                <p className="text-[13px] text-muted py-4">Önümüzdeki 7 günde boş slot bulunamadı.</p>
              ) : (
                suggestions.map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-2.5 border-t border-border">
                    <span className="flex flex-col w-[86px] shrink-0">
                      <span className="font-display text-sm font-semibold tabular">{DAY_NAMES[(s.startsAt.getDay() + 6) % 7]} {time(s.startsAt)}</span>
                      <span className="text-xs text-muted tabular">{date(s.startsAt)}</span>
                    </span>
                    <span className="flex flex-col gap-px min-w-0">
                      <span className="text-[13px] truncate">{s.instructorName} · <span className="tabular">{s.plate}</span></span>
                      <span className="text-xs text-muted">{s.why}</span>
                    </span>
                    <Link
                      href={`/app/dersler/yeni?tarih=${s.startsAt.toISOString().slice(0, 10)}&saat=${time(s.startsAt)}&egitmen=${s.instructorId}&arac=${s.vehicleId}`}
                      className="btn btn-secondary btn-xs ml-auto"
                    >
                      Planla
                    </Link>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="h-card px-5 pt-5">{view === "gun" ? "Bugün" : "Bu hafta"}</h2>
            <div className="px-5 pb-5 pt-3 grid grid-cols-2 gap-x-2.5 gap-y-3.5">
              <Stat label="Direksiyon" value={`${Math.round(active.totalHours)} saat`} />
              <Stat label="Teorik" value={`${active.theory.length} ders`} />
              <Stat label="Planlı ders" value={String(active.driving.length)} />
              <Stat label="Çakışma" value={String(active.clashes.length)} tone={active.clashes.length ? "text-danger" : ""} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="stat-lbl">{label}</div>
      <div className={`font-display text-xl font-bold tabular ${tone}`}>{value}</div>
    </div>
  );
}
