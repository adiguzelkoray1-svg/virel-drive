import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSchoolDetail } from "@/lib/admin";
import { updateSchoolStatusAction, startImpersonationAction } from "@/app/actions/admin";
import { Badge, Card, Notice, PageHeader, PersonAvatar, ProgressBar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ROLE_LABEL, SCHOOL_PLAN_LABEL, SCHOOL_STATUS_LABEL, type Role } from "@/lib/constants";
import { date, dateTime, number } from "@/lib/format";
import { PlanForm } from "./PlanForm";

export async function generateMetadata({ params }: PageProps<"/admin/kurslar/[id]">): Promise<Metadata> {
  const { id } = await params;
  const d = await getSchoolDetail(id);
  return { title: d ? `${d.school.name} · Süper Admin` : "Süper Admin" };
}

const STATUS_OPTIONS = ["PENDING", "TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "DELETED"] as const;

export default async function SchoolDetailPage({ params, searchParams }: PageProps<"/admin/kurslar/[id]">) {
  const { id } = await params;
  const sp = await searchParams;

  const d = await getSchoolDetail(id);
  if (!d) notFound();
  const { school, users, studentCount, auditLog } = d;

  const st = SCHOOL_STATUS_LABEL[school.status] ?? SCHOOL_STATUS_LABEL.PENDING;
  const userPct = school.userLimit ? Math.min(100, Math.round((users.length / school.userLimit) * 100)) : 0;
  const studentPct = school.studentLimit ? Math.min(100, Math.round((studentCount / school.studentLimit) * 100)) : 0;
  const owner = users.find((u) => u.role === "OWNER");

  return (
    <>
      <PageHeader title={school.name} sub={[school.district, school.city].filter(Boolean).join(", ") || school.slug}>
        <form action={startImpersonationAction}>
          <input type="hidden" name="schoolId" value={school.id} />
          <button className="btn btn-primary btn-sm"><Icon name="eye" size={15} />Kurs olarak görüntüle</button>
        </form>
        <Link href="/admin" className="btn btn-secondary btn-sm"><Icon name="chev-left" size={15} />Kurslar</Link>
      </PageHeader>

      {sp.durum === "guncellendi" && <Notice kind="success">Kurs durumu güncellendi.</Notice>}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <Card>
            <div className="px-5 py-5 flex items-center gap-4 flex-wrap">
              <span className="w-11 h-11 rounded-md bg-blue-050 text-blue flex items-center justify-center shrink-0"><Icon name="building" size={22} /></span>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-display text-[17px] font-bold tracking-[-0.01em] truncate">{school.name}</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge kind={st.kind} dot>{st.label}</Badge>
                  <Badge kind="brand">{SCHOOL_PLAN_LABEL[school.plan] ?? school.plan}</Badge>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-4">
              <Field label="Kurs sahibi" value={owner ? owner.name : "Atanmadı"} />
              <Field label="Telefon" value={school.phone ?? "—"} />
              <Field label="E-posta" value={school.email ?? "—"} />
              <Field label="Kayıt tarihi" value={date(school.createdAt)} />
              <Field label="Onay tarihi" value={school.approvedAt ? date(school.approvedAt) : "—"} />
              <Field label="Deneme bitişi" value={school.trialEndsAt ? date(school.trialEndsAt) : "—"} />
              <Field label="Vergi no" value={school.taxNumber ?? "—"} />
              <Field label="MEB kurum kodu" value={school.mebCode ?? "—"} />
            </div>
          </Card>

          <Card>
            <header className="px-5 pt-5 pb-1"><h2 className="h-card">Kullanım</h2></header>
            <div className="px-5 pb-5 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-text-2">Kullanıcı</span>
                  <span className="ml-auto text-[13px] font-semibold tabular">{users.length}/{school.userLimit}</span>
                </div>
                <ProgressBar value={userPct} height={7} />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-text-2">Kursiyer</span>
                  <span className="ml-auto text-[13px] font-semibold tabular">{number(studentCount)}/{number(school.studentLimit)}</span>
                </div>
                <ProgressBar value={studentPct} height={7} />
              </div>
            </div>
          </Card>

          <Card title="Kullanıcılar" sub={`${users.length} kullanıcı`}>
            {users.length === 0 ? (
              <p className="px-5 pb-5 pt-1 text-[13px] text-text-2">Henüz kullanıcı yok.</p>
            ) : (
              <div className="px-5 pb-5 pt-1">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 py-2.5 border-t border-border first:border-0">
                    <PersonAvatar name={u.name} size={30} />
                    <span className="flex flex-col min-w-0">
                      <span className="text-[13px] font-semibold truncate">{u.name}</span>
                      <span className="text-xs text-muted truncate">{u.email}</span>
                    </span>
                    <Badge kind={u.role === "OWNER" ? "brand" : "neutral"}>{ROLE_LABEL[u.role as Role] ?? u.role}</Badge>
                    {!u.isActive && <Badge kind="danger">Pasif</Badge>}
                    <span className="ml-auto text-xs text-muted">{u.lastLoginAt ? `Son giriş ${date(u.lastLoginAt)}` : "Hiç giriş yapmadı"}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Son işlemler" sub="bu kursa ait denetim kaydı">
            {auditLog.length === 0 ? (
              <p className="px-5 pb-5 pt-1 text-[13px] text-text-2">Henüz kayıtlı işlem yok.</p>
            ) : (
              <div className="px-5 pb-5 pt-1">
                {auditLog.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 py-2 border-t border-border first:border-0">
                    <span className="text-[13px] font-mono text-text-2 truncate">{a.action}</span>
                    <span className="text-xs text-muted truncate">{a.actor?.name ?? "Sistem"}</span>
                    <span className="ml-auto text-xs text-muted tabular shrink-0">{dateTime(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Durum" sub="onay, askıya alma, kapatma">
            <form action={updateSchoolStatusAction} className="px-5 pb-5 pt-1 flex flex-col gap-3">
              <input type="hidden" name="schoolId" value={school.id} />
              <select name="status" defaultValue={school.status} className="input">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{SCHOOL_STATUS_LABEL[s].label}</option>)}
              </select>
              <button className="btn btn-secondary btn-sm self-start"><Icon name="check" size={15} />Durumu güncelle</button>
            </form>
          </Card>

          <Card title="Plan ve limitler">
            <PlanForm schoolId={school.id} plan={school.plan} userLimit={school.userLimit} studentLimit={school.studentLimit} />
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="stat-lbl">{label}</div>
      <div className="text-[13px] font-semibold mt-0.5 truncate">{value}</div>
    </div>
  );
}
