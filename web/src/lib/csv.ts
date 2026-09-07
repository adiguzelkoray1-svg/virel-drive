import "server-only";

/** Basit CSV alan kaçışı: değer virgül, tırnak ya da satır sonu içeriyorsa çift tırnağa alınır. */
export const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const csvRow = (...cols: (string | number)[]) => cols.map(csvCell).join(",") + "\n";

/** Excel'de Türkçe karakterler bozulmasın diye UTF-8 BOM'lu bir CSV Response üretir. */
export function csvResponse(content: string, filename: string) {
  const bom = "﻿";
  return new Response(bom + content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
