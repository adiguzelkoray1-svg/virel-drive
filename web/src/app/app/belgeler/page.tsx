import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Badge, Card, EmptyState, PageHeader, PersonAvatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { documentMatrix, documentSummary, missingDocuments } from "@/lib/documents";
import { listDocumentTypeRules } from "@/lib/document-types";
import { date, number } from "@/lib/format";

export const metadata: Metadata = { title: "Belgeler" };

const CELL_STYLE: Record<string, { bg: string; fg: string; icon: "check" | "eye" | "clock" | "x" }> = {
  OK: { bg: "bg-success-bg", fg: "text-success", icon: "check" },
  REVIEW: { bg: "bg-blue-050", fg: "text-blue", icon: "eye" },
  PENDING: { bg: "bg-warning-bg", fg: "text-warning", icon: "clock" },
  MISSING: { bg: "bg-danger-bg", fg: "text-danger", icon: "x" },
};

// Sütun başlıkları dar olduğu için kısaltılır; tam ad hücrenin title'ında görünür. Kurs kendi
// yerel bir belge türü eklerse burada karşılığı yok — Belge etiketinin ilk 3 harfine düşülür.
const DOC_ABBR: Record<string, string> = {
  NATIONAL_ID: "NÜF", DIPLOMA: "DİP", HEALTH_REPORT: "SAĞ", CRIMINAL_RECORD: "ADL",
  PHOTO: "FOT", DRIVER_CONSENT: "OLR", BLOOD_TYPE: "KAN",
};

export default async function DocumentsPage({ searchParams }: PageProps<"/app/belgeler">) {
  const user = await requirePermission("document.read");
  const sp = await searchParams;
  const q = String(sp.q ?? "").trim();
  const onlyMissing = sp.filtre === "eksik";

  const [rows, summary, missing, types] = await Promise.all([
    documentMatrix(user.schoolId, q),
    documentSummary(user.schoolId),
    missingDocuments(user.schoolId),
    listDocumentTypeRules(user.schoolId, { activeOnly: true }),
  ]);
  const visible = onlyMissing ? rows.filter((r) => r.missingCount > 0) : rows;
  const COLS = `minmax(170px,1fr) 44px 100px repeat(${types.length}, 44px) 150px 16px`;

  return (
    <>
      <PageHeader title="Belgeler" sub={`Kursiyer evraklarının dijital takibi · ${types.length} zorunlu belge`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Evrağı tam" value={number(summary.complete)} sub={`${summary.students} aktif kursiyerden`} tone="text-success" />
        <Stat label="Eksik belge" value={number(summary.missingStudents)} sub="kursiyer · kayıt tamamlanamıyor" tone={summary.missingStudents > 0 ? "text-danger" : undefined} />
        <Stat label="Kontrol bekleyen" value={number(summary.reviewCount)} sub="yüklendi, onay bekliyor" tone="text-blue" />
        <Stat label="Süresi dolacak" value={number(summary.expiringCount)} sub="30 gün içinde" tone={summary.expiringCount > 0 ? "text-warning" : undefined} />
      </div>

      <Card>
        <header className="flex items-center gap-3 px-5 pt-5 pb-3 flex-wrap">
          <h2 className="h-card">Kursiyer evrak durumu</h2>
          <form className="flex items-center gap-2">
            {onlyMissing && <input type="hidden" name="filtre" value="eksik" />}
            <input name="q" defaultValue={q} placeholder="Kursiyer ara…" className="input h-8 text-[13px] w-[200px]" aria-label="Kursiyer ara" />
            <button className="btn btn-secondary btn-xs">Ara</button>
          </form>
          <div className="ml-auto flex items-center gap-3 flex-wrap">
            <Legend />
          </div>
        </header>
        <div className="flex items-center gap-2 px-5 pb-3">
          <Link href={`/app/belgeler${q ? `?q=${encodeURIComponent(q)}` : ""}`} className="chip" data-active={!onlyMissing}>Tümü</Link>
          <Link href={`/app/belgeler?filtre=eksik${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="chip" data-active={onlyMissing}>Eksik belgesi olan</Link>
        </div>

        {visible.length === 0 ? (
          <EmptyState icon="folder" title="Kayıt bulunamadı." desc="Aramayı ya da filtreyi değiştirin." />
        ) : (
          <div className="px-5 pb-5 overflow-x-auto">
            <div style={{ minWidth: `${180 + 44 + 100 + types.length * 40 + 150 + 40}px` }}>
              <div className="grid gap-3 items-center pb-2.5" style={{ gridTemplateColumns: COLS }}>
                <div className="th">Kursiyer</div>
                <div className="th">Sınıf</div>
                <div className="th">Kayıt</div>
                {types.map((t) => (
                  <div key={t.key} className="th text-center leading-tight truncate" title={t.label}>
                    {DOC_ABBR[t.key] ?? t.label.slice(0, 3).toLocaleUpperCase("tr")}
                  </div>
                ))}
                <div className="th">Durum</div>
                <div />
              </div>
              {visible.map((r) => {
                const name = `${r.firstName} ${r.lastName}`;
                // En az bir belge gerçekten eksikse satır "eksik" sayılır ve henüz gelmemiş
                // (bekleyen) belgeler de bu sayıya dahil edilir — ikisi de süreci durduruyor.
                const label = r.missingCount > 0 ? `${r.missingCount + r.pendingCount} belge eksik`
                  : r.reviewCount > 0 ? `${r.reviewCount} belge kontrolde`
                  : r.pendingCount > 0 ? `${r.pendingCount} belge bekliyor`
                  : "Tamamlandı";
                const tone = r.missingCount > 0 ? "danger" : r.reviewCount > 0 ? "brand" : r.pendingCount > 0 ? "warning" : "success";
                return (
                  <Link key={r.studentId} href={`/app/belgeler/${r.studentId}`} className="grid gap-3 items-center py-3 border-t border-border" style={{ gridTemplateColumns: COLS }}>
                    <span className="flex items-center gap-2.5 min-w-0">
                      <PersonAvatar name={name} size={32} />
                      <span className="text-sm font-semibold truncate">{name}</span>
                    </span>
                    <span><Badge kind="brand">{r.licenseClass}</Badge></span>
                    <span className="text-[13px] text-text-2 tabular">{date(r.registeredAt)}</span>
                    {types.map((t) => {
                      const st = r.byType[t.key]?.status ?? "MISSING";
                      const c = CELL_STYLE[st];
                      return (
                        <span key={t.key} className="flex justify-center" title={`${t.label}: ${st}`}>
                          <span className={`w-[26px] h-[26px] rounded-sm flex items-center justify-center ${c.bg} ${c.fg}`}>
                            <Icon name={c.icon} size={14} />
                          </span>
                        </span>
                      );
                    })}
                    <span><Badge kind={tone} dot>{label}</Badge></span>
                    <span className="text-muted"><Icon name="chev-right" size={16} /></span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <Card>
          <header className="flex items-center gap-2.5 px-5 pt-5">
            <h2 className="h-card">Eksik evrak</h2>
            {missing.length > 0 && <Badge kind="danger" dot>{missing.length} kursiyer</Badge>}
          </header>
          <p className="px-5 pt-1.5 text-[13px] text-text-2 leading-relaxed">
            Evrağı eksik kursiyerin kayıt süreci tamamlanmamış sayılır; sınav başvurusu yapılamaz.
          </p>
          {missing.length === 0 ? (
            <EmptyState icon="check-circle" title="Eksik evrak yok." desc="Tüm aktif kursiyerlerin evrakı tam ya da işlemde." />
          ) : (
            <div className="px-5 pb-5 pt-1">
              {missing.map((m) => (
                <div key={m.studentId} className="flex items-start gap-3 py-3 border-t border-border first:border-0">
                  <PersonAvatar name={m.name} size={30} />
                  <Link href={`/app/belgeler/${m.studentId}`} className="flex flex-col gap-0.5 min-w-0 grow">
                    <span className="text-[13.5px] font-semibold truncate">{m.name}</span>
                    <span className="text-[13px] text-text-2 leading-snug">{m.missingTypes.join(" · ")}</span>
                    <span className="text-xs text-muted">Kayıt {m.daysOpen} gündür açık</span>
                  </Link>
                  <Link href={`/app/belgeler/${m.studentId}`} className="btn btn-secondary btn-xs shrink-0">Hatırlat</Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Belge kuralları" sub="zorunlu belgeler ve türleri">
          <div className="px-5 pb-5 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {types.map((t) => (
              <div key={t.key} className="flex items-center gap-2.5 px-3 py-2.5 border border-border rounded-sm">
                <Icon name="file" size={15} className="text-muted shrink-0" />
                <span className="text-[13px] truncate" title={t.label}>{t.label}</span>
                <span className="ml-auto text-xs text-muted shrink-0">{t.validityMonths ? `${t.validityMonths} ay geçerli` : "Süresiz"}</span>
              </div>
            ))}
          </div>
          {can(user.role, "settings.write") && (
            <div className="px-5 pb-5 pt-1">
              <Link href="/app/ayarlar/belgeler" className="text-[13px] font-semibold text-blue">Belge türlerini düzenle →</Link>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className="card p-[18px] flex flex-col gap-1">
      <span className="stat-lbl">{label}</span>
      <span className={`kpi mt-1.5 ${tone ?? ""}`}>{value}</span>
      <span className="text-xs text-muted">{sub}</span>
    </div>
  );
}

function Legend() {
  const items: { key: string; label: string }[] = [
    { key: "OK", label: "Tamamlandı" }, { key: "REVIEW", label: "Kontrol ediliyor" },
    { key: "PENDING", label: "Bekliyor" }, { key: "MISSING", label: "Eksik" },
  ];
  return (
    <>
      {items.map((it) => {
        const c = CELL_STYLE[it.key];
        return (
          <span key={it.key} className="flex items-center gap-1.5 text-[13px] text-text-2">
            <span className={`w-[18px] h-[18px] rounded-sm flex items-center justify-center ${c.bg} ${c.fg}`}><Icon name={c.icon} size={11} /></span>
            {it.label}
          </span>
        );
      })}
    </>
  );
}
