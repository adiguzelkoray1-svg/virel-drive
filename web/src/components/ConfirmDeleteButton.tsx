"use client";
import { Icon } from "@/components/icons";

/** Sunucu aksiyonu formunun içinde, gönderimden önce tarayıcı onayı isteyen silme düğmesi. */
export function ConfirmDeleteButton({ message, label = "Sil" }: { message: string; label?: string }) {
  return (
    <button type="submit" className="btn btn-ghost btn-xs text-danger" onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>
      <Icon name="trash" size={14} />{label}
    </button>
  );
}
