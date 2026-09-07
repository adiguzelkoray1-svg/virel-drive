"use client";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { updateSchoolPlanAction } from "@/app/actions/admin";
import { emptyPlanState } from "@/lib/admin-form";
import { SCHOOL_PLAN_LABEL, SCHOOL_PLAN_LIMITS } from "@/lib/constants";

export function PlanForm({ schoolId, plan, userLimit, studentLimit }: { schoolId: string; plan: string; userLimit: number; studentLimit: number }) {
  const [state, action, pending] = useActionState(updateSchoolPlanAction, emptyPlanState);

  return (
    <form action={action} className="px-5 pb-5 pt-1 flex flex-col gap-3.5">
      <input type="hidden" name="schoolId" value={schoolId} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="label">Plan</span>
          <select
            name="plan" defaultValue={plan} className="input"
            onChange={(e) => {
              const limits = SCHOOL_PLAN_LIMITS[e.target.value];
              const form = e.target.form!;
              if (limits) {
                (form.elements.namedItem("userLimit") as HTMLInputElement).value = String(limits.userLimit);
                (form.elements.namedItem("studentLimit") as HTMLInputElement).value = String(limits.studentLimit);
              }
            }}
          >
            {Object.entries(SCHOOL_PLAN_LABEL).map(([key, l]) => <option key={key} value={key}>{l}</option>)}
          </select>
          <span className="hint">Plan değişince limitler önerilen değere atlar; elle de düzenlenebilir.</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Kullanıcı limiti</span>
          <input name="userLimit" type="number" min={1} defaultValue={userLimit} className="input" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Kursiyer limiti</span>
          <input name="studentLimit" type="number" min={1} defaultValue={studentLimit} className="input" required />
        </label>
      </div>
      <div className="flex items-center gap-3">
        {state.error && <span className="flex items-center gap-2 text-[13px] text-danger font-semibold"><Icon name="alert" size={15} />{state.error}</span>}
        {state.ok && !state.error && <span className="flex items-center gap-2 text-[13px] text-success font-semibold"><Icon name="check-circle" size={15} />Kaydedildi.</span>}
        <button className="btn btn-secondary btn-sm" disabled={pending}>{pending ? "Kaydediliyor…" : "Planı kaydet"}</button>
      </div>
    </form>
  );
}
