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
  experimental: { serverActions: { bodySizeLimit: "26mb" } },
  env: { NEXT_PUBLIC_IKON_ADRESI: `/${IKON_DOSYASI}?v=${ikonOzeti}` },
  /* PDF motoru (src/belge/pdf.ts, 316): Chromium paketleri derlemeye katılmaz (düğüm modülü olarak yüklenir); belge CSS'i, yazı tipi ve sunucusuz
     Chromium ikilisi yalnız PDF basan uçların izine eklenir */
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: Object.fromEntries([String.raw`/raporlar/\[id\]/pdf`, "/api/olcum/pdf"].map((u) =>
    [u, ["./src/belge/belge.css", "./src/belge/carlito-5.3.0/*", "./node_modules/@sparticuz/chromium/bin/**"]])),
};

const ayar: NextConfig = { ...ortak, output: "standalone" };

export default ayar;
