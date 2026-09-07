import { Tabs } from "@/components/ui";

/** Finans modülünün üst sekmeleri. Her sayfa hangi sekmede olduğunu kendisi bildirir;
 *  aktif sekmeyi pathname'den okumak için sayfaları istemci bileşenine çevirmeye gerek kalmaz. */
export function FinanceTabs({ active }: { active: "genel" | "tahsilatlar" | "giderler" }) {
  return (
    <Tabs
      active={active}
      items={[
        { key: "genel", label: "Genel", href: "/app/finans" },
        { key: "tahsilatlar", label: "Tahsilatlar", href: "/app/finans/tahsilatlar" },
        { key: "giderler", label: "Giderler", href: "/app/finans/giderler" },
      ]}
    />
  );
}
