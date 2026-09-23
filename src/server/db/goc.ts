/* ══ GÖÇ KOŞUCUSU — src/server/db/gocler/NNNN_ad.sql dosyalarını sırayla uygular ═════════════════════════════
   Sahip (yönetici) bağlantısıyla koşar; uygulama rolüyle DEĞİL. Uygulanan her göç `goc` tablosuna adıyla ve içeriğinin
   SHA-256 özetiyle yazılır. Kurallar:
   · Uygulanmış göç DEĞİŞTİRİLEMEZ: özet tutmazsa koşucu durur (sessiz sapma yok) — düzeltme yeni göçle yapılır.
   · Her göç kendi işleminde; hata olursa o göç geri alınır ve hata yukarı fırlatılır (yutulmaz).
   · Göç dosyası idempotent yazılır (CLAUDE.md §3); koşucu da uygulanmışı atlar — iki kez koşmak güvenlidir. */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type pg from "pg";

export const GOC_KLASORU = join(import.meta.dirname, "gocler");
const AD_KALIBI = /^\d{4}_[a-z0-9_]+\.sql$/;

export interface GocDosyasi {
  ad: string;
  metin: string;
  ozet: string;
}

export function gocDosyalari(klasor: string = GOC_KLASORU): GocDosyasi[] {
  return readdirSync(klasor)
    .filter((ad) => ad.endsWith(".sql"))
    .sort()
    .map((ad) => {
      if (!AD_KALIBI.test(ad)) throw new Error(`Göç dosyası adı kurala uymuyor (NNNN_ad.sql): ${ad}`);
      const metin = readFileSync(join(klasor, ad), "utf8");
      return { ad, metin, ozet: createHash("sha256").update(metin).digest("hex") };
    });
}

/** Uygulanmamış göçleri uygular; uygulananların adlarını döndürür. */
export async function gocleriUygula(sahip: pg.Client, klasor: string = GOC_KLASORU): Promise<string[]> {
  await sahip.query(`CREATE TABLE IF NOT EXISTS goc (
    ad text PRIMARY KEY, ozet text NOT NULL, uygulandi timestamptz NOT NULL DEFAULT now())`);
  const onceki = new Map<string, string>(
    (await sahip.query<{ ad: string; ozet: string }>("SELECT ad, ozet FROM goc")).rows.map((r) => [r.ad, r.ozet]),
  );
  const uygulanan: string[] = [];
  for (const goc of gocDosyalari(klasor)) {
    const kayitli = onceki.get(goc.ad);
    if (kayitli !== undefined) {
      if (kayitli !== goc.ozet) throw new Error(`Uygulanmış göç değiştirilmiş: ${goc.ad} (yeni göç yazın, eskisini değiştirmeyin)`);
      continue;
    }
    await sahip.query("BEGIN");
    try {
      await sahip.query(goc.metin);
      await sahip.query("INSERT INTO goc (ad, ozet) VALUES ($1, $2)", [goc.ad, goc.ozet]);
      await sahip.query("COMMIT");
    } catch (hata) {
      await sahip.query("ROLLBACK");
      throw new Error(`Göç uygulanamadı: ${goc.ad}`, { cause: hata });
    }
    uygulanan.push(goc.ad);
  }
  return uygulanan;
}
