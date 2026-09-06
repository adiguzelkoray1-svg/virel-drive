# -*- coding: utf-8 -*-
"""Virel Drive · Eğitmenler."""
from common import icon, shell, page_title, card, badge, btn, avatar, bar, seg, QS

INS = [
    ("Mehmet Öz",    "Direksiyon eğitmeni", "B", "06 ABC 123", 34, 40, 11, "%74", "Aktif", "success"),
    ("Ali Kaya",     "Direksiyon eğitmeni", "B", "06 XYZ 456", 38, 40, 13, "%81", "Aktif", "success"),
    ("Hakan Tuna",   "Direksiyon eğitmeni", "B · A2", "06 DEF 789", 29, 40, 9, "%64", "Aktif", "success"),
    ("Serkan Yıldız","Direksiyon eğitmeni", "C · D", "06 KAM 210", 22, 40, 6, "%70", "Aktif", "success"),
    ("Selin Ak",     "Teorik öğretmen", "Trafik ve Çevre · Trafik Adabı", "Derslik 2", 12, 20, 62, "%86", "Aktif", "success"),
    ("Dr. Nur Ateş", "Teorik öğretmen", "İlk Yardım", "Derslik 1", 8, 20, 62, "%88", "Aktif", "success"),
    ("Kemal Bora",   "Teorik öğretmen", "Araç Tekniği", "Derslik 2", 6, 20, 62, "%79", "Aktif", "success"),
    ("Deniz Arı",    "Direksiyon eğitmeni", "B", "—", 0, 40, 0, "—", "İzinde", "warning"),
]

C = "minmax(200px,1fr) 178px 168px 128px 150px 96px 104px 96px"

def row(name, role, cls, veh, load, cap, students, rate, st, tone):
    pct = round(load / cap * 100)
    col = "#D1453B" if pct >= 90 else ("#0067C4" if pct >= 60 else "#CFDCE4")
    return f'''<div style="display: grid; grid-template-columns: {C}; gap: 12px; align-items: center; padding: 13px 4px; border-top: 1px solid #E7EEF2;">
      <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">{avatar(name, 34, 12)}
        <div style="display: flex; flex-direction: column; min-width: 0;">
          <span style="font-size: 14px; font-weight: 600;">{name}</span>
          <span class="t-13 t-muted">{role}</span></div></div>
      <div class="t-13 t-sec">{cls}</div>
      <div class="t-13 t-sec num">{veh}</div>
      <div style="display: flex; flex-direction: column; gap: 5px;">
        <span class="t-13 num">{load}/{cap} saat</span>
        <div class="bar" style="height: 5px;"><i style="width: {pct}%; background: {col};"></i></div></div>
      <div class="td num">{students} kursiyer</div>
      <div class="td num">{rate}</div>
      <div>{badge(st, tone, dot=True)}</div>
      <div style="display: flex; gap: 6px; justify-content: flex-end;">
        <div class="ibtn" style="width: 30px; height: 30px;">{icon("calendar", 15)}</div>
        <div class="ibtn" style="width: 30px; height: 30px;">{icon("more", 15)}</div></div></div>'''

def stat(label, value, sub, col="#0E2436"):
    return card(f'<div class="stat-lbl">{label}</div><div class="kpi" style="margin: 8px 0 4px; color: {col};">{value}</div><div class="t-13 t-muted">{sub}</div>', 18)

LOAD = [("Ali Kaya", 95), ("Mehmet Öz", 85), ("Hakan Tuna", 72), ("Serkan Yıldız", 55), ("Selin Ak", 60), ("Dr. Nur Ateş", 40)]
loadrows = "".join(f'''<div style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid #E7EEF2;">
  <span class="t-13" style="width: 116px;">{n}</span>
  <div style="flex-grow: 1;"><div class="bar" style="height: 6px;"><i style="width: {p}%; background: {"#D1453B" if p >= 90 else "#0067C4"};"></i></div></div>
  <span class="t-13 t-sec num" style="width: 38px; text-align: right;">%{p}</span></div>''' for n, p in LOAD)

body = f'''
<div style="display: flex; align-items: flex-end; gap: 16px;">
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <span class="h-page">Eğitmenler</span>
    <span class="t-sec">8 eğitmen · 4 direksiyon · 3 teorik · 1 izinde</span>
  </div>
  <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
    {seg(["Tümü", "Direksiyon", "Teorik"], "Tümü")}
    {btn("Eğitmen ekle", "primary", "plus", "btn-sm")}
  </div>
</div>

<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
  {stat("Haftalık ders yükü", "149 saat", "kapasitenin %62'si")}
  {stat("En yoğun eğitmen", "Ali Kaya", "38/40 saat · %95", "#D1453B")}
  {stat("Ortalama sınav başarısı", "%76", "direksiyon · son 6 ay", "#12A87C")}
  {stat("Kursiyer / eğitmen", "10,3", "direksiyon eğitmeni başına")}
</div>

{card(f"""<div style="display: flex; align-items: center; gap: 12px; padding-bottom: 12px;">
    <span class="h-card">Eğitmen listesi</span>
    <div class="input" style="width: 240px; height: 34px; margin-left: 8px;">{icon("search", 15, "#78909F")}<span class="t-13">Eğitmen ara…</span></div>
    <a class="t-13" style="margin-left: auto; font-weight: 600;">Haftalık plan →</a></div>
  <div style="display: grid; grid-template-columns: {C}; gap: 12px; padding: 0 4px 10px;">
    {"".join(f'<div class="th">{h}</div>' for h in ["Eğitmen", "Sınıf / branş", "Araç / derslik", "Bu hafta yük", "Kursiyer", "Başarı", "Durum", ""])}
  </div>
  {"".join(row(*i) for i in INS)}""", 20)}

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">
  {card(f"""<div style="display: flex; align-items: center; gap: 10px;">
      <span class="h-card">Haftalık doluluk</span>
      <span class="t-13 t-muted">kapasiteye göre</span></div>
    <div style="margin-top: 8px;">{loadrows}</div>""", 20)}

  {card(f"""<div style="display: flex; align-items: center; gap: 8px;">
      {icon("info", 16, "#78909F")}<span class="h-card">Yük dengesi</span></div>
    <div class="t-13 t-sec" style="margin-top: 10px; line-height: 1.6;">Ali Kaya bu hafta kapasitesinin %95'inde; Serkan Yıldız'da 18 saat boşluk var.
    Yeni direksiyon derslerinin bir kısmı Serkan Yıldız'a yönlendirilebilir.</div>
    <div style="margin-top: 14px; padding: 14px; border-radius: 10px; background: #E8F1FB; display: flex; align-items: center; gap: 12px;">
      {avatar("Serkan Yıldız", 34, 12, "b")}
      <div style="display: flex; flex-direction: column;">
        <span style="font-size: 13.5px; font-weight: 600;">Serkan Yıldız · 18 saat boşluk</span>
        <span class="t-13 t-sec">C ve D sınıfı · 06 KAM 210</span></div>
      <div style="margin-left: auto;">{btn("Ders ata", "primary", None, "btn-xs")}</div>
    </div>""", 20)}
</div>'''

open("Instructors.dc.html", "w").write(shell(body, "Eğitmenler", page_title("Eğitmenler", "Ders yükü, branş ve performans"), 1320))
print("Instructors.dc.html")
