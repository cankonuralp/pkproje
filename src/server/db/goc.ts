/* ══ GÖÇ KOŞUCUSU — src/server/db/gocler/NNNN_ad.sql dosyalarını sırayla uygular ═════════════════════════════
   Sahip (yönetici) bağlantısıyla koşar; uygulama rolüyle DEĞİL. Uygulanan her göç `goc` tablosuna adıyla ve içeriğinin
   SHA-256 özetiyle yazılır. Kurallar:
   · Uygulanmış göç DEĞİŞTİRİLEMEZ: özet tutmazsa koşucu durur (sessiz sapma yok) — düzeltme yeni göçle yapılır.
   · Her göç kendi işleminde; hata olursa o göç geri alınır ve hata yukarı fırlatılır (yutulmaz).
   · Göç dosyası idempotent yazılır (CLAUDE.md §3); koşucu da uygulanmışı atlar — iki kez koşmak güvenlidir.
   FV8 (FIRMA-VT §5.5, 2026-10-16): koşucu bir YÜRÜTÜCÜ üzerinden (GocYurutucu: kayıtlılar + tek göç uygula) — pgYurutucu sahip bağlantısıyla (bugünkü
   davranış; testler, gömülü veritabanı), src/server/dis/supabase-yonetim.ts yonetimApiYurutucu Supabase Yönetim API'siyle (göç dağıtıcının "uygula"
   kipi). gocFarki saf: eksik, değiştirilmiş, kodda olmayan göçler. Göç dosyalarında BEGIN / COMMIT / CONCURRENTLY yok (tek işlemde koşar — kilit
   tests/goc-yurutucu.test.ts). */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type pg from "pg";

export const GOC_KLASORU = join(import.meta.dirname, "gocler");
export const AD_KALIBI = /^\d{4}_[a-z0-9_]+\.sql$/;

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

/** göçleri bir veritabanına uygulayan: kayıtlılar (ad → özet) ve tek göç (kendi işleminde, kaydıyla; düşerse geri alınır, hata yukarı) */
export interface GocYurutucu {
  kayitli(): Promise<Map<string, string>>;
  uygula(goc: GocDosyasi): Promise<void>;
}

/** sahip (yönetici) bağlantısıyla — bugünkü davranış */
export function pgYurutucu(sahip: pg.Client): GocYurutucu {
  return {
    async kayitli() {
      await sahip.query(`CREATE TABLE IF NOT EXISTS goc (
        ad text PRIMARY KEY, ozet text NOT NULL, uygulandi timestamptz NOT NULL DEFAULT now())`);
      return new Map((await sahip.query<{ ad: string; ozet: string }>("SELECT ad, ozet FROM goc")).rows.map((r) => [r.ad, r.ozet]));
    },
    async uygula(goc) {
      await sahip.query("BEGIN");
      try {
        await sahip.query(goc.metin);
        await sahip.query("INSERT INTO goc (ad, ozet) VALUES ($1, $2)", [goc.ad, goc.ozet]);
        await sahip.query("COMMIT");
      } catch (hata) {
        await sahip.query("ROLLBACK");
        throw hata;
      }
    },
  };
}

/** kayıtlılarla dosyaların farkı (saf): eksik (sırayla uygulanacak) · değiştirilmiş (özeti tutmayan — yeni göç yazılmalı) · kodda olmayan (veritabanı
    koddan ileride) */
export interface GocFarki { eksik: GocDosyasi[]; degismis: string[]; fazla: string[] }
export function gocFarki(kayitli: ReadonlyMap<string, string>, dosyalar: readonly GocDosyasi[]): GocFarki {
  const adlar = new Set(dosyalar.map((d) => d.ad));
  return {
    eksik: dosyalar.filter((d) => !kayitli.has(d.ad)),
    degismis: dosyalar.filter((d) => kayitli.has(d.ad) && kayitli.get(d.ad) !== d.ozet).map((d) => d.ad),
    fazla: [...kayitli.keys()].filter((ad) => !adlar.has(ad)).sort(),
  };
}

/** Uygulanmamış göçleri uygular; uygulananların adlarını döndürür. Sahip bağlantısı ya da yürütücü alır. */
export async function gocleriUygula(hedef: pg.Client | GocYurutucu, klasor: string = GOC_KLASORU): Promise<string[]> {
  const y = "kayitli" in hedef ? hedef : pgYurutucu(hedef);
  const onceki = await y.kayitli();
  const uygulanan: string[] = [];
  for (const goc of gocDosyalari(klasor)) {
    const kayitli = onceki.get(goc.ad);
    if (kayitli !== undefined) {
      if (kayitli !== goc.ozet) throw new Error(`Uygulanmış göç değiştirilmiş: ${goc.ad} (yeni göç yazın, eskisini değiştirmeyin)`);
      continue;
    }
    try {
      await y.uygula(goc);
    } catch (hata) {
      throw new Error(`Göç uygulanamadı: ${goc.ad}`, { cause: hata });
    }
    uygulanan.push(goc.ad);
  }
  return uygulanan;
}
