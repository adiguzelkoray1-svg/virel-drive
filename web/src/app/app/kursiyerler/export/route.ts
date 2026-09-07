import { audit, requirePermission } from "@/lib/auth";
import { buildStudentsCsv } from "@/lib/students-csv";
import { csvResponse } from "@/lib/csv";

/** Kursiyer listesini (o an ekrandaki filtre/aramayla) CSV olarak indirir. Ekrandaki
 *  listeyle aynı `where` mantığını kullanır (bkz. lib/student.ts) — filtre/arama
 *  değiştiğinde ikisi birbirinden kaymaz. */
export async function GET(request: Request) {
  const user = await requirePermission("export");
  const url = new URL(request.url);
  const filterKey = url.searchParams.get("filtre") ?? "tumu";
  const q = (url.searchParams.get("q") ?? "").trim();

  const { csv, count } = await buildStudentsCsv(user.schoolId, filterKey, q);
  await audit({ schoolId: user.schoolId, actorId: user.id, action: "student.export", meta: { filterKey, q, count } });

  return csvResponse(csv, `virel-drive-kursiyerler-${new Date().toISOString().slice(0, 10)}.csv`);
}
