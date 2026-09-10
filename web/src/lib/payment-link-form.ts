/** Ödeme linki formunun sunucu aksiyonuyla paylaştığı durum tipi.
 *  "use server" dosyaları yalnızca async fonksiyon dışa aktarabildiği için sabitler burada. */
export type PaymentLinkFormState = { error?: string; url?: string };
export const emptyPaymentLinkState: PaymentLinkFormState = {};
