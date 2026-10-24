/* Basılı formdan şablon (2026-10-23; 2026-10-24 serbest düzen) testlerinin UYDURMA okuması — PDF okuyucusunun çıktısı biçiminde (BASILI ham,
   src/modules/rapor-format/pdf-tipler.ts; 2026-10-24'ten beri yapay zekâ yok) bir vinç formu ızgara olarak (gerçek firmanın formu depoya girmez).
   tests/basili-format.test.ts ve olumsuz kanıtı tests/bozan/basili-format.bozan.ts ortak. */
const h = (metin: string, ek: Record<string, unknown> = {}) => ({
  metin, tur: "yazi", sutunBirlesim: 1, satirBirlesim: 1, kaynak: "yok", alan: "metin", birim: "", secenekler: [], formul: "", kim: "yok", gorsel: "logo",
  kalin: false, egik: false, hiza: "sol", zemin: "", boy: 0, ...ek,
});
const et = (metin: string) => h(metin, { kalin: true });
const serit = (metin: string, n: number) => h(metin, { sutunBirlesim: n, kalin: true, hiza: "orta", zemin: "#F2DCDB" });
const kayit = (kaynak: string) => h("", { tur: "kayit", kaynak });
const alan = (metin: string, ek: Record<string, unknown> = {}) => h(metin, { tur: "alan", ...ek });
const madde = (m: string) => [h("", { tur: "sira", hiza: "orta" }), h(m), h("", { tur: "cevap", hiza: "orta" })];
const tablo = (ad: string, sutunlar: number[], satirlar: unknown[][], ek: Record<string, unknown> = {}) => ({
  ad, tur: "tablo", yan: false, oran: 100, sutunlar, cevaplar: [], satirlar: satirlar.map((hucreler) => ({ tekrar: false, yukseklik: 0, hucreler })), ...ek,
});
export const HAM = {
  cevap: "Form 8 bölümle kuruldu.",
  baslik: "VİNÇ MUAYENE FORMU", formKodu: "FR.099", altYazi: "FR.099 · 01.01.2026 · REV00",
  yazi: { tip: "tinos", boy: 8 },
  bolumler: [
    /* başlık: logo 3 satır, ad 3 satır, doküman bilgisi */
    tablo("Başlık", [16, 52, 14, 18], [
      [h("", { tur: "gorsel", satirBirlesim: 3 }), h("VİNÇ MUAYENE FORMU", { satirBirlesim: 3, kalin: true, hiza: "orta", boy: 14 }), et("Form no"), kayit("form_kod")],
      [et("Revizyon"), kayit("revizyon")],
      [et("Rapor no"), kayit("rapor_no")],
    ]),
    tablo("1. Firma bilgileri", [18, 38, 18, 26], [
      [serit("1. FİRMA BİLGİLERİ", 4)],
      [et("Unvan"), kayit("firma"), et("Kontrol tarihi"), kayit("bas")],
      [et("Adres"), h("", { tur: "kayit", kaynak: "adres", sutunBirlesim: 3 })],
      [et("SGK sicil"), kayit("sgk"), et("Sözl. ID"), kayit("isg")],
    ]),
    tablo("2. Teknik özellikler", [25, 25, 25, 25], [
      [serit("2. TEKNİK ÖZELLİKLER", 4)],
      [et("Marka"), kayit("marka"), et("Kapasite (kg)"), alan("Kapasite", { alan: "sayi", birim: "kg" })],
      [et("Seri no"), kayit("seri"), et("Statik test yükü (kg)"), alan("Statik test yükü", { alan: "sayi", birim: "kg", formul: "[Kapasite] * 1,25" })],
      [et("Vinç tipi"), alan("Vinç tipi", { alan: "secim", secenekler: ["Köprülü", "Portal"], sutunBirlesim: 3 })],
    ]),
    /* yan yana iki tablo */
    tablo("Halat bilgileri", [60, 40], [[serit("HALAT BİLGİLERİ", 2)], [et("Halat çapı (mm)"), alan("Halat çapı", { alan: "sayi", birim: "mm" })]], { oran: 50 }),
    tablo("Kanca bloğu", [60, 40], [[serit("KANCA BLOĞU", 2)], [et("Emniyet mandalı"), alan("Emniyet mandalı", { alan: "evet" })]], { yan: true, oran: 50 }),
    /* kontrol maddeleri: iki liste yan yana, ikincisinin satır birleşmesi taşsa da sığdırılır */
    tablo("Genel kontroller", [10, 72, 18], [[et("No"), et("GENEL KONTROLLER"), et("Sonuç")], madde("Bakım kayıtları"), madde("*Ray bağlantıları")], { cevaplar: ["U", "UD", "X"], oran: 50 }),
    tablo("Halat ve kanca", [10, 72, 18], [[et("No"), et("HALAT VE KANCA"), et("Sonuç")], madde("*Dinamik yük deneyi (1,1 x P)"), [h("taşan", { satirBirlesim: 9, sutunBirlesim: 9 })]],
      { cevaplar: ["U", "UD", "X"], yan: true, oran: 50 }),
    /* ölçüm: sahada çoğalan satır */
    { ...tablo("Ölçümler", [50, 30, 20], [[et("Ölçüm"), et("Değer"), et("Sonuç")], [alan("Ölçüm"), alan("Değer", { alan: "sayi" }), h("", { tur: "cevap" })]], { cevaplar: ["U", "UD"] }),
      satirlar: [{ tekrar: false, yukseklik: 0, hucreler: [et("Ölçüm"), et("Değer"), et("Sonuç")] }, { tekrar: true, yukseklik: 0, hucreler: [alan("Ölçüm"), alan("Değer", { alan: "sayi" }), h("", { tur: "cevap" })] }] },
    { ad: "NOTLAR / UYGUNSUZLUKLAR", tur: "kusur", yan: false, oran: 100, sutunlar: [], cevaplar: [], satirlar: [] },
    { ad: "Bozuk bölüm", tur: "tablo", yan: false, oran: 100, sutunlar: [], cevaplar: [], satirlar: [] },
    tablo("Sonuç", [70, 30], [[h("Vinç bir sonraki kontrol tarihine kadar kullanıma"), h("", { tur: "sonuc", secenekler: ["UYGUNDUR", "UYGUN DEĞİLDİR"], kalin: true })]]),
    tablo("İmzalar", [20, 40, 40], [
      [h(""), et("KONTROLÜ YAPAN"), et("ONAYLAYAN")],
      [et("Ad soyad"), kayit("uzman_ad"), kayit("teknik_ad")],
      [et("İmza"), h("", { tur: "imza", kim: "uzman" }), h("", { tur: "imza", kim: "teknik" })],
    ]),
  ],
};

/* 2026-10-24 (yapay zekâsız okuma): sonuç hücresinin cümlesi (metin — sözcükten önceki kısım) ve hücre kenarları (kenar: 0 yok · 1 ince · 2 kalın;
   okunamayan yan belgenin çizgisi). Hepsi uydurma. */
export const HAM_SONUC_KENAR = {
  cevap: "", baslik: "", formKodu: "", altYazi: "", yazi: { tip: "carlito", boy: 9 },
  bolumler: [tablo("Sonuç cümlesi", [60, 40], [
    [h("Kenarsız", { kenar: { u: 0, a: 0, s: 0, g: 0 } }), h("Ekipman kullanıma", { tur: "sonuc", secenekler: ["UYGUNDUR", "UYGUN DEĞİLDİR"], kenar: { u: 1, a: 1, s: 1, g: 1 } })],
    [h("Kalın üst", { kenar: { u: 2, a: 1, s: 1, g: 9 } }), h("Belgenin çizgisi")],
  ])],
};
