# -*- coding: utf-8 -*-
"""Virel Drive · Araçlar ve araç maliyetleri."""
from common import icon, shell, page_title, card, badge, btn, bar, seg, QS

CARS = [
    ("06 ABC 123", "Renault Clio", 2023, "B", 128_450, "Eğitim aracı", "Mehmet Öz", 62, "12.03.2027", "Bakıma 420 km", "warning", "Aktif", "success"),
    ("06 XYZ 456", "Fiat Egea",    2022, "B", 164_900, "Eğitim aracı", "Ali Kaya", 78, "04.11.2026", "8.400 km sonra", "neutral", "Aktif", "success"),
    ("06 DEF 789", "Renault Clio", 2024, "B",  74_100, "Sınav aracı",  "Hakan Tuna", 55, "22.06.2027", "11.200 km sonra", "neutral", "Aktif", "success"),
    ("06 MOT 034", "Honda CB125",  2024, "A2",  9_820, "Eğitim aracı", "Hakan Tuna", 30, "18.09.2026", "Muayene 14 gün", "warning", "Aktif", "success"),
    ("06 KAM 210", "Ford Cargo",   2019, "C",  412_600, "Eğitim aracı", "Serkan Yıldız", 41, "30.01.2027", "6.900 km sonra", "neutral", "Aktif", "success"),
    ("06 TRV 077", "Fiat Egea",    2021, "B",  208_300, "Eğitim aracı", "—", 0, "09.05.2027", "Şanzıman bakımı", "danger", "Bakımda", "warning"),
]

def car(plate, model, year, cls, km, kind, driver, use, insp, maint, mtone, st, stone):
    kmt = f"{km:,}".replace(",", ".")
    mcol = {"warning": "#D9713C", "danger": "#D1453B", "neutral": "#78909F"}[mtone]
    return card(f'''
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="width: 40px; height: 40px; border-radius: 10px; background: #E8F1FB; color: #0067C4; display: flex; align-items: center; justify-content: center;">{icon("car", 21)}</div>
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span style="font-family: {QS}; font-size: 17px; font-weight: 700; letter-spacing: -0.01em;" class="num">{plate}</span>
        <span class="t-13 t-sec">{model} · {year}</span>
      </div>
      <div style="margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
        {badge(st, stone, dot=True)}{badge(cls + " sınıfı", "brand")}
      </div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px 10px; margin-top: 16px;">
      <div><div class="stat-lbl">Kilometre</div><div class="t-13 num" style="font-weight: 600; margin-top: 2px;">{kmt} km</div></div>
      <div><div class="stat-lbl">Kullanım</div><div class="t-13 num" style="font-weight: 600; margin-top: 2px;">{kind}</div></div>
      <div><div class="stat-lbl">Eğitmen</div><div class="t-13" style="font-weight: 600; margin-top: 2px;">{driver}</div></div>
      <div><div class="stat-lbl">Muayene</div><div class="t-13 num" style="font-weight: 600; margin-top: 2px;">{insp}</div></div>
    </div>
    <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #E7EEF2;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span class="t-13 t-sec">Bu hafta doluluk</span>
        <span class="t-13 num" style="margin-left: auto; font-weight: 600;">%{use}</span>
      </div>
      {bar(use, "", 6)}
      <div style="display: flex; align-items: center; gap: 7px; margin-top: 12px; color: {mcol};">
        {icon("wrench", 15)}<span class="t-13" style="color: {mcol}; font-weight: 600;">{maint}</span>
      </div>
    </div>''', 20)

COST = [
    ("06 ABC 123", "₺14.200", "₺6.800", "₺3.100", "₺9.400", "₺2.750", "₺36.250", "₺0,96"),
    ("06 XYZ 456", "₺16.900", "₺9.200", "₺0", "₺9.400", "₺4.100", "₺39.600", "₺1,04"),
    ("06 DEF 789", "₺11.400", "₺2.400", "₺0", "₺10.100", "₺0", "₺23.900", "₺0,81"),
    ("06 MOT 034", "₺3.100", "₺1.200", "₺900", "₺3.800", "₺0", "₺9.000", "₺0,74"),
    ("06 KAM 210", "₺28.700", "₺12.400", "₺7.600", "₺18.200", "₺5.200", "₺72.100", "₺1,88"),
    ("06 TRV 077", "₺9.800", "₺18.600", "₺0", "₺9.400", "₺1.400", "₺39.200", "₺2,14"),
]
CC = "132px 1fr 1fr 1fr 1fr 1fr 132px 132px"

def crow(*c):
    cells = "".join(f'<div class="td num" style="{"font-weight: 600;" if i in (0, 6, 7) else "color: #42586A;"}">{v}</div>' for i, v in enumerate(c))
    return f'<div style="display: grid; grid-template-columns: {CC}; gap: 12px; align-items: center; padding: 11px 4px; border-top: 1px solid #E7EEF2;">{cells}</div>'

def stat(label, value, sub, col="#0E2436"):
    return card(f'<div class="stat-lbl">{label}</div><div class="kpi" style="margin: 8px 0 4px; color: {col};">{value}</div><div class="t-13 t-muted">{sub}</div>', 18)

body = f'''
<div style="display: flex; align-items: flex-end; gap: 16px;">
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <span class="h-page">Araçlar</span>
    <span class="t-sec">12 araç · 10 aktif · 1 bakımda · 1 sınav aracı</span>
  </div>
  <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
    {seg(["Kart", "Liste", "Maliyet"], "Kart")}
    {btn("Bakım kaydı", "secondary", "wrench", "btn-sm")}
    {btn("Araç ekle", "primary", "plus", "btn-sm")}
  </div>
</div>

<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
  {stat("Aylık araç maliyeti", "₺220.050", "12 araç · geçen aya göre +%6")}
  {stat("Km başına maliyet", "₺1,18", "filo ortalaması")}
  {stat("Ortalama doluluk", "%75", "haftalık ders saatine göre")}
  {stat("Yaklaşan bakım", "3", "1 muayene · 2 periyodik", "#D9713C")}
</div>

<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">{"".join(car(*c) for c in CARS)}</div>

{card(f"""<div style="display: flex; align-items: center; gap: 12px; padding-bottom: 12px;">
    <span class="h-card">Araç maliyet takibi</span>
    <span class="t-13 t-muted">Ağustos 2026</span>
    <div style="margin-left: auto; display: flex; gap: 8px;">{btn("Gider ekle", "secondary", "plus", "btn-xs")}{btn("Dışa aktar", "secondary", "download", "btn-xs")}</div></div>
  <div style="display: grid; grid-template-columns: {CC}; gap: 12px; padding: 0 4px 10px;">
    {"".join(f'<div class="th">{h}</div>' for h in ["Plaka", "Yakıt", "Bakım", "Lastik", "Sigorta", "Tamir / diğer", "Toplam", "Km başına"])}
  </div>
  {"".join(crow(*c) for c in COST)}
  <div style="display: grid; grid-template-columns: {CC}; gap: 12px; align-items: center; padding: 13px 4px 0; border-top: 2px solid #E7EEF2; margin-top: 4px;">
    <div class="td" style="font-weight: 700;">Toplam</div>
    <div class="td num" style="font-weight: 700;">₺84.100</div><div class="td num" style="font-weight: 700;">₺50.600</div>
    <div class="td num" style="font-weight: 700;">₺11.600</div><div class="td num" style="font-weight: 700;">₺60.300</div>
    <div class="td num" style="font-weight: 700;">₺13.450</div><div class="td num" style="font-weight: 700;">₺220.050</div>
    <div class="td num" style="font-weight: 700;">₺1,18</div>
  </div>""", 20)}
'''

open("Vehicles.dc.html", "w").write(shell(body, "Araçlar", page_title("Araçlar", "Filo, bakım ve maliyet takibi"), 1430))
print("Vehicles.dc.html")
