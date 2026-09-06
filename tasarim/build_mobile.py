# -*- coding: utf-8 -*-
"""Virel Drive · Mobil ekranlar (eğitmen ve kursiyer uygulaması)."""
from common import icon, bare, badge, btn, avatar, bar, logo, GRAD, QS

W, H = 390, 844

def phone(inner, bg="#F4F7F8"):
    return f'<div style="width: {W}px; height: {H}px; background: {bg}; display: flex; flex-direction: column; overflow: hidden;">{inner}</div>'

def statusbar(dark=False):
    c = "#FFFFFF" if dark else "#0E2436"
    return f'''<div style="height: 52px; display: flex; align-items: flex-end; justify-content: space-between; padding: 0 22px 6px; flex-shrink: 0;">
      <span style="font-size: 13px; font-weight: 700; color: {c};" class="num">09:41</span>
      <div style="display: flex; gap: 5px; align-items: center; opacity: .85;">
        <span style="width: 16px; height: 9px; border: 1.4px solid {c}; border-radius: 3px; display: block;"></span>
      </div></div>'''

def tabbar(items, active):
    tabs = "".join(f'''<div style="display: flex; flex-direction: column; align-items: center; gap: 4px; flex-grow: 1; padding: 8px 0;">
      {icon(i, 21, "#0067C4" if l == active else "#78909F")}
      <span style="font-size: 11px; font-weight: {600 if l == active else 500}; color: {"#0067C4" if l == active else "#78909F"};">{l}</span></div>''' for i, l in items)
    return f'''<div style="border-top: 1px solid #E7EEF2; background: #FFFFFF; display: flex; padding: 0 6px 18px; flex-shrink: 0;">{tabs}</div>'''

# ============ 1 · Eğitmen · Bugün ============
LESSONS = [
    ("09:00", "10:30", "Ayşe Yılmaz", "B", "06 ABC 123", "done", "Tamamlandı"),
    ("11:00", "12:30", "Emre Aydın", "B", "06 ABC 123", "now", "Sıradaki"),
    ("14:00", "15:30", "Deniz Ulu", "B", "06 ABC 123", "next", ""),
    ("16:00", "17:30", "Merve Koç", "B", "06 ABC 123", "next", ""),
]

def ilesson(a, b, name, cls, plate, st, lbl):
    if st == "now":
        return f'''<div style="background: #FFFFFF; border: 1.5px solid #0067C4; border-radius: 14px; padding: 16px; box-shadow: 0 12px 30px -18px rgba(0,103,196,.5);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-family: {QS}; font-size: 22px; font-weight: 700;" class="num">{a}</span>
            <span class="t-13 t-sec num">–{b}</span>
            <span style="margin-left: auto;">{badge("Sıradaki", "brand", dot=True)}</span></div>
          <div style="display: flex; align-items: center; gap: 11px; margin-top: 14px;">
            {avatar(name, 40, 15)}
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 15px; font-weight: 600;">{name}</span>
              <span class="t-13 t-muted">{cls} sınıfı · 6/14 saat · <span class="num">{plate}</span></span></div></div>
          <div style="display: flex; gap: 8px; margin-top: 14px;">
            <div class="btn btn-primary" style="flex-grow: 1; height: 44px;">{icon("check", 17)}Dersi tamamla</div>
            <div class="ibtn" style="width: 44px; height: 44px;">{icon("phone", 18)}</div></div></div>'''
    done = st == "done"
    return f'''<div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 14px; padding: 14px; display: flex; align-items: center; gap: 12px; {"opacity: .62;" if done else ""}">
      <div style="display: flex; flex-direction: column; width: 54px; flex-shrink: 0;">
        <span style="font-family: {QS}; font-size: 15px; font-weight: 600;" class="num">{a}</span>
        <span class="t-13 t-muted num">{b}</span></div>
      {avatar(name, 34, 13)}
      <div style="display: flex; flex-direction: column; gap: 1px; min-width: 0;">
        <span style="font-size: 14px; font-weight: 600;">{name}</span>
        <span class="t-13 t-muted num">{cls} · {plate}</span></div>
      <div style="margin-left: auto;">{badge(lbl, "success", dot=True) if done else icon("chev-right", 17, "#78909F")}</div></div>'''

instructor = phone(f'''
{statusbar()}
<div style="padding: 8px 20px 16px; display: flex; align-items: center; gap: 10px;">
  {avatar("Mehmet Öz", 38, 14)}
  <div style="display: flex; flex-direction: column;">
    <span class="t-13 t-muted">Günaydın</span>
    <span style="font-family: {QS}; font-size: 18px; font-weight: 700;">Mehmet Öz</span></div>
  <div class="ibtn" style="margin-left: auto;">{icon("bell", 18)}</div>
</div>
<div style="padding: 0 20px 14px; display: flex; gap: 10px;">
  <div style="flex: 1; background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 12px; padding: 12px;">
    <div class="stat-lbl">Bugün</div><div style="font-family: {QS}; font-size: 22px; font-weight: 700;" class="num">4 ders</div></div>
  <div style="flex: 1; background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 12px; padding: 12px;">
    <div class="stat-lbl">Bu hafta</div><div style="font-family: {QS}; font-size: 22px; font-weight: 700;" class="num">34 saat</div></div>
</div>
<div style="padding: 6px 20px 10px; display: flex; align-items: center; gap: 8px;">
  <span style="font-family: {QS}; font-size: 16px; font-weight: 600;">Bugün</span>
  <span class="t-13 t-muted">4 Eylül, Cuma</span>
  <span class="t-13" style="margin-left: auto; font-weight: 600; color: #00559F;">Takvim</span>
</div>
<div style="flex-grow: 1; padding: 0 20px; display: flex; flex-direction: column; gap: 10px; overflow: hidden;">
  {"".join(ilesson(*l) for l in LESSONS)}
  <div style="display: flex; align-items: center; gap: 9px; padding: 12px 14px; border-radius: 12px; background: #E8F1FB;">
    {icon("info", 16, "#00559F")}<span class="t-13" style="color: #00559F; line-height: 1.45;">06 ABC 123 bakımına 420 km kaldı.</span></div>
</div>
{tabbar([("home", "Bugün"), ("calendar", "Takvim"), ("users", "Kursiyerler"), ("user", "Profil")], "Bugün")}''')

# ============ 2 · Eğitmen · Ders değerlendirme ============
SKILLS = [("Kalkış ve durma", 5), ("Debriyaj kontrolü", 4), ("Vites geçişleri", 4), ("Park (paralel)", 2), ("Geri manevra", 3), ("Yokuşta kalkış", 2)]

def rate(name, score):
    dots = "".join(f'<span style="width: 22px; height: 22px; border-radius: 999px; border: 1.4px solid {"#0067C4" if i < score else "#E7EEF2"}; background: {"#0067C4" if i < score else "#FFFFFF"}; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: {"#FFFFFF" if i < score else "#78909F"};">{i + 1}</span>' for i in range(5))
    return f'''<div style="padding: 12px 0; border-top: 1px solid #E7EEF2;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="t-13" style="font-weight: 600;">{name}</span>
        <span style="margin-left: auto; display: flex; gap: 6px;">{dots}</span></div></div>'''

review = phone(f'''
{statusbar()}
<div style="padding: 6px 20px 14px; display: flex; align-items: center; gap: 10px;">
  <div class="ibtn ibtn-ghost">{icon("chev-left", 19)}</div>
  <span style="font-family: {QS}; font-size: 17px; font-weight: 700;">Ders değerlendirmesi</span>
</div>
<div style="flex-grow: 1; padding: 0 20px; display: flex; flex-direction: column; gap: 12px; overflow: hidden;">
  <div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 14px; padding: 14px; display: flex; align-items: center; gap: 11px;">
    {avatar("Emre Aydın", 40, 15)}
    <div style="display: flex; flex-direction: column; gap: 2px;">
      <span style="font-size: 15px; font-weight: 600;">Emre Aydın</span>
      <span class="t-13 t-muted num">7. ders · 11:00–12:30 · 06 ABC 123</span></div>
  </div>

  <div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 14px; padding: 14px;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 14px; font-weight: 600;">Ders süresi</span>
      <span style="margin-left: auto;">{badge("90 dk · tamamlandı", "success", dot=True)}</span></div>
    <div style="margin-top: 12px; display: flex; gap: 8px;">
      <div class="chip chip-on">Şehir içi</div><div class="chip">Park</div><div class="chip">Yokuş</div><div class="chip">Otoyol</div></div>
  </div>

  <div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 14px; padding: 14px 14px 4px;">
    <div style="font-size: 14px; font-weight: 600; padding-bottom: 4px;">Gelişim alanları</div>
    {"".join(rate(*s) for s in SKILLS)}
  </div>

  <div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 14px; padding: 14px;">
    <div style="font-size: 14px; font-weight: 600;">Not</div>
    <div class="t-13 t-sec" style="margin-top: 8px; line-height: 1.5; padding: 11px; background: #F3F7F9; border-radius: 10px;">Park manevrasında referans noktaları tekrar çalışılmalı. Yokuşta kalkış için gelecek ders 20 dk ayrılacak.</div>
  </div>
</div>
<div style="padding: 14px 20px 26px; display: flex; gap: 10px; background: #FFFFFF; border-top: 1px solid #E7EEF2;">
  <div class="btn btn-secondary" style="height: 46px; width: 108px;">Taslak</div>
  <div class="btn btn-primary" style="height: 46px; flex-grow: 1;">{icon("check", 17)}Dersi kapat</div>
</div>''')

# ============ 3 · Kursiyer · Ana sayfa ============
student = phone(f'''
<div style="background: {GRAD}; padding: 0 0 22px; flex-shrink: 0;">
  {statusbar(True)}
  <div style="padding: 6px 22px 0; display: flex; align-items: center; gap: 10px;">
    <div style="display: flex; flex-direction: column;">
      <span style="font-family: {QS}; font-size: 20px; font-weight: 700; color: #FFFFFF;">Merhaba Ayşe 👋</span>
      <span style="font-size: 13px; color: rgba(255,255,255,0.82); margin-top: 2px;">Yıldız Sürücü Kursu · B sınıfı</span></div>
    <div style="margin-left: auto; width: 36px; height: 36px; border-radius: 999px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center; color: #FFFFFF;">{icon("bell", 18)}</div>
  </div>
  <div style="margin: 20px 22px 0; background: rgba(255,255,255,0.16); border-radius: 16px; padding: 16px;">
    <div style="display: flex; align-items: baseline; gap: 8px;">
      <span style="font-size: 13px; color: rgba(255,255,255,0.86);">Ehliyet sürecin</span>
      <span style="font-family: {QS}; font-size: 26px; font-weight: 700; color: #FFFFFF; margin-left: auto;" class="num">%72</span></div>
    <div style="height: 8px; border-radius: 999px; background: rgba(255,255,255,0.25); margin-top: 10px; overflow: hidden;">
      <div style="width: 72%; height: 100%; background: #FFFFFF; border-radius: 999px;"></div></div>
    <div style="font-size: 13px; color: rgba(255,255,255,0.9); margin-top: 10px;">Sonraki adım: <b>direksiyon eğitimi</b> · 6 saat kaldı</div>
  </div>
</div>

<div style="flex-grow: 1; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; overflow: hidden;">
  <div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 14px; padding: 16px;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 14px; font-weight: 600;">Yaklaşan ders</span>
      <span style="margin-left: auto;">{badge("Yarın", "brand")}</span></div>
    <div style="display: flex; align-items: center; gap: 14px; margin-top: 14px;">
      <div style="display: flex; flex-direction: column;">
        <span style="font-family: {QS}; font-size: 26px; font-weight: 700;" class="num">14:00</span>
        <span class="t-13 t-muted">–15:30</span></div>
      <div style="width: 1px; height: 40px; background: #E7EEF2;"></div>
      <div style="display: flex; flex-direction: column; gap: 5px;">
        <span style="display: flex; align-items: center; gap: 7px;" class="t-13">{icon("badge-id", 15, "#78909F")}Mehmet Öz</span>
        <span style="display: flex; align-items: center; gap: 7px;" class="t-13 num">{icon("car", 15, "#78909F")}06 ABC 123</span></div>
    </div>
    <div style="display: flex; gap: 8px; margin-top: 14px;">
      <div class="btn btn-secondary btn-sm" style="flex-grow: 1;">Erteleme talebi</div>
      <div class="btn btn-secondary btn-sm" style="flex-grow: 1;">{icon("message", 15)}Kursa yaz</div></div>
  </div>

  <div style="display: flex; gap: 10px;">
    <div style="flex: 1; background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 14px; padding: 14px;">
      <div class="stat-lbl">Kalan ders</div>
      <div style="font-family: {QS}; font-size: 22px; font-weight: 700;" class="num">6 saat</div>
      <div style="margin-top: 8px;">{bar(57, "", 5)}</div></div>
    <div style="flex: 1; background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 14px; padding: 14px;">
      <div class="stat-lbl">Kalan borç</div>
      <div style="font-family: {QS}; font-size: 22px; font-weight: 700; color: #0067C4;" class="num">₺5.500</div>
      <div class="t-13 t-muted" style="margin-top: 6px;">Vade 20 Eylül</div></div>
  </div>

  <div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 14px; padding: 14px;">
    <div style="display: flex; align-items: center; gap: 9px;">
      <span style="width: 30px; height: 30px; border-radius: 9px; background: #E6F7F1; color: #12A87C; display: flex; align-items: center; justify-content: center;">{icon("exam", 16)}</span>
      <div style="display: flex; flex-direction: column;">
        <span class="t-13" style="font-weight: 600;">e-Sınav sonucun: 84 puan</span>
        <span class="t-13 t-muted">8 Ağustos 2026 · başarılı</span></div>
      {icon("chev-right", 17, "#78909F")}</div>
  </div>
</div>
{tabbar([("home", "Ana sayfa"), ("wheel", "Derslerim"), ("trend", "İlerlemem"), ("wallet", "Ödemeler"), ("user", "Profil")], "Ana sayfa")}''', "#FFFFFF")

# ============ 4 · Kursiyer · İlerlemem ============
STEPS = [("Kayıt ve evraklar", "Tamamlandı", "done", 100), ("Teorik eğitim", "Tamamlandı · %96 devam", "done", 100),
         ("e-Sınav", "84 puan · başarılı", "done", 100), ("Direksiyon eğitimi", "8 / 14 saat", "now", 57),
         ("Direksiyon sınavı", "Planlanmadı", "todo", 0), ("Sertifika", "Bekliyor", "todo", 0)]

def step(name, sub, st, pct):
    col = {"done": ("#E6F7F1", "#12A87C", "check"), "now": ("#E8F1FB", "#0067C4", "clock"), "todo": ("#F3F7F9", "#78909F", "chev-right")}[st]
    p = f'<div style="margin-top: 10px;">{bar(pct, "", 5)}</div>' if st == "now" else ""
    return f'''<div style="background: #FFFFFF; border: 1px solid {"#0067C4" if st == "now" else "#E7EEF2"}; border-radius: 14px; padding: 14px;">
      <div style="display: flex; align-items: center; gap: 11px;">
        <span style="width: 32px; height: 32px; border-radius: 999px; background: {col[0]}; color: {col[1]}; display: flex; align-items: center; justify-content: center;">{icon(col[2], 16, sw=2.3)}</span>
        <div style="display: flex; flex-direction: column; gap: 1px;">
          <span style="font-size: 14px; font-weight: 600; color: {"#78909F" if st == "todo" else "#0E2436"};">{name}</span>
          <span class="t-13 t-muted">{sub}</span></div>
        {f'<span style="margin-left: auto;">{badge("Şu an", "brand", dot=True)}</span>' if st == "now" else ""}
      </div>{p}</div>'''

progress = phone(f'''
{statusbar()}
<div style="padding: 6px 20px 16px;">
  <span style="font-family: {QS}; font-size: 22px; font-weight: 700;">İlerlemem</span>
  <div class="t-13 t-sec" style="margin-top: 4px;">Sürecini kimseye sormadan gör.</div>
</div>
<div style="flex-grow: 1; padding: 0 20px; display: flex; flex-direction: column; gap: 10px; overflow: hidden;">
  <div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 14px; padding: 16px; margin-bottom: 2px;">
    <div style="display: flex; align-items: baseline; gap: 8px;">
      <span style="font-size: 14px; font-weight: 600;">Genel ilerleme</span>
      <span style="font-family: {QS}; font-size: 24px; font-weight: 700; margin-left: auto;" class="num">%72</span></div>
    <div style="margin-top: 10px;">{bar(72, "bar-grad", 8)}</div>
    <div class="t-13 t-muted" style="margin-top: 9px;">Tahmini bitiş: 12 Ekim 2026</div>
  </div>
  {"".join(step(*s) for s in STEPS)}
</div>
{tabbar([("home", "Ana sayfa"), ("wheel", "Derslerim"), ("trend", "İlerlemem"), ("wallet", "Ödemeler"), ("user", "Profil")], "İlerlemem")}''')

for name, html in [("InstructorToday", instructor), ("InstructorReview", review),
                   ("StudentHome", student), ("StudentProgress", progress)]:
    open(f"{name}.dc.html", "w").write(bare(html, W, H))
    print(f"{name}.dc.html")
