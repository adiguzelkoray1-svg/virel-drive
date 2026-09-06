# -*- coding: utf-8 -*-
"""Virel Drive · Belgeler / evrak yönetimi."""
from common import icon, shell, page_title, card, badge, btn, avatar, bar, seg, QS

DOCS = ["Nüfus cüzdanı", "Diploma", "Sağlık raporu", "Adli sicil", "Fotoğraf", "Sürücü olur", "Kan grubu"]
ST = {"ok": ("#12A87C", "check"), "wait": ("#D9713C", "clock"), "chk": ("#0067C4", "eye"), "no": ("#D1453B", "x")}

ROWS = [
    ("Ayşe Yılmaz",  "B",  "12.06.2026", ["ok"] * 7, "Tamamlandı", "success"),
    ("Mehmet Kaya",  "B",  "02.07.2026", ["ok", "ok", "ok", "chk", "ok", "ok", "ok"], "1 belge kontrolde", "brand"),
    ("Selin Ateş",   "B",  "01.08.2026", ["ok", "ok", "wait", "no", "ok", "wait", "ok"], "3 belge eksik", "danger"),
    ("Elif Şahin",   "C",  "22.07.2026", ["ok", "ok", "ok", "ok", "ok", "wait", "ok"], "1 belge bekliyor", "warning"),
    ("Onur Taş",     "B",  "30.07.2026", ["ok", "ok", "ok", "ok", "ok", "ok", "ok"], "Tamamlandı", "success"),
    ("Kerem Aksu",   "A2", "10.07.2026", ["ok", "ok", "ok", "ok", "ok", "ok", "no"], "1 belge eksik", "danger"),
    ("Merve Koç",    "B",  "28.06.2026", ["ok"] * 7, "Tamamlandı", "success"),
    ("Nihan Er",     "B",  "09.06.2026", ["ok", "ok", "chk", "ok", "ok", "ok", "ok"], "1 belge kontrolde", "brand"),
]
C = "minmax(180px,1fr) 40px 100px repeat(7, 62px) 156px 16px"

def cell(s):
    col, ic = ST[s]
    bg = {"ok": "#E6F7F1", "wait": "#FDF0E8", "chk": "#E8F1FB", "no": "#FCECEB"}[s]
    return f'<div style="width: 26px; height: 26px; border-radius: 8px; background: {bg}; color: {col}; display: flex; align-items: center; justify-content: center;">{icon(ic, 14, sw=2.4)}</div>'

def row(name, cls, date, states, st, tone):
    return f'''<div style="display: grid; grid-template-columns: {C}; gap: 12px; align-items: center; padding: 11px 4px; border-top: 1px solid #E7EEF2;">
      <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">{avatar(name, 32, 12)}
        <span style="font-size: 14px; font-weight: 600;">{name}</span></div>
      <div>{badge(cls, "brand")}</div>
      <div class="td t-sec num">{date}</div>
      {"".join(f"<div>{cell(s)}</div>" for s in states)}
      <div>{badge(st, tone, dot=tone != "neutral")}</div>
      <div style="color: #78909F;">{icon("chev-right", 16)}</div></div>'''

def stat(label, value, sub, c="#0E2436"):
    return card(f'<div class="stat-lbl">{label}</div><div class="kpi" style="margin: 8px 0 4px; color: {c};">{value}</div><div class="t-13 t-muted">{sub}</div>', 18)

MISSING = [("Selin Ateş", "Adli sicil kaydı · Sağlık raporu · Sürücü olur belgesi", "Kayıt 36 gündür açık"),
           ("Kerem Aksu", "Kan grubu belgesi", "Sınav başvurusu engelleniyor"),
           ("Elif Şahin", "Sürücü olur belgesi", "8 gündür bekliyor")]
miss = "".join(f'''<div style="display: flex; gap: 11px; align-items: flex-start; padding: 12px 0; border-top: 1px solid #E7EEF2;">
  {avatar(n, 30, 11)}
  <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0; flex-grow: 1;">
    <span style="font-size: 13.5px; font-weight: 600;">{n}</span>
    <span class="t-13 t-sec" style="line-height: 1.45;">{d}</span>
    <span class="t-13 t-muted">{w}</span></div>
  <div class="btn btn-secondary btn-xs">Hatırlat</div></div>''' for n, d, w in MISSING)

legend = "".join(f'<div style="display: flex; align-items: center; gap: 7px;">{cell(s)}<span class="t-13 t-sec">{l}</span></div>'
                 for s, l in [("ok", "Tamamlandı"), ("chk", "Kontrol ediliyor"), ("wait", "Bekliyor"), ("no", "Eksik")])

body = f'''
<div style="display: flex; align-items: flex-end; gap: 16px;">
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <span class="h-page">Belgeler</span>
    <span class="t-sec">Kursiyer evraklarının dijital takibi · 7 zorunlu belge</span>
  </div>
  <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
    {seg(["Kursiyer", "Belge türü", "Kurs belgeleri"], "Kursiyer")}
    {btn("Belge yükle", "primary", "upload", "btn-sm")}
  </div>
</div>

<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
  {stat("Evrağı tam", "108", "124 aktif kursiyerden", "#12A87C")}
  {stat("Eksik belge", "3", "kursiyer · kayıt tamamlanamıyor", "#D1453B")}
  {stat("Kontrol bekleyen", "2", "yüklendi, onay bekliyor", "#0067C4")}
  {stat("Süresi dolacak", "5", "sağlık raporu · 30 gün içinde", "#D9713C")}
</div>

{card(f"""<div style="display: flex; align-items: center; gap: 12px; padding-bottom: 12px;">
    <span class="h-card">Kursiyer evrak durumu</span>
    <div class="input" style="width: 220px; height: 34px; margin-left: 8px;">{icon("search", 15, "#78909F")}<span class="t-13">Kursiyer ara…</span></div>
    <div style="margin-left: auto; display: flex; gap: 18px;">{legend}</div></div>
  <div style="display: grid; grid-template-columns: {C}; gap: 12px; padding: 0 4px 10px;">
    <div class="th">Kursiyer</div><div class="th">Sınıf</div><div class="th">Kayıt</div>
    {"".join(f'<div class="th" style="font-size: 11px; line-height: 1.25;">{d}</div>' for d in DOCS)}
    <div class="th">Durum</div><div></div>
  </div>
  {"".join(row(*r) for r in ROWS)}""", 20)}

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">
  {card(f"""<div style="display: flex; align-items: center; gap: 10px;">
      <span class="h-card">Eksik evrak</span>{badge("3 kursiyer", "danger", dot=True)}
      <a class="t-13" style="margin-left: auto; font-weight: 600;">Toplu hatırlatma</a></div>
    <div class="t-13 t-sec" style="margin: 6px 0 2px; line-height: 1.5;">Evrağı eksik kursiyerin kayıt süreci tamamlanmamış sayılır; sınav başvurusu yapılamaz.</div>
    {miss}""", 20)}

  {card(f"""<div class="h-card" style="margin-bottom: 4px;">Belge kuralları</div>
    <div class="t-13 t-muted">Zorunlu belgeler ve geçerlilik süreleri mevzuata göre değişebilir</div>
    <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      {"".join(f'''<div style="display: flex; align-items: center; gap: 9px; padding: 10px 12px; border: 1px solid #E7EEF2; border-radius: 10px;">
        {icon("file", 15, "#78909F")}<span class="t-13">{d}</span>
        <span class="t-13 t-muted" style="margin-left: auto;">Zorunlu</span></div>''' for d in DOCS)}
    </div>
    <div style="margin-top: 14px;">{btn("Belge kurallarını düzenle", "secondary", "settings", "btn-xs")}</div>""", 20)}
</div>'''

open("Documents.dc.html", "w").write(shell(body, "Belgeler", page_title("Belgeler", "Evrak takibi ve eksik belge yönetimi"), 1330))
print("Documents.dc.html")
