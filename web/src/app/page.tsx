import { redirect } from "next/navigation";
import { getLiveSession } from "@/lib/auth";

export default async function Home() {
  const session = await getLiveSession();
  if (!session) redirect("/giris");
  redirect(session.role === "SUPER_ADMIN" ? "/admin" : session.role === "STUDENT" ? "/kursiyer" : "/app");
}
