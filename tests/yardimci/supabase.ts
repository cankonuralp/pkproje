/* Supabase'i TAKLİT EDEN veritabanı (tests/yayin.test.ts + bozan): aynı gömülü kümede ayrı bir veritabanı açılır ve Supabase'teki düzen kurulur:
   · göçleri koşan rol SÜPER KULLANICI DEĞİL: Supabase'teki "postgres" gibi NOSUPERUSER + CREATEROLE + BYPASSRLS, veritabanının sahibi
     (2026-10-04 Supabase projesinde ölçüldü; süper kullanıcının GRANT / REVOKE'u her zaman işler, sahip olmayanınki yalnız uyarı verir —
     taklit süper kullanıcıyla koşsaydı 0008'in sessizce etkisiz kalması görünmezdi: 2026-10-04 yayın denetimi);
   · API rolleri (anon / authenticated / service_role), public şemasında kullanım hakkı ve göçü koşan rolün açacağı her yeni tabloya,
     işleve, sayaca bu rollere TÜM yetki (ölçülen pg_default_acl). Sonra göçler uygulanır.
   Dönen: `sahip` = süper kullanıcı bağlantısı (rolün yerine geçip denemek için), `gocu` = göçleri koşan sahip rolünün bağlantısı. */
import { randomBytes } from "node:crypto";
import pg from "pg";
import { gocleriUygula, GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";

export const API_ROLLERI = ["anon", "authenticated", "service_role"] as const;
export const GOCU_ROLU = "supa_sahip";

export interface SupabaseBenzeri { sahip: pg.Client; gocu: pg.Client; kapat(): Promise<void> }

export async function supabaseBenzeri(kume: GomuluKume, ad: string, klasor: string = GOC_KLASORU): Promise<SupabaseBenzeri> {
  const parola = randomBytes(18).toString("base64url");
  const yonetim = kume.sahipIstemci("postgres");
  await yonetim.connect();
  try {
    for (const r of API_ROLLERI) {
      await yonetim.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${r}') THEN CREATE ROLE ${r} NOLOGIN; END IF; END $$`);
    }
    await yonetim.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${GOCU_ROLU}') THEN
      CREATE ROLE ${GOCU_ROLU} LOGIN NOSUPERUSER CREATEROLE BYPASSRLS; END IF; END $$`);
    await yonetim.query(`ALTER ROLE ${GOCU_ROLU} PASSWORD '${parola}'`);
    // Supabase'te uygulama rolünü "postgres" açar ve yönetir; burada küme süper kullanıcısı açtı → aynı hakkı ver
    await yonetim.query(`GRANT probata_uygulama TO ${GOCU_ROLU} WITH ADMIN OPTION`);
    /* 2026-10-05 (0030): müşteri rolü kümede ilk göçte (küme süper kullanıcısıyla) açıldı; Supabase'te onu da "postgres" açar ve yönetir →
       göçü koşan sahip rolüne aynı yönetim hakkı (yalnız yönetim: devralmaz, geçemez) */
    await yonetim.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'probata_musteri') THEN
      CREATE ROLE probata_musteri NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS; END IF; END $$`);
    await yonetim.query(`GRANT probata_musteri TO ${GOCU_ROLU} WITH ADMIN TRUE, INHERIT FALSE, SET FALSE`);
    /* 2026-10-06 (348, 0050): yönetim rolü de öyle — Supabase'te "postgres" açar ve yönetir */
    await yonetim.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'probata_yonetim') THEN
      CREATE ROLE probata_yonetim NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS; END IF; END $$`);
    await yonetim.query(`GRANT probata_yonetim TO ${GOCU_ROLU} WITH ADMIN TRUE, INHERIT FALSE, SET FALSE`);
    await yonetim.query(`CREATE DATABASE ${ad} OWNER ${GOCU_ROLU} ENCODING 'UTF8' LOCALE 'C' TEMPLATE template0`);
  } finally {
    await yonetim.end();
  }
  const sahip = kume.sahipIstemci(ad);
  await sahip.connect();
  const gocu = new pg.Client({ host: kume.uygulama.host, port: kume.uygulama.port, user: GOCU_ROLU, password: parola, database: ad });
  await gocu.connect();
  const roller = API_ROLLERI.join(", ");
  await gocu.query(`GRANT USAGE ON SCHEMA public TO ${roller}`);
  for (const tur of ["TABLES", "FUNCTIONS", "SEQUENCES"]) {
    await gocu.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ${tur} TO ${roller}`);
  }
  await gocleriUygula(gocu, klasor);
  return { sahip, gocu, kapat: async () => { await gocu.end(); await sahip.end(); } };
}
