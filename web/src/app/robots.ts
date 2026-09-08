import type { MetadataRoute } from "next";

const BASE_URL = "https://drive.virel.com.tr";

/** Yalnızca tanıtım sayfası (/) ve giriş ekranı taranabilir — kurs konsolu, süper admin ve
 *  mobil portallar zaten oturum gerektiriyor, tarayıcı orada yönlendirmeden başka bir şey
 *  görmez. Onları da açık açık kapatmak, taramanın boşuna o sayfalara gitmesini engeller. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/admin", "/kursiyer", "/egitmen", "/api"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
