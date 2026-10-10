/* NEREDEN GELDİ: 385 — etiket plakasından okuma (ARKA-UC §5.2; maket maket-rapor.js etiket-oku; §8.10 ilkesi: okunan ÖNERİ, denetçi uygulamadan
   yazılmaz). 484 (reisim 2026-10-10: "test tablosu olarak kullanılan yerlere excelden yükle ve fotoğraf ekleme özelliği olsun fotoğraf eklenince
   belgede gözükmeyecek yapay zeka buradan okuma yapıp tabloyu dolduracak, aynı şekilde ekipman bilgilerinde de olsun bunu istediğim başlığa da
   ekleyebiliyim"): etiket okuması bölümün ALANLARININ genel okumasına geçti; Excel'den doldurma. Saf:
   · src/server/yz/alanlar.ts — istek: fotoğraf + şema (alan kimlikleri), zorunlu araç yok, firma / müşteri / kişi bilgisi yok; cevap: alan başına
     ilki; bilinmeyen alan ve türüne uymayan değer atılır (src/format/deger.ts — sayı, tarih, seçim, evet / hayır, yıl, metin uzunluğu), denetim
     karakterleri temizlenir; güven bilinmiyorsa "dusuk"; kesik / ret; token sayıları;
   · src/modules/raporlar/doldur.ts — Excel: tablo başlık satırıyla, alanlar "Alan | Değer"; sunucu ve ekranın ortak alan listeleri;
   · src/format/tanim.ts doldurma — varsayılan: ölçüm tablosu ve ekipman bölümü açık, öteki kapalı; kâğıtta bölüm ayarı.
   Olumsuz kanıt: tests/bozan/alan-okuma.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { alanDegeri, type OkunacakAlan } from "../src/format/deger.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { doldurma, FormatTanimi, type Bolum } from "../src/format/tanim.ts";
import { alanExceli, bilgiAlanlari, ekipmanAlanlari, tabloExceli, tabloSablonu, testAlanlari } from "../src/modules/raporlar/doldur.ts";
import { alanIstegi, alanYanitiCoz } from "../src/server/yz/alanlar.ts";

const BUGUN = new Date("2026-10-08T09:00:00Z");
const ETIKET: OkunacakAlan[] = [
  { id: "marka", ad: "Marka", tur: "metin", uzun: 40 }, { id: "model", ad: "Model", tur: "metin", uzun: 40 },
  { id: "seri", ad: "Seri no", tur: "metin", uzun: 30 }, { id: "imal", ad: "İmal yılı", tur: "yil", uzun: 4 },
];
const cevap = (alanlar: unknown, ek: Record<string, unknown> = {}) => ({ content: [{ type: "thinking", thinking: "" }, { type: "text", text: JSON.stringify({ alanlar, not: null }) }],
  stop_reason: "end_turn", usage: { input_tokens: 3000, output_tokens: 120 }, ...ek });

test("istek: fotoğraf + şema (alan kimlikleri), bölüm adı ve alanların türü; zorunlu araç yok, kişi / firma bilgisi yok", () => {
  const g = alanIstegi({ model: "sonnet", baslik: "Ekipman bilgileri", alanlar: ETIKET, resim: new Uint8Array([1, 2, 3]), tur: "png" }).govde as Record<string, unknown> & {
    messages: { content: { type: string; text?: string; source?: { media_type: string; data: string } }[] }[];
    output_config: { format: { schema: { properties: { alanlar: { items: { properties: { alan: { enum: string[] } } } } } } } };
  };
  assert.equal(g.model, "claude-sonnet-5-5");
  assert.equal(g.tool_choice, undefined);
  assert.deepEqual(g.output_config.format.schema.properties.alanlar.items.properties.alan.enum, ["marka", "model", "seri", "imal"]);
  assert.deepEqual(g.messages[0].content[0].source, { type: "base64", media_type: "image/png", data: Buffer.from([1, 2, 3]).toString("base64") });
  assert.match(g.messages[0].content[1].text!, /Bölüm: Ekipman bilgileri[\s\S]*imal: İmal yılı — yıl/);
  assert.doesNotMatch(JSON.stringify(g), /firma_adi|müşteri|unvan|@|sk-ant/i);
});

test("cevap: alan başına ilki; bilinmeyen alan, boş / uzun değer, geçersiz / gelecek yıl atılır; güven bilinmiyorsa düşük", () => {
  const c = alanYanitiCoz(cevap([
    { alan: "marka", deger: "  Deneme\u0007 Marka  ", guven: "yuksek" },
    { alan: "marka", deger: "İkinci", guven: "yuksek" },
    { alan: "model", deger: "DM-100", guven: "belki" },
    { alan: "seri", deger: "x".repeat(31), guven: "yuksek" },
    { alan: "imal", deger: "2099", guven: "yuksek" },
    { alan: "renk", deger: "Kırmızı", guven: "yuksek" },
    { alan: "seri", deger: "", guven: "yuksek" },
    "bozuk",
  ]), ETIKET, BUGUN);
  assert.deepEqual(c.okunan, [{ alan: "marka", deger: "Deneme Marka", guven: "yuksek" }, { alan: "model", deger: "DM-100", guven: "dusuk" }]);
  assert.deepEqual([c.giris, c.cikis, c.durum], [3000, 120, "tamam"]);
  for (const yil of ["19x1", "1899", "2027", "201"]) assert.deepEqual(alanYanitiCoz(cevap([{ alan: "imal", deger: yil, guven: "yuksek" }]), ETIKET, BUGUN).okunan, [], yil);
  assert.deepEqual(alanYanitiCoz(cevap([{ alan: "imal", deger: "2019", guven: "orta" }]), ETIKET, BUGUN).okunan, [{ alan: "imal", deger: "2019", guven: "orta" }]);
  assert.equal(alanYanitiCoz(cevap([], { stop_reason: "refusal" }), ETIKET, BUGUN).durum, "ret");
  assert.equal(alanYanitiCoz(cevap([], { stop_reason: "max_tokens" }), ETIKET, BUGUN).durum, "kesik");
  assert.deepEqual(alanYanitiCoz({ content: [{ type: "text", text: "json değil" }] }, ETIKET, BUGUN).okunan, []);
  assert.deepEqual(alanYanitiCoz(null, ETIKET, BUGUN), { okunan: [], giris: 0, cikis: 0, durum: "tamam" });
});

test("değer türü: sayı virgüllü, tarih YYYY-AA-GG (GG.AA.YYYY de), takvimde olmayan gün yok; seçim seçeneklerden; evet / hayır", () => {
  const d = (tur: OkunacakAlan["tur"], v: string, secenekler?: string[]) => alanDegeri({ tur, secenekler }, v, BUGUN);
  assert.deepEqual([d("sayi", "12.5"), d("sayi", "0,37"), d("sayi", "1 250"), d("sayi", "on iki")], ["12,5", "0,37", "1250", null]);
  assert.deepEqual([d("tarih", "2026-03-05"), d("tarih", "05.03.2026"), d("tarih", "31.02.2026"), d("tarih", "5/3/2026")], ["2026-03-05", "2026-03-05", null, null]);
  assert.deepEqual([d("secim", "tn-s", ["TN-S", "TT"]), d("secim", "IT", ["TN-S", "TT"])], ["TN-S", null]);
  assert.deepEqual([d("evet", "Var"), d("evet", "HAYIR"), d("evet", "belki")], ["evet", "hayir", null]);
});

test("Excel — tablo: başlık satırı sütun adlarıyla (harf / birim / noktalama önemsiz), No sütunu yok sayılır, türüne uymayan yazılmaz", () => {
  const linye = SABLONLAR.ZPKR02.tanim.bolumler.find((b) => b.id === "linye");
  assert.ok(linye && linye.blok === "olcum");
  const no = linye.sutunlar.find((s) => s.id === "no")!, akim = linye.sutunlar.find((s) => s.giris === "sayi")!;
  const ham = [["Pano sigortaları"], ["No", no.ad.toLocaleUpperCase("tr"), `${akim.ad} (${akim.birim ?? ""})`, "Fazladan"], ["", "F1", "16", "x"], ["", "", "", ""], ["", "F2", "on", ""]];
  const x = tabloExceli(ham, linye.sutunlar, BUGUN);
  assert.deepEqual(x.satirlar, [{ [no.id]: "F1", [akim.id]: "16" }, { [no.id]: "F2" }]);
  assert.deepEqual(x.eslesmeyen, ["Fazladan"]);
  assert.deepEqual(x.eslesen.sort(), [no.ad, akim.ad].sort());
  assert.deepEqual(tabloExceli([["Başka", "Tablo"]], linye.sutunlar, BUGUN).eslesen, [], "başlık bulunamadı");
  assert.equal(tabloSablonu(linye.sutunlar)[0].length, linye.sutunlar.length);
});

test("Excel — alanlar: \"Alan | Değer\" satırları; tanınmayan söylenir, türüne uymayan yazılmaz", () => {
  const x = alanExceli([["Alan", "Değer"], ["marka", "Deneme"], ["İmal yılı", "2030"], ["Renk", "Mavi"], ["Model", "M-1"], ["", ""]], ETIKET, BUGUN);
  assert.deepEqual(x.degerler, [{ alan: "marka", ad: "Marka", deger: "Deneme" }, { alan: "model", ad: "Model", deger: "M-1" }]);
  assert.deepEqual([x.eslesmeyen, x.gecersiz], [["Renk"], ["İmal yılı"]]);
});

test("doldurma: varsayılan ölçüm tablosu ve ekipman bölümü açık, öteki kapalı; kâğıtta seçilen ayar geçer; liste bölümünde yok", () => {
  const b = (x: object) => x as Bolum;
  assert.deepEqual(doldurma(b({ blok: "olcum", id: "t", ad: "T", sutunlar: [] })), { foto: true, excel: true });
  assert.deepEqual(doldurma(b({ blok: "bilgi", id: "e", ad: "E", alanlar: [], tam: true })), { foto: true, excel: true });
  assert.deepEqual(doldurma(b({ blok: "bilgi", id: "b", ad: "B", alanlar: [] })), { foto: false, excel: false });
  assert.deepEqual(doldurma(b({ blok: "test", id: "s", ad: "S", degerler: [], doldur: { foto: true, excel: false } })), { foto: true, excel: false });
  assert.deepEqual(doldurma(b({ blok: "liste", id: "l", ad: "L", cevaplar: ["a", "b"], gruplar: [], doldur: { foto: true, excel: true } })), { foto: false, excel: false });
  /* şema ayarı taşır (kâğıtta kaydedilen) */
  const t = FormatTanimi.parse({ ...SABLONLAR.ZPKR02.tanim, bolumler: SABLONLAR.ZPKR02.tanim.bolumler.map((x) => (x.id === "linye" ? { ...x, doldur: { foto: false, excel: true } } : x)) });
  assert.deepEqual(doldurma(t.bolumler.find((x) => x.id === "linye")!), { foto: false, excel: true });
});

test("alan listeleri (sunucu ve ekran ortak): kayıttan gelen ve çok seçimli alan yok; ekipman kaydına bağlı alan anahtarıyla; test değerleri türüyle", () => {
  const t = SABLONLAR.ZPKR02.tanim;
  const e = ekipmanAlanlari(t);
  assert.ok(e.alanlar.length > 0 && e.alanlar.every((a) => a.id && a.ad));
  const bilgi = t.bolumler.find((x) => x.blok === "bilgi");
  if (bilgi && bilgi.blok === "bilgi") assert.ok(bilgiAlanlari(bilgi).every((a) => !bilgi.alanlar.find((y) => y.id === a.id)?.kaynak));
  const test2 = t.bolumler.find((x) => x.blok === "test");
  if (test2 && test2.blok === "test") assert.deepEqual(testAlanlari(test2).map((a) => a.id), test2.degerler.map((d) => d.id));
  assert.deepEqual(bilgiAlanlari({ blok: "bilgi", id: "e", ad: "E", kilit: false, tam: true, alanlar: [
    { id: "a1", ad: "Marka", tur: "metin", zorunlu: false, kilit: false, ekipman: "marka" },
    { id: "a2", ad: "Adres", tur: "metin", zorunlu: false, kilit: false, kaynak: "tesis_adresi" },
    { id: "a3", ad: "Tip", tur: "coklu", zorunlu: false, kilit: false, secenekler: ["A"] },
    { id: "a4", ad: "Basınç", tur: "sayi", zorunlu: false, kilit: false, birim: "bar" },
  ] }).map((a) => [a.id, a.tur]), [["marka", "metin"], ["a4", "sayi"]]);
});
