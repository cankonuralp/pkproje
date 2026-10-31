/* NEREDEN GELDİ: 2026-10-31 — reisim: "önerdiklerini kabul ediyorum" (kapsam tablosunun "belge doldurma" eksiği: 12 ekran eylemi). Firmanın belge
   formatındaki elle doldurulan yerleri S.A.Y modülün "<belge>_doldur" işlemiyle yazar (src/server/yz/doldurma.ts). Bu kilit tutar: (1) değer verilmezse
   yerler listelenir, DEĞERİN KENDİSİ DÖNMEZ (yalnız "dolu" — kişisel veri kuralı); (2) yer kimlikle ya da adıyla (büyük / küçük harf ayrımsız), aynı adlı
   iki yerde ad yetmez; tanınmayan yer varsa HİÇBİR ŞEY yazılmaz; (3) yeni değer mevcutların üstüne eklenir, "" o yeri boşaltır, sürüm okunan kayıttan;
   (4) yetkisiz / formatsız kayıt söylenir; (5) dokuz belgenin işlemi katalogda, ekranın doldurma işleviyle. Olumsuz kanıt: bozan say-doldurma. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { FormatTanimi } from "../src/format/tanim.ts";
import { ISLEM_KATALOGU } from "../src/modules/say/islem-katalogu.ts";
import { DOLDURMA_YOK, doldurmaCevabi, doldurmaHazirla } from "../src/server/yz/doldurma.ts";

export const TANIM = FormatTanimi.parse({
  sema: 1, gorunum: { serbest: true }, bolumler: [{
    id: "b1", ad: "Form", blok: "tablo", sutun: [40, 60], satirlar: [{}, {}, {}, {}],
    hucreler: [
      { r: 0, c: 0, tur: "yazi", m: "Müşteri yetkilisi" }, { r: 0, c: 1, tur: "alan", id: "c_yetkili", alan: "metin", zorunlu: true },
      { r: 1, c: 0, tur: "yazi", m: "Ödeme şekli" }, { r: 1, c: 1, tur: "alan", id: "c_odeme", alan: "secim", secenekler: ["Havale", "Nakit"] },
      { r: 2, c: 0, tur: "yazi", m: "Not" }, { r: 2, c: 1, tur: "alan", id: "c_not1", alan: "metin" },
      { r: 3, c: 0, tur: "yazi", m: "Not" }, { r: 3, c: 1, tur: "alan", id: "c_not2", alan: "metin" },
    ],
  }],
});
const PANEL = { tanim: TANIM, degerler: { c_yetkili: "Deneme Kişi" }, surum: 3 };

test("değer verilmezse yerler; değerin kendisi dönmez", () => {
  const h = doldurmaHazirla(PANEL, {});
  assert.ok("cevap" in h && h.cevap.tamam);
  const yerler = (h.cevap as unknown as { sonuc: { yerler: Record<string, unknown>[] } }).sonuc.yerler;
  assert.deepEqual(yerler.map((y) => y.yer), ["c_yetkili", "c_odeme", "c_not1", "c_not2"]);
  assert.deepEqual(yerler[0], { yer: "c_yetkili", ad: "Müşteri yetkilisi", tur: "metin", zorunlu: true, dolu: true });
  assert.deepEqual(yerler[1]!.secenekler, ["Havale", "Nakit"]);
  assert.ok(!JSON.stringify(h).includes("Deneme Kişi"), "kayıtlı değer modele gitmez");
});

test("adla ya da kimlikle; üstüne ekler, boş değer boşaltır; aynı ad ve tanınmayan yer hiçbir şey yazmaz", () => {
  assert.deepEqual(doldurmaHazirla(PANEL, { "ödeme ŞEKLİ": "Havale", c_not1: "a" }), { degerler: { c_yetkili: "Deneme Kişi", c_odeme: "Havale", c_not1: "a" }, surum: 3 });
  assert.deepEqual(doldurmaHazirla(PANEL, { c_yetkili: "" }), { degerler: {}, surum: 3 });
  const iki = doldurmaHazirla(PANEL, { Not: "x", c_odeme: "Nakit" });
  assert.ok("cevap" in iki && !iki.cevap.tamam && /Not/.test((iki.cevap as { neden: string }).neden));
  const yok = doldurmaHazirla(PANEL, { "Olmayan yer": "x" });
  assert.ok("cevap" in yok && !yok.cevap.tamam && /Hiçbir şey yazılmadı/.test((yok.cevap as { neden: string }).neden));
});

test("yetkisiz / formatsız kayıt ve sonuçlar", () => {
  assert.deepEqual(doldurmaHazirla(null, { a: "b" }), { cevap: { tamam: false, neden: DOLDURMA_YOK } });
  assert.match((doldurmaCevabi({ durum: "formatsiz" }, "Sözleşme") as { neden: string }).neden, /yayında format yok/);
  assert.equal(doldurmaCevabi({ durum: "tamam", surum: 4 }, "Sözleşme").tamam, true);
  assert.match((doldurmaCevabi({ durum: "yetkisiz" }, "Sözleşme") as { neden: string }).neden, /yetkiniz yok/);
});

test("dokuz belgenin işlemi katalogda, ekranın doldurma işleviyle", () => {
  const beklenen: Record<string, string> = {
    arac_tutanak_doldur: "tutanakDoldur", egitim_katilim_doldur: "katilimDoldur", fatura_belge_doldur: "faturaDoldur", zimmet_formu_doldur: "zimmetDoldur",
    teklif_belge_doldur: "teklifDoldur", talep_belge_doldur: "talepDoldur", sozlesme_doldur: "sozlesmeDoldur", on_bilgi_doldur: "onBilgiDoldur",
    saha_formu_doldur: "sahaFormuDoldur",
  };
  for (const [ad, islev] of Object.entries(beklenen)) {
    const t = ISLEM_KATALOGU.find((x) => x.ad === ad);
    assert.ok(t && t.tur === "yaz", ad);
    assert.equal(t.islev.name, islev, ad);
  }
});
