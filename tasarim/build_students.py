# -*- coding: utf-8 -*-
"""Virel Drive · Kursiyerler listesi."""
from common import (icon, shell, page_title, card, badge, btn, avatar, bar, seg, QS)

FILTERS = ["Tümü 124", "Aktif 98", "Ön kayıt 12", "Teorik 26", "e-Sınav bekliyor 14",
           "Direksiyon 41", "Direksiyon sınavı 9", "Mezun 63", "Pasif 5"]

# ad, sınıf, telefon, kayıt, aşama, teorik%, direksiyon (yapılan/gerekli), sınav, ödeme, durum
ROWS = [
    ("Ayşe Yılmaz",   "B",  "0532 •• 41", "12.06.2026", "Direksiyon eğitimi", 100, (8, 14),  ("e-Sınav geçti", "success"), ("Güncel", "success"),  "Aktif"),
    ("Mehmet Kaya",   "B",  "0505 •• 77", "02.07.2026", "Teorik eğitim",       62, (0, 14),  ("Başvuru yapılmadı", "neutral"), ("2. taksit bekliyor", "neutral"), "Aktif"),
    ("Zeynep Demir",  "B",  "0555 •• 09", "21.05.2026", "Direksiyon sınavı",  100, (14, 14), ("Direksiyon 2/4 hak", "warning"), ("Güncel", "success"), "Aktif"),
    ("Emre Aydın",    "B",  "0542 •• 63", "04.07.2026", "Direksiyon eğitimi", 100, (6, 14),  ("e-Sınav geçti", "success"), ("12 gün gecikti", "danger"), "Aktif"),
    ("Merve Koç",     "B",  "0533 •• 18", "28.06.2026", "e-Sınav bekliyor",   100, (0, 14),  ("e-Sınav 14 Eylül", "brand"), ("Güncel", "success"), "Aktif"),
    ("Kerem Aksu",    "A2", "0546 •• 92", "10.07.2026", "Direksiyon eğitimi", 100, (4, 12),  ("e-Sınav geçti", "success"), ("Güncel", "success"), "Aktif"),
    ("Deniz Ulu",     "B",  "0537 •• 05", "18.06.2026", "Direksiyon eğitimi", 100, (11, 14), ("e-Sınav geçti", "success"), ("4 gün gecikti", "danger"), "Aktif"),
    ("Selin Ateş",    "B",  "0544 •• 30", "01.08.2026", "Evrak bekleniyor",     0, (0, 14),  ("—", "neutral"), ("Peşinat alındı", "neutral"), "Ön kayıt"),
    ("Burak Şen",     "B",  "0530 •• 51", "14.05.2026", "Mezun",              100, (14, 14), ("Direksiyon geçti", "success"), ("Kapandı", "success"), "Mezun"),
    ("Elif Şahin",    "C",  "0553 •• 84", "22.07.2026", "Teorik eğitim",       38, (0, 20),  ("—", "neutral"), ("Güncel", "success"), "Aktif"),
    ("Onur Taş",      "B",  "0507 •• 26", "30.07.2026", "Teorik eğitim",       21, (0, 14),  ("—", "neutral"), ("3 gün gecikti", "danger"), "Aktif"),
    ("Nihan Er",      "B",  "0538 •• 47", "09.06.2026", "Direksiyon sınavı",  100, (14, 14), ("Direksiyon 1/4 hak", "danger"), ("Güncel", "success"), "Aktif"),
]

STATUS = {"Aktif": "success", "Ön kayıt": "brand", "Mezun": "neutral", "Pasif": "neutral"}

COLS = "minmax(180px, 1fr) 40px 88px 122px 84px 108px 124px 118px 68px 18px"

def head():
    labels = ["Kursiyer", "Sınıf", "Kayıt", "Aşama", "Teorik", "Direksiyon", "Sınav", "Ödeme", "Durum", ""]
    return ('<div style="display: grid; grid-template-columns: ' + COLS + '; gap: 12px; align-items: center; padding: 0 4px 10px;">'
            + "".join(f'<div class="th">{l}</div>' for l in labels) + '</div>')

def row(name, cls, phone, reg, stage, th, dr, exam, pay, status):
    done, need = dr
    dpct = round(done / need * 100)
    return f'''
    <div style="display: grid; grid-template-columns: {COLS}; gap: 12px; align-items: center; padding: 12px 4px; border-top: 1px solid #E7EEF2;">
      <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
        {avatar(name, 34, 12)}
        <div style="display: flex; flex-direction: column; min-width: 0;">
          <span style="font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{name}</span>
          <span class="t-13 t-muted num">{phone}</span>
        </div>
      </div>
      <div>{badge(cls, "brand")}</div>
      <div class="td t-sec num">{reg}</div>
      <div class="td">{stage}</div>
      <div style="display: flex; flex-direction: column; gap: 5px;">{bar(th, "", 5)}<span class="t-13 t-muted num">%{th}</span></div>
      <div style="display: flex; flex-direction: column; gap: 5px;">{bar(dpct, "", 5)}<span class="t-13 t-muted num">{done}/{need} saat</span></div>
      <div>{badge(exam[0], exam[1], dot=exam[1] != "neutral")}</div>
      <div>{badge(pay[0], pay[1], dot=pay[1] != "neutral")}</div>
      <div>{badge(status, STATUS[status])}</div>
      <div style="color: #78909F;">{icon("chev-right", 16)}</div>
    </div>'''

chips = "".join(f'<div class="chip {"chip-on" if f.startswith("Tümü") else ""}">{f}</div>' for f in FILTERS)

body = f'''
<div style="display: flex; align-items: flex-end; gap: 16px;">
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <span class="h-page">Kursiyerler</span>
    <span class="t-sec">124 aktif kursiyer · 12 ön kayıt · bu ay 9 yeni kayıt</span>
  </div>
  <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
    <div class="btn btn-secondary btn-sm">{icon("download", 15)}Dışa aktar</div>
    <div class="btn btn-secondary btn-sm">{icon("filter", 15)}Filtreler</div>
    <div class="btn btn-primary btn-sm">{icon("plus", 15)}Kursiyer ekle</div>
  </div>
</div>

<div style="display: flex; gap: 8px; flex-wrap: wrap;">{chips}</div>

{card(f"""
  <div style="display: flex; align-items: center; gap: 12px; padding-bottom: 14px;">
    <div class="input" style="width: 300px; height: 36px;">{icon("search", 16, "#78909F")}<span class="t-13">Ad, telefon veya TC ara…</span></div>
    {seg(["Liste", "Kart"], "Liste")}
    <span class="t-13 t-muted" style="margin-left: auto;">124 kayıttan 12'si gösteriliyor</span>
  </div>
  {head()}{"".join(row(*r) for r in ROWS)}
  <div style="display: flex; align-items: center; gap: 10px; padding-top: 16px; border-top: 1px solid #E7EEF2; margin-top: 4px;">
    <span class="t-13 t-muted">Sayfa 1 / 11</span>
    <div style="margin-left: auto; display: flex; gap: 6px;">
      <div class="ibtn">{icon("chev-left", 16)}</div><div class="ibtn ibtn-soft">{icon("chev-right", 16)}</div>
    </div>
  </div>""", 20)}
'''

html = shell(body, "Kursiyerler", page_title("Kursiyerler", "Tüm kursiyerler ve süreç durumları"), 940)
open("Students.dc.html", "w").write(html)
print("Students.dc.html")
