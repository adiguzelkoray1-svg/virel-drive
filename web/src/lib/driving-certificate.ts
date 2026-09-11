import "server-only";
import { prisma } from "./prisma";

/** MTSK Yönetmeliği md.19: K Sınıfı Sürücü Aday Belgesi 6 ay geçerlidir. */
export const K_CERT_VALIDITY_MONTHS = 6;
/** Aynı madde: ilk dört direksiyon sınavı hakkı tükenince belge yeniden düzenlenir — bu,
 *  LicenseClassRule.examAttempts'ten (okulun kendi belirlediği, değişebilen toplam hak sayısı)
 *  bağımsız, mevzuatın sabit sayısıdır; ikisi genelde aynı değeri taşısa da kavramsal olarak ayrıdır. */
export const K_CERT_MAX_ATTEMPTS = 4;
/** Erken uyarı eşiği (mevzuatta yok, yalnızca UX): süresi bu kadar gün kala "yakında dolacak" say. */
const EXPIRING_SOON_DAYS = 14;

/** "G" sınıfı sertifika alacak kursiyerler bu belgeden muaftır (md.19/1). */
export const K_CERT_EXEMPT_CLASS = "G";

export const addMonths = (d: Date, n: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
};

export async function listCertificates(schoolId: string, studentId: string) {
  return prisma.drivingCandidateCertificate.findMany({ where: { schoolId, studentId }, orderBy: { startedAt: "desc" } });
}

export async function getCertificate(schoolId: string, id: string) {
  return prisma.drivingCandidateCertificate.findFirst({ where: { id, schoolId }, include: { student: true } });
}

export type CertState = "NONE" | "ACTIVE" | "EXPIRING" | "RENEW";

/**
 * En son düzenlenen belgenin güncel durumu. `attemptsUsed`, belge başlangıcından bu yana
 * (bu dönemde) yapılan DONE durumundaki direksiyon sınavı denemesi sayısıdır — belge her
 * yenilendiğinde sayaç sıfırlanır, çünkü her yenileme yeni bir 4-haklı dönem açar.
 */
export function certificateStatus(
  cert: { startedAt: Date; expiresAt: Date } | null | undefined,
  attemptsUsed: number,
  now = new Date(),
): { state: CertState; daysLeft: number | null; attemptsUsed: number } {
  if (!cert) return { state: "NONE", daysLeft: null, attemptsUsed: 0 };
  const daysLeft = Math.ceil((cert.expiresAt.getTime() - now.getTime()) / 86_400_000);
  if (daysLeft < 0 || attemptsUsed >= K_CERT_MAX_ATTEMPTS) return { state: "RENEW", daysLeft, attemptsUsed };
  if (daysLeft <= EXPIRING_SOON_DAYS) return { state: "EXPIRING", daysLeft, attemptsUsed };
  return { state: "ACTIVE", daysLeft, attemptsUsed };
}

/** Dashboard "Dikkat gerektirenler" için: süresi yakında dolacak/dolmuş ya da hakkı biten,
 *  hâlâ direksiyon aşamasındaki (mezun olmamış) kursiyer sayısı. */
export async function countCertificatesNeedingAttention(schoolId: string) {
  const students = await prisma.student.findMany({
    where: { schoolId, status: "ACTIVE", stage: { in: ["DRIVING", "DRIVING_EXAM"] }, licenseClass: { not: K_CERT_EXEMPT_CLASS } },
    select: { id: true },
  });
  if (!students.length) return 0;

  const ids = students.map((s) => s.id);
  const [latestByStudent, drivingExams] = await Promise.all([
    prisma.drivingCandidateCertificate.findMany({ where: { schoolId, studentId: { in: ids } }, orderBy: { startedAt: "desc" } }),
    prisma.exam.findMany({ where: { schoolId, studentId: { in: ids }, type: "DRIVING", status: "DONE" }, select: { studentId: true, scheduledAt: true, createdAt: true } }),
  ]);

  const latest = new Map<string, { startedAt: Date; expiresAt: Date }>();
  for (const c of latestByStudent) if (!latest.has(c.studentId)) latest.set(c.studentId, c);

  let count = 0;
  for (const id of ids) {
    const cert = latest.get(id);
    const attemptsUsed = cert
      ? drivingExams.filter((e) => e.studentId === id && (e.scheduledAt ?? e.createdAt) >= cert.startedAt).length
      : 0;
    const status = certificateStatus(cert, attemptsUsed);
    if (status.state === "EXPIRING" || status.state === "RENEW" || status.state === "NONE") count++;
  }
  return count;
}
