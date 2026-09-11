"use client";
import { Icon } from "@/components/icons";

/** Yazdırılabilir belge sayfalarında (K belgesi, makbuz) paylaşılır — `@media print`
 *  (globals.css) sidebar/header'ı otomatik gizlediği için ayrı bir yazdırma düzeni gerekmez;
 *  bu düğme kendisi de `print:hidden` bir sarmalayıcı içinde kullanılmalı. */
export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-primary btn-sm">
      <Icon name="download" size={15} />Yazdır
    </button>
  );
}
