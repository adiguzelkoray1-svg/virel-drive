"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { sendMessageAction } from "@/app/actions/messages";
import { emptySendMessageState } from "@/lib/message-form";
import { MESSAGE_CHANNEL_LABEL } from "@/lib/constants";
import { fillTemplate } from "@/lib/text";

type Template = { key: string; label: string; body: string };

export function Composer({ studentId, firstName, schoolName, defaultChannel, templates }: {
  studentId: string; firstName: string; schoolName: string; defaultChannel: string; templates: Template[];
}) {
  const [state, action, pending] = useActionState(sendMessageAction, emptySendMessageState);
  const [body, setBody] = useState("");
  const [template, setTemplate] = useState("");
  // Kutu controlled olduğu için React 19'un gönderim sonrası native form.reset()'i onu
  // etkilemez (README: "form.reset() üç formu etkileyen ortak hata"); başarılı gönderimi
  // burada kendimiz algılayıp temizliyoruz.
  const justSubmitted = useRef(false);
  useEffect(() => {
    if (justSubmitted.current && !state.error) { setBody(""); setTemplate(""); }
    justSubmitted.current = false;
  }, [state]);

  const applyTemplate = (key: string) => {
    const t = templates.find((x) => x.key === key);
    if (!t) return;
    setTemplate(key);
    setBody(fillTemplate(t.body, { ad: firstName, kurs: schoolName }));
  };

  return (
    <form action={action} onSubmit={() => { justSubmitted.current = true; }} className="flex flex-col gap-3 pt-3 border-t border-border">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="template" value={template} />

      <div className="flex items-center gap-2 flex-wrap">
        {templates.map((t) => (
          <button key={t.key} type="button" onClick={() => applyTemplate(t.key)} className="chip" data-active={template === t.key}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2.5">
        <select name="channel" defaultValue={defaultChannel} className="input h-11 text-[13px] w-[132px] shrink-0">
          {Object.entries(MESSAGE_CHANNEL_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <textarea
          name="body" value={body} onChange={(e) => { setBody(e.target.value); setTemplate(""); }}
          placeholder="Mesaj yazın…" rows={1} className="input min-h-[44px] py-2.5 grow resize-none"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.currentTarget.form?.requestSubmit(); } }}
        />
        <button className="btn btn-primary h-11 shrink-0" disabled={pending || !body.trim()}>
          {pending ? "…" : <><Icon name="arrow-right" size={16} />Gönder</>}
        </button>
      </div>
      {state.error && (
        <span className="flex items-center gap-1.5 text-xs text-danger font-semibold">
          <Icon name="alert" size={13} />{state.error}
        </span>
      )}
    </form>
  );
}
