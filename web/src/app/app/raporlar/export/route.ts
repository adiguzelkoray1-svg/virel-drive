import { requirePermission } from "@/lib/auth";
import { reportsOverview, resolveReportRange } from "@/lib/reports";
import { buildReportCsv } from "@/lib/reports-csv";

/** Rapor özetini CSV olarak indirir. PDF/Excel bu sürümde yok (gerçek bir üretim
 *  kütüphanesi bağlanmadı); CSV, Excel'de doğrudan açılabilen tek gerçek dışa aktarımdır. */
export async function GET(request: Request) {
  const user = await requirePermission("export");
  const url = new URL(request.url);
  const sp = Object.fromEntries(url.searchParams);
  const range = resolveReportRange(sp);

  const data = await reportsOverview(user.schoolId, range);
  const csv = buildReportCsv(data, range);
  const bom = "﻿"; // Excel Türkçe karakterleri BOM'suz bozuyor

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="virel-drive-rapor-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
