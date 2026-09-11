// Durum ve rol sabitleri. Prisma alanları String; etiketler ve rozet tonları burada.
export type BadgeKind = "success" | "warning" | "danger" | "info" | "brand" | "neutral";

/** MEB'in Özel MTSK Modülü'ne giriş sayfası — üçüncü taraf API'si olmadığı için (bkz.
 *  "Entegrasyonlar" hakkında notu) gerçek entegrasyon yerine yalnızca hızlı erişim linki. */
export const MEBBIS_URL = "https://mebbis.meb.gov.tr";

export const ROLES = ["SUPER_ADMIN", "OWNER", "MANAGER", "SECRETARY", "THEORY_TEACHER", "DRIVING_INSTRUCTOR", "ACCOUNTANT", "STUDENT"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Süper Admin",
  OWNER: "Kurs Sahibi",
  MANAGER: "Yönetici",
  SECRETARY: "Sekreter",
  THEORY_TEACHER: "Teorik Öğretmen",
  DRIVING_INSTRUCTOR: "Direksiyon Eğitmeni",
  ACCOUNTANT: "Muhasebe",
  STUDENT: "Kursiyer",
};
export const SCHOOL_ROLES: Role[] = ["OWNER", "MANAGER", "SECRETARY", "THEORY_TEACHER", "DRIVING_INSTRUCTOR", "ACCOUNTANT"];
export const MANAGER_ROLES: Role[] = ["OWNER", "MANAGER"];
export const INSTRUCTOR_ROLES: Role[] = ["THEORY_TEACHER", "DRIVING_INSTRUCTOR"];

export const SCHOOL_STATUS_LABEL: Record<string, { label: string; kind: BadgeKind }> = {
  PENDING: { label: "Onay bekliyor", kind: "neutral" },
  TRIAL: { label: "Deneme", kind: "brand" },
  ACTIVE: { label: "Aktif", kind: "success" },
  PAST_DUE: { label: "Ödeme gecikti", kind: "warning" },
  SUSPENDED: { label: "Askıda", kind: "danger" },
  DELETED: { label: "Silindi", kind: "neutral" },
};

// ---------- Kursiyer ----------
export const STUDENT_STAGES = ["PRE_REGISTRATION", "DOCUMENTS", "THEORY", "ETEST_WAITING", "DRIVING", "DRIVING_EXAM", "GRADUATED"] as const;
export type StudentStage = (typeof STUDENT_STAGES)[number];
export const STAGE_LABEL: Record<StudentStage, string> = {
  PRE_REGISTRATION: "Ön kayıt",
  DOCUMENTS: "Evrak bekleniyor",
  THEORY: "Teorik eğitim",
  ETEST_WAITING: "e-Sınav bekliyor",
  DRIVING: "Direksiyon eğitimi",
  DRIVING_EXAM: "Direksiyon sınavı",
  GRADUATED: "Mezun",
};
/** Süreç ilerlemesi (%) — kursiyer kartındaki "Ehliyet sürecinde %72" bu ağırlıklardan gelir. */
export const STAGE_WEIGHT: Record<StudentStage, number> = {
  PRE_REGISTRATION: 5, DOCUMENTS: 12, THEORY: 25, ETEST_WAITING: 50, DRIVING: 60, DRIVING_EXAM: 90, GRADUATED: 100,
};

export const STUDENT_STATUS_LABEL: Record<string, { label: string; kind: BadgeKind }> = {
  ACTIVE: { label: "Aktif", kind: "success" },
  PASSIVE: { label: "Pasif", kind: "neutral" },
  GRADUATED: { label: "Mezun", kind: "neutral" },
  CANCELLED: { label: "İptal", kind: "danger" },
};

// ---------- Ders ----------
export const LESSON_STATUS_LABEL: Record<string, { label: string; kind: BadgeKind }> = {
  PLANNED: { label: "Bekliyor", kind: "neutral" },
  LIVE: { label: "Devam ediyor", kind: "brand" },
  DONE: { label: "Tamamlandı", kind: "success" },
  CANCELLED: { label: "İptal", kind: "neutral" },
  NO_SHOW: { label: "Gelmedi", kind: "warning" },
};
export const LESSON_KIND_LABEL: Record<string, string> = {
  CITY: "Şehir içi sürüş", PARKING: "Park", HILL: "Yokuş", HIGHWAY: "Otoyol", EXAM_PREP: "Sınav hazırlık",
};

/** Direksiyon gelişim alanları — ders sonu eğitmen değerlendirmesi. */
export const SKILLS = [
  { key: "START_STOP", label: "Kalkış ve durma" },
  { key: "CLUTCH", label: "Debriyaj kontrolü" },
  { key: "GEARS", label: "Vites geçişleri" },
  { key: "MIRRORS", label: "Ayna kullanımı" },
  { key: "LANE", label: "Şerit takibi" },
  { key: "JUNCTION", label: "Kavşak ve dönüş" },
  { key: "PARKING", label: "Park (paralel)" },
  { key: "REVERSE", label: "Geri manevra" },
  { key: "HILL_START", label: "Yokuşta kalkış" },
  { key: "TRAFFIC", label: "Trafikte sürüş" },
  { key: "SAFETY", label: "Sürüş güvenliği" },
] as const;
export const SCORE_LABEL: Record<number, string> = { 1: "Zayıf", 2: "Geliştirilmeli", 3: "Orta", 4: "İyi", 5: "Çok iyi" };

// ---------- Teorik ----------
export const THEORY_CATEGORIES = [
  { key: "TRAFFIC", label: "Trafik ve Çevre" },
  { key: "FIRST_AID", label: "İlk Yardım" },
  { key: "ENGINE", label: "Araç Tekniği" },
  { key: "ETHICS", label: "Trafik Adabı" },
] as const;
export const THEORY_CATEGORY_LABEL: Record<string, string> = Object.fromEntries(THEORY_CATEGORIES.map((c) => [c.key, c.label]));

// ---------- Evrak ----------
/** Yeni bir kurs açılırken yazılan başlangıç belge türleri (bkz. DEFAULT_LICENSE_CLASSES ile
 *  aynı gerekçe) — DocumentTypeRule tablosuna tohum olarak yazılır, koda gömülü sabit liste
 *  olarak KULLANILMAZ; kurs kendi yerel bir belge türü eklemek isteyebilir (bkz. Ayarlar ›
 *  Belge kuralları). `validityMonths` boşsa belge süresiz kabul edilir. */
export const DEFAULT_DOCUMENT_TYPES = [
  { key: "NATIONAL_ID", label: "Nüfus cüzdanı fotokopisi", validityMonths: null },
  { key: "DIPLOMA", label: "Diploma / öğrenim belgesi", validityMonths: null },
  { key: "HEALTH_REPORT", label: "Sağlık raporu", validityMonths: 24 },
  { key: "CRIMINAL_RECORD", label: "Adli sicil kaydı", validityMonths: 6 },
  { key: "PHOTO", label: "Biyometrik fotoğraf", validityMonths: null },
  { key: "DRIVER_CONSENT", label: "Sürücü olur belgesi", validityMonths: null },
  { key: "BLOOD_TYPE", label: "Kan grubu belgesi", validityMonths: null },
] as const;
export const DOCUMENT_STATUS_LABEL: Record<string, { label: string; kind: BadgeKind }> = {
  OK: { label: "Tamamlandı", kind: "success" },
  REVIEW: { label: "Kontrol ediliyor", kind: "brand" },
  PENDING: { label: "Bekliyor", kind: "warning" },
  MISSING: { label: "Eksik", kind: "danger" },
};

// ---------- Sınav ----------
export const EXAM_TYPE_LABEL: Record<string, string> = { ETEST: "e-Sınav", DRIVING: "Direksiyon" };
export const EXAM_STATUS_LABEL: Record<string, { label: string; kind: BadgeKind }> = {
  PLANNED: { label: "Planlandı", kind: "brand" },
  APPLIED: { label: "Başvuru onaylandı", kind: "brand" },
  DONE: { label: "Tamamlandı", kind: "neutral" },
  CANCELLED: { label: "İptal", kind: "neutral" },
};

// ---------- CRM ----------
export const LEAD_STAGES = [
  { key: "NEW", label: "Yeni başvuru", color: "#0067C4" },
  { key: "INFORMED", label: "Bilgi verildi", color: "#00A9BF" },
  { key: "QUOTED", label: "Fiyat gönderildi", color: "#12A87C" },
  { key: "FOLLOW_UP", label: "Takip bekliyor", color: "#D9713C" },
  { key: "MEETING", label: "Kayıt görüşmesi", color: "#6C8EA4" },
  { key: "WON", label: "Kayıt oldu", color: "#12A87C" },
  { key: "LOST", label: "Kaybedildi", color: "#78909F" },
] as const;
export const LEAD_SOURCE_LABEL: Record<string, string> = {
  INSTAGRAM: "Instagram", WEB: "Web formu", REFERRAL: "Tavsiye", PHONE: "Telefon", WALK_IN: "Kurumdan", OTHER: "Diğer",
};

// ---------- Finans ----------
export const INSTALLMENT_STATUS_LABEL: Record<string, { label: string; kind: BadgeKind }> = {
  PAID: { label: "Ödendi", kind: "success" },
  PENDING: { label: "Bekliyor", kind: "neutral" },
  OVERDUE: { label: "Gecikti", kind: "danger" },
  CANCELLED: { label: "İptal", kind: "neutral" },
};
export const PAYMENT_METHOD_LABEL: Record<string, string> = { CASH: "Nakit", CARD: "Kart", TRANSFER: "Havale/EFT", ONLINE: "Online" };
export const EXPENSE_CATEGORY_LABEL: Record<string, string> = {
  RENT: "Kira", SALARY: "Personel", VEHICLE: "Araç", UTILITY: "Fatura", MARKETING: "Pazarlama", OTHER: "Diğer",
};
export const EXPENSE_SUBCATEGORY_LABEL: Record<string, string> = { MAAS: "Maaş", AVANS: "Avans" };

// ---------- Araç ----------
export const VEHICLE_STATUS_LABEL: Record<string, { label: string; kind: BadgeKind }> = {
  ACTIVE: { label: "Aktif", kind: "success" },
  MAINTENANCE: { label: "Bakımda", kind: "warning" },
  PASSIVE: { label: "Pasif", kind: "neutral" },
};
export const VEHICLE_COST_LABEL: Record<string, string> = {
  FUEL: "Yakıt", SERVICE: "Bakım", TIRE: "Lastik", INSURANCE: "Sigorta", INSPECTION: "Muayene", REPAIR: "Tamir", PENALTY: "Ceza", OTHER: "Diğer",
};
export const VEHICLE_USAGE_LABEL: Record<string, string> = { TRAINING: "Eğitim aracı", EXAM: "Sınav aracı" };

// ---------- Eğitmen ----------
export const INSTRUCTOR_BRANCH_LABEL: Record<string, string> = { DRIVING: "Direksiyon Eğitmeni", THEORY: "Teorik Öğretmen" };
/** Eğitmenin sınıf/branş listesi virgülle saklanır ("B,A2"); okunurken bölünür. */
export const splitCsv = (value: string | null | undefined) => (value ?? "").split(",").map((v) => v.trim()).filter(Boolean);
export const joinCsv = (values: string[]) => values.join(",");

/**
 * Mevzuata bağlı değerler koda gömülmez; kurs bazında RegulationSetting'te tutulur.
 * Buradaki sayılar yalnızca yeni bir kurs açılırken yazılan başlangıç değerleridir.
 */
export const REGULATION_DEFAULTS = {
  drivingLessonMinutes: "90",     // tek dersin süresi (dk)
  dailyMaxLessonHours: "2",       // kursiyer başına günlük azami ders (saat)
  minGapBetweenLessonsHours: "12",
  theoryAttendanceMinPercent: "85",
  lessonCancelHours: "24",
  termWeeks: "14",
  blockExamWithoutHours: "1",     // eğitim saati dolmadan sınav başvurusu engellensin
  blockRegistrationWithoutDocs: "1",
  blockConflictingLessons: "1",
  notifyOnLastExamAttempt: "1",
  studentAppShowsProgress: "1",
} as const;

/** Yeni bir kurs açılırken yazılan başlangıç sertifika sınıfları. Bunlar olmadan kursiyer
 *  ekleme formundaki "Ehliyet sınıfı" seçimi tamamen boş kalır — kursiyer, araç, eğitmen
 *  hiçbiri oluşturulamaz (bkz. createSchoolAction). */
export const DEFAULT_LICENSE_CLASSES = [
  { code: "B", vehicleKind: "Otomobil", drivingHours: 14, theoryLessons: 12 },
  { code: "A2", vehicleKind: "Motosiklet", drivingHours: 12, theoryLessons: 12 },
  { code: "A", vehicleKind: "Motosiklet", drivingHours: 12, theoryLessons: 12 },
  { code: "C", vehicleKind: "Kamyon", drivingHours: 20, theoryLessons: 16 },
  { code: "D", vehicleKind: "Otobüs", drivingHours: 24, theoryLessons: 16 },
] as const;

export const SESSION_COOKIE = "virel_drive_session";
/** Süper adminin "kurs olarak görüntüle" seçtiği kursun kimliği — bkz. requireSchoolUser. */
export const IMPERSONATE_COOKIE = "virel_drive_as_school";

// ---------- Süper admin ----------
// SCHOOL_STATUS_LABEL yukarıda (kursiyer/marka sabitlerinden önce) zaten tanımlı.
export const SCHOOL_PLAN_LABEL: Record<string, string> = { TRIAL: "Deneme", STARTER: "Başlangıç", PRO: "Pro", ENTERPRISE: "Kurumsal" };
export const SCHOOL_PLAN_LIMITS: Record<string, { userLimit: number; studentLimit: number }> = {
  TRIAL: { userLimit: 3, studentLimit: 150 },
  STARTER: { userLimit: 5, studentLimit: 300 },
  PRO: { userLimit: 12, studentLimit: 1000 },
  ENTERPRISE: { userLimit: 50, studentLimit: 10000 },
};

/**
 * Satılabilir planların fiyatları (kuruş). Tek seferlik lisans, aylık ücretin ~20-21 katı
 * alınıp yuvarlanarak belirlendi (SaaS'tan kalıcı lisansa geçişte yaygın 18-36 aylık geri
 * ödeme aralığının alt-orta bandı — bkz. pazar analizi: AKINSOFT/TABİM/WENNTEC hepsi tek
 * seferlik modül lisansı satıyor). Yıllık bakım-barındırma (YBS) lisansın ~%22'si — Logo/
 * Mikro/Netsis'in de kullandığı model; bulut barındırma maliyeti satış sonrasında da bize
 * ait kaldığı için (rakiplerin masaüstü modelinin aksine) gerekiyor. TRIAL satılabilir bir
 * plan değil, burada yok — hem tanıtım sayfası hem süper admin ödeme linki bu tabloyu kullanır.
 */
export const SCHOOL_PLAN_PRICE: Record<string, { monthly: number; oneTime: number; maintenanceYearly: number }> = {
  STARTER: { monthly: 79000, oneTime: 1690000, maintenanceYearly: 390000 },
  PRO: { monthly: 219000, oneTime: 4590000, maintenanceYearly: 990000 },
  ENTERPRISE: { monthly: 449000, oneTime: 9490000, maintenanceYearly: 2090000 },
};

// ---------- Mesajlar ----------
export const MESSAGE_CHANNEL_LABEL: Record<string, string> = {
  WHATSAPP: "WhatsApp", SMS: "SMS", EMAIL: "E-posta", PUSH: "Bildirim",
};
export const MESSAGE_STATUS_LABEL: Record<string, { label: string; kind: BadgeKind }> = {
  QUEUED: { label: "Sırada", kind: "neutral" },
  SENT: { label: "Gönderildi", kind: "neutral" },
  DELIVERED: { label: "İletildi", kind: "brand" },
  READ: { label: "Okundu", kind: "success" },
  FAILED: { label: "Başarısız", kind: "danger" },
};
/**
 * Yeni bir kurs açılırken yazılan başlangıç mesaj şablonları (bkz. DEFAULT_LICENSE_CLASSES ile
 * aynı gerekçe) — MessageTemplateRule tablosuna tohum olarak yazılır, koda gömülü sabit liste
 * olarak KULLANILMAZ. `{ad}` kursiyerin, `{kurs}` kursun adıyla değiştirilir (bkz. Composer.tsx).
 * `{kurs}` olmadan WELCOME şablonu her okulda "Yıldız Sürücü Kursu"ymuş gibi sabit kalırdı —
 * bu gerçek bir hataydı, düzeltildi.
 */
export const DEFAULT_MESSAGE_TEMPLATES = [
  { key: "LESSON_REMINDER", label: "Ders hatırlatması", body: "Sayın {ad}, yarınki dersiniz için hatırlatma: lütfen zamanında hazır olun." },
  { key: "PAYMENT_REMINDER", label: "Ödeme hatırlatması", body: "Sayın {ad}, taksitinizin vadesi yaklaşıyor. Ödeme planınızı kursiyer panelinden görüntüleyebilirsiniz." },
  { key: "EXAM_INFO", label: "Sınav bilgilendirmesi", body: "Sayın {ad}, sınav tarihiniz belirlendi. Detaylar için bizi arayabilirsiniz." },
  { key: "DOCUMENT_MISSING", label: "Evrak eksik uyarısı", body: "Sayın {ad}, kaydınızın tamamlanması için eksik belgelerinizi en kısa sürede iletmenizi rica ederiz." },
  { key: "LESSON_CANCELLED", label: "Ders iptali", body: "Sayın {ad}, bugünkü dersiniz iptal edilmiştir. Yeni tarih için sizinle iletişime geçeceğiz." },
  { key: "WELCOME", label: "Hoş geldiniz", body: "Sayın {ad}, {kurs} ailesine hoş geldiniz! Sorularınız için bu hattan yazabilirsiniz." },
] as const;

// ---------- Mevzuat ayarları ----------
export const VEHICLE_KIND_OPTIONS = ["Otomobil", "Motosiklet", "Kamyon", "Otobüs", "Çekici", "Minibüs"] as const;

/** Ders/devam ve sınav/süreç kuralları — REGULATION_DEFAULTS'taki her anahtarın ekranda
 *  nasıl gösterileceği. Yeni bir mevzuat anahtarı eklenirse burada da tanımlanmalı,
 *  aksi halde ayarlar ekranında görünmez (bkz. lib/settings.ts). */
export const REGULATION_NUMBER_FIELDS = [
  { key: "drivingLessonMinutes", label: "Direksiyon ders süresi", suffix: "dakika", hint: "Tek derste azami süre" },
  { key: "dailyMaxLessonHours", label: "Günlük azami ders", suffix: "saat", hint: "Kursiyer başına" },
  { key: "minGapBetweenLessonsHours", label: "İki ders arası asgari", suffix: "saat" },
  { key: "theoryAttendanceMinPercent", label: "Teorik devam zorunluluğu", suffix: "%", hint: "Bu oranın altında e-Sınav başvurusu yapılamaz" },
  { key: "lessonCancelHours", label: "Ders iptal süresi", suffix: "saat", hint: "Bu süreden sonra iptal hak düşürür" },
  { key: "termWeeks", label: "Dönem süresi", suffix: "hafta" },
] as const;
export const REGULATION_BOOL_FIELDS = [
  { key: "blockExamWithoutHours", label: "Direksiyon eğitimi tamamlanmadan sınav başvurusu engellensin", hint: "Eğitim saati dolmadan başvuru oluşturulamaz" },
  { key: "blockRegistrationWithoutDocs", label: "Evrak eksikse kayıt tamamlanmasın", hint: "Eksik belge varsa kursiyer 'ön kayıt' durumunda kalır" },
  { key: "blockConflictingLessons", label: "Çakışan ders oluşturulmasına izin verme", hint: "Eğitmen, araç ve kursiyer uygunluğu zorunlu" },
  { key: "notifyOnLastExamAttempt", label: "Sınav hakkı bittiğinde otomatik uyarı", hint: "Kurs sahibine ve sekretere bildirim" },
  { key: "studentAppShowsProgress", label: "Kursiyer uygulamasında ilerleme görünsün", hint: "Kursiyer kendi sürecini görebilir" },
] as const;
