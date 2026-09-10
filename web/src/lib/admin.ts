import "server-only";
import { prisma } from "./prisma";
import { listPaymentLinks } from "./payment-link";

export async function adminOverview() {
  const [schools, users, students, byStatus] = await Promise.all([
    prisma.school.count(),
    prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
    prisma.student.count(),
    prisma.school.groupBy({ by: ["status"], _count: true }),
  ]);

  const statusCount = new Map(byStatus.map((s) => [s.status, s._count]));
  const trialsEndingSoon = await prisma.school.count({
    where: { status: "TRIAL", trialEndsAt: { lte: new Date(Date.now() + 7 * 86_400_000), gte: new Date() } },
  });

  return {
    schools, users, students,
    active: statusCount.get("ACTIVE") ?? 0,
    trial: statusCount.get("TRIAL") ?? 0,
    pending: statusCount.get("PENDING") ?? 0,
    suspended: (statusCount.get("SUSPENDED") ?? 0) + (statusCount.get("PAST_DUE") ?? 0),
    trialsEndingSoon,
  };
}

export type SchoolListFilter = { status?: string; q?: string };

export async function listSchools(f: SchoolListFilter) {
  const q = (f.q ?? "").trim();
  const schools = await prisma.school.findMany({
    where: {
      ...(f.status && f.status !== "tumu" ? { status: f.status } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }] } : {}),
    },
    include: { _count: { select: { users: true, students: true } } },
    orderBy: [{ createdAt: "desc" }],
  });
  return schools;
}

export async function getSchoolDetail(schoolId: string) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) return null;

  const [users, studentCount, auditLog, paymentLinks] = await Promise.all([
    prisma.user.findMany({ where: { schoolId }, orderBy: [{ role: "asc" }, { name: "asc" }] }),
    prisma.student.count({ where: { schoolId } }),
    prisma.auditLog.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" }, take: 15, include: { actor: { select: { name: true } } } }),
    listPaymentLinks(schoolId),
  ]);

  return { school, users, studentCount, auditLog, paymentLinks };
}

export async function globalAuditLog(limit = 60) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" }, take: limit,
    include: { actor: { select: { name: true, role: true } }, school: { select: { name: true, slug: true } } },
  });
}
