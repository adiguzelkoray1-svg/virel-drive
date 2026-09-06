# -*- coding: utf-8 -*-
"""Virel Drive · Kursiyer detayı (Ayşe Yılmaz)."""
from common import (icon, shell, page_title, card, badge, btn, avatar, bar, tabs, QS)

# ---------------- Süreç zaman çizelgesi ----------------
TIMELINE = [
    ("done", "Ön kayıt",                "18 Mayıs 2026", "Web formu · Instagram"),
    ("done", "Kayıt tamamlandı",        "12 Haziran 2026", "B sınıfı · 32.000 ₺ ödeme planı"),
    ("done", "Evraklar tamamlandı",     "16 Haziran 2026", "7 belge onaylandı"),
    ("done", "Teorik eğitim başladı",   "24 Haziran 2026", "Dönem 2026/3"),
    ("done", "Teorik eğitim tamamlandı","29 Temmuz 2026", "%96 devam"),
    ("done", "e-Sınav",                 "8 Ağustos 2026", "84 puan · başarılı"),
    ("done", "Direksiyon eğitimi başladı", "15 Ağustos 2026", "Eğitmen: Mehmet Öz"),
    ("now",  "Direksiyon eğitimi devam ediyor", "8 / 14 saat", "Kalan 6 saat · tahmini bitiş 24 Eylül"),
    ("todo", "Direksiyon sınavı",       "Planlanmadı", "Sınav dönemi: 6–10 Ekim"),
    ("todo", "Sertifika / mezuniyet",   "—", ""),
]

def tl(state, title, date, sub):
    ic = {"done": "check", "now": "clock", "todo": "chev-right"}[state]
    cls = {"done": "tick-done", "now": "tick-now", "todo": "tick-todo"}[state]
    line = '<div style="width: 1px; flex-grow: 1; background: #E7EEF2; margin: 3px 0;"></div>'
    weight = 600 if state != "todo" else 500
    col = "#78909F" if state == "todo" else "#0E2436"
    s = f'<span class="t-13 t-muted">{sub}</span>' if sub else ""
    return f'''<div style="display: flex; gap: 12px; min-height: 52px;">
      <div style="display: flex; flex-direction: column; align-items: center;">
        <span class="tick {cls}">{icon(ic, 13, sw=2.4)}</span>{line}
      </div>
      <div style="display: flex; flex-direction: column; gap: 2px; padding-bottom: 14px;">
        <span style="font-size: 13.5px; font-weight: {weight}; color: {col};">{title}</span>
        <span class="t-13 t-sec num">{date}</span>{s}
      </div></div>'''

timeline = "".join(tl(*t) for t in TIMELINE)

# ---------------- Direksiyon gelişim alanları ----------------
SKILLS = [
    ("Kalkış ve durma", 5), ("Debriyaj kontrolü", 4), ("Vites geçişleri", 4), ("Ayna kullanımı", 4),
    ("Şerit takibi", 4), ("Kavşak ve dönüş", 3), ("Park (paralel)", 2), ("Geri manevra", 3),
    ("Yokuşta kalkış", 2), ("Trafikte sürüş", 3), ("Sürüş güvenliği", 4),
]

def skill(name, score):
    dots = "".join(f'<span style="width: 9px; height: 9px; border-radius: 999px; background: {"#0067C4" if i < score else "#E7EEF2"};"></span>' for i in range(5))
    tone = "#D9713C" if score <= 2 else ("#42586A" if score == 3 else "#12A87C")
    lbl = {1: "Zayıf", 2: "Geliştirilmeli", 3: "Orta", 4: "İyi", 5: "Çok iyi"}[score]
    return f'''<div style="display: flex; align-items: center; gap: 12px; padding: 9px 0; border-top: 1px solid #E7EEF2;">
      <span class="t-13" style="flex-grow: 1;">{name}</span>
      <span class="t-13" style="color: {tone}; width: 100px; text-align: right;">{lbl}</span>
      <span style="display: flex; gap: 4px; width: 65px; justify-content: flex-end;">{dots}</span></div>'''

# ---------------- Son dersler ----------------
LESSONS = [
    ("8. ders", "3 Eylül 2026 · 08:30", "Mehmet Öz", "06 ABC 123", "Park ve geri manevra çalışıldı. Yokuşta kalkışta debriyaj hâkimiyeti geliştirilmeli."),
    ("7. ders", "31 Ağustos 2026 · 10:00", "Mehmet Öz", "06 ABC 123", "Şehir içi trafiğe ilk çıkış. Şerit takibi iyi, kavşaklarda tereddüt var."),
    ("6. ders", "28 Ağustos 2026 · 08:30", "Ali Kaya", "06 XYZ 456", "Vites geçişleri akıcı. Ayna kullanımı hatırlatıldı."),
]

def lesson(no, when, teacher, plate, note):
    return f'''<div style="padding: 13px 0; border-top: 1px solid #E7EEF2; display: flex; gap: 14px;">
      <div style="width: 132px; flex-shrink: 0; display: flex; flex-direction: column; gap: 2px;">
        <span style="font-size: 13.5px; font-weight: 600;">{no}</span>
        <span class="t-13 t-muted num">{when}</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="t-13 t-sec">{teacher}</span><span class="t-13 t-muted">·</span><span class="t-13 t-sec num">{plate}</span>
        </div>
        <span class="t-13" style="color: #42586A; line-height: 1.5;">{note}</span>
      </div></div>'''

# ---------------- Sağ sütun ----------------
def line(label, value, tone="#0E2436", strong=False):
    fw = 600 if strong else 500
    return f'''<div style="display: flex; align-items: center; gap: 10px; padding: 9px 0; border-top: 1px solid #E7EEF2;">
      <span class="t-13 t-sec">{label}</span>
      <span style="margin-left: auto; font-size: 13.5px; font-weight: {fw}; color: {tone};" class="num">{value}</span></div>'''

DOCS = [("Nüfus cüzdanı fotokopisi", "ok"), ("Diploma / öğrenim belgesi", "ok"), ("Sağlık raporu", "ok"),
        ("Adli sicil kaydı", "ok"), ("Biyometrik fotoğraf (2)", "ok"), ("Sürücü olur belgesi", "ok"), ("Kan grubu belgesi", "ok")]

def doc(name, st):
    m = {"ok": ("check-circle", "#12A87C", "Tamam"), "wait": ("clock", "#D9713C", "Bekliyor"), "missing": ("alert", "#D1453B", "Eksik")}[st]
    return f'''<div style="display: flex; align-items: center; gap: 9px; padding: 8px 0; border-top: 1px solid #E7EEF2;">
      <span style="color: {m[1]};">{icon(m[0], 15)}</span><span class="t-13">{name}</span>
      <span class="t-13 t-muted" style="margin-left: auto;">{m[2]}</span></div>'''

# ---------------- Üst başlık ----------------
head = card(f'''
<div style="display: flex; align-items: flex-start; gap: 18px;">
  {avatar("Ayşe Yılmaz", 62, 22, "b")}
  <div style="display: flex; flex-direction: column; gap: 7px;">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span class="h-section">Ayşe Yılmaz</span>{badge("B sınıfı", "brand")}{badge("Aktif", "success", dot=True)}
    </div>
    <div style="display: flex; gap: 16px; align-items: center;">
      <span class="t-13 t-sec num">0532 •• 41</span>
      <span class="t-13 t-muted">Kayıt: 12.06.2026</span>
      <span class="t-13 t-muted">Dosya no: 2026-0418</span>
      <span class="t-13 t-muted">Eğitmen: Mehmet Öz</span>
    </div>
  </div>
  <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
    {btn("Mesaj", "secondary", "message", "btn-sm")}
    {btn("Tahsilat", "secondary", "wallet", "btn-sm")}
    {btn("Ders planla", "primary", "plus", "btn-sm")}
    <div class="ibtn">{icon("more", 18)}</div>
  </div>
</div>
<div style="margin-top: 20px; padding-top: 18px; border-top: 1px solid #E7EEF2; display: flex; align-items: center; gap: 22px;">
  <div style="flex-grow: 1;">
    <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 9px;">
      <span style="font-size: 13.5px; font-weight: 600;">Ehliyet sürecinde %72 tamamlandı</span>
      <span class="t-13 t-muted">Sonraki adım: direksiyon eğitiminin kalan 6 saati</span>
    </div>
    {bar(72, "bar-grad", 9)}
  </div>
  <div style="display: flex; gap: 26px; padding-left: 22px; border-left: 1px solid #E7EEF2;">
    <div style="display: flex; flex-direction: column; gap: 2px;"><span class="stat-lbl">Teorik</span><span style="font-family: {QS}; font-size: 17px; font-weight: 600;" class="num">%100</span></div>
    <div style="display: flex; flex-direction: column; gap: 2px;"><span class="stat-lbl">e-Sınav</span><span style="font-family: {QS}; font-size: 17px; font-weight: 600;" class="num">84</span></div>
    <div style="display: flex; flex-direction: column; gap: 2px;"><span class="stat-lbl">Direksiyon</span><span style="font-family: {QS}; font-size: 17px; font-weight: 600;" class="num">8/14 s</span></div>
    <div style="display: flex; flex-direction: column; gap: 2px;"><span class="stat-lbl">Kalan borç</span><span style="font-family: {QS}; font-size: 17px; font-weight: 600; color: #0067C4;" class="num">₺5.500</span></div>
  </div>
</div>''', 22)

TABS = ["Genel", "Evraklar", "Teorik Eğitim", "e-Sınav", "Direksiyon", "Direksiyon Sınavları", "Ödemeler", "Mesajlar", "Notlar"]

body = f'''
{head}
{tabs(TABS, "Genel")}
<div style="display: grid; grid-template-columns: 342px 1fr 292px; gap: 16px; align-items: start;">

  {card(f'<div class="h-card" style="margin-bottom: 14px;">Süreç</div>{timeline}', 20)}

  <div style="display: flex; flex-direction: column; gap: 16px;">
    {card(f"""<div style="display: flex; align-items: center; gap: 10px;">
        <span class="h-card">Direksiyon gelişimi</span>
        <span class="t-13 t-muted">Eğitmen değerlendirmesi</span>
        <span class="t-13" style="margin-left: auto; font-weight: 600; color: #42586A;">Ortalama 3,5 / 5</span>
      </div>
      <div style="margin-top: 10px;">{"".join(skill(*s) for s in SKILLS)}</div>""", 20)}

    {card(f"""<div style="display: flex; align-items: center; gap: 10px;">
        <span class="h-card">Son dersler</span>
        <a class="t-13" style="margin-left: auto; font-weight: 600;">8 dersin tümü →</a>
      </div>
      <div style="margin-top: 8px;">{"".join(lesson(*l) for l in LESSONS)}</div>""", 20)}
  </div>

  <div style="display: flex; flex-direction: column; gap: 16px;">
    {card(f"""<div style="display: flex; align-items: center; gap: 10px;">
        <span class="h-card">Yaklaşan ders</span>{badge("Yarın", "brand")}</div>
      <div style="margin-top: 14px; padding: 14px; border-radius: 10px; background: #E8F1FB; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: baseline; gap: 8px;">
          <span style="font-family: {QS}; font-size: 20px; font-weight: 700;" class="num">14:00</span>
          <span class="t-13 t-sec">–15:30 · 9. ders</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">{icon("badge-id", 15, "#00559F")}<span class="t-13">Mehmet Öz</span></div>
        <div style="display: flex; align-items: center; gap: 8px;">{icon("car", 15, "#00559F")}<span class="t-13 num">06 ABC 123</span></div>
      </div>""", 20)}

    {card(f"""<div class="h-card">Ödeme planı</div>
      {line("Toplam ücret", "₺32.000")}
      {line("Peşinat", "₺10.000")}
      {line("Ödenen", "₺26.500", "#12A87C")}
      {line("Kalan", "₺5.500", "#0067C4", True)}
      {line("Sonraki taksit", "20.09.2026")}
      <div style="margin-top: 14px;">{bar(83, "", 6)}</div>
      <div style="display: flex; justify-content: space-between; margin-top: 6px;">
        <span class="t-13 t-muted">4 taksitin 3'ü ödendi</span><span class="t-13 t-sec" style="font-weight: 600;">%83</span>
      </div>""", 20)}

    {card(f"""<div style="display: flex; align-items: center; gap: 10px;">
        <span class="h-card">Evraklar</span>{badge("7/7 tamam", "success", dot=True)}</div>
      <div style="margin-top: 8px;">{"".join(doc(*d) for d in DOCS)}</div>""", 20)}
  </div>
</div>'''

html = shell(body, "Kursiyerler", page_title("Kursiyer", "Kursiyerler / Ayşe Yılmaz"), 1300)
open("StudentProfile.dc.html", "w").write(html)
print("StudentProfile.dc.html")
