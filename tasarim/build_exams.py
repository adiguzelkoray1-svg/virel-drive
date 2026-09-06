# -*- coding: utf-8 -*-
"""Virel Drive · Sınavlar (e-Sınav + direksiyon)."""
from common import icon, shell, page_title, card, badge, btn, avatar, bar, tabs, seg, QS

def rights(used, total, tone="#0067C4"):
    dots = "".join(f'<span style="width: 8px; height: 8px; border-radius: 999px; background: {tone if i < used else "#E7EEF2"};"></span>' for i in range(total))
    return f'<div style="display: flex; align-items: center; gap: 8px;"><span style="display: flex; gap: 4px;">{dots}</span><span class="t-13 t-muted num">{total - used}/{total} hak</span></div>'

UP = [
    ("Merve Koç",    "B",  "e-Sınav",    "14.09.2026", "MEB Salon 3, Çankaya", (0, 4), "Başvuru onaylandı", "brand"),
    ("Mehmet Kaya",  "B",  "e-Sınav",    "14.09.2026", "MEB Salon 3, Çankaya", (1, 4), "Başvuru onaylandı", "brand"),
    ("Elif Şahin",   "C",  "e-Sınav",    "14.09.2026", "MEB Salon 1, Keçiören", (0, 4), "Evrak bekleniyor", "warning"),
    ("Zeynep Demir", "B",  "Direksiyon", "06.10.2026", "Yıldız Kurs · 06 XYZ 456", (2, 4), "Planlandı", "brand"),
    ("Nihan Er",     "B",  "Direksiyon", "06.10.2026", "Yıldız Kurs · 06 ABC 123", (3, 4), "Son hak", "danger"),
    ("Ayşe Yılmaz",  "B",  "Direksiyon", "Planlanmadı", "Eğitim 8/14 saat", (0, 4), "Hazır değil", "neutral"),
]

C = "minmax(190px,1fr) 44px 108px 112px 214px 150px 144px 16px"

def row(name, cls, kind, date, place, r, st, tone):
    return f'''<div style="display: grid; grid-template-columns: {C}; gap: 12px; align-items: center; padding: 12px 4px; border-top: 1px solid #E7EEF2;">
      <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">{avatar(name, 32, 12)}
        <span style="font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{name}</span></div>
      <div>{badge(cls, "brand")}</div>
      <div class="td">{kind}</div>
      <div class="td t-sec num">{date}</div>
      <div class="t-13 t-sec">{place}</div>
      <div>{rights(r[0], r[1], "#D1453B" if r[1] - r[0] <= 1 else "#0067C4")}</div>
      <div>{badge(st, tone, dot=tone != "neutral")}</div>
      <div style="color: #78909F;">{icon("chev-right", 16)}</div></div>'''

def stat(label, value, sub, col="#0E2436"):
    return card(f'''<div class="stat-lbl">{label}</div>
      <div class="kpi" style="margin: 8px 0 4px; color: {col};">{value}</div>
      <div class="t-13 t-muted">{sub}</div>''', 18)

RESULTS = [("Burak Şen", "Direksiyon", "28.08.2026", "Başarılı", "success", "—"),
           ("Deniz Ulu", "e-Sınav", "08.08.2026", "84 puan", "success", "—"),
           ("Nihan Er", "Direksiyon", "12.08.2026", "Başarısız", "danger", "Park ve geri manevra"),
           ("Onur Taş", "e-Sınav", "08.08.2026", "42 puan", "danger", "Trafik ve çevre bilgisi"),
           ("Kerem Aksu", "e-Sınav", "08.08.2026", "78 puan", "success", "—")]

def res(name, kind, date, out, tone, why):
    return f'''<div style="display: flex; align-items: center; gap: 12px; padding: 11px 0; border-top: 1px solid #E7EEF2;">
      {avatar(name, 30, 11)}
      <div style="display: flex; flex-direction: column; gap: 1px; min-width: 0; flex-grow: 1;">
        <span style="font-size: 13.5px; font-weight: 600;">{name}</span>
        <span class="t-13 t-muted num">{kind} · {date}</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
        {badge(out, tone, dot=True)}
        {f'<span class="t-13 t-muted">{why}</span>' if why != "—" else ""}
      </div></div>'''

body = f'''
<div style="display: flex; align-items: flex-end; gap: 16px;">
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <span class="h-page">Sınavlar</span>
    <span class="t-sec">e-Sınav ve direksiyon sınavı süreçleri, sonuçlar ve sınav hakları</span>
  </div>
  <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
    {btn("Excel'e aktar", "secondary", "download", "btn-sm")}
    {btn("Sınav başvurusu", "primary", "plus", "btn-sm")}
  </div>
</div>

{tabs(["e-Sınav", "Direksiyon Sınavı", "Sınav Sonuçları", "Sınav Hakları", "Sınav Takvimi"], "e-Sınav")}

<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
  {stat("Yaklaşan sınav", "7", "e-Sınav 4 · direksiyon 3")}
  {stat("e-Sınav başarı oranı", "%81", "son 6 ay · 74 sınav", "#12A87C")}
  {stat("Direksiyon başarı oranı", "%68", "son 6 ay · 41 sınav", "#D9713C")}
  {stat("Son hakkı kalan", "2", "kursiyer takibe alınmalı", "#D1453B")}
</div>

{card(f"""<div style="display: flex; align-items: center; gap: 12px; padding-bottom: 12px;">
    <span class="h-card">Yaklaşan sınavlar</span>
    {seg(["Tümü", "e-Sınav", "Direksiyon"], "Tümü")}
    <a class="t-13" style="margin-left: auto; font-weight: 600;">Sınav takvimi →</a></div>
  <div style="display: grid; grid-template-columns: {C}; gap: 12px; padding: 0 4px 10px;">
    {"".join(f'<div class="th">{h}</div>' for h in ["Kursiyer", "Sınıf", "Tür", "Tarih", "Yer", "Kalan hak", "Durum", ""])}
  </div>
  {"".join(row(*r) for r in UP)}""", 20)}

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">
  {card(f"""<div style="display: flex; align-items: center; gap: 10px;">
      <span class="h-card">Son sonuçlar</span>
      <span class="t-13 t-muted">son 30 gün</span>
      <a class="t-13" style="margin-left: auto; font-weight: 600;">Tümü</a></div>
    <div style="margin-top: 6px;">{"".join(res(*r) for r in RESULTS)}</div>""", 20)}

  {card(f"""<div style="display: flex; align-items: center; gap: 8px;">
      {icon("info", 16, "#78909F")}<span class="h-card">Sınav hakları mevzuata bağlıdır</span></div>
    <div class="t-13 t-sec" style="margin-top: 10px; line-height: 1.6; max-width: 460px;">Hak sayısı, sınav türleri, başvuru koşulları ve başarı barajı mevzuata göre değişebilir.
    Bu değerler <b>Ayarlar › Mevzuat ve Kurs Ayarları</b> ekranından güncellenir; koda gömülü değildir.</div>
    <div style="margin-top: 14px; padding: 14px; border-radius: 10px; background: #F3F7F9; display: flex; gap: 26px;">
      <div><div class="stat-lbl">e-Sınav hakkı</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700;" class="num">4</div></div>
      <div><div class="stat-lbl">Direksiyon hakkı</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700;" class="num">4</div></div>
      <div><div class="stat-lbl">Başarı barajı</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700;" class="num">70</div></div>
      <div><div class="stat-lbl">Geçerlilik</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700;">2 yıl</div></div>
    </div>
    <div style="margin-top: 14px; display: flex; gap: 8px;">{btn("Mevzuat ayarları", "secondary", "settings", "btn-xs")}{btn("Sonuç içe aktar (Excel)", "secondary", "upload", "btn-xs")}</div>""", 20)}
</div>'''

open("Exams.dc.html", "w").write(shell(body, "Sınavlar", page_title("Sınavlar", "e-Sınav · direksiyon sınavı · haklar"), 1120))
print("Exams.dc.html")
