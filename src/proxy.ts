/* İSTEK ARA KATMANI (Next 16 "proxy") — her sayfa isteğine güvenlik başlıkları (reisim 2026-10-04: "site güvenliği … sızma veri çalma"):
   · CSP (09-E3, anayasa 5.2: yalnız kendi kökenimiz): her istekte yeni nonce; betik yalnız nonce'lu ve onun yüklediği (strict-dynamic) — sayfaya
     sızdırılmış bir <script> çalışmaz. Çerçeveye gömülemez (frame-ancestors 'none' → tıklama hırsızlığı yok), form yalnız kendi kökenine gider,
     <base> değiştirilemez, eklenti (object) yok. Geliştirmede React'in hata ayıklaması için eval ve satır içi stil açık; yayında kapalı.
   · nosniff, sıkı Referrer-Policy, kamera yalnız kendi kökenimiz (saha fotoğrafı), konum / mikrofon kapalı, yayında HSTS.
   Kiracı ve oturum burada DEĞİL, sayfada / eylemde veritabanıyla denetlenir (ara katman veritabanına gitmez). */
import { NextResponse, type NextRequest } from "next/server";

export function proxy(istek: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const gelistirme = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${gelistirme ? " 'unsafe-eval'" : ""}`,
    gelistirme ? "style-src 'self' 'unsafe-inline'" : `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(gelistirme ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const baslik = new Headers(istek.headers);
  baslik.set("x-nonce", nonce);
  baslik.set("Content-Security-Policy", csp);
  /* isteğin yolu (oturum dolunca girişten sonra kaldığı sayfaya dönmek için, S2). İstemcinin aynı adlı başlığı EZİLİR; değer yine de yalnız
     güvenli site içi yol olarak kullanılır (guvenliDonus). */
  baslik.set("x-probata-yol", istek.nextUrl.pathname + istek.nextUrl.search);
  const yanit = NextResponse.next({ request: { headers: baslik } });
  yanit.headers.set("Content-Security-Policy", csp);
  yanit.headers.set("X-Content-Type-Options", "nosniff");
  yanit.headers.set("Referrer-Policy", "same-origin");
  yanit.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(), payment=(), usb=()");
  yanit.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  yanit.headers.set("X-Frame-Options", "DENY");
  if (!gelistirme) yanit.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  return yanit;
}

export const config = {
  matcher: [{
    source: "/((?!_next/static|_next/image|vendor/|icon.svg|favicon.ico).*)",
    missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }],
  }],
};
