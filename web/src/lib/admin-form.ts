/** Süper admin formlarının sunucu aksiyonlarıyla paylaştığı durum tipleri.
 *  "use server" dosyaları yalnızca async fonksiyon dışa aktarabildiği için sabitler burada. */
export type SchoolFormState = { error?: string; values?: Record<string, string> };
export const emptySchoolState: SchoolFormState = {};

export type PlanFormState = { error?: string; ok?: boolean };
export const emptyPlanState: PlanFormState = {};
