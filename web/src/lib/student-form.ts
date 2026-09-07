/** Kursiyer oluşturma/düzenleme formunun sunucu aksiyonuyla paylaştığı durum tipi.
 *  "use server" dosyaları yalnızca async fonksiyon dışa aktarabildiği için burada tutulur. */
export type StudentFormState = { error?: string; values?: Record<string, string> };
export const emptyStudentState: StudentFormState = {};
