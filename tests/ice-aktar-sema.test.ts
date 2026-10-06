/* NEREDEN GELDİ: maket firma-ayarlari "Toplu içe aktarma (ilk kurulum)" (maket-ayarlar.js IA_TUR denetle, iaSatirlar; pkproje §11 245): satır satır
   denetim — "Eklenecek" (uyarı notu: vergi no boş, EKİPNET boş, müşteri kayıtlı → tesis ona eklenir …) ya da atlanma nedeni (zorunlu alan boş,
   kayıtlı kod / plaka / cihaz kodu, dosyada iki kez, tür / meslek / tesis bulunamadı, geçersiz tarih). Saf denetim (veritabanısız; 337). Gerçek
   PostgreSQL kilidi tests/ice-aktarma.test.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { IA_TUR, iaDenetle, iaTarih, iaVeriSatirlari, type IaBilgi } from "../src/modules/firma-ayarlari/ice-aktar.ts";

const BOS: IaBilgi = { bugun: "2026-10-06", musteriler: [], tesisler: [], musteriEpostalari: [], ekipmanKodlari: [], ekipmanTurleri: [], cihazKodlari: [], cihazTurleri: [],
  personelAdlari: [], personelEpostalari: [], plakalar: [] };
const ozet = (l: ReturnType<typeof iaDenetle>) => l.map((x) => [x.no, x.ok, x.ok ? x.uyari : x.neden]);

test("dosya satırları: başlık (sütun adları ya da *) atlanır, boş satır yok sayılır, satır numarası dosyadaki", () => {
  const T = IA_TUR.musteri;
  assert.deepEqual(iaVeriSatirlari("musteri", [[...T.sutun], [...T.ornek[0]], ["", " "], [...T.ornek[1]]]).map((x) => x.no), [2, 4]);
  assert.deepEqual(iaVeriSatirlari("musteri", [[...T.ornek[0]]]).map((x) => x.no), [1], "başlıksız dosya");
  assert.deepEqual(iaVeriSatirlari("musteri", [["Müşteri ünvanı", "Vergi dairesi"], ["A"]]).map((x) => x.no), [2], "yıldızsız başlık da tanınır");
});

test("tarih: GG.AA.YYYY, G.A.YYYY, GG/AA/YYYY ve Excel'in tarih hücresi; olmayan gün geçersiz", () => {
  assert.deepEqual(["15.03.2027", "1.3.2027", "01/03/2027", "2027-03-15", "31.02.2027", "2027-13-01", "15.03.27", ""].map(iaTarih),
    ["2027-03-15", "2027-03-01", "2027-03-01", "2027-03-15", null, null, null, null]);
});

test("müşteri ve tesis: zorunlular, il listeden, aynı müşteri dosyada tek açılır, kayıtlı müşteriye tesis eklenir, uyarılar", () => {
  const b: IaBilgi = { ...BOS, musteriler: [{ id: "m1", unvan: "Kayıtlı Ltd.", kisa: "Kayıtlı", vno: "1111111111", pasif: false }, { id: "m2", unvan: "Pasif A.Ş.", kisa: "Pasif", vno: null, pasif: true }],
    tesisler: [{ id: "t1", musteriId: "m1", ad: "Merkez", pasif: false }], musteriEpostalari: ["dolu@deneme.example"] };
  const l = iaDenetle("musteri", iaVeriSatirlari("musteri", [[...IA_TUR.musteri.sutun], ...IA_TUR.musteri.ornek.map((x) => [...x]),
    ["", "", "", "", "Şube", "Liman Yolu No: 3", "Kocaeli", "", ""],
    ["Kayıtlı Ltd.", "", "", "", "merkez", "Adres", "Kocaeli", "", ""],
    ["kayıtlı", "", "", "", "Depo", "Adres", "kocaeli", "gebze", "12345678901234567890123456"],
    ["Pasif A.Ş.", "", "", "", "Depo", "Adres", "Kocaeli", "", ""],
    ["Yeni A.Ş.", "", "1111111111", "dolu@deneme.example", "Fabrika", "Adres", "Atlantis", "", ""],
    ["Yeni A.Ş.", "", "12", "yanlis", "Fabrika", "Adres", "Ankara", "Bilinmez", "12"],
    ["Örnek Gıda San. A.Ş.", "", "", "", "Depo", "Başka adres", "Kocaeli", "", ""],
    ["Başka A.Ş.", "", "1111111111", "dolu@deneme.example", "Ofis", "Adres", "Ankara", "", ""]]), b);
  assert.deepEqual(ozet(l), [
    [2, true, "SGK DETSİS NO boş"],
    [3, true, "müşteri bu dosyada, tesis ona eklenir · SGK DETSİS NO boş"],
    [4, true, "vergi no boş · SGK DETSİS NO boş"],
    [5, false, "Müşteri ünvanı boş"],
    [6, false, "Bu tesis zaten kayıtlı"],
    [7, true, "müşteri kayıtlı (Kayıtlı Ltd.), tesis ona eklenir"],
    [8, false, "Müşteri pasif"],
    [9, false, "İl bulunamadı"],
    [10, true, "vergi no okunmadı, boş girer · e-posta okunmadı, boş girer · SGK DETSİS NO okunmadı, boş girer · ilçe bulunamadı, boş girer"],
    [11, false, "Dosyada aynı tesis iki kez"],
    [12, true, "vergi no başka müşteride · e-posta başka kayıtta, boş girer · SGK DETSİS NO boş"],
  ]);
  /* aynı müşteri: ikinci satır ilkinin müşterisine bağlanır (tek müşteri açılır); kayıtlı müşteri kimliğiyle; il / ilçe listedeki yazımla */
  const [r2, r3, , , , r7] = l.map((x) => x.deger);
  assert.ok(r2?.t === "musteri" && r3?.t === "musteri" && r2.musteri === r3.musteri && "yeni" in r2.musteri);
  assert.ok(r7?.t === "musteri" && "id" in r7.musteri && r7.musteri.id === "m1" && r7.tesis.il === "Kocaeli" && r7.tesis.ilce === "Gebze" && r7.tesis.sgk === "12345678901234567890123456");
  const r10 = l[8].deger;
  assert.ok(r10?.t === "musteri" && "yeni" in r10.musteri && r10.musteri.yeni.vno === null && r10.musteri.yeni.eposta === null && r10.tesis.ilce === null);
  assert.ok(r2?.t === "musteri" && "yeni" in r2.musteri && r2.musteri.yeni.eposta === "isg@ornek-gida.example" && r2.musteri.yeni.vno === "1234567890");
});

test("ekipman: kod büyür (yerelden bağımsız), kayıtlı kod (eski kod dahil) ve dosyada iki kez atlanır, tür adla ya da kodla, tesis müşteri + tesis adıyla", () => {
  const b: IaBilgi = { ...BOS, musteriler: [{ id: "m1", unvan: "Örnek Gıda San. A.Ş.", kisa: "Örnek Gıda", vno: null, pasif: false }],
    tesisler: [{ id: "t1", musteriId: "m1", ad: "Depo", pasif: false }, { id: "t2", musteriId: "m1", ad: "Kapalı", pasif: true }],
    ekipmanKodlari: ["HT-1000"], ekipmanTurleri: [{ id: "tur1", ad: "Hava tankı", kod: "HT" }] };
  const l = iaDenetle("ekipman", iaVeriSatirlari("ekipman", [
    ["ht-2001", "Hava tankı", "Örnek Gıda San. A.Ş.", "Depo", "Kompresör odası", "", "", "", "2018"],
    ["HT 2001", "HT", "örnek gıda", "depo", "", "", "", "", ""],
    ["ht-1000", "Hava tankı", "Örnek Gıda", "Depo", "", "", "", "", ""],
    ["HT-2002", "Vinç", "Örnek Gıda", "Depo", "", "", "", "", ""],
    ["HT-2003", "Hava tankı", "Örnek Gıda", "Kapalı", "", "", "", "", ""],
    ["H", "Hava tankı", "Örnek Gıda", "Depo", "", "", "", "", ""],
    ["HT-2004", "ht", "Örnek Gıda", "Depo", "", "", "", "", "18"],
    ["HT-2001", "Hava tankı", "Örnek Gıda", "Depo", "", "", "", "", ""],
  ]), b);
  assert.deepEqual(ozet(l), [
    [1, true, ""], [2, true, ""], [3, false, "Bu kod kayıtlı"], [4, false, "Ekipman türü bulunamadı"],
    [5, false, "Müşteri / tesis bulunamadı (önce müşterileri yükleyin)"], [6, false, "Kod: A–Z, 0–9, tire; 3–20 hane"], [7, true, "imal yılı okunmadı, boş girer"],
    [8, false, "Dosyada aynı kod iki kez"],
  ]);
  assert.deepEqual(l[0].deger, { t: "ekipman", kod: "HT-2001", turId: "tur1", tesisId: "t1", konum: "Kompresör odası", marka: null, model: null, seri: null, imal: 2018 });
  assert.equal(l[1].kod, "HT2001", "boşluk atılır");
});

test("ölçüm cihazı, personel, araç: zorunlular, kayıtlı / dosyada iki kez, tarihler, uyarılar", () => {
  const c = iaDenetle("cihaz", iaVeriSatirlari("cihaz", [[...IA_TUR.cihaz.sutun], ["oc-201", "Topraklama ölçer", "", "", "", "15.03.2027"], ["OC-202", "Topraklama ölçer", "", "", "", "01.01.2026"],
    ["OC-201", "Topraklama ölçer", "", "", "", "15.03.2027"], ["OC-9", "Topraklama ölçer", "", "", "", "15.03.2027"], ["OC-203", "Termometre", "", "", "", "15.03.2027"], ["OC-204", "Topraklama ölçer", "", "", "", "2027"]]),
    { ...BOS, cihazKodlari: ["OC-9"], cihazTurleri: [{ id: "ct", ad: "Topraklama ölçer" }] });
  assert.deepEqual(ozet(c), [[2, true, ""], [3, true, "kalibrasyonu geçmiş"], [4, false, "Dosyada aynı kod iki kez"], [5, false, "Bu cihaz kodu kayıtlı"],
    [6, false, "Cihaz türü bulunamadı"], [7, false, "Kalibrasyon bitişi GG.AA.YYYY olmalı"]]);
  const p = iaDenetle("personel", iaVeriSatirlari("personel", [["Deniz Yılmaz", "Elektrik mühendisi", "01.03.2021", "Deniz@Firma.example", "", "", "E-1"], ["Ece", "Makine mühendisi", "15.06.2023", "", "", "", ""],
    ["Can Yıldırım", "Muhasebeci", "01.01.2020", "", "", "", ""], ["Can Yıldırım", "Diğer meslek", "01.01.2020", "", "", "", ""], ["Ali Veli", "mak-muh", "01.01.2030", "", "", "", ""],
    ["Ayşe Kaya", "Teknisyen", "01.01.2020", "deniz@firma.example", "", "", ""], ["Ayşe Kaya", "Teknisyen", "01.01.2020", "kayitli@firma.example", "", "", ""], ["Ayşe Kaya", "Teknisyen", "01.01.2020", "yanlis", "", "", ""]]),
    { ...BOS, personelAdlari: ["Ayşe Kaya"], personelEpostalari: ["kayitli@firma.example"] });
  assert.deepEqual(ozet(p), [[1, true, ""], [2, false, "Ad ve soyad yazılmalı"], [3, false, "Meslek bulunamadı"], [4, false, "Meslek bulunamadı"], [5, false, "İşe başlama ileri tarih"],
    [6, false, "Dosyada aynı e-posta iki kez"], [7, false, "Bu e-posta başka personelde"], [8, true, "e-posta okunmadı, boş girer · aynı adlı personel var · EKİPNET no boş"]]);
  assert.deepEqual(p[0].deger, { t: "personel", ad: "Deniz Yılmaz", meslek: "elk-muh", basla: "2021-03-01", eposta: "deniz@firma.example", diploma: null, oda: null, ekipnet: "E-1" });
  const a = iaDenetle("arac", iaVeriSatirlari("arac", [["34 abc 101", "Hafif ticari araç", "Örnek", "Van", "2021", "dizel", "68.000", "10.05.2027", "01.02.2027", ""], ["34ABC101", "Kamyon", "Örnek", "X", "2020", "Dizel", "", "", "", ""],
    ["06 XY 12", "Uçak", "Örnek", "X", "2020", "Dizel", "", "", "", ""], ["06 XY 13", "Kamyon", "Örnek", "X", "1970", "Dizel", "", "", "", ""], ["06 XY 14", "Kamyon", "", "X", "2020", "Dizel", "", "", "", ""],
    ["ABC", "Kamyon", "Örnek", "X", "2020", "Dizel", "", "", "", ""], ["35 KK 99", "Kamyon", "Örnek", "X", "2020", "Dizel", "", "", "", ""], ["06 XY 15", "Kamyon", "Örnek", "X", "2020", "Dizel", "x", "31.02.2027", "", ""]]),
    { ...BOS, plakalar: ["35KK99"] });
  assert.deepEqual(ozet(a), [[1, true, ""], [2, false, "Dosyada aynı plaka iki kez"], [3, false, "Araç türü bulunamadı"], [4, false, "Model yılı geçersiz"], [5, false, "Marka ve model zorunlu"],
    [6, false, "Plaka 34 ABC 123 biçiminde"], [7, false, "Bu plaka kayıtlı"], [8, true, "okunmayan belge tarihi boş girer · kilometre okunmadı, boş girer"]]);
  assert.deepEqual(a[0].deger, { t: "arac", plaka: "34 ABC 101", tur: "Hafif ticari araç", marka: "Örnek", model: "Van", yil: 2021, yakit: "dizel", ilkKm: 68000, muayene: "2027-05-10", sigorta: "2027-02-01", kasko: null });
});

test("şablonlar: her türde sütun başlığı ve örnek satırlar kendi denetiminden geçer (kayıtlar yokken türler / tesisler hariç)", () => {
  for (const [tur, T] of Object.entries(IA_TUR)) {
    assert.ok(T.sutun[0].endsWith("*"), `${tur}: ilk sütun zorunlu`);
    for (const s of T.ornek) assert.equal(s.length, T.sutun.length, `${tur}: örnek satır sütun sayısı`);
    assert.equal(iaVeriSatirlari(tur as keyof typeof IA_TUR, [[...T.sutun], ...T.ornek.map((x) => [...x])]).length, T.ornek.length, `${tur}: başlık atlanır`);
  }
  /* uydurma veri: e-postalar .example */
  assert.ok(Object.values(IA_TUR).every((T) => T.ornek.flat().every((h) => !h.includes("@") || h.endsWith(".example"))));
});

/* 337–339 incelemesi: müşteri eşleşmesi önce TAM ünvan, yoksa kısa ad; birden çok eşleşme atlanır (yanlış müşterinin paneline düşmesin); eşlenen
   ünvan görünür · kalibrasyon bitişi 5 yıldan ileri olamaz (yazım hatası yıllarca "geçerli") · 3 haneli tireli ekipman kodu (veritabanıyla aynı kural) */
test("müşteri eşleşmesi tam ünvan önce, belirsiz atlanır; kalibrasyon bitişi üst sınırı; 'A-1' kodu", () => {
  const m = (id: string, unvan: string, kisa: string) => ({ id, unvan, kisa, vno: null, pasif: false });
  const b: IaBilgi = { ...BOS, musteriler: [m("m1", "Deneme Metal", "Deneme"), m("m2", "Deneme Metal Sanayi A.Ş.", "Deneme Metal"),
    m("m3", "ABC Otomotiv Sanayi A.Ş.", "ABC Otomotiv"), m("m4", "ABC Otomotiv Pazarlama A.Ş.", "ABC Otomotiv")],
    tesisler: ["m1", "m2", "m3", "m4"].map((x, i) => ({ id: `t${i + 1}`, musteriId: x, ad: "Merkez", pasif: false })), ekipmanTurleri: [{ id: "tur1", ad: "Hava tankı", kod: "HT" }] };
  const mu = iaDenetle("musteri", iaVeriSatirlari("musteri", [["Deneme Metal", "", "", "", "Şube", "Adres", "Kocaeli", "", ""], ["ABC Otomotiv", "", "", "", "Şube", "Adres", "Kocaeli", "", ""]]), b);
  assert.deepEqual(ozet(mu), [[1, true, "müşteri kayıtlı (Deneme Metal), tesis ona eklenir · SGK DETSİS NO boş"], [2, false, "Birden çok müşteri eşleşti; tam ünvanı yazın"]]);
  assert.ok(mu[0].deger?.t === "musteri" && "id" in mu[0].deger.musteri && mu[0].deger.musteri.id === "m1", "tam ünvan, öteki müşterinin kısa adından önce");
  const ek = iaDenetle("ekipman", iaVeriSatirlari("ekipman", [["HT-1", "HT", "Deneme Metal", "Merkez", "", "", "", "", ""], ["HT-2", "HT", "ABC Otomotiv", "Merkez", "", "", "", "", ""],
    ["A-1", "HT", "Deneme Metal Sanayi A.Ş.", "Merkez", "", "", "", "", ""]]), b);
  assert.deepEqual(ozet(ek), [[1, true, ""], [2, false, "Birden çok müşteri eşleşti; tam ünvanı yazın"], [3, true, ""]]);
  assert.deepEqual([ek[0].deger?.t === "ekipman" && ek[0].deger.tesisId, ek[0].alt, ek[2].deger?.t === "ekipman" && ek[2].deger.tesisId], ["t1", "Deneme Metal · Merkez", "t2"]);
  const c = iaDenetle("cihaz", iaVeriSatirlari("cihaz", [["OC-301", "Topraklama ölçer", "", "", "", "07.10.2031"], ["OC-302", "Topraklama ölçer", "", "", "", "06.10.2031"]]),
    { ...BOS, cihazTurleri: [{ id: "ct", ad: "Topraklama ölçer" }] });
  assert.deepEqual(ozet(c), [[1, false, "Kalibrasyon bitişi 5 yıldan ileri olamaz"], [2, true, ""]]);
});
