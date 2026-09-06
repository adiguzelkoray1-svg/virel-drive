export type ExamFormState = {
  error?: string;
  /** true ise hata "istisnai durum" onayıyla aşılabilir (ör. hak sınırı, eğitim şartı).
   *  false/undefined ise (ör. zaten bekleyen bir başvuru varsa) override anlamsızdır. */
  overridable?: boolean;
  values?: Record<string, string>;
};
export const emptyExamState: ExamFormState = {};
