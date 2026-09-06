# Virel Drive — uygulama

Next.js 16 (App Router) + Prisma 7 + PostgreSQL. Tasarım kaynağı: `../tasarim/` artboard'ları.

## Kurulum

```bash
createdb virel_drive
cp .env.example .env       # DATABASE_URL ve AUTH_SECRET doldurun
npm install
npm run db:migrate
npm run db:seed
npm run dev                # http://localhost:3002
```

`AUTH_SECRET` üretmek için:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Demo hesaplar

Seed sonrası tüm hesapların şifresi `virel1234`.

| E-posta | Rol | Ne görür |
|---|---|---|
| `ahmet@yildizsurucukursu.com` | Kurs Sahibi | Her şey |
| `sekreter@yildizsurucukursu.com` | Sekreter | Kursiyer, takvim, evrak, tahsilat |
| `muhasebe@yildizsurucukursu.com` | Muhasebe | Finans ve raporlar |
| `mehmet@yildizsurucukursu.com` | Direksiyon Eğitmeni | Kendi dersleri — **finans yok** |
| `selin@yildizsurucukursu.com` | Teorik Öğretmen | Ders programı ve yoklama |
| `quickfactt@gmail.com` | Süper Admin | Platform (henüz yapılmadı) |

Rol farkını görmek için eğitmen hesabıyla girin: kenar çubuğunda Finans, CRM, Raporlar ve
Ayarlar görünmez; dashboard'da tahsilat kartı yerine rol açıklaması çıkar.

## Mimari

```
src/lib/
  prisma.ts        Tembel PrismaClient (pg adaptörü)
  auth.ts          bcrypt + JWT çerez oturumu, requireSchoolUser (kiracı bağlamı), audit
  jwt.ts           jose ile imzalama/doğrulama
  permissions.ts   Rol → yetki matrisi (can())
  constants.ts     Durum/rol etiketleri, mevzuat varsayılanları, tasarım sabitleri
  regulation.ts    Mevzuat ayarlarını okuma/yazma (koda gömülü sayı yok)
  availability.ts  Eğitmen + araç + kursiyer uygunluk kontrolü (çakışma nedeni metniyle)
  dashboard.ts     Operasyon uyarıları, bugünkü program, tahsilat, haftalık yoğunluk
  format.ts        ₺, tarih, saat, telefon maskesi, baş harf
src/components/    ui.tsx (tasarım sistemi bileşenleri), icons.tsx (69 ikon), shell/
src/app/
  (auth)/giris     Giriş
  app/             Kurs uygulaması (kabuk + dashboard + kursiyerler)
  api/auth/cikis   Çıkış
```

### Çok kiracılılık

Her sorgu `schoolId` ile sınırlanır; `requireSchoolUser()` bu bağlamı verir.
Bir kursun kullanıcısı başka kursun verisini göremez.

### Mevzuat

Ders süresi, günlük azami ders, devam oranı, sınav hakkı, başarı barajı ve sertifika sınıfı
kuralları `RegulationSetting` + `LicenseClassRule` tablolarındadır; kodda sabit değildir.
`src/lib/constants.ts` içindeki `REGULATION_DEFAULTS` yalnızca yeni kurs açılırken yazılan
başlangıç değeridir.

## Durum

**Hazır:** veri modeli (23 tablo) ve migrasyon · demo verisi · kimlik doğrulama ve roller ·
uygulama kabuğu (yetkiye göre filtrelenen menü) · Dashboard (KPI, bugünkü program, dikkat
gerektirenler, haftalık yoğunluk, tahsilat) · Kursiyerler listesi (filtre, arama, sayfalama,
ilerleme) · **Kursiyer detayı** (süreç çizelgesi, direksiyon gelişim puanları, son dersler,
ödeme planı, evraklar, sınav hakları) · **Takvim** (gün ve hafta görünümü, çakışma tespiti,
en uygun saat önerileri) · **Ders oluşturma** (eğitmen/araç/kursiyer uygunluğu anlık kontrol,
çakışmada engelleme, denetim kaydı).

**Ders yaşam döngüsü tamamlandı:** ders listesi (zaman/durum/eğitmen süzgeçleri) · ders detayı ·
düzenleme (dersin kendisi çakışma sayılmaz) · iptal (neden + mevzuattaki süreye göre "geç iptal"
kaydı) · gelmedi · yeniden planlama · ders sonu değerlendirmesi (11 gelişim alanı + eğitmen notu).
Her durum değişikliği denetim kaydına yazılır.

**Teorik eğitim ve yoklama tamamlandı:** dönem programı (kategori ilerlemesi, yaklaşan/geçmiş/
yoklama bekleyen süzgeçleri) · ders detayı · yoklama alma · devam riski listesi · ders planlama
ve düzenleme (öğretmen ve derslik çakışma kontrolüyle) · ders iptali.

**Sınavlar tamamlandı:** e-Sınav ve Direksiyon Sınavı sekmeleri, sınav sonuçları, sınav hakları
listesi · sınav planlama (hak ve eğitim şartı otomatik kontrolü, istisnai "yine de kaydet" onayı) ·
sonuç kaydı (geçince kursiyer sürecini otomatik ilerletir) · sınav iptali.

**Sırada:** eğitmenler · araçlar · finans · CRM · belgeler · mesajlar · raporlar ·
mevzuat ayarları ekranı · mobil (eğitmen/kursiyer) · süper admin konsolu.

### Takvim hakkında

Varsayılan görünüm **Gün**: sütunlar direksiyon eğitmenleridir, teorik dersler ayrı sütunda
toplanır. Kursun darboğazı araç değil eğitmen olduğu için doluluk da eğitmen kapasitesine göre
ölçülür. **Hafta** görünümü genel bakış içindir; aynı saatte birden çok ders varsa gün sütunu
şeritlere bölünür.

### Ders yaşam döngüsü

`PLANNED → DONE` (değerlendirmeyle), `→ CANCELLED` (neden ve geç iptal kaydıyla), `→ NO_SHOW`.
İptal ve gelmedi durumları `Yeniden planla` ile `PLANNED`'a döner; tamamlanmış ders düzenlenemez
ve geri alınamaz. Düzenlemede uygunluk kontrolü dersin kendisini dışarıda bırakır
(`excludeLessonId`), böylece dersi kendi saatiyle kaydetmek çakışma saymaz.

Rol ayrımı: düzenleme ve iptal `lesson.write`, ders sonu değerlendirmesi `lesson.review` ister.
Direksiyon eğitmeni yalnızca değerlendirme girebilir; dersi düzenleyemez ya da iptal edemez.

### Teorik eğitim ve yoklama

Devam oranı `Attendance` satırlarından hesaplanır; sınır (`theoryAttendanceMinPercent`, varsayılan
%85) mevzuat ayarındadır ve sınırın altına inen kursiyer teorik ekranında "devam riski" olarak
listelenir. Yoklama formu herkesi varsayılan olarak "var" kabul eder — eğitmen yalnızca gelmeyeni
işaretler; kaydedince ders isteğe bağlı olarak tamamlanmış sayılır.

Teorik derste çakışma kontrolü aynı öğretmen ve aynı derslik üzerinden yapılır. Kontrol turunda
yalnızca zaman alanları doğrulanır (konu ve kategori kaydetmede zorunludur), böylece form
doldurulurken çakışma anında görünür.

### Sınavlar

Hak sayısı `LicenseClassRule.examAttempts` (sınıf bazında, mevzuat ayarı) üzerinden hesaplanır;
`attemptNo` yalnızca `DONE` sınavlardan sayılır. Bu yüzden aynı türde zaten bekleyen (PLANNED/
APPLIED) bir başvuru varken yeni kayıt engellenir — aksi hâlde iki ayrı "1. hak" kaydı oluşurdu.
Bu engel istisnai onayla (override) aşılamaz; gerçek bir istisna değil, veri bütünlüğü hatasıdır.
Direksiyon sınavı için mevzuat ayarı (`blockExamWithoutHours`) açıkken eğitim saati dolmadan
başvuru engellenir — bu VE hak sınırı, yetkili kullanıcının "yine de kaydet" onayıyla aşılabilir
(`overridable: true`); "istisnai durum" onayı yalnızca gerçekten istisnai olan bu iki durumda
gösterilir. Sonuç PASSED olursa kursiyer süreci otomatik ilerler: e-Sınav → direksiyon eğitimi,
direksiyon sınavı → mezuniyet (`nextStageAfter`).

### Ders formu

Uygunluk sorgusu formu göndermez; `checkAvailabilityAction` doğrudan çağrılır. Sebebi:
React 19 bir form aksiyonu tamamlandığında formu sıfırlıyor ve her kontrol turunda seçimler
kayboluyordu. Oluşturma yolu form aksiyonudur ve hata dönerse alanlar sunucudan geri gelen
değerlerle doldurulur.

### `<select>` alanları ve form.reset() — üç formu etkileyen ortak hata

Bir form aksiyonu (create/update/schedule) hata döndürdüğünde React 19 formun native
`reset()`'ini çağırır. Bu, metin/tarih girişlerinde zararsızdır (React her render'da denetimli
değeri yeniden yazar), ama `<select defaultValue=...>` için YIKICIDIR: native reset yalnızca
`<option>` üzerindeki HTML `selected` özniteliğini okur, React ise seçimi yalnızca DOM özelliği
olarak ayarlar (hiçbir `<option>`'a `selected` özniteliği yazmaz). Sonuç: hata sonrası seçili
kursiyer/eğitmen/araç/kategori görünürde sessizce "Seçin…" placeholder'ına döner — kullanıcı
tüm seçimlerini yeniden yapmak zorunda kalır ve fark etmezse yanlış bir kayıtla ilerleyebilir.

`<option selected={...}>` eklemek ÇÖZÜM DEĞİLDİR: React bunu geçersiz kabul edip DOM'dan söker
ve konsola uyarı basar (select seçimi yalnızca `<select>`'in kendi `value`/`defaultValue`
prop'undan yönetilmelidir). Uygulanan çözüm: sunucudan dönen değerler değiştiğinde ilgili alanı
`key` ile tamamen yeniden oluşturmak — taze bir DOM düğümü `defaultValue`'yu doğru uygular ve
önceki reset'ten etkilenmez:

```tsx
const formKey = JSON.stringify(back ?? {});   // back = state.values (aksiyondan dönen değerler)
<select key={`studentId-${formKey}`} name="studentId" defaultValue={back?.studentId ?? ""}>
```

**Önemli:** `key` kardeşler arasında benzersiz olmalı — aynı `formKey`'i birden fazla kardeş
alana vermek "duplicate key" uyarısına ve öngörülemez davranışa yol açar; her alan adıyla
öneklenir (`studentId-`, `date-`, `room-`…). Bu düzeltme `LessonForm`, `TheoryForm` ve
`ScheduleForm`'un tümüne uygulanmıştır.

## Komutlar

```bash
npm run dev        # geliştirme sunucusu (3002)
npm run typecheck  # tsc --noEmit
npm run db:migrate # şema değişikliği sonrası migrasyon
npm run db:seed    # demo verisini sıfırla ve yeniden yükle
npm run db:studio  # Prisma Studio
```

> `db:seed` tüm tabloları siler ve yeniden yazar. Kullanıcı kimlikleri değiştiği için
> açık oturumlar geçersiz olur; tekrar giriş yapmanız gerekir.
