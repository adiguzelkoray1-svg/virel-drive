import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { AyarlarNav } from "./AyarlarNav";

export default async function SettingsLayout({ children }: LayoutProps<"/app/ayarlar">) {
  await requirePermission("settings.write");

  return (
    <>
      <PageHeader title="Ayarlar" sub="Kurs, mevzuat, kullanıcı ve entegrasyon ayarları" />
      <div className="grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)] gap-5 items-start">
        <AyarlarNav />
        <div className="flex flex-col gap-5 min-w-0">{children}</div>
      </div>
    </>
  );
}
