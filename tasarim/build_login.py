# -*- coding: utf-8 -*-
"""Virel Drive · Giriş ekranı."""
from common import icon, bare, btn, logo, logo_vertical, GRAD, QS

POINTS = ["Direksiyon planlaması çakışmasız", "Kursiyer süreci tek ekranda", "Tahsilat ve sınav takibi otomatik"]
pts = "".join(f'''<div style="display: flex; align-items: center; gap: 11px;">
  <span style="width: 22px; height: 22px; border-radius: 999px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center; color: #FFFFFF;">{icon("check", 13, sw=2.6)}</span>
  <span style="font-size: 14px; color: rgba(255,255,255,0.92);">{p}</span></div>''' for p in POINTS)

left = f'''
<div style="width: 620px; height: 900px; background: {GRAD}; padding: 56px 56px 48px; display: flex; flex-direction: column; color: #FFFFFF;">
  <div style="display: flex; align-items: baseline; gap: 9px;">{logo(30, dark="#FFFFFF")}
    <span style="font-family: {QS}; font-size: 17px; font-weight: 600; color: rgba(255,255,255,0.85);">drive</span></div>
  <div style="flex-grow: 1;"></div>
  <div style="font-family: {QS}; font-size: 38px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15;">Sürücü kursunuzun<br>operasyon merkezi.</div>
  <div style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.86); margin-top: 16px; max-width: 420px;">
    Ön kayıttan sertifikaya kadar tüm süreç tek yerde. Excel'e, deftere ve WhatsApp aramalarına gerek kalmadan.</div>
  <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 34px;">{pts}</div>
  <div style="flex-grow: 1;"></div>
  <div style="font-size: 13px; color: rgba(255,255,255,0.72);">Virel dikey SaaS ailesi · Vet · Eğitim · Drive</div>
</div>'''

def field(label, value, ic, focus=False, right=None):
    r = f'<span style="color: #78909F;">{icon(right, 17)}</span>' if right else ""
    return f'''<div style="display: flex; flex-direction: column; gap: 7px;">
      <span class="label">{label}</span>
      <div class="input {"input-focus" if focus else ""}" style="height: 46px; color: {"#0E2436" if focus else "#78909F"};">
        {icon(ic, 17, "#78909F")}<span style="flex-grow: 1;">{value}</span>{r}</div></div>'''

right = f'''
<div style="width: 820px; height: 900px; background: #FFFFFF; display: flex; align-items: center; justify-content: center;">
  <div style="width: 400px; display: flex; flex-direction: column;">
    <div style="font-family: {QS}; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Giriş yapın</div>
    <div class="t-sec" style="margin-top: 8px;">Kurs hesabınızla devam edin.</div>
    <div style="display: flex; flex-direction: column; gap: 18px; margin-top: 30px;">
      {field("E-posta", "ahmet@yildizsurucukursu.com", "mail", True)}
      {field("Şifre", "••••••••••", "lock", False, "eye")}
    </div>
    <div style="display: flex; align-items: center; gap: 10px; margin-top: 16px;">
      <span style="width: 18px; height: 18px; border-radius: 5px; border: 1px solid #CFDCE4;"></span>
      <span class="t-13 t-sec">Beni hatırla</span>
      <a class="t-13" style="margin-left: auto; font-weight: 600;">Şifremi unuttum</a>
    </div>
    <div class="btn btn-primary" style="height: 46px; margin-top: 24px;">Giriş yap</div>
    <div style="display: flex; align-items: center; gap: 12px; margin: 26px 0;">
      <div class="divider" style="flex-grow: 1;"></div><span class="t-13 t-muted">veya</span><div class="divider" style="flex-grow: 1;"></div>
    </div>
    <div class="btn btn-secondary" style="height: 46px;">{icon("badge-id", 17)}Eğitmen girişi</div>
    <div class="btn btn-ghost" style="height: 42px; margin-top: 8px;">{icon("user", 17)}Kursiyer girişi</div>
    <div class="t-13 t-muted" style="margin-top: 32px; line-height: 1.6;">
      Kursunuz henüz Virel Drive kullanmıyor mu? <a style="font-weight: 600;">Demo talep edin.</a></div>
  </div>
</div>'''

open("Login.dc.html", "w").write(bare(f'<div style="display: flex;">{left}{right}</div>', 1440, 900))
print("Login.dc.html")
