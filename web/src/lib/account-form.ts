/** Şifre değiştirme formunun sunucu aksiyonuyla paylaştığı durum tipi.
 *  "use server" dosyaları yalnızca async fonksiyon dışa aktarabildiği için sabitler burada. */
export type ChangePasswordFormState = { error?: string; ok?: boolean };
export const emptyChangePasswordState: ChangePasswordFormState = {};
