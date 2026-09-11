/** Kuruş → "₺32.000" (tabular-nums ile hizalanır). */
export const money = (kurus: number, opts: { decimals?: boolean } = {}) => {
  const v = kurus / 100;
  return "₺" + v.toLocaleString("tr-TR", { minimumFractionDigits: opts.decimals ? 2 : 0, maximumFractionDigits: opts.decimals ? 2 : 0 });
};

export const number = (n: number) => n.toLocaleString("tr-TR");

/** Yazdırılan makbuzda görünen belge no — ayrı bir sıra sayacı tutulmuyor, `id`'nin
 *  kendisi zaten benzersiz; tarih önekiyle insan tarafından okunabilir hâle getirilir. */
export const receiptNo = (payment: { id: string; receivedAt: Date | string }) => {
  const d = new Date(payment.receivedAt);
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `MK-${stamp}-${payment.id.slice(-8).toLocaleUpperCase("tr")}`;
};

const TZ = "Europe/Istanbul";
export const date = (d: Date | string) => new Date(d).toLocaleDateString("tr-TR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
export const dateLong = (d: Date | string) => new Date(d).toLocaleDateString("tr-TR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });
export const time = (d: Date | string) => new Date(d).toLocaleTimeString("tr-TR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
export const dayName = (d: Date | string) => new Date(d).toLocaleDateString("tr-TR", { timeZone: TZ, weekday: "long" });
export const dateTime = (d: Date | string) => `${date(d)} ${time(d)}`;

/** "8 / 14 saat" gibi ders saati gösterimi (dakika → saat). */
export const hours = (minutes: number) => {
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h}` : h.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
};

export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toLocaleUpperCase("tr-TR");
};

export const fullName = (s: { firstName: string; lastName: string }) => `${s.firstName} ${s.lastName}`;

/** Telefonu KVKK gereği listelerde maskeler: "0532 •• 41". */
export const maskPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  return `${digits.slice(0, 4)} •• ${digits.slice(-2)}`;
};

export const daysBetween = (a: Date | string, b: Date | string = new Date()) =>
  Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);

/** TC kimlik no'yu KVKK gereği listelerde maskeler: "123 ***** 01". */
export const maskNationalId = (id: string) => {
  const digits = id.replace(/\D/g, "");
  if (digits.length !== 11) return id;
  return `${digits.slice(0, 3)} ***** ${digits.slice(-2)}`;
};

const ONES = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const TENS = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];

/** Üç haneli bir grubu (000-999) Türkçe yazıya çevirir — "yüz"/"bin" tek başınayken
 *  "bir" almaz ("yüz", "biryüz" değil). */
function threeDigitsToWords(n: number): string {
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), o = n % 10;
  return [h ? (h === 1 ? "yüz" : `${ONES[h]} yüz`) : "", TENS[t], ONES[o]].filter(Boolean).join(" ");
}

/** Tam sayıyı Türkçe yazıya çevirir (makbuzlarda meblağın rakamla yanına yazılan hâli). */
export function numberToWordsTr(n: number): string {
  if (n === 0) return "sıfır";
  const groups: [number, string][] = [[1_000_000_000, "milyar"], [1_000_000, "milyon"], [1_000, "bin"], [1, ""]];
  let rest = n;
  const parts: string[] = [];
  for (const [size, label] of groups) {
    const count = Math.floor(rest / size);
    rest %= size;
    if (!count) continue;
    const words = threeDigitsToWords(count);
    parts.push(label === "bin" && count === 1 ? "bin" : `${words} ${label}`.trim());
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** Kuruş → "Bin beş yüz Türk Lirası" gibi makbuz yazısı (kuruş kısmı sıfırsa eklenmez). */
export const moneyInWords = (kurus: number) => {
  const lira = Math.floor(kurus / 100);
  const kr = kurus % 100;
  const liraWords = `${numberToWordsTr(lira)} Türk Lirası`;
  const text = kr ? `${liraWords}, ${numberToWordsTr(kr)} Kuruş` : liraWords;
  return text.charAt(0).toLocaleUpperCase("tr") + text.slice(1);
};
