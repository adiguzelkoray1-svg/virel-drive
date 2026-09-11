import "server-only";
import { prisma } from "./prisma";

const PAGE_SIZE = 40;

/** Kurs-içi denetim kaydı — süper adminin `/admin/denetim`deki global listesinin kurs-taraflı
 *  karşılığı. `action`/aktör adına göre serbest metin arama ve basit sayfalama içerir. */
export async function schoolAuditLog(schoolId: string, opts: { q?: string; page?: number } = {}) {
  const q = (opts.q ?? "").trim();
  const page = Math.max(1, opts.page ?? 1);

  const where = {
    schoolId,
    ...(q
      ? { OR: [{ action: { contains: q, mode: "insensitive" as const } }, { actor: { name: { contains: q, mode: "insensitive" as const } } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { actor: { select: { name: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { rows, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
