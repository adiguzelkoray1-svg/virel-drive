import "server-only";
import type { ReportRange, reportsOverview } from "./reports";
import { money } from "./format";

/** Basit CSV alan kaçışı: değer virgül, tırnak ya da satır sonu içeriyorsa çift tırnağa alınır. */
const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (...cols: (string | number)[]) => cols.map(cell).join(",") + "\n";

/** Rapor özetini CSV'ye çevirir. Excel'de Türkçe karakterler bozulmasın diye
 *  UTF-8 BOM eklenir (route handler'da byte olarak birleştirilir). */
export function buildReportCsv(data: Awaited<ReturnType<typeof reportsOverview>>, range: ReportRange) {
  let out = "";
  out += row("Virel Drive · Rapor Özeti");
  out += row("Aralık", range.label);
  out += "\n";

  out += row("KPI", "Değer");
  out += row("Aktif kursiyer", data.kpis.activeCount);
  out += row("Mezun kursiyer", data.kpis.graduatedCount);
  out += row("Toplam kursiyer", data.kpis.totalStudents);
  out += row("Kayıt dönüşümü (%)", data.kpis.conversion);
  out += row("e-Sınav başarısı (%)", data.kpis.eTestPass ?? "");
  out += row("Direksiyon sınavı başarısı (%)", data.kpis.drivingPass ?? "");
  out += row("Kursiyer başına ortalama paket", money(data.kpis.revenuePerStudent));
  out += row("Tahsilat oranı (%)", data.kpis.collectionRate);
  out += "\n";

  out += row("Kayıt hunisi aşaması", "Kişi sayısı", "Oran (%)");
  for (const f of data.funnel) out += row(f.label, f.count, f.percent);
  out += "\n";

  out += row("Ehliyet sınıfı", "Kursiyer sayısı", "Oran (%)");
  for (const c of data.classDistribution) out += row(`${c.code} sınıfı`, c.count, c.percent);
  out += "\n";

  out += row("Eğitmen", "Kursiyer sayısı", "Haftalık doluluk (%)", "Sınav başarısı (%)");
  for (const i of data.instructorPerformance) out += row(i.name, i.studentCount, i.loadPercent, i.successRate ?? "");

  return out;
}
