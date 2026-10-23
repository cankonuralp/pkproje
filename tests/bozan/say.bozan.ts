/* OLUMSUZ KANIT — tests/say.test.ts neyi koruyor (380, göç 0071; 2026-10-23 S.A.Y baştan, göç 0103). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11):
   göçler geçici klasöre kopyalanır, denetimler bellekte kaldırılır; çekirdek ve modül dosyaları bellekte bozulup geçici klasörden içe aktarılır. O zaman:
   1) görünen geçmişin politikasından kişi koşulu kalkınca aynı firmadaki iş arkadaşı birinin S.A.Y geçmişini okur;
   2) temizlemeden kişi koşulu kalkınca "Sohbeti temizle" bütün firmanın geçmişini siler;
   3) tetikten mesaj koşulu kalkınca kişinin S.A.Y mesaj sayısı geriye çekilir (kullanım gizlenir);
   4) konuşmanın (yz_konusma) politikasından kişi koşulu kalkınca iş arkadaşı birinin konuşmasını — eklerini, raporlarını — okur;
   5) konuşmanın sahibi oturumdan damgalanmazsa biri başkasının konuşmasına ileti yazar (başkasının S.A.Y'ına talimat sokar);
   6) konuşma değiştirilebilirse geçmiş yeniden yazılır (düşünmeler geçersiz, konuşma güvenilmez);
   7) cevapsız sayfa notu silinirken "son yapay zekâ iletisinden sonra" koşulu kalkarsa eski notlar da silinir (konuşmanın ortası değişir);
   8) yeni iletide cevapsız araç çağrıları kapanmazsa konuşma araç sonucu olmadan sürer (hizmet her isteği reddeder — S.A.Y hiç cevap veremez). */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { konusmaEkle, konusmaOku } from "../../src/server/yz/konusma.ts";
import { yzAyi, yzMesajSay } from "../../src/server/yz/kullanim.ts";
import { sohbetGecmisi, sohbetTemizle, sohbetYaz } from "../../src/server/yz/sohbet.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const BOZMALAR: Record<string, [string, string][]> = {
  "0071_": [
    /* 1 politika */ ["      USING (firma_id = gecerli_firma() AND hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid)\n", "      USING (firma_id = gecerli_firma())\n"],
    /* 2 temizle */ ["  DELETE FROM yz_sohbet WHERE firma_id = f AND hesap_id = ben;\n", "  DELETE FROM yz_sohbet WHERE firma_id = f;\n"],
    /* 3 mesaj */ [" OR NEW.mesaj < OLD.mesaj THEN", " THEN"],
  ],
  "0103_": [
    /* 4 konuşmanın politikası: kişi koşulu olmayan ikinci (izin veren) politika — politikalar VEYA ile birleşir */
    ["/* sahibi işlemin bağlamından (istemciden alınmaz)", "CREATE POLICY yz_konusma_firma ON yz_konusma USING (firma_id = (SELECT gecerli_firma()));\n/* sahibi işlemin bağlamından (istemciden alınmaz)"],
    /* 5 sahibin damgası: istemcinin verdiği hesap geçer */ ["    NEW.hesap_id := ben;\n    RETURN NEW;\n  END IF;\n  IF TG_TABLE_NAME <> 'yz_konusma_is'",
      "    NEW.hesap_id := coalesce(NEW.hesap_id, ben);\n    RETURN NEW;\n  END IF;\n  IF TG_TABLE_NAME <> 'yz_konusma_is'"],
    /* 6 değişmezlik: hem yetki (UPDATE yok) hem tetik */
    ["  IF TG_TABLE_NAME <> 'yz_konusma_is' THEN RAISE EXCEPTION 'S.A.Y konuşması değişmez; yalnız sona eklenir' USING ERRCODE = '23514'; END IF;\n", ""],
    ["GRANT SELECT, INSERT, DELETE ON yz_konusma TO probata_uygulama;", "GRANT SELECT, INSERT, UPDATE, DELETE ON yz_konusma TO probata_uygulama;"],
  ],
};
const VT = "say_bozuk";
const gecici = mkdtempSync(join(tmpdir(), "say-bozan-"));
let kume: GomuluKume, supa: SupabaseBenzeri, havuz: Havuz, A = "", X = "", Y = "";

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    const bozma = Object.entries(BOZMALAR).find(([on]) => ad.startsWith(on))?.[1];
    if (bozma) {
      let k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      for (const [eski, yeni] of bozma) { assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 60)}`); k = k.replace(eski, yeni); }
      writeFileSync(join(klasor, ad), k);
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, VT, klasor);
  havuz = havuzKur({ ...kume.uygulama, database: VT });
  A = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('boz-say', 'Bozuk Say', 'BS') RETURNING id::text")).rows[0].id;
  [X, Y] = (await supa.sahip.query<{ id: string }>(
    "INSERT INTO hesap (firma_id, eposta, ad, roller, durum) VALUES ($1, 'x@boz-say.example', 'Deneme X', '{denetci}', 'etkin'), ($1, 'y@boz-say.example', 'Deneme Y', '{planlama}', 'etkin') RETURNING id::text", [A])).rows.map((r) => r.id);
  await kiraciIcinde(havuz, A, (db) => sohbetYaz(db, { kim: "ben", metin: "X'in özel sorusu", yer: "Ana sayfa" }), { hesapId: X });
  await kiraciIcinde(havuz, A, (db) => konusmaEkle(db, "user", [{ type: "text", text: "X'in özel konuşması" }]), { hesapId: X });
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

test("4) konuşmanın politikasından kişi koşulu kalkınca iş arkadaşı birinin konuşmasını okur", async () => {
  const l = await kiraciIcinde(havuz, A, (db) => konusmaOku(db), { hesapId: Y });
  assert.ok(l.some((m) => JSON.stringify(m.icerik).includes("X'in özel konuşması")), "bozuk: Y, X'in konuşmasını gördü");
});

test("5) sahibi damgalanmazsa biri başkasının konuşmasına yazar", async () => {
  await kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO yz_konusma (hesap_id, rol, icerik) VALUES ($1, 'user', '\"sokulan talimat\"'::jsonb)", [X]), { hesapId: Y });
  assert.equal((await supa.sahip.query("SELECT 1 FROM yz_konusma WHERE hesap_id = $1 AND icerik = '\"sokulan talimat\"'::jsonb", [X])).rowCount, 1,
    "bozuk: Y, X'in konuşmasına yazdı");
});

test("6) konuşma değiştirilebilirse geçmiş yeniden yazılır", async () => {
  await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE yz_konusma SET icerik = '\"yeniden yazıldı\"'::jsonb WHERE hesap_id = $1", [X]), { hesapId: X });
  assert.ok((await supa.sahip.query("SELECT 1 FROM yz_konusma WHERE icerik = '\"yeniden yazıldı\"'::jsonb")).rowCount, "bozuk: konuşma değişti");
});

const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), y)).href}"`);
let sira = 0;
async function bozuk<T>(k: string, eski: string, yeni: string): Promise<T> {
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `m-${sira++}.ts`);
  writeFileSync(yol, k.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<T>;
}

test("7) not silinirken 'son yapay zekâ iletisinden sonra' koşulu kalkarsa konuşmanın ortası değişir", async () => {
  const m = await bozuk<typeof import("../../src/server/yz/konusma.ts")>(kaynak("src/server/yz/konusma.ts"),
    "\n       AND sira > coalesce((SELECT max(sira) FROM yz_konusma WHERE rol = 'assistant'), 0)", "");
  await kiraciIcinde(havuz, A, async (db) => {
    await m.konusmaEkle(db, "system", "Kullanıcı şu sayfada: Planlar.");
    await m.konusmaEkle(db, "assistant", [{ type: "text", text: "Cevap" }]);
    await m.kuyrukNotlariniSil(db);
  }, { hesapId: Y });
  assert.ok(!(await kiraciIcinde(havuz, A, (db) => konusmaOku(db), { hesapId: Y })).some((x) => x.rol === "system"), "bozuk: cevaplanmış sorunun notu silindi");
});

test("8) yeni iletide cevapsız araç çağrıları kapanmazsa konuşma araç sonucu olmadan sürer", async () => {
  const m = await bozuk<typeof import("../../src/modules/say/server/say.ts")>(kaynak("src/modules/say/server/say.ts"),
    "  await konusmaEkle(db, \"user\", [...kapanis, ...bloklar]);", "  await konusmaEkle(db, \"user\", [...bloklar]);");
  await kiraciIcinde(havuz, A, async (db) => {
    await konusmaEkle(db, "assistant", [{ type: "tool_use", id: "t9", name: "rapora_yaz", input: {} }]);
    await m.kullaniciIletisiEkle(db, [{ type: "text", text: "Yeni soru" }]);
  }, { hesapId: Y });
  const son = (await kiraciIcinde(havuz, A, (db) => konusmaOku(db), { hesapId: Y })).at(-1)!;
  assert.doesNotMatch(JSON.stringify(son.icerik), /tool_result/, "bozuk: araç çağrısı kapanmadı");
});
