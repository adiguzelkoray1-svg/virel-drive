import type { AttendanceCheck } from "./theory";

/** Teorik ders formunun sunucu aksiyonuyla paylaştığı durum.
 *  "use server" dosyası yalnızca async fonksiyon dışa aktarabildiği için sabitler burada. */
export type TheoryFormState = {
  checks: AttendanceCheck[];
  ready: boolean;
  error?: string;
  values?: Record<string, string>;
};

export const emptyTheoryState: TheoryFormState = { checks: [], ready: false };
