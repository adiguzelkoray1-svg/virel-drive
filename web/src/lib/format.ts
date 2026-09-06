/** Kuruş → "₺32.000" (tabular-nums ile hizalanır). */
export const money = (kurus: number, opts: { decimals?: boolean } = {}) => {
  const v = kurus / 100;
  return "₺" + v.toLocaleString("tr-TR", { minimumFractionDigits: opts.decimals ? 2 : 0, maximumFractionDigits: opts.decimals ? 2 : 0 });
};

export const number = (n: number) => n.toLocaleString("tr-TR");

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
