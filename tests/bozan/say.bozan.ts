/* OLUMSUZ KANIT — tests/say.test.ts ve tests/say-saf.test.ts neyi koruyor (380, göç 0071). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici
   klasöre kopyalanır, 0071'deki üç denetim bellekte kaldırılır; say.ts bellekte bozulup geçici klasörden içe aktarılır. O zaman:
   1) politikadan kişi koşulu kalkınca aynı firmadaki iş arkadaşı birinin S.A.Y geçmişini okur;
   2) temizlemeden kişi koşulu kalkınca "Sohbeti temizle" bütün firmanın geçmişini siler;
   3) tetikten mesaj koşulu kalkınca kişinin S.A.Y mesaj sayısı geriye çekilir (kullanım gizlenir);
   4) konuşmanın başı düzeltilmezse istek asistan iletisiyle başlar (Messages API bunu reddeder — S.A.Y hiç cevap veremez). */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { yzAyi, yzMesajSay } from "../../src/server/yz/kullanim.ts";
import { sohbetGecmisi, sohbetTemizle, sohbetYaz } from "../../src/server/yz/sohbet.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const BOZMALAR: [string, string][] = [
  /* 1 politika */ ["      USING (firma_id = gecerli_firma() AND hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid)\n", "      USING (firma_id = gecerli_firma())\n"],
  /* 2 temizle */ ["  DELETE FROM yz_sohbet WHERE firma_id = f AND hesap_id = ben;\n", "  DELETE FROM yz_sohbet WHERE firma_id = f;\n"],
  /* 3 mesaj */ [" OR NEW.mesaj < OLD.mesaj THEN", " THEN"],
];
const VT = "say_bozuk";
const gecici = mkdtempSync(join(tmpdir(), "say-bozan-"));
let kume: GomuluKume, supa: SupabaseBenzeri, havuz: Havuz, A = "", X = "", Y = "";

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0071_")) {
      let k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      for (const [eski, yeni] of BOZMALAR) { assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 60)}`); k = k.replace(eski, yeni); }
      writeFileSync(join(klasor, ad), k);
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, VT, klasor);
  havuz = havuzKur({ ...kume.uygulama, database: VT });
  A = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('boz-say', 'Bozuk Say', 'BS') RETURNING id::text")).rows[0].id;
  [X, Y] = (await supa.sahip.query<{ id: string }>(
    "INSERT INTO hesap (firma_id, eposta, ad, roller, durum) VALUES ($1, 'x@boz-say.example', 'Deneme X', '{denetci}', 'etkin'), ($1, 'y@boz-say.example', 'Deneme Y', '{planlama}', 'etkin') RETURNING id::text", [A])).rows.map((r) => r.id);
  await kiraciIcinde(havuz, A, (db) => sohbetYaz(db, { kim: "ben", metin: "X'in özel sorusu", yer: "Ana sayfa" }), { hesapId: X });
});
after(async () => { await havuz?.end(); await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("1) politikadan kişi koşulu kalkınca iş arkadaşı birinin geçmişini okur", async () => {
  const l = await kiraciIcinde(havuz, A, (db) => sohbetGecmisi(db), { hesapId: Y });
  assert.ok(l.some((m) => m.metin === "X'in özel sorusu"), "bozuk: Y, X'in geçmişini gördü");
});

test("2) temizlemeden kişi koşulu kalkınca 'Sohbeti temizle' herkesin geçmişini siler", async () => {
  await kiraciIcinde(havuz, A, (db) => sohbetYaz(db, { kim: "ben", metin: "Y'nin sorusu", yer: "Ana sayfa" }), { hesapId: Y });
  await kiraciIcinde(havuz, A, (db) => sohbetTemizle(db), { hesapId: Y });
  assert.equal((await supa.sahip.query("SELECT 1 FROM yz_sohbet WHERE hesap_id = $1", [X])).rowCount, 0, "bozuk: X'in geçmişi de silindi");
});

test("3) tetikten mesaj koşulu kalkınca mesaj sayısı geriye çekilir", async () => {
  await kiraciIcinde(havuz, A, (db) => yzMesajSay(db, yzAyi()), { hesapId: X });
  await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE yz_kullanim SET mesaj = mesaj - 1"), { hesapId: X });
  assert.equal((await supa.sahip.query<{ mesaj: number }>("SELECT mesaj FROM yz_kullanim WHERE hesap_id = $1", [X])).rows[0].mesaj, 0, "bozuk: kullanım geriye çekildi");
});

test("4) konuşmanın başı düzeltilmezse istek asistan iletisiyle başlar", async () => {
  const kok = resolve("src/server/yz");
  const KAYNAK = readFileSync(join(kok, "say.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(kok, y)).href}"`);
  const SATIR = "  while (l.length && l[0].role !== \"user\") l.shift();\n";
  assert.ok(KAYNAK.includes(SATIR), "bozulacak satır kaynakta yok");
  const yol = join(gecici, "say-bozuk.ts");
  writeFileSync(yol, KAYNAK.replace(SATIR, ""));
  const m = await import(pathToFileURL(yol).href) as typeof import("../../src/server/yz/say.ts");
  assert.equal(m.konusma([{ kim: "say", metin: "Sizi bekleyenler:" }], "Soru")[0].role, "assistant", "bozuk: konuşma asistanla başladı");
});
