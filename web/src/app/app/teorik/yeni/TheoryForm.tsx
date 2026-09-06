"use client";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui";
import { checkTheoryAction, theoryFormAction } from "@/app/actions/theory";
import { emptyTheoryState, type TheoryFormState } from "@/lib/theory-form";

type Option = { id: string; label: string; sub?: string };

export function TheoryForm({ categories, teachers, rooms, defaults, lessonId, submitLabel }: {
  categories: { key: string; label: string }[];
  teachers: Option[];
  rooms: string[];
  defaults: { category?: string; topic?: string; instructorId?: string; room?: string; term?: string; date: string; start: string; end: string };
  lessonId?: string;
  submitLabel: string;
}) {
  const [saveState, action, saving] = useActionState(theoryFormAction, emptyTheoryState);
  const [checkState, setCheckState] = useState<TheoryFormState>(emptyTheoryState);
  const [checking, startCheck] = useTransition();

  const state = saveState.checks.length || saveState.error ? saveState : checkState;
  const pending = saving || checking;
  const back = saveState.values;
  const failed = state.checks.filter((c) => !c.ok);

  /**
   * `theoryFormAction` (kaydetme) gerçek bir form gönderimidir; başarısız olursa React 19
   * native form.reset() çağırır. Bu, defaultValue tabanlı denetimsiz alanları sıfırlar —
   * <select> için özellikle sorunludur, çünkü hiçbir <option>'da HTML `selected` özniteliği
   * yoktur (React seçimi yalnızca DOM özelliği olarak tutar) ve reset ilk seçeneğe döner.
   * Çözüm: kaydetme her sonuçlandığında (formKey değiştiğinde) alanları `key` ile tazelemek —
   * taze bir DOM düğümü defaultValue'yu doğru uygular. Uygunluk sorgusu (`check`) ayrı bir
   * çağrı olduğundan (form submit değil) bu sıfırlamayı hiç tetiklemez.
   */
  const formKey = JSON.stringify(back ?? {});

  const check = (el: HTMLElement) => {
    const form = el.closest("form");
    if (!form) return;
    const data = new FormData(form);
    startCheck(async () => setCheckState(await checkTheoryAction(data)));
  };

  return (
    <form action={action} className="card p-[22px] flex flex-col gap-5">
      {lessonId && <input type="hidden" name="lessonId" value={lessonId} />}
      {defaults.term && <input type="hidden" name="term" value={back?.term ?? defaults.term} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Kategori">
          <select key={`category-${formKey}`} name="category" defaultValue={back?.category ?? defaults.category ?? categories[0]?.key} onChange={(e) => check(e.currentTarget)} className="input" required>
            {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Konu" className="md:col-span-2">
          <input key={`topic-${formKey}`} name="topic" defaultValue={back?.topic ?? defaults.topic ?? ""} className="input" placeholder="Trafik işaretleri – 2" required />
        </Field>

        <Field label="Öğretmen">
          <select key={`instructorId-${formKey}`} name="instructorId" defaultValue={back?.instructorId ?? defaults.instructorId ?? ""} onChange={(e) => check(e.currentTarget)} className="input">
            <option value="">Atanmadı</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.label}{t.sub ? ` · ${t.sub}` : ""}</option>)}
          </select>
        </Field>
        <Field label="Derslik">
          <select key={`room-${formKey}`} name="room" defaultValue={back?.room ?? defaults.room ?? rooms[0] ?? ""} onChange={(e) => check(e.currentTarget)} className="input">
            <option value="">Belirtilmedi</option>
            {rooms.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Tarih">
          <input key={`date-${formKey}`} type="date" name="date" defaultValue={back?.date ?? defaults.date} onChange={(e) => check(e.currentTarget)} className="input" required />
        </Field>

        <Field label="Başlangıç">
          <input key={`start-${formKey}`} type="time" name="start" defaultValue={back?.start ?? defaults.start} onBlur={(e) => check(e.currentTarget)} className="input" required />
        </Field>
        <Field label="Bitiş">
          <input key={`end-${formKey}`} type="time" name="end" defaultValue={back?.end ?? defaults.end} onBlur={(e) => check(e.currentTarget)} className="input" required />
        </Field>
      </div>

      <div className="border border-border rounded-md px-4 pt-3 pb-3.5">
        <div className="flex items-center gap-2.5 pb-1 flex-wrap">
          <span className="h-card text-sm">Uygunluk</span>
          {state.checks.length === 0 ? <Badge kind="neutral">Kontrol bekleniyor</Badge>
            : state.ready ? <Badge kind="success" dot>Planlanabilir</Badge>
            : <Badge kind="danger" dot>{failed.length} çakışma</Badge>}
          <span className="text-xs text-muted ml-auto">{pending ? "kontrol ediliyor…" : "öğretmen ve derslik çakışması"}</span>
        </div>
        {state.checks.length === 0 ? (
          <p className="text-[13px] text-text-2 py-3">Öğretmen, derslik ve saat seçildiğinde çakışma kontrolü yapılır.</p>
        ) : (
          state.checks.map((c, i) => (
            <div key={i} className="flex gap-2.5 items-start py-2.5 border-t border-border">
              <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 ${c.ok ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
                <Icon name={c.ok ? "check-circle" : "x-circle"} size={14} strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold">{c.label}</div>
                <div className="text-[13px] text-text-2 leading-snug mt-px">{c.detail}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {state.error && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-danger-bg" role="alert">
          <Icon name="alert" size={16} className="shrink-0 mt-0.5 text-danger" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5 flex-wrap">
        <button type="button" onClick={(e) => check(e.currentTarget)} className="btn btn-ghost btn-sm">
          <Icon name="refresh" size={15} />Uygunluğu kontrol et
        </button>
        <div className="ml-auto flex gap-2.5">
          <Link href="/app/teorik" className="btn btn-secondary btn-sm">Vazgeç</Link>
          <button className="btn btn-primary btn-sm" disabled={pending}><Icon name="check" size={15} />{pending ? "Kaydediliyor…" : submitLabel}</button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
