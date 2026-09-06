/** Eğitmen formunun sunucu aksiyonuyla paylaştığı durum.
 *  "use server" dosyaları yalnızca async fonksiyon dışa aktarabildiği için sabitler burada durur. */
export type InstructorFormState = { error?: string; values?: Record<string, string> };
export const emptyInstructorState: InstructorFormState = {};
