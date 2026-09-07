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
| `ayse@ornek.com` | Kursiyer | Yalnızca mobil portal: `/kursiyer` |

`mehmet@...` ve `selin@...` girişte `/app`'e gider; `/egitmen`'e sidebar altındaki "Mobil görünüm"
bağlantısıyla ya da doğrudan URL ile geçilir. `ayse@ornek.com` doğrudan `/kursiyer`'e gider —
masaüstünde hiç yetkisi yoktur.

**Süper admin** ayrı ve gerçek bir hesap — paylaşılan demo şifresini taşımaz. E-posta ve şifresi
yalnızca `.env`'de tutulur (`SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`); bu iki değişken
boşsa seed rastgele bir şifre üretir ve `admin@virel-drive.local` ile giriş açar (terminale
"Süper admin: ..." satırıyla yazdırılır, koda ya da git'e gömülmez).

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

**Eğitmenler tamamlandı:** liste (branş süzgeci, haftalık yük, kursiyer sayısı, sınav başarısı) ·
eğitmen detayı (haftalık doluluk, yaklaşan/geçmiş dersler, atanmış araçlar, kursiyerler) ·
ekleme/düzenleme (branşa göre ehliyet sınıfı ya da ders kategorisi) · izinli/aktif işaretleme.

**Araçlar tamamlandı:** kart görünümü (kilometre, kullanım, eğitmen, muayene, haftalık doluluk,
bakım uyarısı) · ay seçicili maliyet tablosu (yakıt/bakım/lastik/sigorta/tamir, km başına maliyet) ·
araç detayı (yaklaşan dersler, gider geçmişi) · gider ekleme (kilometreyi de günceller) ·
bakıma alma/çıkarma (etkilenen planlı ders sayısını bildirir).

**Finans tamamlandı:** genel bakış (bugün/ay/bekleyen/geciken/gider/net KPI'ları, son 6 ayın
gelir-gider grafiği) · kursiyer bazında tahsilat tablosu (geciken / bu hafta vadesi gelen /
planı olmayan süzgeçleri, arama) · tahsilat alma (açık taksitleri işaretleyerek + plan dışı tutar) ·
tahsilatı geri alma · kursiyer finans detayı (ödeme planı, tahsilat geçmişi) · ödeme planı kurma ve
yeniden yapılandırma (ödenmiş taksitlere dokunmadan) · tahsilat dökümü (ödeme yöntemi kırılımı) ·
gider kayıtları (kategori dağılımı, ay seçici).

**CRM tamamlandı:** pipeline panosu (altı aşama, kart üzerinden ara/WhatsApp/aşama ilerlet) ·
aday listesi (aşama, kaynak ve ad/telefon süzgeçleri) · aday kartı (görüşme geçmişi, temas kaydı,
düzenleme) · ön kayıt ekleme (aynı telefonlu açık aday uyarısı) · **adayı kursiyere dönüştürme**
(iki kayıt birbirine bağlanır) · ön kayıt gelen kutusu (yeni başvurular + gecikmiş takipler) ·
kaynak kırılımı ve kanal bazlı dönüşüm oranı.

**Belgeler tamamlandı:** kursiyer × belge türü matrisi (7 zorunlu belge, arama ve "eksik
belgesi olan" süzgeci) · KPI'lar (evrağı tam, eksik belge, kontrol bekleyen, süresi dolacak) ·
eksik evrak listesi (kayıt ne kadar uzun açıksa o kadar öncelikli) · kursiyer başına belge
durumu güncelleme (durum, geçerlilik tarihi, not) · kursiyer kartından tek tıkla belgelere geçiş.

**Mesajlar tamamlandı:** kursiyer bazlı gelen kutusu (üç sütun: konuşma listesi / sohbet
ekranı / şablonlar-istatistik) · WhatsApp/SMS/e-posta/bildirim kanal etiketi · gün ayraçlı
mesaj balonları · hazır şablonlarla (ad otomatik doldurulur) tek tıkla mesaj yazma · okundu
işaretleme (konuşma açılınca) · gelen kutusu rozeti kenar çubuğunda canlı sayaç.

**Raporlar tamamlandı:** kurs performans merkezi — 6 KPI (toplam kursiyer, kayıt dönüşümü,
e-Sınav/direksiyon başarısı, kursiyer başına gelir, tahsilat oranı) · "Tek ekranda cevaplar"
(8 yönetim sorusu, tıklayınca ilgili sayfaya gider) · kayıt hunisi · ehliyet sınıfı dağılımı ·
direksiyon eğitmeni performans tablosu · gün/saat ders yoğunluğu ısı haritası · 6 ay/yıl/özel
tarih aralığı seçimi · gerçek CSV dışa aktarım (PDF/Excel yok, bkz. aşağıdaki not).

**Ayarlar (Mevzuat) tamamlandı:** sertifika sınıfları ve eğitim kuralları tablosu (direksiyon
saati, teorik ders sayısı, sınav hakkı, başarı barajı — ekle/düzenle/etkin-pasif) · ders ve
devam kuralları (6 sayısal ayar) · sınav ve süreç kuralları (5 açma/kapama) — hepsi tek
formdan kaydediliyor ve `RegulationSetting`/`LicenseClassRule` üzerinden sistem genelinde
anında etkili oluyor. Diğer 8 ayar kategorisi (Kurs profili, Kullanıcılar, Belge kuralları,
Fiyat/ödeme, Mesaj şablonları, Entegrasyonlar, Güvenlik/KVKK, Denetim kaydı) sol menüde
"Yakında" etiketiyle görünür ama tıklanabilir değil — henüz sayfaları yok.

**Süper admin konsolu tamamlandı:** `/admin` altında ayrı bir alan — kurs (kiracı) listesi
(durum/plan süzgeci, arama, kullanım çubukları) · yeni kurs açma (otomatik slug + OWNER hesabı,
geçici şifre bir kez gösterilir) · kurs detayı (profil, kullanıcılar, kullanım/limit, durum
değiştirme, plan/limit düzenleme, o kursa ait denetim kaydı) · **"kurs olarak görüntüle"**
(impersonation — süper admin kursun arayüzüne geçer, üstte turuncu bir bant ve "Konsola dön"
düğmesiyle) · tüm kurslardaki işlemleri gösteren global denetim kaydı.

**Mobil eğitmen/kursiyer portalları tamamlandı.** İki ayrı, telefon genişliğine göre tasarlanmış
alan (`/kursiyer`, `/egitmen`) — masaüstü sidebar'ın yerine alt sekme çubuğu olan, kendi
`requireStudentUser`/`requireInstructorUser` ile korunan bağımsız bir kabuk.

- **`/kursiyer`** (rol: STUDENT): Ana sayfa (gradyan başlık, genel ilerleme %, yaklaşan ders,
  kalan ders/borç, son sınav sonucu) · Derslerim (yaklaşan + geçmiş) · İlerlemem (7 adımlı süreç
  zaman çizelgesi) · Ödemeler (taksit planı, salt okunur) · Mesajlar (kursla iki yönlü yazışma,
  kursiyer tarafından gönderilen mesaj masaüstü Mesajlar gelen kutusunda aynen görünür) · Profil.
  Tamamı `lib/student.ts`'deki `getStudentDetail`i (masaüstü kursiyer kartıyla aynı fonksiyon)
  ve `lib/messages.ts`'deki `getThread`i yeniden kullanıyor — kursiyer tarafı için tek satır
  yeni sorgu yazmadım.
- **`/egitmen`** (rol: DRIVING_INSTRUCTOR/THEORY_TEACHER): Bugün (günün dersleri, sıradaki ders
  büyük kartla vurgulanır, "Dersi tamamla") · Ders değerlendirmesi (11 gelişim alanı + not) ·
  Takvim (bu haftanın kronolojik listesi) · Kursiyerlerim · Profil (+ "Masaüstü görünüme geç").
  Direksiyon eğitmeni tasarım kanvasındakiyle birebir; teorik öğretmenin bugünkü dersleri de
  listelenir ama yoklama alma masaüstündeki tam ekrana yönlendirir (ayrı bir mobil yoklama
  arayüzü bu sürümde yok — tasarımda da kapsanmamıştı).

Eğitmen masaüstü erişimini **kaybetmiyor**: `/app` girişi değişmedi, sidebar'ın altına sadece
"Mobil görünüm" bağlantısı eklendi. Kursiyerin masaüstünde hiç yetkisi olmadığı için (bkz.
`permissions.ts`, STUDENT boş dizi) giriş doğrudan `/kursiyer`'e gider; `/app`'e sızmaya
çalışırsa `requireSchoolUser` onu geri yollar.

**Sırada:** —. Tüm modüller tamamlandı.

### Yedi rolün tamamı tek tek denendi (son kontrol)
OWNER, SECRETARY, ACCOUNTANT, DRIVING_INSTRUCTOR, THEORY_TEACHER, STUDENT, SUPER_ADMIN —
her biriyle giriş yapılıp sidebar, dashboard ve yetkisiz sayfa denemesi kontrol edildi. Bu sırada
gerçek bir hata bulundu ve düzeltildi: `NAV_PERM` (app/app/layout.tsx) `/app/dersler`,
`/app/sinavlar`, `/app/takvim` ve `/app/kursiyerler` için hiç eşleme içermiyordu — yani bu
sayfaların gerektirdiği yetkiye bakılmaksızın sidebar'da HER ZAMAN görünüyorlardı. ACCOUNTANT
(ne `lesson.read` ne `exam.read`'e sahip) "Direksiyon Dersleri" ve "Sınavlar" bağlantılarını
görüyor, tıklayınca `/app?hata=yetki`ye düşüyordu. Dört eşleme eklendi; artık NAV'daki her
href'in kendi sayfasının `requirePermission` çağrısıyla birebir eşleştiği doğrulandı.

### Kurs Profili, Destek ve gerçek CSV dışa aktarımı
İki arka plan görevi tamamlandı:

- **`/app/kurs`** — kurs profili (ad, iletişim, adres, vergi bilgileri), abonelik durumu/plan
  rozeti ve kullanım çubukları (kullanıcı/kursiyer, limitle birlikte). Yalnızca `settings.write`
  yetkisi olanlar düzenleyebilir (OWNER/MANAGER); diğerleri salt okunur görür. Plan ve limit
  yalnızca süper admin konsolundan değişir — burada bilerek düzenlenemez.
- **`/app/destek`** — gerçek iletişim kanalları (e-posta/telefon, `mailto:`/`tel:` linkleriyle)
  ve birkaç SSS. Uygulama içi bir ticket sistemi yok; olmayan bir "talep oluştur" formu
  göstermek yerine doğrudan iletişim yolunu sundum.
- **Kursiyerler → Dışa aktar artık gerçekten çalışıyor.** Önceden `?disa=csv`'ye giden ama
  hiçbir kod tarafından işlenmeyen bir bağlantıydı. `/app/kursiyerler/export` route handler'ı
  ekrandaki filtre/aramayla (`lib/student.ts`'deki `buildStudentWhere` — liste sayfasıyla AYNI
  fonksiyon) eşleşen tüm kursiyerleri CSV'ye döküyor. Ayrıca düğme artık yalnızca `export`
  yetkisi olan rollere (OWNER/MANAGER/ACCOUNTANT) görünüyor — önceden SECRETARY/eğitmen gibi bu
  yetkisi olmayan roller de düğmeyi görüyor, tıklayınca hiçbir şey olmuyordu. Telefon numarası
  CSV'de de maskelenir (ekrandaki listeyle tutarlı — KVKK); dışa aktarım denetim kaydına yazılır.
  CSV'nin ortak parçaları (`csvRow`/`csvResponse`) Raporlar'ın export'uyla paylaşılan
  `lib/csv.ts`'e taşındı.

### Mobil genişlikte gezinme yoktu (masaüstü konsolu + süper admin)

Yedi rolün tamamı bu kez telefon genişliğinde (375×812) tek tek denendi. `Sidebar` `hidden
lg:flex`, `Header` `hidden lg:block` olduğu için mobilde ne `/app` ne `/admin`'de HİÇBİR gezinme
öğesi yoktu — sayfa içeriği görünüyor ama başka bir yere gidilemiyor, çıkış bile yapılamıyordu.
`components/shell/MobileNav.tsx` bunu çözüyor: `lg:hidden` bir üst çubuk (hamburger + logo) ile
açılan, mevcut `Sidebar`'ı aynen gösteren bir kaydırmalı panel. Hem `/app/layout.tsx` hem
`/admin/layout.tsx`'te aynı `sidebar` JSX değişkeni hem `<MobileNav>` içinde hem masaüstü
dock'ta kullanılıyor ki ikisi birbirinden kaymasın.

Bilerek dar tutuldu: bu yalnızca gezinmeyi açar, masaüstündeki yoğun tablo/takvim sayfalarını
mobile uyarlayan bir yeniden tasarım değil — brief'in kasıtlı ayrımıyla (masaüstü personel
konsolu / mobil eğitmen-kursiyer uygulaması `/egitmen`, `/kursiyer`) tutarlı bir sınır.
Bu geziyle birlikte `/kursiyer` ve `/egitmen` portalları da mobilde tekrar uçtan uca denendi;
her ikisi de her sayfada konsol hatası olmadan temiz.

### Mobil portallar hakkında
**Ders tamamlama masaüstündeki mantığın aynısı, ayrı bir kopyası.** `completeLessonMobileAction`
(app/actions/mobile.ts) `completeLessonAction`'la (app/actions/lessons.ts) aynı transaction'ı
çalıştırır; tek fark başarıda `/app/dersler/[id]` yerine `/egitmen`'e dönmesi. Masaüstü akışına
dokunmamak için mantığı paylaşmak yerine kasıtlı olarak ikiye ayırdım.

**"Sıradaki" kartı yalnızca PLANNED değil, LIVE dersleri de yakalar.** İlk sürümde yalnızca
PLANNED bakıyordu; tarayıcıda test ederken saati geçmiş ama hâlâ LIVE durumunda kalan (kapatılmamış)
bir dersin düz bir satır gibi göründüğünü, vurgulanmadığını fark ettim. Bu, tam da "eğitmenin şimdi
kapatması gereken ders" senaryosu — düzeltildi.

**Kod içi tip birleştirme:** `instructorWeek`/`instructorToday` şubeye (DRIVING/THEORY) göre iki
farklı Prisma şekli döndürür; TypeScript bunları aynı diziye iterken bir union-of-arrays hatası
verdi (`items: typeof lessons` çalışmadı) — `Awaited<ReturnType<...>>[number]` ile öğe tipini
ayrıştırıp düzelttim.

### Süper admin konsolu hakkında
**Kimlik doğrulama ve impersonation iskeleti zaten vardı.** `requireSuperAdmin`, `requireSchoolUser`'ın
`virel_drive_as_school` çerezini okuyan kısmı ve `/admin`'e yönlendiren giriş akışı bu modülden
önce yazılmıştı; yalnızca gerçek sayfalar eksikti. `startImpersonation`/`stopImpersonation`
yardımcıları ve çerez sabiti (`IMPERSONATE_COOKIE`) bu oturumda eklendi.

**Süper admin şifresi güvenlik nedeniyle koda gömülmedi.** Kullanıcı gerçek bir e-posta/şifre
verdi (`koray@virel.com.tr`); bunu `.env`'e yazdım (git'e girmez) ama `prisma/seed.ts`'nin
kendisine SABİT DEĞER olarak koymadım — .env boşsa seed rastgele bir şifre üretir. Böylece
gerçek kişisel bir şifre GitHub geçmişine kalıcı olarak sızmaz; yalnızca .env'de yaşar.

**Yeni kurs açarken geçici şifre yalnızca bir kez gösterilir, yönlendirmeyle değil.** E-posta
gönderme altyapısı olmadığı için admin şifreyi elle iletmek zorunda; bu yüzden `createSchoolAction`
başarıda `redirect()` etmez (şifre URL'e sızmasın diye) — aynı sayfada state olarak döner.

**Plan/limit düşürme korumalı.** Kullanıcı ya da kursiyer limiti, mevcut sayının altına
çekilemez — aksi halde kurs aniden "limit aşıldı" durumuna düşerdi. Bu oturumda tarayıcıda
test edilip doğrulandı.

### Ayarlar (Mevzuat) hakkında
**Sınıf kodu sonradan değiştirilemez.** `LicenseClassRule.code` bir FK değil, `Student.licenseClass`
ve `Vehicle.licenseClass` ona serbest metinle referans verir; kod değişirse mevcut kayıtlar
sessizce "tanınmayan sınıf" haline gelip her yerde varsayılan değerlere düşer. Bu yüzden
düzenleme formunda kod alanı `readOnly` — `disabled` DEĞİL, çünkü disabled input'lar FormData'ya
hiç girmez ve sunucu tarafı doğrulamayı "alan eksik" diye reddeder (bu oturumda yakalanan gerçek
bir hata: ilk sürüm `disabled` kullanıyordu, düzenleme kaydetmede "Invalid input: expected
string, received undefined" hatası veriyordu).

**Sınıf hiçbir zaman silinmez, yalnızca etkin/pasif işaretlenir** — aynı sebeple: geçmiş
kayıtlar serbest metin referansı üzerinden bir kurala bağlı kalmaya devam etmeli.

**Diğer ayar kategorileri sahte bağlantı değil.** Sol menüdeki 8 kategori (Kurs profili vb.)
tıklanamaz `div` olarak ve "Yakında" etiketiyle gösterilir; henüz sayfaları olmadığı için
gerçek bir `<Link>` olarak sunulmazlar.

### Raporlar hakkında
**PDF ve Excel yok, yalnızca CSV var.** Gerçek bir PDF/Excel üretim kütüphanesi bağlanmadı;
"CSV" düğmesi `/app/raporlar/export` route handler'ından gerçek, çalışan bir dosya indirir
(Excel'de Türkçe karakterler bozulmasın diye UTF-8 BOM eklenir). Kursiyerler sayfasındaki eski
"Dışa aktar" düğmesi (`?disa=csv`) hâlâ hiçbir şey yapmıyor — bu modülün kapsamı dışında bırakıldı.

**Kayıt hunisi bir kohort, KPI'daki "kayıt dönüşümü" bir dönem oranı — ikisi karıştırılmamalı.**
Huni, seçili aralıkta AÇILAN adaylardan kaçının şu an o aşamaya ulaştığını gösterir (`Lead`'in
aşama geçmişi tutulmadığı için "en az bu aşamaya ulaştı" cari aşamadan çıkarılır; kaybedilenler
yalnızca ilk basamakta sayılır çünkü hangi aşamada kaybedildikleri bilinmiyor). KPI'daki
"kayıt dönüşümü" ise seçili aralıkta KAPANAN (kayıt olan + kaybedilen) adaylardan kaçının
kazanıldığını gösterir — CRM modülündeki dönüşüm oranıyla aynı mantık, farklı bir soru.

**Eğitmen performans tablosu ve doluluk anlık, aralığa bağlı değil.** `lib/instructor.ts`'deki
`listInstructors` bu haftanın yükünü hesaplar; seçilen 6 ay/yıl/özel aralığı yalnızca ders
yoğunluğu ısı haritasını ve KPI'ları etkiler.

### Mesajlar hakkında
**Gerçek bir WhatsApp/SMS/e-posta sağlayıcısı bağlı değil.** Bu ekran `MessageLog` üzerinden
gönderimi ve geçmişi simüle eder; gönderilen mesaj anında `SENT` olarak işaretlenir. Sağlayıcı
bağlandığında bu, kuyruklayan bir arka plan işine devrolur (bkz. sağdaki panelin notu).

**Ayrı bir Conversation tablosu yok.** `MessageLog` zaten `studentId` taşıyor; "konuşma" listesi
bundan `lib/messages.ts` içinde JS tarafında gruplanır. Kurstaki mesaj hacmi küçük kaldığı
sürece bu, ayrı bir tabloyu senkron tutmaktan daha basit.

**Okundu işaretleme form değil.** Konuşma ekranı açıldığında `markThreadReadAction` istemciden
doğrudan çağrılır (`lib/availability.ts`'deki desenle aynı gerekçe) — bir form göndermeye
gerek yok, yalnızca o kursiyerin okunmamış gelen mesajlarını `READ` yapar.

**Arama istemci tarafında.** `/app/mesajlar` bir `layout.tsx`; layout'lar `searchParams` almaz,
bu yüzden gelen kutusu araması sunucu round-trip'i yerine `ThreadList` içinde anlık filtrelenir.

### Belgeler hakkında
**Gerçek dosya yükleme yok.** `fileUrl` alanı şemada duruyor ama bu modül yalnızca belge
*durumunu* takip ediyor (Eksik / Bekliyor / Kontrol ediliyor / Tamamlandı); gerçek bir depolama
servisi bağlanmadı. "Belge yükle" akışı bilinçli olarak kapsam dışı bırakıldı.

**Her kursiyer için 7 satır önceden açılır.** Seed her kursiyere `DOCUMENT_TYPES` kadar `Document`
satırı oluşturuyor (`@@unique([studentId, type])`), bu yüzden güncelleme aksiyonu yeni satır
açmıyor, yalnızca `upsert` ile mevcut satırı güncelliyor.

**"Eksik" sayısı bekleyeni de kapsar.** Bir kursiyerde gerçekten eksik (MISSING) bir belge varsa,
satırdaki "eksik" sayısı henüz gelmemiş (PENDING) belgeleri de sayar — ikisi de kayıt sürecini
durduruyor. Yalnızca bekleyen belge varsa (hiç eksik yoksa) ayrıca "bekliyor" olarak gösterilir.

### CRM hakkında
**Aday ile kursiyer ayrı kayıtlardır.** `Lead` huninin içindeki kişidir; kayıt kesinleştiğinde
`convertLeadAction` bir `Student` açar ve `Lead.studentId` ile ikisini bağlar. Bağ olmadan
"bu kursiyer hangi kanaldan geldi" ve dönüşüm oranı sorulamaz.

**"Kayıt oldu" elle seçilemez.** Aşama listesinde WON, aday kursiyere dönüştürülene kadar
kapalıdır; aksi halde kayıt sayısı gerçek kursiyer kaydı olmadan artardı.

**Kayıt anı ayrı alanda.** `wonAt`, `updatedAt`'ten bağımsız tutulur: her düzenleme
`updatedAt`'i değiştirdiği için aylık kayıt sayısı ve ortalama kapanış süresi ondan hesaplanamaz.

**Aşama değişikliği görüşmeden geçer.** Temas kaydı formu kanal, aşama, sonraki takip tarihi ve
notu tek adımda yazar. Pano üzerindeki "İlerlet" yalnızca bir sonraki açık aşamaya taşır;
kayıt ve kayıp kararları aday kartından verilir.

**Gecikme gün başlangıcından hesaplanır.** `nextFollowUpAt` saat 14:00'e kurulu olsa da gün farkı
iki tarihin gün başlangıcı üzerinden alınır; dün vadeli takip "0 gün geçti" diye görünmez.

**Kanal karşılaştırması örneklem ister.** Dönüşüm oranının yanında `won/closed` sayısı da yazılır
ve "en yüksek kanal" iddiası, en az beş adayı kapanmış iki kanal olmadan kurulmaz.

### Finans hakkında
**Para birimi kuruş.** Tüm tutarlar tam sayı kuruş olarak saklanır; `money()` ekranda ₺'ye çevirir.
Formlarda TL girilir, sunucu aksiyonu 100 ile çarpar.

**Kısmi taksit ödemesi yok.** Taksit ya kapanır ya bekler; `Installment` üzerinde "kısmen ödendi"
alanı tutulmaz. Kursiyer taksidin bir kısmını ödemek isterse plan yeniden yapılandırılır —
ödenmiş taksitler korunur, açık taksitler silinip kalan bakiye yeni vadelere bölünür.

**Vadesi geçen taksit gece işine bağlı değil.** Veritabanındaki `status` `PENDING` kalabilir;
`effectiveStatus()` vadesi geçmiş bekleyen taksidi ekranda "Gecikti" sayar. Böylece durumu her gece
güncelleyen bir cron olmadan da listeler doğru çalışır.

**Araç giderleri ayrı tabloda.** Plakaya bağlı giderler `VehicleCost` içinde tutulur ve araçlar
modülünden girilir; finans özetinde (aylık/yıllık gider, net durum, gelir-gider grafiği) toplam
gidere dahil edilir ama gider listesinde ayrı gösterilir.

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

### Eğitmenler ve araçlar

Eğitmenin haftalık yükü, branşına göre direksiyon ya da teorik derslerinden hesaplanır ve
`weeklyCapacity` ile oranlanır. Sınav başarı oranı **yaklaşıktır**: bir kursiyer birden çok
eğitmenle ders yapabildiği ve sınavı hangi eğitmenin kazandırdığı veriden çıkarılamadığı için,
kursiyerin sınavı ders yaptığı her eğitmenin oranına sayılır.

Araçta km başına maliyet, o ay yapılan **ders saati × 25 km** varsayımıyla hesaplanır (gerçek
kilometre sayacı okuması her fişte bulunmuyor). Ayda 10 saatten az kullanılan araçta oran hiç
gösterilmez: tek bir sigorta kalemi ₺250/km gibi anlamsız bir değer üretebiliyordu. Maliyet
tablosu ay seçicilidir — ayın ilk günlerinde giderler tam ay, kilometre birkaç günlük olduğu
için sabit "bu ay" görünümü yanıltıcıydı.

Bakıma alınan araç derse atanamaz (`lib/availability.ts` bunu zaten reddediyor); bakıma alma
ekranı, o araca bağlı kaç planlı dersin taşınması gerektiğini söyler.

### Kural: `"use server"` dosyaları yalnızca async fonksiyon dışa aktarır

Bir aksiyon dosyasından sabit ya da tip DEĞERİ (ör. `emptyXState`) dışa aktarmak sayfayı
çalışma zamanında 500'e düşürür: *A "use server" file can only export async functions, found
object.* Hata sayfayı derlerken değil, o aksiyonu içe aktaran sayfa render edilirken çıktığı
için typecheck/lint bunu yakalamaz. Bu yüzden form durum tipleri ve başlangıç sabitleri ayrı
bir modülde tutulur: `lib/lesson-form.ts`, `lib/theory-form.ts`, `lib/exam-form.ts`,
`lib/instructor-form.ts`. Yeni bir form aksiyonu yazarken aynı düzeni izleyin.

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
