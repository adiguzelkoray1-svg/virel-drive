import type { AvailabilityCheck } from "./availability";

/** Ders formunun sunucu aksiyonuyla paylaştığı durum. "use server" dosyası yalnızca
 *  async fonksiyon dışa aktarabildiği için sabitler burada durur. */
export type LessonFormValues = {
  studentId: string; instructorId: string; vehicleId: string;
  kind: string; date: string; start: string; end: string; note: string;
};

export type LessonFormState = {
  checks: AvailabilityCheck[];
  error?: string;
  ready: boolean;
  info?: string;
  /** Sunucuya giden değerler geri yollanır: React 19 aksiyon sonrası formu sıfırladığı için
   *  alanlar bu değerlerle yeniden doldurulur. */
  values?: LessonFormValues;
};

export const emptyLessonState: LessonFormState = { checks: [], ready: false };
