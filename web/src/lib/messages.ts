import "server-only";
import { prisma } from "./prisma";

export type ThreadPreview = {
  studentId: string; name: string; licenseClass: string;
  lastBody: string; lastAt: Date; lastDirection: string; lastChannel: string;
  unreadCount: number;
};

/**
 * Kursiyer bazlı konuşma listesi. Ayrı bir Conversation tablosu yok — MessageLog zaten
 * studentId taşıyor, thread'ler bundan JS tarafında gruplanır. Kurstaki mesaj hacmi bir
 * gelen kutusu için küçük kaldığı sürece bu, ayrı bir tabloyu senkron tutmaktan daha basit.
 */
export async function threadList(schoolId: string, q = ""): Promise<ThreadPreview[]> {
  const needle = q.trim().toLocaleLowerCase("tr");
  const messages = await prisma.messageLog.findMany({
    where: { schoolId, studentId: { not: null } },
    orderBy: { sentAt: "desc" },
    include: { student: { select: { id: true, firstName: true, lastName: true, licenseClass: true } } },
  });

  const byStudent = new Map<string, typeof messages>();
  for (const m of messages) {
    if (!m.student) continue;
    byStudent.set(m.studentId!, [...(byStudent.get(m.studentId!) ?? []), m]);
  }

  const threads: ThreadPreview[] = [...byStudent.entries()]
    .map(([studentId, msgs]) => {
      const last = msgs[0];
      return {
        studentId, name: `${last.student!.firstName} ${last.student!.lastName}`, licenseClass: last.student!.licenseClass,
        lastBody: last.body, lastAt: last.sentAt ?? last.createdAt, lastDirection: last.direction, lastChannel: last.channel,
        unreadCount: msgs.filter((m) => m.direction === "IN" && m.status !== "READ").length,
      };
    })
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());

  if (!needle) return threads;
  return threads.filter((t) => t.name.toLocaleLowerCase("tr").includes(needle));
}

export async function getThread(schoolId: string, studentId: string) {
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) return null;

  const messages = await prisma.messageLog.findMany({
    where: { schoolId, studentId },
    orderBy: [{ sentAt: "asc" }, { createdAt: "asc" }],
  });
  return { student, messages };
}

/** Ayın gönderim özetini ve kanal payını çıkarır — sağ panelde küçük istatistik kartı için. */
export async function messageSummary(schoolId: string) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthly = await prisma.messageLog.findMany({
    where: { schoolId, OR: [{ sentAt: { gte: monthStart } }, { sentAt: null, createdAt: { gte: monthStart } }] },
    select: { direction: true, channel: true, studentId: true },
  });

  const out = monthly.filter((m) => m.direction === "OUT");
  const inbound = monthly.filter((m) => m.direction === "IN");
  // Yanıt oranı: bu ay mesaj gönderilen kursiyerlerden kaçı yanıt verdi (mesaj bazlı değil,
  // kursiyer bazlı — aksi halde tek bir sohbetkan kursiyer oranı yapay şişirir).
  const outStudents = new Set(out.map((m) => m.studentId).filter(Boolean));
  const repliedStudents = new Set(inbound.map((m) => m.studentId).filter(Boolean));
  const responseRate = outStudents.size ? Math.round(([...repliedStudents].filter((id) => outStudents.has(id)).length / outStudents.size) * 100) : 0;

  const byChannel = new Map<string, number>();
  for (const m of out) byChannel.set(m.channel, (byChannel.get(m.channel) ?? 0) + 1);
  const topChannel = [...byChannel.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    sentThisMonth: out.length,
    responseRate,
    topChannel: topChannel ? { channel: topChannel[0], share: out.length ? Math.round((topChannel[1] / out.length) * 100) : 0 } : null,
  };
}
