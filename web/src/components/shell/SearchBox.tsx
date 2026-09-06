"use client";
import { Icon } from "@/components/icons";
import { useEffect, useRef } from "react";

/** Global arama: kursiyer, telefon, eğitmen, araç, sınav. ⌘K ile odaklanır. */
export function SearchBox({ placeholder }: { placeholder: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <form action="/app/ara" className="relative w-[440px]">
      <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      <input ref={ref} name="q" className="input h-10 pl-10 pr-14" placeholder={placeholder} aria-label="Ara" />
      <span className="kbd absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">⌘K</span>
    </form>
  );
}
