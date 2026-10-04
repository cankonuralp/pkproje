/* OLUMSUZ KANIT — tests/giris.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): bozma çalışma anında, geçici test
   kümesinde sahip bağlantısıyla yapılır. (1) Tetik kalkınca rol değişse de açık oturum yaşar → "rol değişince oturum düşer" kapısı tetiktir.
   (2) Oturum politikası "herkes" olunca firma A'nın belirteci firma B'nin adresinde geçer → kiracı kapısı RLS politikasıdır. K1 (2026-10-04). */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { girisYap, oturumOku } from "../../src/server/kimlik/oturum.ts";
import { parolaOzeti } from "../../src/server/kimlik/parola.ts";
import { testKumesi } from "../yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const T0 = new Date("2026-10-04T09:00:00Z");

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const sahip = kume.sahipIstemci();
  await sahip.connect();
  try {
    [A, B] = (await sahip.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await sahip.end(); }
  const ozet = await parolaOzeti("dogruParola1");
  await kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO hesap (eposta, ad, parola_ozeti, roller, durum) VALUES ('kisi@deneme.example', 'Deneme', $1, '{denetci}', 'etkin')", [ozet]));
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

async function sahipKos(sql: string) {
  const s = kume.sahipIstemci(); await s.connect();
  try { await s.query(sql); } finally { await s.end(); }
}

test("tetik kalkınca rol değişse de açık oturum yaşar (kilidin koruduğu açık)", async () => {
  const g = await girisYap(havuz, A, { eposta: "kisi@deneme.example", parola: "dogruParola1", ip: "10.0.0.1", simdi: T0 });
  assert.ok(g.tamam);
  await sahipKos("DROP TRIGGER hesap_oturum_dusur ON hesap");
  await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE hesap SET roller = '{firma_yoneticisi}'"));
  const o = g.tamam ? await oturumOku(havuz, A, g.belirtec, new Date(T0.getTime() + 60_000)) : null;
  assert.ok(o, "tetiksiz: yetki değişti ama oturum düşmedi");
});

test("oturum politikası açılınca A'nın belirteci B'nin adresinde geçer (kilidin koruduğu açık)", async () => {
  const g = await girisYap(havuz, A, { eposta: "kisi@deneme.example", parola: "dogruParola1", ip: "10.0.0.2", simdi: T0 });
  assert.ok(g.tamam);
  await sahipKos("DROP POLICY oturum_kiraci ON oturum; CREATE POLICY oturum_kiraci ON oturum USING (true); DROP POLICY hesap_kiraci ON hesap; CREATE POLICY hesap_kiraci ON hesap USING (true)");
  const o = g.tamam ? await oturumOku(havuz, B, g.belirtec, new Date(T0.getTime() + 60_000)) : null;
  assert.ok(o, "politikasız: başka firmanın oturumu geçti");
});
