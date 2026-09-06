# -*- coding: utf-8 -*-
"""Virel Drive · Dashboard (operasyon özeti)."""
from common import (icon, shell, page_title, card, kpi, badge, btn, avatar, bar, seg,
                    person_avatar, QS, GRAD)

W = 1132  # sidebar sonrası içerik genişliği

# ---------------- Bugün ----------------
TODAY = [
    ("08:30", "10:00", "Ayşe Yılmaz",    "B",  "Direksiyon",     "Mehmet Öz",   "06 ABC 123", "done",  "Tamamlandı"),
    ("09:00", "10:30", "Burak Şen",      "B",  "Direksiyon",     "Ali Kaya",    "06 XYZ 456", "done",  "Tamamlandı"),
    ("10:00", "11:30", "Teorik · Trafik ve Çevre", "—", "Teorik Eğitim", "Selin Ak", "Derslik 2", "live", "Devam ediyor"),
    ("11:30", "13:00", "Zeynep Demir",   "B",  "Direksiyon",     "Ali Kaya",    "06 XYZ 456", "live",  "Devam ediyor"),
    ("13:30", "15:00", "Emre Aydın",     "B",  "Direksiyon",     "Mehmet Öz",   "06 ABC 123", "wait",  "Bekliyor"),
    ("14:00", "15:30", "Teorik · İlk Yardım", "—", "Teorik Eğitim", "Dr. Nur Ateş", "Derslik 1", "wait", "Bekliyor"),
    ("15:00", "16:30", "Merve Koç",      "B",  "Direksiyon",     "Hakan Tuna",  "06 DEF 789", "clash", "Çakışma riski"),
    ("16:00", "17:30", "Kerem Aksu",     "A2", "Direksiyon",     "Hakan Tuna",  "06 MOT 034", "wait",  "Bekliyor"),
    ("17:00", "18:30", "Deniz Ulu",      "B",  "Direksiyon",     "Mehmet Öz",   "06 ABC 123", "off",   "Gelmedi"),
]

STATE = {
    "done":  ("success", "#12A87C"), "live": ("brand", "#0067C4"), "wait": ("neutral", "#78909F"),
    "clash": ("danger",  "#D1453B"), "off":  ("warning", "#D9713C"),
}

def row(a, b, name, cls, kind, teacher, vehicle, st, label):
    tone, col = STATE[st]
    is_theory = kind == "Teorik Eğitim"
    ic = "book" if is_theory else "wheel"
    cls_html = "" if cls == "—" else f'<span class="t-13 t-muted">{cls} sınıfı</span><span class="t-13 t-muted">·</span>'
    return f'''
    <div style="display: grid; grid-template-columns: 62px 30px 1fr 148px; gap: 14px; align-items: center; padding: 13px 0; border-top: 1px solid #E7EEF2;">
      <div style="display: flex; flex-direction: column;">
        <span style="font-family: {QS}; font-size: 15px; font-weight: 600;" class="num">{a}</span>
        <span class="t-13 t-muted num">{b}</span>
      </div>
      <div style="width: 30px; height: 30px; border-radius: 8px; background: {"#E6F7F1" if is_theory else "#E8F1FB"}; color: {"#12A87C" if is_theory else "#0067C4"}; display: flex; align-items: center; justify-content: center;">{icon(ic, 16)}</div>
      <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
        <span style="font-size: 14px; font-weight: 600;">{name}</span>
        <div style="display: flex; align-items: center; gap: 7px;">{cls_html}
          <span class="t-13 t-sec">{teacher}</span><span class="t-13 t-muted">·</span><span class="t-13 t-sec num">{vehicle}</span>
        </div>
      </div>
      <div style="display: flex; justify-content: flex-end;">{badge(label, tone, dot=True)}</div>
    </div>'''

today = "".join(row(*t) for t in TODAY)

today_card = card(f'''
  <div style="display: flex; align-items: center; gap: 12px;">
    <span class="h-card">Bugün</span>
    <span class="t-13 t-muted">4 Eylül, Cuma · 9 ders</span>
    <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
      {seg(["Tümü", "Direksiyon", "Teorik"], "Tümü")}
      <a class="t-13" style="font-weight: 600;">Takvimi aç →</a>
    </div>
  </div>
  <div style="margin-top: 10px;">{today}</div>''', 20)

# ---------------- Dikkat gerektirenler ----------------
ALERTS = [
    ("danger",  "alert",  "Ders çakışması",      "Hakan Tuna 15:00'te iki derse atanmış.", "Çöz"),
    ("danger",  "wallet", "4 kursiyerin ödemesi gecikti", "Toplam ₺18.400 · en eskisi 12 gün.", "Listele"),
    ("warning", "folder", "3 kursiyerde evrak eksik", "Kayıt süreci tamamlanamıyor.", "Görüntüle"),
    ("warning", "book",   "2 kursiyer teorik devamsızlıkta sınırda", "Sınav başvurusu riskli.", "İncele"),
    ("brand",   "exam",   "3 kursiyer e-Sınav için hazır",  "Başvuru dönemi 12 Eylül'de kapanıyor.", "Başvur"),
    ("brand",   "wheel",  "5 kursiyerin direksiyon eğitimi bitmek üzere", "Sınav planlaması yapılmalı.", "Planla"),
    ("warning", "wrench", "06 DEF 789 bakımına 420 km kaldı", "Son bakım 14.870 km'de.", "Randevu"),
]

def alert(tone, ic, title, sub, action):
    col = {"danger": ("#FCECEB", "#D1453B"), "warning": ("#FDF0E8", "#D9713C"), "brand": ("#E8F1FB", "#0067C4")}[tone]
    return f'''
    <div style="display: flex; gap: 12px; align-items: flex-start; padding: 13px 0; border-top: 1px solid #E7EEF2;">
      <div style="width: 28px; height: 28px; border-radius: 8px; background: {col[0]}; color: {col[1]}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">{icon(ic, 15)}</div>
      <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0; flex-grow: 1;">
        <span style="font-size: 13.5px; font-weight: 600; line-height: 1.35;">{title}</span>
        <span class="t-13 t-sec">{sub}</span>
      </div>
      <a class="t-13" style="font-weight: 600; white-space: nowrap; padding-top: 2px;">{action}</a>
    </div>'''

alerts_card = card(f'''
  <div style="display: flex; align-items: center; gap: 10px;">
    <span class="h-card">Dikkat gerektirenler</span>
    <span class="badge b-danger"><span class="dot"></span>7</span>
    <a class="t-13" style="margin-left: auto; font-weight: 600;">Tümü</a>
  </div>
  <div style="margin-top: 8px;">{"".join(alert(*a) for a in ALERTS)}</div>''', 20)

# ---------------- KPI ----------------
kpis = "".join([
    kpi("Aktif kursiyer", "124", '<span style="color: #12A87C; display: flex; align-items: center; gap: 4px;">' + icon("arrow-up", 13) + 'bu ay +9</span>', ic="users"),
    kpi("Bugünkü direksiyon", "7", '<span class="t-muted">2 tamamlandı · 1 çakışma</span>', ic="wheel"),
    kpi("Bugünkü teorik", "2", '<span class="t-muted">48 kursiyer · %92 katılım</span>', ic="book"),
    kpi("Yaklaşan sınav", "7", '<span class="t-muted">e-Sınav 4 · direksiyon 3</span>', ic="exam"),
    kpi("Bekleyen tahsilat", "₺186.400", '<span style="color: #D1453B;">₺18.400 gecikmiş</span>', ic="wallet"),
])

# ---------------- Haftalık doluluk ----------------
DAYS = [("Pzt", 82), ("Sal", 91), ("Çar", 74), ("Per", 88), ("Cum", 96), ("Cmt", 68), ("Paz", 24)]
bars = "".join(f'''<div style="display: flex; flex-direction: column; align-items: center; gap: 8px; flex-grow: 1;">
   <div style="height: 96px; width: 100%; display: flex; align-items: flex-end;">
     <div style="width: 100%; height: {p}%; border-radius: 6px 6px 3px 3px; background: {"#0067C4" if p >= 88 else ("#CFE2F7" if p < 60 else "#5AA9F0")};"></div>
   </div>
   <span class="t-13 t-muted">{d}</span></div>''' for d, p in DAYS)

week_card = card(f'''
  <div style="display: flex; align-items: center; gap: 10px;">
    <span class="h-card">Bu hafta araç doluluğu</span>
    <span class="t-13 t-muted">12 araç · 318 saat</span>
    <span style="margin-left: auto; font-family: {QS}; font-size: 20px; font-weight: 700;" class="num">%75</span>
  </div>
  <div style="display: flex; gap: 12px; margin-top: 16px; align-items: flex-end;">{bars}</div>
  <div style="margin-top: 14px; padding-top: 13px; border-top: 1px solid #E7EEF2; display: flex; align-items: center; gap: 8px;">
    {icon("info", 15, "#78909F")}<span class="t-13 t-sec">Salı 14:00–17:00 aralığında araç kullanımı yoğun; bu hafta 18 ders boşluğu var.</span>
  </div>''', 20)

# ---------------- Tahsilat ----------------
def money_row(label, value, sub, color="#0E2436"):
    return f'''<div style="display: flex; align-items: baseline; gap: 10px; padding: 11px 0; border-top: 1px solid #E7EEF2;">
      <span class="t-13 t-sec" style="width: 128px; flex-shrink: 0;">{label}</span>
      <span style="font-family: {QS}; font-size: 17px; font-weight: 600; color: {color};" class="num">{value}</span>
      <span class="t-13 t-muted" style="margin-left: auto;">{sub}</span></div>'''

fin_card = card(f'''
  <div style="display: flex; align-items: center; gap: 10px;">
    <span class="h-card">Tahsilat</span>
    <a class="t-13" style="margin-left: auto; font-weight: 600;">Finans →</a>
  </div>
  <div style="margin-top: 8px;">
    {money_row("Bugün", "₺24.750", "6 tahsilat")}
    {money_row("Bu ay", "₺612.300", "hedefin %78'i")}
    {money_row("Bekleyen", "₺186.400", "42 taksit")}
    {money_row("Gecikmiş", "₺18.400", "4 kursiyer", "#D1453B")}
  </div>
  <div style="margin-top: 12px;">{bar(78, "bar-grad", 8)}</div>
  <div style="display: flex; justify-content: space-between; margin-top: 7px;">
    <span class="t-13 t-muted">Aylık hedef ₺785.000</span>
    <span class="t-13 t-sec" style="font-weight: 600;">%78</span>
  </div>''', 20)

# ---------------- Üst bant ----------------
QUICK = [("users", "Kursiyer"), ("wallet", "Tahsilat"), ("inbox-in", "Ön kayıt"), ("exam", "Sınav")]
quick = "".join(f'<div class="btn btn-secondary btn-sm">{icon(i, 15)}{l}</div>' for i, l in QUICK)

top = f'''
<div style="display: flex; align-items: flex-end; gap: 20px;">
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <span class="h-page">İyi akşamlar, Ahmet.</span>
    <span class="t-sec">Kursunuzun bugünkü operasyon özeti.</span>
  </div>
  <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
    {quick}
    <div class="btn btn-primary btn-sm">{icon("plus", 15)}Direksiyon dersi</div>
  </div>
</div>'''

body = f'''
{top}
<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px;">{kpis}</div>
<div style="display: grid; grid-template-columns: 1.42fr 1fr; gap: 16px; align-items: start;">
  {today_card}
  {alerts_card}
</div>
<div style="display: grid; grid-template-columns: 1.42fr 1fr; gap: 16px; align-items: start;">
  {week_card}
  {fin_card}
</div>'''

html = shell(body, "Dashboard", page_title("Dashboard", "4 Eylül 2026 · Yıldız Sürücü Kursu"), 1180)
open("Main.dc.html", "w").write(html)
print("Main.dc.html", len(html))
