// Yeni kurs açılışı — DATABASE_URL'deki veritabanı üzerinde.
// Gerçek bir production hatasını yakalamak için yazıldı: createSchoolAction yalnızca School
// ve OWNER User yazıyordu, hiç LicenseClassRule oluşturmuyordu. Sonuç: kursiyer ekleme
// formundaki "Ehliyet sınıfı" seçimi tamamen boş kalıyordu — hiçbir kursiyer/araç/eğitmen
// oluşturulamıyordu. Bu test, createSchoolWithDefaults'ın çağırdığı gerçek kodu (test
// içinde yeniden yazılmış bir kopyasını değil) doğrudan çalıştırıp bu iki tablonun dolu
// çıktığını doğrular.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import "dotenv/config";

before(() => { if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL gerekli"); });

const testEmails: string[] = [];
const testSchoolIds: string[] = [];

after(async () => {
  const { prisma } = await import("../src/lib/prisma");
  // School siliniyor; User/LicenseClassRule/DocumentTypeRule/MessageTemplateRule/RegulationSetting onDelete: Cascade ile onunla gider.
  await prisma.school.deleteMany({ where: { id: { in: testSchoolIds } } });
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
  await prisma.$disconnect();
});

test("yeni kurs sertifika sınıflarıyla ve mevzuat ayarlarıyla birlikte açılır", async () => {
  const { prisma } = await import("../src/lib/prisma");
  const { createSchoolWithDefaults } = await import("../src/lib/school");
  const { DEFAULT_LICENSE_CLASSES, DEFAULT_DOCUMENT_TYPES, DEFAULT_MESSAGE_TEMPLATES, REGULATION_DEFAULTS } = await import("../src/lib/constants");

  const ownerEmail = `test-school-${Date.now()}@ornek.com`;
  testEmails.push(ownerEmail);

  const { school, tempPassword } = await createSchoolWithDefaults({
    name: "Test Okulu", plan: "TRIAL", ownerName: "Test Sahip", ownerEmail,
  });
  testSchoolIds.push(school.id);

  assert.ok(tempPassword.length >= 8, "geçici şifre üretilmeli");

  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  assert.equal(owner?.role, "OWNER");
  assert.equal(owner?.schoolId, school.id);

  // Asıl yakalanan hata: bu satır olmadan boş dönerdi.
  const rules = await prisma.licenseClassRule.findMany({ where: { schoolId: school.id } });
  assert.equal(rules.length, DEFAULT_LICENSE_CLASSES.length, "her varsayılan sertifika sınıfı yazılmalı");
  assert.ok(rules.some((r) => r.code === "B"), "B sınıfı (en yaygın) mutlaka olmalı");
  assert.ok(rules.every((r) => r.isActive), "yeni sınıflar aktif açılmalı");

  const settings = await prisma.regulationSetting.findMany({ where: { schoolId: school.id } });
  assert.equal(settings.length, Object.keys(REGULATION_DEFAULTS).length, "her mevzuat anahtarı yazılmalı");

  // Aynı sınıftan bir hata: bu yazılmazsa openDocumentSlots hiç belge satırı açmaz, yeni
  // kursiyer "0/0 belge" ile yanlışlıkla "evrakları tamam" görünür.
  const docTypes = await prisma.documentTypeRule.findMany({ where: { schoolId: school.id } });
  assert.equal(docTypes.length, DEFAULT_DOCUMENT_TYPES.length, "her varsayılan belge türü yazılmalı");
  assert.ok(docTypes.every((d) => d.isActive), "yeni belge türleri aktif açılmalı");

  // Aynı sınıftan bir hata daha: bu yazılmazsa Mesajlar ekranında hiç şablon çıkmaz.
  const templates = await prisma.messageTemplateRule.findMany({ where: { schoolId: school.id } });
  assert.equal(templates.length, DEFAULT_MESSAGE_TEMPLATES.length, "her varsayılan mesaj şablonu yazılmalı");
  assert.ok(templates.every((t) => !t.body.includes("Yıldız")), "şablon metni başka bir kursun adını içermemeli");
});

test("kursiyer ekleme formunun ihtiyaç duyduğu ehliyet sınıfı listesi asla boş dönmez", async () => {
  const { prisma } = await import("../src/lib/prisma");
  const { createSchoolWithDefaults } = await import("../src/lib/school");

  const ownerEmail = `test-school-${Date.now()}-2@ornek.com`;
  testEmails.push(ownerEmail);
  const { school } = await createSchoolWithDefaults({ name: "Test Okulu 2", plan: "STARTER", ownerName: "Test", ownerEmail });
  testSchoolIds.push(school.id);

  // app/app/kursiyerler/yeni/page.tsx bu sorguyu birebir çalıştırıp seçenekleri oluşturuyor.
  const activeClasses = await prisma.licenseClassRule.findMany({ where: { schoolId: school.id, isActive: true }, orderBy: { code: "asc" } });
  assert.ok(activeClasses.length > 0, "kursiyer formunda en az bir ehliyet sınıfı seçeneği olmalı");
});
