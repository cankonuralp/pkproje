/* ══ GÖMÜLÜ POSTGRESQL — yerel geliştirme ve testler için (kurulum yok, CLAUDE.md §2) ═════════════════════════
   Yayında yönetilen PostgreSQL kullanılır; bu dosya yalnız yerelde ve testte çalışır.
   · Sahip (yönetici) parolası ve uygulama rolü parolası her kümede RASGELE üretilir; koda yazılmaz. Kalıcı küme
     (data/pg) sahip parolasını data/ altında saklar (data/ git dışı).
   · Açılışta: veritabanı yoksa kurulur → göçler uygulanır → uygulama rolüne oturum açma izni ve yeni parola verilir.
   ⛔ 2026-09-23 (Windows'ta ölçüldü): proje "Masaüstü" altında; PostgreSQL programlarının yolu ü (0xFC, kod sayfası
   1254) taşıyor ve UTF-8 şablonla initdb "invalid byte sequence for encoding UTF8: 0xfc" diyerek düşüyordu. Küme şablonu
   SQL_ASCII kurulur (her baytı kabul eder); uygulamanın veritabanı template0'dan AÇIKÇA UTF-8 açılır — veri yalnız
   oraya yazılır, doğrulama kaybolmaz. Bütün platformlarda aynı (CI Linux'ta da). */
import EmbeddedPostgres from "embedded-postgres";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import pg from "pg";
import { gocleriUygula } from "./goc.ts";
import type { UygulamaBaglantisi } from "./kiraci.ts";

export const VERITABANI = "probata";
export const UYGULAMA_ROLU = "probata_uygulama";

export interface GomuluAyar {
  /** kümenin veri klasörü (yoksa kurulur) */
  klasor: string;
  port: number;
  /** false: durdurulunca veri klasörü silinir (testler) */
  kalici: boolean;
}

export interface GomuluKume {
  uygulama: UygulamaBaglantisi;
  /** sahip (yönetici) bağlantısı — yalnız göç ve test kurulumu için */
  sahipIstemci(): pg.Client;
  durdur(): Promise<void>;
}

const sifreUret = () => randomBytes(24).toString("base64url");

function sahipSifresi(ayar: GomuluAyar): string {
  if (!ayar.kalici) return sifreUret();
  const dosya = join(dirname(ayar.klasor), `${VERITABANI}-sahip.sifre`);
  if (existsSync(dosya)) return readFileSync(dosya, "utf8").trim();
  mkdirSync(dirname(dosya), { recursive: true });
  const sifre = sifreUret();
  writeFileSync(dosya, sifre, { mode: 0o600 });
  return sifre;
}

export async function gomuluBaslat(ayar: GomuluAyar): Promise<GomuluKume> {
  const sahipAdi = "postgres";
  const sahipSifre = sahipSifresi(ayar);
  const kume = new EmbeddedPostgres({
    databaseDir: ayar.klasor,
    port: ayar.port,
    user: sahipAdi,
    password: sahipSifre,
    persistent: ayar.kalici,
    authMethod: "scram-sha-256",
    initdbFlags: ["--encoding=SQL_ASCII", "--locale=C"],
    onLog: () => {},
    onError: (hata) => { console.error("[gömülü PostgreSQL]", hata); },
  });
  const kurulu = existsSync(join(ayar.klasor, "PG_VERSION"));
  if (!kurulu) await kume.initialise();
  await kume.start();

  const sahipIstemci = (veritabani: string = VERITABANI) =>
    new pg.Client({ host: "127.0.0.1", port: ayar.port, user: sahipAdi, password: sahipSifre, database: veritabani });

  const yonetim = sahipIstemci("postgres");
  await yonetim.connect();
  try {
    const var_mi = await yonetim.query("SELECT 1 FROM pg_database WHERE datname = $1", [VERITABANI]);
    if (var_mi.rowCount === 0) await yonetim.query(`CREATE DATABASE ${VERITABANI} ENCODING 'UTF8' LOCALE 'C' TEMPLATE template0`);
  } finally {
    await yonetim.end();
  }

  const uygulamaSifre = sifreUret();
  const sahip = sahipIstemci();
  await sahip.connect();
  try {
    await gocleriUygula(sahip);
    await sahip.query(`ALTER ROLE ${UYGULAMA_ROLU} LOGIN PASSWORD '${uygulamaSifre}'`);
  } finally {
    await sahip.end();
  }

  return {
    uygulama: { host: "127.0.0.1", port: ayar.port, database: VERITABANI, user: UYGULAMA_ROLU, password: uygulamaSifre },
    sahipIstemci: () => sahipIstemci(),
    durdur: () => kume.stop(),
  };
}
