import type { MetadataRoute } from "next";

const BASE_URL = "https://drive.virel.com.tr";

/** Yalnızca gerçekten herkese açık, içerik taşıyan iki sayfa — geri kalan her şey oturum
 *  gerektiriyor ve robots.ts'te zaten taramadan çıkarılmış. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/giris`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
