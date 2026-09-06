"use client";
import { useActionState, useState } from "react";
import { Icon } from "@/components/icons";
import { recordExamResultAction } from "@/app/actions/exams";
import { emptyExamState } from "@/lib/exam-form";

export function ResultForm({ examId, type }: { examId: string; type: "ETEST" | "DRIVING" }) {
  const [state, action, pending] = useActionState(recordExamResultAction, emptyExamState);
  const [result, setResult] = useState<"PASSED" | "FAILED">("PASSED");

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="examId" value={examId} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setResult("PASSED")}
          className={`btn btn-sm flex-1 ${result === "PASSED" ? "btn-primary" : "btn-secondary"}`}
        >
          <Icon name="check-circle" size={15} />Başarılı
        </button>
        <button
          type="button"
          onClick={() => setResult("FAILED")}
          className={`btn btn-sm flex-1 ${result === "FAILED" ? "btn-danger" : "btn-secondary"}`}
        >
          <Icon name="x-circle" size={15} />Başarısız
        </button>
        <input type="hidden" name="result" value={result} />
      </div>

      {type === "ETEST" && (
        <label className="flex flex-col gap-1.5">
          <span className="label">Puan <span className="text-muted font-normal">(opsiyonel)</span></span>
          <input name="score" type="number" min={0} max={100} className="input" placeholder="0-100" />
        </label>
      )}

      {result === "FAILED" && (
        <label className="flex flex-col gap-1.5">
          <span className="label">Başarısızlık nedeni</span>
          <input name="failReason" className="input" placeholder={type === "ETEST" ? "Trafik ve çevre bilgisi" : "Park ve geri manevra"} />
        </label>
      )}

      {state.error && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-sm text-[13px] bg-danger-bg" role="alert">
          <Icon name="alert" size={16} className="shrink-0 mt-0.5 text-danger" /><span>{state.error}</span>
        </div>
      )}

      <button className="btn btn-primary btn-sm" disabled={pending}>
        <Icon name="check" size={15} />{pending ? "Kaydediliyor…" : "Sonucu kaydet"}
      </button>
      {result === "PASSED" && (
        <p className="hint">
          {type === "ETEST" ? "Kayıt geçince kursiyer otomatik olarak direksiyon eğitimi aşamasına geçer." : "Kayıt geçince kursiyer otomatik olarak mezun sayılır."}
        </p>
      )}
    </form>
  );
}
