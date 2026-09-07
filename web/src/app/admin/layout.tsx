import { requireSuperAdmin } from "@/lib/auth";
import { Sidebar, type NavGroup } from "@/components/shell/Sidebar";

const NAV: NavGroup[] = [[{ href: "/admin", label: "Kurslar", icon: "building" }, { href: "/admin/denetim", label: "Denetim Kaydı", icon: "list" }]];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireSuperAdmin();

  return (
    <div className="min-h-screen flex bg-bg">
      <div className="hidden lg:flex">
        <Sidebar
          groups={NAV}
          context={{ title: "Virel Drive", sub: "Süper Admin Konsolu", initials: "VD" }}
          user={{ name: user.name, title: "Süper Admin" }}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 pt-5 pb-6 lg:px-8 lg:pt-7 lg:pb-8 flex flex-col gap-[22px]">{children}</main>
      </div>
    </div>
  );
}
