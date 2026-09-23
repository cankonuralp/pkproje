import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { NextConfig } from "next";

/* İki çıktı (pkproje.md §8.8):
   · gerçek uygulama → "standalone": Türkiye'deki sunucuda Node ile çalışır.
   · önizleme (PROBATA_ONIZLEME=1) → "export": GitHub Pages'e sabit dosya; sunucu, veritabanı, giriş orada ÇALIŞMAZ.
     Adres alt yolu /pkproje/uygulama (maket ve sunum sitenin kökünde kalır). scripts/onizleme.ts kurar. */
const onizleme = process.env.PROBATA_ONIZLEME === "1";
const altYol = onizleme ? "/pkproje/uygulama" : "";

/* ikon dosyası public/vendor'dan (CLAUDE.md §3: üçüncü parti kendi kökenimizden, adında sürüm). Adrese içeriğin özeti
   eklenir: dosya değişince tarayıcı eski dosyayı tutmaz (maket, 2026-09-23: 10 dakika ikonsuz kalma dersi). */
const IKON_DOSYASI = "vendor/lucide-1.47.0/ikonlar.svg";
const ikonOzeti = createHash("sha256").update(readFileSync(`public/${IKON_DOSYASI}`)).digest("hex").slice(0, 10);

const ortak: NextConfig = {
  poweredByHeader: false,
  env: { NEXT_PUBLIC_IKON_ADRESI: `${altYol}/${IKON_DOSYASI}?v=${ikonOzeti}` },
};

const ayar: NextConfig = onizleme
  ? { ...ortak, output: "export", basePath: altYol, trailingSlash: true, images: { unoptimized: true } }
  : { ...ortak, output: "standalone" };

export default ayar;
