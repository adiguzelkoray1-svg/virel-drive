import { prisma } from "@/lib/prisma";

export const DEMO_SIZES: { key: string; label: string }[] = [
  { key: "SOLO", label: "1 şube · 1-2 eğitmen" },
  { key: "SMALL", label: "1 şube · 3-6 eğitmen" },
  { key: "MEDIUM", label: "1 şube · 7-15 eğitmen" },
  { key: "LARGE", label: "Çok şube / 15+ eğitmen" },
];

export const DEMO_STATUS_LABEL: Record<string, { label: string; kind: "neutral" | "warning" | "success" | "brand" | "danger" }> = {
  NEW: { label: "Yeni", kind: "warning" },
  CONTACTED: { label: "Görüşüldü", kind: "brand" },
  CONVERTED: { label: "Deneme açıldı", kind: "success" },
  CLOSED: { label: "Kapandı", kind: "neutral" },
};

export async function listDemoRequests() {
  return prisma.demoRequest.findMany({ orderBy: { createdAt: "desc" } });
}
