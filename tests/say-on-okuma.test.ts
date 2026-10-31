/* NEREDEN GELDİ: 2026-10-31 lift denemesi (reisim: "Önce say, sonra aç: fotoğraflar çekim saatine göre sıralanır; genel görünüş ve etiket çiftleri kurulur;
   ekipman sayısı ilk turda kesinleşir" — ilk turda 6 lift açıldı, 13:34 ve 13:38'de çekilen 2 lift on dakika sonra eklendi; "Fotoğraf ön okuma: her fotoğraf bir
   kez, paralel ve küçük bir çağrıyla okunur, sonuç saklanır"; sunum L4). WhatsApp fotoğrafında EXIF yok, çekim saati dosya adında. Bu kilit tutar: (1) dosya
   adından saniyeli çekim saati (genel biçimler), geçersiz tarih yok; (2) aynı dakikadakiler saniyeyle sıralanır; (3) ön okuma başlıkta, malzeme özetinde sınıf
   sayısı ve genel görünüş–etiket çiftleri (5 dakika içinde, eşsiz genel görünüş ayrıca); (4) ön okuma isteği düşük derinlik, şemalı, küçük; cevap süzülür.
   Olumsuz kanıt: tests/bozan/say-on-okuma.bozan.ts. Uydurma veri. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { cekimAdindan, ekBasligi, fotoCiftleri, malzemeOzeti, malzemeSirasi, type MalzemeEki } from "../src/modules/say/malzeme.ts";
import { ON_OKUMA_YANIT, onOkumaCoz, onOkumaIstegi } from "../src/modules/say/on-okuma.ts";

test("çekim saati dosya adından: WhatsApp, telefon, tireli; geçersiz yok", () => {
  assert.equal(cekimAdindan("WhatsApp Image 2026-10-30 at 13.39.31.jpeg"), "2026-10-30 13:39:31");
  assert.equal(cekimAdindan("IMG_20261030_133412.jpg"), "2026-10-30 13:34:12");
  assert.equal(cekimAdindan("2026-10-30 13-39.jpg"), "2026-10-30 13:39");
  assert.equal(cekimAdindan("PXL_20261030_093000123.jpg"), null, "milisaniyeli ad: 6 haneden sonra rakam — yanlış okunmaz");
  assert.equal(cekimAdindan("komp.jpeg"), null);
  assert.equal(cekimAdindan("WhatsApp Image 2026-13-30 at 13.39.31.jpeg"), null, "ay 13 yok");
  assert.equal(cekimAdindan("WhatsApp Image 2026-10-30 at 25.39.31.jpeg"), null, "saat 25 yok");
});

const ek = (fno: number, cekim: string | null, sinif?: "E" | "T" | "L" | "D"): MalzemeEki =>
  ({ dosya: `d${fno}`, tur: "foto", ad: `f${fno}.jpg`, cekim, no: fno, fno, okuma: sinif ? { sinif, yazi: sinif === "T" ? "SN DENEME-1" : "", tarif: "deneme" } : null });

test("aynı dakikadakiler saniyeyle sıralanır", () => {
  const l = malzemeSirasi([ek(1, "2026-10-30 13:39:31"), ek(2, "2026-10-30 13:39:15"), ek(3, "2026-10-30 13:38:59")]);
  assert.deepEqual(l.map((x) => x.fno), [3, 2, 1]);
});

test("ön okuma başlıkta; özet: sınıf sayısı ve çiftler (5 dakika içinde), eşsiz genel görünüş", () => {
  const l = [ek(1, "2026-10-30 13:30:00", "E"), ek(2, "2026-10-30 13:30:20", "T"), ek(3, "2026-10-30 13:34:00", "E"), ek(4, "2026-10-30 13:45:00", "T"),
    ek(5, "2026-10-30 13:50:00", "E"), ek(6, "2026-10-30 13:50:30", "L")];
  assert.match(ekBasligi(l[1]!), /ön okuma: etiket \/ plaka — deneme · yazı: SN DENEME-1$/);
  assert.deepEqual(fotoCiftleri(l), { ciftler: [[1, 2], [5, 6]], yalniz: [3] }, "13:34'teki eşsiz; 13:45'teki etiket 11 dakika uzak");
  const o = malzemeOzeti(l);
  assert.match(o, /Ön okuma \(6 \/ 6\): 3 genel görünüş, 2 etiket \/ plaka, 1 levha\./);
  assert.match(o, /çiftleri: F01\+F02, F05\+F06; eşsiz genel görünüş: F03 — ekipman sayısı en az 3\./);
  assert.doesNotMatch(malzemeOzeti([ek(1, null)]), /Ön okuma/, "ön okuması yoksa özet aynı");
});

test("ön okuma isteği: düşük derinlik, şemalı, küçük; cevap süzülür", () => {
  const g = onOkumaIstegi("haiku", new Uint8Array([1, 2, 3]), "image/jpeg").govde as { max_tokens: number; output_config: { effort: string; format: { type: string } } };
  assert.equal(g.max_tokens, ON_OKUMA_YANIT);
  assert.deepEqual([g.output_config.effort, g.output_config.format.type], ["low", "json_schema"]);
  const c = onOkumaCoz({ content: [{ type: "text", text: JSON.stringify({ sinif: "T", yazi: " SN\u0000  1 ", tarif: "x".repeat(200) }) }], usage: { input_tokens: 5 } });
  assert.deepEqual(c.okuma, { sinif: "T", yazi: "SN 1", tarif: "x".repeat(100) });
  assert.equal(onOkumaCoz({ content: [{ type: "text", text: JSON.stringify({ sinif: "Z", yazi: "", tarif: "" }) }] }).okuma, null, "bilinmeyen sınıf");
  assert.equal(onOkumaCoz({ content: [{ type: "text", text: "bozuk" }] }).okuma, null);
});
