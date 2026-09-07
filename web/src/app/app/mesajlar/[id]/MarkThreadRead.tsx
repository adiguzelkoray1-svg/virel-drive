"use client";
import { useEffect } from "react";
import { markThreadReadAction } from "@/app/actions/messages";

/** Konuşma açıldığında karşı tarafın okunmamış mesajlarını okundu işaretler.
 *  Form göndermeden doğrudan sunucu fonksiyonu çağrılır — bkz. lib/availability.ts deseni. */
export function MarkThreadRead({ studentId }: { studentId: string }) {
  useEffect(() => {
    markThreadReadAction(studentId);
  }, [studentId]);
  return null;
}
