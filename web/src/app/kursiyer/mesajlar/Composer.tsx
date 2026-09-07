"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { sendStudentMessageAction } from "@/app/actions/mobile";

export function StudentComposer() {
  const [state, action, pending] = useActionState(sendStudentMessageAction, {});
  const [body, setBody] = useState("");
  const justSubmitted = useRef(false);
  useEffect(() => {
    if (justSubmitted.current && !state.error) setBody("");
    justSubmitted.current = false;
  }, [state]);

  return (
    <form action={action} onSubmit={() => { justSubmitted.current = true; }} className="flex items-end gap-2 p-3 border-t border-border bg-surface">
      <textarea
        name="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Mesaj yazın…"
        rows={1} className="input min-h-[42px] py-2.5 flex-1 resize-none"
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
      />
      <button className="btn btn-primary h-[42px] px-3.5 shrink-0" disabled={pending || !body.trim()}>
        <Icon name="arrow-right" size={16} />
      </button>
      {state.error && <span className="sr-only" role="alert">{state.error}</span>}
    </form>
  );
}
