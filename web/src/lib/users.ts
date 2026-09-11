import "server-only";
import { prisma } from "./prisma";

/** Kursun idari/branş kullanıcıları — kursiyer (STUDENT) hariç, o listeye Kursiyerler'den
 *  bakılır ve sayıca çok daha büyüktür. Eğitmen/teorik öğretmen satırları, giriş erişimi
 *  Eğitmenler sayfasından bağlandıysa buradaki listede de görünür (User zaten tek kaynak). */
export async function listSchoolUsers(schoolId: string) {
  return prisma.user.findMany({
    where: { schoolId, role: { not: "STUDENT" } },
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }],
  });
}
