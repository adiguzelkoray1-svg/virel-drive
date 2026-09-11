/** Bir etiketten teknik bir anahtar türetir (LicenseClassRule.code'un aksine kullanıcıdan
 *  ayrıca istenmez — DocumentTypeRule ve MessageTemplateRule kendi anahtarını buradan alır).
 *  Türkçe karakterler katlanır, boşluk `_` olur. */
export const keyFromLabel = (label: string) =>
  label.toLocaleUpperCase("tr").replace(/İ/g, "I").replace(/Ğ/g, "G").replace(/Ü/g, "U").replace(/Ş/g, "S").replace(/Ö/g, "O").replace(/Ç/g, "C")
    .replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "ANAHTAR";

/** Mesaj şablonlarında `{ad}` kursiyerin, `{kurs}` kursun adıyla değiştirilir — bkz. şemadaki
 *  MessageTemplateRule notu. Client component'ten de çağrılabilsin diye burada, server-only
 *  değil (Composer.tsx şablon seçilince bunu tarayıcıda uyguluyor). */
export const fillTemplate = (body: string, vars: { ad: string; kurs: string }) =>
  body.replace(/\{ad\}/g, vars.ad).replace(/\{kurs\}/g, vars.kurs);
