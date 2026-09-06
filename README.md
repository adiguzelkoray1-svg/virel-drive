# Virel Drive

Türkiye'deki özel motorlu taşıt sürücü kursları için dikey SaaS.
**Konumlandırma:** *Modern sürücü kurslarının operasyon merkezi.* — "The operating system for modern driving schools."

Bu ürün bir "öğrenci kayıt programı" değildir. Kapsam, sürecin tamamıdır:

```
Ön kayıt → kayıt → evrak → teorik eğitim → devam → e-Sınav
        → direksiyon eğitimi → direksiyon sınavı → ödeme → sertifika
```

## İçerik

- `tasarim/` — ekranları üreten kaynak kod ve `.dc.html` artboard'ları.
- `marka/` — virel-brand-kit (renk/tipografi token'ları, logo, favicon). **Kaynaktır; yeniden çizilmez, yeniden seçilmez.**
- `tasarim/canvas.json` — artboard yerleşimi (4 sayfa: Kurs Uygulaması · Mobil · Landing · Tasarım Sistemi).

### Yeniden üretmek

```bash
cd tasarim && for f in build_*.py; do python3 "$f"; done
```

Tarayıcıda önizlemek için (Virel Vet reposundaki `.claude/launch.json` içinde `virel-drive-tasarim` yapılandırması hazırdır):

```bash
python3 -m http.server 4599 --directory "/Users/roko/Projects/Virel Drive/tasarim"
```

## Marka — mordan mavi'ye, bilinçli bir karar

Ürün brief'i primary renk olarak `#6C5CE7` (mor) öneriyordu; ancak brief'in kapanış talimatı
"Virel Eğitim ve Virel Vet'i incele, **aynı marka rengini ve fontunu koruyarak** yap, Virel markasını bozma" idi.
İki talimat çeliştiği için kapanış talimatı esas alındı: **Virel Drive, Virel mavisini kullanır.**

| Token | Değer | Kullanım |
|---|---|---|
| `--virel-blue` | `#0067C4` | Ana aksiyon: birincil buton, link, aktif menü/sekme, seçili durum |
| `--virel-blue-700` / `-800` | `#00559F` / `#004380` | Hover / pressed |
| `--virel-blue-050` / `-100` | `#E8F1FB` / `#CFE2F7` | Seçili satır, bilgi kutusu, aktif nav zemini |
| `--virel-mint` | `#2ED3A8` | Vurgu: ikon noktası, grafik serisi — **beyaz zeminde asla metin** |
| `--virel-turquoise` | `#00A9BF` | Gradyan ara durağı, ikincil vurgu |
| `--virel-navy` | `#0E2436` | Ana metin, koyu bölüm zemini |
| success / warning / danger | `#12A87C` / `#D9713C` / `#D1453B` | Anlamsal — marka renginden ayrıdır |
| Gradyan | 90° mint → turkuaz → mavi | Yalnızca logo, uygulama ikonu, giriş paneli, ilerleme çubuğu, landing hero |
| Font | **Quicksand** (başlık, sayı) · **Karla** (gövde, tablo, buton) | |
| Yarıçap | 8 / 14 / 22 / pill | buton-input / kart / modal / rozet |

Marka rengi ekranı kaplamaz. Mavi yalnızca ana CTA, aktif navigasyon, ilerleme, seçili filtre ve önemli KPI vurgusu içindir.
Ekranlarda gereksiz gradyan, neon, ağır gölge ve "AI panosu" görünümü yoktur.

## Ekranlar (22 artboard)

**Kurs uygulaması (16)**
Giriş · Dashboard · Takvim (direksiyon planlama) · Yeni ders (uygunluk kontrollü modal) · Kursiyerler ·
Kursiyer detayı · Teorik eğitim · Sınavlar · Eğitmenler · Araçlar ve maliyet · Finans · CRM / ön kayıt ·
Belgeler · Mesajlar · Kurs performans merkezi · Mevzuat ve kurs ayarları

**Mobil (4)** Eğitmen · Bugün · Eğitmen · Ders değerlendirmesi · Kursiyer · Ana sayfa · Kursiyer · İlerlemem

**Landing (1)** `drive.virel.com.tr` — hero + problem + modüller + planlama + mobil + güvenlik + ekosistem + CTA

**Tasarım sistemi (1)** Renk, tipografi, buton, form, rozet, ilerleme, sekme/segment/çip, takvim bileşenleri,
zaman çizelgesi, kart/KPI/boş durum, 70 ikonluk set, yap/yapma kuralları

## Ürünün farklılaştırıcı tarafı

1. **Dashboard bir KPI duvarı değil, operasyon özeti.** KPI + "Bugün" zaman çizelgesi + "Dikkat gerektirenler" birlikte çalışır:
   ders çakışması, gecikmiş ödeme, eksik evrak, devam riski, sınav hakkı, yaklaşan araç bakımı tek yerde.
2. **Çakışmasız planlama.** Ders oluşturulurken eğitmen, araç ve kursiyer uygunluğu aynı anda kontrol edilir.
   Çakışma varsa ders oluşturulmaz ve nedeni açıkça yazılır ("06 XYZ 456 plakalı araç bu saatte kullanımda").
   "En uygun saatleri göster" önerisi üç kaynağın kesişiminden üretilir.
3. **Direksiyon eğitimi yalnızca saat değil, gelişim.** 11 değerlendirme alanı (kalkış, debriyaj, park, yokuşta kalkış,
   kavşak, ayna, şerit…) her ders sonunda eğitmen tarafından puanlanır.
4. **Kursiyer sürecini kimseye sormaz.** Zaman çizelgesi + mobil "İlerlemem" ekranı; personel yükü düşer.
5. **Aday kaybetmeme.** CRM hunisi + "3 gün önce fiyat aldı, dönüş yapılmadı" tipi takip uyarıları.
6. **Mevzuat kod değil, ayar.** Ders süreleri, sınav hakları, sertifika sınıfları, devam oranı ve belge listesi
   `Ayarlar › Mevzuat ve Kurs Ayarları` içinde yapılandırılır.

## Roller

| Rol | Kapsam | Görebildiği |
|---|---|---|
| Kurs Sahibi | Tek kurs | Her şey + finans + raporlar + ayarlar |
| Yönetici | Tek kurs | Operasyon, personel, raporlar (abonelik hariç) |
| Sekreter | Tek kurs | Kursiyer, ön kayıt, takvim, evrak, mesaj, tahsilat girişi |
| Teorik Öğretmen | Kendi dersleri | Ders programı, yoklama, devam |
| Direksiyon Eğitmeni | Kendi dersleri | Günü, kursiyer performansı, ders değerlendirmesi — **finansı görmez** |
| Muhasebe | Tek kurs | Tahsilat, gider, ödeme planı, raporlar — ders detayına erişmesi gerekmez |
| Kursiyer | Kendi kaydı | İlerleme, ders, sınav, ödeme, belge, mesaj |

## Çok kiracılı (multi-tenant) yapı

Her sürücü kursu izole bir **kiracıdır**. Tüm veri `school_id` ile ayrılır; bir kursun kullanıcısı başka kursun
verisini hiçbir koşulda göremez (satır düzeyi yetkilendirme).

### Önerilen veri modeli

```
schools        (id, name, slug, city, plan_id, status, owner_user_id, created_at)
users          (id, email, name, role, school_id)
students       (id, school_id, name, phone, tc, license_class, stage, status, registered_at)
leads          (id, school_id, name, phone, source, stage, next_follow_up_at, notes)
documents      (id, school_id, student_id, type, status, file_url, verified_at)
instructors    (id, school_id, user_id, branch, license_classes[], weekly_capacity)
vehicles       (id, school_id, plate, brand, model, year, license_class, km, status, inspection_at)
vehicle_costs  (id, school_id, vehicle_id, type, amount, km, occurred_at)
theory_lessons (id, school_id, category, topic, teacher_id, room, starts_at, ends_at)
attendance     (id, school_id, student_id, theory_lesson_id, present)
driving_lessons(id, school_id, student_id, instructor_id, vehicle_id, starts_at, ends_at, status, note)
skill_ratings  (id, school_id, driving_lesson_id, skill, score)
exams          (id, school_id, student_id, type, scheduled_at, place, result, score, attempt_no)
payment_plans  (id, school_id, student_id, total, down_payment)
installments   (id, school_id, payment_plan_id, amount, due_at, paid_at, status)
messages       (id, school_id, student_id, channel, template, body, sent_at, status)
regulation     (id, school_id, key, value)          -- mevzuat ayarları
audit_logs     (id, school_id, actor_user_id, action, target, created_at)
```

Çakışma kontrolü üç sorgunun kesişimidir: eğitmen, araç ve kursiyer için aynı zaman aralığında
`driving_lessons` (ve araç için `vehicle_maintenance`, kursiyer için `theory_lessons`) kaydı bulunmamalıdır.

## Mevzuat uyumluluğu

Sistem MEB Özel MTSK süreçlerini temel alır; ancak **hiçbir mevzuat değeri koda gömülmez**:

- Sertifika sınıfı başına direksiyon saati, teorik ders sayısı, sınav hakkı, başarı barajı
- Teorik devam zorunluluğu, günlük azami ders, iki ders arası asgari süre, ders iptal süresi
- Zorunlu belge listesi ve geçerlilik süreleri

**MEBBİS / Özel MTSK entegrasyonu** yalnızca resmî ve izin verilen bir API mevcutsa kurulur.
Böyle bir API yoksa sahte entegrasyon üretilmez; veri aktarımı Excel içe/dışa aktarma, manuel giriş ve
resmî çıktıların sisteme yüklenmesi ile yapılır.

## KVKK ve güvenlik

Rol bazlı erişim · denetim kaydı · veri erişim logları · şifreleme · güvenli kimlik doğrulama ·
oturum yönetimi · yedekleme · veri silme/anonimleştirme politikası · kiracı bazında tam veri ayrımı.

## Demo verisi

124 aktif kursiyer · 8 eğitmen · 12 araç · günlük 7 direksiyon + 2 teorik ders · 7 yaklaşan sınav ·
42 bekleyen taksit · 3 çakışma/uyarı. Gerçekçi Türkçe isimler, Ankara (06) plakaları ve tarihler kullanıldı;
gerçek kişisel veri yoktur, telefon numaraları maskelidir.

## Virel ailesiyle ilişki

Virel Drive, Virel'in dikey SaaS ailesinin bir üyesidir; **kod ve çalışma zamanı bağımlılığı sıfırdır**.
Paylaşılan tek şey görsel kimliktir (`marka/` altındaki statik CSS/SVG/PNG). Kendi backend'i, kendi veritabanı,
kendi kimlik doğrulaması olur. Yayın adresi: `drive.virel.com.tr`.

| Ürün | Dikey |
|---|---|
| Virel Vet | Veteriner klinikleri |
| Virel Eğitim | Eğitim kurumları |
| **Virel Drive** | **Sürücü kursları** |
