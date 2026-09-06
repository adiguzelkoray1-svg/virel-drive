# Virel Drive — ortak marka tokenları, ikonlar ve kabuk bileşenleri.
# Marka kaynağı: marka/virel-brand.css + VirelLogo.jsx. Logo yeniden çizilmez, renk yeniden seçilmez.

ICONS = {
 "home": '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 "calendar": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
 "wheel": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.4"/><path d="M12 3v5.6M4.2 16.5l4.9-2.8M19.8 16.5l-4.9-2.8"/>',
 "car": '<path d="M3 16v-3.2L5 7h14l2 5.8V16M3 16h18M3 16v2.5h3V16M18 16v2.5h3V16"/><circle cx="7.5" cy="12.6" r="1.1"/><circle cx="16.5" cy="12.6" r="1.1"/>',
 "book": '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H19v-3"/><path d="M8 7.5h7M8 11h5"/>',
 "exam": '<path d="M8 3h8a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2V4a1 1 0 0 1 1-1z"/><path d="M8.5 13l2 2 4-4.5"/>',
 "users": '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-5-6.7"/>',
 "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 "badge-id": '<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.5 17a3.8 3.8 0 0 1 7 0M14.5 10h4M14.5 14h4M9 2v3"/>',
 "inbox-in": '<path d="M3 13l2-8h14l2 8v6H3zM3 13h5l1 2h6l1-2h5M12 4v6M9 8l3 3 3-3"/>',
 "funnel": '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
 "wallet": '<path d="M3 7a2 2 0 0 1 2-2h14v4M3 7v10a2 2 0 0 0 2 2h16v-8H3z"/><circle cx="17" cy="14" r="1"/>',
 "chart": '<path d="M3 21h18M6 17v-5M11 17V7M16 17v-9"/>',
 "message": '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
 "file": '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6"/>',
 "folder": '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
 "settings": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
 "help": '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
 "search": '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
 "plus": '<path d="M12 5v14M5 12h14"/>',
 "bell": '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4"/>',
 "chev-down": '<path d="M6 9l6 6 6-6"/>',
 "chev-right": '<path d="M9 6l6 6-6 6"/>',
 "chev-left": '<path d="M15 6l-6 6 6 6"/>',
 "updown": '<path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>',
 "arrow-right": '<path d="M5 12h14M13 6l6 6-6 6"/>',
 "arrow-up": '<path d="M12 19V5M6 11l6-6 6 6"/>',
 "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 "alert": '<path d="M12 3l10 18H2zM12 10v4M12 18h.01"/>',
 "check": '<path d="M5 12l5 5 9-11"/>',
 "check-circle": '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
 "x": '<path d="M6 6l12 12M18 6L6 18"/>',
 "x-circle": '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
 "phone": '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
 "whatsapp": '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20l1.2-4.7A8.5 8.5 0 1 1 21 11.5z"/><path d="M9 9.2c.3 2.6 2.2 4.5 4.8 4.8.5.1 1-.3 1-.8v-.6l-1.6-.6-.7.8a5.6 5.6 0 0 1-2.3-2.3l.8-.7-.6-1.6h-.6c-.5 0-.9.5-.8 1z"/>',
 "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
 "edit": '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17zM13 8l3 3"/>',
 "trash": '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 "more": '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
 "info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
 "filter": '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
 "card": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',
 "eye": '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 "refresh": '<path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6"/>',
 "shield": '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
 "grid": '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 "menu": '<path d="M4 7h16M4 12h16M4 17h16"/>',
 "link": '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
 "logout": '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9"/>',
 "cmd": '<path d="M15 9V6a3 3 0 1 1 3 3h-3zM9 9V6a3 3 0 1 0-3 3h3zM15 15v3a3 3 0 1 0 3-3h-3zM9 15v3a3 3 0 1 1-3-3h3zM9 9h6v6H9z"/>',
 "trend": '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
 "trend-down": '<path d="M3 7l6 6 4-4 8 8M15 17h6v-6"/>',
 "fuel": '<path d="M4 20V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v15M3 20h11M5.5 8.5h6M15 9l3 2v7a1.5 1.5 0 0 0 3 0v-7l-3-3"/>',
 "wrench": '<path d="M15.5 3.5a5 5 0 0 0-5.9 6.4L3 16.5V21h4.5l6.6-6.6a5 5 0 0 0 6.4-5.9L18 11l-3-3z"/>',
 "route": '<circle cx="6" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="M8.6 6H14a4 4 0 0 1 0 8H10a4 4 0 0 0 0 8h.6" transform="translate(0,-4)"/>',
 "flag": '<path d="M5 21V4M5 4h11l-2 3.5L16 11H5"/>',
 "award": '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5L7 22l5-2.5L17 22l-1.5-8.5"/>',
 "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 "moon": '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
 "building": '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h3a1 1 0 0 1 1 1v11M2 21h20M8 7h4M8 11h4M8 15h4"/>',
 "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
 "lock": '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 "list": '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
 "pulse": '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
 "upload": '<path d="M12 16V4M8 8l4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
 "download": '<path d="M12 4v12M8 12l4 4 4-4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
 "play": '<path d="M7 4.5v15l13-7.5z"/>',
 "pause": '<path d="M8 5v14M16 5v14"/>',
 "star": '<path d="M12 3.5l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.9l6-.9z"/>',
}

def icon(name, size=20, color=None, sw=1.75, style=""):
    st = f'style="{style}"' if style else ""
    col = f' color: {color};' if color else ""
    if col:
        st = f'style="{style}{col}"'
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" {st}>{ICONS[name]}</svg>')

GRAD = "linear-gradient(90deg, #2ED3A8 0%, #00A9BF 46%, #0067C4 100%)"
GRAD_ICON = "linear-gradient(135deg, #2ED3A8 0%, #00A9BF 46%, #0067C4 100%)"
FONT_LINK = ('<link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=Karla:wght@400;500;600;700&display=swap" rel="stylesheet">')
QS = "Quicksand, Avenir Next, Century Gothic, sans-serif"

# --- Virel logo: taken verbatim from virel-brand-kit (VirelLogo.jsx / virel-logo.html). Never redrawn. ---
_STOPS = '<stop offset="0" stop-color="#2ED3A8"/><stop offset="0.46" stop-color="#00A9BF"/><stop offset="1" stop-color="#0067C4"/>'
_DEFS = ('<defs><linearGradient id="virel-gm" gradientUnits="userSpaceOnUse" x1="70" y1="0" x2="930" y2="0">' + _STOPS + '</linearGradient>'
         '<linearGradient id="virel-gw" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="445" y2="0">' + _STOPS + '</linearGradient></defs>')

def _mark_paths(stroke, dot):
    return (f'<g fill="none" stroke="{stroke}" stroke-width="100" stroke-linecap="round" stroke-linejoin="round"><path d="M 120 170 L 500 760 L 880 170"/></g>'
            f'<circle cx="500" cy="166" r="84" fill="{dot}"/>')

def _word_paths(paint):
    return (f'<g fill="none" stroke="{paint}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">'
            '<path d="M 6 100 L 46 200 L 86 100"/><path d="M 144 106 L 144 194"/><path d="M 206 106 L 206 194"/>'
            '<path d="M 206 152 C 206 120 223 106 255 106"/><path d="M 297 150 L 385 150"/>'
            '<path d="M 385 150 A 44 44 0 1 0 376.6 175.86"/><path d="M 439 72 L 439 194"/></g>'
            f'<circle cx="144" cy="75" r="10" fill="{paint}"/>')

def _paints(tone):
    if tone == "white":
        return "#FFFFFF", "#FFFFFF", "#FFFFFF", ""
    if tone == "solid":
        return "#0067C4", "#2ED3A8", "#0E2436", ""
    return "url(#virel-gm)", "url(#virel-gm)", "url(#virel-gw)", _DEFS

def logo_mark(size=32, white=False, tone=None):
    tone = tone or ("white" if white else "gradient")
    mp, dp, wp, defs = _paints(tone)
    h = round(size * 728 / 860, 2)
    return (f'<svg width="{size}" height="{h}" viewBox="70 82 860 728" role="img" aria-label="virel" style="display: block; flex-shrink: 0;">{defs}{_mark_paths(mp, dp)}</svg>')

def logo(size=28, word=None, dark="#0E2436", tone=None):
    """Horizontal lockup. `size` is the HEIGHT in px (width follows the 703.54:183.3 ratio)."""
    tone = tone or ("white" if dark == "#FFFFFF" else "gradient")
    mp, dp, wp, defs = _paints(tone)
    w = round(size * 703.54 / 183.3, 1)
    return (f'<svg width="{w}" height="{size}" viewBox="0 0 703.54 183.3" role="img" aria-label="virel" style="display: block; flex-shrink: 0;">{defs}'
            f'<g transform="translate(0,0) scale(0.25179) translate(-70,-82)">{_mark_paths(mp, dp)}</g>'
            f'<g transform="translate(258.536,21.15) translate(0,-65)">{_word_paths(wp)}</g></svg>')

def logo_vertical(width=120, tone="gradient"):
    mp, dp, wp, defs = _paints(tone)
    h = round(width * 347 / 445, 1)
    return (f'<svg width="{width}" height="{h}" viewBox="0 0 445 347" role="img" aria-label="virel" style="display: block; flex-shrink: 0;">{defs}'
            f'<g transform="translate(123.269,0) scale(0.23077) translate(-70,-82)">{_mark_paths(mp, dp)}</g>'
            f'<g transform="translate(0,206) translate(0,-65)">{_word_paths(wp)}</g></svg>')

def wordmark(size=22, dark="#0E2436"):
    return logo(size, dark=dark)

def app_icon(size=64):
    # matches favicon/virel-favicon-512.png: 135° brand gradient, white mark
    r = round(size * 0.22)
    return (f'<div style="width: {size}px; height: {size}px; border-radius: {r}px; background: {GRAD_ICON}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">'
            f'{logo_mark(round(size*0.6), tone="white")}</div>')

CSS = """
    body { margin: 0; font-family: Karla, Helvetica Neue, Segoe UI, system-ui, sans-serif; color: #0E2436; background: #F4F7F8; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.5; }
    a { color: #0067C4; text-decoration: none; } a:hover { color: #00559F; }
    * { box-sizing: border-box; }
    .card { background: #FFFFFF; border: 1px solid #E7EEF2; border-radius: 14px; box-shadow: 0 1px 2px rgba(14,36,54,0.05), 0 12px 32px -18px rgba(14,36,54,0.28); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 8px; font-size: 14px; font-weight: 700; border: 1px solid transparent; white-space: nowrap; line-height: 1; }
    .btn-primary { background: #0067C4; color: #FFFFFF; box-shadow: 0 1px 2px rgba(14,36,54,0.06); }
    .btn-secondary { background: #FFFFFF; color: #0E2436; border-color: #E7EEF2; }
    .btn-outline { background: transparent; color: #0067C4; border-color: #0067C4; }
    .btn-ghost { background: transparent; color: #00559F; }
    .btn-danger { background: #FCECEB; color: #D1453B; }
    .btn-sm { height: 34px; padding: 0 12px; font-size: 13px; }
    .btn-xs { height: 30px; padding: 0 10px; font-size: 13px; }
    .btn-disabled { opacity: 0.45; }
    .ibtn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #E7EEF2; background: #FFFFFF; display: inline-flex; align-items: center; justify-content: center; color: #42586A; }
    .ibtn-primary { background: #0067C4; border-color: #0067C4; color: #FFFFFF; }
    .ibtn-soft { background: #E8F1FB; border-color: #E8F1FB; color: #00559F; }
    .ibtn-ghost { border-color: transparent; background: transparent; }
    .badge { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; line-height: 1; color: #0E2436; }
    .b-success { background: #E6F7F1; } .b-success .dot { background: #12A87C; }
    .b-warning { background: #FDF0E8; } .b-warning .dot { background: #D9713C; }
    .b-danger { background: #FCECEB; } .b-danger .dot { background: #D1453B; }
    .b-info { background: #E8F1FB; } .b-info .dot { background: #0067C4; }
    .b-brand { background: #E8F1FB; color: #00559F; } .b-brand .dot { background: #0067C4; }
    .b-neutral { background: #F3F7F9; color: #42586A; } .b-neutral .dot { background: #78909F; }
    .dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; flex-shrink: 0; }
    .input { height: 42px; border: 1px solid #E7EEF2; border-radius: 8px; padding: 0 12px; font-size: 14px; display: flex; align-items: center; gap: 8px; background: #FFFFFF; color: #78909F; }
    .input-focus { border-color: #0067C4; box-shadow: 0 0 0 3px #CFE2F7; color: #0E2436; }
    .input-error { border-color: #D1453B; box-shadow: 0 0 0 3px rgba(209,69,59,0.16); color: #0E2436; }
    .input-disabled { background: #F4F7F8; color: #78909F; }
    .label { font-size: 13px; font-weight: 600; color: #42586A; }
    .hint { font-size: 12px; color: #78909F; }
    .nav { display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 12px; border-radius: 8px; color: #42586A; font-size: 14px; font-weight: 600; }
    .nav svg { color: #78909F; flex-shrink: 0; }
    .nav-active { background: #E8F1FB; color: #0E2436; }
    .nav-active svg { color: #0067C4; }
    .h-page { font-family: Quicksand, Avenir Next, Century Gothic, sans-serif; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; }
    .h-section { font-family: Quicksand, Avenir Next, Century Gothic, sans-serif; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.25; }
    .h-card { font-family: Quicksand, Avenir Next, Century Gothic, sans-serif; font-size: 16px; font-weight: 600; line-height: 1.3; }
    .t-sec { color: #42586A; } .t-muted { color: #78909F; } .t-sm { font-size: 12px; } .t-xs { font-size: 12px; } .t-13 { font-size: 13px; }
    .kpi { font-family: Quicksand, Avenir Next, Century Gothic, sans-serif; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .avatar { border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; letter-spacing: -0.01em; font-family: Quicksand, Avenir Next, Century Gothic, sans-serif; }
    .tab { height: 40px; display: inline-flex; align-items: center; padding: 0 4px; font-size: 14px; font-weight: 600; color: #42586A; border-bottom: 2px solid transparent; }
    .tab-active { color: #00559F; border-bottom-color: #0067C4; }
    .seg { display: inline-flex; background: #F3F7F9; border-radius: 8px; padding: 3px; gap: 2px; }
    .seg span { height: 28px; padding: 0 12px; border-radius: 6px; font-size: 13px; font-weight: 600; color: #42586A; display: inline-flex; align-items: center; }
    .seg .seg-on { background: #FFFFFF; color: #0E2436; box-shadow: 0 1px 2px rgba(14,36,54,0.10); }
    .row { display: flex; align-items: center; }
    .th { font-size: 12px; font-weight: 700; color: #78909F; letter-spacing: 0.02em; }
    .td { font-size: 13px; color: #0E2436; }
    .divider { height: 1px; background: #E7EEF2; }
    .kbd { font-size: 11px; color: #78909F; border: 1px solid #E7EEF2; border-radius: 5px; padding: 1px 5px; background: #F4F7F8; line-height: 1.4; font-family: 'IBM Plex Mono', ui-monospace, Menlo, monospace; }
"""

CSS += """
    .bar { height: 8px; border-radius: 999px; background: #E7EEF2; overflow: hidden; }
    .bar > i { display: block; height: 100%; border-radius: 999px; background: #0067C4; }
    .bar-grad > i { background: linear-gradient(90deg, #00A9BF, #0067C4); }
    .bar-thin { height: 6px; }
    .chip { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid #E7EEF2; background: #FFFFFF; font-size: 13px; font-weight: 500; color: #42586A; white-space: nowrap; }
    .chip-on { background: #E8F1FB; border-color: #CFE2F7; color: #00559F; font-weight: 600; }
    .slot { border-radius: 8px; padding: 7px 9px; font-size: 12px; line-height: 1.35; border-left: 3px solid; overflow: hidden; }
    .slot-drive { background: #E8F1FB; border-color: #0067C4; color: #0E2436; }
    .slot-theory { background: #E6F7F1; border-color: #12A87C; color: #0E2436; }
    .slot-exam { background: #FDF0E8; border-color: #D9713C; color: #0E2436; }
    .slot-busy { background: #F3F7F9; border-color: #CFDCE4; color: #78909F; }
    .slot-clash { background: #FCECEB; border-color: #D1453B; color: #0E2436; }
    .tick { width: 22px; height: 22px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .tick-done { background: #E6F7F1; color: #12A87C; }
    .tick-now { background: #E8F1FB; color: #0067C4; }
    .tick-todo { background: #F3F7F9; color: #78909F; border: 1px dashed #CFDCE4; }
    .stat-lbl { font-size: 12px; color: #78909F; font-weight: 600; letter-spacing: 0.01em; }
    .num { font-variant-numeric: tabular-nums; }
"""

# ---------------- Kabuk: kurs uygulaması ----------------

NAV_OPS = [
    ("home", "Dashboard"), ("calendar", "Takvim"), ("wheel", "Direksiyon Dersleri"),
    ("book", "Teorik Eğitim"), ("exam", "Sınavlar"),
]
NAV_PEOPLE = [("users", "Kursiyerler"), ("inbox-in", "Ön Kayıtlar"), ("badge-id", "Eğitmenler")]
NAV_RES = [("car", "Araçlar"), ("folder", "Belgeler")]
NAV_BIZ = [("wallet", "Finans"), ("funnel", "CRM"), ("chart", "Raporlar"), ("message", "Mesajlar")]
NAV_SYS = [("settings", "Ayarlar")]

COUNTS = {"Ön Kayıtlar": 12, "Mesajlar": 5}

def nav_item(ic, label, active=False, count=None):
    cls = "nav nav-active" if active else "nav"
    c = (f'<span style="margin-left: auto; font-size: 12px; font-weight: 500; color: #00559F; '
         f'background: #E8F1FB; border-radius: 999px; padding: 1px 7px;">{count}</span>') if count else ""
    return f'<div class="{cls}">{icon(ic, 18)}<span>{label}</span>{c}</div>'

def _nav_group(items, active):
    return "".join(nav_item(i, l, l == active, COUNTS.get(l)) for i, l in items)

def sidebar(active):
    groups = [NAV_OPS, NAV_PEOPLE, NAV_RES, NAV_BIZ, NAV_SYS]
    navs = ('<div class="divider" style="margin: 10px 8px;"></div>').join(
        f'<nav style="display: flex; flex-direction: column; gap: 2px;">{_nav_group(g, active)}</nav>' for g in groups)
    return f'''
<aside style="width: 244px; flex-shrink: 0; background: #FFFFFF; border-right: 1px solid #E7EEF2; display: flex; flex-direction: column; padding: 20px 16px 16px;">
  <div style="display: flex; align-items: baseline; gap: 8px; padding: 2px 8px 18px;">{logo(28)}<span style="font-family: {QS}; font-size: 15px; font-weight: 600; color: #42586A; letter-spacing: -0.01em;">drive</span></div>
  <div style="display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 10px; border: 1px solid #E7EEF2; border-radius: 8px;">
    <div style="width: 26px; height: 26px; border-radius: 7px; background: #E8F1FB; color: #00559F; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700;">YZ</div>
    <div style="display: flex; flex-direction: column; min-width: 0; flex-grow: 1;">
      <span style="font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Yıldız Sürücü Kursu</span>
      <span style="font-size: 12px; color: #78909F;">Çankaya, Ankara</span>
    </div>
    {icon("updown", 16, "#78909F")}
  </div>
  <div style="margin-top: 18px; display: flex; flex-direction: column; gap: 0;">{navs}</div>
  <div style="flex-grow: 1; min-height: 16px;"></div>
  <div class="divider" style="margin: 0 8px 10px;"></div>
  <div style="display: flex; flex-direction: column; gap: 2px;">
    {nav_item("building", "Kurs Profili", active == "Kurs Profili")}
    {nav_item("help", "Destek", active == "Destek")}
  </div>
  <div style="display: flex; align-items: center; gap: 10px; padding: 9px 8px; margin-top: 10px; border-radius: 8px; border: 1px solid #E7EEF2;">
    {person_avatar("AY", 34, 12)}
    <div style="display: flex; flex-direction: column; flex-grow: 1; min-width: 0;">
      <span style="font-size: 13px; font-weight: 500;">Ahmet Yılmaz</span>
      <span style="font-size: 12px; color: #42586A;">Kurs Sahibi</span>
    </div>
    {icon("more", 16, "#78909F")}
  </div>
</aside>'''

def header(title_html, cta="Yeni Ders", cta_icon="plus", search="Kursiyer, telefon, eğitmen veya araç ara…"):
    return f'''
<header style="height: 68px; background: #FFFFFF; border-bottom: 1px solid #E7EEF2; display: flex; align-items: center; padding: 0 32px; gap: 24px; flex-shrink: 0;">
  <div style="display: flex; align-items: center; gap: 8px; width: 300px; flex-shrink: 0;">{title_html}</div>
  <div style="flex-grow: 1; display: flex; justify-content: center;">
    <div class="input" style="width: 440px; height: 40px; color: #78909F;">
      {icon("search", 18, "#78909F")}<span style="flex-grow: 1; font-size: 14px;">{search}</span>
      <span class="kbd">⌘K</span>
    </div>
  </div>
  <div style="display: flex; align-items: center; gap: 10px; width: 300px; justify-content: flex-end; flex-shrink: 0;">
    <div class="btn btn-primary" style="height: 38px; padding: 0 14px;">{icon(cta_icon, 16)}{cta}</div>
    <div class="ibtn" style="position: relative;">{icon("bell", 18)}<span style="position: absolute; top: 7px; right: 8px; width: 7px; height: 7px; border-radius: 999px; background: #D1453B; border: 1.5px solid #FFFFFF;"></span></div>
    {person_avatar("AY", 36, 12)}
  </div>
</header>'''

def page_title(title, sub=None):
    s = f'<span style="font-size: 13px; color: #78909F;">{sub}</span>' if sub else ""
    return f'<div style="display: flex; flex-direction: column; gap: 2px;"><span class="h-section">{title}</span>{s}</div>'

def shell(body, active, title_html, height, pad="28px 32px 32px"):
    return f'''<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  {FONT_LINK}
  <style>{CSS}</style>
</helmet>
<div style="width: 1440px; height: {height}px; display: flex; background: #F4F7F8; overflow: hidden;">
  {sidebar(active)}
  <div style="flex-grow: 1; display: flex; flex-direction: column; min-width: 0;">
    {header(title_html)}
    <main style="padding: {pad}; display: flex; flex-direction: column; gap: 22px; flex-grow: 1;">
      {body}
    </main>
  </div>
</div>
</x-dc>
</body>
</html>
'''

def bare(body, width, height, extra_css=""):
    """Kabuksuz artboard (giriş, mobil, landing)."""
    return f'''<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  {FONT_LINK}
  <style>{CSS}{extra_css}</style>
</helmet>
<div style="width: {width}px; height: {height}px; overflow: hidden; background: #FFFFFF;">
{body}
</div>
</x-dc>
</body>
</html>
'''

# ---------------- Küçük bileşenler ----------------

AV = {
 "b": ("#E8F1FB", "#00559F"), "g": ("#E6F7F1", "#12A87C"), "o": ("#FDF0E8", "#D9713C"),
 "r": ("#FCECEB", "#D1453B"), "n": ("#F3F7F9", "#42586A"), "solid": ("#0067C4", "#FFFFFF"),
}

def person_avatar(initials, size=32, fs=12, tone="solid"):
    bg, fg = AV[tone]
    return f'<div class="avatar" style="width: {size}px; height: {size}px; background: {bg}; color: {fg}; font-size: {fs}px;">{initials}</div>'

def initials(name):
    parts = [p for p in name.replace("&nbsp;", " ").split(" ") if p]
    return (parts[0][0] + (parts[-1][0] if len(parts) > 1 else "")).upper()

def avatar(name, size=32, fs=12, tone=None):
    tone = tone or ["b", "g", "o", "r", "n"][sum(map(ord, name)) % 5]
    return person_avatar(initials(name), size, fs, tone)

def badge(text, kind="neutral", dot=False):
    d = '<span class="dot"></span>' if dot else ""
    return f'<span class="badge b-{kind}">{d}{text}</span>'

def btn(text, kind="primary", ic=None, size="", extra=""):
    i = icon(ic, 16) if ic else ""
    cls = f"btn btn-{kind} {size}".strip()
    return f'<div class="{cls}" style="{extra}">{i}{text}</div>'

def ibtn(ic, kind="", size=18):
    return f'<div class="ibtn {kind}">{icon(ic, size)}</div>'

def bar(pct, cls="", h=8, color=None):
    st = f'background: {color};' if color else ""
    return f'<div class="bar {cls}" style="height: {h}px;"><i style="width: {pct}%; {st}"></i></div>'

def card(inner, pad=20, extra=""):
    return f'<section class="card" style="padding: {pad}px; {extra}">{inner}</section>'

def kpi(label, value, sub=None, tone="#42586A", ic=None):
    s = f'<div style="display: flex; align-items: center; gap: 5px; font-size: 12px; color: {tone};">{sub}</div>' if sub else ""
    i = f'<div style="margin-left: auto; color: #78909F;">{icon(ic, 18)}</div>' if ic else ""
    return card(f'''<div style="display: flex; align-items: center; gap: 8px;"><span class="stat-lbl">{label}</span>{i}</div>
    <div class="kpi" style="margin: 8px 0 4px;">{value}</div>{s}''', 18)

def seg(options, active):
    inner = "".join(f'<span class="{"seg-on" if o == active else ""}">{o}</span>' for o in options)
    return f'<div class="seg">{inner}</div>'

def tabs(items, active):
    inner = "".join(f'<div class="tab {"tab-active" if t == active else ""}">{t}</div>' for t in items)
    return f'<div style="display: flex; gap: 22px; border-bottom: 1px solid #E7EEF2;">{inner}</div>'

def empty(title, sub, cta=None, ic="calendar"):
    c = f'<div style="margin-top: 14px;">{btn(cta, "secondary", "plus", "btn-sm")}</div>' if cta else ""
    return f'''<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 46px 20px; text-align: center;">
      <div style="width: 46px; height: 46px; border-radius: 12px; background: #F3F7F9; color: #78909F; display: flex; align-items: center; justify-content: center;">{icon(ic, 22)}</div>
      <div class="h-card" style="margin-top: 14px;">{title}</div>
      <div class="t-13 t-sec" style="margin-top: 4px; max-width: 320px;">{sub}</div>{c}</div>'''

def table(cols, rows, widths, pad="12px 0"):
    """cols: başlık listesi · rows: hücre HTML listesi · widths: CSS grid şablonu"""
    head = "".join(f'<div class="th">{c}</div>' for c in cols)
    body = "".join(
        f'<div style="display: grid; grid-template-columns: {widths}; gap: 14px; align-items: center; padding: {pad}; border-top: 1px solid #E7EEF2;">'
        + "".join(f'<div>{c}</div>' for c in r) + '</div>' for r in rows)
    return (f'<div style="display: grid; grid-template-columns: {widths}; gap: 14px; align-items: center; padding: 0 0 10px;">{head}</div>{body}')
