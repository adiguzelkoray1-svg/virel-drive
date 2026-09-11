/**
 * Virel Drive demo verisi — tasarım kanvasındaki ekranlarla aynı kurgu.
 * Gerçek kişisel veri yoktur; isimler kurgu, telefonlar arayüzde maskelenir.
 * Deterministik: aynı tohumla her çalıştırmada aynı veri üretilir.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { REGULATION_DEFAULTS, DEFAULT_LICENSE_CLASSES } from "../src/lib/constants";
import { DEFAULT_DOCUMENT_TYPES, DEFAULT_MESSAGE_TEMPLATES, SKILLS, THEORY_CATEGORIES } from "../src/lib/constants";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

// ---- deterministik rastgelelik ----
let _s = 20260904;
const rnd = () => ((_s = (_s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));

const AD = ["Ayşe", "Mehmet", "Zeynep", "Emre", "Merve", "Kerem", "Deniz", "Selin", "Burak", "Elif", "Onur", "Nihan", "Ceren", "Tolga", "Buse", "Hakan", "Sude", "Ahmet", "Gizem", "Efe", "Nazlı", "Melis", "Cem", "İrem", "Barış", "Ece", "Kaan", "Duygu", "Serkan", "Pınar", "Uğur", "Yasemin", "Berk", "Şeyma", "Arda", "Damla", "Volkan", "Aslı", "Mert", "Esra"];
const SOYAD = ["Yılmaz", "Kaya", "Demir", "Aydın", "Koç", "Aksu", "Ulu", "Ateş", "Şen", "Şahin", "Taş", "Er", "Aksoy", "Kurt", "Yalçın", "Toprak", "Şimşek", "Ak", "Kara", "Bulut", "Doğan", "Çelik", "Arslan", "Polat", "Güneş", "Özkan", "Tunç", "Bozkurt", "Erdem", "Sarı"];

const phone = (i: number) => `05${String(30 + (i % 60)).padStart(2, "0")}${String(1000000 + ((i * 733) % 8999999)).slice(0, 7)}`;

const at = (base: Date, dayOffset: number, hh: number, mm = 0) => {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hh, mm, 0, 0);
  return d;
};
const plusMin = (d: Date, m: number) => new Date(d.getTime() + m * 60000);

async function main() {
  console.log("Virel Drive demo verisi yükleniyor…");

  // Temizlik (bağımlılık sırasıyla)
  await prisma.$transaction([
    prisma.skillRating.deleteMany(), prisma.drivingLesson.deleteMany(), prisma.attendance.deleteMany(),
    prisma.theoryLesson.deleteMany(), prisma.exam.deleteMany(), prisma.payment.deleteMany(),
    prisma.installment.deleteMany(), prisma.paymentPlan.deleteMany(), prisma.document.deleteMany(),
    prisma.messageLog.deleteMany(), prisma.vehicleCost.deleteMany(), prisma.expense.deleteMany(),
    prisma.lead.deleteMany(), prisma.student.deleteMany(), prisma.vehicle.deleteMany(),
    prisma.instructor.deleteMany(), prisma.auditLog.deleteMany(), prisma.regulationSetting.deleteMany(),
    prisma.licenseClassRule.deleteMany(), prisma.user.deleteMany(), prisma.school.deleteMany(),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pw = await bcrypt.hash("virel1234", 11);

  // ---------- Kurs ----------
  const school = await prisma.school.create({
    data: {
      name: "Yıldız Sürücü Kursu", slug: "yildiz", city: "Ankara", district: "Çankaya",
      phone: "03124440101", email: "info@yildizsurucukursu.com", address: "Kızılay Mah. 1234. Sk. No:5, Çankaya/Ankara",
      status: "ACTIVE", plan: "PRO", userLimit: 12, studentLimit: 1000,
      approvedAt: new Date(), kvkkAcceptedAt: new Date(),
    },
  });

  // ---------- Mevzuat ----------
  await prisma.regulationSetting.createMany({
    data: Object.entries(REGULATION_DEFAULTS).map(([key, value]) => ({ schoolId: school.id, key, value })),
  });
  await prisma.licenseClassRule.createMany({ data: DEFAULT_LICENSE_CLASSES.map((c) => ({ schoolId: school.id, ...c, examAttempts: 4, passScore: 70 })) });
  await prisma.documentTypeRule.createMany({ data: DEFAULT_DOCUMENT_TYPES.map((d, i) => ({ schoolId: school.id, ...d, sortOrder: i })) });
  await prisma.messageTemplateRule.createMany({ data: DEFAULT_MESSAGE_TEMPLATES.map((m, i) => ({ schoolId: school.id, ...m, sortOrder: i })) });
  const hoursOf = (code: string) => DEFAULT_LICENSE_CLASSES.find((c) => c.code === code)?.drivingHours ?? 14;

  // ---------- Kullanıcılar ----------
  // Süper admin şifresi diğer demo hesaplardan ayrı: bu, konsolun gerçek sahibi bir hesap,
  // "virel1234" gibi paylaşılan demo şifresini taşımamalı. Gerçek e-posta/şifre yalnızca
  // .env'de tutulur (git'e girmez); buradaki değerler yalnızca .env eksikse devreye giren
  // güvenli varsayılanlardır.
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@virel-drive.local";
  const superAdminPw = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || randomUUID(), 11);
  await prisma.user.create({ data: { email: superAdminEmail, passwordHash: superAdminPw, name: "Süper Admin", role: "SUPER_ADMIN" } });

  // Süper admin konsolunun kurs listesini boş göstermemesi için birkaç iskelet kiracı —
  // yalnızca profil ve bir sahip kullanıcı; operasyonel veri (kursiyer, ders vb.) yok.
  const OTHER_SCHOOLS = [
    { name: "Mavi Sürücü Kursu", slug: "mavi", city: "İstanbul", district: "Kadıköy", status: "TRIAL", plan: "STARTER", userLimit: 5, studentLimit: 300, trialEndsAt: at(today, 5, 12), owner: { email: "sahip@mavisurucukursu.com", name: "Deniz Aydemir" } },
    { name: "Güven Sürücü Kursu", slug: "guven", city: "İzmir", district: "Bornova", status: "PENDING", plan: "TRIAL", userLimit: 3, studentLimit: 150, trialEndsAt: at(today, 14, 12), owner: { email: "basvuru@guvensurucukursu.com", name: "Ferhat Kaplan" } },
    { name: "Onur Sürücü Kursu", slug: "onur", city: "Bursa", district: "Nilüfer", status: "PAST_DUE", plan: "PRO", userLimit: 12, studentLimit: 1000, trialEndsAt: null, owner: { email: "yonetim@onursurucukursu.com", name: "Songül Er" } },
  ] as const;
  for (const s of OTHER_SCHOOLS) {
    const other = await prisma.school.create({
      data: {
        name: s.name, slug: s.slug, city: s.city, district: s.district, status: s.status, plan: s.plan,
        userLimit: s.userLimit, studentLimit: s.studentLimit, trialEndsAt: s.trialEndsAt,
        approvedAt: s.status === "PENDING" ? null : at(today, -20, 10), kvkkAcceptedAt: at(today, -20, 10),
      },
    });
    await prisma.user.create({ data: { email: s.owner.email, name: s.owner.name, role: "OWNER", passwordHash: pw, schoolId: other.id } });
  }

  const staff = [
    { email: "ahmet@yildizsurucukursu.com", name: "Ahmet Yılmaz", role: "OWNER" },
    { email: "sekreter@yildizsurucukursu.com", name: "Gamze Aydın", role: "SECRETARY" },
    { email: "muhasebe@yildizsurucukursu.com", name: "Levent Ok", role: "ACCOUNTANT" },
  ];
  for (const s of staff) await prisma.user.create({ data: { ...s, passwordHash: pw, schoolId: school.id } });

  // ---------- Eğitmenler ----------
  const INSTRUCTORS = [
    { name: "Mehmet Öz", branch: "DRIVING", licenseClasses: "B", email: "mehmet@yildizsurucukursu.com", role: "DRIVING_INSTRUCTOR", capacity: 40 },
    { name: "Ali Kaya", branch: "DRIVING", licenseClasses: "B", email: "ali@yildizsurucukursu.com", role: "DRIVING_INSTRUCTOR", capacity: 40 },
    { name: "Hakan Tuna", branch: "DRIVING", licenseClasses: "B,A2", email: "hakan@yildizsurucukursu.com", role: "DRIVING_INSTRUCTOR", capacity: 40 },
    { name: "Serkan Yıldız", branch: "DRIVING", licenseClasses: "C,D", email: "serkan@yildizsurucukursu.com", role: "DRIVING_INSTRUCTOR", capacity: 40 },
    { name: "Selin Ak", branch: "THEORY", licenseClasses: "B", subjects: "TRAFFIC,ETHICS", email: "selin@yildizsurucukursu.com", role: "THEORY_TEACHER", capacity: 20 },
    { name: "Nur Ateş", branch: "THEORY", licenseClasses: "B", subjects: "FIRST_AID", email: "nur@yildizsurucukursu.com", role: "THEORY_TEACHER", capacity: 20 },
    { name: "Kemal Bora", branch: "THEORY", licenseClasses: "B", subjects: "ENGINE", email: "kemal@yildizsurucukursu.com", role: "THEORY_TEACHER", capacity: 20 },
  ];
  const instructors: { id: string; name: string; branch: string }[] = [];
  for (const i of INSTRUCTORS) {
    const user = await prisma.user.create({ data: { email: i.email, passwordHash: pw, name: i.name, role: i.role, schoolId: school.id } });
    instructors.push(await prisma.instructor.create({
      data: { schoolId: school.id, userId: user.id, name: i.name, branch: i.branch, licenseClasses: i.licenseClasses, subjects: i.subjects, weeklyCapacity: i.capacity },
    }));
  }
  const drivers = instructors.filter((i) => i.branch === "DRIVING");
  const teachers = instructors.filter((i) => i.branch === "THEORY");

  // ---------- Araçlar ----------
  const VEHICLES = [
    { plate: "06 ABC 123", brand: "Renault", model: "Clio", year: 2023, licenseClass: "B", km: 128450, usage: "TRAINING", status: "ACTIVE", nextServiceKm: 128870, inst: 0 },
    { plate: "06 XYZ 456", brand: "Fiat", model: "Egea", year: 2022, licenseClass: "B", km: 164900, usage: "TRAINING", status: "ACTIVE", nextServiceKm: 173300, inst: 1 },
    { plate: "06 DEF 789", brand: "Renault", model: "Clio", year: 2024, licenseClass: "B", km: 74100, usage: "EXAM", status: "ACTIVE", nextServiceKm: 85300, inst: 2 },
    { plate: "06 MOT 034", brand: "Honda", model: "CB125", year: 2024, licenseClass: "A2", km: 9820, usage: "TRAINING", status: "ACTIVE", nextServiceKm: 12000, inst: 2 },
    { plate: "06 KAM 210", brand: "Ford", model: "Cargo", year: 2019, licenseClass: "C", km: 412600, usage: "TRAINING", status: "ACTIVE", nextServiceKm: 419500, inst: 3 },
    { plate: "06 TRV 077", brand: "Fiat", model: "Egea", year: 2021, licenseClass: "B", km: 208300, usage: "TRAINING", status: "MAINTENANCE", nextServiceKm: 210000, inst: null },
    { plate: "06 BNZ 512", brand: "Renault", model: "Symbol", year: 2022, licenseClass: "B", km: 143200, usage: "TRAINING", status: "ACTIVE", nextServiceKm: 152000, inst: 0 },
    { plate: "06 GHI 845", brand: "Hyundai", model: "i20", year: 2023, licenseClass: "B", km: 96700, usage: "TRAINING", status: "ACTIVE", nextServiceKm: 105000, inst: 1 },
    { plate: "06 JKL 331", brand: "Fiat", model: "Egea", year: 2020, licenseClass: "B", km: 231400, usage: "TRAINING", status: "ACTIVE", nextServiceKm: 240000, inst: 1 },
    { plate: "06 MNO 604", brand: "Renault", model: "Clio", year: 2021, licenseClass: "B", km: 187500, usage: "TRAINING", status: "ACTIVE", nextServiceKm: 195000, inst: 0 },
    { plate: "06 OTB 118", brand: "Otokar", model: "Sultan", year: 2018, licenseClass: "D", km: 386200, usage: "TRAINING", status: "ACTIVE", nextServiceKm: 392000, inst: 3 },
    { plate: "06 MOT 077", brand: "Yamaha", model: "MT-125", year: 2023, licenseClass: "A2", km: 14300, usage: "TRAINING", status: "PASSIVE", nextServiceKm: 18000, inst: null },
  ];
  const vehicles: { id: string; plate: string; licenseClass: string; status: string; km: number; instructorId: string | null }[] = [];
  for (const v of VEHICLES) {
    const created = await prisma.vehicle.create({
      data: {
        schoolId: school.id, plate: v.plate, brand: v.brand, model: v.model, year: v.year, licenseClass: v.licenseClass,
        km: v.km, usage: v.usage, status: v.status, nextServiceKm: v.nextServiceKm, fuelType: v.licenseClass === "A2" ? "Benzin" : "Dizel",
        instructorId: v.inst === null ? null : drivers[v.inst].id,
        inspectionUntil: at(today, int(14, 400), 12), insuranceUntil: at(today, int(30, 380), 12),
      },
    });
    vehicles.push(created);
  }
  const vehiclesFor = (cls: string) => vehicles.filter((v) => v.licenseClass === cls && v.status === "ACTIVE");

  // ---------- Kursiyerler ----------
  type Row = { stage: string; status: string; n: number };
  const DIST: Row[] = [
    { stage: "PRE_REGISTRATION", status: "ACTIVE", n: 8 },
    { stage: "DOCUMENTS", status: "ACTIVE", n: 6 },
    { stage: "THEORY", status: "ACTIVE", n: 26 },
    { stage: "ETEST_WAITING", status: "ACTIVE", n: 14 },
    { stage: "DRIVING", status: "ACTIVE", n: 41 },
    { stage: "DRIVING_EXAM", status: "ACTIVE", n: 9 },
    { stage: "GRADUATED", status: "GRADUATED", n: 63 },
    { stage: "DRIVING", status: "PASSIVE", n: 5 },
  ];
  const CLASS_DIST = ["B", "B", "B", "B", "B", "B", "B", "A2", "C", "D"];

  const students: { id: string; licenseClass: string; stage: string; name: string }[] = [];
  let idx = 0;
  for (const row of DIST) {
    for (let k = 0; k < row.n; k++) {
      idx++;
      const first = pick(AD), last = pick(SOYAD);
      const cls = row.stage === "PRE_REGISTRATION" ? pick(CLASS_DIST) : CLASS_DIST[idx % CLASS_DIST.length];
      const regDaysAgo = row.stage === "GRADUATED" ? int(120, 300) : row.stage === "PRE_REGISTRATION" ? int(1, 20) : int(20, 140);
      const s = await prisma.student.create({
        data: {
          schoolId: school.id, fileNo: `2026-${String(1000 + idx).slice(1)}`,
          firstName: first, lastName: last, phone: phone(idx), email: `${first.toLocaleLowerCase("tr")}${idx}@ornek.com`,
          licenseClass: cls, stage: row.stage, status: row.status,
          registeredAt: at(today, -regDaysAgo, 10),
          graduatedAt: row.stage === "GRADUATED" ? at(today, -int(5, 90), 15) : null,
        },
      });
      students.push({ id: s.id, licenseClass: cls, stage: row.stage, name: `${first} ${last}` });
    }
  }

  // Ayşe Yılmaz — tasarımdaki örnek kursiyer (direksiyon eğitimi %72). Mobil kursiyer
  // portalını gerçek bir hesapla test edebilmek için giriş yapabilen tek kursiyer bu.
  const ayseUser = await prisma.user.create({ data: { email: "ayse@ornek.com", passwordHash: pw, name: "Ayşe Yılmaz", role: "STUDENT", schoolId: school.id } });
  const ayse = await prisma.student.create({
    data: {
      schoolId: school.id, userId: ayseUser.id, fileNo: "2026-0418", firstName: "Ayşe", lastName: "Yılmaz", phone: "05321234541",
      email: "ayse@ornek.com", licenseClass: "B", stage: "DRIVING", status: "ACTIVE", registeredAt: at(today, -86, 10),
    },
  });
  students.push({ id: ayse.id, licenseClass: "B", stage: "DRIVING", name: "Ayşe Yılmaz" });

  // ---------- Evraklar ----------
  for (const s of students) {
    const complete = s.stage !== "PRE_REGISTRATION" && s.stage !== "DOCUMENTS" ? true : rnd() > 0.6;
    for (const d of DEFAULT_DOCUMENT_TYPES) {
      const status = complete ? "OK" : pick(["OK", "OK", "PENDING", "MISSING", "REVIEW"]);
      await prisma.document.create({
        data: { schoolId: school.id, studentId: s.id, type: d.key, status, verifiedAt: status === "OK" ? at(today, -int(10, 80), 12) : null },
      });
    }
  }

  // ---------- Teorik eğitim ----------
  // Teorik eğitimi tamamlamış aşamalar da geçmiş derslere katılmış sayılır:
  // kursiyer kartındaki "Teorik" göstergesi ve süreç çizelgesi böylece doğru okunur.
  const theoryStudents = students.filter((s) => ["THEORY", "ETEST_WAITING", "DRIVING", "DRIVING_EXAM", "GRADUATED"].includes(s.stage));
  const term = "2026/3";
  let rosterCursor = 0;
  for (let w = -6; w <= 3; w++) {
    for (const [i, cat] of THEORY_CATEGORIES.entries()) {
      if (w > 0 && i > 1) continue;
      const day = w * 7 + (i % 4);
      const startsAt = at(today, day, i % 2 === 0 ? 10 : 14);
      const lesson = await prisma.theoryLesson.create({
        data: {
          schoolId: school.id, category: cat.key, topic: `${cat.label} · ${i + 1}. konu`, term,
          room: i % 2 === 0 ? "Derslik 2" : "Derslik 1",
          instructorId: teachers[i % teachers.length].id,
          startsAt, endsAt: plusMin(startsAt, 90),
          status: day < 0 ? "DONE" : "PLANNED",
        },
      });
      if (day <= 0) {
        // Bir derslikte ~28 kursiyer olur; tüm dönem kursiyerlerini tek derse yazmak gerçekçi değil.
        // Sınıf mevcudu ders başına kaydırılarak seçilir, böylece herkesin devam geçmişi oluşur.
        const size = Math.min(28, theoryStudents.length);
        const offset = (rosterCursor += 7) % Math.max(1, theoryStudents.length);
        const roster = Array.from({ length: size }, (_, k) => theoryStudents[(offset + k) % theoryStudents.length]);
        await prisma.attendance.createMany({
          data: roster.map((s) => ({ schoolId: school.id, theoryLessonId: lesson.id, studentId: s.id, present: rnd() > 0.07 })),
          skipDuplicates: true,
        });
      }
    }
  }

  // ---------- Direksiyon dersleri ----------
  const drivingPool = students.filter((s) => ["DRIVING", "DRIVING_EXAM"].includes(s.stage));
  const HOURS = [8.5, 9, 10, 11, 11.5, 13, 13.5, 14, 15, 15.5, 16, 17];
  // Her eğitmenin kendi aracı vardır; ders o araçla yapılır.
  const instructorVehicle = drivers.map((d) => vehicles.find((v) => v.instructorId === d.id && v.status === "ACTIVE") ?? vehicles.find((v) => v.status === "ACTIVE")!);
  /**
   * Kursiyerin birincil eğitmeni. Gerçek kursta kursiyer hep aynı eğitmenle çalışır; her dersi
   * rastgele bir eğitmene atamak "her eğitmenin 100+ kursiyeri var" gibi anlamsız istatistikler
   * üretiyordu. Derslerin ~%15'i (izin/nöbet devri) başka eğitmene düşer.
   */
  const primaryInstructor = new Map<string, number>();
  const instructorOf = (studentId: string) => {
    if (!primaryInstructor.has(studentId)) primaryInstructor.set(studentId, primaryInstructor.size % drivers.length);
    return primaryInstructor.get(studentId)!;
  };

  async function lesson(studentId: string, cls: string, dayOffset: number, hour: number, status: string, instructorIdx?: number) {
    const pool = vehiclesFor(cls).length ? vehiclesFor(cls) : vehiclesFor("B");
    // Eğitmen belirtilmemişse kursiyerin birincil eğitmeni; ~%15 ihtimalle devir alan başka eğitmen.
    const idx = instructorIdx ?? (rnd() > 0.85 ? int(0, drivers.length - 1) : instructorOf(studentId));
    const inst = drivers[idx];
    // Sınıfı uyuyorsa eğitmenin kendi aracı, değilse sınıfa uygun bir araç.
    const own = instructorVehicle[idx];
    const veh = own && pool.some((v) => v.id === own.id) ? own : pool[int(0, pool.length - 1)];
    const startsAt = at(today, dayOffset, Math.floor(hour), (hour % 1) * 60);
    const l = await prisma.drivingLesson.create({
      data: {
        schoolId: school.id, studentId, instructorId: inst.id, vehicleId: veh.id,
        startsAt, endsAt: plusMin(startsAt, 90), kind: pick(["CITY", "CITY", "PARKING", "HILL"]), status,
        reviewNote: status === "DONE" ? pick(["Park manevrasında referans noktaları tekrar çalışılmalı.", "Şerit takibi iyi, kavşaklarda tereddüt var.", "Vites geçişleri akıcı. Ayna kullanımı hatırlatıldı."]) : null,
      },
    });
    if (status === "DONE") {
      for (const sk of SKILLS) {
        if (rnd() > 0.75) continue;
        await prisma.skillRating.create({ data: { schoolId: school.id, lessonId: l.id, skill: sk.key, score: int(2, 5) } });
      }
    }
    return l;
  }

  // Geçmiş ders birikimi (yapılandırılmış haftanın dışında kalsın diye 20–120 gün öncesi).
  // Mezunlar da dahildir: eğitim geçmişi mezuniyetle silinmez. Aksi hâlde "bu eğitmenin
  // kursiyerleri" ve eğitmen başarı oranı gibi geriye dönük istatistikler mezunları hiç
  // göremez — mezunların tamamı sınavı geçtiği için başarı oranı yanlışlıkla %0 çıkardı.
  const historyPool = students.filter((s) => ["DRIVING", "DRIVING_EXAM", "GRADUATED"].includes(s.stage));
  for (const s of historyPool) {
    if (s.id === ayse.id) continue; // Ayşe'nin birikimi elle kuruluyor (8 ders)
    const need = hoursOf(s.licenseClass);
    // Eğitimi biten aşamalar (DRIVING_EXAM, GRADUATED) zorunlu saati tamamlamıştır.
    // DRIVING: haftalık program da ders eklediği için birikim yarıya kadar.
    const lessonsNeeded = Math.round((need * 60) / 90);
    const done = s.stage === "DRIVING" ? int(1, Math.max(2, Math.floor(lessonsNeeded / 2))) : lessonsNeeded;
    // Mezunlar daha eski tarihlere yayılır (kayıt–mezuniyet aralığı gerçekçi kalsın).
    const from = s.stage === "GRADUATED" ? 90 : 20;
    const to = s.stage === "GRADUATED" ? 240 : 120;
    for (let i = 0; i < done; i++) await lesson(s.id, s.licenseClass, -int(from, to), pick(HOURS), "DONE");
  }
  for (let i = 0; i < 8; i++) await lesson(ayse.id, "B", -(25 + i * 6), pick(HOURS), "DONE", 0);

  /**
   * Haftalık program: her eğitmenin kendi aracıyla, çakışmayan sabit slotları var.
   * Gerçek bir kursta çakışma istisnadır; bu yüzden program çakışmasız üretilir,
   * "Dikkat gerektirenler" panelini göstermek için sonda tek bir çakışma bilinçli eklenir.
   */
  const SLOTS = [9, 11, 13, 15, 17];
  // Sınav aşamasındaki kursiyerin eğitimi bitmiştir; haftalık programa yalnızca eğitimi süren kursiyerler girer.
  // Ayşe programa girmez: tasarımdaki 8/14 saat örneği bozulmasın.
  const activeDriving = students.filter((s) => s.stage === "DRIVING" && s.id !== ayse.id);
  const now = new Date();
  let cursor = 0;
  for (let day = -7; day <= 7; day++) {
    const dow = at(today, day, 12).getDay();
    if (dow === 0 && day !== 0) continue; // pazar kapalı (bugün pazarsa program yine de gösterilir)
    for (const [di, inst] of drivers.entries()) {
      for (const hour of SLOTS) {
        // Yarın 14:00 Ayşe'nin dersine ayrıldı; kurgulanan tek çakışma dışında komşu slotlar boş bırakılır.
        if (day === 1 && (di === 0 || di === 1) && (hour === 13 || hour === 15)) continue;
        if (rnd() > 0.78) continue;
        const s = activeDriving[cursor++ % activeDriving.length];
        const startsAt = at(today, day, hour);
        const endsAt = plusMin(startsAt, 90);
        const status = endsAt < now ? (rnd() > 0.94 ? "NO_SHOW" : "DONE") : startsAt <= now ? "LIVE" : "PLANNED";
        const l = await prisma.drivingLesson.create({
          data: {
            schoolId: school.id, studentId: s.id, instructorId: inst.id, vehicleId: instructorVehicle[di].id,
            startsAt, endsAt, kind: pick(["CITY", "CITY", "PARKING", "HILL"]), status,
            reviewNote: status === "DONE" ? pick(["Park manevrasında referans noktaları tekrar çalışılmalı.", "Şerit takibi iyi, kavşaklarda tereddüt var.", "Vites geçişleri akıcı. Ayna kullanımı hatırlatıldı."]) : null,
          },
        });
        if (status === "DONE") {
          for (const sk of SKILLS) {
            if (rnd() > 0.75) continue;
            await prisma.skillRating.create({ data: { schoolId: school.id, lessonId: l.id, skill: sk.key, score: int(2, 5) } });
          }
        }
      }
    }
  }

  // Ayşe'nin yaklaşan dersi — tasarımdaki "yarın 14:00" kartı
  const ayseStart = at(today, 1, 14);
  await prisma.drivingLesson.create({
    data: { schoolId: school.id, studentId: ayse.id, instructorId: drivers[0].id, vehicleId: instructorVehicle[0].id, startsAt: ayseStart, endsAt: plusMin(ayseStart, 90), kind: "CITY", status: "PLANNED" },
  });

  // Bilinçli tek çakışma: Ayşe'nin dersiyle aynı araç, kesişen saat, farklı eğitmen.
  const clashStart = at(today, 1, 14, 30);
  const clashStudent = drivingPool[int(0, drivingPool.length - 1)];
  await prisma.drivingLesson.create({
    data: { schoolId: school.id, studentId: clashStudent.id, instructorId: drivers[1].id, vehicleId: instructorVehicle[0].id, startsAt: clashStart, endsAt: plusMin(clashStart, 90), kind: "CITY", status: "PLANNED", note: "Araç çakışması — demo" },
  });

  // ---------- Araç maliyetleri ----------
  // Giderler derslerden SONRA üretilir: yakıt, aracın o ay gerçekten yaptığı ders saatine
  // orantılıdır. Aksi hâlde "km başına maliyet" raporu, ders yoğunluğundan bağımsız üretilen
  // giderler yüzünden ₺60/km gibi anlamsız değerler gösteriyordu.
  const KM_PER_LESSON_HOUR = 25;   // şehir içi direksiyon eğitimi ortalaması
  const FUEL_COST_PER_KM = 315;    // kuruş (≈7 L/100km × ≈₺45/L)
  for (const v of vehicles) {
    for (let m = 0; m < 3; m++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - m + 1, 1);
      const monthLessons = await prisma.drivingLesson.findMany({
        where: { schoolId: school.id, vehicleId: v.id, status: "DONE", startsAt: { gte: monthStart, lt: monthEnd } },
        select: { startsAt: true, endsAt: true },
      });
      const hours = monthLessons.reduce((sum, l) => sum + (l.endsAt.getTime() - l.startsAt.getTime()) / 3_600_000, 0);
      const monthKm = Math.round(hours * KM_PER_LESSON_HOUR);
      // Bu ay için gün, bugünü aşmasın: ileri tarihli gider fişi gerçekçi değil.
      const maxDay = m === 0 ? Math.max(1, today.getDate() - 1) : 26;
      const day = (offset: number) => at(monthStart, Math.min(offset, maxDay), 12);

      if (monthKm > 0) {
        await prisma.vehicleCost.create({
          data: {
            schoolId: school.id, vehicleId: v.id, type: "FUEL",
            amount: Math.round(monthKm * FUEL_COST_PER_KM * (0.9 + rnd() * 0.2)),
            km: v.km - m * monthKm, occurredAt: day(int(1, 26)), note: `${monthKm} km`,
          },
        });
      }
      // Sabit/periyodik kalemler: her ay çıkmaz, tutarları da yakıtın yanında küçük kalır.
      for (const [type, min, max, chance] of [["SERVICE", 1800, 6500, 0.35], ["TIRE", 2500, 7000, 0.12],
                                              ["INSURANCE", 1200, 3200, 0.25], ["REPAIR", 900, 4800, 0.18]] as const) {
        if (rnd() > chance) continue;
        await prisma.vehicleCost.create({
          data: {
            schoolId: school.id, vehicleId: v.id, type, amount: int(min, max) * 100,
            km: v.km - m * Math.max(500, monthKm), occurredAt: day(int(1, 26)),
          },
        });
      }
    }
  }

  // ---------- Sınavlar ----------
  for (const s of students) {
    if (["THEORY", "PRE_REGISTRATION", "DOCUMENTS"].includes(s.stage)) continue;
    if (s.stage === "ETEST_WAITING") {
      await prisma.exam.create({ data: { schoolId: school.id, studentId: s.id, type: "ETEST", attemptNo: 1, scheduledAt: at(today, int(5, 20), 10), place: "MEB Salon 3, Çankaya", status: rnd() > 0.25 ? "APPLIED" : "PLANNED" } });
      continue;
    }
    const etestAttempts = rnd() > 0.75 ? 2 : 1;
    for (let a = 1; a <= etestAttempts; a++) {
      const passed = a === etestAttempts;
      await prisma.exam.create({
        data: {
          schoolId: school.id, studentId: s.id, type: "ETEST", attemptNo: a, scheduledAt: at(today, -int(30, 90), 10),
          place: "MEB Salon 3, Çankaya", status: "DONE", result: passed ? "PASSED" : "FAILED",
          score: passed ? int(70, 96) : int(38, 68), failReason: passed ? null : "Trafik ve çevre bilgisi",
        },
      });
    }
    if (s.stage === "DRIVING_EXAM") {
      const attempts = int(1, 3);
      for (let a = 1; a < attempts; a++) {
        await prisma.exam.create({ data: { schoolId: school.id, studentId: s.id, type: "DRIVING", attemptNo: a, scheduledAt: at(today, -int(10, 60), 9), place: "Yıldız Kurs", status: "DONE", result: "FAILED", failReason: pick(["Park ve geri manevra", "Yokuşta kalkış", "Kavşakta geçiş hakkı"]) } });
      }
      await prisma.exam.create({ data: { schoolId: school.id, studentId: s.id, type: "DRIVING", attemptNo: attempts, scheduledAt: at(today, int(20, 40), 9), place: "Yıldız Kurs", status: "PLANNED" } });
    }
    if (s.stage === "GRADUATED") {
      await prisma.exam.create({ data: { schoolId: school.id, studentId: s.id, type: "DRIVING", attemptNo: 1, scheduledAt: at(today, -int(10, 80), 9), place: "Yıldız Kurs", status: "DONE", result: "PASSED" } });
    }
  }

  // ---------- Finans ----------
  const PRICE: Record<string, number> = { B: 3200000, A2: 1850000, A: 1850000, C: 4600000, D: 5200000 };
  for (const s of students) {
    if (s.stage === "PRE_REGISTRATION") continue;
    const total = PRICE[s.licenseClass] ?? 3200000;
    const down = Math.round(total * 0.31);
    const plan = await prisma.paymentPlan.create({ data: { schoolId: school.id, studentId: s.id, total, downPayment: down } });
    const rest = total - down;
    const n = 4;
    const each = Math.round(rest / n);
    const paidCount = s.stage === "GRADUATED" ? n + 1 : int(1, n);
    // Gecikme istisna olmalı: kursiyerlerin ~%6'sında ilk ödenmemiş taksit vadesini geçmiş sayılır.
    const isLate = rnd() > 0.94;

    const rows = [
      { seq: 0, label: "Peşinat", amount: down },
      ...Array.from({ length: n }, (_, i) => ({ seq: i + 1, label: `${i + 1}. taksit`, amount: each })),
    ];
    for (const [i, r] of rows.entries()) {
      // Ödenmişler geçmişte, bekleyenler gelecekte; yalnızca "geciken" kursiyerde ilk bekleyen taksit geride kalır.
      const offset = i < paidCount ? -(paidCount - i) * 30 : isLate && i === paidCount ? -int(3, 14) : (i - paidCount) * 30 + 12;
      const dueAt = at(today, offset, 12);
      const isPaid = i < paidCount;
      const status = isPaid ? "PAID" : dueAt < today ? "OVERDUE" : "PENDING";
      const inst = await prisma.installment.create({
        data: { schoolId: school.id, planId: plan.id, seq: r.seq, label: r.label, amount: r.amount, dueAt, status, paidAt: isPaid ? dueAt : null },
      });
      if (isPaid) {
        await prisma.payment.create({
          data: { schoolId: school.id, studentId: s.id, installmentId: inst.id, amount: r.amount, method: pick(["CASH", "CARD", "TRANSFER"]), receivedAt: dueAt },
        });
      }
    }
  }
  // Bugünkü tahsilatlar: rastgele tutar yerine gerçek taksitler kapatılır; böylece
  // kasa dökümü ile ödeme planları birbirini tutar ve her ödeme bir taksite bağlı olur.
  const openSoon = await prisma.installment.findMany({
    where: { schoolId: school.id, status: "PENDING" },
    orderBy: { dueAt: "asc" }, take: 60, include: { plan: true },
  });
  for (let i = 0; i < 6 && i * 9 < openSoon.length; i++) {
    const inst = openSoon[i * 9];
    const receivedAt = at(today, 0, int(9, 17));
    await prisma.installment.update({ where: { id: inst.id }, data: { status: "PAID", paidAt: receivedAt } });
    await prisma.payment.create({
      data: { schoolId: school.id, studentId: inst.plan.studentId, installmentId: inst.id, amount: inst.amount, method: pick(["CASH", "CARD", "TRANSFER"]), receivedAt },
    });
  }
  // giderler
  for (let m = 0; m < 4; m++) {
    for (const [cat, amount] of [["RENT", 8500000], ["SALARY", 21000000], ["UTILITY", 1800000], ["MARKETING", 1200000]] as const) {
      await prisma.expense.create({ data: { schoolId: school.id, category: cat, amount: amount + int(-200, 200) * 1000, occurredAt: at(today, -(m * 30 + 3), 12) } });
    }
  }

  // ---------- CRM ----------
  const LEAD_PLAN = [["NEW", 14], ["INFORMED", 9], ["QUOTED", 7], ["FOLLOW_UP", 5], ["MEETING", 4], ["WON", 11], ["LOST", 9]] as const;
  // Kayda dönen adaylar gerçek kursiyerlere bağlanır; dönüşüm oranı ve "hangi kanaldan
  // geldi" sorusu ancak bu bağ varsa cevaplanabilir.
  const convertible = students.filter((s) => s.stage !== "PRE_REGISTRATION");
  let li = 0;
  for (const [stage, n] of LEAD_PLAN) {
    for (let k = 0; k < n; k++) {
      li++;
      const daysAgo = int(0, 18);
      const linked = stage === "WON" ? convertible[k * 7] : undefined;
      // WON adayın kaydı geçmişe yayılır; hepsi bugün olursa "bu ay kayıt" sayısı şişer.
      // İlk dördü bu ay içinde kalsın ki aylık karşılaştırma boş görünmesin.
      const wonDaysAgo = k < 4 ? int(1, 6) : int(12, 70);
      await prisma.lead.create({
        data: {
          schoolId: school.id,
          name: linked?.name ?? `${pick(AD)} ${pick(SOYAD)}`,
          phone: phone(500 + li),
          licenseClass: linked?.licenseClass ?? pick(CLASS_DIST),
          source: pick(["INSTAGRAM", "INSTAGRAM", "WEB", "WEB", "REFERRAL", "PHONE", "OTHER"]),
          stage,
          createdAt: stage === "WON" ? at(today, -(wonDaysAgo + int(3, 12)), 11) : at(today, -int(0, 20), 11),
          lastContactAt: stage === "WON" ? at(today, -wonDaysAgo, 14) : at(today, -daysAgo, 14),
          wonAt: stage === "WON" ? at(today, -wonDaysAgo, 14) : null,
          studentId: linked?.id ?? null,
          // Takip tarihi çoğunlukla gelecekte; gecikme istisna olmalı (~%25) ki
          // "takip zamanı geldi" uyarısı her kartta çıkıp anlamını yitirmesin.
          nextFollowUpAt: ["QUOTED", "FOLLOW_UP", "MEETING"].includes(stage)
            ? at(today, rnd() > 0.75 ? -int(1, 6) : int(1, 9), 14)
            : null,
          lostReason: stage === "LOST" ? pick(["Fiyat", "Başka kursa kaydoldu", "Vazgeçti", "Ulaşılamadı"]) : null,
        },
      });
    }
  }

  // ---------- Mesajlar ----------
  // Şablon başına gerçek gövde metni: konuşma ekranında her mesajın anlamı görünsün diye
  // (dashboard'daki tek düz metnin aksine).
  const MSG_TEMPLATE_BODY: Record<string, (ad: string) => string> = {
    LESSON_REMINDER: (ad) => `Sayın ${ad}, yarınki direksiyon dersiniz saat 14:00'te. Eğitmen: Mehmet Öz · Araç: 06 ABC 123.`,
    PAYMENT_REMINDER: (ad) => `Sayın ${ad}, taksitinizin vadesi yaklaşıyor. Ödeme planınızı kursiyer panelinden görüntüleyebilirsiniz.`,
    EXAM_INFO: (ad) => `Sayın ${ad}, sınav tarihiniz belirlendi. Detaylar için bizi arayabilirsiniz.`,
    DOCUMENT_MISSING: (ad) => `Sayın ${ad}, kaydınızın tamamlanması için eksik belgelerinizi en kısa sürede iletmenizi rica ederiz.`,
  };
  const REPLIES = [
    "Hocam yarınki dersi biraz erteleyebilir miyiz?", "Teşekkürler, anladım.", "e-Sınav belgemi nereden alabilirim?",
    "Tamamdır, uygun.", "Ödemeyi bugün yapacağım.", "Ne zaman gelebilirim?", "Anlaşıldı, teşekkürler 🙏", "Evet, doğru.",
  ];
  // Her kursiyerle ayrı bir konuşma yerine kursiyerlerin ~%40'ıyla gerçek bir mesaj geçmişi
  // kurulur; ikili yazışma olsun diye kursun mesajına kursiyer belli ihtimalle yanıt verir.
  // Birkaçının yanıtı bilerek okunmamış bırakılır ki gelen kutusu rozeti boş görünmesin.
  let unreadBudget = 6;
  // "Bugün" olarak işaretlenen mesajlar gerçek saatten ileri olmasın diye saat sınırlanır;
  // aksi halde seed sabahın erken saatinde çalıştığında "bugün 18:00'de gönderildi" gibi
  // ileri tarihli kayıtlar oluşur (finans modülündeki gider tarihi hatasıyla aynı sınıf).
  const nowRef = new Date();
  const nowHour = nowRef.getHours();
  const capHour = (dayOffset: number, hour: number) => (dayOffset === 0 ? Math.min(hour, nowHour) : hour);
  const capMinute = (dayOffset: number, hour: number, minute: number) =>
    dayOffset === 0 && hour === nowHour ? Math.min(minute, nowRef.getMinutes()) : minute;
  for (const s of students) {
    if (rnd() > 0.4) continue;
    const firstName = s.name.split(" ")[0];
    const turns = int(1, 3);
    let dayCursor = -int(3, 25);
    for (let t = 0; t < turns; t++) {
      const tpl = pick(["LESSON_REMINDER", "PAYMENT_REMINDER", "EXAM_INFO", "DOCUMENT_MISSING"]);
      const channel = pick(["WHATSAPP", "WHATSAPP", "SMS", "EMAIL"]);
      const sendHour = capHour(dayCursor, int(9, 18));
      await prisma.messageLog.create({
        data: {
          schoolId: school.id, studentId: s.id, channel, template: tpl, direction: "OUT",
          body: MSG_TEMPLATE_BODY[tpl](firstName), status: "SENT", sentAt: at(today, dayCursor, sendHour),
        },
      });
      if (rnd() > 0.5) {
        const unread = unreadBudget > 0 && rnd() > 0.6;
        if (unread) unreadBudget--;
        const replyHour = capHour(dayCursor, Math.min(21, sendHour + int(0, 2)));
        await prisma.messageLog.create({
          data: {
            schoolId: school.id, studentId: s.id, channel, direction: "IN", body: pick(REPLIES),
            status: unread ? "DELIVERED" : "READ", sentAt: at(today, dayCursor, replyHour, capMinute(dayCursor, replyHour, int(0, 59))),
          },
        });
      }
      dayCursor = Math.min(0, dayCursor + int(1, 6));
    }
  }

  const counts = {
    kurs: await prisma.school.count(), kursiyer: await prisma.student.count(), eğitmen: await prisma.instructor.count(), araç: await prisma.vehicle.count(),
    direksiyon: await prisma.drivingLesson.count(), teorik: await prisma.theoryLesson.count(),
    sınav: await prisma.exam.count(), taksit: await prisma.installment.count(), aday: await prisma.lead.count(),
  };
  console.log("Hazır:", counts);
  console.log("Kurs girişi: ahmet@yildizsurucukursu.com / virel1234");
  console.log(`Süper admin: ${superAdminEmail} / ${process.env.SUPER_ADMIN_PASSWORD ? "(.env'deki şifre)" : "rastgele üretildi — SUPER_ADMIN_PASSWORD tanımlamadan giriş yapılamaz"}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
