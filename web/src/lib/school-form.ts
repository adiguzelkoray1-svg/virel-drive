/** Kurs profili formunun sunucu aksiyonuyla paylaştığı durum.
 *  "use server" dosyaları yalnızca async fonksiyon dışa aktarabildiği için sabit burada. */
export type SchoolProfileState = { error?: string; ok?: boolean };
export const emptySchoolProfileState: SchoolProfileState = {};
