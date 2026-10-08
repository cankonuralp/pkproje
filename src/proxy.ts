/* İSTEK ARA KATMANI (Next 16 "proxy") — her sayfa isteğine güvenlik başlıkları (reisim 2026-10-04: "site güvenliği … sızma veri çalma"):
   · CSP (09-E3, anayasa 5.2: yalnız kendi kökenimiz): her istekte yeni nonce; betik yalnız nonce'lu ve onun yüklediği (strict-dynamic) — sayfaya
     sızdırılmış bir <script> çalışmaz. Çerçeveye gömülemez (frame-ancestors 'none' → tıklama hırsızlığı yok), form yalnız kendi kökenine gider,
     <base> değiştirilemez, eklenti (object) yok. Geliştirmede React'in hata ayıklaması için eval ve satır içi stil açık; yayında kapalı.
   · nosniff, sıkı Referrer-Policy, kamera yalnız kendi kökenimiz (saha fotoğrafı), konum / mikrofon kapalı, yayında HSTS.
   Kiracı ve oturum burada DEĞİL, sayfada / eylemde veritabanıyla denetlenir (ara katman veritabanına gitmez). */
import { NextResponse, type NextRequest } from "next/server";
import { API_SURUMU, istemciEskiMi } from "./server/api-surum";
import { yonetimAdresiMi } from "./server/yonetim/adres";

/* 348 (KOD-GECIS Y1 "ayrı adres"): yönetim sayfası YALNIZ yönetim adresinde; yönetim adresinde de YALNIZ yönetim sayfası (firma ekranı, müşteri
   paneli, API orada yok). Öteki her adreste /yonetim yoktur. Bulunamadı sayfasına çevrilir (404); sayfa da adresi ayrıca denetler. */
const YONETIM_YOLU = /^\/yonetim(\/|$)/;
const YOK_YOLU = "/_bulunamadi";

export function proxy(istek: NextRequest) {
  const yol = istek.nextUrl.pathname;
  const yonetimde = yonetimAdresiMi(istek.headers.get("host"));
  if (yonetimde && yol === "/") return NextResponse.redirect(new URL("/yonetim", istek.url));
  /* Next'in kendi uçları (/_next/…: geliştirmede sıcak yenileme) yönetim adresinde de açık */
  const yasak = yonetimde ? !YONETIM_YOLU.test(yol) && !yol.startsWith("/_next/") : YONETIM_YOLU.test(yol);
  /* önceden yükleme (Link prefetch) isteği: adres ayrımı onda da geçerli (347–348 incelemesi: eşleştiricideki "missing" istisnası ara katmanı
     tümden atlatıyordu — yönetim adresinde /api açılıyordu); nonce / CSP yalnız tam sayfa isteğinde üretilir (Next'in önerisi) */
  const onYukleme = istek.headers.has("next-router-prefetch") || istek.headers.get("purpose") === "prefetch";
  if (onYukleme) return yasak ? NextResponse.rewrite(new URL(YOK_YOLU, istek.url)) : NextResponse.next();
  const api = istek.nextUrl.pathname.startsWith("/api/");
  /* eski cihaz uygulaması: veri yazmadan önce durdurulur (src/server/api-surum.ts) */
  if (api && !yasak && istek.nextUrl.pathname !== "/api/surum" && istemciEskiMi(istek.headers.get("x-probata-istemci"))) {
    return NextResponse.json({ hata: "Uygulamanın yeni sürümünü yükleyin.", api: API_SURUMU }, { status: 426, headers: { "X-Probata-Api": String(API_SURUMU), "Cache-Control": "no-store" } });
  }
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
    /* 395: çevrimdışı servis çalışanı (public/sw.js) yalnız kendi kökenimizden — strict-dynamic betik kuralı çalışanı kapsamaz */
    "worker-src 'self'",
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
  const yanit = yasak ? NextResponse.rewrite(new URL(YOK_YOLU, istek.url), { request: { headers: baslik } }) : NextResponse.next({ request: { headers: baslik } });
  /* dosya ucu kendi sıkı CSP'sini ve gömme sınırını yazar (src/server/dosya/dosya.ts indirmeBasliklari); sayfa CSP'si onu ezmesin */
  const dosyaUcu = istek.nextUrl.pathname.startsWith("/api/dosya/");
  if (!dosyaUcu) yanit.headers.set("Content-Security-Policy", csp);
  yanit.headers.set("X-Content-Type-Options", "nosniff");
  yanit.headers.set("Referrer-Policy", "same-origin");
  yanit.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(), payment=(), usb=()");
  yanit.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (!dosyaUcu) yanit.headers.set("X-Frame-Options", "DENY");
  if (!gelistirme) yanit.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  if (api) yanit.headers.set("X-Probata-Api", String(API_SURUMU));
  return yanit;
}

export const config = {
  matcher: [{ source: "/((?!_next/static|_next/image|vendor/|icon.svg|favicon.ico).*)" }],
};
