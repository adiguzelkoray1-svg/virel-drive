import type { Metadata, Viewport } from "next";
import { Quicksand, Karla } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";

const quicksand = Quicksand({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], variable: "--font-quicksand", display: "swap" });
const karla = Karla({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--font-karla", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Virel Drive", template: "%s · Virel Drive" },
  description: "Sürücü kursları için operasyon yönetim platformu.",
  manifest: "/site.webmanifest",
  applicationName: "Virel Drive",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Virel Drive" },
  icons: {
    icon: [
      { url: "/virel-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/virel-favicon-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [{ url: "/virel-favicon-180.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = { themeColor: "#0067C4" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = (await cookies()).get("virel_theme")?.value;
  const attr = theme === "dark" || theme === "light" ? theme : "light";
  return (
    <html lang="tr" data-theme={theme === "system" ? undefined : attr} className={`${quicksand.variable} ${karla.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
