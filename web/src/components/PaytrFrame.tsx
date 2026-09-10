"use client";
import { useEffect, useRef } from "react";

/** PayTR iFrame: yükseklik mesajlarını dinleyip çerçeveyi içeriğe göre büyütür (PayTR'nin iframeResizer'ı yerine hafif sürüm). */
export function PaytrFrame({ src }: { src: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (typeof e.origin !== "string" || !e.origin.endsWith("paytr.com")) return;
      const h = typeof e.data === "string" ? Number((e.data.match(/(\d{3,4})/) ?? [])[1]) : Number((e.data as { height?: number })?.height);
      if (h && ref.current) ref.current.style.height = `${Math.max(h, 480)}px`;
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  return <iframe ref={ref} src={src} id="paytriframe" title="PayTR güvenli ödeme" frameBorder={0} scrolling="yes" style={{ width: "100%", height: 720, display: "block" }} />;
}
