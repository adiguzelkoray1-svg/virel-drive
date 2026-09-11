/** Kullanıcı/erişim formlarının sunucu aksiyonlarıyla paylaştığı durum tipleri.
 *  "use server" dosyaları yalnızca async fonksiyon dışa aktarabildiği için sabitler burada. */
export type UserFormState = { error?: string; values?: Record<string, string>; ok?: boolean; email?: string; tempPassword?: string };
export const emptyUserState: UserFormState = {};

export type AccessFormState = { error?: string; ok?: boolean; email?: string; tempPassword?: string };
export const emptyAccessState: AccessFormState = {};
