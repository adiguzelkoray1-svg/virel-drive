import { requireSchoolUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stopImpersonationAction } from "@/app/actions/admin";
import { Sidebar, type NavGroup, type NavItem } from "@/components/shell/Sidebar";
import { Header } from "@/components/shell/Header";
import { Icon } from "@/components/icons";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import { can, type Permission } from "@/lib/permissions";
import { initials } from "@/lib/format";

const NAV: NavGroup[] = [
  [
    { href: "/app", label: "Dashboard", icon: "home" },
    { href: "/app/takvim", label: "Takvim", icon: "calendar" },
    { href: "/app/dersler", label: "Direksiyon Dersleri", icon: "wheel" },
    { href: "/app/teorik", label: "Teorik Eğitim", icon: "book" },
    { href: "/app/sinavlar", label: "Sınavlar", icon: "exam" },
  ],
  [
    { href: "/app/kursiyerler", label: "Kursiyerler", icon: "users" },
    { href: "/app/on-kayitlar", label: "Ön Kayıtlar", icon: "inbox-in" },
    { href: "/app/egitmenler", label: "Eğitmenler", icon: "badge-id" },
  ],
  [
    { href: "/app/araclar", label: "Araçlar", icon: "car" },
    { href: "/app/belgeler", label: "Belgeler", icon: "folder" },
  ],
  [
    { href: "/app/finans", label: "Finans", icon: "wallet" },
    { href: "/app/crm", label: "CRM", icon: "funnel" },
    { href: "/app/raporlar", label: "Raporlar", icon: "chart" },
    { href: "/app/mesajlar", label: "Mesajlar", icon: "message" },
  ],
  [{ href: "/app/ayarlar", label: "Ayarlar", icon: "settings" }],
];

/** Menü öğesi → gerekli yetki. Yetkisi olmayan rol öğeyi hiç görmez. */
const NAV_PERM: Record<string, Permission> = {
  "/app/finans": "finance.read",
  "/app/raporlar": "report.read",
  "/app/crm": "lead.read",
  "/app/on-kayitlar": "lead.read",
  "/app/ayarlar": "settings.write",
  "/app/egitmenler": "instructor.read",
  "/app/araclar": "vehicle.read",
  "/app/belgeler": "document.read",
  "/app/mesajlar": "message.send",
  "/app/teorik": "theory.read",
};

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const user = await requireSchoolUser();
  const school = user.school;

  const [leadCount, unreadMessages] = await Promise.all([
    prisma.lead.count({ where: { schoolId: school.id, stage: { notIn: ["WON", "LOST"] } } }),
    prisma.messageLog.count({ where: { schoolId: school.id, direction: "IN", status: { not: "READ" } } }),
  ]);

  const counts: Record<string, number> = { "/app/on-kayitlar": leadCount, "/app/mesajlar": unreadMessages };
  const groups = NAV
    .map((g) =>
      g
        .filter((i) => !NAV_PERM[i.href] || can(user.role, NAV_PERM[i.href]))
        .map((i): NavItem => (counts[i.href] ? { ...i, count: counts[i.href] } : i)),
    )
    .filter((g) => g.length);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {user.impersonating && (
        <div className="h-9 bg-warning text-on-brand flex items-center justify-center gap-3 px-4 text-[13px] font-semibold shrink-0">
          <Icon name="eye" size={14} />
          <span>Süper admin olarak <b>{school.name}</b> görüntüleniyor</span>
          <form action={stopImpersonationAction}>
            <button className="underline underline-offset-2">Konsola dön</button>
          </form>
        </div>
      )}
      <div className="flex flex-1 min-h-0">
        <div className="hidden lg:flex">
          <Sidebar
            groups={groups}
            context={{ title: school.name, sub: [school.district, school.city].filter(Boolean).join(", ") || "Sürücü kursu", initials: initials(school.name) }}
            user={{ name: user.name, title: ROLE_LABEL[user.role as Role] ?? user.role }}
            footer={[
              ...(["DRIVING_INSTRUCTOR", "THEORY_TEACHER"].includes(user.role) ? [{ href: "/egitmen", label: "Mobil görünüm", icon: "phone" as const }] : []),
              { href: "/app/kurs", label: "Kurs Profili", icon: "building" },
              { href: "/app/destek", label: "Destek", icon: "help" },
            ]}
          />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="hidden lg:block">
            <Header searchPlaceholder="Kursiyer, telefon, eğitmen veya araç ara…" newHref="/app/dersler/yeni" newLabel="Yeni Ders" user={{ name: user.name }} alerts={1} />
          </div>
          <main className="flex-1 px-4 pt-5 pb-6 lg:px-8 lg:pt-7 lg:pb-8 flex flex-col gap-[22px]">{children}</main>
        </div>
      </div>
    </div>
  );
}
