# -*- coding: utf-8 -*-
"""Virel Drive · Mesaj merkezi."""
from common import icon, shell, page_title, card, badge, btn, avatar, seg, QS

THREADS = [
    ("Ayşe Yılmaz", "wa", "Hocam yarınki dersi 15:00'e alabilir miyiz?", "14:32", 2, True),
    ("Emre Aydın", "sms", "Ödeme hatırlatması gönderildi", "13:10", 0, False),
    ("Merve Koç", "wa", "e-Sınav belgemi nereden alabilirim?", "12:48", 1, False),
    ("Mehmet Kaya", "wa", "Teşekkürler, anladım.", "11:20", 0, False),
    ("Elif Şahin", "mail", "Evrak eksik bildirimi", "dün", 0, False),
    ("Onur Taş", "sms", "Gecikmiş taksit hatırlatması", "dün", 0, False),
    ("Kerem Aksu", "wa", "Bu hafta ders alabilir miyim?", "2 gün", 0, False),
]
CH = {"wa": ("whatsapp", "#12A87C", "WhatsApp"), "sms": ("message", "#0067C4", "SMS"), "mail": ("mail", "#78909F", "E-posta")}

def thread(name, ch, last, when, unread, active):
    ic, col, _ = CH[ch]
    bg = "background: #E8F1FB;" if active else ""
    u = f'<span style="width: 18px; height: 18px; border-radius: 999px; background: #0067C4; color: #FFF; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center;">{unread}</span>' if unread else ""
    return f'''<div style="display: flex; gap: 11px; padding: 12px; border-radius: 10px; {bg} align-items: flex-start;">
      {avatar(name, 34, 12)}
      <div style="display: flex; flex-direction: column; gap: 3px; min-width: 0; flex-grow: 1;">
        <div style="display: flex; align-items: center; gap: 7px;">
          <span style="font-size: 13.5px; font-weight: 600;">{name}</span>
          <span style="color: {col};">{icon(ic, 13)}</span>
          <span class="t-13 t-muted" style="margin-left: auto;">{when}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="t-13 t-sec" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{last}</span>{u}
        </div>
      </div></div>'''

def msg(text, when, mine=False, meta=None):
    if mine:
        return f'''<div style="display: flex; justify-content: flex-end;">
          <div style="max-width: 68%; background: #0067C4; color: #FFFFFF; border-radius: 14px 14px 4px 14px; padding: 11px 14px;">
            <div style="font-size: 13.5px; line-height: 1.5;">{text}</div>
            <div style="font-size: 11px; opacity: .75; margin-top: 5px; text-align: right;">{when}</div></div></div>'''
    m = f'<div class="t-13 t-muted" style="margin-top: 4px;">{meta}</div>' if meta else ""
    return f'''<div style="display: flex;">
      <div style="max-width: 68%; background: #F3F7F9; border-radius: 14px 14px 14px 4px; padding: 11px 14px;">
        <div style="font-size: 13.5px; line-height: 1.5;">{text}</div>
        <div class="t-13 t-muted" style="margin-top: 5px;">{when}</div>{m}</div></div>'''

TPL = ["Ders hatırlatması", "Ödeme hatırlatması", "Evrak eksik", "Sınav tarihi", "Ders iptali", "Hoş geldiniz"]
tpl = "".join(f'<div class="chip">{t}</div>' for t in TPL)

AUTO = [("Ders hatırlatması", "Ders saatinden 24 saat önce", "WhatsApp", True),
        ("Ödeme hatırlatması", "Vade tarihinden 3 gün önce", "SMS", True),
        ("Sınav bilgilendirmesi", "Sınav tarihi belli olduğunda", "WhatsApp", True),
        ("Evrak eksik uyarısı", "Kayıttan 7 gün sonra", "SMS", False)]

def auto(name, when, ch, on):
    knob = f'''<div style="width: 36px; height: 21px; border-radius: 999px; background: {"#0067C4" if on else "#CFDCE4"}; padding: 2px; display: flex; {"justify-content: flex-end;" if on else ""}">
      <div style="width: 17px; height: 17px; border-radius: 999px; background: #FFFFFF;"></div></div>'''
    return f'''<div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid #E7EEF2;">
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span class="t-13" style="font-weight: 600;">{name}</span>
        <span class="t-13 t-muted">{when} · {ch}</span></div>
      <div style="margin-left: auto;">{knob}</div></div>'''

body = f'''
<div style="display: flex; align-items: flex-end; gap: 16px;">
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <span class="h-page">Mesajlar</span>
    <span class="t-sec">WhatsApp · SMS · e-posta · uygulama bildirimi</span>
  </div>
  <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
    {btn("Toplu mesaj", "secondary", "users", "btn-sm")}
    {btn("Yeni mesaj", "primary", "plus", "btn-sm")}
  </div>
</div>

<div style="display: grid; grid-template-columns: 320px 1fr 300px; gap: 16px; align-items: start;">
  {card(f"""<div style="display: flex; align-items: center; gap: 8px; padding-bottom: 10px;">
      <span class="h-card">Gelen kutusu</span>{badge("5", "brand")}
      <div class="ibtn ibtn-ghost" style="margin-left: auto;">{icon("filter", 16)}</div></div>
    <div class="input" style="height: 36px; margin-bottom: 8px;">{icon("search", 15, "#78909F")}<span class="t-13">Kursiyer ara…</span></div>
    <div style="display: flex; flex-direction: column; gap: 2px;">{"".join(thread(*t) for t in THREADS)}</div>""", 16)}

  {card(f"""<div style="display: flex; align-items: center; gap: 11px; padding-bottom: 14px; border-bottom: 1px solid #E7EEF2;">
      {avatar("Ayşe Yılmaz", 38, 14)}
      <div style="display: flex; flex-direction: column; gap: 1px;">
        <span style="font-size: 14px; font-weight: 600;">Ayşe Yılmaz</span>
        <span class="t-13 t-muted">B sınıfı · direksiyon eğitimi 8/14 saat</span></div>
      <div style="margin-left: auto; display: flex; gap: 8px;">
        {btn("Kursiyer kartı", "secondary", "user", "btn-xs")}
        <div class="ibtn">{icon("phone", 16)}</div></div></div>

    <div style="display: flex; flex-direction: column; gap: 12px; padding: 16px 0;">
      <div style="display: flex; justify-content: center;"><span class="chip" style="height: 26px; font-size: 12px;">Bugün</span></div>
      {msg("Dersiniz yarın saat 14:00'te. Eğitmen: Mehmet Öz · Araç: 06 ABC 123", "09:00", True)}
      {msg("Hocam yarınki dersi 15:00'e alabilir miyiz? İşten geç çıkacağım.", "14:32", False)}
      {msg("Tabii, 15:00–16:30 aralığı Mehmet Öz ve 06 ABC 123 için uygun. Onaylıyor musunuz?", "14:36", True)}
      {msg("Evet, teşekkürler 🙏", "14:38", False)}
    </div>

    <div style="display: flex; gap: 8px; flex-wrap: wrap; padding: 12px 0;">{tpl}</div>
    <div style="display: flex; gap: 10px; align-items: center; padding-top: 12px; border-top: 1px solid #E7EEF2;">
      <div class="input" style="flex-grow: 1;">{icon("message", 16, "#78909F")}<span>Mesaj yazın…</span></div>
      <div class="ibtn">{icon("file", 16)}</div>
      <div class="btn btn-primary">{icon("arrow-right", 16)}Gönder</div>
    </div>""", 20)}

  <div style="display: flex; flex-direction: column; gap: 16px;">
    {card(f"""<div class="h-card" style="margin-bottom: 4px;">Otomatik mesajlar</div>
      <div class="t-13 t-muted">Şablonlar operasyona bağlı tetiklenir</div>
      <div style="margin-top: 6px;">{"".join(auto(*a) for a in AUTO)}</div>""", 20)}

    {card(f"""<div class="h-card" style="margin-bottom: 12px;">Bu ay</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px 10px;">
        <div><div class="stat-lbl">Gönderilen</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700;" class="num">1.284</div></div>
        <div><div class="stat-lbl">Yanıt oranı</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700;" class="num">%64</div></div>
        <div><div class="stat-lbl">WhatsApp</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700;" class="num">%78</div></div>
        <div><div class="stat-lbl">SMS kredisi</div><div style="font-family: {QS}; font-size: 20px; font-weight: 700; color: #D9713C;" class="num">412</div></div>
      </div>""", 20)}

    {card(f"""<div style="display: flex; align-items: center; gap: 8px;">
        {icon("info", 15, "#78909F")}<span class="t-13" style="font-weight: 600;">Kanal entegrasyonları</span></div>
      <div class="t-13 t-sec" style="margin-top: 8px; line-height: 1.55;">WhatsApp, SMS ve e-posta ayrı servis katmanı üzerinden çalışır; sağlayıcı Ayarlar › Entegrasyonlar'dan seçilir.</div>""", 20)}
  </div>
</div>'''

open("Messages.dc.html", "w").write(shell(body, "Mesajlar", page_title("Mesajlar", "Kursiyer iletişim merkezi"), 1060))
print("Messages.dc.html")
