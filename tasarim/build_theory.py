# -*- coding: utf-8 -*-
"""Virel Drive · Teorik eğitim."""
from common import icon, shell, page_title, card, badge, btn, avatar, bar, seg, QS

CATS = [("Trafik ve Çevre", 24, 18, "#0067C4"), ("İlk Yardım", 16, 12, "#12A87C"),
        ("Araç Tekniği", 12, 9, "#00A9BF"), ("Trafik Adabı", 8, 8, "#D9713C")]

def cat(name, total, done, col):
    pct = round(done / total * 100)
    return card(f'''<div style="display: flex; align-items: center; gap: 8px;">
      <span class="stat-lbl">{name}</span>
      <span class="t-13 t-muted" style="margin-left: auto;" >{done}/{total} ders</span></div>
    <div class="kpi" style="margin: 8px 0 10px;">%{pct}</div>
    <div class="bar" style="height: 6px;"><i style="width: {pct}%; background: {col};"></i></div>''', 18)

PROGRAM = [
    ("Bugün", "10:00–11:30", "Trafik ve Çevre", "Trafik işaretleri – 2", "Selin Ak", "Derslik 2", 24, 26, "live"),
    ("Bugün", "14:00–15:30", "İlk Yardım", "Kanamalar ve şok", "Dr. Nur Ateş", "Derslik 1", 31, 34, "wait"),
    ("5 Eyl", "10:00–11:30", "Araç Tekniği", "Motor ve aktarma", "Kemal Bora", "Derslik 2", 0, 26, "plan"),
    ("5 Eyl", "14:00–15:30", "Trafik ve Çevre", "Kavşaklarda geçiş", "Selin Ak", "Derslik 1", 0, 34, "plan"),
    ("8 Eyl", "10:00–11:30", "Trafik Adabı", "Sürücü davranışları", "Selin Ak", "Derslik 2", 0, 26, "plan"),
    ("9 Eyl", "10:00–11:30", "İlk Yardım", "Uygulamalı tekrar", "Dr. Nur Ateş", "Derslik 1", 0, 34, "plan"),
]

ST = {"live": ("Devam ediyor", "brand"), "wait": ("Bekliyor", "neutral"), "plan": ("Planlandı", "neutral")}
C = "76px 124px 168px 1fr 150px 104px 152px 128px"

def prow(day, hours, cat_, topic, teacher, room, att, cap, st):
    lbl, tone = ST[st]
    pct = round(att / cap * 100) if att else 0
    attend = f'<div style="display: flex; flex-direction: column; gap: 4px;"><span class="t-13 num">{att}/{cap} · %{pct}</span>{bar(pct, "", 4)}</div>' if att else '<span class="t-13 t-muted">—</span>'
    return f'''<div style="display: grid; grid-template-columns: {C}; gap: 12px; align-items: center; padding: 12px 4px; border-top: 1px solid #E7EEF2;">
      <span class="t-13" style="font-weight: 600;">{day}</span>
      <span class="t-13 t-sec num">{hours}</span>
      <span>{badge(cat_, "neutral")}</span>
      <span class="td">{topic}</span>
      <span class="t-13 t-sec">{teacher}</span>
      <span class="t-13 t-sec">{room}</span>
      <div>{attend}</div>
      <div>{badge(lbl, tone, dot=st == "live")}</div></div>'''

RISK = [("Onur Taş", "Trafik ve Çevre", "4 ders", "%78 devam", "danger"),
        ("Elif Şahin", "İlk Yardım", "3 ders", "%82 devam", "warning"),
        ("Mehmet Kaya", "Araç Tekniği", "2 ders", "%88 devam", "warning")]

def risk(name, c, missed, att, tone):
    return f'''<div style="display: flex; align-items: center; gap: 10px; padding: 11px 0; border-top: 1px solid #E7EEF2;">
      {avatar(name, 30, 11)}
      <div style="display: flex; flex-direction: column; gap: 1px; min-width: 0;">
        <span style="font-size: 13.5px; font-weight: 600;">{name}</span>
        <span class="t-13 t-muted">{c} · {missed} devamsız</span>
      </div>
      <span style="margin-left: auto;">{badge(att, tone, dot=True)}</span></div>'''

body = f'''
<div style="display: flex; align-items: flex-end; gap: 16px;">
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <span class="h-page">Teorik eğitim</span>
    <span class="t-sec">Dönem 2026/3 · 26 Haziran – 30 Eylül · 62 kursiyer</span>
  </div>
  <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
    {seg(["Program", "Kursiyerler", "Devam"], "Program")}
    {btn("Yoklama al", "secondary", "check", "btn-sm")}
    {btn("Ders planla", "primary", "plus", "btn-sm")}
  </div>
</div>

<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">{"".join(cat(*c) for c in CATS)}</div>

{card(f"""<div style="display: flex; align-items: center; gap: 10px; padding-bottom: 12px;">
    <span class="h-card">Ders programı</span>
    <span class="t-13 t-muted">Bu hafta ve sonraki</span>
    <a class="t-13" style="margin-left: auto; font-weight: 600;">Tüm dönem →</a></div>
  <div style="display: grid; grid-template-columns: {C}; gap: 12px; padding: 0 4px 10px;">
    {"".join(f'<div class="th">{h}</div>' for h in ["Gün", "Saat", "Kategori", "Konu", "Eğitmen", "Derslik", "Katılım", "Durum"])}
  </div>
  {"".join(prow(*p) for p in PROGRAM)}""", 20)}

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">
  {card(f"""<div style="display: flex; align-items: center; gap: 10px;">
      <span class="h-card">Devam riski</span>{badge("3 kursiyer", "warning", dot=True)}
      <a class="t-13" style="margin-left: auto; font-weight: 600;">Devam raporu →</a></div>
    <div class="t-13 t-sec" style="margin: 6px 0 2px; line-height: 1.5;">Devam oranı %85'in altına inen kursiyer e-Sınav başvurusu yapamaz.</div>
    {"".join(risk(*r) for r in RISK)}""", 20)}

  {card(f"""<div class="h-card" style="margin-bottom: 14px;">Dönem özeti</div>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
      <div><div class="stat-lbl">Toplam ders</div><div style="font-family: {QS}; font-size: 22px; font-weight: 700;" class="num">60</div></div>
      <div><div class="stat-lbl">Tamamlanan</div><div style="font-family: {QS}; font-size: 22px; font-weight: 700;" class="num">47</div></div>
      <div><div class="stat-lbl">Ort. devam</div><div style="font-family: {QS}; font-size: 22px; font-weight: 700; color: #12A87C;" class="num">%93</div></div>
      <div><div class="stat-lbl">Dönem sonu</div><div style="font-family: {QS}; font-size: 22px; font-weight: 700;" class="num">30 Eyl</div></div>
    </div>
    <div style="margin-top: 20px;">{bar(78, "bar-grad", 7)}</div>
    <div style="display: flex; justify-content: space-between; margin-top: 8px;">
      <span class="t-13 t-muted">Dönemin %78'i tamamlandı</span>
      <span class="t-13 t-sec" style="font-weight: 600;">13 ders kaldı</span>
    </div>""", 20)}
</div>'''

open("Theory.dc.html", "w").write(shell(body, "Teorik Eğitim", page_title("Teorik eğitim", "Ders programı, katılım ve devam takibi"), 1050))
print("Theory.dc.html")
