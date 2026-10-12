/* OLUMSUZ KANIT — tests/say-chat-kayit.test.ts (524, göç 0085) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre
   kopyalanır, 0085'teki iki denetim bellekte kaldırılır. O zaman:
   1) politikadan kişi koşulu kalkınca aynı firmadaki iş arkadaşı (ya da yönetici) birinin S.A.Y Chat kaydını okur — m.2 "sohbeti yalnız kaydı
      yazan görür" çiğnenir;
   2) tetikten plan koşulu kalkınca kayıt başka bir plana taşınır (kayıt planın sohbetine bağlıdır). */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const BOZMALAR: [string, string][] = [
  /* 1 politika */ ["      USING (firma_id = gecerli_firma() AND hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid)\n", "      USING (firma_id = gecerli_firma())\n"],
  /* 2 plan değişmez */ [" OR NEW.plan_id IS DISTINCT FROM OLD.plan_id", ""],
];
const VT = "say_chat_bozuk";
const gecici = mkdtempSync(join(tmpdir(), "say-chat-bozan-"));
let kume: GomuluKume, supa: SupabaseBenzeri, havuz: Havuz, A = "", X = "", Y = "", P1 = "", P2 = "";

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0085_")) {
      let k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      for (const [eski, yeni] of BOZMALAR) { assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 60)}`); k = k.replace(eski, yeni); }
      writeFileSync(join(klasor, ad), k);
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, VT, klasor);
  havuz = havuzKur({ ...kume.uygulama, database: VT });
  const q = async (sql: string, p: unknown[] = []) => (await supa.sahip.query<{ id: string }>(sql, p)).rows.map((r) => r.id);
  [A] = await q("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('boz-scc', 'Bozuk Chat', 'BC') RETURNING id::text");
  [X, Y] = await q("INSERT INTO hesap (firma_id, eposta, ad, roller, durum) VALUES ($1, 'x@boz-scc.example', 'Deneme X', '{denetci}', 'etkin'), ($1, 'y@boz-scc.example', 'Deneme Y', '{firma_yoneticisi}', 'etkin') RETURNING id::text", [A]);
  const [m] = await q("INSERT INTO musteri (firma_id, unvan, kisa, eposta, tel) VALUES ($1, 'Deneme Sanayi', 'Deneme', 'iletisim@boz-scc.example', '0312 000 00 00') RETURNING id::text", [A]);
  const [t] = await q("INSERT INTO tesis (firma_id, musteri_id, ad, adres, il, ilce) VALUES ($1, $2, 'Deneme Tesis', 'Deneme Cad. 1', 'Ankara', 'Çankaya') RETURNING id::text", [A, m]);
  [P1, P2] = await q(`INSERT INTO plan (firma_id, no, tesis_id, baslangic, bitis, firma_adi, acan) VALUES
    ($1, 'P-1026-901', $2, current_date, current_date, 'Deneme Sanayi', 'Deneme'), ($1, 'P-1026-902', $2, current_date, current_date, 'Deneme Sanayi', 'Deneme') RETURNING id::text`, [A, t]);
  await kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO say_chat_kayit (cihaz_id, plan_id, mesaj) VALUES (gen_random_uuid(), $1, '[\"X in kaydı\"]'::jsonb)", [P1]), { hesapId: X });
});
after(async () => { await havuz?.end(); await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("1) politikadan kişi koşulu kalkınca yönetici birinin S.A.Y Chat kaydını okur", async () => {
  const n = (await kiraciIcinde(havuz, A, (db) => db.sorgu("SELECT 1 FROM say_chat_kayit"), { hesapId: Y })).rowCount;
  assert.equal(n, 1, "bozuk: Y, X'in kaydını gördü");
});

test("2) tetikten plan koşulu kalkınca kayıt başka plana taşınır", async () => {
  await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE say_chat_kayit SET plan_id = $1", [P2]), { hesapId: X });
  assert.equal((await supa.sahip.query("SELECT 1 FROM say_chat_kayit WHERE plan_id = $1", [P2])).rowCount, 1, "bozuk: kayıt başka plana taşındı");
});
