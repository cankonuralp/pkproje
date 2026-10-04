/* Uçtan uca test sunucusu (playwright.config.ts webServer): GEÇİCİ gömülü PostgreSQL açar (durunca silinir), göçleri uygular, uydurma iki firma
   ve rol başına hesap ekler (e2e/hesaplar.ts), sonra Next'i geliştirme kipinde 127.0.0.1:3100'de başlatır. Firma adresi http://deneme.localhost:3100
   (ikinci firma "baska": kiracılar arası denemeler için). Bağlantı bilgisi yalnız alt sürece ortam değişkeniyle geçer. */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { E2E_FIRMA, E2E_HESAPLAR, E2E_KAPI, E2E_PAROLA } from "../e2e/hesaplar.ts";
import { gomuluBaslat } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde } from "../src/server/db/kiraci.ts";
import { parolaOzeti } from "../src/server/kimlik/parola.ts";
import { bosKapi } from "../tests/yardimci/kume.ts";
import { nextCalistir } from "./next.ts";

const kume = await gomuluBaslat({ klasor: join(mkdtempSync(join(tmpdir(), "probata-e2e-")), "pg"), port: await bosKapi(), kalici: false });
const sahip = kume.sahipIstemci();
await sahip.connect();
const firmalar = (await sahip.query<{ id: string; kisa_ad: string }>(
  "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ($1, $2, $3), ($4, 'Başka Muayene', 'BM') RETURNING id, kisa_ad",
  [E2E_FIRMA.kisaAd, E2E_FIRMA.ad, E2E_FIRMA.raporKodu, E2E_FIRMA.baskaKisaAd])).rows;
await sahip.end();
const havuz = havuzKur(kume.uygulama);
const ozet = await parolaOzeti(E2E_PAROLA);
for (const f of firmalar) {
  await kiraciIcinde(havuz, f.id, async (db) => {
    for (const h of Object.values(E2E_HESAPLAR)) {
      await db.sorgu("INSERT INTO hesap (eposta, ad, parola_ozeti, roller, durum) VALUES ($1, $2, $3, $4, 'etkin')", [h.eposta, h.ad, ozet, h.roller]);
    }
  });
}
await havuz.end();

let kapaniyor = false;
const kapat = async (kod: number) => { if (kapaniyor) return; kapaniyor = true; await kume.durdur(); process.exit(kod); };
process.on("SIGINT", () => { void kapat(0); });
process.on("SIGTERM", () => { void kapat(0); });

const u = kume.uygulama;
const kod = await nextCalistir("dev", {
  PROBATA_VT_SUNUCU: u.host, PROBATA_VT_KAPI: String(u.port), PROBATA_VT_AD: u.database, PROBATA_VT_KULLANICI: u.user, PROBATA_VT_PAROLA: u.password,
  PROBATA_ANA_ALAN: "localhost", NEXT_TELEMETRY_DISABLED: "1",
}, ["--hostname", "127.0.0.1", "--port", String(E2E_KAPI)]);
await kapat(kod);
