# -*- coding: utf-8 -*-
"""Virel Drive · Raporlar / Kurs performans merkezi."""
from common import icon, shell, page_title, card, badge, btn, avatar, bar, seg, QS

def stat(label, value, sub, c="#0E2436"):
    return card(f'<div class="stat-lbl">{label}</div><div class="kpi" style="margin: 8px 0 4px; color: {c};">{value}</div><div class="t-13 t-muted">{sub}</div>', 18)

# --- kayıt hunisi ---
FUNNEL = [("Aday (ön kayıt)", 214, 100), ("Bilgi verildi", 148, 69), ("Fiyat gönderildi", 96, 45),
          ("Kayıt görüşmesi", 62, 29), ("Kayıt oldu", 47, 22)]
funnel = "".join(f'''<div style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid #E7EEF2;">
  <span class="t-13" style="width: 138px;">{n}</span>
  <div style="flex-grow: 1;"><div class="bar" style="height: 18px; border-radius: 6px;"><i style="width: {p}%; border-radius: 6px; background: {"#0067C4" if i == 0 else ("#3E8FD6" if i < 3 else "#12A87C")};"></i></div></div>
  <span class="t-13 num" style="width: 44px; text-align: right; font-weight: 600;">{v}</span>
  <span class="t-13 t-muted num" style="width: 38px; text-align: right;">%{p}</span></div>''' for i, (n, v, p) in enumerate(FUNNEL))

# --- sınıf dağılımı ---
CLS = [("B", 86, "#0067C4"), ("A2", 14, "#00A9BF"), ("C", 12, "#2ED3A8"), ("D", 7, "#78909F"), ("A", 5, "#CFDCE4")]
total = sum(c[1] for c in CLS)
segs = "".join(f'<div style="width: {v / total * 100}%; background: {c};"></div>' for _, v, c in CLS)
legend = "".join(f'''<div style="display: flex; align-items: center; gap: 8px; padding: 8px 0; border-top: 1px solid #E7EEF2;">
  <span style="width: 10px; height: 10px; border-radius: 3px; background: {c};"></span>
  <span class="t-13">{n} sınıfı</span>
  <span class="t-13 t-sec num" style="margin-left: auto; font-weight: 600;">{v}</span>
  <span class="t-13 t-muted num" style="width: 40px; text-align: right;">%{round(v / total * 100)}</span></div>''' for n, v, c in CLS)

# --- eğitmen performansı ---
PERF = [("Ali Kaya", 13, "148 saat", "%81", "%95", "4,8"), ("Mehmet Öz", 11, "132 saat", "%74", "%85", "4,6"),
        ("Hakan Tuna", 9, "104 saat", "%64", "%72", "4,3"), ("Serkan Yıldız", 6, "78 saat", "%70", "%55", "4,5")]
PC = "minmax(150px,1fr) 96px 108px 128px 128px 92px"
perf = "".join(f'''<div style="display: grid; grid-template-columns: {PC}; gap: 12px; align-items: center; padding: 12px 4px; border-top: 1px solid #E7EEF2;">
  <div style="display: flex; align-items: center; gap: 10px;">{avatar(n, 30, 11)}<span class="td" style="font-weight: 600;">{n}</span></div>
  <span class="td num">{k} kursiyer</span><span class="td num">{h}</span>
  <span class="td num" style="font-weight: 600; color: {"#12A87C" if float(s[1:]) >= 70 else "#D9713C"};">{s}</span>
  <div style="display: flex; flex-direction: column; gap: 4px;">{bar(int(u[1:]), "", 5)}<span class="t-13 t-muted num">{u} doluluk</span></div>
  <span style="display: flex; align-items: center; gap: 5px;" class="t-13 num">{icon("star", 14, "#D9713C")}{r}</span></div>''' for n, k, h, s, u, r in PERF)

# --- saatlik yoğunluk ısı haritası ---
HOURS = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18"]
DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
HEAT = [
 [3,4,4,3,1,3,4,4,3,2,1],[3,4,4,4,1,4,5,5,4,3,1],[2,3,4,3,1,3,4,4,3,2,1],
 [3,4,5,4,1,4,5,4,3,2,1],[4,5,5,4,1,4,5,5,4,3,2],[4,5,5,5,2,5,5,4,3,2,1],[0,1,2,2,0,2,2,1,1,0,0]]
SC = {0: "#F3F7F9", 1: "#E8F1FB", 2: "#CFE2F7", 3: "#8FBEEB", 4: "#3E8FD6", 5: "#0067C4"}
heat = ""
for di, d in enumerate(DAYS):
    cells = "".join(f'<div style="height: 22px; border-radius: 4px; background: {SC[HEAT[di][hi]]};"></div>' for hi in range(len(HOURS)))
    heat += f'<div style="display: grid; grid-template-columns: 40px repeat({len(HOURS)}, 1fr); gap: 4px; align-items: center;"><span class="t-13 t-muted">{d}</span>{cells}</div>'
hlabels = '<div style="display: grid; grid-template-columns: 40px repeat(11, 1fr); gap: 4px; margin-top: 6px;"><span></span>' + "".join(f'<span class="t-13 t-muted num" style="text-align: center;">{h}</span>' for h in HOURS) + '</div>'

QUESTIONS = [
    ("badge-id", "Hangi eğitmen daha yoğun?", "Ali Kaya · %95 doluluk"),
    ("car", "Hangi araç daha çok kullanılıyor?", "06 XYZ 456 · %78"),
    ("clock", "Hangi saatlerde boşluk var?", "Salı ve Perşembe 12:00–13:00"),
    ("users", "Hangi sınıftan çok kayıt geliyor?", "B sınıfı · %70"),
    ("exam", "Hangi sınavda başarı düşük?", "Direksiyon · %68"),
    ("wallet", "Hangi ödemeler gecikti?", "4 kursiyer · ₺18.400"),
    ("funnel", "Hangi adaylar kaybedildi?", "Bu ay 9 aday · en sık 'fiyat'"),
    ("wheel", "Hangi kursiyerin süreci gecikiyor?", "6 kursiyer 45 günü aştı"),
]
qs = "".join(f'''<a style="display: flex; align-items: center; gap: 11px; padding: 12px 0; border-top: 1px solid #E7EEF2; color: inherit;">
  <span style="width: 28px; height: 28px; border-radius: 8px; background: #F3F7F9; color: #42586A; display: flex; align-items: center; justify-content: center;">{icon(i, 15)}</span>
  <span class="t-13" style="font-weight: 600;">{q}</span>
  <span class="t-13 t-sec" style="margin-left: auto;">{a}</span>
  <span style="color: #78909F;">{icon("chev-right", 15)}</span></a>''' for i, q, a in QUESTIONS)

body = f'''
<div style="display: flex; align-items: flex-end; gap: 16px;">
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <span class="h-page">Kurs performans merkezi</span>
    <span class="t-sec">1 Mart – 6 Eylül 2026 · tüm veriler kurs bazında</span>
  </div>
  <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
    {seg(["6 ay", "Yıl", "Özel"], "6 ay")}
    {btn("PDF", "secondary", "download", "btn-sm")}
    {btn("Excel", "secondary", "download", "btn-sm")}
  </div>
</div>

<div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px;">
  {stat("Toplam kursiyer", "187", "124 aktif · 63 mezun")}
  {stat("Kayıt dönüşümü", "%22", "214 adaydan 47 kayıt")}
  {stat("e-Sınav başarısı", "%81", "74 sınav", "#12A87C")}
  {stat("Direksiyon başarısı", "%68", "41 sınav", "#D9713C")}
  {stat("Kursiyer başına gelir", "₺29.400", "ortalama paket")}
  {stat("Tahsilat oranı", "%87", "planlanan / tahsil edilen")}
</div>

{card(f"""<div style="display: flex; align-items: center; gap: 10px; padding-bottom: 4px;">
    <span class="h-card">Tek ekranda cevaplar</span>
    <span class="t-13 t-muted">yönetim soruları · tıklayınca ilgili rapora gider</span></div>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 32px;">{qs}</div>""", 20)}

<div style="display: grid; grid-template-columns: 1.25fr 1fr; gap: 16px; align-items: start;">
  {card(f'<div class="h-card" style="margin-bottom: 6px;">Kayıt hunisi</div><div class="t-13 t-muted" style="margin-bottom: 6px;">Son 6 ay · adaydan kayda</div>{funnel}', 20)}
  {card(f'''<div class="h-card" style="margin-bottom: 14px;">Ehliyet sınıfı dağılımı</div>
    <div style="display: flex; height: 14px; border-radius: 999px; overflow: hidden; gap: 2px;">{segs}</div>
    <div style="margin-top: 14px;">{legend}</div>''', 20)}
</div>

<div style="display: grid; grid-template-columns: 1.25fr 1fr; gap: 16px; align-items: start;">
  {card(f"""<div style="display: flex; align-items: center; gap: 10px; padding-bottom: 8px;">
      <span class="h-card">Eğitmen performansı</span><span class="t-13 t-muted">son 6 ay</span></div>
    <div style="display: grid; grid-template-columns: {PC}; gap: 12px; padding: 0 4px 8px;">
      {"".join(f'<div class="th">{h}</div>' for h in ["Eğitmen", "Kursiyer", "Ders saati", "Sınav başarısı", "Doluluk", "Puan"])}
    </div>{perf}""", 20)}

  {card(f"""<div style="display: flex; align-items: center; gap: 10px;">
      <span class="h-card">Ders yoğunluğu</span><span class="t-13 t-muted">gün / saat</span></div>
    <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 14px;">{heat}</div>
    {hlabels}
    <div style="margin-top: 14px; padding-top: 13px; border-top: 1px solid #E7EEF2; display: flex; align-items: center; gap: 8px;">
      {icon("info", 15, "#78909F")}<span class="t-13 t-sec">Cuma 10:00–11:00 en yoğun; Salı ve Perşembe öğle saatlerinde 18 boş slot var.</span>
    </div>""", 20)}
</div>'''

open("Reports.dc.html", "w").write(shell(body, "Raporlar", page_title("Raporlar", "Kurs performans merkezi"), 1360))
print("Reports.dc.html")
