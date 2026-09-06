# -*- coding: utf-8 -*-
"""Virel Drive · Landing page (SaaS vitrin)."""
from common import icon, bare, badge, btn, avatar, bar, logo, logo_mark, GRAD, QS, app_icon

def h(size, text, color="#0E2436", weight=700, ls="-0.02em", mb=0):
    return f'<div style="font-family: {QS}; font-size: {size}px; font-weight: {weight}; letter-spacing: {ls}; line-height: 1.15; color: {color}; margin-bottom: {mb}px;">{text}</div>'

def eyebrow(text, color="#00559F"):
    return f'<div style="font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: {color};">{text}</div>'

def lead(text, color="#42586A", size=17, mw=620):
    return f'<div style="font-size: {size}px; line-height: 1.65; color: {color}; max-width: {mw}px;">{text}</div>'

def section(inner, bg="#FFFFFF", pad="96px 0"):
    return f'<section style="background: {bg}; padding: {pad};"><div style="width: 1140px; margin: 0 auto;">{inner}</div></section>'

# ---------------- nav ----------------
LINKS = ["Ürün", "Modüller", "Mobil", "Fiyatlandırma", "Virel ekosistemi"]
nav = f'''
<div style="height: 72px; border-bottom: 1px solid #E7EEF2; background: rgba(255,255,255,0.9); display: flex; align-items: center;">
  <div style="width: 1140px; margin: 0 auto; display: flex; align-items: center; gap: 34px;">
    <div style="display: flex; align-items: baseline; gap: 8px;">{logo(26)}<span style="font-family: {QS}; font-size: 15px; font-weight: 600; color: #42586A;">drive</span></div>
    <div style="display: flex; gap: 26px;">{"".join(f'<span style="font-size: 14px; font-weight: 500; color: #42586A;">{l}</span>' for l in LINKS)}</div>
    <div style="margin-left: auto; display: flex; gap: 10px; align-items: center;">
      {btn("Giriş yap", "secondary", None, "btn-sm")}{btn("Demo talep et", "primary", None, "btn-sm")}
    </div>
  </div>
</div>'''

# ---------------- hero mockup ----------------
def mini_kpi(l, v, s):
    return f'''<div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 10px; padding: 12px 14px;">
      <div style="font-size: 11px; font-weight: 600; color: #78909F;">{l}</div>
      <div style="font-family: {QS}; font-size: 20px; font-weight: 700; margin-top: 4px;" class="num">{v}</div>
      <div style="font-size: 11px; color: #78909F; margin-top: 2px;">{s}</div></div>'''

def mini_row(t, n, m, tone):
    c = {"b": ("#E8F1FB", "#0067C4"), "g": ("#E6F7F1", "#12A87C"), "r": ("#FCECEB", "#D1453B")}[tone]
    return f'''<div style="display: flex; align-items: center; gap: 10px; padding: 9px 0; border-top: 1px solid #E7EEF2;">
      <span style="font-family: {QS}; font-size: 12px; font-weight: 600; width: 38px;" class="num">{t}</span>
      <span style="width: 22px; height: 22px; border-radius: 6px; background: {c[0]}; color: {c[1]}; display: flex; align-items: center; justify-content: center;">{icon("wheel", 12)}</span>
      <span style="font-size: 12px; font-weight: 600;">{n}</span>
      <span style="font-size: 11px; color: #78909F; margin-left: auto;">{m}</span></div>'''

mockup = f'''
<div style="width: 1000px; border-radius: 18px; border: 1px solid #E7EEF2; background: #F4F7F8; box-shadow: 0 40px 90px -40px rgba(14,36,54,.45); overflow: hidden;">
  <div style="height: 38px; background: #FFFFFF; border-bottom: 1px solid #E7EEF2; display: flex; align-items: center; padding: 0 14px; gap: 7px;">
    <span style="width: 9px; height: 9px; border-radius: 999px; background: #E7EEF2;"></span>
    <span style="width: 9px; height: 9px; border-radius: 999px; background: #E7EEF2;"></span>
    <span style="width: 9px; height: 9px; border-radius: 999px; background: #E7EEF2;"></span>
    <div style="margin: 0 auto; font-size: 11px; color: #78909F;">yildizsurucukursu.virel.com.tr</div>
  </div>
  <div style="display: flex; height: 460px;">
    <div style="width: 168px; background: #FFFFFF; border-right: 1px solid #E7EEF2; padding: 14px 10px; flex-shrink: 0;">
      <div style="padding: 2px 6px 14px;">{logo(19)}</div>
      {"".join(f'''<div style="display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 8px; border-radius: 6px; font-size: 11.5px; font-weight: {600 if i == 0 else 500}; color: {"#0E2436" if i == 0 else "#42586A"}; background: {"#E8F1FB" if i == 0 else "transparent"};">
        {icon(ic, 14, "#0067C4" if i == 0 else "#78909F")}{l}</div>''' for i, (ic, l) in enumerate(
        [("home", "Dashboard"), ("calendar", "Takvim"), ("wheel", "Direksiyon"), ("book", "Teorik"), ("exam", "Sınavlar"),
         ("users", "Kursiyerler"), ("car", "Araçlar"), ("wallet", "Finans"), ("funnel", "CRM"), ("chart", "Raporlar")]))}
    </div>
    <div style="flex-grow: 1; padding: 18px; display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; align-items: baseline; gap: 10px;">
        <span style="font-family: {QS}; font-size: 18px; font-weight: 700;">İyi akşamlar, Ahmet.</span>
        <span style="font-size: 12px; color: #78909F;">Kursunuzun bugünkü operasyon özeti.</span></div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
        {mini_kpi("Aktif kursiyer", "124", "bu ay +9")}{mini_kpi("Bugünkü ders", "7", "2 tamamlandı")}
        {mini_kpi("Yaklaşan sınav", "7", "e-Sınav 4")}{mini_kpi("Bekleyen tahsilat", "₺186.400", "4 gecikmiş")}
      </div>
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 12px; flex-grow: 1;">
        <div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 12px; padding: 14px;">
          <div style="font-family: {QS}; font-size: 13px; font-weight: 600;">Bugün</div>
          {mini_row("08:30", "Ayşe Yılmaz", "Mehmet · 06 ABC 123", "g")}
          {mini_row("10:00", "Teorik · Trafik", "Derslik 2 · 24 kişi", "g")}
          {mini_row("11:30", "Zeynep Demir", "Ali · 06 XYZ 456", "b")}
          {mini_row("13:30", "Emre Aydın", "Mehmet · 06 ABC 123", "b")}
          {mini_row("15:00", "Merve Koç", "Çakışma riski", "r")}
        </div>
        <div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 12px; padding: 14px;">
          <div style="display: flex; align-items: center; gap: 7px;">
            <span style="font-family: {QS}; font-size: 13px; font-weight: 600;">Dikkat gerektirenler</span>
            <span style="font-size: 10px; font-weight: 700; color: #D1453B; background: #FCECEB; border-radius: 999px; padding: 1px 6px;">7</span></div>
          {"".join(f'''<div style="display: flex; gap: 8px; padding: 9px 0; border-top: 1px solid #E7EEF2;">
            <span style="width: 20px; height: 20px; border-radius: 6px; background: {bg}; color: {fg}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">{icon(ic, 11)}</span>
            <span style="font-size: 11.5px; font-weight: 600; line-height: 1.35;">{t}</span></div>'''
            for ic, t, bg, fg in [("alert", "Ders çakışması · Hakan Tuna 15:00", "#FCECEB", "#D1453B"),
                                  ("wallet", "4 kursiyerin ödemesi gecikti", "#FCECEB", "#D1453B"),
                                  ("folder", "3 kursiyerde evrak eksik", "#FDF0E8", "#D9713C"),
                                  ("exam", "3 kursiyer e-Sınav için hazır", "#E8F1FB", "#0067C4"),
                                  ("wrench", "06 DEF 789 bakımına 420 km", "#FDF0E8", "#D9713C")])}
        </div>
      </div>
    </div>
  </div>
</div>'''

hero = f'''
<section style="background: linear-gradient(180deg, #FFFFFF 0%, #F4F7F8 100%); padding: 92px 0 0;">
  <div style="width: 1140px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; text-align: center;">
    <div style="display: inline-flex; align-items: center; gap: 8px; height: 30px; padding: 0 14px; border-radius: 999px; background: #E8F1FB; color: #00559F; font-size: 13px; font-weight: 600;">
      {icon("wheel", 15)}Virel dikey SaaS ailesinin yeni üyesi</div>
    {h(56, "Driving schools, simplified.", "#0E2436", 700, "-0.03em", 0)}
    <div style="font-family: {QS}; font-size: 30px; font-weight: 600; letter-spacing: -0.02em; color: #42586A; margin-top: 14px;">Sürücü kursunuzun tüm operasyonu. Tek yerde.</div>
    <div style="font-size: 18px; line-height: 1.7; color: #42586A; max-width: 680px; margin-top: 20px;">
      Kursiyerlerden direksiyon derslerine, sınavlardan ödemelere kadar tüm süreci Virel Drive ile yönetin.</div>
    <div style="display: flex; gap: 12px; margin-top: 30px;">
      <div class="btn btn-primary" style="height: 48px; padding: 0 24px; font-size: 15px;">Demo talep et</div>
      <div class="btn btn-secondary" style="height: 48px; padding: 0 24px; font-size: 15px;">Giriş yap</div>
    </div>
    <div style="font-size: 13px; color: #78909F; margin-top: 14px;">Kurulum ücreti yok · 14 gün deneme · verileriniz kurs bazında izole</div>
    <div style="margin-top: 56px;">{mockup}</div>
  </div>
</section>'''

# ---------------- problem ----------------
PROB = [("Ders planı WhatsApp'ta", "Kim, hangi araçla, ne zaman? Cevap üç ayrı sohbette."),
        ("Kursiyerin durumu kafada", "Teorik bitti mi, sınav hakkı kaldı mı — herkes eğitmeni arıyor."),
        ("Ödeme defterde", "Kim ne kadar ödedi, kimin taksiti gecikti belli değil."),
        ("Adaylar unutuluyor", "Fiyat sorup dönmeyen aday, kaybedilmiş kayıttır.")]
problem = section(f'''
  {eyebrow("Bugün nasıl yönetiliyor")}
  <div style="margin-top: 14px;">{h(38, "Excel, defter ve WhatsApp bir yere kadar.")}</div>
  <div style="margin-top: 16px;">{lead("Sürücü kursu operasyonu birbirine bağlı bir zincirdir. Zincirin bir halkası ayrı bir yerde tutulduğunda, tamamı görünmez olur.")}</div>
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 44px;">
    {"".join(f"""<div style="padding-top: 20px; border-top: 2px solid #E7EEF2;">
      <div style="font-family: {QS}; font-size: 17px; font-weight: 600;">{t}</div>
      <div style="font-size: 14px; line-height: 1.6; color: #42586A; margin-top: 8px;">{d}</div></div>""" for t, d in PROB)}
  </div>''', "#FFFFFF")

# ---------------- modüller ----------------
MODULES = [
    ("users", "Kursiyer yönetimi", "Ön kayıttan mezuniyete kadar tek dosya: evrak, teorik, sınav, direksiyon, ödeme ve zaman çizelgesi."),
    ("wheel", "Direksiyon planlama", "Eğitmen, araç ve kursiyer uygunluğu aynı anda kontrol edilir. Çakışan ders oluşturulamaz."),
    ("exam", "Sınav yönetimi", "e-Sınav ve direksiyon sınavı süreçleri ayrı ayrı; kalan sınav hakkı her zaman görünür."),
    ("wallet", "Finans ve tahsilat", "Kursiyer bazında ödeme planı, taksit takibi, geciken tahsilatlar ve gider yönetimi."),
    ("car", "Araç ve maliyet", "Plaka bazında kilometre, bakım, muayene, sigorta ve km başına maliyet."),
    ("funnel", "CRM ve ön kayıt", "Aday hunisi, takip hatırlatmaları ve kaynak analizi. Aday kaybetmeyi bırakın."),
]
modules = section(f'''
  {eyebrow("Modüller")}
  <div style="margin-top: 14px;">{h(38, "Operasyonun tamamı, tek ekosistemde.")}</div>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 44px;">
    {"".join(f"""<div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 16px; padding: 26px;">
      <div style="width: 40px; height: 40px; border-radius: 11px; background: #E8F1FB; color: #0067C4; display: flex; align-items: center; justify-content: center;">{icon(i, 21)}</div>
      <div style="font-family: {QS}; font-size: 18px; font-weight: 600; margin-top: 18px;">{t}</div>
      <div style="font-size: 14px; line-height: 1.65; color: #42586A; margin-top: 8px;">{d}</div></div>""" for i, t, d in MODULES)}
  </div>''', "#F4F7F8")

# ---------------- planlama vurgusu ----------------
planning = section(f'''
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;">
    <div>
      {eyebrow("Direksiyon planlama")}
      <div style="margin-top: 14px;">{h(34, "Çakışan ders diye bir şey kalmaz.")}</div>
      <div style="margin-top: 16px;">{lead("Ders oluştururken eğitmen, araç ve kursiyer uygunluğu aynı anda kontrol edilir. Çakışma varsa sistem dersi oluşturmadan önce nedenini açıkça söyler.", mw=460)}</div>
      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 26px;">
        {"".join(f"""<div style="display: flex; align-items: center; gap: 10px;">
          <span style="width: 22px; height: 22px; border-radius: 999px; background: #E6F7F1; color: #12A87C; display: flex; align-items: center; justify-content: center;">{icon("check", 13, sw=2.6)}</span>
          <span style="font-size: 15px; color: #0E2436;">{t}</span></div>"""
          for t in ["Gün, hafta, ay · eğitmen, araç, kursiyer görünümü", "En uygun saat önerileri", "Ders sonu eğitmen değerlendirmesi", "Kalan eğitim saati otomatik hesap"])}
      </div>
    </div>
    <div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 16px; padding: 22px; box-shadow: 0 30px 60px -34px rgba(14,36,54,.4);">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="width: 30px; height: 30px; border-radius: 8px; background: #E8F1FB; color: #0067C4; display: flex; align-items: center; justify-content: center;">{icon("wheel", 16)}</span>
        <span style="font-family: {QS}; font-size: 15px; font-weight: 600;">Yeni direksiyon dersi</span></div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px;">
        {"".join(f"""<div><div style="font-size: 12px; font-weight: 600; color: #42586A;">{l}</div>
          <div class="input" style="height: 38px; margin-top: 5px; font-size: 13px; color: #0E2436;">{v}</div></div>"""
          for l, v in [("Kursiyer", "Ayşe Yılmaz"), ("Eğitmen", "Mehmet Öz"), ("Araç", "06 ABC 123"), ("Saat", "14:00 – 15:30")])}
      </div>
      <div style="margin-top: 18px; border: 1px solid #E7EEF2; border-radius: 12px; padding: 4px 14px 12px;">
        <div style="display: flex; align-items: center; gap: 8px; padding: 12px 0 4px;">
          <span style="font-size: 13px; font-weight: 600;">Uygunluk</span>{badge("Planlanabilir", "success", dot=True)}</div>
        {"".join(f"""<div style="display: flex; align-items: center; gap: 9px; padding: 9px 0; border-top: 1px solid #E7EEF2;">
          <span style="width: 20px; height: 20px; border-radius: 999px; background: #E6F7F1; color: #12A87C; display: flex; align-items: center; justify-content: center;">{icon("check", 12, sw=2.6)}</span>
          <span style="font-size: 13px;">{t}</span></div>""" for t in ["Eğitmen müsait", "Araç müsait", "Kursiyer müsait"])}
      </div>
    </div>
  </div>''', "#FFFFFF")

# ---------------- mobil ----------------
mobile = section(f'''
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;">
    <div style="display: flex; gap: 18px; justify-content: center;">
      {"".join(f'''<div style="width: 200px; border-radius: 24px; border: 1px solid #E7EEF2; background: #FFFFFF; padding: 16px; box-shadow: 0 30px 60px -34px rgba(14,36,54,.4);">
        <div style="font-family: {QS}; font-size: 13px; font-weight: 700; color: #78909F;">{cap}</div>
        <div style="margin-top: 12px; border-radius: 14px; background: {bg}; padding: 14px; min-height: 210px; color: {fg};">{inner}</div></div>'''
        for cap, bg, fg, inner in [
          ("Kursiyer", GRAD, "#FFFFFF", f'''<div style="font-family: {QS}; font-size: 16px; font-weight: 700;">Merhaba Ayşe 👋</div>
             <div style="font-size: 12px; opacity: .85; margin-top: 4px;">Ehliyet sürecin</div>
             <div style="font-family: {QS}; font-size: 30px; font-weight: 700; margin-top: 6px;">%72</div>
             <div style="height: 6px; border-radius: 999px; background: rgba(255,255,255,.3); margin-top: 10px;"><div style="width: 72%; height: 100%; background: #FFFFFF; border-radius: 999px;"></div></div>
             <div style="font-size: 12px; margin-top: 14px; line-height: 1.5;">Sonraki adım<br><b>Direksiyon eğitimi</b></div>
             <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.25); font-size: 12px;">Yarın 14:00 · Mehmet Hoca<br>06 ABC 123</div>'''),
          ("Eğitmen", "#F4F7F8", "#0E2436", f'''<div style="font-family: {QS}; font-size: 15px; font-weight: 700;">Bugün · 4 ders</div>
             {"".join(f"""<div style="background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 10px; padding: 10px; margin-top: 8px;">
               <div style="display: flex; align-items: center; gap: 8px;"><span style="font-family: {QS}; font-size: 13px; font-weight: 700;">{t}</span>
               <span style="font-size: 12px; font-weight: 600;">{n}</span></div>
               <div style="font-size: 11px; color: #78909F; margin-top: 3px;">{m}</div></div>"""
               for t, n, m in [("09:00", "Ayşe Y.", "06 ABC 123 · tamamlandı"), ("11:00", "Emre A.", "06 ABC 123 · sıradaki"), ("14:00", "Deniz U.", "06 ABC 123")])}
             <div style="margin-top: 10px; height: 34px; border-radius: 8px; background: #0067C4; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">Dersi tamamla</div>'''),
        ])}
    </div>
    <div>
      {eyebrow("Mobil uygulama")}
      <div style="margin-top: 14px;">{h(34, "Kursiyer sürecini kimseye sormadan görür.")}</div>
      <div style="margin-top: 16px;">{lead("Kursiyer kendi ilerlemesini, dersini, sınavını ve ödemesini uygulamadan takip eder. Eğitmen ise sadece kendi gününü görür; ders sonunda değerlendirmesini telefondan girer.", mw=460)}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 26px;">
        {"".join(f"""<div style="padding: 14px 16px; border: 1px solid #E7EEF2; border-radius: 12px; background: #FFFFFF;">
          <div style="font-size: 14px; font-weight: 600;">{t}</div>
          <div style="font-size: 13px; color: #42586A; margin-top: 4px; line-height: 1.5;">{d}</div></div>"""
          for t, d in [("Kursiyer", "İlerleme, ders, sınav, ödeme, belge"), ("Eğitmen", "Bugünkü dersler ve değerlendirme"),
                       ("Bildirim", "Ders, ödeme ve sınav hatırlatmaları"), ("Tek elle", "Thumb-friendly, 44px dokunma hedefi")])}
      </div>
    </div>
  </div>''', "#F4F7F8")

# ---------------- güvenlik ----------------
SEC = [("shield", "Rol bazlı yetki", "Direksiyon eğitmeni finansı görmez; muhasebe ders detayına girmez."),
       ("lock", "KVKK uyumu", "Şifreleme, oturum yönetimi, veri silme ve anonimleştirme politikaları."),
       ("list", "Denetim kaydı", "Kim, hangi veriye, ne zaman erişti — hepsi kayıt altında."),
       ("building", "Kiracı izolasyonu", "Her kurs yalnızca kendi verisini görür. Kurslar arası sızma yoktur.")]
security = section(f'''
  {eyebrow("Güvenlik")}
  <div style="margin-top: 14px;">{h(38, "Kişisel veri taşıyan bir sistem gibi tasarlandı.")}</div>
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; margin-top: 44px;">
    {"".join(f"""<div>
      <div style="width: 38px; height: 38px; border-radius: 11px; background: #E8F1FB; color: #0067C4; display: flex; align-items: center; justify-content: center;">{icon(i, 19)}</div>
      <div style="font-family: {QS}; font-size: 16px; font-weight: 600; margin-top: 16px;">{t}</div>
      <div style="font-size: 14px; line-height: 1.6; color: #42586A; margin-top: 6px;">{d}</div></div>""" for i, t, d in SEC)}
  </div>
  <div style="margin-top: 40px; padding: 20px 22px; border-radius: 14px; background: #F4F7F8; display: flex; gap: 12px; align-items: flex-start;">
    {icon("info", 18, "#78909F")}
    <div style="font-size: 14px; line-height: 1.65; color: #42586A; max-width: 900px;">
      Ders süreleri, sınav hakları ve belge gereksinimleri mevzuata göre değişebilir; bunlar koda gömülü değil, yönetici tarafından güncellenen
      <b>Mevzuat ve Kurs Ayarları</b> modülünde tutulur. Resmî sistem entegrasyonları yalnızca izin verilen bir API bulunduğunda kurulur; aksi hâlde
      Excel içe/dışa aktarma ve manuel giriş kullanılır.</div>
  </div>''', "#FFFFFF")

# ---------------- ekosistem ----------------
ECO = [("Virel Vet", "Veteriner klinikleri", "#12A87C"), ("Virel Eğitim", "Eğitim kurumları", "#00A9BF"), ("Virel Drive", "Sürücü kursları", "#0067C4")]
eco = section(f'''
  <div style="text-align: center; display: flex; flex-direction: column; align-items: center;">
    {eyebrow("Virel ekosistemi")}
    <div style="margin-top: 14px;">{h(38, "Aynı tasarım dili, bağımsız ürünler.")}</div>
    <div style="margin-top: 16px;">{lead("Virel Drive, Virel'in dikey SaaS ailesinin bir üyesidir. Ortak olan yalnızca marka ve tasarım sistemi; her ürünün kendi verisi, kendi kimlik doğrulaması ve kendi çalışma zamanı vardır.", mw=680)}</div>
    <div style="display: flex; gap: 20px; margin-top: 40px;">
      {"".join(f"""<div style="width: 260px; padding: 26px; border: 1px solid #E7EEF2; border-radius: 16px; background: #FFFFFF;">
        <span style="width: 10px; height: 10px; border-radius: 999px; background: {c}; display: block; margin: 0 auto;"></span>
        <div style="font-family: {QS}; font-size: 18px; font-weight: 600; margin-top: 14px;">{n}</div>
        <div style="font-size: 14px; color: #42586A; margin-top: 5px;">{d}</div></div>""" for n, d, c in ECO)}
    </div>
  </div>''', "#F4F7F8")

# ---------------- CTA + footer ----------------
cta = f'''
<section style="background: {GRAD}; padding: 80px 0;">
  <div style="width: 1140px; margin: 0 auto; display: flex; align-items: center; gap: 40px;">
    <div>
      <div style="font-family: {QS}; font-size: 34px; font-weight: 700; letter-spacing: -0.02em; color: #FFFFFF;">Kursunuzun bugününü tek ekranda görün.</div>
      <div style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.88); margin-top: 12px; max-width: 620px;">
        Demo talebinizi bırakın; kursunuzun büyüklüğüne göre kurulum ve veri aktarımını birlikte planlayalım.</div>
    </div>
    <div style="margin-left: auto; display: flex; gap: 12px; flex-shrink: 0;">
      <div class="btn" style="height: 48px; padding: 0 24px; background: #FFFFFF; color: #00559F; font-size: 15px;">Demo talep et</div>
      <div class="btn" style="height: 48px; padding: 0 24px; background: rgba(255,255,255,0.16); color: #FFFFFF; font-size: 15px;">Giriş yap</div>
    </div>
  </div>
</section>'''

FOOT = [("Ürün", ["Dashboard", "Kursiyerler", "Direksiyon planlama", "Sınavlar", "Finans", "Raporlar"]),
        ("Mobil", ["Kursiyer uygulaması", "Eğitmen uygulaması", "Bildirimler"]),
        ("Kurum", ["Hakkımızda", "Güvenlik ve KVKK", "İletişim", "Destek"]),
        ("Virel", ["Virel Vet", "Virel Eğitim", "Virel Drive"])]
footer = f'''
<section style="background: #0E2436; padding: 62px 0 34px;">
  <div style="width: 1140px; margin: 0 auto;">
    <div style="display: grid; grid-template-columns: 1.4fr repeat(4, 1fr); gap: 32px;">
      <div>
        <div style="display: flex; align-items: baseline; gap: 8px;">{logo(26, dark="#FFFFFF")}<span style="font-family: {QS}; font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.7);">drive</span></div>
        <div style="font-size: 14px; line-height: 1.65; color: #A9BEC9; margin-top: 16px; max-width: 280px;">Modern sürücü kurslarının operasyon merkezi.</div>
      </div>
      {"".join(f"""<div><div style="font-size: 13px; font-weight: 700; color: #FFFFFF;">{t}</div>
        <div style="display: flex; flex-direction: column; gap: 9px; margin-top: 14px;">
          {"".join(f'<span style="font-size: 13px; color: #A9BEC9;">{i}</span>' for i in items)}</div></div>""" for t, items in FOOT)}
    </div>
    <div style="height: 1px; background: rgba(255,255,255,0.10); margin: 40px 0 20px;"></div>
    <div style="display: flex; align-items: center; gap: 20px;">
      <span style="font-size: 13px; color: #7B94A2;">© 2026 Virel · drive.virel.com.tr</span>
      <span style="font-size: 13px; color: #7B94A2; margin-left: auto;">KVKK Aydınlatma Metni · Kullanım Koşulları · Çerez Politikası</span>
    </div>
  </div>
</section>'''

page = nav + hero + problem + modules + planning + mobile + security + eco + cta + footer
open("Landing.dc.html", "w").write(bare(page, 1440, 5320))
print("Landing.dc.html")
