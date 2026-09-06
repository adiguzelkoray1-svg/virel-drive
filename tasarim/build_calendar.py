# -*- coding: utf-8 -*-
"""Virel Drive · Direksiyon planlama takvimi (hafta görünümü)."""
from common import (icon, shell, page_title, card, badge, btn, avatar, seg, QS)

DAYS = ["Pzt 31", "Sal 1", "Çar 2", "Per 3", "Cum 4", "Cmt 5", "Paz 6"]
START, SLOTS, RH = 8, 22, 26   # 08:00 → 19:00, 30 dk satır, 26px

def rowof(t):
    h, m = map(int, t.split(":"))
    return (h - START) * 2 + (1 if m >= 30 else 0) + 1

# (gün 0-6, başlangıç, bitiş, tip, satır1, satır2)
EV = [
    (0, "08:30", "10:00", "drive",  "Ayşe Y.",   "Mehmet · 06 ABC"),
    (0, "10:00", "11:30", "theory", "Trafik ve Çevre", "Derslik 2 · 24 kişi"),
    (0, "13:30", "15:00", "drive",  "Emre A.",   "Mehmet · 06 ABC"),
    (0, "15:00", "16:30", "drive",  "Kerem A.",  "Hakan · 06 MOT"),
    (1, "09:00", "10:30", "drive",  "Burak Ş.",  "Ali · 06 XYZ"),
    (1, "11:00", "12:30", "drive",  "Nihan E.",  "Mehmet · 06 ABC"),
    (1, "14:00", "15:30", "drive",  "Deniz U.",  "Ali · 06 XYZ"),
    (1, "14:00", "15:30", "clash",  "Merve K.",  "Ali · araç çakışması", True),
    (1, "16:00", "17:30", "drive",  "Elif Ş.",   "Hakan · 06 DEF"),
    (2, "08:30", "10:00", "drive",  "Zeynep D.", "Ali · 06 XYZ"),
    (2, "10:00", "12:00", "theory", "İlk Yardım", "Derslik 1 · 31 kişi"),
    (2, "13:00", "14:30", "drive",  "Onur T.",   "Mehmet · 06 ABC"),
    (2, "15:30", "17:00", "drive",  "Selin A.",  "Hakan · 06 DEF"),
    (3, "09:00", "10:30", "drive",  "Ayşe Y.",   "Mehmet · 06 ABC"),
    (3, "11:00", "12:30", "drive",  "Merve K.",  "Ali · 06 XYZ"),
    (3, "14:00", "15:30", "drive",  "Kerem A.",  "Hakan · 06 MOT"),
    (3, "16:00", "17:30", "busy",   "06 ABC 123", "Periyodik bakım"),
    (4, "08:30", "10:00", "drive",  "Emre A.",   "Mehmet · 06 ABC"),
    (4, "10:30", "12:00", "drive",  "Nihan E.",  "Ali · 06 XYZ"),
    (4, "13:00", "16:00", "exam",   "e-Sınav",   "4 kursiyer · MEB salonu"),
    (4, "16:30", "18:00", "drive",  "Deniz U.",  "Hakan · 06 DEF"),
    (5, "09:00", "10:30", "drive",  "Zeynep D.", "Ali · 06 XYZ"),
    (5, "10:30", "12:00", "drive",  "Onur T.",   "Mehmet · 06 ABC"),
    (5, "13:00", "14:30", "drive",  "Elif Ş.",   "Hakan · 06 DEF"),
]

def ev(day, a, b, kind, l1, l2, over=False):
    r1, r2 = rowof(a), rowof(b)
    shift = "margin: 6px 3px 1px 34%; z-index: 2; box-shadow: 0 6px 18px -8px rgba(14,36,54,.45);" if over else "margin: 1px 3px;"

    ic = {"drive": "wheel", "theory": "book", "exam": "exam", "busy": "wrench", "clash": "alert"}[kind]
    return (f'<div class="slot slot-{kind}" style="grid-column: {day + 2}; grid-row: {r1} / {r2}; {shift}">'
            f'<div style="display: flex; align-items: center; gap: 5px; font-weight: 600;">{icon(ic, 12, sw=2)}{l1}</div>'
            f'<div style="opacity: .78; margin-top: 2px;">{l2}</div>'
            f'<div style="opacity: .6; margin-top: 1px;" class="num">{a}–{b}</div></div>')

times = "".join(
    f'<div style="grid-column: 1; grid-row: {i * 2 + 1} / {i * 2 + 3}; padding-right: 10px; text-align: right;" class="t-13 t-muted num">{START + i:02d}:00</div>'
    for i in range(SLOTS // 2))
lines = "".join(
    f'<div style="grid-column: 2 / 9; grid-row: {r}; border-top: 1px solid {"#E7EEF2" if r % 2 else "#F0F4F6"};"></div>'
    for r in range(1, SLOTS + 1))
cols = "".join(f'<div style="grid-column: {d + 2}; grid-row: 1 / {SLOTS + 1}; border-left: 1px solid #E7EEF2;"></div>' for d in range(7))
evs = "".join(ev(*e) for e in EV)

headrow = '<div style="display: grid; grid-template-columns: 62px repeat(7, 1fr); padding-bottom: 10px;">' + '<div></div>' + "".join(
    f'''<div style="text-align: center; display: flex; flex-direction: column; gap: 1px; padding: 4px 0; border-radius: 8px; {"background: #E8F1FB;" if i == 4 else ""}">
      <span class="t-13 t-muted">{d.split()[0]}</span>
      <span style="font-family: {QS}; font-size: 15px; font-weight: 600; color: {"#00559F" if i == 4 else "#0E2436"};">{d.split()[1]}</span>
    </div>''' for i, d in enumerate(DAYS)) + '</div>'

grid = f'''<div style="display: grid; grid-template-columns: 62px repeat(7, 1fr); grid-template-rows: repeat({SLOTS}, {RH}px); position: relative;">
  {lines}{cols}{times}{evs}
</div>'''

legend = "".join(f'<div style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 3px; background: {c};"></span><span class="t-13 t-sec">{l}</span></div>'
                 for c, l in [("#0067C4", "Direksiyon"), ("#12A87C", "Teorik"), ("#D9713C", "Sınav"), ("#CFDCE4", "Araç meşgul"), ("#D1453B", "Çakışma")])

toolbar = f'''
<div style="display: flex; align-items: center; gap: 10px;">
  <div style="display: flex; gap: 6px;"><div class="ibtn">{icon("chev-left", 16)}</div><div class="ibtn">{icon("chev-right", 16)}</div></div>
  <span class="h-card" style="margin-left: 4px;">31 Ağustos – 6 Eylül 2026</span>
  <div class="btn btn-secondary btn-xs">Bugün</div>
  <div style="margin-left: 16px;">{seg(["Gün", "Hafta", "Ay"], "Hafta")}</div>
  <div style="margin-left: 8px;">{seg(["Tümü", "Eğitmen", "Araç", "Kursiyer"], "Tümü")}</div>
  <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
    <div class="btn btn-secondary btn-sm">{icon("filter", 15)}Eğitmen: Tümü</div>
    <div class="btn btn-secondary btn-sm">{icon("car", 15)}Araç: Tümü</div>
    <div class="btn btn-primary btn-sm">{icon("plus", 15)}Yeni ders</div>
  </div>
</div>'''

# ---- sağ panel: uygunluk & öneri ----
def slot_sug(t, teacher, car, why):
    return f'''<div style="display: flex; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid #E7EEF2;">
      <span style="font-family: {QS}; font-size: 14px; font-weight: 600; width: 52px;" class="num">{t}</span>
      <div style="display: flex; flex-direction: column; gap: 1px; min-width: 0;">
        <span class="t-13">{teacher} · <span class="num">{car}</span></span>
        <span class="t-13 t-muted">{why}</span>
      </div>
      <div class="btn btn-secondary btn-xs" style="margin-left: auto;">Planla</div></div>'''

side = f'''
{card(f"""<div style="display: flex; align-items: center; gap: 8px;">
    <span style="color: #D1453B;">{icon("alert", 17)}</span><span class="h-card">Çakışma</span>
  </div>
  <div style="margin-top: 12px; padding: 12px; border-radius: 10px; background: #FCECEB;">
    <div style="font-size: 13.5px; font-weight: 600; line-height: 1.45;">Salı 14:00 · 06 XYZ 456 plakalı araç bu saatte kullanımda.</div>
    <div class="t-13" style="color: #42586A; margin-top: 6px; line-height: 1.5;">Deniz U. ve Merve K. aynı araca atanmış. Merve K. için 16:00'da 06 DEF 789 uygun.</div>
    <div style="display: flex; gap: 8px; margin-top: 12px;">
      {btn("Aracı değiştir", "primary", None, "btn-xs")}{btn("Saati kaydır", "secondary", None, "btn-xs")}
    </div>
  </div>""", 20)}

{card(f"""<div style="display: flex; align-items: center; gap: 10px;">
    <span class="h-card">En uygun saatler</span><span class="t-13 t-muted">bu hafta</span></div>
  <div class="t-13 t-sec" style="margin: 8px 0 2px; line-height: 1.5;">Eğitmen, araç ve kursiyer uygunluğu birlikte kontrol edildi.</div>
  {slot_sug("Çar 11:00", "Ali Kaya", "06 XYZ 456", "Kursiyer ders arası 2 gün")}
  {slot_sug("Per 13:00", "Mehmet Öz", "06 ABC 123", "Eğitmenin boş bloğu")}
  {slot_sug("Cum 10:30", "Hakan Tuna", "06 DEF 789", "Araç doluluğu düşük")}
  {slot_sug("Cmt 15:00", "Mehmet Öz", "06 ABC 123", "Hafta sonu talebi yüksek")}""", 20)}

{card(f"""<div class="h-card" style="margin-bottom: 12px;">Bu hafta</div>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px 10px;">
    <div><div class="stat-lbl">Direksiyon</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700;" class="num">96 saat</div></div>
    <div><div class="stat-lbl">Teorik</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700;" class="num">14 ders</div></div>
    <div><div class="stat-lbl">Doluluk</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700;" class="num">%75</div></div>
    <div><div class="stat-lbl">Boş slot</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700; color: #D9713C;" class="num">18</div></div>
  </div>""", 20)}
'''

body = f'''
{toolbar}
<div style="display: grid; grid-template-columns: 1fr 306px; gap: 16px; align-items: start;">
  {card(f'{headrow}{grid}<div style="display: flex; gap: 18px; padding-top: 14px; margin-top: 12px; border-top: 1px solid #E7EEF2;">{legend}</div>', 20)}
  <div style="display: flex; flex-direction: column; gap: 16px;">{side}</div>
</div>'''

html = shell(body, "Takvim", page_title("Takvim", "Direksiyon ve teorik ders planlama"), 1080)
open("Calendar.dc.html", "w").write(html)
print("Calendar.dc.html")
