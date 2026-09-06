/** Araç formlarının sunucu aksiyonlarıyla paylaştığı durum.
 *  "use server" dosyaları yalnızca async fonksiyon dışa aktarabildiği için sabitler burada. */
export type VehicleFormState = { error?: string; values?: Record<string, string> };
export const emptyVehicleState: VehicleFormState = {};

export type CostFormState = { error?: string; ok?: boolean };
export const emptyCostState: CostFormState = {};
