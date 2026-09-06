# -*- coding: utf-8 -*-
"""Virel Drive · Tasarım sistemi."""
from common import (icon, bare, badge, btn, avatar, bar, seg, tabs, empty, card, ICONS,
                    logo, logo_vertical, logo_mark, app_icon, GRAD, QS)

def sec(title, sub, inner):
    return f'''<section style="padding: 44px 0; border-top: 1px solid #E7EEF2;">
      <div style="display: flex; align-items: baseline; gap: 14px; margin-bottom: 26px;">
        <span style="font-family: {QS}; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">{title}</span>
        <span class="t-13 t-muted">{sub}</span></div>
      {inner}</section>'''

def swatch(name, hexv, use, dark=False):
    fg = "#FFFFFF" if dark else "#0E2436"
    return f'''<div style="border: 1px solid #E7EEF2; border-radius: 12px; overflow: hidden;">
      <div style="height: 68px; background: {hexv}; display: flex; align-items: flex-end; padding: 10px 12px; color: {fg}; font-size: 12px; font-weight: 700;" class="num">{hexv}</div>
      <div style="padding: 11px 12px;">
        <div style="font-size: 13px; font-weight: 600;">{name}</div>
        <div class="t-13 t-muted" style="margin-top: 3px; line-height: 1.45;">{use}</div></div></div>'''

COLORS = [("--virel-blue", "#0067C4", "Ana aksiyon: birincil buton, link, aktif menü, seçili durum", True),
          ("--virel-blue-700", "#00559F", "Hover · koyu zeminde metin", True),
          ("--virel-blue-050", "#E8F1FB", "Seçili satır, bilgi kutusu, aktif nav zemini", False),
          ("--virel-mint", "#2ED3A8", "Vurgu: ikon noktası, grafik serisi — beyaz zeminde asla metin", False),
          ("--virel-turquoise", "#00A9BF", "Gradyan ara durağı, ikincil vurgu", True),
          ("--virel-navy", "#0E2436", "Ana metin, koyu bölüm zemini", True),
          ("--virel-success", "#12A87C", "Tamamlandı, ödendi, başarılı", True),
          ("--virel-warning", "#D9713C", "Bekliyor, gelmedi, bakım yaklaşıyor", True),
          ("--virel-danger", "#D1453B", "Çakışma, gecikmiş ödeme, eksik evrak", True),
          ("--virel-bg", "#F4F7F8", "Uygulama zemini", False),
          ("--virel-surface", "#FFFFFF", "Kart zemini", False),
          ("--virel-border", "#E7EEF2", "Kenarlık, ayraç", False)]

type_rows = "".join(f'''<div style="display: flex; align-items: baseline; gap: 22px; padding: 16px 0; border-top: 1px solid #E7EEF2;">
  <span class="t-13 t-muted" style="width: 190px; flex-shrink: 0;">{tok}</span>
  <span style="font-family: {fam}; font-size: {size}px; font-weight: {w}; letter-spacing: {ls}; color: #0E2436;">{sample}</span>
  <span class="t-13 t-muted" style="margin-left: auto;" class="num">{size}px · {w}</span></div>'''
  for tok, fam, size, w, ls, sample in [
    ("display · Quicksand", QS, 56, 700, "-0.03em", "Driving schools, simplified."),
    ("h1 · Quicksand", QS, 36, 700, "-0.02em", "Kursiyerler"),
    ("h2 · Quicksand", QS, 28, 700, "-0.02em", "Dashboard"),
    ("h3 · Quicksand", QS, 22, 600, "-0.01em", "Direksiyon planlama"),
    ("card · Quicksand", QS, 16, 600, "0", "Dikkat gerektirenler"),
    ("body · Karla", "Karla, sans-serif", 16, 400, "0", "Kursunuzun bugünkü operasyon özeti."),
    ("sm · Karla", "Karla, sans-serif", 14, 400, "0", "Eğitmen: Mehmet Öz · Araç: 06 ABC 123"),
    ("xs · Karla", "Karla, sans-serif", 12, 600, "0", "BEKLEYEN TAHSİLAT")])

def rights(used, total, tone="#0067C4"):
    dots = "".join(f'<span style="width: 8px; height: 8px; border-radius: 999px; background: {tone if i < used else "#E7EEF2"};"></span>' for i in range(total))
    return f'<div style="display: flex; align-items: center; gap: 8px;"><span style="display: flex; gap: 4px;">{dots}</span><span class="t-13 t-muted num">{total - used}/{total} hak</span></div>'

def toggle(on):
    return f'''<div style="width: 36px; height: 21px; border-radius: 999px; background: {"#0067C4" if on else "#CFDCE4"}; padding: 2px; display: flex; {"justify-content: flex-end;" if on else ""}">
      <div style="width: 17px; height: 17px; border-radius: 999px; background: #FFFFFF;"></div></div>'''

def demo(label, inner):
    return f'''<div style="display: flex; flex-direction: column; gap: 12px;">
      <span class="t-13 t-muted" style="font-weight: 600;">{label}</span>
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">{inner}</div></div>'''

STATES = [("Bekliyor", "neutral"), ("Devam ediyor", "brand"), ("Tamamlandı", "success"),
          ("Gelmedi", "warning"), ("Çakışma", "danger"), ("B sınıfı", "brand")]

icons_grid = "".join(f'''<div style="display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 14px 6px; border: 1px solid #E7EEF2; border-radius: 10px;">
  {icon(n, 20, "#42586A")}<span class="t-13 t-muted" style="font-size: 11px;">{n}</span></div>''' for n in sorted(ICONS))

body = f'''
<div style="width: 1440px; background: #FFFFFF; padding: 60px 80px 80px;">
  <div style="display: flex; align-items: flex-end; gap: 20px; padding-bottom: 34px;">
    <div>
      <div style="display: flex; align-items: baseline; gap: 9px;">{logo(32)}<span style="font-family: {QS}; font-size: 19px; font-weight: 600; color: #42586A;">drive</span></div>
      <div style="font-family: {QS}; font-size: 34px; font-weight: 700; letter-spacing: -0.02em; margin-top: 20px;">Tasarım sistemi</div>
      <div class="t-sec" style="margin-top: 8px; max-width: 720px; line-height: 1.65;">
        Virel Drive, Virel Vet ve Virel Eğitim ile aynı marka tokenlarını kullanır. Renk yeniden seçilmez, logo yeniden çizilmez;
        <b>marka/virel-brand.css</b> ve <b>VirelLogo</b> olduğu gibi uygulanır.</div>
    </div>
    <div style="margin-left: auto; display: flex; gap: 18px; align-items: center;">
      {app_icon(64)}{logo_vertical(110)}{logo_mark(44)}
    </div>
  </div>

  {sec("Renk", "Mor değil — Virel mavisi. Marka rengi yalnızca aksiyon, aktif durum ve önemli vurgu için.",
      f'<div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px;">' + "".join(swatch(*c) for c in COLORS) + '</div>'
      + f'<div style="margin-top: 22px; height: 64px; border-radius: 12px; background: {GRAD}; display: flex; align-items: center; padding: 0 20px; color: #FFFFFF; font-size: 13px; font-weight: 600;">Gradyan — yalnızca logo, uygulama ikonu, giriş ekranı paneli, ilerleme çubuğu ve landing hero</div>')}

  {sec("Tipografi", "Quicksand: başlık ve sayı · Karla: gövde, tablo, buton · tablo ve fiyatlarda tabular-nums", type_rows)}

  {sec("Butonlar", "Birincil aksiyon ekranda tek. Diğer eylemler ikincil ya da hayalet.",
      f'''<div style="display: flex; flex-direction: column; gap: 26px;">
        {demo("Türler", btn("Ders oluştur", "primary", "check") + btn("Vazgeç", "secondary") + btn("Kursiyer ekle", "outline", "plus") + btn("Detaylar", "ghost") + btn("Kaydı sil", "danger", "trash"))}
        {demo("Boyutlar", btn("Varsayılan 40px", "primary") + btn("Küçük 34px", "primary", None, "btn-sm") + btn("Mini 30px", "primary", None, "btn-xs") + btn("Pasif", "primary", None, "btn-disabled"))}
        {demo("İkon butonlar", f'<div class="ibtn">{icon("bell", 18)}</div><div class="ibtn ibtn-primary">{icon("plus", 18)}</div><div class="ibtn ibtn-soft">{icon("edit", 18)}</div><div class="ibtn ibtn-ghost">{icon("more", 18)}</div>')}
      </div>''')}

  {sec("Form alanları", "Yükseklik 42px · yarıçap 8px · odakta 3px mavi halka",
      f'''<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
        <div><div class="label" style="margin-bottom: 6px;">Varsayılan</div><div class="input">Kursiyer seçin</div></div>
        <div><div class="label" style="margin-bottom: 6px;">Odakta</div><div class="input input-focus">Ayşe Yılmaz</div></div>
        <div><div class="label" style="margin-bottom: 6px;">Hatalı</div><div class="input input-error">14:00</div><div class="hint" style="color: #D1453B; margin-top: 5px;">Eğitmen bu saatte meşgul.</div></div>
        <div><div class="label" style="margin-bottom: 6px;">Pasif</div><div class="input input-disabled">Otomatik hesaplanır</div></div>
      </div>''')}

  {sec("Durum rozetleri", "Anlamsal renkler marka renginden ayrıdır; birbirinin yerine kullanılmaz.",
      f'<div style="display: flex; gap: 10px; flex-wrap: wrap;">' + "".join(badge(t, k, dot=k != "neutral") for t, k in STATES) + '</div>')}

  {sec("İlerleme ve sınav hakkı", "Süreç yüzdesi, ders saati ve kalan hak görselleştirmesi",
      f'''<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
        <div>{bar(72, "bar-grad", 9)}<div class="t-13 t-muted" style="margin-top: 8px;">Ehliyet süreci · %72</div></div>
        <div>{bar(57, "", 6)}<div class="t-13 t-muted" style="margin-top: 8px;">Direksiyon eğitimi · 8/14 saat</div></div>
        <div style="display: flex; flex-direction: column; gap: 10px;">{rights(2, 4)}{rights(3, 4, "#D1453B")}</div>
      </div>''')}

  {sec("Gezinme bileşenleri", "Sekme, segment, çip, geçiş anahtarı",
      f'''<div style="display: flex; flex-direction: column; gap: 26px;">
        {tabs(["Genel", "Evraklar", "Teorik", "e-Sınav", "Direksiyon", "Ödemeler"], "Genel")}
        {demo("Segment", seg(["Gün", "Hafta", "Ay"], "Hafta") + seg(["Tümü", "Eğitmen", "Araç"], "Tümü"))}
        {demo("Çip filtreleri", '<div class="chip chip-on">Tümü 124</div><div class="chip">Aktif 98</div><div class="chip">Ön kayıt 12</div><div class="chip">Mezun 63</div>')}
        {demo("Geçiş", toggle(True) + toggle(False))}
      </div>''')}

  {sec("Takvim bileşenleri", "Ders türleri renk kodludur; çakışma ayrı bir durumdur.",
      f'''<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px;">
        {"".join(f'''<div class="slot slot-{k}" style="height: 74px;">
          <div style="display: flex; align-items: center; gap: 5px; font-weight: 600;">{icon(ic, 12, sw=2)}{t}</div>
          <div style="opacity: .78; margin-top: 3px;">{s}</div>
          <div style="opacity: .6; margin-top: 2px;" class="num">14:00–15:30</div></div>'''
          for k, ic, t, s in [("drive", "wheel", "Ayşe Y.", "Mehmet · 06 ABC"), ("theory", "book", "Trafik ve Çevre", "Derslik 2 · 24 kişi"),
                              ("exam", "exam", "e-Sınav", "4 kursiyer"), ("busy", "wrench", "06 ABC 123", "Periyodik bakım"),
                              ("clash", "alert", "Merve K.", "Araç çakışması")])}
      </div>''')}

  {sec("Zaman çizelgesi", "Kursiyer yolculuğu — tamamlanan, güncel ve bekleyen adım",
      f'''<div style="display: flex; gap: 40px;">
        {"".join(f'''<div style="display: flex; gap: 11px; align-items: flex-start;">
          <span class="tick tick-{k}">{icon(ic, 13, sw=2.4)}</span>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 13.5px; font-weight: 600; color: {c};">{t}</span>
            <span class="t-13 t-muted">{s}</span></div></div>'''
          for k, ic, t, s, c in [("done", "check", "Teorik eğitim", "29 Temmuz 2026", "#0E2436"),
                                 ("now", "clock", "Direksiyon eğitimi", "8 / 14 saat", "#0E2436"),
                                 ("todo", "chev-right", "Direksiyon sınavı", "Planlanmadı", "#78909F")])}
      </div>''')}

  {sec("Kart, KPI ve boş durum", "Kart yarıçapı 14px · gölge çok hafif · boş ekranda her zaman bir sonraki adım",
      f'''<div style="display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 20px; align-items: start;">
        {card(f'<div class="stat-lbl">Bekleyen tahsilat</div><div class="kpi" style="margin: 8px 0 4px;">₺186.400</div><div class="t-13" style="color: #D1453B;">₺18.400 gecikmiş</div>', 18)}
        {card(f'''<div style="display: flex; align-items: center; gap: 10px;">{avatar("Ayşe Yılmaz", 36, 13)}
          <div style="display: flex; flex-direction: column;"><span style="font-size: 14px; font-weight: 600;">Ayşe Yılmaz</span>
          <span class="t-13 t-muted">B sınıfı · 8/14 saat</span></div></div>
          <div style="margin-top: 14px;">{bar(72, "bar-grad", 7)}</div>''', 18)}
        {card(empty("Henüz direksiyon dersi planlanmamış.", "Kursiyerin teorik eğitimi tamamlandığında ilk dersi planlayabilirsiniz.", "İlk dersi planla", "wheel"), 18)}
      </div>''')}

  {sec("İkon seti", f"{len(ICONS)} ikon · 24×24 · 1.75 stroke · yuvarlak uç",
      f'<div style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 10px;">{icons_grid}</div>')}

  {sec("Kullanım kuralları", "Virel Drive bir AI panosu gibi görünmez.",
      f'''<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <div style="padding: 20px; border: 1px solid #E7EEF2; border-radius: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;"><span style="color: #12A87C;">{icon("check-circle", 18)}</span><span style="font-family: {QS}; font-size: 16px; font-weight: 600;">Yap</span></div>
          <div style="display: flex; flex-direction: column; gap: 9px; margin-top: 14px;">
            {"".join(f'<span class="t-13 t-sec" style="line-height: 1.55;">· {t}</span>' for t in [
              "Ekranda tek birincil aksiyon bırak", "Bol beyaz alan kullan, kart sayısını azalt",
              "İleri düzey bilgiyi drawer/modal içine taşı", "Sayıları tabular-nums ile hizala",
              "Durumu renk + metin ile birlikte anlat", "Animasyonları 150–220 ms arasında tut"])}</div>
        </div>
        <div style="padding: 20px; border: 1px solid #E7EEF2; border-radius: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;"><span style="color: #D1453B;">{icon("x-circle", 18)}</span><span style="font-family: {QS}; font-size: 16px; font-weight: 600;">Yapma</span></div>
          <div style="display: flex; flex-direction: column; gap: 9px; margin-top: 14px;">
            {"".join(f'<span class="t-13 t-sec" style="line-height: 1.55;">· {t}</span>' for t in [
              "Ekranı gradyan ve neon efektle doldurma", "Her butonu marka rengiyle boyama",
              "Beyaz zeminde mint rengi metin kullanma", "'AI Copilot', '✨ Magic' gibi pazarlama dili koyma",
              "Mevzuata bağlı sayıları arayüze sabitleme", "Gereksiz gölge ve kalın kenarlık ekleme"])}</div>
        </div>
      </div>''')}
</div>'''

open("DesignSystem.dc.html", "w").write(bare(body, 1440, 5040))
print("DesignSystem.dc.html")
