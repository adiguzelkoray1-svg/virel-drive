# -*- coding: utf-8 -*-
"""Virel Drive · Finans."""
from common import icon, shell, page_title, card, badge, btn, avatar, bar, seg, tabs, QS

def stat(label, value, sub, col="#0E2436"):
    return card(f'<div class="stat-lbl">{label}</div><div class="kpi" style="margin: 8px 0 4px; color: {col};">{value}</div><div class="t-13 t-muted">{sub}</div>', 18)

ROWS = [
    ("Ayşe Yılmaz",  "B",  "₺32.000", "₺26.500", "₺5.500",  "20.09.2026", 83,  "Güncel", "success"),
    ("Emre Aydın",   "B",  "₺32.000", "₺16.000", "₺16.000", "24.08.2026", 50,  "12 gün gecikti", "danger"),
    ("Deniz Ulu",    "B",  "₺32.000", "₺21.500", "₺10.500", "31.08.2026", 67,  "4 gün gecikti", "danger"),
    ("Zeynep Demir", "B",  "₺32.000", "₺32.000", "₺0",      "—",          100, "Tamamlandı", "success"),
    ("Kerem Aksu",   "A2", "₺18.500", "₺12.000", "₺6.500",  "18.09.2026", 65,  "Güncel", "success"),
    ("Elif Şahin",   "C",  "₺46.000", "₺18.000", "₺28.000", "15.09.2026", 39,  "Güncel", "success"),
    ("Onur Taş",     "B",  "₺32.000", "₺10.000", "₺22.000", "01.09.2026", 31,  "3 gün gecikti", "danger"),
    ("Merve Koç",    "B",  "₺32.000", "₺24.000", "₺8.000",  "22.09.2026", 75,  "Güncel", "success"),
]
C = "minmax(190px,1fr) 44px 108px 108px 108px 128px 150px 140px 16px"

def row(name, cls, total, paid, rest, due, pct, st, tone):
    return f'''<div style="display: grid; grid-template-columns: {C}; gap: 12px; align-items: center; padding: 12px 4px; border-top: 1px solid #E7EEF2;">
      <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">{avatar(name, 32, 12)}
        <span style="font-size: 14px; font-weight: 600;">{name}</span></div>
      <div>{badge(cls, "brand")}</div>
      <div class="td num">{total}</div>
      <div class="td num" style="color: #12A87C; font-weight: 600;">{paid}</div>
      <div class="td num" style="font-weight: 600;">{rest}</div>
      <div class="td t-sec num">{due}</div>
      <div style="display: flex; flex-direction: column; gap: 5px;">{bar(pct, "", 5)}<span class="t-13 t-muted num">%{pct} ödendi</span></div>
      <div>{badge(st, tone, dot=tone != "neutral")}</div>
      <div style="color: #78909F;">{icon("chev-right", 16)}</div></div>'''

MONTHS = [("Nis", 78, 52), ("May", 84, 55), ("Haz", 92, 58), ("Tem", 88, 61), ("Ağu", 74, 63), ("Eyl", 61, 40)]
chart = "".join(f'''<div style="display: flex; flex-direction: column; align-items: center; gap: 8px; flex-grow: 1;">
  <div style="height: 118px; width: 100%; display: flex; align-items: flex-end; gap: 4px;">
    <div style="flex: 1; height: {g}%; border-radius: 5px 5px 2px 2px; background: #0067C4;"></div>
    <div style="flex: 1; height: {x}%; border-radius: 5px 5px 2px 2px; background: #CFE2F7;"></div>
  </div><span class="t-13 t-muted">{m}</span></div>''' for m, g, x in MONTHS)

PLAN = [("Peşinat", "₺10.000", "12.06.2026", "Ödendi", "success"),
        ("1. taksit", "₺5.500", "20.07.2026", "Ödendi", "success"),
        ("2. taksit", "₺5.500", "20.08.2026", "Ödendi", "success"),
        ("3. taksit", "₺5.500", "20.09.2026", "Bekliyor", "neutral"),
        ("4. taksit", "₺5.500", "20.10.2026", "Bekliyor", "neutral")]

def plan(name, amt, date, st, tone):
    return f'''<div style="display: grid; grid-template-columns: 92px 1fr 108px 108px; gap: 10px; align-items: center; padding: 11px 0; border-top: 1px solid #E7EEF2;">
      <span class="t-13" style="font-weight: 600;">{name}</span>
      <span class="t-13 num" style="font-weight: 600;">{amt}</span>
      <span class="t-13 t-sec num">{date}</span>
      <div style="display: flex; justify-content: flex-end;">{badge(st, tone, dot=tone == "success")}</div></div>'''

body = f'''
<div style="display: flex; align-items: flex-end; gap: 16px;">
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <span class="h-page">Finans</span>
    <span class="t-sec">Tahsilat, ödeme planları, gelir ve gider</span>
  </div>
  <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
    {seg(["Bu ay", "Çeyrek", "Yıl"], "Bu ay")}
    {btn("Gider ekle", "secondary", "plus", "btn-sm")}
    {btn("Tahsilat al", "primary", "wallet", "btn-sm")}
  </div>
</div>

{tabs(["Genel", "Tahsilatlar", "Ödeme Planları", "Giderler", "Kasa", "Raporlar"], "Genel")}

<div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px;">
  {stat("Bugünkü tahsilat", "₺24.750", "6 işlem")}
  {stat("Bu ay tahsilat", "₺612.300", "hedefin %78'i", "#12A87C")}
  {stat("Bekleyen", "₺186.400", "42 taksit")}
  {stat("Geciken", "₺18.400", "4 kursiyer", "#D1453B")}
  {stat("Bu ay gider", "₺398.700", "araç · personel · kira")}
  {stat("Net durum", "₺213.600", "geçen aya göre −%12", "#0067C4")}
</div>

{card(f"""<div style="display: flex; align-items: center; gap: 12px; padding-bottom: 12px;">
    <span class="h-card">Kursiyer bazında tahsilat</span>
    <div class="input" style="width: 220px; height: 34px; margin-left: 8px;">{icon("search", 15, "#78909F")}<span class="t-13">Kursiyer ara…</span></div>
    <div style="margin-left: auto; display: flex; gap: 8px;">
      <div class="chip chip-on">Tümü</div><div class="chip">Geciken 4</div><div class="chip">Bu hafta vadesi 9</div>
    </div></div>
  <div style="display: grid; grid-template-columns: {C}; gap: 12px; padding: 0 4px 10px;">
    {"".join(f'<div class="th">{h}</div>' for h in ["Kursiyer", "Sınıf", "Toplam", "Ödenen", "Kalan", "Son ödeme", "İlerleme", "Durum", ""])}
  </div>
  {"".join(row(*r) for r in ROWS)}""", 20)}

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">
  {card(f"""<div style="display: flex; align-items: center; gap: 10px;">
      <span class="h-card">Gelir / gider</span>
      <div style="margin-left: auto; display: flex; gap: 14px;">
        <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 3px; background: #0067C4;"></span><span class="t-13 t-sec">Gelir</span></span>
        <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 3px; background: #CFE2F7;"></span><span class="t-13 t-sec">Gider</span></span>
      </div></div>
    <div style="display: flex; gap: 16px; margin-top: 18px; align-items: flex-end;">{chart}</div>
    <div style="margin-top: 14px; padding-top: 13px; border-top: 1px solid #E7EEF2; display: flex; align-items: center; gap: 8px;">
      {icon("info", 15, "#78909F")}<span class="t-13 t-sec">Eylül tahsilatları geçen aya göre %12 düşük; 4 kursiyerin gecikmesi bu farkın %61'ini oluşturuyor.</span>
    </div>""", 20)}

  {card(f"""<div style="display: flex; align-items: center; gap: 10px;">
      <span class="h-card">Ödeme planı</span>
      <span class="t-13 t-muted">Ayşe Yılmaz · B sınıfı</span>
      <a class="t-13" style="margin-left: auto; font-weight: 600;">Planı düzenle</a></div>
    <div style="display: flex; gap: 26px; margin: 14px 0 4px; padding: 14px; border-radius: 10px; background: #F3F7F9;">
      <div><div class="stat-lbl">Toplam</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700;" class="num">₺32.000</div></div>
      <div><div class="stat-lbl">Ödenen</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700; color: #12A87C;" class="num">₺26.500</div></div>
      <div><div class="stat-lbl">Kalan</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700; color: #0067C4;" class="num">₺5.500</div></div>
      <div><div class="stat-lbl">Taksit</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700;" class="num">4</div></div>
    </div>
    {"".join(plan(*p) for p in PLAN)}""", 20)}
</div>'''

open("Finance.dc.html", "w").write(shell(body, "Finans", page_title("Finans", "Tahsilat, ödeme planı ve gider takibi"), 1380))
print("Finance.dc.html")
