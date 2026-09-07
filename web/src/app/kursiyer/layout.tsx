import { requireStudentUser } from "@/lib/auth";
import { MobileTabBar } from "@/components/mobile/MobileTabBar";

const TABS = [
  { href: "/kursiyer", label: "Ana sayfa", icon: "home" as const },
  { href: "/kursiyer/derslerim", label: "Derslerim", icon: "wheel" as const },
  { href: "/kursiyer/ilerlemem", label: "İlerlemem", icon: "trend" as const },
  { href: "/kursiyer/odemeler", label: "Ödemeler", icon: "wallet" as const },
  { href: "/kursiyer/mesajlar", label: "Mesajlar", icon: "message" as const },
  { href: "/kursiyer/profil", label: "Profil", icon: "user" as const },
];

export default async function StudentPortalLayout({ children }: LayoutProps<"/kursiyer">) {
  await requireStudentUser();
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[480px] mx-auto min-h-screen pb-24 flex flex-col">{children}</div>
      <MobileTabBar root="/kursiyer" tabs={TABS} />
    </div>
  );
}
