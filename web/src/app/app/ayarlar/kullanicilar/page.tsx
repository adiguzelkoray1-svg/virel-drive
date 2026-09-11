import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { listSchoolUsers } from "@/lib/users";
import { toggleUserActiveAction } from "@/app/actions/users";
import { Badge, Notice, PersonAvatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { UserForm } from "./UserForm";

export const metadata: Metadata = { title: "Kullanıcılar ve roller · Ayarlar" };

const NOTICE: Record<string, { kind: "success" | "info" | "danger"; text: string }> = {
  aktif: { kind: "success", text: "Kullanıcı tekrar aktif edildi." },
  pasif: { kind: "info", text: "Kullanıcı pasife alındı; artık giriş yapamaz." },
  kendini: { kind: "danger", text: "Kendi hesabınızı pasife alamazsınız." },
  sonowner: { kind: "danger", text: "Kurstaki tek aktif kurs sahibi pasife alınamaz — önce başka bir kurs sahibi/yönetici atayın." },
  bulunamadi: { kind: "danger", text: "Kullanıcı bulunamadı." },
};

export default async function UsersPage({ searchParams }: PageProps<"/app/ayarlar/kullanicilar">) {
  const admin = await requirePermission("users.manage");
  const sp = await searchParams;
  const users = await listSchoolUsers(admin.schoolId);

  const notice = (typeof sp.durum === "string" && NOTICE[sp.durum]) || (typeof sp.hata === "string" && NOTICE[sp.hata]) || null;

  return (
    <>
      <div className="card p-5 flex items-start gap-3">
        <span className="w-[34px] h-[34px] rounded-md bg-blue-050 text-blue flex items-center justify-center shrink-0"><Icon name="users" size={18} /></span>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="h-card">Kullanıcılar ve roller</span>
          <span className="text-[13px] text-text-2 leading-relaxed max-w-[620px]">
            Kurs sahibi, yönetici, sekreter ve muhasebe hesapları burada açılır. Direksiyon eğitmeni ve
            teorik öğretmenin girişi kendi profiline (Eğitmenler sayfası) bağlanır, kursiyer portalı
            erişimi ise kursiyerin kendi kartından açılır — ikisi de aynı yerde tekrar bilgi girmemek içindir.
          </span>
        </div>
      </div>

      {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

      <UserForm />

      <div className="card">
        <header className="flex items-center gap-2.5 px-5 pt-5 pb-3">
          <h2 className="h-card">Kullanıcılar</h2>
          <span className="ml-auto text-xs text-muted">{users.length} kullanıcı</span>
        </header>
        {users.length === 0 ? (
          <p className="px-5 pb-5 text-[13px] text-text-2">Henüz kullanıcı yok.</p>
        ) : (
          <div className="px-5 pb-4">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2.5 border-t border-border first:border-0">
                <PersonAvatar name={u.name} size={30} />
                <span className="flex flex-col min-w-0">
                  <span className="text-[13px] font-semibold truncate">{u.name}{u.id === admin.id && <span className="text-muted font-normal"> (siz)</span>}</span>
                  <span className="text-xs text-muted truncate">{u.email}</span>
                </span>
                <Badge kind={u.role === "OWNER" ? "brand" : "neutral"}>{ROLE_LABEL[u.role as Role] ?? u.role}</Badge>
                {!u.isActive && <Badge kind="danger">Pasif</Badge>}
                <span className="ml-auto text-xs text-muted hidden sm:inline">{u.lastLoginAt ? `Son giriş ${dateTime(u.lastLoginAt)}` : "Hiç giriş yapmadı"}</span>
                {u.id !== admin.id && (
                  <form action={toggleUserActiveAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button className="btn btn-ghost btn-xs" aria-label={u.isActive ? "Pasife al" : "Aktif et"} title={u.isActive ? "Pasife al" : "Aktif et"}>
                      <Icon name={u.isActive ? "x-circle" : "check-circle"} size={14} />
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
