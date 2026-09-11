"use client";
import { Icon } from "@/components/icons";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-primary btn-sm">
      <Icon name="download" size={15} />Yazdır
    </button>
  );
}
