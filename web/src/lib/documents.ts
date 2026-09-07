import "server-only";
import { prisma } from "./prisma";
import { DOCUMENT_TYPES } from "./constants";

export type DocRow = {
  studentId: string; firstName: string; lastName: string; licenseClass: string; registeredAt: Date;
  byType: Record<string, { id: string; status: string; validUntil: Date | null } | undefined>;
  okCount: number; missingCount: number; reviewCount: number; pendingCount: number;
};

/** Kursiyer × belge türü matrisi. Yalnızca aktif/mezun kursiyerler listelenir —
 *  kaydı iptal edilmiş kursiyerin evrak eksiği artık bir operasyon sorunu değildir. */
export async function documentMatrix(schoolId: string, q = ""): Promise<DocRow[]> {
  const needle = q.trim();
  const digits = needle.replace(/\D/g, "");

  const students = await prisma.student.findMany({
    where: {
      schoolId, status: { in: ["ACTIVE", "GRADUATED"] },
      ...(needle
        ? {
            OR: [
              ...needle.split(/\s+/).map((w) => ({ firstName: { contains: w, mode: "insensitive" as const } })),
              ...needle.split(/\s+/).map((w) => ({ lastName: { contains: w, mode: "insensitive" as const } })),
              ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
            ],
          }
        : {}),
    },
    include: { documents: true },
    orderBy: [{ firstName: "asc" }],
  });

  return students.map((s) => {
    const byType: DocRow["byType"] = {};
    for (const d of s.documents) byType[d.type] = { id: d.id, status: d.status, validUntil: d.validUntil };
    const statuses = DOCUMENT_TYPES.map((t) => byType[t.key]?.status ?? "MISSING");
    return {
      studentId: s.id, firstName: s.firstName, lastName: s.lastName, licenseClass: s.licenseClass, registeredAt: s.registeredAt,
      byType,
      okCount: statuses.filter((x) => x === "OK").length,
      missingCount: statuses.filter((x) => x === "MISSING").length,
      reviewCount: statuses.filter((x) => x === "REVIEW").length,
      pendingCount: statuses.filter((x) => x === "PENDING").length,
    };
  });
}

export async function documentSummary(schoolId: string) {
  const students = await prisma.student.count({ where: { schoolId, status: { in: ["ACTIVE", "GRADUATED"] } } });
  const docs = await prisma.document.findMany({
    where: { schoolId, student: { status: { in: ["ACTIVE", "GRADUATED"] } } },
    select: { studentId: true, status: true, type: true, validUntil: true },
  });

  const byStudent = new Map<string, string[]>();
  for (const d of docs) byStudent.set(d.studentId, [...(byStudent.get(d.studentId) ?? []), d.status]);
  const complete = [...byStudent.values()].filter((s) => s.length === DOCUMENT_TYPES.length && s.every((st) => st === "OK")).length;

  const in30 = new Date(Date.now() + 30 * 86_400_000);
  const expiring = docs.filter((d) => d.status === "OK" && d.validUntil && d.validUntil <= in30 && d.validUntil >= new Date());

  return {
    students,
    complete,
    missingStudents: new Set(docs.filter((d) => d.status === "MISSING").map((d) => d.studentId)).size,
    reviewCount: docs.filter((d) => d.status === "REVIEW").length,
    expiringCount: expiring.length,
  };
}

export type MissingRow = { studentId: string; name: string; missingTypes: string[]; registeredAt: Date; daysOpen: number };

/** Eksik evrağı olan kursiyerler — en uzun süredir açık kayıt en üstte,
 *  çünkü kayıt ne kadar uzun açık kalırsa aday o kadar kaybedilmeye yakındır. */
export async function missingDocuments(schoolId: string, limit = 12): Promise<MissingRow[]> {
  const students = await prisma.student.findMany({
    where: { schoolId, status: { in: ["ACTIVE", "GRADUATED"] }, documents: { some: { status: "MISSING" } } },
    include: { documents: { where: { status: "MISSING" } } },
    orderBy: { registeredAt: "asc" },
    take: limit,
  });
  const label = new Map<string, string>(DOCUMENT_TYPES.map((t) => [t.key, t.label]));
  const now = new Date();

  return students.map((s) => ({
    studentId: s.id, name: `${s.firstName} ${s.lastName}`,
    missingTypes: s.documents.map((d) => label.get(d.type) ?? d.type),
    registeredAt: s.registeredAt,
    daysOpen: Math.floor((now.getTime() - s.registeredAt.getTime()) / 86_400_000),
  }));
}

export async function getStudentDocuments(schoolId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    include: { documents: true },
  });
  if (!student) return null;

  const byType = new Map<string, (typeof student.documents)[number]>(student.documents.map((d) => [d.type, d]));
  const rows = DOCUMENT_TYPES.map((t) => ({ type: t.key, label: t.label, doc: byType.get(t.key) ?? null }));
  return { student, rows };
}
