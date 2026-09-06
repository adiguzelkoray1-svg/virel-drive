# -*- coding: utf-8 -*-
"""Virel Drive · Yeni direksiyon dersi (uygunluk kontrollü modal)."""
from common import icon, bare, card, badge, btn, avatar, QS, CSS

def field(label, value, ic=None, w="1fr", state="", hint=None):
    i = icon(ic, 16, "#78909F") if ic else ""
    h = f'<span class="hint">{hint}</span>' if hint else ""
    col = "#0E2436" if state != "ph" else "#78909F"
    cls = "input input-focus" if state == "focus" else "input"
    return f'''<div style="display: flex; flex-direction: column; gap: 6px; grid-column: span {w};">
      <span class="label">{label}</span>
      <div class="{cls}" style="color: {col};">{i}<span style="flex-grow: 1;">{value}</span>{icon("chev-down", 15, "#78909F") if ic in ("user", "badge-id", "car", None) else ""}</div>{h}</div>'''

def check(state, text, sub=""):
    m = {"ok": ("check-circle", "#12A87C", "#E6F7F1"), "bad": ("x-circle", "#D1453B", "#FCECEB"), "warn": ("alert", "#D9713C", "#FDF0E8")}[state]
    s = f'<div class="t-13 t-sec" style="margin-top: 2px; line-height: 1.45;">{sub}</div>' if sub else ""
    return f'''<div style="display: flex; gap: 10px; align-items: flex-start; padding: 11px 0; border-top: 1px solid #E7EEF2;">
      <span style="width: 22px; height: 22px; border-radius: 999px; background: {m[2]}; color: {m[1]}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">{icon(m[0], 14, sw=2.2)}</span>
      <div style="min-width: 0;"><div style="font-size: 13.5px; font-weight: 600;">{text}</div>{s}</div></div>'''

modal = f'''
<div class="card" style="width: 720px; border-radius: 22px; box-shadow: 0 30px 60px -22px rgba(14,36,54,.34); overflow: hidden;">
  <div style="padding: 22px 24px 18px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #E7EEF2;">
    <div style="width: 34px; height: 34px; border-radius: 9px; background: #E8F1FB; color: #0067C4; display: flex; align-items: center; justify-content: center;">{icon("wheel", 18)}</div>
    <div style="display: flex; flex-direction: column;">
      <span class="h-card">Yeni direksiyon dersi</span>
      <span class="t-13 t-muted">Eğitmen, araç ve kursiyer uygunluğu anlık kontrol edilir</span>
    </div>
    <div class="ibtn ibtn-ghost" style="margin-left: auto;">{icon("x", 18)}</div>
  </div>

  <div style="padding: 20px 24px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
    {field("Kursiyer", "Ayşe Yılmaz · 8/14 saat", "user", "2")}
    {field("Ehliyet sınıfı", "B", None, "1")}
    {field("Eğitmen", "Mehmet Öz", "badge-id", "1")}
    {field("Araç", "06 ABC 123 · Clio", "car", "1")}
    {field("Ders türü", "Şehir içi sürüş", None, "1")}
    {field("Tarih", "8 Eylül 2026, Salı", "calendar", "1")}
    {field("Başlangıç", "14:00", "clock", "1", "focus")}
    {field("Bitiş", "15:30", "clock", "1", "", "90 dk · mevzuat ayarından gelir")}
    <div style="grid-column: span 3; display: flex; flex-direction: column; gap: 6px;">
      <span class="label">Not <span class="t-muted" style="font-weight: 400;">(opsiyonel)</span></span>
      <div class="input" style="height: 68px; align-items: flex-start; padding: 11px 12px; color: #78909F;">Park ve yokuşta kalkış çalışılacak.</div>
    </div>
  </div>

  <div style="padding: 0 24px 20px;">
    <div style="border: 1px solid #E7EEF2; border-radius: 12px; padding: 4px 16px 12px; background: #FFFFFF;">
      <div style="display: flex; align-items: center; gap: 8px; padding: 12px 0 2px;">
        <span class="h-card" style="font-size: 14px;">Uygunluk</span>
        {badge("Planlanabilir", "success", dot=True)}
        <span class="t-13 t-muted" style="margin-left: auto;">3 kontrolün 3'ü geçti</span>
      </div>
      {check("ok", "Eğitmen müsait", "Mehmet Öz'ün 14:00–15:30 aralığında dersi yok.")}
      {check("ok", "Araç müsait", "06 ABC 123 aynı saatte başka derse atanmamış.")}
      {check("ok", "Kursiyer müsait", "Ayşe Yılmaz'ın günlük ders limiti aşılmıyor (2 saat / gün).")}
      {check("warn", "Bilgi", "Bu ders sonunda 14 saatlik zorunlu direksiyon eğitiminin 9,5 saati tamamlanır.")}
    </div>
  </div>

  <div style="padding: 16px 24px; border-top: 1px solid #E7EEF2; background: #F3F7F9; display: flex; align-items: center; gap: 10px;">
    <div class="btn btn-ghost btn-sm">{icon("clock", 15)}En uygun saatleri göster</div>
    <div style="margin-left: auto; display: flex; gap: 10px;">
      {btn("Vazgeç", "secondary", None, "btn-sm")}
      {btn("Dersi oluştur", "primary", "check", "btn-sm")}
    </div>
  </div>
</div>'''

body = f'''
<div style="width: 1440px; height: 900px; background: rgba(14,36,54,0.34); display: flex; align-items: center; justify-content: center;">
  {modal}
</div>'''

open("NewLesson.dc.html", "w").write(bare(body, 1440, 900))
print("NewLesson.dc.html")
