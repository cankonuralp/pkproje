/* HAZIR ŞABLONLAR — probata kitaplığı (RAPOR-FORMAT.md §4.1, §8): firma kopyalar, değiştirir, yayınlar. Bakanlık formatlı iki tür (ZPKR01 AG
   topraklama, ZPKR02 elektrik iç tesisatı) ve bir genel tür (kompresör). Bölüm, alan, seçenek ve kriter yazımları Bakanlık PDF'lerinden birebir
   (maket maket-veri.js MV.FORMAT_YAPI, 2026-09-27/28 — reisim: "birebir aynı pdf çıktısı olmalı"). Bakanlık formatlı şablonda zorunlu öğeler
   KİLİTLİ: silinemez (yayın denetimi), yalnız sırası / görünümü değişir. Örnek değer YOK (AA11: formlar boş açılır). */
import { FormatTanimi, type FormatGirdisi } from "./tanim.ts";

const VAR_YOK = ["Var", "Yok"], NEDEN = ["Periyodik Kontrol", "İlk Kontrol"], YAPI = ["Ev", "Ticari", "Endüstri", "Diğer"];
const SEBEKE = ["TT", "IT", "TN-CS", "TN-C", "TN-S"], TOPRAKLAYICI = ["Ring", "Yüzeysel", "Temel", "Derin", "Belirlenemedi"];
const EGRI = ["B", "C", "D"];
const CEVAP = ["Uygun", "Uygun değil", "Uygulanamaz"];

type AlanG = { id: string; ad: string; tur: "metin" | "sayi" | "tarih" | "secim" | "coklu" | "evet"; secenekler?: string[]; birim?: string; zorunlu?: boolean };
const kilitli = <T extends object>(l: T[], kilit: boolean) => l.map((x) => ({ ...x, kilit }));
const m = (id: string, ad: string, secenekler?: string[]): AlanG => ({ id, ad, tur: secenekler ? "secim" : "metin", secenekler, zorunlu: true });

/** 1 · firma bilgileri: kayıttan (salt okunur) */
const firma = (kilit: boolean) => ({
  id: "firma", ad: "Firma bilgileri", blok: "bilgi" as const, kilit,
  alanlar: kilitli([
    { id: "firma_adi", ad: "Firma adı", tur: "metin" as const, kaynak: "firma_adi" as const }, { id: "adres", ad: "Adres", tur: "metin" as const, kaynak: "tesis_adresi" as const },
    { id: "sgk", ad: "SGK sicil no", tur: "metin" as const, kaynak: "sgk" as const }, { id: "isg_id", ad: "İSG-KATİP SÖZLEŞME ID", tur: "metin" as const, kaynak: "isg_id" as const },
    { id: "kontrol_tarihi", ad: "Kontrol tarihi", tur: "tarih" as const, kaynak: "kontrol_tarihi" as const },
  ], kilit),
});
const sonBolumler = (kilit: boolean, cumle: string, foto: boolean) => [
  ...(foto ? [{ id: "foto", ad: "Fotoğraflar", blok: "foto" as const, enAz: 0, enCok: 20 }] : []),
  { id: "kusur", ad: "Kusur açıklamaları", blok: "kusur" as const, kilit },
  { id: "yorum", ad: "Muayene uzmanı yorumu", blok: "not" as const },
  { id: "sonuc", ad: "Sonuç ve kanaat", blok: "sonuc" as const, kilit, cumle },
  { id: "imza", ad: "Yetkili kişiler ve imzalar", blok: "imza" as const, kilit, imzalar: ["uzman" as const, "teknik" as const] },
];

/* ── ZPKR01 · AG TOPRAKLAMA ── */
const ZPKR01_NOTLAR = ["Uygun.", "Güvenlik şartı sağlanamadığından uygun değildir. (Ağır kusur)", "Topraklama bağlantısı yok kontrol edilmelidir. (Ağır kusur)",
  "Artık akım anahtarı kullanıldığı ve faal olduğu için uygundur.",
  "TT veya TN (TN-S veya TN-CS'nin S bölümü) şebekelerde 32 A'e kadar genel kullanım priz tesisatlarında ve seyyar cihaz prizlerinde 30 mA RCD kullanımı zorunludur. (Ağır kusur)",
  "32 A üzerindeki devrelerde dolaylı dokunmaya karşı önlemler yanında doğal kaçak akım tahkiki yapılmadığından yetersizdir. (Ağır kusur)",
  "Son tüketim noktasını besleyen panodan bir önceki panoda kullanılan RCD gecikmeli tip (selektif veya gecikme ayarlı) olmadığından yetersizdir.",
  "Nötr-toprak geriliminin yüksek olması nedeniyle ölçüm yapılamamıştır. (Ağır kusur)",
  "TN-S ve TN-CS topraklama sistem tipini belirleyen PEN köprüsü dışında PE ve N iletkenlerinin birleştirilmesi uygun değildir. (Ağır kusur)",
  "Priz üzerinde nötr-toprak birleşikliği (sıfırlama) tespit edildiğinden yetersiz. (Ağır kusur)", "Pano gövde–kapak köprüsü olmadığından yetersizdir. (Ağır kusur)"]
  .map((metin) => ({ metin, kusur: !/^Uygun\.|uygundur\.$/.test(metin), agir: /Ağır kusur/.test(metin) }));

const ZPKR01: FormatGirdisi = {
  sema: 1,
  gorunum: {
    formKodu: "ZPKR01", baslik: "Alçak Gerilim Topraklama Tesisatı Periyodik Kontrol Raporu",
    dayanak: ["TS HD 60364-4-41 Alçak Gerilim Elektrik Tesisleri – Bölüm 4: Güvenlik İçin Koruma – Bölüm 41: Elektrik Çarpmasına Karşı Koruma",
      "TS HD 60364-6 Alçak Gerilim Elektrik Tesisatları – Bölüm 6: Doğrulama", "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği",
      "Elektrik Tesislerinde Topraklamalar Yönetmeliği", "Elektrik İç Tesisleri Yönetmeliği"],
  },
  kurallar: { foto: false, derece: false, oneri: true },
  bolumler: [
    firma(true),
    { id: "ekipman", ad: "Ekipman bilgileri", blok: "bilgi", kilit: true, alanlar: kilitli([
      m("kurulus", "Enerji sağlayan kuruluş"), m("sebeke", "Şebeke tipi", SEBEKE), m("gerilim", "Şebeke gerilimi"), m("proje", "Tesise ait proje var mı?", VAR_YOK),
      m("tekhat", "Tek hat şeması var mı?", VAR_YOK), m("neden", "Kontrol nedeni", NEDEN), m("proje_bilgi", "Proje bilgileri"), m("topraklayici", "Topraklayıcı tipi", TOPRAKLAYICI),
      m("yapi", "Yapı cinsi", YAPI), m("amac", "Ekipmanın kullanım amacı"), m("son_kontrol", "Son kontrol tarihi"),
      m("dolayli", "Dolaylı dokunmaya karşı koruma önlemi", ["Eşpotansiyel topraklama ve beslemenin otomatik kesilmesi (TT, TN, IT)",
        "Koruyucu yalıtma (Sınıf II veya zemin yalıtımı)", "Koruyucu ayırma (İzolasyon trafosu)", "Küçük gerilim <50 V"]),
      m("hava", "Hava durumu ve sıcaklığı"), m("zemin", "Zemin nem durumu"),
      m("degisiklik", "Tesisatta kapsamlı değişiklik var mı?", VAR_YOK), m("etiket", "Bir önceki periyodik kontrol etiketi var mı?", VAR_YOK), m("pano", "Pano/Ekipman tanımlaması"),
    ], true) },
    { id: "cihaz", ad: "Ölçüm cihazları", blok: "cihaz", kilit: true },
    { id: "nokta", ad: "Ölçüm noktaları (çevrim empedansı)", blok: "olcum", kilit: true, satir: "ekle", hesap: "nokta", enAz: 1, notlar: ZPKR01_NOTLAR, sutunlar: [
      { id: "ad", ad: "Ölçüm noktası", giris: "metin", zorunlu: true }, { id: "egri", ad: "Açma eğrisi", giris: "secim", secenekler: EGRI, zorunlu: true },
      { id: "inom", ad: "In", birim: "A", zorunlu: true }, { id: "zx", ad: "Zx", birim: "Ω", zorunlu: true }, { id: "rcd", ad: "RCD IΔn", birim: "mA" },
      { id: "priz", ad: "Priz devresi", giris: "evet" }, { id: "rcd_id", ad: "RCD testi IΔ", birim: "mA" }, { id: "rcd_td", ad: "RCD testi TΔ", birim: "ms", op: "<=", sinir: 200 },
    ] },
    { id: "selektif", ad: "RCD selektivite", blok: "olcum", kilit: true, satir: "ekle", hesap: "selektivite", notlar: ZPKR01_NOTLAR, sutunlar: [
      { id: "ad", ad: "Son tüketim noktasından önceki pano", giris: "metin", zorunlu: true }, { id: "tip", ad: "RCD tipi", giris: "secim", secenekler: ["A", "AC", "B", "F"] },
      { id: "inom", ad: "In", birim: "A" }, { id: "idn", ad: "IΔn", birim: "mA", zorunlu: true }, { id: "id", ad: "IΔ", birim: "mA", zorunlu: true },
      { id: "td", ad: "TΔ", birim: "ms", zorunlu: true }, { id: "gecikme", ad: "Gecikme", birim: "ms" }, { id: "son_pano", ad: "Son tüketim noktasını besleyen pano", giris: "metin" },
    ] },
    ...sonBolumler(true, "Periyodik kontrol tarihi itibarıyla yukarıda teknik özellikleri belirtilen AG Topraklama Tesisatı muayenesi sonrasında mevcut şartlar altında kullanımı 1 yıl süreyle", false),
  ],
};

/* ── ZPKR02 · ELEKTRİK İÇ TESİSATI ── */
const GOZLE: [string, string[]][] = [
  ["PANO VE DİĞER DONANIMLARA GİRİŞİN UYGUNLUĞU", ["Kablo şebeke tarafı", "Kablo donanım tarafı", "Pano sabitlenmesi (Depreme dayanıklılık)", "Dış darbelere karşı koruma önlemi",
    "Elektrik panosu etrafında yabancı malzemeler", "Zemin izolasyonu"]],
  ["TOPRAKLANMIŞ POTANSİYEL DENGELEME VE BESLEMENİN OTOMATİK KESİLMESİ, ELEKTRİK ÇARPMASINA (DOLAYLI DOKUNMAYA) KARŞI KORUMA", ["Topraklama iletkeni", "Ana potansiyel dengeleme iletkeni",
    "Ek Potansiyel dengeleme İletkeni (Tamamlayıcı pot.den)", "Pano kapak bağlantısı kontrolü 6 mm²"]],
  ["KARŞILIKLI ZARARLI ETKİLERİN ÖNLENMESİ", ["Elektriksel olmayan tesislere yaklaşma ve diğer etkilerin kontrolü", "Bant I ve Bant II ayrılması, Bant II yalıtımı",
    "Güvenlik devre ayrılması", "Pano iç kapak, faza erişim engeli veya pleksi koruma"]],
  ["TANIMLAMA", ["Şemalar, talimatlar, devre çizimleri ve kısa bilgiler", "Koruma cihaz ve terminal etiket", "Tehlike işaretleri ve diğer uyarı işaretleri"]],
  ["KABLO ve İLETKENLER", ["Kablo yollarının uygunluğu ve mekanik koruma", "Kablo renk kodları Nötr: Mavi Toprak: Sarı/ Yeşil", "Tesisat yöntemi",
    "Yangın engeli, uygun kilitleme ve sıcaklık etkisine karşı koruma"]],
  ["TERMAL KAMERA", ["Kontak gevşekliği ısınması", "Aşırı yük ısınması PVC kablolar için >70 derece"]],
  ["GENEL DEĞERLENDİRMELER", ["Ekipman yakınında elektriksel ekipman yangın söndürme tertibatı", "Ekipman temizlik/bakım durumu", "Pano içi ve bağlantılarının korozyon kontrolü",
    "Ekipman içi veya yakınında acil durum aydınlatma tertibatı"]],
];
const ZPKK02 = "ZPKK02 · Elektrik İç Tesisatı Gözle Kontrol ve Fonksiyon Testleri Periyodik Kontrol Kriterleri";

const ZPKR02: FormatGirdisi = {
  sema: 1,
  gorunum: {
    formKodu: "ZPKR02", baslik: "Elektrik İç Tesisatı Gözle Kontrol ve Fonksiyon Testleri Periyodik Kontrol Raporu",
    dayanak: ["TS HD 60364-4-43 Alçak Gerilim Elektrik Tesisatları – Bölüm 4: Güvenlik İçin Koruma Grup 43 – Aşırı Akıma Karşı Koruma",
      "TS HD 60364-6 Alçak Gerilim Elektrik Tesisatları – Bölüm 6: Doğrulama", "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği",
      "Elektrik İç Tesisleri Yönetmeliği", "Elektrik Tesislerinde Topraklamalar Yönetmeliği"],
  },
  kurallar: { foto: false, derece: false, oneri: true },
  bolumler: [
    firma(true),
    { id: "ekipman", ad: "Ekipman bilgileri", blok: "bilgi", kilit: true, alanlar: kilitli([
      m("kurulus", "Enerji sağlayan kuruluş"), m("sebeke", "Şebeke tipi", SEBEKE), m("gerilim", "Şebeke gerilimi"), m("proje", "Tesise ait proje var mı?", VAR_YOK),
      m("tekhat", "Tek hat şeması var mı?", VAR_YOK), m("neden", "Kontrol nedeni", NEDEN), m("topraklayici", "Topraklayıcı tipi", TOPRAKLAYICI), m("yapi", "Yapı cinsi", YAPI),
      m("amac", "Ekipmanın kullanım amacı"), m("son_kontrol", "Son kontrol tarihi"),
      m("faz", "Faz iletkenlerinin sayısı ve tipi", ["AA · 1 faz, 2 tel", "AA · 1 faz, 3 tel", "AA · 2 faz, 3 tel", "AA · 3 faz, 3 tel", "AA · 3 faz, 4 tel", "DA · 2 kutup", "DA · 3 kutup", "Diğer"]),
      m("temel_direnc", "Temel topraklama direnci (Ω)"), { ...m("elektrot", "İlave topraklama elektrotu detayları (varsa)"), zorunlu: false },
      m("sistem_iletken", "Sistem topraklama iletkeni ve kesiti"), m("ana_esp", "Ana eşpotansiyel iletkeni ve kesiti"), m("kaynak_u", "Nominal gerilim, U/Uo (kV)"),
      m("kaynak_f", "Nominal frekans, f (Hz)"), m("kaynak_if", "Hata akımı olasılığı, IF (kA)"), m("kaynak_ze", "Dış çevrim empedansı ZE (Ω)"),
      m("ana_rcd", "TT-TN-S şebeke için ana RCD anma akımı"), m("ana_kesici_tip", "Ana kesici tipi"), m("ana_kesici_akim", "Ana kesici nominal akım (A)"),
      m("ana_rcd_test", "TT-TNS şebeke için ana RCD test akımı (mA) ve süresi (ms)"),
      m("degisiklik", "Tesisatta kapsamlı değişiklik var mı? (>%20)", VAR_YOK), m("dkd", "Tesisatta aşırı gerilim koruma cihazları (DKD/SPD) kullanılmış mı?", ["Evet", "Hayır"]),
      { id: "dogrudan", ad: "Tespit edilen bilgiler (Doğrudan dokunmaya karşı koruma önlemleri)", tur: "coklu", zorunlu: true, secenekler: [
        "Gerilim altındaki bölümlerin yalıtılması (iç kapak veya pleksi koruma)", "Mahfaza (IPXY, Pano kilidi, tehlike işareti vb.)", "Engel", "El ulaşma uzaklığı dışına yerleştirme",
        "İlave koruma", "30 mA RCD (5xI için 40 ms açma zamanı); devre kesicisi <32 A devreler için (TS HD 60364-4-41)"] },
      m("etiket", "Bir önceki periyodik kontrol etiketi var mı?", VAR_YOK), m("pano", "Pano Adı/Ekipman Tanımlaması"),
    ], true) },
    { id: "termal", ad: "Termal kamera görüntüleri", blok: "foto", kilit: true, enAz: 0, enCok: 10 },
    { id: "cihaz", ad: "Ölçüm cihazları", blok: "cihaz", kilit: true },
    { id: "gozle", ad: "Gözle kontrol", blok: "liste", kilit: true, cevaplar: CEVAP,
      gruplar: GOZLE.map(([ad, l], i) => ({ id: `g${i + 1}`, ad, maddeler: l.map((metin, j) => ({ id: `g${i + 1}_${j + 1}`, metin, std: ZPKK02, kilit: true })) })) },
    { id: "fonk", ad: "Fonksiyon testleri", blok: "test", kilit: true, degerler: [
      { id: "zx", ad: "Panodan ölçülen faz-toprak çevrim empedansı (Zx)", birim: "Ω", op: "<=", sinir: 0.37, not: "ana kesici C63 · Zs = 230 V / 630 A", kilit: true },
      { id: "zln", ad: "Panodan ölçülen faz-nötr çevrim empedansı (ZLN)", birim: "Ω", kilit: true },
      { id: "ff", ad: "Gerilim F-F", birim: "V", kilit: true }, { id: "ln", ad: "Gerilim L-N", birim: "V", kilit: true },
      { id: "npe", ad: "Gerilim N-PE", birim: "V", op: "<=", sinir: 10, kilit: true },
      { id: "ik3", ad: "Hesaplanan 3 fazlı kısa devre akımı", birim: "kA", kilit: true },
      { id: "dkd_tip", ad: "Aşırı gerilim koruma (DKD) tipi", metin: true, zorunlu: false, kilit: true },
      { id: "dkd_akim", ad: "Aşırı gerilim koruma (DKD) dayanma akımı", birim: "kA", zorunlu: false, kilit: true },
    ] },
    { id: "linye", ad: "Pano sigortaları (linye)", blok: "olcum", kilit: true, satir: "ekle", hesap: "linye", enAz: 1, sutunlar: [
      { id: "no", ad: "No", giris: "metin", zorunlu: true }, { id: "devre", ad: "Devre", giris: "metin", zorunlu: true },
      { id: "tip", ad: "Tip", giris: "secim", secenekler: EGRI, zorunlu: true }, { id: "akim", ad: "In", birim: "A", zorunlu: true }, { id: "kutup", ad: "Kutup" },
      { id: "rcd", ad: "RCD IΔn", birim: "mA" }, { id: "icu", ad: "Icu", birim: "kA" }, { id: "faz", ad: "Faz kesiti", birim: "mm²" },
      { id: "npen", ad: "N/PEN kesiti", birim: "mm²" }, { id: "pe", ad: "PE kesiti", birim: "mm²" }, { id: "ib", ad: "Ib", birim: "A" }, { id: "iz", ad: "Iz", birim: "A" },
      { id: "id", ad: "RCD testi IΔ", birim: "mA" }, { id: "td", ad: "RCD testi TΔ", birim: "ms" },
    ] },
    { id: "pd", ad: "Potansiyel dengeleme", blok: "olcum", kilit: true, satir: "ekle", hesap: "pd", sutunlar: [
      { id: "yer", ad: "Yer", giris: "metin", zorunlu: true }, { id: "kesit", ad: "PD kesiti", birim: "mm²" }, { id: "sure", ad: "Süreklilik", birim: "Ω" },
      { id: "tkesit", ad: "Tamamlayıcı PD kesiti", birim: "mm²" }, { id: "tsure", ad: "Tamamlayıcı süreklilik", birim: "Ω" },
    ] },
    { id: "zi", ad: "Zemin izolasyonu", blok: "olcum", kilit: true, satir: "ekle", hesap: "zi", sutunlar: [
      { id: "yer", ad: "Yer", giris: "metin", zorunlu: true }, { id: "en", ad: "En", birim: "m" }, { id: "boy", ad: "Boy", birim: "m" }, { id: "direnc", ad: "Direnç", birim: "kΩ", zorunlu: true },
    ] },
    ...sonBolumler(true, "Periyodik kontrol tarihi itibarıyla yukarıda teknik özellikleri belirtilen Elektrik Tesisatının fonksiyon testleri muayenesi sonrasında mevcut şartlar altında kullanımı", true),
  ],
};

/* ── KOMPRESÖR (genel; Bakanlık formatı yok — firma serbest) ── */
const KOMPRESOR: FormatGirdisi = {
  sema: 1,
  gorunum: { formKodu: "", baslik: "Kompresör Periyodik Kontrol Raporu", dayanak: [] },
  kurallar: { foto: false, derece: false, oneri: true },
  bolumler: [
    firma(false),
    { id: "ekipman", ad: "Ekipman bilgileri", blok: "bilgi", alanlar: [
      { id: "ekipman_kodu", ad: "Ekipman kodu", tur: "metin", kaynak: "ekipman_kodu" }, m("marka", "Marka / model"), { id: "seri", ad: "Seri no", tur: "metin", kaynak: "seri_no" },
      { id: "imal", ad: "İmal yılı", tur: "sayi", zorunlu: true }, { id: "yer", ad: "Kullanım yeri", tur: "metin", kaynak: "kullanim_yeri" },
      { id: "calisma", ad: "Çalışma basıncı", tur: "sayi", birim: "bar", zorunlu: true }, { id: "hacim", ad: "Tank hacmi", tur: "sayi", birim: "L" },
    ] },
    { id: "cihaz", ad: "Ölçüm cihazları", blok: "cihaz" },
    { id: "kriter", ad: "Muayene kriterleri", blok: "liste", cevaplar: CEVAP, gruplar: [{ id: "k", ad: "", maddeler: [
      "Gövde ve kaynaklar: gözle muayene (korozyon, ezik)", "Emniyet ventili: ayar basıncı ve fonksiyon", "Manometre: okunabilirlik ve kalibrasyon işareti",
      "Tahliye düzeni", "Etiket plakası ve izlenebilirlik", "Hidrostatik deney (deney basıncı)",
    ].map((metin, i) => ({ id: `k${i + 1}`, metin })) }] },
    { id: "test", ad: "Test değerleri", blok: "test", degerler: [
      { id: "hidro", ad: "Hidrostatik deney basıncı", birim: "bar", op: ">=", sinir: 16.5, not: "1,5 × 11 bar çalışma" },
      { id: "ventil", ad: "Emniyet ventili açma basıncı", birim: "bar", op: "<=", sinir: 11, not: "çalışma basıncı" },
    ] },
    ...sonBolumler(false, "Periyodik kontrol tarihi itibarıyla yukarıda teknik özellikleri belirtilen kompresörün muayenesi sonrasında mevcut şartlar altında kullanımı", true),
  ],
};

/** kitaplık: anahtar → { ad, tanım } (tanım şemadan geçmiş; bozuk şablon yüklemede düşer) */
export const SABLONLAR: Readonly<Record<string, { ad: string; tanim: FormatTanimi }>> = Object.freeze({
  ZPKR01: { ad: "AG topraklama (ZPKR01, Bakanlık)", tanim: FormatTanimi.parse(ZPKR01) },
  ZPKR02: { ad: "Elektrik iç tesisatı (ZPKR02, Bakanlık)", tanim: FormatTanimi.parse(ZPKR02) },
  KOMPRESOR: { ad: "Kompresör (genel)", tanim: FormatTanimi.parse(KOMPRESOR) },
});
