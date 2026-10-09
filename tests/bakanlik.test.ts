/* NEREDEN GELDİ: 437 — reisim 2026-10-09: "HALA BAKANLIK FORMATLARI YOK DEFAULT OLARAK GELMESİ GEREKİYOR, ? RAPOR ŞABLONUNDA SIFIRDAN RAPOR ŞABLONU
   OLUŞTURMAK YOK, RAPOR FORMATI PDFLERİ DE STANDART OLARAK BAKANLIKTAN GELECEK ŞEKİLDE KONUŞMUŞTUK ÖRNEK PDFLERİ ATMIŞTIM SANA ONLARDA DEFAULT
   OLARAK GELSİN, BAKANLIK RAPOR FORMATLARI İLGİLİ STANDARTLAR VS DEFAULT GELSİN STANDART İÇİN YÜKLEME TUŞU OLSUN YÜKLENİNCE GÖRÜNTÜLEYE
   DÖNÜŞLSÜN". Veritabanısız kilitler: resmî PDF'ler pakette ve okunuyor, hazır standart listesi yükleme şemasından geçiyor ve formatlarda gerçekten
   anılıyor, sıfırdan iskelet geçerli ve kilitsiz, hazır kurulum işlevleri hiçbir sunucu eyleminden çağrılmıyor (yetkisiz yazar — yalnız sayfa
   tetiği), resmî PDF'i okuyan uçlar yayın paketinde. Kurulumun kendisi (gerçek PostgreSQL): tests/rapor-format.test.ts "437". */
import assert from "node:assert/strict";
import { test } from "node:test";
import { kilitliKimlikler } from "../src/format/motor.ts";
import { bosFormat, SABLONLAR } from "../src/format/sablonlar.ts";
import { StandartGirdisi } from "../src/modules/dokumanlar/sema.ts";
import { standartBul } from "../src/modules/dokumanlar/eslestir.ts";
import { HAZIR_SABLONLAR } from "../src/modules/rapor-format/server/kurulum.ts";
import { BaslatGirdisi } from "../src/modules/rapor-format/sema.ts";
import { BAKANLIK_BELGELERI, bakanlikBelgesiMi, bakanlikPdf, bakanlikPdfYaniti } from "../src/server/bakanlik.ts";
import { KRITER_BELGELERI } from "../src/tanim/kriterler.ts";
import { BAKANLIK_STANDARTLARI, CIHAZ_TESISAT, formatCihazTurleri, formatStandartlari } from "../src/tanim/standartlar.ts";
import { grupBul } from "../src/modules/ekipman-turleri/sema.ts";
import { CihazTuruGirdisi } from "../src/modules/olcum-cihazlari/sema.ts";
import { dosyalar, oku } from "./yardimci/denetimler.ts";

test("resmî PDF'ler: her Bakanlık şablonunun formu ve her kriter belgesi var, PDF olarak okunuyor; listede olmayan kod okunmaz", async () => {
  const bakanlik = Object.values(SABLONLAR).filter((s) => s.bakanlik);
  assert.equal(bakanlik.length, 5);
  for (const s of bakanlik) assert.ok(bakanlikBelgesiMi(s.tanim.gorunum.formKodu), s.tanim.gorunum.formKodu);
  for (const k of KRITER_BELGELERI) assert.ok(bakanlikBelgesiMi(k.kod), k.kod);
  for (const k of BAKANLIK_BELGELERI) {
    const b = await bakanlikPdf(k);
    assert.equal(Buffer.from(b.subarray(0, 5)).toString("latin1"), "%PDF-", k);
    assert.ok(b.length > 10_000 && b.length < 25 << 20, `${k}: ${b.length} bayt`);
  }
  const y = await bakanlikPdfYaniti("ZPKR01");
  assert.equal(y.headers.get("content-type"), "application/pdf");
  assert.equal(y.headers.get("content-disposition"), 'inline; filename="ZPKR01.pdf"');
  for (const kotu of ["../package", "ZPKR06", "zpkr01", "", "__proto__"]) {
    assert.equal(bakanlikBelgesiMi(kotu), false, kotu);
    await assert.rejects(bakanlikPdf(kotu as "ZPKR01"), /Bakanlık belgesi değil/, kotu);
  }
});

test("hazır standartlar: yükleme şemasından geçer, tekrar yok, her biri formatında gerçekten anılır, madde atıfları listeden bulunur", () => {
  const nolar = BAKANLIK_STANDARTLARI.map((s) => s.no);
  assert.equal(new Set(nolar).size, nolar.length, "tekrar");
  const formlar = new Set(Object.values(SABLONLAR).filter((s) => s.bakanlik).map((s) => s.tanim.gorunum.formKodu));
  for (const s of BAKANLIK_STANDARTLARI) {
    const g = StandartGirdisi.safeParse({ no: s.no, surum: "2016", konu: s.konu });
    assert.ok(g.success, `${s.no}: ${JSON.stringify(g.error?.issues)}`);
    assert.equal(g.data!.no, s.no, "numara yükleme sonrası aynı (büyük harf, boşluk)");
    assert.ok(s.formatlar.length > 0 && s.formatlar.every((f) => formlar.has(f)), s.no);
    /* uydurma standart yok: formatın tanımında ya da kriter belgesinde geçer */
    const metin = s.formatlar.map((f) => JSON.stringify(Object.values(SABLONLAR).find((x) => x.tanim.gorunum.formKodu === f)!.tanim)
      + JSON.stringify(KRITER_BELGELERI.find((k) => k.rapor === f) ?? {})).join(" ");
    assert.ok(metin.includes(s.no), `${s.no} ${s.formatlar.join(",")} içinde geçmiyor`);
  }
  for (const f of formlar) assert.ok(formatStandartlari(f).length > 0, f);
  /* 442: kriter belgesinin branşı (Muayene kriterleri alt sekmesi) — rapor formatının şablonundaki önerilen türün branşı */
  for (const k of KRITER_BELGELERI) {
    const s = Object.values(SABLONLAR).find((x) => x.tanim.gorunum.formKodu === k.rapor)!;
    assert.equal(k.brans, grupBul(s.tur.grup)?.b, k.kod);
  }
  /* 440: branş — standardın formatlarının şablonundaki önerilen türün branşı (beş format elektrik) */
  for (const s of BAKANLIK_STANDARTLARI) for (const f of s.formatlar) {
    const k = Object.values(SABLONLAR).find((x) => x.tanim.gorunum.formKodu === f)!;
    assert.equal(s.brans, grupBul(k.tur.grup)?.b, `${s.no} ${f}`);
  }
  /* saha raporundaki madde atfı ("TS CEN/TS 54-14 · …") yüklenen standarda eşlenir */
  const kutuphane = BAKANLIK_STANDARTLARI.map((s, i) => ({ id: String(i), no: s.no, surumAdi: "2016", konu: s.konu, dosyaId: "d" }));
  assert.equal(standartBul("TS CEN/TS 54-14 · Binaların Yangından Korunması Hakkında Yönetmelik", kutuphane)?.no, "TS CEN/TS 54-14");
  assert.equal(standartBul("TS HD 60364-6", kutuphane)?.no, "TS HD 60364-6");
});

test("440 ölçüm cihazları: her Bakanlık formatının en az bir cihaz türü, adları cihaz türü şemasından geçer; Bakanlık dışı formatta yok", () => {
  const formlar = Object.values(SABLONLAR).filter((s) => s.bakanlik).map((s) => s.tanim.gorunum.formKodu);
  for (const f of formlar) {
    const l = formatCihazTurleri(f);
    assert.ok(l.length >= 1 && l.length <= 3, f);
    for (const ad of l) assert.ok(CihazTuruGirdisi.safeParse({ ad }).success, ad);
  }
  for (const k of ["", "ZPKR06", "KOMPRESOR", "__proto__", "toString"]) assert.deepEqual(formatCihazTurleri(k), [], k);
  formatCihazTurleri("ZPKR01").push("bozma");
  assert.deepEqual(formatCihazTurleri("ZPKR01"), [CIHAZ_TESISAT], "dönen dizi kopya");
});

test("sıfırdan: 'bos' başlangıcı; iskelet geçerli, kilitsiz, başlık türden; kitaplıkta değil", () => {
  assert.deepEqual(BaslatGirdisi.parse("bos"), { bos: true });
  for (const kotu of ["bos:", "BOS", "sablon:bos", " bos"]) assert.equal(BaslatGirdisi.safeParse(kotu).success, false, kotu);
  const t = bosFormat("Kaldırma aracı Periyodik Kontrol Raporu");
  assert.equal(t.gorunum.baslik, "Kaldırma aracı Periyodik Kontrol Raporu");
  assert.equal(t.gorunum.formKodu, "");
  assert.equal(kilitliKimlikler(t).size, 0);
  assert.deepEqual(t.bolumler.map((b) => b.blok), ["bilgi", "bilgi", "cihaz", "liste", "foto", "kusur", "not", "sonuc", "imza"]);
  assert.equal(bosFormat("x".repeat(300)).gorunum.baslik.length, 200);
  assert.equal(Object.values(SABLONLAR).some((s) => s.tanim.gorunum.baslik === "" && s.tanim.bolumler.length === 9), false);
});

test("hazır kurulum: kurulan şablonlar yalnız Bakanlık formatları; kurulum işlevleri hiçbir sunucu eyleminden çağrılmaz; resmî PDF'i okuyan uçlar pakette", () => {
  assert.deepEqual([...HAZIR_SABLONLAR], ["ZPKR01", "ZPKR02", "ZPKR03", "ZPKR04", "ZPKR05"]);
  /* yetki denetimi olmayan yazıcılar: yalnız kurulum.ts çağırır, o da yalnız sayfalardan (eylem dosyası değil); eylemler yalnız yetkili
     resmiPdfEkle'yi çağırır (438) */
  const KURUCU = /\b(hazirTurKur|hazirPdfEkle|hazirBaglantiTamamla|hazirCihazTuru|hazirFormatYayinla|varsayilanFormatKur|bakanlikKurulumu|hazirKurulum)\b/;
  const kaynak = dosyalar("src", [".ts", ".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));
  const eylem = kaynak.filter((d) => /^\s*["']use server["']/m.test(d.metin) && KURUCU.test(d.metin)).map((d) => d.ad);
  assert.deepEqual(eylem, []);
  const cagiran = kaynak.filter((d) => KURUCU.test(d.metin)).map((d) => d.ad).sort();
  assert.deepEqual(cagiran, [
    "src/app/(uygulama)/ekipman-turleri/page.tsx", "src/app/(uygulama)/page.tsx", "src/modules/ekipman-turleri/server/turler.ts",
    "src/modules/olcum-cihazlari/server/cihazlar.ts", "src/modules/rapor-format/server/formatlar.ts", "src/modules/rapor-format/server/kurulum.ts",
  ]);
  /* yayın paketi: dosyayı okuyan her uç next.config.ts izinde (yoksa yayında kurulum düşer — sessizce değil, kayda) */
  const cfg = oku("next.config.ts");
  const son = cfg.indexOf(`.map((u) => [u, ["./src/tanim/bakanlik/*.pdf"]])`);
  const bas = cfg.lastIndexOf("...Object.fromEntries([", son);
  assert.ok(son > 0 && bas > 0, "next.config.ts: Bakanlık PDF izi");
  const uclar = [...cfg.slice(bas, son).matchAll(/(?:String\.raw`([^`]+)`|"([^"]+)")/g)].map((m) => (m[1] ?? m[2]).replace(/\\/g, ""));
  const okuyan = kaynak.filter((d) => /^src\/app\/.*\/(page|route)\.tsx?$/.test(d.ad) && /\b(hazirKurulum|bakanlikPdfYaniti|bakanlikPdf)\(/.test(d.metin))
    .map((d) => "/" + d.ad.replace(/^src\/app\//, "").replace(/\/?(page|route)\.tsx?$/, "").split("/").filter((p) => p && !/^\(.*\)$/.test(p)).join("/"));
  assert.ok(okuyan.length >= 4, okuyan.join(", "));
  for (const u of okuyan) assert.ok(uclar.includes(u === "/" ? "/" : u), `${u} izde yok (${uclar.join(", ")})`);
  /* 438: resmiPdfEkle'yi çağıran eylemler tür sayfasında (Şablondan başlat), listede ve şablon önizlemesinde (Tür olarak ekle) koşar */
  assert.deepEqual(kaynak.filter((d) => /^\s*["']use server["']/m.test(d.metin) && /\bbakanlikTamamla\(/.test(d.metin)).map((d) => d.ad), ["src/modules/rapor-format/ui/eylemler.ts"]);
  for (const u of ["/ekipman-turleri", "/ekipman-turleri/[id]", "/ekipman-turleri/sablon/[anahtar]"]) assert.ok(uclar.includes(u), `${u} izde yok`);
});
