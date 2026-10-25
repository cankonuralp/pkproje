/* NEREDEN GELDİ: 2026-10-25 — reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı, bir müşteri için
   sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim". Firmanın belge formatındaki "alan" hücresi belgede elle
   doldurulan yerdir (src/belge/doldurma.ts): yerler okuma sırasıyla, adı soldaki / üstteki yazıdan, varsayılanı formülden; çoğalan satırdaki alan
   elle yer değil. Değerler denetlenir (yalnız yerlerin kimlikleri, yazı, en çok 2000 karakter, türüne göre biçim — tarih YYYY-AA-GG, sayı virgüllü,
   seçim seçeneklerden, evet / hayır; toplam 200 000 bayt; "__proto__" anahtarı nesnenin önüne geçmez); belge çizilirken hücreye basılır (belge.ts
   belgeFormu — tarih GG.AA.YYYY, birimle, Evet / Hayır, kaçışlı; boş yerde formülün değeri; yer olmayan kimlik basılmaz). Sözleşme kataloğu
   sozlesmeDegerleri'yle birebir. Saf (veritabanısız). Veritabanı kısmı: tests/belge-doldurma-pg.test.ts. Olumsuz kanıt:
   tests/bozan/belge-doldurma.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { belgeFormu } from "../src/belge/belge.ts";
import { eksikElleAlanlar, elleAlanlari, elleCevaplari, elleDegerleriDenetle, ELLE_TOPLAM_EN_COK } from "../src/belge/doldurma.ts";
import { htmlYaz } from "../src/belge/html.ts";
import { BELGE_KATALOGU, belgeCizimi, ornekDegerler, sozlesmeDegerleri } from "../src/belge/katalog.ts";
import { sozlesmeBelgesi, type SozlesmeBelgesiVerisi } from "../src/belge/sozlesme.ts";
import { FormatTanimi } from "../src/format/tanim.ts";

/* firmanın sözleşme formu: solda yazı, sağda elle doldurulan yer; çoğalan satırda alan; adsız yer; kayıt hücresi */
const TANIM = FormatTanimi.parse({
  sema: 1, gorunum: { serbest: true }, bolumler: [{
    id: "b1", ad: "Form", blok: "tablo", sutun: [40, 60], satirlar: [{}, {}, {}, {}, {}, {}, { tekrar: true, id: "v1" }, {}],
    hucreler: [
      { r: 0, c: 0, tur: "yazi", m: "Müşteri yetkilisi" }, { r: 0, c: 1, tur: "alan", id: "c_yetkili", alan: "metin", zorunlu: true },
      { r: 1, c: 0, tur: "yazi", m: "Sözleşme bedeli" }, { r: 1, c: 1, tur: "alan", id: "c_bedel", alan: "sayi", birim: "TL" },
      { r: 2, c: 0, tur: "yazi", m: "İmza günü" }, { r: 2, c: 1, tur: "alan", id: "c_gun", alan: "tarih" },
      { r: 3, c: 0, tur: "yazi", m: "Ödeme şekli" }, { r: 3, c: 1, tur: "alan", id: "c_odeme", alan: "secim", secenekler: ["Havale", "Nakit"] },
      { r: 4, c: 0, tur: "yazi", m: "Fatura e-posta ile" }, { r: 4, c: 1, tur: "alan", id: "c_eposta", alan: "evet" },
      { r: 5, c: 0, tur: "yazi", m: "Şehir" }, { r: 5, c: 1, tur: "alan", id: "c_sehir", alan: "metin", formul: "\"Ankara\"", zorunlu: true },
      { r: 6, c: 0, tur: "sira" }, { r: 6, c: 1, tur: "alan", id: "c_satir", alan: "metin" },
      { r: 7, c: 0, tur: "alan", id: "c_adsiz" }, { r: 7, c: 1, tur: "kayit", veri: "musteri_unvan" },
    ],
  }],
});
const SOZLESME: SozlesmeBelgesiVerisi = {
  firma: { ad: "Deneme Muayene A.Ş.", kod: "DA" }, no: "S-1026-001", tarih: "2026-10-01",
  musteri: { unvan: "Deneme Bir Sanayi A.Ş.", vd: "Merkez", vno: "1234567890" }, tesisler: [{ ad: "Merkez", il: "Kocaeli", ilce: "Gebze", sgk: null }],
  baslangic: "2026-10-01", bitis: "2027-09-30", vade: 30, yenileme: "otomatik", teklifNo: null, firmaImza: "2026-10-01", musteriImza: null,
};
const ciz = (elle: Record<string, string> | null) => renderToStaticMarkup(belgeFormu(TANIM, SOZLESME.firma, sozlesmeDegerleri(SOZLESME), "Sözleşme", elle) as never);
/** hücrenin yazısı: etiket hücresinden sonraki hücre */
const yanindaki = (html: string, etiket: string) => new RegExp(`>${etiket}</td><td[^>]*>([^<]*)</td>`).exec(html)?.[1];

test("elleAlanlari: okuma sırasıyla, adı soldaki yazıdan, türü / birimi / seçenekleri; varsayılan formülden; çoğalan satırdaki alan yok; adsız yer", () => {
  assert.deepEqual(elleAlanlari(TANIM), [
    { id: "c_yetkili", ad: "Müşteri yetkilisi", alan: "metin", zorunlu: true },
    { id: "c_bedel", ad: "Sözleşme bedeli", alan: "sayi", birim: "TL" },
    { id: "c_gun", ad: "İmza günü", alan: "tarih" },
    { id: "c_odeme", ad: "Ödeme şekli", alan: "secim", secenekler: ["Havale", "Nakit"] },
    { id: "c_eposta", ad: "Fatura e-posta ile", alan: "evet" },
    { id: "c_sehir", ad: "Şehir", alan: "metin", varsayilan: "Ankara", zorunlu: true },
    { id: "c_adsiz", ad: "Yer 7", alan: "metin" },
  ]);
  /* tablosuz format: elle yer yok */
  assert.deepEqual(elleAlanlari(FormatTanimi.parse({ sema: 1, bolumler: [] })), []);
});

test("elleDegerleriDenetle: türüne göre saklanan biçim, boşlar düşer; geçersiz anahtar / tür / uzunluk / biçim hatası yer kimliğiyle", () => {
  assert.deepEqual(elleDegerleriDenetle(TANIM, {
    c_yetkili: "  Deneme Kişi\r\nİkinci satır \u0007 ", c_bedel: "12.5", c_gun: "05.10.2026", c_odeme: "havale", c_eposta: "Evet", c_sehir: "", c_adsiz: null,
  }), { tamam: true, degerler: { c_yetkili: "Deneme Kişi\nİkinci satır", c_bedel: "12,5", c_gun: "2026-10-05", c_odeme: "Havale", c_eposta: "evet" } });
  assert.deepEqual(elleDegerleriDenetle(TANIM, {}), { tamam: true, degerler: {} });
  assert.deepEqual(elleDegerleriDenetle(TANIM, { c_gun: "2026-10-05", c_eposta: "hayır" }), { tamam: true, degerler: { c_gun: "2026-10-05", c_eposta: "hayir" } });

  const r = elleDegerleriDenetle(TANIM, {
    c_bedel: "on iki", c_gun: "31.02.2026", c_odeme: "Çek", c_eposta: "belki", c_adsiz: 5, c_satir: "çoğalan satır", b1: "x", c_yetkili: "a".repeat(2001),
  });
  assert.equal(r.tamam, false);
  assert.ok(!r.tamam);
  assert.deepEqual(r.hatalar, {
    c_bedel: "Sayı yazın.", c_gun: "Geçerli bir tarih yazın (GG.AA.YYYY).", c_odeme: "Seçeneklerden birini seçin.", c_eposta: "Evet ya da hayır seçin.",
    c_adsiz: "Değer yazı olmalı.", c_satir: "Formda böyle bir yer yok.", b1: "Formda böyle bir yer yok.", c_yetkili: "En çok 2000 karakter.",
  });
  assert.deepEqual(elleDegerleriDenetle(TANIM, { c_yetkili: "a".repeat(2000) }), { tamam: true, degerler: { c_yetkili: "a".repeat(2000) } });
});

test("elleDegerleriDenetle: girdinin kendisi — nesne değilse, dizi, sınıf örneği reddedilir; __proto__ nesnenin önüne geçmez; toplam sınır", () => {
  for (const x of [null, undefined, "c_yetkili=x", 5, ["x"], new Date(), new Map([["c_yetkili", "x"]])]) {
    assert.deepEqual(elleDegerleriDenetle(TANIM, x), { tamam: false, hatalar: { degerler: "Değerler okunamadı." } }, String(x));
  }
  const kotu = JSON.parse("{\"__proto__\": {\"c_yetkili\": \"sızan\"}, \"c_bedel\": \"3\"}") as unknown;
  const r = elleDegerleriDenetle(TANIM, kotu);
  assert.ok(!r.tamam);
  assert.equal(Object.getPrototypeOf(r.hatalar), Object.prototype, "hata nesnesinin önü değişmedi");
  assert.deepEqual(Object.keys(r.hatalar), ["__proto__"]);
  assert.equal(({} as Record<string, unknown>).c_yetkili, undefined, "nesnelerin önü kirlenmedi");
  /* null önlü nesne de okunur */
  const yalin = Object.assign(Object.create(null) as Record<string, string>, { c_bedel: "7" });
  assert.deepEqual(elleDegerleriDenetle(TANIM, yalin), { tamam: true, degerler: { c_bedel: "7" } });
  /* toplam sınır: çok yer × 2000 karakter */
  const cok = FormatTanimi.parse({ sema: 1, gorunum: { serbest: true }, bolumler: [{ id: "b1", ad: "Form", blok: "tablo", sutun: [100],
    satirlar: Array.from({ length: 120 }, () => ({})), hucreler: Array.from({ length: 120 }, (_, r) => ({ r, c: 0, tur: "alan", id: `c${r}`, alan: "metin" })) }] });
  const buyuk = Object.fromEntries(Array.from({ length: 120 }, (_, r) => [`c${r}`, "ş".repeat(2000)]));
  assert.ok(new TextEncoder().encode(JSON.stringify(buyuk)).length > ELLE_TOPLAM_EN_COK);
  assert.deepEqual(elleDegerleriDenetle(cok, buyuk), { tamam: false, hatalar: { degerler: "Değerler çok uzun (toplam en çok 200 KB)." } });
  assert.equal(elleDegerleriDenetle(cok, Object.fromEntries(Object.entries(buyuk).slice(0, 40))).tamam, true);
});

test("eksikElleAlanlar: zorunlu, boş ve formülsüz yer; elleCevaplari yalnız formatın yerleri", () => {
  assert.deepEqual(eksikElleAlanlar(TANIM, {}).map((a) => a.id), ["c_yetkili"], "formüllü zorunlu yer (Şehir) eksik sayılmaz");
  assert.deepEqual(eksikElleAlanlar(TANIM, { c_yetkili: "  " }).map((a) => a.id), ["c_yetkili"]);
  assert.deepEqual(eksikElleAlanlar(TANIM, { c_yetkili: "Deneme" }), []);
  assert.deepEqual(elleCevaplari(TANIM, { c_yetkili: "Deneme", c_satir: "x", b1: "y", c_bedel: "", c_gun: 5 as unknown as string }), { c_yetkili: "Deneme" });
  assert.deepEqual(elleCevaplari(TANIM, null), {});
});

test("belgeFormu: elle değer hücresine — tarih GG.AA.YYYY, sayı birimiyle, Evet / Hayır, kaçışlı; boş yerde formülün değeri, elle yazılan formülden önce", () => {
  const elle = { c_yetkili: "Deneme <b>Kişi</b>", c_bedel: "12,5", c_gun: "2026-10-05", c_odeme: "Havale", c_eposta: "evet", c_satir: "basılmaz", c_adsiz: "Adsız yer" };
  const agac = belgeFormu(TANIM, SOZLESME.firma, sozlesmeDegerleri(SOZLESME), "Sözleşme", elle);
  const html = renderToStaticMarkup(agac as never);
  assert.equal(htmlYaz(agac), html, "kesin PDF'in HTML'i React'le birebir");
  assert.equal(yanindaki(html, "Müşteri yetkilisi"), "Deneme &lt;b&gt;Kişi&lt;/b&gt;");
  assert.equal(yanindaki(html, "Sözleşme bedeli"), "12,5 TL");
  assert.equal(yanindaki(html, "İmza günü"), "05.10.2026");
  assert.equal(yanindaki(html, "Ödeme şekli"), "Havale");
  assert.equal(yanindaki(html, "Fatura e-posta ile"), "Evet");
  assert.equal(yanindaki(html, "Şehir"), "Ankara", "boş yerde formülün değeri");
  assert.ok(html.includes(">Adsız yer<") && html.includes(">Deneme Bir Sanayi A.Ş.<"), "adsız yer ve kayıt hücresi");
  assert.ok(!html.includes("basılmaz"), "çoğalan satırdaki alan elle doldurulmaz");
  assert.ok(!html.includes("<b>Kişi"));
  assert.equal(yanindaki(ciz({ c_sehir: "İzmir", c_eposta: "hayir" }), "Şehir"), "İzmir", "elle yazılan formülden önce");
  assert.equal(yanindaki(ciz({ c_eposta: "hayir" }), "Fatura e-posta ile"), "Hayır");
  /* değersiz: yerler boş (formüllü yer formülün değeri), elle verilmese de aynı */
  const bos = ciz(null);
  assert.equal(yanindaki(bos, "Müşteri yetkilisi"), "");
  assert.equal(yanindaki(bos, "Şehir"), "Ankara");
  assert.equal(ciz({}), bos);
});

test("sözleşme: katalog ↔ sozlesmeDegerleri ↔ örnek değerler birebir; belgeCizimi elle değerleri formata geçirir, formatsızda temel format", () => {
  const k = BELGE_KATALOGU.sozlesme, d = sozlesmeDegerleri(SOZLESME), o = ornekDegerler("sozlesme");
  for (const x of [d, o]) {
    assert.deepEqual(Object.keys(x.alanlar).sort(), k.alanlar.map((a) => a.anahtar).sort());
    assert.deepEqual(Object.keys(x.listeler).sort(), k.listeler.map((a) => a.anahtar).sort());
    for (const l of k.listeler) for (const s of x.listeler[l.anahtar]) assert.deepEqual(Object.keys(s).sort(), l.kolonlar.map((a) => a.anahtar).sort());
  }
  assert.ok(o.listeler.tesis.length >= 1);
  const f = renderToStaticMarkup(belgeCizimi("sozlesme", { ...SOZLESME, format: TANIM, elle: { c_yetkili: "Deneme Yetkili" } }, sozlesmeDegerleri, sozlesmeBelgesi) as never);
  assert.equal(yanindaki(f, "Müşteri yetkilisi"), "Deneme Yetkili");
  assert.ok(f.includes("rb-serbest") && !f.includes("temel format"));
  const temel = renderToStaticMarkup(belgeCizimi("sozlesme", { ...SOZLESME, elle: { c_yetkili: "Deneme Yetkili" } }, sozlesmeDegerleri, sozlesmeBelgesi) as never);
  assert.equal(temel, renderToStaticMarkup(sozlesmeBelgesi(SOZLESME) as never), "formatsız: temel format, elle değer yok sayılır");
});
