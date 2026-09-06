# -*- coding: utf-8 -*-
"""Virel Drive · CRM / Ön kayıt pipeline."""
from common import icon, shell, page_title, card, badge, btn, avatar, bar, seg, QS

STAGES = [
    ("Yeni başvuru",   14, "#0067C4", [("Ceren Aksoy", "B", "Instagram", "2 saat önce", None),
                                        ("Tolga Kurt", "B", "Web formu", "5 saat önce", None),
                                        ("Buse Yalçın", "A2", "Tavsiye", "dün", None)]),
    ("Bilgi verildi",   9, "#00A9BF", [("Hakan Demir", "B", "Telefon", "dün", None),
                                        ("Sude Er", "B", "Instagram", "2 gün önce", None)]),
    ("Fiyat gönderildi",7, "#12A87C", [("Ahmet Bulut", "B", "WhatsApp", "3 gün önce", "geç"),
                                        ("Gizem Toprak", "C", "Web formu", "2 gün önce", None)]),
    ("Takip bekliyor",  5, "#D9713C", [("Efe Şimşek", "B", "Instagram", "5 gün önce", "geç"),
                                        ("Nazlı Ak", "B", "Tavsiye", "4 gün önce", "geç")]),
    ("Kayıt görüşmesi", 4, "#6C8EA4", [("Melis Kara", "B", "Web formu", "bugün 16:00", None)]),
    ("Kayıt oldu",     11, "#12A87C", [("Selin Ateş", "B", "Instagram", "1 Eylül", None)]),
]

def lead(name, cls, src, when, flag):
    warn = f'<span style="color: #D9713C; display: flex; align-items: center; gap: 4px;" class="t-13">{icon("clock", 12)}Takip zamanı geldi</span>' if flag else ""
    return f'''<div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 10px; padding: 11px 12px; display: flex; flex-direction: column; gap: 7px;">
      <div style="display: flex; align-items: center; gap: 8px;">{avatar(name, 26, 10)}
        <span style="font-size: 13.5px; font-weight: 600;">{name}</span>
        <span style="margin-left: auto;">{badge(cls, "brand")}</span></div>
      <div style="display: flex; align-items: center; gap: 7px;">
        <span class="t-13 t-muted">{src}</span><span class="t-13 t-muted">·</span><span class="t-13 t-muted">{when}</span></div>
      {warn}
      <div style="display: flex; gap: 6px; margin-top: 2px;">
        <div class="ibtn" style="width: 28px; height: 28px;">{icon("phone", 14)}</div>
        <div class="ibtn" style="width: 28px; height: 28px;">{icon("whatsapp", 14)}</div>
        <div class="ibtn" style="width: 28px; height: 28px;">{icon("message", 14)}</div>
        <div class="btn btn-secondary btn-xs" style="margin-left: auto; height: 28px;">Aşamayı ilerlet</div>
      </div></div>'''

def col(name, count, color, leads):
    more = f'<div class="t-13 t-muted" style="text-align: center; padding: 8px 0;">+{count - len(leads)} aday</div>' if count > len(leads) else ""
    return f'''<div style="display: flex; flex-direction: column; gap: 10px; min-width: 0;">
      <div style="display: flex; align-items: center; gap: 8px; padding: 0 2px 2px;">
        <span style="width: 8px; height: 8px; border-radius: 999px; background: {color};"></span>
        <span style="font-size: 13.5px; font-weight: 600;">{name}</span>
        <span class="t-13 t-muted num" style="margin-left: auto;">{count}</span>
      </div>
      <div style="background: #F3F7F9; border-radius: 12px; padding: 10px; display: flex; flex-direction: column; gap: 10px; min-height: 300px;">
        {"".join(lead(*l) for l in leads)}{more}
      </div></div>'''

def stat(label, value, sub, c="#0E2436"):
    return card(f'<div class="stat-lbl">{label}</div><div class="kpi" style="margin: 8px 0 4px; color: {c};">{value}</div><div class="t-13 t-muted">{sub}</div>', 18)

FOLLOW = [
    ("Ahmet Bulut", "3 gün önce fiyat bilgisi aldı, geri dönüş yapılmadı.", "WhatsApp", "danger"),
    ("Efe Şimşek", "5 gün önce bilgi istedi, takip planlanmadı.", "Telefon", "danger"),
    ("Nazlı Ak", "Fiyat gönderildi, 4 gündür yanıt yok.", "WhatsApp", "warning"),
]

def follow(name, why, ch, tone):
    c = {"danger": "#D1453B", "warning": "#D9713C"}[tone]
    return f'''<div style="display: flex; gap: 11px; align-items: flex-start; padding: 12px 0; border-top: 1px solid #E7EEF2;">
      {avatar(name, 30, 11)}
      <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0; flex-grow: 1;">
        <span style="font-size: 13.5px; font-weight: 600;">{name}</span>
        <span class="t-13 t-sec" style="line-height: 1.45;">{why}</span></div>
      <div class="btn btn-secondary btn-xs" style="white-space: nowrap;">{icon("whatsapp", 13)}{ch}</div></div>'''

SRC = [("Instagram", 38), ("Web formu", 26), ("Tavsiye", 18), ("Telefon", 12), ("Diğer", 6)]
srcs = "".join(f'''<div style="display: flex; align-items: center; gap: 12px; padding: 9px 0; border-top: 1px solid #E7EEF2;">
  <span class="t-13" style="width: 96px;">{n}</span>
  <div style="flex-grow: 1;">{bar(p, "", 6)}</div>
  <span class="t-13 t-sec num" style="width: 34px; text-align: right;">%{p}</span></div>''' for n, p in SRC)

body = f'''
<div style="display: flex; align-items: flex-end; gap: 16px;">
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <span class="h-page">CRM · Ön kayıtlar</span>
    <span class="t-sec">50 aday · bu ay 11 kayıt · dönüşüm %22</span>
  </div>
  <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
    {seg(["Pipeline", "Liste", "Takvim"], "Pipeline")}
    {btn("Ön kayıt ekle", "primary", "plus", "btn-sm")}
  </div>
</div>

<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px;">
  {stat("Aktif aday", "50", "6 aşamada")}
  {stat("Bu ay kayıt", "11", "geçen ay 9", "#12A87C")}
  {stat("Dönüşüm oranı", "%22", "başvurudan kayda")}
  {stat("Takip gecikmesi", "3", "aday geri dönüş bekliyor", "#D1453B")}
  {stat("Ortalama kapanış", "6,4 gün", "ilk temastan kayda")}
</div>

<div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; align-items: start;">
  {"".join(col(*c) for c in STAGES)}
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">
  {card(f"""<div style="display: flex; align-items: center; gap: 10px;">
      <span class="h-card">Kaybetmeden önce</span>{badge("3 aday", "danger", dot=True)}
      <a class="t-13" style="margin-left: auto; font-weight: 600;">Takip listesi →</a></div>
    <div class="t-13 t-sec" style="margin: 6px 0 2px; line-height: 1.5;">Geri dönüş yapılmayan adaylar. Zamanında aranmayan aday, kaybedilen kayıttır.</div>
    {"".join(follow(*f) for f in FOLLOW)}""", 20)}

  {card(f"""<div style="display: flex; align-items: center; gap: 10px;">
      <span class="h-card">Aday kaynakları</span><span class="t-13 t-muted">son 90 gün</span></div>
    <div style="margin-top: 8px;">{srcs}</div>
    <div style="margin-top: 12px; padding-top: 13px; border-top: 1px solid #E7EEF2; display: flex; align-items: center; gap: 8px;">
      {icon("info", 15, "#78909F")}<span class="t-13 t-sec">Instagram adaylarının kayda dönüşme oranı %28 ile en yüksek kanal.</span>
    </div>""", 20)}
</div>'''

open("CRM.dc.html", "w").write(shell(body, "CRM", page_title("CRM", "Ön kayıt ve aday takibi"), 1260))
print("CRM.dc.html")
