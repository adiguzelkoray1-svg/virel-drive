/** Belge formlarının sunucu aksiyonlarıyla paylaştığı durum tipi.
 *  "use server" dosyaları yalnızca async fonksiyon dışa aktarabildiği için sabitler burada. */
export type DocumentFormState = { error?: string };
export const emptyDocumentState: DocumentFormState = {};
