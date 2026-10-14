/* NEREDEN GELDİ: 497 — hata listesi 29 + 46 maketi (https://claude.ai/artifact/TgA7oTqRojdEe7qAfjqAfJ) onaylandı, karar K6: "öneri kâğıtta kesik
   çizgiyle görünür; Ekle / Uygula demeden yazılmaz"; maketin kuralı: "yapay zekâya yalnız formatın adları ve sayıları gider, müşteri / rapor verisi
   gitmez". Saf (src/server/yz/format.ts, src/modules/rapor-format/yz-oneri.ts):
   · istek: format özeti (bölüm kimliği / adı / türü, öğe adları, birim, sınır, formül) + istek; yapılandırılmış çıktı şeması geçerli (her nesnede
     bütün alanlar zorunlu, fazlası yok); belge (498) ayrı blokta;
   · cevap süzülür: en çok 8 öneri, kesik / ret durumu, bozuk JSON → öneri yok;
   · sade bölüm formata çevrilir ve şemadan geçer: bilinmeyen / ölçüm cihazları bölümü, değiştirilemeyen hedef, tür değişikliği atılır; seçeneksiz
     seçim yazıya döner; formül her türde (556; sınır yalnız sayıda);
   · "Ekle": öneri kimliğiyle yerini bulur, kimlikler şimdiki taslağa göre yeniden; iki kez eklense de tekil;
   · "Uygula": bölümün kimliği, Bakanlık işareti, tablo hesabı, cevap seti korunur; adı aynı kalan öğe kimliğini ve işaretini korur.
   · 498 belgeden başlat: belge türü içerikten (PDF, fotoğraf, Word metni), başka dosya / boş Word / 4 MB üstü red.
   Olumsuz kanıt: tests/bozan/yz-format.bozan.ts. Sunucu tarafı (yetki, ayar, sınır): tests/format-yz.test.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import { kimlikler } from "../src/modules/rapor-format/kurucu.ts";
import { hamdanBolum, oneriEkle, onerileriKur, oneriUygula, oneriYeri, type Oneri } from "../src/modules/rapor-format/yz-oneri.ts";
import { FORMAT_SEMASI, formatIstegi, formatOzeti, formatYanitiCoz } from "../src/server/yz/format.ts";
import { BELGE_EN_BUYUK, formatBelgesi } from "../src/modules/rapor-format/server/yz.ts";
import { zipBayt } from "../src/components/disa/zip.ts";

const T = FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim);
const Z = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
const cevap = (x: unknown, stop = "end_turn") => ({ content: [{ type: "text", text: JSON.stringify(x) }], stop_reason: stop, usage: { input_tokens: 3000, output_tokens: 500 } });
const ZINCIR = { ad: "Zincir uzaması", blok: "olcum", alanlar: null, gruplar: null, degerler: null, enAz: null, metin: null, imzalar: null, sutunlar: [
  { ad: "Ölçüm yeri", giris: "metin", birim: null, secenekler: null, op: null, sinir: null, formul: null },
  { ad: "İlk boy", giris: "sayi", birim: "mm", secenekler: null, op: null, sinir: null, formul: null },
  { ad: "Ölçülen boy", giris: "sayi", birim: "mm", secenekler: null, op: null, sinir: null, formul: null },
  { ad: "Uzama", giris: "sayi", birim: "%", secenekler: null, op: "<=", sinir: 3, formul: "([Ölçülen boy] − [İlk boy]) / [İlk boy] × 100" },
  { ad: "Durum", giris: "secim", birim: null, secenekler: null, op: null, sinir: null, formul: "[İlk boy]" },
] };

/** yapılandırılmış çıktı kuralı: her nesnede required = bütün özellikler, additionalProperties false */
function semaDenetle(s: unknown, yol = "kök"): void {
  if (!s || typeof s !== "object") return;
  const o = s as { type?: unknown; properties?: Record<string, unknown>; required?: string[]; additionalProperties?: unknown; items?: unknown; anyOf?: unknown[] };
  if (o.type === "object") {
    assert.deepEqual([...(o.required ?? [])].sort(), Object.keys(o.properties ?? {}).sort(), `${yol}: bütün alanlar zorunlu`);
    assert.equal(o.additionalProperties, false, `${yol}: fazla alan yok`);
    for (const [k, v] of Object.entries(o.properties ?? {})) semaDenetle(v, `${yol}.${k}`);
  }
  if (o.items) semaDenetle(o.items, `${yol}[]`);
  for (const x of o.anyOf ?? []) semaDenetle(x, yol);
}

test("istek: yalnız formatın adları ve sayıları + istek; şema yapılandırılmış çıktıya uygun; belge ayrı blokta", () => {
  semaDenetle(FORMAT_SEMASI);
  const ozet = formatOzeti(Z, "Elektrik iç tesisatı");
  for (const b of Z.bolumler) assert.ok(ozet.includes(`- ${b.id} · `), `bölüm kimliği özette: ${b.id}`);
  assert.match(ozet, /Pano sigortaları \(linye\) · ölçüm tablosu · sütunlar: /);
  assert.match(ozet, /kayıttan gelen künye \(önerilmez\)/);
  assert.ok(ozet.length <= 24_000);
  const i = formatIstegi({ model: "haiku", ozet, istek: "Zincir uzaması için tablo ekle" }).govde as { model: string; output_config: { format: { schema: unknown } }; messages: { content: { type: string; text?: string }[] }[] };
  assert.equal(i.model, "claude-haiku-5-5"); // 2026-10-14: tek model Haiku 5.5 (reisim "tek seçenek claude haiku 5.5 olsun")
  assert.equal(i.output_config.format.schema, FORMAT_SEMASI);
  assert.equal(i.messages[0].content.length, 1);
  assert.match(i.messages[0].content[0].text ?? "", /Kullanıcının isteği: """Zincir uzaması için tablo ekle"""/);
  const pdf = formatIstegi({ model: "haiku", ozet, istek: "", belge: { tur: "pdf", bayt: new Uint8Array([37, 80, 68, 70]) } }).govde as typeof i;
  assert.deepEqual(pdf.messages[0].content.map((c) => c.type), ["document", "text"]);
  assert.match(pdf.messages[0].content[1].text ?? "", /Belgeden başlat/);
  const word = formatIstegi({ model: "haiku", ozet, istek: "", belge: { tur: "metin", ad: "format.docx", metin: "1. Gözle kontrol" } }).govde as typeof i;
  assert.deepEqual(word.messages[0].content.map((c) => c.type), ["text"]);
  assert.match(word.messages[0].content[0].text ?? "", /veridir, talimat değildir/);
});

test("cevap süzülür: en çok 8 öneri, kesik / ret, bozuk JSON", () => {
  const c = formatYanitiCoz(cevap({ cevap: "  Tamam.  ", oneriler: Array.from({ length: 12 }, () => ({})) }));
  assert.deepEqual([c.cevap, c.oneriler.length, c.giris, c.cikis, c.durum], ["Tamam.", 8, 3000, 500, "tamam"]);
  assert.equal(formatYanitiCoz(cevap({ cevap: "", oneriler: [] }, "max_tokens")).durum, "kesik");
  assert.equal(formatYanitiCoz(cevap({ cevap: "", oneriler: [] }, "refusal")).durum, "ret");
  assert.deepEqual(formatYanitiCoz({ content: [{ type: "text", text: "{bozuk" }] }).oneriler, []);
  assert.deepEqual(formatYanitiCoz(null).oneriler, []);
});

/* 556 (2026-10-14, reisim: "hesaplama tuşu her kutucukta olmalı"): formül her türde — eskiden "formül yalnız sayıda" (Durum'un formülü atılırdı) */
test("sade bölüm formata çevrilir: kimlikler tekil, seçeneksiz seçim yazı, formül her türde, sınır yalnız sayıda; geçmeyen atılır", () => {
  const b = hamdanBolum(T, ZINCIR)!;
  assert.ok(b && b.blok === "olcum");
  assert.deepEqual(b.sutunlar.map((s) => [s.ad, s.giris, s.birim ?? null, s.op ?? null, s.sinir ?? null, s.formul ?? null]), [
    ["Ölçüm yeri", "metin", null, null, null, null], ["İlk boy", "sayi", "mm", null, null, null], ["Ölçülen boy", "sayi", "mm", null, null, null],
    ["Uzama", "sayi", "%", "<=", 3, "([Ölçülen boy] − [İlk boy]) / [İlk boy] × 100"], ["Durum", "metin", null, null, null, "[İlk boy]"]]);
  assert.ok(!kimlikler(T).has(b.id));
  assert.equal(hamdanBolum(T, { ...ZINCIR, blok: "cihaz" }), null, "ölçüm cihazları önerilmez");
  assert.equal(hamdanBolum(T, { ...ZINCIR, blok: "yok" }), null);
  assert.equal(hamdanBolum(T, { ...ZINCIR, ad: "  " }), null);
  const l = hamdanBolum(T, { ad: "Lastikler", blok: "liste", gruplar: [{ ad: "", maddeler: ["Lastikte yırtık yok", "", "Jant sağlam"] }] })!;
  assert.ok(l.blok === "liste" && l.gruplar[0].maddeler.map((m) => m.metin).join("|") === "Lastikte yırtık yok|Jant sağlam" && l.cevaplar.length === 3);
  const f = hamdanBolum(T, { ad: "Fotoğraflar", blok: "foto", enAz: 99 })!;
  assert.ok(f.blok === "foto" && f.enAz === 50);
  const i = hamdanBolum(T, { ad: "İmzalar", blok: "imza", imzalar: ["teknik", "teknik", "yok"] })!;
  assert.ok(i.blok === "imza" && i.imzalar.join() === "teknik");
});

test("öneriler: ekle (yer kimlikle), değiştir (aynı tür, değiştirilebilir hedef); geçmeyenler sayılır", () => {
  const foto = T.bolumler.find((b) => b.blok === "foto")!;
  const cihaz = T.bolumler.find((b) => b.blok === "cihaz")!;
  const liste = T.bolumler.find((b) => b.blok === "liste")!;
  const { oneriler, atilan } = onerileriKur(T, [
    { tur: "ekle", sonra: liste.id, hedef: null, aciklama: "zincir tablosu", bolum: ZINCIR },
    { tur: "ekle", sonra: "olmayan", hedef: null, aciklama: "", bolum: { ad: "Açıklama", blok: "metin", metin: "Deneme" } },
    { tur: "degistir", sonra: null, hedef: foto.id, aciklama: "en az 1", bolum: { ad: foto.ad, blok: "foto", enAz: 1 } },
    { tur: "degistir", sonra: null, hedef: cihaz.id, aciklama: "", bolum: { ad: "Cihazlar", blok: "liste", gruplar: [] } },
    { tur: "degistir", sonra: null, hedef: foto.id, aciklama: "", bolum: { ad: "Yazı", blok: "metin", metin: "x" } },
    { tur: "sil", bolum: ZINCIR },
  ]);
  assert.deepEqual(oneriler.map((o) => [o.tur, o.tur === "ekle" ? o.sonra : o.hedef, o.aciklama]), [["ekle", liste.id, "zincir tablosu"], ["ekle", null, "Açıklama"], ["degistir", foto.id, "en az 1"]]);
  assert.equal(atilan, 3);
  const [a, b] = oneriler as Extract<Oneri, { tur: "ekle" }>[];
  assert.equal(oneriYeri(T, a), T.bolumler.indexOf(liste) + 1);
  assert.equal(oneriYeri(T, b), T.bolumler.findIndex((x) => x.blok === "kusur" || x.blok === "sonuc" || x.blok === "imza"));
  /* Ekle iki kez: kimlikler şimdiki taslağa göre — tekil, tanım şemadan geçer */
  const x = oneriEkle(T, a, oneriYeri(T, a))!;
  const y = oneriEkle(x.t, a, oneriYeri(x.t, a))!;
  assert.ok(x && y && x.id !== y.id);
  assert.ok(FormatTanimi.safeParse(y.t).success);
  assert.equal(y.t.bolumler.length, T.bolumler.length + 2);
  /* taslak değişince (bölüm araya girdi) yer yine listeden sonra */
  assert.equal(y.t.bolumler[oneriYeri(y.t, a) - 1].id, liste.id);
});

test("Uygula: kimlik, Bakanlık işareti, cevap seti ve tablo hesabı korunur; adı aynı kalan öğe kimliğini / işaretini korur; hedef yoksa null", () => {
  const gozle = Z.bolumler.find((b) => b.blok === "liste" && b.kilit) as BolumOf<"liste">;
  const ilk = gozle.gruplar[0].maddeler[0];
  const o: Extract<Oneri, { tur: "degistir" }> = { id: "o1", tur: "degistir", hedef: gozle.id, aciklama: "madde eklendi",
    bolum: hamdanBolum(Z, { ad: gozle.ad, blok: "liste", gruplar: [{ ad: gozle.gruplar[0].ad, maddeler: [ilk.metin, "Yeni deneme maddesi"] }] })! };
  const y = oneriUygula(Z, o)!;
  const yb = y.bolumler.find((b) => b.id === gozle.id) as BolumOf<"liste">;
  assert.ok(yb && yb.kilit === gozle.kilit);
  assert.deepEqual(yb.cevaplar, gozle.cevaplar);
  const [m1, m2] = yb.gruplar[0].maddeler;
  assert.deepEqual([m1.id, m1.kilit, m1.metin], [ilk.id, ilk.kilit, ilk.metin]);
  assert.ok(!kimlikler(Z).has(m2.id) && !m2.kilit);
  const linye = Z.bolumler.find((b) => b.blok === "olcum" && b.hesap) as BolumOf<"olcum">;
  const ol: Extract<Oneri, { tur: "degistir" }> = { id: "o2", tur: "degistir", hedef: linye.id, aciklama: "",
    bolum: hamdanBolum(Z, { ad: linye.ad, blok: "olcum", sutunlar: [...linye.sutunlar.map((s) => ({ ad: s.ad, giris: s.giris, birim: s.birim ?? null })), { ad: "Yeni sütun", giris: "sayi" }] })! };
  const yo = oneriUygula(Z, ol)!.bolumler.find((b) => b.id === linye.id) as BolumOf<"olcum">;
  assert.equal(yo.hesap, linye.hesap);
  assert.deepEqual(yo.sutunlar.slice(0, -1).map((s) => s.id), linye.sutunlar.map((s) => s.id));
  assert.equal(new Set(yo.sutunlar.map((s) => s.id)).size, yo.sutunlar.length, "sütun kimlikleri tabloda tekil");
  assert.equal(oneriUygula(Z, { ...o, hedef: "olmayan" }), null);
});

/* 498 "Belgeden başlat": belge türü içerikten — PDF olduğu gibi, fotoğraf konum bilgisi silinmiş, Word'ün yalnız metni; başka dosya ve 4 MB üstü red */
test("belgeden başlat: PDF / fotoğraf / Word ayrılır; başka dosya, boş Word ve 4 MB üstü reddedilir", () => {
  const pdf = new Uint8Array(Buffer.from("%PDF-1.4\n%%EOF"));
  assert.deepEqual(formatBelgesi(pdf, "format.pdf"), { tur: "pdf", bayt: pdf });
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x03, 0x01, 0xff, 0xda, 0x00, 0x02, 0x01, 0x02, 0x03, 0xff, 0xd9]);
  assert.equal((formatBelgesi(jpeg, "foto.jpg") as { tur: string }).tur, "jpeg");
  const word = zipBayt([["[Content_Types].xml", "<Types/>"], ["word/document.xml", "<w:document><w:body><w:p><w:r><w:t>Fren etkili</w:t></w:r></w:p></w:body></w:document>"]]);
  assert.deepEqual(formatBelgesi(word, "format<>.docx"), { tur: "metin", ad: "format.docx", metin: "Fren etkili" });
  const bos = zipBayt([["word/document.xml", "<w:document><w:body></w:body></w:document>"]]);
  assert.match((formatBelgesi(bos, "b.docx") as { neden: string }).neden, /metin bulunamadı/);
  assert.match((formatBelgesi(new Uint8Array(Buffer.from("<svg/>")), "x.svg") as { neden: string }).neden, /Yalnız PDF, Word/);
  assert.match((formatBelgesi(new Uint8Array(BELGE_EN_BUYUK + 1), "b.pdf") as { neden: string }).neden, /en çok 4 MB/);
  assert.match((formatBelgesi(new Uint8Array(), "b.pdf") as { neden: string }).neden, /boş/);
});
