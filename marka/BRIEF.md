# virel — logo, tipografi ve renk paletini siteye entegre et

Bu klasördeki dosyalar hazır ve kaynaktır. Logoyu **yeniden çizme**, renkleri **yeniden seçme**;
aşağıdakileri olduğu gibi kullan.

| Dosya | Ne için |
|---|---|
| `virel-brand.css` | Renk, tipografi, yarıçap, gölge token'ları (`--virel-*`) + koyu tema |
| `VirelLogo.jsx` | React logo bileşeni. Üç varyant, üç ton. Gradyan id çakışmasını `useId` ile çözer |
| `virel-logo.html` | React yoksa: doğrudan yapıştırılacak inline SVG blokları + `<head>` etiketleri |
| `favicon/` | 32 / 64 / 180 / 192 / 512 px + `site.webmanifest` |

## Yapılacaklar

1. `virel-brand.css` dosyasını global stile ekle (Tailwind varsa `@layer base` içine import et).
2. Projedeki **sabit hex kodlarını** token'larla değiştir. Sonrasında kod tabanında marka rengi
   olarak yazılmış hiçbir literal hex kalmasın.
3. `VirelLogo.jsx` dosyasını bileşen klasörüne koy; header, footer ve mobil başlıkta kullan.
4. Fontları `<head>`'e ekle (aşağıda), `body`'ye `--virel-font-body`, başlıklara `--virel-font-display` uygula.
5. `favicon/` içeriğini `public/`'e kopyala, `<head>` etiketlerini ve `theme-color`'ı ekle.
6. Bitince koyu temayı da kontrol et — token'lar hazır, bileşenlerin token kullanması yeterli.

## Logo kullanımı

```jsx
import VirelLogo from "@/components/VirelLogo";

<VirelLogo size={150} />                     // yatay kilit, gradyan — header
<VirelLogo variant="vertical" size={120} />  // dikey kilit — footer, hero, giriş ekranı
<VirelLogo variant="mark" size={32} />       // sadece ikon — mobil başlık, avatar
<VirelLogo tone="white" size={150} />        // koyu zemin / koyu tema
<VirelLogo tone="solid" size={150} />        // mavi ikon + lacivert yazı (kurumsal)
```

`size` genişliktir, yükseklik oranla hesaplanır.

**Kurallar**
- Minimum genişlik: yatay 90 px · dikey 70 px · ikon 20 px.
- Güvenli alan: dört yanda, ikonun üstündeki noktanın çapı kadar boşluk (yatay kilitte ≈ logo
  yüksekliğinin %20'si). Bu alana başka öğe girmez.
- Koyu zeminde ve kalabalık fotoğraf üzerinde `tone="white"`.
- Oranı bozma, döndürme, gölge/kontur/parlama ekleme, ikonla yazıyı ayrı konumlandırma.

## Tipografi

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=Karla:wght@400;500;600;700&display=swap">
```

- **Quicksand** — sadece başlık ve sayı. Logo yazısıyla aynı yuvarlak geometrik iskeleti taşır.
  Ağırlık 600, hero'da 700. Büyük punto başlıklara `letter-spacing: -0.02em`.
- **Karla** — gövde metni, form etiketi, tablo, buton. Ağırlık 400/500, buton 700.
- Gövde satır yüksekliği 1.6, ölçü ~65 karakter.
- Tablodaki ve fiyattaki rakamlara `font-variant-numeric: tabular-nums`.
- Logo yazısı vektördür, font gerektirmez — logoyu asla fontla dizme.

Ölçek token'ları: `--virel-text-display` 56 · `h1` 36 · `h2` 28 · `h3` 22 · `lg` 18 ·
`base` 16 · `sm` 14 · `xs` 12. Bu ölçeğin dışına çıkma.

## Renk paleti — nerede ne kullanılır

| Token | Değer | Kullanım |
|---|---|---|
| `--virel-blue` | `#0067C4` | **Ana aksiyon**: birincil buton, link, aktif sekme, seçili durum |
| `--virel-blue-700` | `#00559F` | Buton hover |
| `--virel-blue-800` | `#004380` | Buton active / pressed |
| `--virel-blue-050` | `#E8F1FB` | Seçili satır, bilgi kutusu zemini |
| `--virel-mint` | `#2ED3A8` | Vurgu: ikon noktası, grafik serisi, rozet, "yeni" işareti |
| `--virel-turquoise` | `#00A9BF` | Gradyanın ara durağı; tek başına ikincil vurgu |
| `--virel-gradient` | mint → turkuaz → mavi | Hero zemini, öne çıkan kart, ilerleme çubuğu, gradyanlı başlık |
| `--virel-navy` | `#0E2436` | Ana metin rengi, koyu bölüm zemini |
| `--virel-text-2` / `--virel-text-muted` | | İkincil metin / ipucu, etiket |
| `--virel-surface` / `--virel-border` | | Kart zemini / kenarlık |
| `--virel-success` `#12A87C` · `--virel-warning` `#D9713C` · `--virel-danger` `#D1453B` | | Durum renkleri — marka renginden ayrıdır, birbirinin yerine kullanılmaz |

**Erişilebilirlik — bunlara dikkat et**
- **Mint asla beyaz zeminde metin rengi olmaz** (kontrast ~1.9). Mint yalnızca dolgu, ikon,
  grafik ve koyu zemin üstünde metin olarak kullanılır.
- Mavi zemin üstünde metin daima beyaz (`--virel-on-brand`).
- Koyu temada link ve vurgu için `--virel-blue-300` / `--virel-info` kullan; `--virel-blue`
  koyu zeminde yeterince okunmaz.
- Gövde metni en az 4.5:1 kontrast; gradyan zemin üstüne uzun metin koyma.

**Oran**: sayfanın yaklaşık %70'i nötr (yüzey + metin), %20'si mavi, %10'u mint/gradyan.
Gradyanı sayfada bir kez, en fazla iki kez kullan — her karta uygulama.

## Bileşen örneği (token'larla)

```css
.btn-primary {
  background: var(--virel-blue);
  color: var(--virel-on-brand);
  font-family: var(--virel-font-body);
  font-weight: 700;
  border-radius: var(--virel-radius);
  padding: 12px 22px;
  box-shadow: var(--virel-shadow-sm);
}
.btn-primary:hover  { background: var(--virel-blue-700); }
.btn-primary:active { background: var(--virel-blue-800); }
.btn-primary:focus-visible { outline: 2px solid var(--virel-blue-300); outline-offset: 2px; }

.card {
  background: var(--virel-surface);
  border: 1px solid var(--virel-border);
  border-radius: var(--virel-radius-lg);
  box-shadow: var(--virel-shadow);
}
```

## Favicon / head

```html
<link rel="icon" type="image/png" sizes="32x32"  href="/virel-favicon-32.png">
<link rel="icon" type="image/png" sizes="64x64"  href="/virel-favicon-64.png">
<link rel="apple-touch-icon" sizes="180x180"     href="/virel-favicon-180.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0067C4">
```

## Teslim ederken

Değiştirdiğin dosyaları ve kaldırdığın sabit hex kodlarını listele. Token'a çeviremediğin
bir renk kaldıysa nedenini yaz — kendi kafana göre yeni renk uydurma.
