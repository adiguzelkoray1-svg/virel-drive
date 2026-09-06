"use client";
import { useActionState, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui";
import { checkAvailabilityAction, lessonFormAction } from "@/app/actions/lessons";
import { emptyLessonState, type LessonFormState } from "@/lib/lesson-form";

type Option = { id: string; label: string; sub?: string };

export function LessonForm({ students, instructors, vehicles, kinds, defaults, durationMinutes }: {
  students: Option[]; instructors: Option[]; vehicles: Option[];
  kinds: { key: string; label: string }[];
  defaults: { studentId?: string; instructorId?: string; vehicleId?: string; date: string; start: string };
  durationMinutes: number;
}) {
  const [createState, action, creating] = useActionState(lessonFormAction, emptyLessonState);
  const [checkState, setCheckState] = useState<LessonFormState>(emptyLessonState);
  const [checking, startCheck] = useTransition();

  // Oluşturma denemesi sonucu varsa onu, yoksa son uygunluk sorgusunu göster.
  const state = createState.checks.length || createState.error ? createState : checkState;
  const pending = creating || checking;

  // Başlangıç saatinden türetilen bitiş; kullanıcı elle değiştirirse serbest kalır.
  const [start, setStart] = useState(defaults.start);
  const [endOverride, setEndOverride] = useState<string | null>(null);
  const end = endOverride ?? addMinutes(start, durationMinutes);

  /**
   * Uygunluk sorgusu formu GÖNDERMEZ: React 19 aksiyon tamamlanınca formu sıfırlıyor
   * ve kontrolsüz alanların seçimi kayboluyor. Bunun yerine FormData okunup
   * sunucu fonksiyonu doğrudan çağrılır.
   */
  const check = (el: HTMLElement) => {
    const form = el.closest("form");
    if (!form) return;
    const data = new FormData(form);
    startCheck(async () => setCheckState(await checkAvailabilityAction(data)));
  };
  const onSelect = (e: React.ChangeEvent<HTMLSelectElement>) => check(e.currentTarget);

  // Oluşturma başarısız olursa React formu sıfırlar; alanlar sunucudan dönen değerlerle geri doldurulur.
  const back = createState.values;
  const failed = state.checks.filter((c) => !c.ok);

  return (
    <form action={action} className="contents">

      <div className="card p-[22px] flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Kursiyer" name="studentId" options={students} defaultValue={back?.studentId ?? defaults.studentId} onChange={onSelect} className="md:col-span-2" required />
          <Select label="Eğitmen" name="instructorId" options={instructors} defaultValue={back?.instructorId ?? defaults.instructorId} onChange={onSelect} required />
          <Select label="Araç" name="vehicleId" options={vehicles} defaultValue={back?.vehicleId ?? defaults.vehicleId} onChange={onSelect} required />
          <Select label="Ders türü" name="kind" options={kinds.map((k) => ({ id: k.key, label: k.label }))} defaultValue={back?.kind ?? kinds[0]?.key} onChange={onSelect} />
          <Field label="Tarih">
            <input type="date" name="date" defaultValue={back?.date ?? defaults.date} onChange={(e) => check(e.currentTarget)} className="input" required />
          </Field>
          <Field label="Başlangıç">
            <input type="time" name="start" value={start} onChange={(e) => setStart(e.target.value)} onBlur={(e) => check(e.currentTarget)} className="input" required />
          </Field>
          <Field label="Bitiş" hint={`${durationMinutes} dk · mevzuat ayarından gelir`}>
            <input type="time" name="end" value={end} onChange={(e) => setEndOverride(e.target.value)} onBlur={(e) => check(e.currentTarget)} className="input" required />
          </Field>
        </div>

        <Field label="Not (opsiyonel)">
          <textarea name="note" rows={2} className="input" placeholder="Park ve yokuşta kalkış çalışılacak." defaultValue={back?.note ?? ""} />
        </Field>

        <div className="border border-border rounded-md px-4 pt-3 pb-3.5">
          <div className="flex items-center gap-2.5 pb-1 flex-wrap">
            <span className="h-card text-sm">Uygunluk</span>
            {state.checks.length === 0 ? (
              <Badge kind="neutral">Kontrol bekleniyor</Badge>
            ) : state.ready ? (
              <Badge kind="success" dot>Planlanabilir</Badge>
            ) : (
              <Badge kind="danger" dot>{failed.length} kontrol geçilemedi</Badge>
            )}
            <span className="text-xs text-muted ml-auto">
              {pending ? "kontrol ediliyor…" : state.checks.length ? `${state.checks.length} kontrolün ${state.checks.filter((c) => c.ok).length} tanesi geçti` : "alanları doldurun"}
            </span>
          </div>

          {state.checks.length === 0 ? (
            <p className="text-[13px] text-text-2 py-3">Kursiyer, eğitmen, araç ve saat seçildiğinde eğitmen, araç ve kursiyer uygunluğu birlikte kontrol edilir.</p>
          ) : (
            <>
              {state.checks.map((c, i) => (
                <div key={i} className="flex gap-2.5 items-start py-2.5 border-t border-border">
                  <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 ${c.ok ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
                    <Icon name={c.ok ? "check-circle" : "x-circle"} size={14} strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold">{c.label}</div>
                    <div className="text-[13px] text-text-2 leading-snug mt-px">{c.detail}</div>
                  </div>
                </div>
              ))}
              {state.info && (
                <div className="flex gap-2.5 items-start py-2.5 border-t border-border">
                  <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 bg-warning-bg text-warning"><Icon name="info" size={14} strokeWidth={2.2} /></span>
                  <div className="text-[13px] text-text-2 leading-snug pt-0.5">{state.info}</div>
                </div>
              )}
            </>
          )}
        </div>

        {state.error && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-danger-bg" role="alert">
            <Icon name="alert" size={16} className="shrink-0 mt-0.5 text-danger" />
            <span>{state.error}</span>
          </div>
        )}

        <div className="flex items-center gap-2.5 pt-1 flex-wrap">
          <button type="button" onClick={(e) => check(e.currentTarget)} className="btn btn-ghost btn-sm"><Icon name="refresh" size={15} />Uygunluğu yeniden kontrol et</button>
          <div className="ml-auto flex gap-2.5">
            <a href="/app/takvim" className="btn btn-secondary btn-sm">Vazgeç</a>
            <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
              <Icon name="check" size={15} />{pending ? "Kontrol ediliyor…" : "Dersi oluştur"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

function Select({ label, name, options, defaultValue, onChange, className = "", required }: {
  label: string; name: string; options: Option[]; defaultValue?: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; className?: string; required?: boolean;
}) {
  return (
    <Field label={label} className={className}>
      <select name={name} defaultValue={defaultValue ?? ""} onChange={onChange} className="input" required={required}>
        <option value="" disabled>Seçin…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}{o.sub ? ` · ${o.sub}` : ""}</option>
        ))}
      </select>
    </Field>
  );
}

function addMinutes(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h || 0, m || 0);
  d.setMinutes(d.getMinutes() + minutes);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
