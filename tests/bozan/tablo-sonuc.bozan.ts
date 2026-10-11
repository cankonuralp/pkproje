/* OLUMSUZ KANIT — tests/tablo-sonuc.test.ts ve tests/ekipman-bolumu.test.ts (486) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya
   bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar asıl dosyalara çevrilir).
   · Kopyada sıfır dolgusu kalkınca "A007"in kopyası "A8" olur — denetçinin sigorta / nokta numaraları bozulur.
   · Doğal sıra kalkınca "F10" "F2"nin önüne geçer — "Sırala" tabloyu karıştırır.
   · Ekipman bölümü bayrağı kurucu açılışında yok sayılınca silinen bölüm her açılışta geri gelir (reisim'in "silinemiyor hala" dediği hata).
   · Düzen bayrağı yok sayınca bölüm silinse de numaralar kaymaz — belgede 2. bölüm boşta kalır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { ekipmanBolumuKaldir } from "../../src/modules/rapor-format/kurucu.ts";

const gecici = mkdtempSync(join(tmpdir(), "tablo-sonuc-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
const asil = (yol: string) => JSON.stringify(pathToFileURL(resolve(yol)).href);

async function bozuk<T>(kaynak: string, ad: string, eski: string, yeni: string, yollar: Record<string, string> = {}): Promise<T> {
  let s = readFileSync(resolve(kaynak), "utf8");
  assert.ok(s.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  s = s.replace(eski, () => yeni);
  for (const [goreli, gercek] of Object.entries(yollar)) s = s.replaceAll(`"${goreli}"`, asil(gercek));
  const yol = join(gecici, `${ad}.ts`);
  writeFileSync(yol, s);
  return import(pathToFileURL(yol).href) as Promise<T>;
}
type Tablo = typeof import("../../src/modules/raporlar/tablo.ts");
type Duzen = typeof import("../../src/format/duzen.ts");
const TABLO = "src/modules/raporlar/tablo.ts", DUZEN = "src/format/duzen.ts", DUZEN_YOL = { "./tanim.ts": "src/format/tanim.ts" };

test("1. kopyada sıfır dolgusu kalkınca A007'nin kopyası A8 olur (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Tablo>(TABLO, "dolgu", "${n.padStart(m[2].length, \"0\")}", "${n}");
  assert.equal(m.sonrakiKod("A007"), "A8", "bozuk: dolgu kayboldu");
});

test("2. doğal sıra kalkınca F10 F2'nin önüne geçer (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Tablo>(TABLO, "sira", "{ numeric: true, sensitivity: \"base\" }", "{ sensitivity: \"base\" }");
  assert.deepEqual(m.satirlariSirala([{ no: "F2" }, { no: "F10" }], "no").map((s) => s.no), ["F10", "F2"], "bozuk: harf sırası");
});

test("3. kurucu açılışı ekipman bölümü bayrağını yok sayınca silinen bölüm geri gelir (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Duzen>(DUZEN, "tam", "  if (!ekipmanBolumuVar(t) || tamBolum(t)) return t;", "  if (tamBolum(t)) return t;", DUZEN_YOL);
  const sil = ekipmanBolumuKaldir(m.kurucuyaHazirla(SABLONLAR.ZPKR01.tanim));
  assert.ok(m.kurucuyaHazirla(sil).bolumler.some((b) => b.blok === "bilgi" && b.tam), "bozuk: silinen bölüm geri geldi");
});

test("4. düzen bayrağı yok sayınca bölüm silinse de numaralar kaymaz (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Duzen>(DUZEN, "no", "  const sabit = (ekipman ? 2 : 1) + (cihazEk ? 1 : 0);", "  const sabit = 2 + (cihazEk ? 1 : 0);", DUZEN_YOL);
  const z = m.kurucuyaHazirla(SABLONLAR.ZPKR01.tanim), sil = ekipmanBolumuKaldir(z);
  assert.equal(m.raporDuzeni(sil, false).bolumler[0].no, m.raporDuzeni(z, false).bolumler[0].no, "bozuk: numara kaymadı");
});
