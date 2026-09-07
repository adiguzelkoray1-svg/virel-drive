import { requireInstructorUser } from "@/lib/auth";
import { MobileTabBar } from "@/components/mobile/MobileTabBar";

const TABS = [
  { href: "/egitmen", label: "Bugün", icon: "home" as const },
  { href: "/egitmen/takvim", label: "Takvim", icon: "calendar" as const },
  { href: "/egitmen/kursiyerler", label: "Kursiyerler", icon: "users" as const },
  { href: "/egitmen/profil", label: "Profil", icon: "user" as const },
];

export default async function InstructorPortalLayout({ children }: LayoutProps<"/egitmen">) {
  await requireInstructorUser();
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[480px] mx-auto min-h-screen pb-24 flex flex-col">{children}</div>
      <MobileTabBar root="/egitmen" tabs={TABS} />
    </div>
  );
}
