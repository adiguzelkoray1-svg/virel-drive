/** CRM formlarının sunucu aksiyonlarıyla paylaştığı durum tipleri.
 *  "use server" dosyaları yalnızca async fonksiyon dışa aktarabildiği için sabitler burada. */
export type LeadFormState = { error?: string; values?: Record<string, string> };
export const emptyLeadState: LeadFormState = {};

export type ContactFormState = { error?: string; values?: Record<string, string> };
export const emptyContactState: ContactFormState = {};

export type ConvertFormState = { error?: string; values?: Record<string, string> };
export const emptyConvertState: ConvertFormState = {};

/** Temas kanalları — aday kaynağından farklı: kaynak adayın nereden geldiği,
 *  kanal ise son görüşmenin hangi yolla yapıldığı. */
export const CONTACT_CHANNELS = [
  { key: "PHONE", label: "Telefon" },
  { key: "WHATSAPP", label: "WhatsApp" },
  { key: "SMS", label: "SMS" },
  { key: "EMAIL", label: "E-posta" },
  { key: "WALK_IN", label: "Kurumda görüşme" },
] as const;

export const LOST_REASONS = ["Fiyat", "Başka kursa kaydoldu", "Vazgeçti", "Ulaşılamadı", "Zamanı uygun değil", "Diğer"] as const;
