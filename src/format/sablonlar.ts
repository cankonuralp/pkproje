/* HAZIR ŞABLONLAR — probata kitaplığı (RAPOR-FORMAT.md §4.1, §8): firma kopyalar, değiştirir, yayınlar. Bakanlık formatlı beş tür (ZPKR01 AG
   topraklama, ZPKR02 elektrik iç tesisatı; 427: ZPKR03 yıldırımdan korunma, ZPKR04 yangın algılama, ZPKR05 trafo) ve bir genel tür (kompresör). Bölüm, alan, seçenek ve kriter yazımları Bakanlık PDF'lerinden birebir
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
  /* fotoğraf rapor başına en az 1 (reisim 2026-09-22; §3.8-5 temel zorunlu) — 2026-10-05 (C4) */
  ...(foto ? [{ id: "foto", ad: "Fotoğraflar", blok: "foto" as const, enAz: 1, enCok: 20 }] : []),
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
    /* 430: talimat örneği — grubun ve hidrostatik deney maddesinin (firma kurucuda değiştirir) */
    { id: "kriter", ad: "Muayene kriterleri", blok: "liste", cevaplar: CEVAP, gruplar: [{ id: "k", ad: "",
      talimat: "Kap basınçsız ve soğukken muayene edilir. Gövde, kaynaklar ve bağlantılar gözle; emniyet ventili ve manometre yerinde kontrol edilir.",
      maddeler: [
        "Gövde ve kaynaklar: gözle muayene (korozyon, ezik)", "Emniyet ventili: ayar basıncı ve fonksiyon", "Manometre: okunabilirlik ve kalibrasyon işareti",
        "Tahliye düzeni", "Etiket plakası ve izlenebilirlik", "Hidrostatik deney (deney basıncı)",
      ].map((metin, i) => ({ id: `k${i + 1}`, metin, std: "TS EN 286-1",
        ...(i === 5 ? { talimat: "Deney basıncı çalışma basıncının 1,5 katıdır. Deney süresince sızıntı ve kalıcı şekil değişikliği olmamalıdır." } : {}) })) }] },
    { id: "test", ad: "Test değerleri", blok: "test", degerler: [
      { id: "hidro", ad: "Hidrostatik deney basıncı", birim: "bar", op: ">=", sinir: 16.5, not: "1,5 × 11 bar çalışma" },
      { id: "ventil", ad: "Emniyet ventili açma basıncı", birim: "bar", op: "<=", sinir: 11, not: "çalışma basıncı" },
    ] },
    ...sonBolumler(false, "Periyodik kontrol tarihi itibarıyla yukarıda teknik özellikleri belirtilen kompresörün muayenesi sonrasında mevcut şartlar altında kullanımı", true),
  ],
};

/* ── 427 · ELEKTRİK TARAFI ZORUNLU FORMATLAR (Bakanlık; yayım 18.07.2025, yürürlük 01.09.2025 — reisim 2026-10-09: "Elektrik tarafında zorunlu
   formatlar yayınlandı, bu formatları probataya ekle"): ZPKR03 yıldırımdan korunma, ZPKR04 yangın algılama, ZPKR05 trafo. Bölüm adları ve
   sıraları resmî formdaki gibi ("ana başlıklar ve sıralamaları değişmeyecek"): alt başlıklar üst başlıkla (ust) N.1, N.2; fotoğraf bölümü
   numarasız (src/format/duzen.ts). Madde, grup ve genel talimatlar kriter belgelerinden (ZPKK03–05, src/tanim/kriterler.ts) özet — saha
   ekranında ünlemle açılır, PDF'e basılmaz. Kusur derecesi (* hafif, ** ağır) sorulur: formların sonuç bölümü ağır kusuru tanımlar. */
const SEBEKE6 = ["TT", "IT", "TN", "TN-CS", "TN-C", "TN-S"];
const DERECELI = { foto: false, derece: true, oneri: true };
/** resmî formların son bölümleri: kusur · (numarasız) fotoğraflar · notlar · sonuç ve kanaat (+ formun sabit metni) · yetkili kişi */
const resmiSon = (cumle: string, aciklama: string, fotoKilit: boolean) => [
  { id: "kusur", ad: "Kusur açıklamaları", blok: "kusur" as const, kilit: true },
  { id: "foto", ad: "Fotoğraflar", blok: "foto" as const, kilit: fotoKilit, numarasiz: true, enAz: 1, enCok: 20 },
  { id: "yorum", ad: "Notlar", blok: "not" as const, kilit: true },
  { id: "sonuc", ad: "Sonuç ve kanaat", blok: "sonuc" as const, kilit: true, cumle, aciklama },
  { id: "imza", ad: "Periyodik kontrolleri yapmaya yetkili kişi bilgileri ve onay", blok: "imza" as const, kilit: true, imzalar: ["uzman" as const, "teknik" as const] },
];
type MaddeG = string | readonly [metin: string, talimat: string];
type GrupG = { ad: string; talimat?: string; std?: string; maddeler: MaddeG[] };
/** gruplar → kilitli maddeler; kimlik önek + grup sırası + madde sırası (tanımda tekil) */
const gruplar = (on: string, l: GrupG[]) => l.map((g, i) => ({
  id: `${on}${i + 1}`, ad: g.ad, ...(g.talimat ? { talimat: g.talimat } : {}),
  maddeler: g.maddeler.map((x, j) => {
    const [metin, talimat] = typeof x === "string" ? [x, undefined] : x;
    return { id: `${on}${i + 1}_${j + 1}`, metin, ...(g.std ? { std: g.std } : {}), ...(talimat ? { talimat } : {}), kilit: true };
  }),
}));
const BIRAKMA = "Kriterler ekipmanın kullanım yeri, amacı, tipi ve modeline göre değişebilir: ilgili imalat mevzuatı / standardında riski bulunmayan kriter aranmaz, madde “Uygulanamaz” işaretlenir.";
const PROJE_NOTU = "Projeyi onaylayanların ad soyadı, meslek unvanı, diploma numarası, tarih ve sayı, proje onay geçerlilik süresi notlara eklenir.";

/* ── ZPKR03 · YILDIRIMDAN KORUNMA TESİSATI ── */
const YKS = "TS EN 62305-3 Madde 5.3";
const ZPKR03: FormatGirdisi = {
  sema: 1,
  gorunum: {
    formKodu: "ZPKR03", baslik: "Yıldırımdan Korunma Tesisatı Periyodik Kontrol Raporu",
    dayanak: ["TS EN 62305-1 Yıldırımdan Korunma – Bölüm 1: Genel Kurallar", "TS EN 62305-2 Yıldırımdan Korunma – Bölüm 2: Risk Yönetimi",
      "TS EN 62305-3 Yıldırımdan Korunma – Bölüm 3: Yapılarda Fiziksel Hasar ve Hayati Tehlike",
      "TS EN 62305-4 Yıldırımdan Korunma – Bölüm 4: Yapılarda Bulunan Elektrik ve Elektronik Sistemler", "TS 622 Yapıların Yıldırımdan Korunması Kuralları",
      "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği", "Elektrik Tesislerinde Topraklamalar Yönetmeliği", "Elektrik İç Tesisleri Yönetmeliği"],
    talimat: [
      "Rapor her yıldırımdan korunma ekipmanı (ESE paratoner, yakalama ucu, Faraday kafesi) için ayrı düzenlenir; uygunsuzluklar fotoğrafla gösterilebilir.",
      "Hazırlık: ölçüm tarihi, hava ve toprak durumu, tesisat bilgileri yazılır; topraklama projesi olup olmadığı ve korunma tipi (ESE, Franklin çubuğu, Faraday kafesi) belirlenir. Binadaki doğal bileşenlerin (betonarme donatı, çelik konstrüksiyon) sistemde kullanılıp kullanılmadığı belirtilir.",
      "Radyoaktif olduğu düşünülen paratonerde radyoaktif uyarı işareti aranır. Radyoaktif paratonerlerin kullanımı yasaktır: kontrol yapılmadan söktürülmesi istenir, uygunsuzluk yazılır.",
      "ESE ve Faraday bölümlerinden tesiste olmayan tipin maddeleri bölüm başındaki toplu işaretlemeyle “Uygulanamaz” yapılır.",
      BIRAKMA, PROJE_NOTU,
    ].join("\n"),
  },
  kurallar: DERECELI,
  bolumler: [
    firma(true),
    { id: "ekipman", ad: "Ekipman bilgileri", blok: "bilgi", kilit: true, alanlar: kilitli([
      m("kurulus", "Enerji sağlayan kuruluş"), m("sebeke", "Şebeke tipi", SEBEKE6), m("gerilim", "Şebeke gerilimi"),
      m("kapsama", "Tesise ait kapsama alanı projesi var mı?", VAR_YOK), m("risk", "Risk analizi var mı?", VAR_YOK), m("proje_bilgi", "Proje detayları"),
      m("neden", "Kontrol nedeni", NEDEN), m("topraklayici", "Topraklayıcı tipi", TOPRAKLAYICI), m("yapi", "Yapı cinsi", YAPI),
      m("amac", "Ekipmanın kullanım amacı ve YKS cinsi", ["Ayrılmış YKS", "Ayrılmamış (Eşpotansiyel) YKS"]), m("son_kontrol", "Son kontrol tarihi"),
      m("hava", "Hava durumu ve sıcaklığı"), m("zemin", "Zemin nem durumu"),
      m("degisiklik", "Tesisatta kapsamlı değişiklik var mı?", VAR_YOK), m("etiket", "Bir önceki periyodik kontrol etiketi var mı?", VAR_YOK),
      m("tanimlama", "Ekipman tanımlaması"),
      m("yks_tipi", "Yıldırımdan korunma tesisatı tipi", ["ESE (Aktif-Radyoaktif) Paratoner", "Franklin çubuğu: FRANKLİN", "Faraday kafesi: FARADAY",
        "Doğal Bileşenler (Betonarme donatı, çelik yapı): DOĞAL", "Gerilmiş Tel"]),
      m("eps", "Koruma seviyesi (EPS)"), m("yapi_detay", "Yapı kullanım amacı, yapıya ait detaylar"),
    ], true) },
    { id: "cihaz", ad: "Ölçüm aletleri bilgileri", blok: "cihaz", kilit: true },
    { id: "kapsam", ust: "Kontrol kriterleri ve testler", ad: "Kapsama alanı bağlamında uygunluk", blok: "liste", kilit: true, cevaplar: CEVAP, gruplar: gruplar("k", [{
      ad: "Yıldırımdan korunma sisteminin koruma yaptığı kapsama alanı bağlamında uygunluğu", std: "TS EN 62305-2 Madde 5",
      talimat: "Yıldırımdan korunma risk analizi işverenden istenir, koruma seviyesi tespit edilir. Koruma seviyesindeki koruma açısına ve bina yüksekliğine göre oluşan kapsama alanı kontrol edilir; afaki koruma yarıçapı durumunda uygunsuzluk verilir. ESE tip paratonerin kapsama alanı da risk analizindeki koruma açısına göre hesaplanır.",
      maddeler: ["Yıldırımdan korunma risk analizi ve kapsama alanı projesi var mı?",
        "Yıldırım seviyesine göre montajı yapılmış olan yıldırımdan korunma sistemi için tanımlanan kapsama alanı, binayı kapsıyor mu?"],
    }]) },
    { id: "olcum_metodu", ust: "Kontrol kriterleri ve testler", ad: "Fiziki uygunluk ve ölçüm metodu", blok: "bilgi", kilit: true, alanlar: kilitli([
      m("metot", "Ölçüm ve doğrulama metodu", ["Çevrim empedansı", "3 Uçlu topraklama", "Klamp metodu (Çoklu topraklayıcılı)"]),
    ], true) },
    { id: "ese", ust: "Kontrol kriterleri ve testler", ad: "ESE (Aktif-Radyoaktif) Paratoner", blok: "liste", kilit: true, cevaplar: CEVAP, gruplar: gruplar("e", [
      { ad: "A. Koruma borusu", std: YKS,
        talimat: "Koruma borusu (test klemensi ile toprak arasında topraklama iletkenlerini koruyan boru) var mı; paslanmaya karşı galvanizli mi, oksitlenme var mı, çapı uygun mu (31,75 mm veya 1 ¼\"), duvara tutturulmuş mu, ağzı yalıtkan malzemeyle kaplanmış mı, iletkenler PVC hortum içinde mi ve uzunluğu ortalama 2,5 m'den fazla mı kontrol edilir.",
        maddeler: ["Koruma borusu tesis edilmiş midir?", "Koruma borusu galvaniz mi?", "Koruma borusunda oksitlenme var mı?", "Koruma borusu çapı uygun mudur?",
          "Koruma borusu duvara kelepçelerle tutturulmuş mudur?", "Koruma borusu ağzı yalıtkan bir madde ile kaplanmış mıdır?",
          "Koruma borusu içindeki iletkenler PVC boru/hortum içinde midir?", "Koruma borusu >250 cm"] },
      { ad: "B. İndirme iletkenleri", std: YKS,
        talimat: "İndirme iletkenlerinin bakır (2x50 mm²) veya eşdeğer kesitte olduğu, tespit kroşelerinin kızıl döküm olduğu, oksitlenme, köşelerde “S” yapıp yapmadığı ve tespit kroşeleri arası mesafenin ortalama 0,5-0,7 m olduğu kontrol edilir.",
        maddeler: ["İndirme iletkenleri 2x50 mm² bakır veya eşdeğer iletken mi?", "İndirme iletkenleri som bakır veya eşdeğer iletken mi?",
          "İndirme iletkenleri tespit kroşeleri kızıl döküm", "İndirme iletkenleri tespit kroşelerinde oksitlenme var mıdır?", "İndirme iletkenleri köşe \"S\" yapmakta mıdır?",
          "İndirme iletkenleri tespit elemanları arası mesafe ortalama 0,5-0,7 m", "Gerilmiş tel ise her bir tel ucu için indirme iletkeni kullanılmış mı?"] },
      { ad: "C. Muayene klemensi", std: YKS,
        talimat: "Muayene klemensinin olup olmadığı ve oksitlenmeye karşı korunup korunmadığı kaydedilir; zeminden en az 270 cm yukarıda olduğu ve koruma borusuna mesafesinin 20 cm olduğu kontrol edilir. Klemens yer altında veya kuyuda olabilir; global topraklama ve Faraday kafesi sistemlerinde bulunmayabilir — bu durum notlara yazılır.",
        maddeler: ["Muayene klemensi tesisi", "Muayene klemensi oksitlenmeye karşı koruma alınmış mıdır?", "Muayene klemensi zeminden 270 cm yukarıda mıdır?",
          "Muayene klemensi ile koruma borusu arası mesafe 20 cm midir?"] },
      { ad: "D. Çatı / tesis üstü", std: YKS,
        talimat: "Çatı direğinin boyu ve çapı kontrol edilir, direk bağlantı klemensinin varlığı not edilir; sağlam tutturulduğundan ve iniş iletkenlerinin uygun irtibatlandırıldığından emin olunur. Yanıcı, parlayıcı, patlayıcı madde bulunan binalarda düşey yakalama çubuğunun bulunmadığı veya tehlikeli bölge dışında olduğu kontrol edilir.",
        maddeler: ["Çatı direği boyu ve çapı uygun mu? (Boy: 6-6,5 m Çap; 2”)", "Çatı direği üzerinde iletken tespit elemanları bulunmakta mıdır?",
          "Çatı direği çatı üzerine sağlam tutturulmuş mudur?", "İniş iletkenleri çatı direğine uygun olarak irtibatlandırılmış mıdır?"] },
      { ad: "E. Topraklama tesisi", std: "TS EN 62305-3 Madde 5.4.1",
        talimat: "İndirme iletkenlerinin topraklama elektrotlarına uygun tutturulduğu, koruma borusundan sonra zemin üzerinde olduğu ve topraklama hattının tesis edildiği kontrol edilir. Çatı direği çelik dübellerle bina betonuna bağlıysa topraklamanın bina ile eşpotansiyel olduğu denetlenir. Toprak iletkenleri en az bakır 50 mm², çelik 90 mm² olmalıdır.",
        maddeler: ["İndirme iletkenleri topraklama elektrotlarına uygun bir şekilde tutturulmuş mudur?", "İndirme iletkenleri koruma borusundan sonra zemin üzerinde midir?",
          "İndirme iletkenlerinde sürekliliğin sağlandığı görülüyor mu? (Hayır ise ölçüm sonucu kaç Ω dur ?)",
          "Topraklama hattı tesis edilmiş midir? Bina topraklaması ile eşpotansiyel midir?",
          ["Topraklama tesisi direnci 10 Ω'dan küçük müdür?", "Topraklama geçiş direnci tesisin şekline uygun yöntemle (çevrim empedansı, üç uçlu karşılaştırma veya pensli ölçüm) ölçülür; 10 Ω'dan küçükse uygundur. Toprak özgül direnci 3000 Ω.m'den yüksek topraklarda ek topraklama önerilebilir."],
          ["AG parafudru (DKD) kullanılmış ise, koordineli olarak kullanılmış mı? Kullanılmamışsa ana pano ve diğer tali panoları besleyen kablolar ekranlı mı?", "Kullanıldığı yere göre uygun dayanım akımı ve parafudr tipi kontrol edilir (TS EN 62561, TS EN 61643-11)."]] },
    ]) },
    { id: "faraday", ust: "Kontrol kriterleri ve testler", ad: "Faraday kafesi", blok: "liste", kilit: true, cevaplar: CEVAP, gruplar: gruplar("f", [
      { ad: "A. Çatıda / terasta ağ", std: YKS,
        talimat: "Çatıda veya terasta kurulan ağın standartta verilen kesitlere ve risk analizindeki genişliğe uygunluğu, varsa düşey yakalama çubukları kontrol edilir. Yanıcı, parlayıcı, patlayıcı madde bulunan binalarda düşey yakalama çubuğunun bulunmadığı veya tehlikeli bölge dışında olduğu denetlenir.",
        maddeler: ["Ağ iletkenlerinin kesitleri standarta uygun mudur?", "Ağ risk analizinde belirlenen genişlikte midir?", "Ağ’da varsa düşey yakalama çubukları uygun mudur?",
          "Özellikle yanıcı, parlayıcı, patlayıcı madde bulunan binalarda düşey yakalama çubuklarının bulunmadığı veya tehlikeli bölge dışında bulunduğu kontrol edilmelidir."] },
      { ad: "B. İndirme iletkenleri", std: YKS,
        talimat: "Ağ için bina çevresi boyunca en az 20 m'de 1 indirici gerekir. Betonarme donatı, çelik konstrüksiyon gibi doğal metal yapılar indirici olarak kullanılabilir; bunun için çatı ağı ile eşpotansiyel bara arasındaki süreklilik testinde Rc < 0,2 Ω olmalıdır. Eşpotansiyel oluşturulamayan binalarda kıvılcım aralığı hesabıyla S > d olduğu kontrol edilir.",
        maddeler: ["Yatay yakalama sistemi (ağ) için yeterli sayıda indiricilere bağlantı var mı? (en az 20 m’de 1 indirici)",
          "İndirme iletkenleri standarta uygun kesitte som bakır veya eşdeğer iletken mi?",
          "Doğal indirici metal yapılar kullanılmıyorsa indirme iletkenleri tespit kroşeleri kızıl döküm",
          "Doğal indirici metal yapılar kullanılmıyorsa indirme iletkenleri tespit kroşelerinde oksitlenme var mıdır?",
          "Doğal indirici metal yapılar kullanılmıyorsa indirme iletkenleri köşe \"S\" yapmakta mıdır?",
          "Doğal indirici metal yapılar kullanılmıyorsa indirme iletkenleri tespit kroşeleri arası mesafe ortalama 0,5-0,7 m"] },
      { ad: "C. Topraklama tesisi", std: "Elektrik Tesislerinde Topraklamalar Yönetmeliği Madde 25 · TS EN 62305-3 Madde 5.4.1",
        talimat: "Yıldırıma karşı koruma topraklamasına 2 m'den yakın başka topraklayıcılar varsa birbirine bağlandığı, 2–20 m arasındakilerin de bağlandığı, toprak özdirenci 500 Ω.m'den yüksekse 20 m'den uzaktakilerin de bağlandığı kontrol edilir. Doğal metal yapılar indirici olarak kullanıldıysa çatı ağının doğal bileşenlere bağlantı noktaları kontrol edilir. Topraklama geçiş direnci 10 Ω'dan küçükse uygundur.",
        maddeler: ["Yıldırıma karşı koruma topraklamalarına 20 m’den daha küçük mesafede başka topraklayıcılar bulunuyorsa, bütün topraklayıcılar birbirleriyle eşpotansiyel midir?",
          "Bina çatısına monte edilen düşey yakalama ucunun bağlı olduğu çatı direği, çelik dübellerle bina betonuna bağlandığından, topraklamasının bina ile eşpotansiyel midir?",
          "Doğal metal yapılar indirici olarak kullanıldıysa bu yapılar temel topraklamasına bağlı olduğundan çatı ağının doğal bileşenlere bağlantı noktaları kontrol edilir.",
          "Topraklama tesisi direnci 10 Ω'dan küçük müdür?"] },
      { ad: "D. İç yıldırımlık tesisi", std: "TS EN 62305-3 Madde 6 · TS EN 62561 · TS EN 61643-11",
        talimat: "Kullanıldığı yere göre uygun dayanım akımı ve parafudr tipi kontrol edilir.",
        maddeler: ["Ana dağıtım panosunda uygun parafudr tesis edilmiş mi?", "Parafudr tipi"] },
    ]) },
    ...resmiSon("Periyodik kontrol tarihi itibari ile yukarıda teknik özellikleri belirtilen Yıldırımdan Korunma Tesisatı muayenesi sonrasında mevcut şartlar altında kullanımı", [
      "Ağır kusurlar tanımı:",
      "1. Yıldırımdan Korunma sisteminin koruma yaptığı kapsama alanının aşağıdaki uygunsuzluğu;",
      "Yıldırım risk analizine göre hazırlanan yıldırımdan korunma kapsama alanı, binayı veya binaları kapsamıyorsa.",
      "2. ESE (Aktif-Radyoaktif) Paratoner Bölümünde yıldırımdan korunma tesisatındaki aşağıdaki fiziki uygunsuzlukları;",
      "a) Koruma Borusu İçindeki İletkenler PVC hortum içinde değilse,", "b) Koruma Borusu >250 cm değilse,",
      "c) İndirme iletkenleri 2x50 mm2 bakır veya eşdeğer iletken değilse,", "d) Topraklama hattı tesis edilmemesi ve bina topraklaması ile eşpotansiyel değilse,",
      "e) Topraklama tesis direnci 10 Ω’dan küçük değilse.",
      "3. Faraday Kafesi Bölümünde yıldırımdan korunma tesisatındaki aşağıdaki fiziki uygunsuzlukları;",
      "a) Çatıda ağ risk analizinde belirlenen genişlikten büyükse,",
      "b) Özellikle yanıcı, parlayıcı, patlayıcı madde bulunan binalarda tehlikeli bölge içinde düşey yakalama çubukları olmaması kuralı ihlal edildiyse,",
      "c) Topraklama tesis direnci 10 Ω’dan küçük değilse.",
    ].join("\n"), false),
  ],
};

/* ── ZPKR04 · YANGIN ALGILAMA VE UYARI SİSTEMİ ── */
const YANGIN = "TS CEN/TS 54-14 · Binaların Yangından Korunması Hakkında Yönetmelik";
const UDG = ["U", "UD", "UG"];
/** 5.2 tablosunun değerlendirme hücresi: Uygun (U) / Uygun değil (UD, kusur) / Uygulanmaz (UG) */
const udg = (id: string, ad: string, agir = false) => ({ id, ad, giris: "secim" as const, secenekler: UDG, olumsuz: ["UD"], agir, zorunlu: true });
const ZPKR04: FormatGirdisi = {
  sema: 1,
  gorunum: {
    formKodu: "ZPKR04", baslik: "Yangın Algılama ve Uyarı Sistemi Periyodik Kontrol Raporu",
    dayanak: ["TSE CEN/TS 54-14: Yangın Algılama ve Yangın Alarm Sistemleri - Bölüm 14: Planlama, Tasarım, Kurulum, Devreye Alma, Kullanım ve Bakım İçin Rehber",
      "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği", "Binaların Yangından Korunması Hakkında Yönetmelik", "Elektrik İç Tesisleri Yönetmeliği"],
    talimat: [
      "Rapor her yangın kontrol paneli bölgesi için ayrı düzenlenir; uygunsuzluklar fotoğrafla gösterilir.",
      "Hazırlık: sistem detay ve bina bilgileri kontrol edilir, tesise ait onaylı proje olup olmadığı sorulur. Tesiste panelin özelliklerini bilen deneyimli personel yoksa, testler sırasında bakım firmasından bir personelin bulunması işverenden istenir.",
      "Algılama, uyarı, acil aydınlatma ve yönlendirme sistemindeki BÜTÜN ekipmanlar (tüm dedektörler, tüm butonlar …) örnekleme yapılmadan test edilir ve 5.2 tablosuna projedeki kodu / tanımıyla işlenir.",
      "Duman dedektörleri duman spreyi veya test aparatıyla denenir; aparat yoksa kâğıt / bez yakılmaz, test yapılamadığı notlara yazılır. Isı dedektörleri test aparatı ya da fön cihazıyla, yangın uyarı butonları kendi üzerinden, sirenler Yönetmelik Md-81-(5) gözetilerek test edilir.",
      "Periyodik kontrol, projenin doğruluğunu kapsamaz; onaylı projeyi temel alır. Proje yoksa kontrol durum tespitidir.",
      BIRAKMA, PROJE_NOTU,
    ].join("\n"),
  },
  kurallar: DERECELI,
  bolumler: [
    firma(true),
    { id: "ekipman", ad: "Tesis bilgileri", blok: "bilgi", kilit: true, alanlar: kilitli([
      m("algilama", "Yangın algılama sistemi", ["Otomatik", "Manuel"]), m("calisma", "Sistem çalışma tipi", ["Adresli", "Konvansiyonel"]),
      m("neden", "Kontrol nedeni", NEDEN), m("panel_marka", "Kontrol paneli marka/model"), m("panel_seri", "Kontrol paneli seri no./imal yılı"),
      m("panel_yer", "Kontrol paneli yeri"), m("uyari", "Yangın uyarı sistemi", ["Işıklı", "Sesli", "Işık+Ses", "Anons", "Diğer"]),
      m("onay_kurum", "Proje onay kurumu"), m("onay_tarih", "Proje onay tarih ve sayısı"), m("ilk_kontrol", "İlk kontrol/devreye alma tarihi"),
      m("panel_gerilim", "Kontrol paneli çalışma gerilimi"), m("son_kontrol", "Son kontrol tarihi"),
      { id: "algilama_ek", ad: "Algılama ekipmanları", tur: "coklu", zorunlu: true, secenekler: ["Duman (optik) dedektörü", "Isı dedektörü", "İhbar butonu"] },
      { id: "uyari_ek", ad: "Uyarı ekipmanları", tur: "coklu", zorunlu: true, secenekler: ["Siren", "Flaşör"] },
      { id: "sondurme_ek", ad: "Söndürme ekipmanları", tur: "coklu", zorunlu: false, secenekler: ["Otomatik söndürme", "KKT Özellikli yangın tüpleri", "CO2 Özellikli yangın tüpleri", "Hidrantlar-Yangın dolapları"] },
      m("degisiklik", "Tesisatta kapsamlı değişiklik var mı?", ["Var", "Yok", "Belirlenemedi"]), m("etiket", "Bir önceki periyodik kontrol etiketi var mı?", VAR_YOK),
      m("bina_sinif", "Bina kullanma sınıfı", ["Konut", "Toplanma amaçlı bina", "Depolama amaçlı tesis", "Endüstriyel yapı", "Konaklama amaçlı bina", "Kurumsal bina",
        "Yüksek tehlikeli bina", "Büro binası", "Karışık kullanım amaçlı bina", "Ticari"]),
      m("tehlike_sinif", "Bina tehlike sınıfı", ["Düşük tehlike", "Orta tehlike", "Yüksek tehlike"]), m("tehlike_kat", "Tehlike kategorisi", ["1", "2", "3", "4"]),
      { id: "alan_m2", ad: "Bina toplam kullanım alanı", tur: "sayi", birim: "m²", zorunlu: true }, { id: "kat", ad: "Kat sayısı", tur: "sayi", zorunlu: true },
      { id: "yukseklik", ad: "Bina yüksekliği/Yapı yüksekliği", tur: "sayi", birim: "m", zorunlu: true }, m("izin_tarih", "Yapı kullanma izin tarihi"),
      { id: "bolum_sayi", ad: "Bölüm sayısı", tur: "sayi", zorunlu: true }, { ...m("diger", "Varsa diğer tespitler"), zorunlu: false },
    ], true) },
    { id: "test_deger", ad: "Test değerleri", blok: "bilgi", kilit: true, alanlar: kilitli([{ id: "test_metin", ad: "Test değerleri", tur: "metin" as const }], true) },
    { id: "cihaz", ad: "Ölçüm aletleri bilgileri", blok: "cihaz", kilit: true },
    { id: "gozle", ust: "Tespit ve değerlendirmeler", ad: "Gözle muayeneler ve belge kontrolleri", blok: "liste", kilit: true, cevaplar: CEVAP, gruplar: gruplar("y", [
      { ad: "Ön kontroller", std: YANGIN, maddeler: [
        ["Yetkili ve eğitimli personel var mı?", "Tesiste yangın algılama ve uyarı sistemini tanıyan, alarmda ne yapacağını bilen yetkili ve eğitimli kişi bulunmalıdır (Yönetmelik Md-129)."],
        ["Yangın güvenliği sorumluları belirlenmiş mi?", "Binanın her katı, bölümü veya tamamı için görevliler arasından yangın güvenliği sorumluları seçilmelidir (Md-125)."],
        ["Yangın alarm panelinin durumu (ekran-tuşlar-LED’ler)", "Önce binada otomatik algılama ve uyarı sistemi zorunluluğu Yönetmelik Ek-7 tablosuna göre tespit edilir; gerekiyorsa panelin durumu, ekranı, tuşları gözle kontrol edilir (Md-75)."],
        ["Acil durum anons sistemi mevcudiyeti", "Acil durum anons sisteminin gerekliliği Yönetmelik Md-81-(7)'ye göre belirlenir."],
        ["Bakım/servis kayıtları tutuluyor mu?", "Sistemin bakımı belirli periyotlarla düzenli yapılmalı ve kayıtları tutulmalıdır (Md-84)."],
        ["Sistem kütüğü belgesi var mı?", "Sistem kütüğü tutulmalı; sistemden kaynaklanan veya sistemi etkileyen bütün olaylar kaydedilmelidir."],
      ] },
      { ad: "Yangın algılama ve yangın uyarı sistemi ve tesisatı", std: YANGIN, maddeler: [
        ["Kontrol paneli ve varsa tekrarlayıcı panellerin yerleşim durumu", "Ana kontrol paneli ve varsa tekrarlayıcı paneller rahatça görülebilecek yerlere yerleştirilmelidir."],
        ["Kontrol paneli sürekli izlenebilir durumda mı?", "Yangın kontrol panelleri sürekli izlenebilecek durumda olmalıdır."],
        ["Dedektör ve/veya buton adreslemesi veya yerleşim haritası var mı?", "Dedektör ve uyarı butonları adreslenerek onaylı projeye uygun bir plan üzerinde gösterilmeli; sonradan yapılan ilave ve tadilatlar plana işlenmelidir."],
        ["Asma tavan, yükseltilmiş döşeme vb. içinde kalan dedektörlerin uyarılarının görülebilmesi için paralel ihbar lambaları var mı?", "Görülemeyen hacimlerdeki dedektörler için rahatça görülebilecek yerlere paralel uyarı lambaları tesis edilmelidir."],
        ["Çevrimlerde kısa devre ve açık devre koruması", "Her çevrimde kısa devre ve açık devre koruması olmalı; bu hatalar panel üzerindeki sinyal lambalarıyla uyarılmalıdır."],
        ["Güvenlik devre ayrılması (Bant-I, Bant-II’den ayırma/yalıtım)", "CCTV, yangın algılama ve uyarı gibi sistem kabloları Bant I (zayıf akım) ve Bant II (kuvvetli akım) kablolarından ayrı yollardan çekilmeli ya da aralarında separatör olmalıdır (TS HD 60364-5-52, Md-83-(4))."],
        ["Kullanma talimatı var mı?", "Panel ve tekrarlayıcı panellerin üretici kullanma talimatı, yangın güvenliği personelinin her an ulaşabileceği yerde bulunmalıdır."],
        ["Akü kapasitesi, gerilimi ve fiziki durumu", "Akü kapasitesi kontrol edilir; panelde akü test butonu varsa gerilim butonla, yoksa ölçü aletiyle ölçülür. Akü gerilimi düşükse ağır kusurdur."],
        "Dedektörlerin çalışma ortamına uyumu ve yeterli olması",
        "Sesli-siren/ışıklı-flaşör uyarılarının yerleşim durumu ve yeterli olması",
        ["Yangın alarm ve uyarı kablolarının uygunluğu", "Kablolar TSE standartlarına uygun, halojenden arındırılmış ve yangına en az 60 dakika dayanıklı tipte olmalıdır."],
      ] },
      { ad: "Acil durum aydınlatma ve acil durum yönlendirme sistemi", std: `${YANGIN} Md-71, Md-72 · TS EN 12464-1`,
        talimat: "Kaçış yolları, asansör holleri, toplanma alanları, yürüyen merdivenler, elektrik / jeneratör odaları, pompa istasyonları, kapalı otoparklar, ilk yardım ve emniyet ekipmanı yerlerinde normal aydınlatma kesilince en az 60 dakika yanacak acil aydınlatma olmalıdır. Kaçış yolları ve çıkış hollerinde aydınlık seviyesi yetersizse ağır kusurdur.",
        maddeler: ["Acil durum aydınlatma armatürleri uygunluğu", "Acil durum aydınlatma sistemi varlığı, yeterliliği-diğer gerekli alanlar",
          "Kaçış yollarında acil durum yönlendirme işaretleri varlığı, yeterliliği", "Acil durum aydınlatma ünitelerinin aydınlatma seviyelerinin uygunluğu",
          "Acil durum aydınlatma sistemi varlığı, yeterliliği-panel önü (lux değeri TS EN 12464’e göre)", "Acil çıkış hollerinde acil durum yönlendirme işaretleri varlığı, yeterliliği",
          "Acil durum aydınlatma ünitelerinin aydınlatma sürelerinin uygunluğu", "Acil durum aydınlatması ve yönlendirmesi elektrik kesildiğinde otomatik devreye girmesi"] },
      { ad: "Yangın anında diğer mekanik, elektrik ve elektronik sistemlerle entegrasyon", std: YANGIN, maddeler: [
        ["Duman damperleri açık/kapalı konum bilgilerinin doğrudan çevrimlere bağlı kontak izleme cihazlar ile izlenebilirliği", "Duman kontrol sistemlerinin açık / kapalı konum bilgileri kolayca izlenebilir olmalıdır."],
        ["Yangın alarm sisteminin diğer otomatik söndürme sistemleri ile entegre olma durumu", "Yangın alarm sistemi, binada otomatik söndürme varsa onu harekete geçirecek sinyali vermelidir."],
        ["Yangın algılama ve uyarı sisteminin bina otomasyon sistemi ile bağlantı ve haberleşme kontrolü", "Yangın alarm sistemi yangın anında bina otomasyon sistemiyle haberleşebilmelidir."],
        ["Asansörlerin yangın anında davranışları kontrolü", "Yüksek binalarda ve topluma açık yapılarda asansörler yangın uyarısında kapı açmadan acil çıkış katına dönüp kapıları açık beklemelidir; panel üzerinden kontrol edilir."],
        ["Yangın anında elektrik tesisatında kesicilerin çalışıp çalışmadığı, enerjisi kesilmemesi gereken bölümlerin yedek enerji kaynaklarının bulunup bulunmadığı ve devreye otomatik girip girmediği", "Normal elektrik tesisatının yangın anında ek risk yaratmadığı; kesicilerin çalıştığı, enerjisi kesilmemesi gereken bölümlerin yedek kaynağı olduğu ve otomatik devreye girdiği değerlendirilir."],
        "Geçiş kontrol sistemleri uygunluğu (döner kapı, turnike, acil çıkış kapıları)",
        ["İklimlendirme/havalandırma sistemi ve duman egzoz sistemi sinyal kontrolü", "İklimlendirme, havalandırma ve duman egzoz sistemi sinyalleri kontrol edilir."],
        ["Yangın söndürme sistemi akış anahtarları, hat kesme vanaları, yangın pompaları çalışma fonksiyonları konum bilgisi izlenebilirliği", "Konum bilgileri panel üzerinde izlenebilmelidir."],
        "Yangın anında asansör kuyuları ve yangın merdiveni kovaları basınçlandırma sistemi kontrolleri",
        "Yangın bölme kapıları elektromanyetik tutucuları kontrolü",
        "Yangın anında patlayıcı gaz dağıtım sistemlerinin kontrolü",
      ] },
    ]) },
    { id: "cihaz_test", ust: "Tespit ve değerlendirmeler", ad: "Yangın algılama ve uyarı cihazları kontrolü ve testler (örnekleme yapılmadan tüm ekipmanlar)", blok: "olcum",
      kilit: true, satir: "ekle", enAz: 1, sutunlar: [
        { id: "kod", ad: "Tanım/Kod", giris: "metin", zorunlu: true }, { id: "bolum", ad: "Bölüm adı/tanımı", giris: "metin" },
        { id: "ekipman_adi", ad: "Ekipman adı/adedi", giris: "metin", zorunlu: true },
        udg("proje", "Projede gösterilen yerde mi?"), udg("erisim", "Erişim durumu"), udg("montaj", "Montaj durumu"), udg("test", "Test", true),
        udg("sesli", "Sesli uyarı yeterli mi?", true), udg("isikli", "Işıklı uyarı yeterli mi?"), udg("adres", "Adresleme doğru mu?"),
      ] },
    ...resmiSon("Periyodik kontrol tarihi itibariyle yukarıda teknik özellikleri belirtilen Yangın Algılama ve Uyarı Sisteminin periyodik muayenesi sonrasında mevcut şartlar altında kullanımı 1 yıl süreyle", [
      "Tespit edilen hafif kusurların bir sonraki periyodik kontrol tarihine kadar giderilmesi gereklidir. (Bu not, sadece hafif kusur tespit edilmesi durumunda yazılacaktır.)",
      "Ağır kusurlar tanımı: a) Dedektörler, Yangın uyarı butonları ve sirenlerin test sonuçları yetersiz ise, b) Yangın paneli gelen uyarıları algılamıyorsa, c) Kaçış yolları ve çıkış hollerinde acil aydınlatma düzenleri ve aydınlık seviyesi yetersiz ise, d) Akü gerilimi düşükse, Ağır kusur olarak değerlendirilmelidir.",
      "AÇIKLAMALAR:",
      "1) Kontrol talep eden firmadan, kontrole gitmeden önce “Duman Dedektörü Test Aparatı” sağlaması istenir. Böyle bir aparat işyerinde mevcutsa duman dedektörlerinin testleri yapılır. Aksi takdirde, tehlikeli olacağından kâğıt veya bez yakarak test yapılmaz. Bu nedenle veya herhangi bir başka nedenle test yapılamamışsa notlar bölümünde belirtilir.",
      "2) Isı dedektörlerinin kontrolü ”Isı Dedektörü Test Aparatı” ile yapılır. İşyerinde böyle bir aparat yok ise bu testler fön cihazları ile yapılabilir.",
      "3) Yangın uyarı butonlarının testleri kendi üzerinden yapılır.",
      "4) Siren testleri “Binaların Yangından Korunması Hakkında Yönetmelik” Md.81-(5) hükümleri gözetilerek yapılmalıdır.",
      "5) Periyodik kontrol, yangın algılama ve uyarı sistemi projesinin doğruluğunu kapsamaz. Onaylı projeyi temel alır. Proje bulunmaması durumunda yapılan kontrol durum tespitine yöneliktir. Yapılan tespitlerin uygunluğu proje ihtiyacını ortadan kaldırmaz.",
    ].join("\n"), true),
  ],
};

/* ── ZPKR05 · TRAFO (1–36 kV) ── */
const KUVVETLI = "Elektrik Kuvvetli Akım Tesisleri Yönetmeliği";
const ZPKR05: FormatGirdisi = {
  sema: 1,
  gorunum: {
    formKodu: "ZPKR05", baslik: "Trafo Periyodik Kontrol Raporu",
    dayanak: ["İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği", "Elektrik Tesislerinde Topraklamalar Yönetmeliği", "Elektrik Kuvvetli Akım Tesisleri Yönetmeliği"],
    talimat: [
      "Rapor her ekipman (trafo, kesici, hücre) için ayrı düzenlenir; uygunsuzluklar fotoğrafla gösterilebilir.",
      "Ölçüm, trafo işletme sorumlusunun bilgisi ve refakatinde yapılır; elektromanyetik etkileşimin çok olduğu alanlarda enerjisiz ölçülür. Koruma topraklaması YG hücrelerini dolaşan şerit lamadan, işletme topraklaması ana dağıtım panosunun ana nötr barasından ölçülür.",
      "Koruma iletkeni kesitinin uygunluğu toprak kısa devre akımına göre belirlenir (ETTY Ek-C).",
      "Ayrık düzen: tE kesicinin mevcut açma ayarından, UTP bu süreye göre ETTY Şekil 6'dan alınır; IE, 154 kV / 34,5 kV trafonun sekonderindeki RN direncine göre hesaplanır; UE = IE · RE. UE < 2·UTP ise uygun; UE < 4·UTP ise ETTY Ek-M önlemleri kontrol edilerek uygun. Ek önlemlerde aynı sınamalar USTP ile yapılır.",
      "Birleşik düzen: AG tarafı TN ve PEN tek noktada topraklı ise UE < UTP; çok noktada topraklı ise UE < 2·UTP; AG tarafı TT ise U2 = UE + 0,23 kV < 1,2 kV.",
      "Isınma ve bağlantı noktaları termal kamerayla kontrol edilir. Korozyon, kopma, kesit sorunları notlara yazılır, öneride bulunulur.",
      BIRAKMA, PROJE_NOTU,
    ].join("\n"),
  },
  kurallar: DERECELI,
  bolumler: [
    firma(true),
    { id: "ekipman", ad: "Ekipman bilgileri", blok: "bilgi", kilit: true, alanlar: kilitli([
      m("kurulus", "Enerji sağlayan kuruluş"), m("sebeke", "Şebeke tipi", SEBEKE6), m("gerilim", "Şebeke gerilimi"), m("proje", "Tesise ait proje var mı?", VAR_YOK),
      m("tekhat", "Tek hat şeması var mı?", VAR_YOK), m("neden", "Kontrol nedeni", NEDEN), m("topraklayici", "Topraklayıcı tipi", TOPRAKLAYICI), m("yapi", "Yapı cinsi", YAPI),
      m("amac", "Ekipmanın kullanım amacı"), m("son_kontrol", "Son kontrol tarihi"),
      m("kurulum", "Kurulum şekli", ["Direk", "Beton Köşk", "Bina", "Bina İçi", "Bina Altı", "Sac Köşk"]),
      m("guc", "Güç (kVA)"), m("primer", "Gerilim Primer/Sekonder (kV)"), m("imalat", "İmalat yılı"), m("seri", "Seri no."),
      m("baglanti", "Bağlantı grubu", ["DYN11", "DYN5"]), m("hucre", "Hücre bilgileri", ["Açık tip", "MMMH-Hava", "MMMH-Gaz"]),
      m("tipi", "Tipi", ["Kuru", "Hermetik", "Genleşme Depolu"]), m("hava", "Hava durumu ve sıcaklığı"), m("zemin", "Zemin nem durumu"),
      m("degisiklik", "Tesisatta kapsamlı değişiklik var mı (>%20)", VAR_YOK),
      m("yg_sebeke", "Yüksek gerilim şebeke tipi", ["Yıldız noktası, değeri düşük bir empedans üzerinden topraklanmış şebeke", "Yıldız noktası yalıtılmış şebeke",
        "Toprak teması kompanze edilmiş (rezonans topraklı) şebeke"]),
      m("yg_sorumlu", "Yetkilendirilmiş YG işletme sorumlusu ve onay bilgileri"),
    ], true) },
    { id: "cihaz", ad: "Ölçüm aletleri bilgileri", blok: "cihaz", kilit: true },
    { id: "gozle", ust: "Gözle kontrol kriterleri", ad: "Gözle kontrol", blok: "liste", kilit: true, cevaplar: CEVAP, gruplar: gruplar("t", [
      { ad: "Genel kontroller", std: `${KUVVETLI} · İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği`,
        talimat: "Ölüm tehlikesi / uyarı levhaları açıkça görülebilir olmalı; güç akımı cihazları, ölçü trafoları, ölçü aletleri ve sigortalar üzerinde silinmez, görünür işaretler bulunmalıdır. Metal gövdeli tüm yüksek akım ekipmanları ve koruyucu muhafazalar topraklama iletkenlerine bağlanmalıdır. Aktif bölümler kazara dokunmayı önleyecek şekilde erişilemez olmalı, güvenlik mesafeleri sağlanmalıdır. YG hücreleri ve AG pano odaları en az 250 lux, trafo odaları en az 150 lux aydınlatılmalı; bütün bölmelerde akülü acil aydınlatma olmalıdır.",
        maddeler: ["Hücre kapısı ölüm tehlikesi / Uyarı levhası/Plastik zincir kontrolü", "Kilitlerin ve kilit asma kulağının kontrolü", "Bina içi-dışı tel fenslerin kontrolü",
          "Hücre Kapı, pencere ve diğer aksamlarının topraklama tesisi ile irtibatı kontrolü", "Hücrenin temel ve duvarlarında çatlak, çökme, nem, sıva, badana yönünden kontrolü",
          "Kapı, pencere, havalandırma ve sinekliklerin kontrolü", "Binanın su alıp almadığının kontrolü", "Binanın içinde-dışında zeminindeki açıkta kabloların bulunmamasının kontrolü",
          "Hücre metal yapıları boya ihtiyacı yönünden kontrolü", "Çevre temizliğinin kontrolü", "Yüksek gerilim kablo montajı kontrolü", "Alçak gerilim kablo montajı kontrolü",
          "AG-YG baraların kontrolü", "Gövdenin infrared termal kamera ile kontrolü", "Trafo üstü elektriksel malzemelerin infrared termal kamera ile kontrolü",
          "Yüksek gerilim ve alçak gerilim bağlantıları infrared termal kamera ile kontrolü", "Gövde topraklama bağlantısı kontrolü (Eksik, çürüme, deformasyon, bozulma)",
          "İşletme topraklaması bağlantısı kontrolü (Eksik, çürüme, deformasyon, bozulma)", "Parafudur kontrolü (Eksik, çürüme, deformasyon, bozulma)",
          "Bina içi AC/DC aydınlatmalar kontrolü", "Manevra, iş güvenliği talimatı ve tek hat şemasının kontrolü", "Dokunma alanında enerjili kısım bulunmamasının kontrolü",
          "Sinyal lambalarının kontrolü", "Akü, redresör grubu kontrolü",
          "Topraklama iletkenleri, koruma iletkenleri, işletme topraklaması iletkeni, varsa potansiyel dengeleme iletkenleri mekanik dayanım ve korozyon kontrolü",
          "Isıl bakımdan en yüksek hata akımına dayanıklılık", "Pano içi ısıtma sistemleri kontrolü",
          "En yüksek toprak hata akımında, topraklama tesislerinde ortaya çıkabilecek gerilimlere karşı canlıların güvenliğinin sağlanması (dolaylı dokunmaya karşı koruma)",
          "Transformatör Odası içerisinde tertip ve düzen ile mevzuatta depolanması yasaklanan malzemelerin bu bölümde varlığının kontrolü",
          "Transformatör tipine göre yangın söndürme ve algılama önlemlerinin durumu ve uygunluğu", "Transformatör ve varsa enerji nakil hatlarına güvenlik mesafelerinin kontrolü",
          "Yağlı transformatörlerde yağ çukurunun uygunluğu"] },
      { ad: "Trafo anahtarlamalı hücre kontrolleri", std: `${KUVVETLI} Madde 19, 38, 39`,
        talimat: "Aşırı yük koruma röleleri sekonder tarafta kurulmalı; AG fider çıkışlarında yük ayırma kabiliyetli koruyucu bulunmalıdır. Her dağıtım trafosunun AG çıkışında termik-manyetik devre kesici olmalıdır. Enerji ölçümü için akım trafoları Sınıf 0.5, gerilim trafoları Sınıf 1; koruma için en az Sınıf 3.",
        maddeler: ["Kapı ölüm tehlikesi/Uyarı levhası/Plastik zincir durumu kontrolü", "Kapının topraklama tesisi ile irtibatı kontrolü",
          "Temel ve duvarların çatlak, çökme, nem, sıva, badana yönünden kontrolü", "Metal yapıların boya ihtiyacı yönünden kontrolü",
          "Giriş-Çıkış-Ölçü-Tr Koruma modüler hücre gövdesi ve kapağında korozyon kontrolü", "Giriş-Çıkış-Ölçü-Tr Koruma modüler hücre birbirine ve zemine sabitlenme kontrolü",
          "İndikatörlerin çalışma kontrolü", "YG Sigortalı koruma ise sigortanın yönü ve tel sarılmadığının kontrolü", "YG Sigortalı koruma ise sigortanın uygunluğu kontrolü",
          "Gazlı hücre ise gaz basıncı ve ikaz lambaları kontrolü", "Üst, bağlantı ve çevresinin temizliği kontrolü", "Yüksek gerilim kablo/Bara montajı kontrolü",
          "Yüksek gerilim bağlantı infrared termal kamera ile kontrolü", "Ölçü trafoları infrared termal kamera ile kontrolü", "Koruma rölelerinin uygun değer kontrolü", "Mühürlerin kontrolü"] },
      { ad: "Trafo bölümü", std: `${KUVVETLI} Madde 37, 40`,
        talimat: "Yağ seviye göstergesi zorunludur (genellikle 25 °C referansla işaretli); yağ seviyesi radyatör girişinin üzerinde tutulur. Sıcaklık göstergeleri kadranlı, alarm / açma için kontaklı olmalıdır. 500–750 kVA üzeri yağlı trafolarda Buchholz rölesi zorunludur. İç basınca karşı basınç tahliye valfi gerekir; trafolar yeterli havalandırmaya sahip olmalıdır.",
        maddeler: ["Kapı ölüm tehlikesi/Uyarı levhası/Plastik zincir durumu kontrolü", "Trafo gövdesinde eksik çürüme ve deformasyon olmadığının kontrolü",
          "Trafo tankında yağ sızıntısı olmadığının kontrolü", "Buşinglerde eksik çürüme ve deformasyon olmadığının kontrolü",
          "Ark boynuzlarında eksik çürüme ve deformasyon olmadığının kontrolü", "Trafo yağ seviyesi uygunluğu kontrolü", "Trafo silikajel uygunluğu kontrolü",
          "Trafo 630 kVA ve üzeri ise zati korumalar kontrolü", "Bucholz rölesinin kontrolü", "Hermetik rölesinin kontrolü", "Sıcaklık, ihbar rölesinin kontrolü"] },
      { ad: "İş güvenliği ve koruyucu malzemelerin kontrolü", std: "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği Madde 9 · Elektrik Kuvvetli Akım Tesisleri Yönetmeliği Madde 26",
        talimat: "İstanka, izole sehpa, izole halı ve eldivenler çalışma gerilimine uygun sınıfta olmalı, hasarsız bulunmalı ve periyodik olarak elektriksel testten geçirilmelidir.",
        maddeler: ["İstanka", "İzole Sehpa", "İzole Halı", "Eldiven"] },
    ]) },
    { id: "topraklama", ust: "Gözle kontrol kriterleri", ad: "Trafo işletme ve koruma topraklamaları", blok: "test", kilit: true, degerler: [
      { id: "duzen", ad: "Topraklama düzeni", secenekler: ["1- İşletme ve koruma topraklaması ayrık", "2.1- Birleşik · AG tarafı TN, PEN tek noktada",
        "2.2- Birleşik · AG tarafı TN, PEN çok noktada", "2.3- Birleşik · AG tarafı TT"], kilit: true },
      { id: "rb", ad: "Trafo işletme topraklaması Rb", birim: "Ω", op: "<", sinir: 2, agir: true, zorunlu: false, not: "ayrık düzende", kilit: true },
      { id: "re", ad: "Trafo koruma topraklaması RE", birim: "Ω", zorunlu: false, not: "ayrık düzende", kilit: true },
      { id: "rbe", ad: "Birleşik trafo topraklaması RbE", birim: "Ω", zorunlu: false, not: "birleşik düzende", kilit: true },
      { id: "ztoplam", ad: "Toprak kısa devresi çevrimindeki direnç ve empedansların toplamı Ztoplam", birim: "Ω", zorunlu: false, kilit: true },
      { id: "rn", ad: "154 kV beslemedeki mevcut nötr direnci RN", birim: "Ω", zorunlu: false, kilit: true },
      { id: "ie", ad: "Toprak kısa devre akımı IE", birim: "kA", kilit: true }, { id: "te", ad: "Toprak kısa devre trip zamanı tE", birim: "s", kilit: true },
      { id: "utp", ad: "Dokunma gerilimi UTP", birim: "kV", kilit: true }, { id: "ustp", ad: "Dokunma gerilimi (ek önlem) USTP", birim: "kV", zorunlu: false, kilit: true },
      { id: "ue", ad: "Topraklama gerilimi UE = IE · RE (birleşikte IE · RbE)", birim: "kV", kilit: true },
      { id: "u2", ad: "Zorlanma gerilimi U2 = UE + 0,23 kV", birim: "kV", op: "<", sinir: 1.2, agir: true, zorunlu: false, not: "AG tarafı TT", kilit: true },
      { id: "deger_not", ad: "Değerlendirme", secenekler: ["Not 1: Uygun", "Not 2: Yetersiz"], olumsuz: ["Not 2: Yetersiz"], agir: true, kilit: true },
    ] },
    ...resmiSon("Periyodik kontrol tarihi itibari ile yukarıda teknik özellikleri belirtilen Topraklama Tesisatı muayenesi sonrasında mevcut şartlar altında kullanımı", [
      "1. Trafo işletme ve koruma topraklamalarının ayrık olması durumunda RB işletme topraklamasının aşağıdaki uygunsuzluğu;", "RB< 2 Ω değilse",
      "2. Trafo işletme ve koruma topraklamalarının ayrık olması durumunda RE koruma topraklamasına göre hesaplanan UE topraklama geriliminin aşağıdaki uygunsuzluğu;",
      "a) UE<2UTP değilse veya", "b) UE<4UTP (ETTY M önlemleri ile) değilse veya", "c) UE<2USTP değilse veya", "d) UE<4USTP (ETTY M önlemleri ile) değilse",
      "3. Trafo işletme ve koruma topraklamalarının birleşik olması durumunda RE birleşik trafo topraklamasına göre hesaplanan UE topraklama geriliminin aşağıdaki uygunsuzluğu;",
      "a) AG tarafı TN ve PEN tek noktada topraklı ise UE<UTP değilse veya", "b) AG tarafı TN ve PEN çok noktada topraklı ise UE<2UTP değilse veya",
      "c) AG tarafı TT ise U2=UE+0,23<1,2 kV değilse",
      "Dokunma gerilimi UT, UTP ve koruma iletkenlerinin kesiti Elektrik Tesislerinde Topraklamalar Yönetmeliğinin ilgili maddelerine göre düzenlenmiştir.",
      "Not 1: Uygun", "Not 2: Yetersiz.",
    ].join("\n"), false),
  ],
};

/** kitaplık: anahtar → { ad, tanım } (tanım şemadan geçmiş; bozuk şablon yüklemede düşer) */
export const SABLONLAR: Readonly<Record<string, { ad: string; tanim: FormatTanimi }>> = Object.freeze({
  ZPKR01: { ad: "AG topraklama (ZPKR01, Bakanlık)", tanim: FormatTanimi.parse(ZPKR01) },
  ZPKR02: { ad: "Elektrik iç tesisatı (ZPKR02, Bakanlık)", tanim: FormatTanimi.parse(ZPKR02) },
  ZPKR03: { ad: "Yıldırımdan korunma tesisatı (ZPKR03, Bakanlık)", tanim: FormatTanimi.parse(ZPKR03) },
  ZPKR04: { ad: "Yangın algılama ve uyarı sistemi (ZPKR04, Bakanlık)", tanim: FormatTanimi.parse(ZPKR04) },
  ZPKR05: { ad: "Trafo (ZPKR05, Bakanlık)", tanim: FormatTanimi.parse(ZPKR05) },
  KOMPRESOR: { ad: "Kompresör (genel)", tanim: FormatTanimi.parse(KOMPRESOR) },
});
