import { Tabs } from "@/components/ui";

/** CRM'in üst sekmeleri. Aktif sekmeyi her sayfa kendisi bildirir. */
export function CrmTabs({ active }: { active: "pipeline" | "liste" }) {
  return (
    <Tabs
      active={active}
      items={[
        { key: "pipeline", label: "Pipeline", href: "/app/crm" },
        { key: "liste", label: "Liste", href: "/app/crm/liste" },
      ]}
    />
  );
}
