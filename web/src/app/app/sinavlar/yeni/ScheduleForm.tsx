"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { scheduleExamAction } from "@/app/actions/exams";
import { emptyExamState } from "@/lib/exam-form";

type StudentOption = { id: string; label: string; sub: string; stage: string; licenseClass: string };

export function ScheduleForm({ students, defaultType, defaultStudentId }: {
  students: StudentOption[]; defaultType: "ETEST" | "DRIVING"; defaultStudentId?: string;
}) {
  const [state, action, pending] = useActionState(scheduleExamAction, emptyExamState);
  const back = state.values;
  const [type, setType] = useState<"ETEST" | "DRIVING">((back?.type as "ETEST" | "DRIVING") || defaultType);

  const eligible = type === "ETEST"
    ? students.filter((s) => ["THEORY", "ETEST_WAITING"].includes(s.stage))
    : students.filter((s) => ["DRIVING", "DRIVING_EXAM"].includes(s.stage));

  const initialStudentId = back?.studentId ?? defaultStudentId ?? "";

  /**
   * React 19, bir form aksiyonu tamamlandığında native form.reset() çağırır. Bu, denetimsiz
   * (defaultValue tabanlı) alanları "sıfırlar" — <select> için bu, hiçbir <option>'da HTML
   * `selected` özniteliği bulunmadığından (React seçimi yalnızca DOM özelliği olarak tutar)
   * ilk seçeneğe döner ve kullanıcının seçimi görünürde kaybolur.
   *
   * Çözüm: aksiyon her sonuçlandığında (dönen değerler değiştiğinde) etkilenen alanları
   * `key` ile tamamen yeniden oluşturmak. Taze bir DOM düğümü defaultValue'yu doğru uygular
   * ve önceki reset'ten etkilenmez. formKey yalnızca sunucudan yeni bir sonuç döndüğünde
   * değişir; kullanıcının tuş vuruşlarında sabit kalır.
   */
  const formKey = JSON.stringify(back ?? {});

  return (
    <form action={action} className="card p-[22px] flex flex-col gap-5">
      <div className="flex gap-2">
        <button type="button" onClick={() => setType("ETEST")} className={`btn btn-sm flex-1 ${type === "ETEST" ? "btn-primary" : "btn-secondary"}`}>e-Sınav</button>
        <button type="button" onClick={() => setType("DRIVING")} className={`btn btn-sm flex-1 ${type === "DRIVING" ? "btn-primary" : "btn-secondary"}`}>Direksiyon Sınavı</button>
        <input type="hidden" name="type" value={type} />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="label">Kursiyer</span>
        <select key={`${type}-${formKey}`} name="studentId" defaultValue={initialStudentId} className="input" required>
          <option value="" disabled>Seçin…</option>
          {eligible.map((s) => <option key={s.id} value={s.id}>{s.label} · {s.sub}</option>)}
        </select>
        {eligible.length === 0 && (
          <span className="hint text-warning">
            {type === "ETEST" ? "Teorik eğitim aşamasında kursiyer yok." : "Direksiyon eğitimi aşamasında kursiyer yok."}
          </span>
        )}
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label">Tarih</span>
          <input key={`date-${formKey}`} type="date" name="date" defaultValue={back?.date ?? ""} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Saat <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input key={`time-${formKey}`} type="time" name="time" defaultValue={back?.time ?? "09:00"} className="input" />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="label">Yer <span className="text-muted font-normal">(opsiyonel)</span></span>
        <input key={`place-${formKey}`} name="place" defaultValue={back?.place ?? ""} className="input" placeholder={type === "ETEST" ? "MEB Salon 3, Çankaya" : "Yıldız Kurs"} />
      </label>

      {state.error && (
        <div className="flex flex-col gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-danger-bg" role="alert">
          <div className="flex items-start gap-2.5">
            <Icon name="alert" size={16} className="shrink-0 mt-0.5 text-danger" /><span>{state.error}</span>
          </div>
          {state.overridable && (
            <label className="flex items-center gap-2 text-[13px] pl-[26px]">
              <input key={`override-${formKey}`} type="checkbox" name="override" value="1" defaultChecked={back?.override === "1"} className="w-4 h-4 accent-blue" />
              Yine de kaydet (istisnai durum)
            </label>
          )}
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <Link href="/app/sinavlar" className="btn btn-secondary btn-sm">Vazgeç</Link>
        <button className="btn btn-primary btn-sm ml-auto" disabled={pending}>
          <Icon name="check" size={15} />{pending ? "Kaydediliyor…" : "Sınavı planla"}
        </button>
      </div>
    </form>
  );
}
