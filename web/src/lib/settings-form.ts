/** Ayarlar formlarının sunucu aksiyonlarıyla paylaştığı durum tipleri.
 *  "use server" dosyaları yalnızca async fonksiyon dışa aktarabildiği için sabitler burada. */
export type RegulationFormState = { error?: string; ok?: boolean };
export const emptyRegulationState: RegulationFormState = {};

export type ClassRuleFormState = { error?: string; values?: Record<string, string> };
export const emptyClassRuleState: ClassRuleFormState = {};

export type IntegrationsFormState = { error?: string; ok?: boolean };
export const emptyIntegrationsState: IntegrationsFormState = {};
