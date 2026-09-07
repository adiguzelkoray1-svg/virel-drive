/** Finans formlarının sunucu aksiyonlarıyla paylaştığı durum tipleri.
 *  "use server" dosyaları yalnızca async fonksiyon dışa aktarabildiği için sabitler burada. */
export type PaymentFormState = { error?: string; values?: Record<string, string> };
export const emptyPaymentState: PaymentFormState = {};

export type ExpenseFormState = { error?: string; values?: Record<string, string> };
export const emptyExpenseState: ExpenseFormState = {};

export type PlanFormState = { error?: string; values?: Record<string, string> };
export const emptyPlanState: PlanFormState = {};

/** Peşinat + n taksitten oluşan bir plandaki taksit tutarlarını hesaplar.
 *  Kuruş tam sayı olduğu için bölünemeyen artık son taksite eklenir; toplam her zaman tutar.
 *  Sunucu aksiyonu ve formdaki önizleme aynı fonksiyonu kullansın diye burada. */
export function buildInstallments(total: number, downPayment: number, count: number) {
  const rest = total - downPayment;
  const base = Math.floor(rest / count / 100) * 100; // kuruş artığı olmasın diye TL'ye yuvarlanır
  const rows = Array.from({ length: count }, () => base);
  rows[count - 1] = rest - base * (count - 1);
  return rows;
}
