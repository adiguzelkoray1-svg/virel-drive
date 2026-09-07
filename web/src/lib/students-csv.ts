import "server-only";
import { prisma } from "./prisma";
import { csvRow as row } from "./csv";
import { STAGE_LABEL, STUDENT_STATUS_LABEL, type StudentStage } from "./constants";
import { buildStudentWhere } from "./student";
import { date, maskPhone } from "./format";

/** Kursiyer listesini (o an ekrandaki filtre/arama ile) CSV'ye çevirir — sayfalama
 *  uygulanmaz, süzgece uyan TÜM kayıtlar dışa aktarılır. */
export async function buildStudentsCsv(schoolId: string, filterKey: string, q: string) {
  const where = buildStudentWhere(schoolId, filterKey, q);
  const students = await prisma.student.findMany({
    where,
    orderBy: [{ status: "asc" }, { registeredAt: "desc" }],
    select: {
      fileNo: true, firstName: true, lastName: true, phone: true, email: true,
      licenseClass: true, stage: true, status: true, registeredAt: true,
    },
  });

  let out = "";
  out += row("Dosya No", "Ad", "Soyad", "Telefon", "E-posta", "Sınıf", "Aşama", "Durum", "Kayıt tarihi");
  for (const s of students) {
    out += row(
      s.fileNo ?? "",
      s.firstName,
      s.lastName,
      // Ekrandaki liste de telefonu maskeliyor (KVKK) — dışa aktarımın ekranda hiç
      // gösterilmeyen bir veriyi açığa çıkarmasını istemedim.
      maskPhone(s.phone),
      s.email ?? "",
      s.licenseClass,
      STAGE_LABEL[s.stage as StudentStage] ?? s.stage,
      STUDENT_STATUS_LABEL[s.status]?.label ?? s.status,
      date(s.registeredAt),
    );
  }
  return { csv: out, count: students.length };
}
