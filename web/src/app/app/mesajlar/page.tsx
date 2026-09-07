import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui";
import { threadList } from "@/lib/messages";

export const metadata: Metadata = { title: "Mesajlar" };

/** Konuşma seçilmemişken en son mesajlaşılan kursiyere yönlendirir — boş bir
 *  orta panelle karşılaşmak yerine, gelen kutusuna girer girmez bir sohbet açık olur. */
export default async function MessagesIndexPage() {
  const user = await requirePermission("message.send");
  const threads = await threadList(user.schoolId);

  if (threads.length > 0) redirect(`/app/mesajlar/${threads[0].studentId}`);

  return (
    <Card>
      <EmptyState icon="message" title="Henüz mesaj yok." desc="Bir kursiyerle konuşma başladığında burada görünecek." />
    </Card>
  );
}
