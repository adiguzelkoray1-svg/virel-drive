import { useId } from "react";

/**
 * virel logo — virel-brand kitinden birebir alındı (frontend/virel-brand/
 * VirelLogo.jsx, bkz. BRIEF.md: "logoyu yeniden çizme... olduğu gibi kullan").
 * Eski infinity-glyph'in yerini alan yeni çentik+nokta işareti + özel
 * çizilmiş "virel" kelime işareti, tek bir SVG.
 *
 *   <VirelLogo />                                  yatay kilit, gradyan
 *   <VirelLogo variant="vertical" />               dikey kilit
 *   <VirelLogo variant="mark" size={32} />         sadece ikon
 *   <VirelLogo tone="white" />                     koyu zemin (tek renk beyaz)
 *   <VirelLogo tone="solid" />                     kurumsal (mavi ikon + lacivert yazı)
 *
 * `size` = piksel cinsinden GENİŞLİK. Yükseklik oranla hesaplanır.
 * Minimum: yatay 90px, dikey 70px, ikon 20px.
 */

const MINT = "#2ED3A8";
const CYAN = "#00A9BF";
const BLUE = "#0067C4";
const NAVY = "#0E2436";

const VB = {
  horizontal: "0 0 703.5 183.3",
  vertical: "0 0 445 347.0",
  mark: "70 82 860 728",
};

const MarkPaths = ({ stroke, dot }) => (
  <>
    <g fill="none" stroke={stroke} strokeWidth="100" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 120 170 L 500 760 L 880 170" />
    </g>
    <circle cx="500" cy="166" r="84" fill={dot} />
  </>
);

const WordPaths = ({ paint }) => (
  <>
    <g fill="none" stroke={paint} strokeWidth="12.0" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 6.00 100.00 L 46.00 200.00 L 86.00 100.00" />
      <path d="M 144.00 106.00 L 144.00 194.00" />
      <path d="M 206.00 106.00 L 206.00 194.00" />
      <path d="M 206.00 152 C 206.00 120 223.00 106.00 255.00 106.00" />
      <path d="M 297.00 150.00 L 385.00 150.00" />
      <path d="M 385.00 150.00 A 44.00 44.00 0 1 0 376.60 175.86" />
      <path d="M 439.00 72.00 L 439.00 194.00" />
    </g>
    <circle cx="144.00" cy="75.00" r="10.0" fill={paint} />
  </>
);

export function VirelLogo({
  variant = "horizontal",
  tone = "gradient",
  size,
  title = "virel",
  ...rest
}) {
  const uid = useId().replace(/:/g, "");
  const gm = `virel-m-${uid}`;
  const gw = `virel-w-${uid}`;

  const gradient = tone === "gradient";
  const white = tone === "white";
  const markPaint = gradient ? `url(#${gm})` : white ? "#FFFFFF" : BLUE;
  const dotPaint = gradient ? `url(#${gm})` : white ? "#FFFFFF" : MINT;
  const wordPaint = gradient ? `url(#${gw})` : white ? "#FFFFFF" : NAVY;

  const stops = (
    <>
      <stop offset="0" stopColor={MINT} />
      <stop offset="0.46" stopColor={CYAN} />
      <stop offset="1" stopColor={BLUE} />
    </>
  );

  const defs = gradient ? (
    <defs>
      <linearGradient id={gm} gradientUnits="userSpaceOnUse" x1="70.0" y1="0" x2="930.0" y2="0">{stops}</linearGradient>
      <linearGradient id={gw} gradientUnits="userSpaceOnUse" x1="0.0" y1="0" x2="445.0" y2="0">{stops}</linearGradient>
    </defs>
  ) : null;

  let body;
  if (variant === "mark") {
    body = <MarkPaths stroke={markPaint} dot={dotPaint} />;
  } else if (variant === "vertical") {
    body = (
      <>
        <g transform="translate(123.27,0) scale(0.23077) translate(-70,-82)"><MarkPaths stroke={markPaint} dot={dotPaint} /></g>
        <g transform="translate(0,206.00) translate(-0,-65)"><WordPaths paint={wordPaint} /></g>
      </>
    );
  } else {
    body = (
      <>
        <g transform="translate(0,0.00) scale(0.25179) translate(-70,-82)"><MarkPaths stroke={markPaint} dot={dotPaint} /></g>
        <g transform="translate(258.54,21.15) translate(-0,-65)"><WordPaths paint={wordPaint} /></g>
      </>
    );
  }

  return (
    <svg
      viewBox={VB[variant]}
      width={size}
      role="img"
      aria-label={title}
      style={{ height: "auto", display: "block", ...(size ? { width: size } : null) }}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <title>{title}</title>
      {defs}
      {body}
    </svg>
  );
}

export default VirelLogo;
