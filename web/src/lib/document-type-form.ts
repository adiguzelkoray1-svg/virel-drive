/** Belge türü formunun sunucu aksiyonuyla paylaştığı durum tipi.
 *  "use server" dosyaları yalnızca async fonksiyon dışa aktarabildiği için sabitler burada durur. */
export type DocumentTypeFormState = { error?: string; values?: Record<string, string> };
export const emptyDocumentTypeState: DocumentTypeFormState = {};
