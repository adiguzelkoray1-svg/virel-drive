# -*- coding: utf-8 -*-
"""Virel Drive · Ayarlar › Mevzuat ve Kurs Ayarları."""
from common import icon, shell, page_title, card, badge, btn, seg, tabs, QS

NAV = [("building", "Kurs profili"), ("shield", "Mevzuat ve kurs ayarları"), ("users", "Kullanıcılar ve roller"),
       ("wheel", "Ders kuralları"), ("folder", "Belge kuralları"), ("wallet", "Fiyat ve ödeme"),
       ("message", "Mesaj şablonları"), ("link", "Entegrasyonlar"), ("lock", "Güvenlik ve KVKK"), ("list", "Denetim kaydı")]

def navitem(ic, label, active=False):
    st = "background: #E8F1FB; color: #0E2436; font-weight: 600;" if active else "color: #42586A;"
    return f'<div style="display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 12px; border-radius: 8px; font-size: 13.5px; {st}">{icon(ic, 17, "#0067C4" if active else "#78909F")}<span>{label}</span></div>'

def setting(label, value, hint=None, kind="input", w=1):
    h = f'<div class="hint" style="margin-top: 5px;">{hint}</div>' if hint else ""
    if kind == "toggle":
        knob = f'''<div style="width: 36px; height: 21px; border-radius: 999px; background: {"#0067C4" if value else "#CFDCE4"}; padding: 2px; display: flex; {"justify-content: flex-end;" if value else ""}">
          <div style="width: 17px; height: 17px; border-radius: 999px; background: #FFFFFF;"></div></div>'''
        return f'''<div style="grid-column: span {w}; display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid #E7EEF2;">
          <div style="display: flex; flex-direction: column; gap: 2px;"><span class="label">{label}</span>{h}</div>
          <div style="margin-left: auto;">{knob}</div></div>'''
    return f'''<div style="grid-column: span {w}; display: flex; flex-direction: column; gap: 6px;">
      <span class="label">{label}</span>
      <div class="input"><span style="flex-grow: 1; color: #0E2436;" class="num">{value}</span></div>{h}</div>'''

CLASSES = [("B", "Otomobil", "14 saat", "12 ders", "4 hak", "70 puan"),
           ("A2", "Motosiklet", "12 saat", "12 ders", "4 hak", "70 puan"),
           ("C", "Kamyon", "20 saat", "16 ders", "4 hak", "70 puan"),
           ("D", "Otobüs", "24 saat", "16 ders", "4 hak", "70 puan"),
           ("A", "Motosiklet", "12 saat", "12 ders", "4 hak", "70 puan")]
CC = "70px 1fr 130px 130px 120px 120px 96px"
crows = "".join(f'''<div style="display: grid; grid-template-columns: {CC}; gap: 12px; align-items: center; padding: 12px 4px; border-top: 1px solid #E7EEF2;">
  <div>{badge(c, "brand")}</div><div class="td t-sec">{n}</div>
  <div class="td num">{d}</div><div class="td num">{t}</div><div class="td num">{r}</div><div class="td num">{p}</div>
  <div style="display: flex; justify-content: flex-end; gap: 6px;">
    <div class="ibtn" style="width: 30px; height: 30px;">{icon("edit", 14)}</div></div></div>''' for c, n, d, t, r, p in CLASSES)

body = f'''
<div style="display: flex; align-items: flex-end; gap: 16px;">
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <span class="h-page">Ayarlar</span>
    <span class="t-sec">Kurs, mevzuat, kullanıcı ve entegrasyon ayarları</span>
  </div>
  <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
    {btn("Vazgeç", "secondary", None, "btn-sm")}{btn("Değişiklikleri kaydet", "primary", "check", "btn-sm")}
  </div>
</div>

<div style="display: grid; grid-template-columns: 268px 1fr; gap: 16px; align-items: start;">
  {card('<div style="display: flex; flex-direction: column; gap: 2px;">' + "".join(navitem(i, l, l == "Mevzuat ve kurs ayarları") for i, l in NAV) + '</div>', 14)}

  <div style="display: flex; flex-direction: column; gap: 16px;">
    {card(f"""<div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="width: 34px; height: 34px; border-radius: 9px; background: #E8F1FB; color: #0067C4; display: flex; align-items: center; justify-content: center;">{icon("shield", 18)}</div>
        <div style="display: flex; flex-direction: column; gap: 3px;">
          <span class="h-card">Mevzuat ve kurs ayarları</span>
          <span class="t-13 t-sec" style="line-height: 1.55; max-width: 620px;">Ders süreleri, sınav hakları, sertifika sınıfları ve eğitim kuralları burada tanımlanır.
          Mevzuat değiştiğinde yalnızca bu ekran güncellenir; sistem genelinde tüm kontroller bu değerleri kullanır.</span>
        </div>
        <div style="margin-left: auto;">{badge("Son güncelleme: 14.02.2026", "neutral")}</div>
      </div>""", 20)}

    {card(f"""<div style="display: flex; align-items: center; gap: 10px; padding-bottom: 12px;">
        <span class="h-card">Sertifika sınıfları ve eğitim kuralları</span>
        <div style="margin-left: auto;">{btn("Sınıf ekle", "secondary", "plus", "btn-xs")}</div></div>
      <div style="display: grid; grid-template-columns: {CC}; gap: 12px; padding: 0 4px 10px;">
        {"".join(f'<div class="th">{h}</div>' for h in ["Sınıf", "Araç türü", "Direksiyon eğitimi", "Teorik ders", "Sınav hakkı", "Başarı barajı", ""])}
      </div>{crows}""", 20)}

    {card(f"""<div class="h-card" style="margin-bottom: 16px;">Ders ve devam kuralları</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px;">
        {setting("Direksiyon ders süresi", "90 dakika", "Tek derste azami süre")}
        {setting("Günlük azami ders", "2 saat", "Kursiyer başına")}
        {setting("İki ders arası asgari", "12 saat")}
        {setting("Teorik devam zorunluluğu", "%85", "Bu oranın altında e-Sınav başvurusu yapılamaz")}
        {setting("Ders iptal süresi", "24 saat", "Bu süreden sonra iptal hak düşürür")}
        {setting("Dönem süresi", "14 hafta")}
      </div>""", 20)}

    {card(f"""<div class="h-card" style="margin-bottom: 4px;">Sınav ve süreç kuralları</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0 32px;">
        {setting("Direksiyon eğitimi tamamlanmadan sınav başvurusu engellensin", True, "Eğitim saati dolmadan başvuru oluşturulamaz", "toggle")}
        {setting("Evrak eksikse kayıt tamamlanmasın", True, "Eksik belge varsa kursiyer 'ön kayıt' durumunda kalır", "toggle")}
        {setting("Sınav hakkı bittiğinde otomatik uyarı", True, "Kurs sahibine ve sekretere bildirim", "toggle")}
        {setting("Çakışan ders oluşturulmasına izin verme", True, "Eğitmen, araç ve kursiyer uygunluğu zorunlu", "toggle")}
        {setting("e-Sınav sonuçlarını Excel ile içe aktar", True, "Resmî çıktı sisteme aktarılır", "toggle")}
        {setting("Kursiyer uygulamasında ilerleme görünsün", True, "Kursiyer kendi sürecini görebilir", "toggle")}
      </div>""", 20)}

    {card(f"""<div style="display: flex; gap: 12px; align-items: flex-start;">
        {icon("info", 17, "#78909F")}
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <span class="t-13" style="font-weight: 600;">Resmî sistem entegrasyonları</span>
          <span class="t-13 t-sec" style="line-height: 1.6; max-width: 720px;">MEBBİS / Özel MTSK modülüne bağlantı yalnızca resmî ve izin verilen bir API bulunduğunda kurulur.
          Böyle bir API yoksa Virel Drive sahte bir entegrasyon göstermez; veri aktarımı Excel içe/dışa aktarma, manuel giriş ve resmî çıktıların sisteme yüklenmesi ile yapılır.</span>
          <div style="display: flex; gap: 8px; margin-top: 8px;">{btn("Excel içe aktar", "secondary", "upload", "btn-xs")}{btn("Şablon indir", "secondary", "download", "btn-xs")}</div>
        </div></div>""", 20)}
  </div>
</div>'''

open("Settings.dc.html", "w").write(shell(body, "Ayarlar", page_title("Ayarlar", "Mevzuat ve kurs ayarları"), 1580))
print("Settings.dc.html")
