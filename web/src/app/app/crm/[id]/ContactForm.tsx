"use client";
import { useActionState, useState } from "react";
import { Icon } from "@/components/icons";
import { logContactAction } from "@/app/actions/leads";
import { CONTACT_CHANNELS, LOST_REASONS, emptyContactState } from "@/lib/lead-form";
import { LEAD_STAGES } from "@/lib/constants";

export function ContactForm({ leadId, stage, canWin, today, suggestedFollowUp }: {
  leadId: string; stage: string; canWin: boolean; today: string; suggestedFollowUp: string;
}) {
  const [state, action, pending] = useActionState(logContactAction, emptyContactState);
  const [nextStage, setNextStage] = useState(stage);
  const [channel, setChannel] = useState<string>(CONTACT_CHANNELS[0].key);
  const back = state.values;
  const k = JSON.stringify(back ?? {});

  return (
    <form action={action} className="px-5 pb-5 pt-1 flex flex-col gap-3.5">
      <input type="hidden" name="leadId" value={leadId} />
      {/* Not metnine okunabilir kanal adı yazılsın diye etiket de gönderilir. */}
      <input type="hidden" name="channelLabel" value={CONTACT_CHANNELS.find((c) => c.key === channel)?.label ?? channel} />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="label">Görüşme kanalı</span>
          <select name="channel" value={channel} onChange={(e) => setChannel(e.target.value)} className="input">
            {CONTACT_CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Görüşme sonrası aşama</span>
          <select name="stage" value={nextStage} onChange={(e) => setNextStage(e.target.value)} className="input">
            {LEAD_STAGES.map((s) => (
              <option key={s.key} value={s.key} disabled={s.key === "WON" && !canWin}>
                {s.label}{s.key === "WON" && !canWin ? " (önce kursiyere dönüştürün)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {nextStage === "LOST" && (
        <label className="flex flex-col gap-1.5">
          <span className="label">Kaybetme nedeni</span>
          <select name="lostReason" defaultValue={back?.lostReason ?? ""} className="input" required>
            <option value="">Seçin</option>
            {LOST_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
      )}

      {nextStage !== "LOST" && nextStage !== "WON" && (
        <label className="flex flex-col gap-1.5">
          <span className="label">Sonraki takip tarihi</span>
          <input
            key={`nextFollowUpAt-${k}`} type="date" name="nextFollowUpAt" min={today}
            defaultValue={back?.nextFollowUpAt ?? suggestedFollowUp} className="input"
          />
          <span className="hint">Boş bırakırsanız aday takip listesinden çıkar.</span>
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="label">Görüşme notu <span className="text-muted font-normal">(opsiyonel)</span></span>
        <textarea key={`note-${k}`} name="note" defaultValue={back?.note ?? ""} className="input min-h-[72px] py-2.5" placeholder="Fiyat gönderildi, eşiyle konuşup dönecek." />
      </label>

      {state.error && (
        <span className="flex items-center gap-2 text-[13px] text-danger font-semibold">
          <Icon name="alert" size={15} />{state.error}
        </span>
      )}
      <button className="btn btn-primary btn-sm self-start" disabled={pending}>
        <Icon name="phone" size={16} />{pending ? "Kaydediliyor…" : "Görüşmeyi kaydet"}
      </button>
    </form>
  );
}
