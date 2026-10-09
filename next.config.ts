import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { NextConfig } from "next";

/* Tek çıktı: "standalone" (Node sunucusu; pkproje.md §8.8). 2026-10-04: Pages için statik dışa aktarım ("export") kalktı — uygulama giriş,
   oturum, sunucu eylemleri ve nonce'lu CSP ister (scripts/onizleme.ts). */

/* ikon dosyası public/vendor'dan (CLAUDE.md §3: üçüncü parti kendi kökenimizden, adında sürüm). Adrese içeriğin özeti
   eklenir: dosya değişince tarayıcı eski dosyayı tutmaz (maket, 2026-09-23: 10 dakika ikonsuz kalma dersi). */
const IKON_DOSYASI = "vendor/lucide-1.47.0/ikonlar.svg";
const ikonOzeti = createHash("sha256").update(readFileSync(`public/${IKON_DOSYASI}`)).digest("hex").slice(0, 10);

const ortak: NextConfig = {
  poweredByHeader: false,
  /* sunucu eylemiyle dosya yükleme (rapor formatı PDF'i en çok 25 MB — src/server/dosya/tur.ts SINIR); varsayılan 1 MB */
  /* webpackMemoryOptimizations: yalnız uçtan uca geliştirme sunucusunda (scripts/e2e-sunucu.ts) — uzun koşuda bellek eşiğine dayanıp yeniden
     başlamasın (Next belgesi: düşük riskli, derlemeyi biraz yavaşlatır) */
  /* proxyClientMaxBodySize: ara katman (src/proxy.ts) gövdeyi varsayılan 10 MB'ta keser — imzalı PDF yüklemesi sunucu eylemine tam ulaşsın */
  /* reactDebugChannel: yalnız geliştirme kipinde var (sayfa açılınca sunucuya ayrı canlı bağlantı); uçtan uca sunucusunda kapalı — açıkken
     bağlantısız sunulan sayfa bağlanamıyor (402, scripts/e2e-sunucu.ts PROBATA_HATA_KANALI=0) */
  /* devMemoryThresholdRestart: uçtan uca sunucusunda KAPALI (2026-10-08) — yığın sınırın %80'ini geçince geliştirme sunucusu kendini yeniden
     başlatıyor, o anki test düşüyordu (deneme makinesi 92a79de: masaüstü ve telefonda 95. testte). 2026-10-06'da tek sunucuda ~200 testte kapatmak
     sunucuyu çökertmişti; şimdi genişlik başına ayrı sunucu (~95 test) ve 12 GB yığın — %80 ancak son testte aşılıyor. Yayında geçersiz. */
  experimental: { serverActions: { bodySizeLimit: "26mb" }, proxyClientMaxBodySize: "26mb", webpackMemoryOptimizations: process.env.PROBATA_WEBPACK_BELLEK === "1",
    reactDebugChannel: process.env.PROBATA_HATA_KANALI !== "0", devMemoryThresholdRestart: process.env.PROBATA_WEBPACK_BELLEK !== "1" },
  env: { NEXT_PUBLIC_IKON_ADRESI: `/${IKON_DOSYASI}?v=${ikonOzeti}` },
  /* geliştirme göstergesi (sol altta yüzen rozet): uçtan uca sunucusunda kapalı — telefonda altta yapışkan tuş çubuğunun üstüne binip tıklamayı
     engelliyordu (402); hata olursa geliştirme hata penceresi yine açılır. Yayında zaten yok. */
  ...(process.env.PROBATA_HATA_KANALI === "0" ? { devIndicators: false as const } : {}),
  /* PDF motoru (src/belge/pdf.ts, 316): Chromium paketleri derlemeye katılmaz (düğüm modülü olarak yüklenir); belge CSS'i, yazı tipi ve sunucusuz
     Chromium ikilisi yalnız PDF basan uçların izine eklenir (teklif PDF'i — 325; fatura özeti — 340; talep formu — 341; araç tutanağı — 342) — rapor sayfası da (İmzala sunucu eylemi orada koşar; 315–317
     incelemesi), araç listesi ve araç sayfası da (Tutanağı kaydet eylemi tutanağın PDF'ini orada basar, 342), personel kartı da (zimmet formu İmzaya gönder, 344), eğitim kayıtları da (katılım formu, 345) */
  /* 352 (Vercel Functions Storage kotası): bu sayfalar ve PDF uçları `maxDuration = 60` taşır — Vercel aynı ayarlı uçları tek işlevde toplar, Chromium
     ikilisi yalnız o işlevde kalır; öteki sayfaların ortak işlevi küçülür (kilit: tests/pdf-paket.test.ts) */
  /* 409: tarayıcılar sayfanın simgesinden bağımsız /favicon.ico'yu da ister — 404 yerine sitenin simgesine (src/app/icon.svg) yönlenir */
  async redirects() { return [{ source: "/favicon.ico", destination: "/icon.svg", permanent: true }]; },
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: { ...Object.fromEntries([String.raw`/raporlar/\[id\]`, String.raw`/raporlar/\[id\]/pdf`, String.raw`/teklifler/\[id\]/pdf`, String.raw`/muhasebe/f/\[id\]/pdf`, String.raw`/talepler/pdf/\[tip\]/\[id\]`, "/araclar", String.raw`/araclar/\[id\]`, String.raw`/araclar/tutanak/\[id\]/pdf`,
    String.raw`/personel/\[id\]`, String.raw`/personel/\[id\]/zimmet-formu/pdf`, "/dokumanlar/egitimler", "/api/olcum/pdf"].map((u) =>
    [u, ["./src/belge/belge.css", "./src/belge/carlito-5.3.0/*", "./node_modules/@sparticuz/chromium/bin/**"]])),
    /* 437: Bakanlığın resmî PDF'leri (src/server/bakanlik.ts) yalnız onları okuyan uçların izinde — hazır kurulum (Ana sayfa, Ekipman türleri) ve
       resmî belgeyi gösteren uçlar · 438: "Şablondan başlat" (tür sayfası) ve "Tür olarak ekle" (liste, şablon önizlemesi) eylemleri de okur */
    ...Object.fromEntries(["/", "/ekipman-turleri", String.raw`/ekipman-turleri/\[id\]`, String.raw`/ekipman-turleri/sablon/\[anahtar\]`,
      String.raw`/ekipman-turleri/sablon/\[anahtar\]/pdf`, String.raw`/dokumanlar/kriterler/\[kod\]/pdf`]
      .map((u) => [u, ["./src/tanim/bakanlik/*.pdf"]])) },
};

const ayar: NextConfig = { ...ortak, output: "standalone" };

export default ayar;
