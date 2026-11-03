/* NEREDEN GELDİ: 2026-11-03 — firmanın kendi yedeği (reisim: "yapılsın firma ayarlardan kendi yedeğini otomatik alabiliyo olsun", "her gece tüm siteyi
   işlemeyelim yeni eklenenler eklensin yedeğe yeter her günün ayrı ayrı yedeği olmasın"; sunum K1–K6 + fotoğraf düzeni A). SAF:
   · klasör düzeni (src/server/yedek/yol.ts): üç düzen, adlar iki hizmetin kabul ettiği biçimde, belge adı kısa kimlikle (aynı adlı iki belge ezilmez),
     İstanbul saatine göre ay sınırı;
   · dosya modüllerinin TAMAMI sınıflı: ya Belgeler'de bir klasörü var ya yedek dışı (gerekçeli) — tek dosya yolunun erişim kaydıyla aynı liste;
   · tablo listesi (src/server/yedek/tablolar.ts) ile göç 0117'nin tetik listesi AYNI (gizli sütunlar dahil); yedeklenen ve dışı kesişmez;
   · sıkıştırılmış ZIP (src/server/yedek/zip.ts) tarayıcının ZIP açıcısıyla (components/disa/oku.ts — DEFLATE) birebir açılır, gerçekten küçülür.
   Gerçek PostgreSQL'deki katalog aynası tests/yedek.test.ts'te. Olumsuz kanıt: tests/bozan/yedek.bozan.ts. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { zipAc } from "../src/components/disa/oku.ts";
import { DOSYA_ERISIMI } from "../src/server/dosya/erisim.ts";
import { durumCoz } from "../src/server/yedek/baglan.ts";
import { YEDEK_DISI, YEDEK_TABLOLARI } from "../src/server/yedek/tablolar.ts";
import { adTemizle, ayAraligi, BELGE_KLASORU, belgeAdi, donemi, raporKlasoru, YEDEK_DISI_DOSYA } from "../src/server/yedek/yol.ts";
import { SikistirilmisZip } from "../src/server/yedek/zip.ts";
import { yedekDosyaFarki, yedekGocListesi, yedekListeFarki } from "./yardimci/denetimler.ts";

test("klasör düzeni: üç düzen; adlar temiz; belge adı kısa kimlikle", () => {
  const r = { kok: "probata yedek", musteri: "Deneme: Sanayi/A.Ş.", tesis: "Merkez *Fabrika*", yil: 2026, no: "XX-1126-0001" };
  assert.deepEqual(raporKlasoru({ ...r, duzen: "mt" }), ["probata yedek", "Raporlar", "Deneme Sanayi A.Ş", "Merkez Fabrika", "XX-1126-0001"]);
  assert.deepEqual(raporKlasoru({ ...r, duzen: "mty" }), ["probata yedek", "Raporlar", "Deneme Sanayi A.Ş", "Merkez Fabrika", "2026", "XX-1126-0001"]);
  assert.deepEqual(raporKlasoru({ ...r, duzen: "my" }), ["probata yedek", "Raporlar", "Deneme Sanayi A.Ş", "2026", "XX-1126-0001"]);
  assert.equal(adTemizle("  a\\b/c:d*e?f\"g<h>i|j#k%l. . "), "a b c d e f g h i j k l");
  assert.equal(adTemizle("..."), "-");
  assert.equal(adTemizle("x".repeat(300)).length, 120);
  assert.equal(belgeAdi("sözleşme.pdf", "0123abcd-0000-0000-0000-000000000000", "application/pdf"), "sözleşme (0123abcd).pdf");
  assert.notEqual(belgeAdi("a.pdf", "11111111-0000-0000-0000-000000000000", "application/pdf"), belgeAdi("a.pdf", "22222222-0000-0000-0000-000000000000", "application/pdf"));
});

test("ay sınırı İstanbul saatine göre", () => {
  assert.deepEqual(donemi(new Date("2026-10-31T21:30:00Z")).ay, "2026-11", "UTC 31 Ekim 21:30 = İstanbul 1 Kasım 00:30");
  assert.deepEqual(donemi(new Date("2026-10-31T20:59:59Z")).ay, "2026-10");
  const [bas, son] = ayAraligi("2026-12");
  assert.equal(bas.toISOString(), "2026-11-30T21:00:00.000Z");
  assert.equal(son.toISOString(), "2026-12-31T21:00:00.000Z");
  assert.equal(donemi(new Date("2026-12-31T21:00:00Z")).yil, 2027);
});

test("dosya modüllerinin tamamı sınıflı: Belgeler'de klasörü var ya da yedek dışı (erişim kaydıyla aynı liste)", () => {
  assert.deepEqual(yedekDosyaFarki(Object.keys(DOSYA_ERISIMI), Object.keys(BELGE_KLASORU), Object.keys(YEDEK_DISI_DOSYA)), []);
  for (const g of Object.values(YEDEK_DISI_DOSYA)) assert.ok(g.length >= 8, "gerekçe");
});

test("tablo listesi ile göç 0117'nin tetik listesi aynı (gizli sütunlar dahil); yedeklenen ve dışı kesişmez", () => {
  const goc = readFileSync(new URL("../src/server/db/gocler/0117_yedek.sql", import.meta.url), "utf8");
  assert.equal(Object.keys(yedekGocListesi(goc)).length, Object.keys(YEDEK_TABLOLARI).length);
  assert.deepEqual(yedekListeFarki(goc, YEDEK_TABLOLARI, YEDEK_DISI), []);
  assert.ok(YEDEK_TABLOLARI.hesap!.includes("parola_ozeti") && YEDEK_TABLOLARI.musteri_hesap!.includes("parola_ozeti"), "parola özeti yedeğe girmez");
  for (const t of ["firma_sir", "oturum", "depo_nesne"]) assert.ok(t in YEDEK_DISI, `${t} yedek dışı`);
});

test("sıkıştırılmış ZIP tarayıcının açıcısıyla birebir açılır ve küçülür; geçersiz ad reddedilir", async () => {
  const z = new SikistirilmisZip();
  const satirlar = Array.from({ length: 2000 }, (_, i) => JSON.stringify({ id: i, ad: "Deneme Sanayi A.Ş.", tesis: "Merkez", durum: "imzali" })).join("\n");
  await z.dosya("tablolar/musteri.jsonl", async (yaz) => { for (const p of satirlar.match(/[\s\S]{1,5000}/g)!) await yaz(p); });
  await z.dosya("bilgi.json", async (yaz) => { await yaz('{"tur":"tam","ü":"ğüşiöç"}'); });
  await z.dosya("bos.txt", async () => undefined);
  const b = z.bayt();
  assert.ok(b.length < Buffer.byteLength(satirlar) / 5, `küçüldü: ${b.length}`);
  const acik = new Map((await zipAc(b, 100 << 20, 10)).map((x) => [x.ad, Buffer.from(x.bayt).toString("utf8")]));
  assert.deepEqual([...acik.keys()].sort(), ["bilgi.json", "bos.txt", "musteri.jsonl"]);
  assert.equal(acik.get("musteri.jsonl"), satirlar, "tablolar/musteri.jsonl (açıcı yolun son parçasını verir)");
  assert.equal(acik.get("bilgi.json"), '{"tur":"tam","ü":"ğüşiöç"}');
  assert.equal(acik.get("bos.txt"), "");
  for (const ad of ["../x", "/x", "a\\b", "a//b", "bilgi.json"]) await assert.rejects(z.dosya(ad, async () => undefined), /geçersiz/);
});

test("izin dönüşünün durum kodu: firma kısa adı + kod; biçimsiz olan reddedilir", () => {
  const kod = "a".repeat(43);
  assert.deepEqual(durumCoz(`deneme.${kod}`), { kisaAd: "deneme", kod });
  for (const x of [`Deneme.${kod}`, `deneme.${"a".repeat(10)}`, `deneme..${kod}`, `-deneme.${kod}`, kod, `de/neme.${kod}`]) assert.equal(durumCoz(x), null, x);
});
