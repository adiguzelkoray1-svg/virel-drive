/** Mesaj gönderme formunun sunucu aksiyonuyla paylaştığı durum.
 *  "use server" dosyaları yalnızca async fonksiyon dışa aktarabildiği için sabit burada. */
export type SendMessageState = { error?: string; body?: string };
export const emptySendMessageState: SendMessageState = {};
