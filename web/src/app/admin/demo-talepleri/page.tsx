import type { Metadata } from "next";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { listDemoRequests, DEMO_SIZES, DEMO_STATUS_LABEL } from "@/lib/demo";
import { setDemoStatusAction } from "@/app/actions/demo";
import { dateTime, initials } from "@/lib/format";

export const metadata: Metadata = { title: "Demo Talepleri" };

export default async function DemoRequestsPage() {
  const requests = await listDemoRequests();
  const sizeLabel = (k: string | null) => DEMO_SIZES.find((s) => s.key === k)?.label ?? "—";
  const newCount = requests.filter((d) => d.status === "NEW").length;

  return (
    <>
      <PageHeader title="Demo Talepleri" sub={`Tanıtım sayfasındaki formdan gelir · ${newCount} yeni talep`} />
      <Card>
        {requests.length === 0 ? (
          <EmptyState icon="inbox-in" title="Henüz demo talebi yok" desc="Tanıtım sayfasındaki (/) form doldurulunca burada listelenir." />
        ) : (
          requests.map((d, i) => {
            const st = DEMO_STATUS_LABEL[d.status] ?? DEMO_STATUS_LABEL.NEW;
            return (
              <div key={d.id} id={`demo-${d.id}`} className={`px-5 py-4 flex flex-col gap-3 ${i < requests.length - 1 ? "border-b border-surface-2" : ""}`}>
                <div className="flex items-center gap-3.5 flex-wrap">
                  <span className="avatar bg-blue-050 text-blue-700 rounded-[9px]" style={{ width: 40, height: 40, fontSize: 14 }}>{initials(d.schoolName)}</span>
                  <span className="flex flex-col flex-1 min-w-0">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-text">{d.schoolName}</span>
                      <Badge kind={st.kind} dot>{st.label}</Badge>
                    </span>
                    <span className="text-xs text-text-2">{d.city ?? "—"} · {sizeLabel(d.size)}</span>
                    <span className="text-xs text-muted">{d.name} · <a href={`mailto:${d.email}`} className="text-blue">{d.email}</a>{d.phone ? ` · ${d.phone}` : ""} · {dateTime(d.createdAt)}</span>
                  </span>
                  <div className="ml-auto flex gap-2 flex-wrap justify-end">
                    {d.status === "NEW" && <form action={setDemoStatusAction}><input type="hidden" name="id" value={d.id} /><button name="status" value="CONTACTED" className="btn btn-secondary btn-xs">Görüşüldü</button></form>}
                    {(d.status === "NEW" || d.status === "CONTACTED") && <>
                      <form action={setDemoStatusAction}><input type="hidden" name="id" value={d.id} /><button name="status" value="CONVERTED" className="btn btn-primary btn-xs">Deneme açıldı</button></form>
                      <form action={setDemoStatusAction}><input type="hidden" name="id" value={d.id} /><button name="status" value="CLOSED" className="btn btn-ghost btn-xs">Kapat</button></form>
                    </>}
                    {(d.status === "CLOSED" || d.status === "CONVERTED") && <form action={setDemoStatusAction}><input type="hidden" name="id" value={d.id} /><button name="status" value="NEW" className="btn btn-ghost btn-xs">Yeniden aç</button></form>}
                  </div>
                </div>
                {(d.message || d.status !== "CONVERTED") && (
                  <div className="pl-[54px] flex flex-col sm:flex-row gap-3 items-start">
                    {d.message && <p className="text-[13px] text-text-2 bg-bg rounded-[8px] px-3 py-2 flex-1 whitespace-pre-wrap">{d.message}</p>}
                    {d.status !== "CONVERTED" && (
                      <form action={setDemoStatusAction} className="flex gap-2 items-start w-full sm:w-[360px]">
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="status" value={d.status} />
                        <input name="note" defaultValue={d.note ?? ""} placeholder="Görüşme notu…" className="input h-9 text-[13px]" />
                        <button className="btn btn-secondary btn-xs h-9">Kaydet</button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>
    </>
  );
}
