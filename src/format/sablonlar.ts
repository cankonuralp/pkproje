/* HAZIR ŞABLONLAR — probata kitaplığı (RAPOR-FORMAT.md §4.1, §8): firma kopyalar, değiştirir, yayınlar. Bakanlık formatlı beş tür (ZPKR01 AG
   topraklama, ZPKR02 elektrik iç tesisatı; 427: ZPKR03 yıldırımdan korunma, ZPKR04 yangın algılama, ZPKR05 trafo) ve bir genel tür (kompresör). Bölüm, alan, seçenek ve kriter yazımları Bakanlık PDF'lerinden birebir
   (maket maket-veri.js MV.FORMAT_YAPI, 2026-09-27/28 — reisim: "birebir aynı pdf çıktısı olmalı"). Bakanlık formatlı şablonda zorunlu öğeler
   KİLİTLİ: silinemez (yayın denetimi), yalnız sırası / görünümü değişir. Örnek değer YOK (AA11: formlar boş açılır). */
import { EKIPMAN_ALAN_ADI, EKIPMAN_ALANLARI, FormatTanimi, type FormatGirdisi } from "./tanim.ts";

const VAR_YOK = ["Var", "Yok"], NEDEN = ["Periyodik Kontrol", "İlk Kontrol"], YAPI = ["Ev", "Ticari", "Endüstri", "Diğer"];
const SEBEKE = ["TT", "IT", "TN-CS", "TN-C", "TN-S"], TOPRAKLAYICI = ["Ring", "Yüzeysel", "Temel", "Derin", "Belirlenemedi"];
const EGRI = ["B", "C", "D"];
const CEVAP = ["Uygun", "Uygun değil", "Uygulanamaz"];

type AlanG = { id: string; ad: string; tur: "metin" | "sayi" | "tarih" | "secim" | "coklu" | "evet"; secenekler?: string[]; birim?: string; zorunlu?: boolean };
const kilitli = <T extends object>(l: T[], kilit: boolean) => l.map((x) => ({ ...x, kilit }));
const m = (id: string, ad: string, secenekler?: string[]): AlanG => ({ id, ad, tur: secenekler ? "secim" : "metin", secenekler, zorunlu: true });
/** 460: tam ekipman bölümünün ekipman kaydına bağlı alanları (marka, model, seri no, imal yılı, kullanım yeri, kullanım amacı, ekipman bölümü) —
    Format kurucuda adı değişir, çıkarılır; değeri raporun ekipman bilgisinde */
const bagliAlanlar = () => EKIPMAN_ALANLARI.map((k) => ({ id: `e_${k}`, ad: EKIPMAN_ALAN_ADI[k], tur: "metin" as const, ekipman: k }));

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

/** kitaplıktaki şablon: ad, tanım (şemadan geçmiş; bozuk şablon yüklemede düşer), Bakanlık formatı mı, kriter belgesi (src/tanim/kriterler.ts) ve
    436: "Tür olarak ekle"nin önerdiği ekipman türü (ad, 2–3 harf kod, Ek-III grubu, periyot ay) — firma pencerede değiştirir */
/* ── MEKANİK (467; reisim 2026-10-09: "mekanik tarafındaki zorunlu formatlar hala yok, kule vinç vb.") ──────────────────────────────────────────
   Bakanlığın zorunlu mekanik belgeleri (isekipmanlari.csgb.gov.tr › Dokümanlar, 2026-10-09'da indirildi): ZPKR06 kule kren (yürürlük 01.01.2026),
   ZPKR07 asılı erişim donanımı (01.02.2026), ZPMR01 LPG tankı periyodik muayene ve ZYDR01 LPG tankı yeterliliğin yeniden değerlendirilmesi
   (18.07.2025). Bölüm, alan ve kriter adları formlardan birebir; her kriterin ünlem talimatı Bakanlığın kriter belgesindeki içerik (** ağır,
   * hafif kusur) — ZPKK06 / ZPKK07 / ZPMK01 / ZYDK01, metinden ayrıştırıldı. Ekipman bölümü "tam" (460): marka / model / seri / imal yılı / kullanım
   yeri formdaki adıyla ekipman kaydına bağlı. Formdaki alt başlıklar (2.1 etiket, 2.2 tespit …) tek ekipman bölümünde sırasıyla; testlerin
   tarihleri ve test bilgileri "Test değerleri"nde; LPG'nin 1.1 yazılı plan bilgileri ve 2.3 fotoğrafları numarasız bölüm (resmî numaralar
   kaymaz). Formun sabit notları ve dipnotları sonuç açıklamasında. */
const IS_EKIPMAN = "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği";
const KUSUR_ATIF = "Kusur, kriter belgesindeki madde numarası ve tanımıyla yazılır (ör. “12.2 - ** Halatta/halatlarda deformasyon yoktur.” + kusurun yeri, nedeni); tanımların dışına çıkılmaz. * hafif, ** ağır kusurdur.";
const HAFIF_SONRAKI = "Tespit edilen hafif kusurların bir sonraki periyodik kontrol tarihine kadar giderilmesi gereklidir. (Sadece hafif kusur tespit edilmesi durumunda yazılacaktır.)";
/** sayı alanı (isteğe bağlı) · tarih alanı (isteğe bağlı) · ekipman kaydına bağlı alan (460) — kilitli Bakanlık öğesi */
const say = (id: string, ad: string) => ({ id, ad, tur: "sayi" as const, zorunlu: false, kilit: true });
const yaz = (id: string, ad: string) => ({ id, ad, tur: "metin" as const, zorunlu: false, kilit: true });
const gun = (id: string, ad: string) => ({ id, ad, tur: "tarih" as const, zorunlu: false, kilit: true });
const sec = (id: string, ad: string, secenekler: string[]) => ({ id, ad, tur: "secim" as const, secenekler, zorunlu: true, kilit: true });
const bagli = (id: string, ad: string, ekipman: "marka" | "model" | "seri" | "imal" | "konum") => ({ id, ad, tur: "metin" as const, ekipman, kilit: true });
/** kriter / test listesi (formdaki numaralarla) */
type MaddeT = { id: string; metin: string; std?: string; talimat?: string; kilit: boolean };
const liste = (id: string, ad: string, gruplar: { id: string; ad: string; maddeler: MaddeT[] }[]) =>
  ({ id, ad, blok: "liste" as const, kilit: true, cevaplar: CEVAP, gruplar });
/** son bölümler: 6 kusur · (foto) · 7 notlar · 8 sonuç (+ formun sabit metni) · 9 yetkili kişi */
const mekanikSon = (cumle: string, aciklama: string, foto: boolean) => [
  { id: "kusur", ad: "Kusur açıklamaları", blok: "kusur" as const, kilit: true },
  ...(foto ? [{ id: "foto", ad: "Fotoğraflar", blok: "foto" as const, numarasiz: true, enAz: 1, enCok: 20 }] : []),
  { id: "yorum", ad: "Notlar", blok: "not" as const, kilit: true },
  { id: "sonuc", ad: "Sonuç ve kanaat", blok: "sonuc" as const, kilit: true, cumle, aciklama },
  { id: "imza", ad: "Periyodik kontrolleri yapmaya yetkili kişi bilgileri ve onay", blok: "imza" as const, kilit: true, imzalar: ["uzman" as const, "teknik" as const] },
];

/* ── ZPKR06 · KULE KREN ── */
const ZPKR06: FormatGirdisi = {
  sema: 1,
  gorunum: {
    formKodu: "ZPKR06", baslik: "Kule Kren Periyodik Kontrol Raporu", dayanak: [IS_EKIPMAN],
    talimat: [
      "Kule kren, kriter tablosundaki içerikle kontrol edilir (ZPKK06; açıklamalar AA03). " + KUSUR_ATIF,
      "Hafif kusurlar bir sonraki periyodik kontrol başlangıç tarihine kadar giderilir (Ek-III 1.9.1); işveren giderildiğini gösteren belgeyi o tarihte sunar.",
      "Bir sonraki periyodik kontrol başlangıç tarihi: başlangıç tarihi + işverenin Ek-III 1.4 ve 1.10'a göre belirlediği aralık.",
      "Yükseklik, kapasite veya konum değişirse önceki raporun süresine bakılmaksızın kullanıma almadan önce bütün kontroller yeniden yapılır.",
      BIRAKMA,
    ].join("\n"),
  },
  kurallar: DERECELI,
  bolumler: [
    firma(true),
    { id: "ekipman", ad: "Ekipman bilgileri", blok: "bilgi", kilit: true, tam: true, alanlar: [
      sec("tip", "Ekipman türü", ["Sabit kurulu", "Kendinden kurulan", "Yürür"]), bagli("e_marka", "Markası/Modeli", "marka"), bagli("e_imal", "İmal yılı", "imal"),
      say("kapasite", "Kaldırma kapasitesi (kg)"), bagli("e_seri", "Seri no", "seri"),
      say("yukseklik", "Kaldırma yüksekliği (m)"), say("bom", "Bom (Yük kolu) uzunluğu (m)"), say("mast_gen", "Mast genişliği (m)"), say("mast_yuk", "Mast yüksekliği (m)"),
      say("mast_sayi", "Mast sayısı"), say("baglanti", "Yapıya bağlantı sayısı"), yaz("kanca_tip", "Kanca tipi"), say("kanca_agiz", "Kanca ağız açıklığı (mm)"),
      say("kanca_kalici", "Kanca ağzı kalıcı açıklık (%)"), say("kanca_kesit", "Kanca gövde kesiti (mm)"), say("kanca_daralma", "Kanca gövde kesiti kalıcı daralma (%)"),
      yaz("aksesuar", "Kaldırma aksesuarı / Tipi"), say("halat_cap", "Halat çapı (mm)"), yaz("halat_donanim", "Halat donanımı"), say("halat_daralma", "Halat çap daralması (%)"),
      yaz("tel_kirik", "Halat tel kırıklığı 6d/30d"), yaz("halat_puan", "Halat deformasyon puanı"), bagli("e_konum", "Kullanım yeri ve amacı", "konum"),
    ] },
    { id: "test_deger", ad: "Test değerleri", blok: "bilgi", kilit: true, alanlar: [
      say("dinamik_yuk", "Dinamik test yükü (kg)"), say("statik_yuk", "Statik test yükü (kg)"), say("yuklu_yuk", "Yüklü test yükü (kg)"),
      say("radyus", "Test anında radyus (m)"), say("bom_test", "Test anında bom uzunluğu (m)"),
      gun("t_yuksuz", "Yüksüz test tarihi"), gun("t_yuklu", "Yüklü test tarihi"), gun("t_statik", "Statik test tarihi"), gun("t_dinamik", "Dinamik test tarihi"),
    ] },
    { id: "cihaz", ad: "Ölçüm aletleri bilgileri", blok: "cihaz", kilit: true },
    liste("kriter", "Muayene kriterleri ve testler", [{ id: "kk", ad: "", maddeler: [
        {"id": "kk1", "metin": "Operatör talimatları, ikazlar ve işaretlemeler", "kilit": true, "std": "TS EN 14439+A2 5.4.2.5.2 – 5.4.4.5.4 – 7.2.1 – 7.3.1 – 7.3.2", "talimat": "** Yarı çapa göre kapasite bilgisi için göstergesi bulunmayan krenlerde yük kolu (bom) üzerinde kapasite ve mesafe levhaları vardır.\n* Kumanda yerlerinde kapasite diyagramı vardır.\n* Uzaktan kumanda üzerinde veya uzaktan kumandaya bağlı bir levha üzerinde kapasite diyagramı vardır.\n* Kullanım talimatları bulunmaktadır.\n* Kullanım talimatlarının içeriği kren ile tutarlıdır.\n** Kren üzerinde gerekli bilgilerin bulunduğu bilgi etiketi vardır.\n* Kren üzerinde bulunan risklere ait ikaz işaretleri vardır.\n* Kren erişim yerinde “yetkisiz kişiler çıkamaz” uyarı yazısı vardır.\n* Yük kolunu serbest bırakılması ile ilgili uyarı yazısı vardır.\n** Kaldırma tertibatına takılı platform üzerinde platforma nasıl erişileceği, müsaade edilen yük değeri, müsaade edilen kişi sayısı ve kalıcı risklere karşı uyarılar vardır.\n* Bilgi etiketi ve tüm işaretlemeler anlaşılırdır, dikkat çekicidir, okunaklıdır, doğru renktedir ve kolay sökülemeyecek şekilde iliştirilmiştir."},
        {"id": "kk2", "metin": "Kumanda yeri ve görüş", "kilit": true, "std": "TS EN 14439+A2 5.4.1.1 – 5.4.1.3 – 5.4.1.4 – 5.4.1.5 – 5.4.1.6 – 5.4.1.7 – 5.4.1.8", "talimat": "* Duruş konumlarına (ayakta duruş vb.) göre uygun boyutlar dadır. (Kullanılacak ölçüm cihazı: Şerit Metre)\n** Yükseltilebilen kumanda yeri olması durumunda kontrolsüz harekete karşı korunmaktadır ve sistem çalışır durumdadır.\n* Kaymaz zemindir.\n* Takılma riski yoktur.\n* Keskin kenar yoktur.\n** Acil (alternatif) çıkış vardır ve aktiftir.\n** Operatör fonksiyonlara rahat erişebilmektedir.\n* Isıtma ve havalandırma sistemleri çalışır durumdadır.\n* Kumanda yerine giriş ve çıkış için uygun boyutlarda kapı, kapak vb. araçlar sağlanmıştır. (Kullanılacak ölçüm cihazı: Şerit Metre)\n* Kapılar istemli bir şekilde açılabilmektedir ve açılma yönü uygundur.\n* Kapı kilitleri dışarıdan kilitlenebilmektedir ve içeriden her zaman açılabilmektedir.\n* Döşeme kapağı aşağı yönde açılmamaktadır.\n* Koltuk ayar mekanizmaları kilitlenebilirdir.\n* Koltuk ayar mekanizmaları çalışır durumdadır.\n* Kumanda yerinin tüm kısımlarında deformasyon yoktur.\n** Kumanda yeri b ağlantılarında çözülme yoktur ve titreşimden dolayı kendiliğinden çözülmesine karşı önlem alınmıştır.\n** Döşeme penceresi camı uygun özelliktedir veya ızgara ile donatılmıştır.\n** Döşeme penceresi açılabildiğinde düşme riskine karşı önlem alınmıştır.\n* Cam duvar bileşenleri uygun şekilde korunmaktadır.\n** Kabinin yük ile çarpışmas ı engellenmiştir veya kabi n kor uyucu bariyerlerle donatılmıştır.\n* Kabini koruyan bariyerlerde deformasyon yoktur.\n** Görüş alanı açıktır ve operatörün kren ve yük hareketini izlemesine imkan vermektedir.\n* Pencerelerin dış yüzeylerinin (ön kabin camı) temizlenmesi için araçlar bulunmaktadır ve çalışır durumdadır.\n* Pencerelerin iç taraflarını b uğu ve donmaya karşı muhafaza edecek araçlar bulunmaktadır ve çalışır durumdadır.\n* Göz kamaşması engellenmektedir.\n* Görsel ekranlar çalışır durumdadır."},
        {"id": "kk3", "metin": "Çalışma alanları ve kumanda yerine erişim", "kilit": true, "std": "TS EN 14439+A2 5.4.4.1 – 5.4.4.2 – 5.4.4.3 – 5.4.4.4 – 5.4.4.5.1 – 5.4.4.5.2 – 5.4.4.5.2", "talimat": "* İlk merdivenin yüksekliği en fazla 10 m’dir.\n** Her 6 m’de bir dinlenme platformu vardır. (Kendinden kurulan tiplerde 10 m)\n* Kumanda yerine (kabin vb.) kalıcı erişim vardır.\n* Zemin seviyesinde hareket eden krenlerde, her iki yönde kren tekerlekleri veya bojiler, ray süpürücüleri ve esnek temaslı koruma ile donatılmıştır.\n* Üzerinde yürünen yerler ve merdiven basamakları kaymaz zemindir.\n** Korkuluk yapısı ve boyutları uygundur. (Kullanılacak ölçüm cihazı: Şerit Metre)\n* Yürüyüş yolları, serbest duruş alanı genişlikleri ve adam giriş delikleri ölçüleri uygundur. (Kullanılacak ölçüm cihazı: Şerit Metre)\n* Merdiven ve merdiven koruyucuları uygun ölçülerdedir. (Kullanılacak ölçüm cihazı: Şerit Metre)\n** Merdiven ve merdiven koruyucularında deformasyon ve bağlantılarında çözülme yoktur.\n** Tüm erişimlerde üç nokta desteği vardır.\n* Kapak açıklıkları en az 0,4 m ila 0,5 m arasındadır.\n* Yük kollarına (bom) erişim için kaldırma tertibatı arabasına takılı platform veya kol üzerinde yürüme yolu (korkuluklu veya kişisel koruyucu donanımlı) vardır.\n* Yük kolları (bom) yürüyüş yolu üzerinde serbest yükseklik en az 1,8 m’dir.\n* Yük kolları (bom) yürüyüş yolu üzerinde ki ayak dayamalarının yüksekliği en az 0,03 m’dir.\n* Kaldırma tertibatını takılı platformun boyutları en 0,5 m X 0,35 m’dir. Kren üzerindeki bakım, onarım ve muayene faaliyetleri için tercih edilen erişim standartlara göre yapılan risk değerlendirmesi sonucuna göre belirlenmelidir. Kumanda yerine erişim personel asansörü ile sağlanıyorsa kumanda yerine erişim ilgili Periyodik Kontrol İçeriği ve Kriterlere göre kontrol edilir."},
        {"id": "kk4", "metin": "Yangın söndürücüler", "kilit": true, "std": "TS EN 14439+A2 5.4.1.1", "talimat": "* Kren üzerinde yangın söndürücü vardır.\n* Kontrol tarihi uygundur.\n* Basınç göstergesinin ibresi uygun alandadır."},
        {"id": "kk5", "metin": "Kumanda tertibatları", "kilit": true, "std": "TS EN 14439+A2 5.4.1.1 – 5.4.1.2 – 5.4.1.3", "talimat": "** Tüm kumandaların istem dışı çalışması engellenmiştir.\n* Kumanda butonları üzerinde veya yakınında semboller vardır ve okunaklı durumdadır.\n** Kumanda sembolleri ile hareketler tutarlıdır.\n** Kumanda fonksiyonları çalışır durumdadır.\n** Acil durum durdurmasının/durdurmalarının yapısı uygundur.\n** Acil durum durdurmasının/durdurmalarının istem dışı çalışması engellenmiştir.\n** Acil durum durdurması/durdurmaları çalışır durumdadır.\n** Acil durum durdurması/durdurmalarının konumu uygundur.\n** Kablosuz kumanda üzerinde ki acil durum durdurması çalışır durumdadır.\n** Kumandalar bas bırak (serbest bırakıldıklarında nötr konuma dönmesi) kumandadır.\n** Tüm kumandalarda özellikle iletkenlerle temas riski oluşturacak deformasyon yoktur.\n** Kablolu asılı kumandalar, operatörün kendisini tehlike bölgesinin dışına çıkarabilecek şekilde (yeterli uzunluk ve hareket kabiliyeti) tasarımlanmıştır.\n* Kablo arabası ve takozlarda deformasyon ve bağlantılarında çözülme yoktur.\n* Kablo arabası ve takozların hareket kabiliyeti engellenmemiştir.\n** Kablosuz kumanda da yetkisiz kullanı mı önleyecek araçlar faal iken veri ileticisi veri iletmemektedir.\n** Kablosuz kumandanın enerjisi bittiğinde devam eden komutlar durmaktadır.\n** Kablosuz kumanda fonksiyonları çalışır durumdadır.\n** Birden fazla kumanda bulunması durumunda acil durdurma h ariç tüm fonksiyonlar aynı anda çalışmamaktadır.\n** Birden fazla kumanda bulunması durumunda düzenleme seçme anahtarı çalışır durumdadır."},
        {"id": "kk6", "metin": "Ekipman yük bileşenlerinin mekanik dayanımı", "kilit": true, "std": "TS EN 14439+A2 5.2 yetkili kişi/kuruluşlar tarafından gerekli prosedürlere göre yapılmıştır.", "talimat": "** Bağlantılarda deformasyon ve çözülme yoktur.\n* Bağlantılarda titreşimden dolayı çözülmeye karşı önlem alınmıştır.\n** Yük bileşenlerinde (k ule, yük kolu, raylar, şasi, redük tör, kaldırma tertibatı arabası, bağlantılar, dişliler vb.) deformasyon yoktur.\n** Ekipmanın yükün gerilimi altındaki kısımları üzerinde tamir kaynağı vb. işlemler\n** Ekipmanın tamir k aynağı yapılan bölgesinde yapılan tahribatsız muayene sonuçlarında herhangi bir çatlak vb. süreksizlik yoktur."},
        {"id": "kk7", "metin": "Tambur", "kilit": true, "std": "TS EN 14439+A2 5.3.2.1 – 5.3.2.2", "talimat": "* Halat sarımı düzenlidir.\n* Halat tambur sınırlarını aşmamaktadır.\n** Tamburda deformasyon ve bağlantılarında çözülme yoktur.\n** İndirme sınırlayıcısı devreye girdiğinde tambur üzerinde en az iki halat sarımı kalmaktadır."},
        {"id": "kk8", "metin": "Makara/makaralar", "kilit": true, "std": "TS EN 14439+A2 5.3.2.1 – 5.3.2.2 – 5.3.2.4", "talimat": "* Halat makaraları halat çapı ile uyumludur. (Kullanılacak ölçüm cihazı: Kumpas ve Şerit Metre)\n* Kanca bloğu makaraları halat çapı ile uyumludur. (Kullanılacak ölçüm cihazı: Kumpas ve Şerit Metre)\n** Kule kren yürüme rayı makaralarında deformasyon yoktur.\n** Tüm makaralarda deformasyon yoktur.\n** Tüm makaralarda dönüş uygundur."},
        {"id": "kk9", "metin": "Koruma tertibatları", "kilit": true, "std": "TS EN 14439+A2 5.3.2.1 – 5.4.3.1", "talimat": "* Sıcak yüzeylerin oluşturacakları risklere karşı koruma vardır ve deformasyon yoktur.\n* Açık dişliler ve benzeri güç iletimleri çalışanlara zarar vermeyecek şekilde kapatılmıştır.\n* Hareketli parçaların oluşturacakları risklere karşı korumalar vardır ve deformasyon yoktur.\n* Kaldırma aksamları (halat veya zincir) ve kasnak ve/veya makaralar arasına yabancı madde veya uzuv sıkışma riskine karşı koruma vardır ve deformasyon yoktur.\n** Kaldırma aksamlarının (halat veya zincir) kasnaklarından ve/veya makaralarından çıkma riskine koruma vardır ve deformasyon yoktur.\n* Yürüyüş yolu ve yürüyüş aksamları arasına yabancı cisim ve uzuv sıkışması riskine karşı önlemler vardır ve deformasyon yoktur.\n* Kişilere zarar verebilecek tüm kasnak vb. koruyucularla kapatılmıştır.\n* Kumanda yerinde basınçlı aksamların oluşturacakları risklere karşı koruma vardır ve deformasyon yoktur."},
        {"id": "kk10", "metin": "Sınırlama ve gösterge cihazları", "kilit": true, "std": "TS EN 14439+A2 5.2.2.5 – 5.4.2.1 – 5.4.2.3 – 5.4.2.4 – 5.4.2.5 – 5.4.2.6.1 – 5.4.2.6.2 – 5.4.2.7 – 5.4.2.8 – 5.4.2.9 – 5.4.2.10 gerçekleşmektedir.", "talimat": "** Nominal kapasite sınırlayıcı vardır ve çalışır durumdadır.\n** Nominal kapasite sınırlayıcı en az iki adettir.\n** Rüzgâr hızı göstergesi çalışır durumdadır.\n* Rüzgâr hızı göstergesinde deformasyon yoktur.\n** Tüm hareket sınırlayıcıları sınırladıkları hareketin tersine izin vermektedirler.\n** Kaldırma sınırlayıcı vardır.\n** Kaldırma sınırlayıcı çalışır durumdadır.\n** Kaldırma sınırlayıcı mesafesi uygundur. (Kullanılacak ölçüm cihazı: Şerit Metre)\n** İndirme sınırlayıcı vardır.\n** İndirme sınırlayıcı çalışır durumdadır.\n* Kaldırma tertibatı arabası hareketi sonundaki sınırlayıcılar vardır ve çalışır durumdadır.\n** Yük kolu (bom) kaldırma sınırlayıcısı çalışır durumdadır.\n** Yük kolu (bom) indirme sınırlayıcısı çalışır durumdadır.\n** Dönüş sınırlayıcısı çalışır durumdadır.\n** Kumanda yeri (kabin vb.) konum sınırlayıcısı çalışır durumdadır.\n* Çalışma yükü göstergesi çalışır durumdadır.\n* Yük kolu (bom) açısı göstergesi çalışır durumdadır.\n* Dönme aralığı göstergesi çalışır durumdadır.\n** Kren yürüyüş sınırlandırıcısı vardır ve çalışır durumdadır.\n* Çalışma alanı sınırlayıcısı çalışır durumdadır.\n* Çarpışma önleyici sınırlayıcı çalışır durumdadır.\n** Şasi konum sınırlayıcılar vardır ve deformasyon yoktur.\n** Raydan çıkmaya karşı koruma tedbirleri vardır.\n* Raydan çıkmaya karşı koruma tedbirlerinde deformasyon yoktur.\n** Ray tekerleklerinde deformasyon ve bağlantılarında çözülme yoktur.\n** Yönlendirme sistemi komutları yürüyüş sistemi ile tutarlıdır.\n** Tüm seyir hareket raylarının sonunda mekanik durdurucular vardır.\n* Tüm seyir hareket raylarının sonunda ki mekanik durdurucularda deformasyon ve bağlantılarında çözülme yoktur.\n* Tüm seyir hareket raylarının sonunda ki mekanik durdurucularda tampon vardır ve deformasyon yoktur.\n** Tüm seyir raylarının sonunda ki mekanik durduruculara temas aynı anda\n** Dönüş dişlilerinde ve yataklarında deformasyon yoktur.\n** Tüm hareket sınırlayıcıları devre dışı bırakma tertibatının kumandası bas bırak tiptedir ve çalışır durumdadır.\n** Kaldırma tertibatı arabası halatlarının kopması durumunda kaldırma tertibatı arabası durmaktadır.\n** Hizmet dışı durumda olumsuz rüzgâr şartlarında kontrolsüz hareketler engellenmektedir.\n** Hizmet dışı durumda olumsuz rüzgâr şartlarında kontrolsüz hareketleri engelleme tertibatlarında deformasyon yoktur ve çalışır durumdadırlar. Sınırlayıcıların ve göstergelerin uygulama zorunluluğu kren türlerine göre değerlendirilmelidir."},
        {"id": "kk11", "metin": "Fren sistemi/sistemleri", "kilit": true, "std": "TS EN 14439+A2 5.3.2.1 – 5.3.2.2", "talimat": "** Enerji kesintisinde tüm hareketleri (kaldırma tertibatı arabası, dönüş, kaldırma ve indirme) durduran frenler devreye girmektedir.\n** Kren hareketleri (kaldırma tertibatı arabası ve dönüş) uygun şekilde durmaktadır.\n** Kaldırma ve indirme frenleri çalışır durumdadır.\n** Yük kolu (bom) kaldırma ve indirme frenleri çalışır durumdadır.\n** Dönme hareketi uygun şekilde durmaktadır. Bu bölümdeki kontroller yüksüz durumda mekanik dayanım (fonksiyon testi) ve yük diyagramına göre yüklü mekanik dayanım (yük testi) testleri ile birlikte değerlendirilmelidir. Yavaşlama ivme değerleri kontrol kapsamında değildir."},
        {"id": "kk12", "metin": "Halatlar", "kilit": true, "std": "TS EN 14439+A2 5.3.2.3 · TS ISO 4309 5 – 6", "talimat": "** Halat sonlandırmaları uygun yöntemlerle yapılmıştır ve bağlantılarında çözülme yoktur.\n** Halatta/halatlarda deformasyon yoktur. (Kullanılacak ölçüm cihazı: Kumpas ve/veya Mastar)"},
        {"id": "kk13", "metin": "Kanca/kancalar", "kilit": true, "std": "TS EN 14439+A2 5.3.2.1 – 5.3.2.2", "talimat": "** Kanca ağız açıklığı ölçüsü uygundur. (Kullanılacak ölçüm cihazı: Kumpas ve/veya Mastar)\n** Kanca gövde kesiti ölçüsü uygundur. (Kullanılacak ölçüm cihazı: Kumpas ve/veya Mastar)\n** Kırılma, parça kopması vb. deformasyon yoktur.\n* Kancanın kendi etrafında serbest dönüş hareketi uygundur.\n** Kanca üzerinde kaynak işlemi yoktur.\n** Yükün kontrolsüz hareketi engellenmiştir. (Güvenlik mandalı, kanca şekli vb.)"},
        {"id": "kk14", "metin": "Sesli ve/veya görsel ikazlar", "kilit": true, "std": "TS EN 14439+A2 5.4.1.1 – 5.4.2.5.1 – Ek B B.4.1 – Ek B B.4.2 – 5.4.2.10 – 5.4.6.1 – Ek C C.1 – C.2 – C.3", "talimat": "** Nominal kapasit e sınırlayıcı görülebilir veya işitilebilir ikazı vardır ve çalışır durumdadır.\n* Nominal kapasite sınırlayıcı ikazı nominal kapasitenin % 90 ila % 95 atasında bir değerde yaklaşma ikazı vermektedir.\n** Uzaktan kumanda ile çalışan kule krende nominal kapasite sınırlayıcı ikazı görülebilir ikazdır.\n* Kablosuz kumanda üzerinde yeşil renkli görülebilir ikaz vardır.\n** Kablosuz kumanda üzerinde nominal kapasite ikazı görülebilirdir veya kren üzerinde sarı renkli görülebilir ikaz vardır.\n* Rüzgâr hızı göstergesi ikaz seviyesi için yanıp sönen (çakar) sarı ve alarm seviyesi için yanıp sönen (çakar) kırmızı renkli görsel ve sesli ikazı vardır ve çalışır durumdadır.\n* Var olan görsel ikazlar çalışır durumdadır.\n** Var olan sesli ikazlar çalışır durumdadır.\n** Kumanda yeri (kabin vb.) olduğunda operatör kontrollü sesli ikaz (korna vb.) vardır ve çalışır durumdadır.\n* Çarpışma önleyicinin devre dışı bırakılması durumunda iş sahasındaki kişilerin uyarılması için yanıp sönen (çakar) beyaz renkli ikaz vardır ve çalışır durumdadır.\n* Hizmet dışı durumda olumsuz rüzgâr şartlarına karşı serbest bırakma tertibatı için yanıp sönen (çakar) yeşil renkli görsel ikaz vardır ve çalışır durumdadır. Rüzgâr hızı göstergesi, çarpışmayı önleme tertibatının devre dışı bırakılması v e hizmet dışı durumda rüzgar şartlarına karşı serbest bırakma tertibatı dış taraf görsel ikazları yerel idarenin zorunlu kılması durumunda olmalıdır."},
        {"id": "kk15", "metin": "Aydınlatma", "kilit": true, "std": "TS EN 14439+A2 5.4.5", "talimat": "* Kumanda yeri aydınlatması vardır, çalışır durumdadır ve yeterli seviyede aydınlatma şiddetine sahiptir. (Kullanılacak ölçüm cihazı: Aydınlık ölçer)\n* Kumanda yeri aydınlatma armatürü ve anahtarında deformasyon ve bağlantılarında çözülme yoktur.\n* Erişim yolları aydınlatması vardır ve çalışır durumdadır.\n** Acil veya acil çıkış aydınlatması vardır ve çalışır durumdadır."},
        {"id": "kk16", "metin": "Elektromekanik Uyum", "kilit": true, "std": "TS EN 14439+A2 5.3.1", "talimat": "* Tüm elektrikli emniyet tertibatları çalıştığında, tahrik makinasının harekete geçmesi engellenmekte veya durma sürecini başlatmakta ve işlevsel frenleri harekete geçirmektedir.\n* Kumanda ve/veya enerji panolarında kanal /pano kapakları, kablo girişleri ve kablo muhafazaları uygundur. Ucu açıkta kablo yoktur.\n* Motorları aşı rı yüke karşı tüm gerilimli iletkenlerin motora sağladığı enerjiyi keserek koruyan sistem (sigorta vb.) vardır ve çalışır durumdadır.\n* Aydınlatma ve priz devrelerini aşırı yüke karşı tüm gerilimli iletkenlerin aydınlatma ve priz devrelerine sağladığı ener jiyi keserek koruyan sistem (sigorta vb.) vardır ve çalışır durumdadır.\n* Motor sargılarının tamamı aşırı yüke karşı ayrı ayrı korunmaktadır.\n* Ana anahtar kontrol ve bakım için gerekli olan priz çıkışlarına veya aydınlatmaya sağlanan enerjiyi kesmemektedir.\n** Ekipmanın yakınında ana anahtar vardır ve çalışır durumdadır.\n* Ana anahtar kilitlenebilir tiptedir.\n* Termik röle/röleler çalışır durumdadır.\n* PTC çalışır durumdadır.\n* Motor koruma (faz sıralı) rölesi vardır.\n* Motor koruma (faz sıralı) rölesi faz eksikliğinde devreye girerek motoru durdurmaktadır.\n* Motor koruma (faz sıralı) rölesi fazların yer değiştirmesinde devreye girerek motoru durdurmaktadır.\n* Kontaktörlerin açmama (yapışma) riskine karşı önlem alınmıştır.\n* Güç besleme devresinde seri şeklinde yer alan kontaklardaki besleme iki bağımsız kontaktör ile kesilmektedir.\n* Motor fren bobini seri iki kontaktörden enerjilendirilmektedir. Bu bölümde belirtilen kontroller sadece elektriksel donanımın mekanik risklerle ilgili olan kısımlarını ve ilişkisini kapsamaktadır. Bu bölümde belirtilen kontroller iş ekipmanının elektrik tesisatı, topraklama tesisatı vb. periyodik kontrollerini kapsamaz."},
        {"id": "kk17", "metin": "Yüksüz test", "kilit": true, "std": "TS EN 14439+A2 5.3.2.1 – 5.3.2.2 · TS ISO 9927-1 6.4", "talimat": "** Ekipman yüksüz durumda iken tüm fonksiyonları yerine getirilerek test gerçekleştirildi, frenler çalışır durumdadır, bağlantılarda çözülme ve deformasyon yoktur. Her periyodik kontrolde gerçekleştirilir."},
        {"id": "kk18", "metin": "Yüklü test", "kilit": true, "std": "TS EN 14439+A2 5.3.2.1 – 5.3.2.2 · TS ISO 9927-1 6.5", "talimat": "** Ekipman nominal kapasite ile yüklü iken tüm fonksiyonları yerine getirilerek test gerçekleştirildi, frenler çalışır durumdadır, bağlantılarda çözülme ve deformasyon yoktur. Her periyodik kontrolde gerçekleştirilir."},
        {"id": "kk19", "metin": "Statik test", "kilit": true, "std": "TS EN 14439+A2 Ek D D.3.3.2 · TS ISO 9927-1 6.6 · TS 10116 5.3.2", "talimat": "** Önemli bakım onarım faaliyetlerinden sonra e kipmanın kapasitesinin ve/veya yük diyagramı içinde kalan bir değerin 1,25 katı yüklü durumda iken test gerçekleştirildi, frenler çalışır durumdadır, bağlantılarda çözülme ve deformasyon yoktur. (Kullanılacak ölçüm cihazı: Şerit Metre) Önemli bakım ve onarım faaliyeti yoksa statik test gerçekleştirilmez."},
        {"id": "kk20", "metin": "Dinamik test", "kilit": true, "std": "TS EN 14439+A2 Ek D D.3.3.3 · TS ISO 9927-1 6.6 · TS 10116 5.3.3", "talimat": "** Önemli bakım onarım faaliyetlerinden sonra e kipmanın kapasitesinin ve/veya yük diyagramı içinde kalan bir değerin 1,1 katı yüklü durumda iken test gerçekleştirildi, frenler çalışır durumdadır, bağlantılarda çözülme ve deformasyon yoktur. Önemli bakım ve onarım faaliyeti yoksa dinamik test gerçekleştirilmez.\nNot: Kusur derecesi “*” hafif kusurlu ve “**” ağır kusurlu anlamında kullanılmaktadır.\nNot: Statik ve dinamik test yapılan periyodik kontrolde ekipmanın tam kapasitesi ile yapılan yüklü testinin yapılmasına gerek yoktur.\nNot: Tanımlar Bu dokümanda geçen; Kren: Köprü, kiriş, kaldırma tertibatı (vinç bloğu), yürüme grupları, yük kolu (bom) vb. kısımları barındıran sistemin tümünü, Kaldırma tertibatı: Kanca, halat, tambur, motor vb. kısımları barındıran kaldırma ve indirme işlemini gerçekleştiren kren sisteminin bir parçası nı (vinç bloğu vb.), Nominal kapasite: Yükün konumu ve krenin konfirigasyonuna göre normal çalışma sırasında krenin kaldırmak üzere tasarımlandığı maksimum yük. Mast: Birbirine monte edilerek kuleyi oluşturan parçasını, ifade eder.\nNot: Kontrol içeriğinde belirtilen kriterler ekipmanın kullanım yeri, kullanım amacı, tip, model ve imalat yıllarına vb. göre değişkenlik gösterebilmektedir. İlgili imalat mevzuatı ve/veya standardı baz alınarak ekipmanda belirtilen risklerin bulunmadığı durumda kontrol kriterleri a ranmayacaktır. Kontrol içeriğinde belirtilen kriterin o e kipmanda aranıp aranmayacağı ile ilgili karar, standart maddesi bölümünde atıf yapılan mevzuat ve/veya standart maddelerine göre verilmelidir. Kriterin kontrol içeriğinde bulunması her ekipman için zorunlu olarak aranacak kriter anlamına gelmemektedir.\nNot: Standart maddesi bölümünde belirtilen standart/standartlar metodun ve kriterlerin oluşturulması için referans olarak belirtil miştir. Üreticinin beyan etmiş olduğu farklı bir standart (farklı bir ülke standardı vb.) olması durumunda, üreticinin beyan etmiş olduğu standardın içerik bölümünde belirtilen kriteri karşılayan ilgili maddesi dikkate alınmalıdır."},
      ] }]),
    ...mekanikSon("Periyodik kontrol tarihi itibari ile yukarıda teknik özellikleri belirtilen kule krenin mevcut şartlar altında kullanımı", HAFIF_SONRAKI, true),
  ],
};

/* ── ZPKR07 · ASILI ERİŞİM DONANIMI ── */
const ZPKR07: FormatGirdisi = {
  sema: 1,
  gorunum: {
    formKodu: "ZPKR07", baslik: "Asılı Erişim Donanımı Periyodik Kontrol Raporu", dayanak: [IS_EKIPMAN],
    talimat: [
      "Asılı erişim donanımı (yapı bakım ünitesi, geçici asılı erişim donanımı, asılı koltuk), kriter tablosundaki içerikle kontrol edilir (ZPKK07; açıklamalar AA04). " + KUSUR_ATIF,
      "Hafif kusurlar bir sonraki periyodik kontrol başlangıç tarihine kadar giderilir (Ek-III 1.9.1).",
      "Bir sonraki periyodik kontrol başlangıç tarihi: başlangıç tarihi + işverenin Ek-III 1.4 ve 1.10'a göre belirlediği aralık.",
      BIRAKMA,
    ].join("\n"),
  },
  kurallar: DERECELI,
  bolumler: [
    firma(true),
    { id: "ekipman", ad: "Ekipman bilgileri", blok: "bilgi", kilit: true, tam: true, alanlar: [
      sec("tip", "Ekipman türü", ["Yapı bakım ünitesi", "Geçici asılı erişim donanımı", "Asılı koltuk"]), bagli("e_marka", "Markası / Modeli", "marka"),
      bagli("e_imal", "İmal yılı", "imal"), yaz("kapasite", "Kapasitesi (kg ve kişi)"), bagli("e_seri", "Seri no", "seri"), say("hiz", "Kaldırma hızı (m/min)"),
      yaz("halat_etiket", "Birincil ve ikincil halat çapı (mm)"), say("yardimci_kap", "Yardımcı kaldırma mekanizması kapasitesi (kg)"),
      yaz("kol_etiket", "Yük kolu iç ve dış uzunluğu (m)"), yaz("ikincil", "İkincil güvenlik cihazı maksimum çalışma yükü (kg) ve hızı (m/min)"),
      say("parapet_etiket", "Parapet destek ayağı arası mesafe (m)"), yaz("konsol_etiket", "Konsollu çıkmaların uzunluğu (m) ve maksimum çalışma yükü (kg)"),
      yaz("halat_tespit", "Birincil ve ikincil halat çapı (mm) — tespit edilen"), yaz("kol_tespit", "Yük kolu iç ve dış uzunluğu (m) — tespit edilen"),
      say("parapet_tespit", "Parapet destek ayağı arası mesafe (m) — tespit edilen"), yaz("yapi_baglanti", "Yapıya bağlantı türü"),
      yaz("platform", "Platform sayısı ve boyutları (en, boy (m))"), yaz("yukseklik", "Kaldırma yüksekliği (m) / Kat sayısı"),
      say("konsol_tespit", "Konsollu çıkmaların uzunluğu (m) — tespit edilen"), say("karsi_agirlik", "Toplam karşı ağırlık kütlesi (kg)"),
      bagli("e_konum", "Kullanım yeri ve amacı", "konum"),
    ] },
    { id: "test_deger", ad: "Test değerleri", blok: "bilgi", kilit: true, alanlar: [
      say("yuklu_yuk", "Yüklü test yükü (kg)"), say("dinamik_yuk", "Dinamik test yükü (kg)"), say("statik_yuk", "Statik test yükü (kg)"),
      gun("t_yuksuz", "Yüksüz test tarihi"), gun("t_yuklu", "Yüklü test tarihi"), gun("t_dinamik", "Dinamik test tarihi"), gun("t_statik", "Statik test tarihi"),
      gun("t_dusme", "Düşmeyi engelleyici güvenlik tertibatı testi tarihi"),
    ] },
    { id: "cihaz", ad: "Ölçüm aletleri bilgileri", blok: "cihaz", kilit: true },
    liste("kriter", "Muayene kriterleri ve testler", [{ id: "ae", ad: "", maddeler: [
        {"id": "ae1", "metin": "Operatör talimatları ve işaretlemeler", "kilit": true, "std": "TS EN 1808:2015 8.12 – 9.4.3 – 11.5 – 13.1.2 – 13.1.3 – 13.1.4", "talimat": "* Yardımcı kaldırma mekanizmasının kancası yardımcı kaldırma mekanizmasının kapasitesi ve kişilerin kaldırılmasının yasak olduğuna dair bilgi ile işaretlenmiştir.\n* Platform üzerinde yardımcı kaldırma mekanizmasının kapasitesi belirtilmiştir.\n* Geçici karşı ağırlıklı kiriş asma donanımları talimatları kiriş üzerine sabitlenmiştir ve okunaklıdır.\n* Kablosuz kumanda kullanımında kişilerin ezilme ve sıkışma risklerinin bulunduğu yerlerde kablosuz kumanda kullanıldığına dair bir uyarı ve kablosuz kumanda çalışırken görülebilir i kaz/platformun çalışmaya başlamasından önce işitilebilir ikaz vardır.\n* Geçici asılı platform larda türüne bağlı olarak üzerinde platformun tanımlaması, geçici asılı platformun imalatçısının veya yetkili temsilcisinin ticari adı ve açık adresi, asılı platformun üreticisinin ve tedarikçisinin adı ve adresi, seri veya tipin tanımı, seri numarası (varsa), nominal kapasite ve platform boyutlarına göre maksimum kişi sayısı tablosu, konsollu çıkmaların uzunluğu ve maksimum çalışma yükü, farklı platform konfigürasyonlarını gösteren şematik gösterim, ayrı bileşenler için ana bileşen üzerinde izlenebilirlik, emniyet kemeri takma noktası (varsa) bilgilerinin olduğu etiket/etiketler vardır.\n* Yapı bakım ünitelerinde türüne bağlı olarak üzerinde platformun tanımlaması, yapı bakım ünitesinin imalatçısının veya yetkili temsilcisinin ticari adı ve açık adresi, asılı platformun üreticisinin ve tedarikçisinin adı ve adresi, seri veya tipin tanımı, seri numarası (varsa), kendi ağırlığı, nominal kapasite ve maksimum kişi sayısı, yardımcı kaldırma mekanizması nominal kapasitesi (varsa), sökülebilir hareketli asma donanımının olduğu durumlarda asma donanımının maksimum yük kapasitesi, emniyet kemeri takma noktası (varsa) bilgilerinin olduğu etiket/etiketler vardır.\n* Manuel kaldır ma mekanizmalarının üzerinde maksimum çalışma kapasitesi, halat çapı ve halatın özellikleri bilgilerinin olduğu etiket vardır.\n* Güç tahrikli kaldırma mekanizmalarının üzerinde maksimum çalışma kapasitesi, nominal kaldırma hızı, halat çapı ve halatın özellikleri bilgilerinin olduğu etiket vardır.\n** İkincil güvenlik cihazları üzerinde maksimum çalışma kapasitesi, halat çapı, tetikleme hızı (varsa) bilgilerinin olduğu etiket vardır.\n* Geçici asılı platformun dengesinin karşı ağırlıklarla sağlanması durumunda asma donanımının üzerinde kaldırma mekanizmasının maksimum çalışma yükü, yük kolunun iç ve dış kısmının uzunluğu bilgilerinin olduğu etiket vardır.\n* Parapet kıskacıyla bağlanan geçici asılı platformlarda asma donanımının üzerinde kaldırma mekanizmasının maksimum çalışma yükü, yük kolunun dış kısmının uzunluğu ve destekler arası uzunluk bilgilerinin olduğu etiket vardır.\n* Bilgi etiketi ve tüm işaretlemeler anlaşılırdır, dikkat çekicidir, okunaklıdır, doğru renktedir ve kolay sökülemeyecek şekilde iliştirilmiştir."},
        {"id": "ae2", "metin": "Yetkisiz kullanıma ve müdahaleye karşı koruma", "kilit": true, "std": "TS EN 1808:2015 8.3.5.8 – 8.9.3.8 – 9.4.3 – 11.1.8", "talimat": "* Aşırı yük algılama cihazı ayar mekanizması yetkisiz müdahaleye karşı korunmuştur.\n* İkincil fren yetkisiz sıfırlamaya karşı korunmuştur.\n** Geçici asma donanımı karşı ağırlıkları yetkisiz müdahaleye karşı kilitlenebilirdir.\n* Asma donanımı kumandaları yetkisiz müdahaleye karşı kilitlenebilirdir."},
        {"id": "ae3", "metin": "Koruma tertibatları", "kilit": true, "std": "TS EN 1808:2015 8.1.6.5 – 8.4.1.1 – 8.4.1.2 – 8.4.3 – 8.6.1 – 8.6.2 – 8.7.2 – 8.10.1 – 8.10.6 – 9.2.7 – 9.2.8.2 – 9.2.9.3 – 9.3.2 – 9.3.3 – 9.3.7", "talimat": "* Motorlar ve servis frenleri dış ortam, atmosferik vb. etkilere karşı korunmaktadır.\n** Kaldırma aksamlarının (halat vb.) kasnaklarından ve/veya makaralarından çıkma riskine karşı koruma vardır.\n* Kaldırma aksamlarının (halat, zincir vb.) kasnaklarından ve/veya makaralarından çıkma riskine karşı koruma tertibatlarında deformasyon ve bağlantılarında çözülme yoktur.\n* Tahrik kasnaklarında/tamburlarında sarım düzenlidir.\n* Tahrik kasnaklarında/tambur larında sarım düzeni sağlayan sistem çalışır durumdadır, üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n* Halat depolama tamburlarında halatın dışa çıkması engellenmiştir.\n* Tahrik ünitesi çatıya monteli traksiyon el vinç ise askı ve e mniyet halatları tambur vb. üzerine sarılmalıdır.\n* Kaldırma aksamları (halat vb.) ve kasnak ve/veya makaralar arasına yabancı madde veya uzuv sıkışma riskine karşı koruma vardır, deformasyon ve bağlantılarında çözülme yoktur.\n* Seyir hareketi tahrik sisteminin zincir ve zincir bağlantılarının koruma kapakları görsel inceleme yapmaya müsaade etmektedir.\n** Seyir hareketi tahrik sistemin zincirinin çarklarından çıkma riskine karşı koruma vardır.\n* Seyir hareketi tahrik sisteminin yük taşıma ve emniyet somununun aşınma durumu kolay gözlemlenebilirdir.\n* Seyir hareketi tahrik sisteminin kremayer (çubuk) ve pinyon dişlileri ve bağlantılarının koruma kapakları görsel inceleme yapmaya müsaade etmektedir.\n* Çatıda seyreden yürüme arabasının arkası ile herhangi bir bitişik sabit yapı arasında sıkışma ve ezilme riskini önlemek için gerekli açıklıklar vardır veya önlemler alınmıştır. (Kullanılacak ölçüm cihazı: Şerit metre)\n* Çatıda seyreden yürüme arabasının tekerleri ile yürüme yolu arasında ayak sıkışmasını engelleyecek tertibatlar vardır, üzerlerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n* Kalıcı asma donanımlarının hareketli parçalarıyla temas riskini önlemek için kapak vb. korumalar vardır, çıkarıldıklarında ekipman üzerinde kala bilmektedir, üzerlerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur."},
        {"id": "ae4", "metin": "Asılı platform veya koltuk", "kilit": true, "std": "TS EN 1808:2015 7.1.1 – 7.1.2 – 7.1.3 – 7.1.4 – 7.1.5 – 7.1.6 – 7.1.8 – 7.2 – 7.3 – 7.4 – 7.5 – 7.6 – 7.7.2.2 – 7.7.3 – 7.7.4 – 7.8 – 7.9.2", "talimat": "** En küçük geçiş genişliği uygun ölçüdedir. (Kullanılacak ölçüm cihazı: Şerit metre)\n** Çalışma yüzeyi alanı uygun ölçüdedir. (Kullanılacak ölçüm cihazı: Şerit metre)\n* Zemin kaymaz malzemeden yapılmıştır.\n* Zemin malzemesi (uzatmalar da dahil) zemine sabitlenmiştir ve maksatlı müdahale (alet gerektiren vb.) ile çıkartılabilirdir.\n* Zemin kolay temizlenebilmekte ve sıvı dökülmeleri kolay boşalabilmektedir.\n** Zeminde bulunan açıklıklar uygun ölçüdedir. (Kullanılacak ölçüm cihazı: Şerit metre)\n* Zeminde deformasyon yoktur.\n** Tüm kenarlarda üst korkuluk, ara korkuluk ve süpürgelik (tekmelik) vardır.\n** Üst korkuluk, ara korkuluk ve süpürgelik (tekmelik) ölçüleri uygundur. (Kullanılacak ölçüm cihazı: Şerit metre)\n** Üst korkuluk, ara korkuluk ve süpürgelikte (tekmelik) deformasyon ve bağlantılarında çözülme yoktur.\n** Platform bileşenlerinde (üst korkuluk, ara korkuluk, tekmelik ve zemin) yaralanmalara neden olacak keskin kenar ve köşe yoktur.\n** Çatısı bulunan platformlarda platform çatısında deformasyon ve bağlantılarında çözülme yoktur ve koruma sağlamaktadır.\n** Platform üzerinde veya asma donanımı üzerinde kişisel koruyucu donanım bağlantı noktası olan platformlarda bağlantı noktasında herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Modüller platformlarda platformu oluşturan parçalar yanlış monte edilmemiştir ve yanlış monte edilemeyecek şekildedir.\n** Modüller platformlarda platformu oluşturan parçalar uyumludur.\n* Modüler platformlarda platformu oluşturan parçaların bağlantıları görünürdür.\n* Kaldırma mekanizması platform üzerinde olan yapı bakım ünitelerinde askı aksamları (halat vb.) ve güvenlik halatları tambur vb. donanımlara sarılmaktadır, bu donanımlar çalışır durumdadı r, herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Yapı bakım ünitesi platformunun tüm kenarlarındaki korkuluklar tam kapalıdır. Açıklıklı bir yapı ise açıklıkların boyutu uygun ölçüdedir. (Kullanılacak ölçüm cihazı: Kumpas ve/veya Şerit metre)\n** Giriş kapısı/kapıları kayar tiptir veya içe doğru açılmaktadır.\n** Giriş kapısı/kapıları istem dışı açılmamaktadır ve kilit vb. mekanizmaları çalışır durumdadır.\n* Giriş k apısında/kapılarında ve kilit mekanizmalarında deformasyon ve bağlantılarında çözülme yoktur.\n** Giriş kap ısı/kapıları ya kendiliğinden kapanabilmektedir veya elektriksel olarak kontrol edilmektedir.\n** Katlı platformlarda platformlar arası güvenli geçişi sağlayan merdiven ve geçiş kapağı vardır.\n* Platformlar arası geçişi sağlayan merdiven ve kapakta deformasyon ve bağlantılarında çözülme yoktur.\n** Platformlar arası geçişi sağlayan kapak yukarı doğru açılmaktadır, merdiveni engellememektedir ve açık konumda kalmayacak şekilde tasarımlanmıştır.\n* Katlı platformlarda platformlar arasındaki ölçü uygundur. (Kullanılacak ölçüm cihazı: Şerit metre)\n** Platformlar arasındaki merdivende gerektiğinde çemberli koruyucu vardır.\n* Platformlar arasındaki merdivenin çemberli koruyucusu uygun ölçüdedir ve herhangi bir deformasyon ve bağlantılarında çözülme yoktur. (Kullanılacak ölçüm cihazı: Şerit metre)\n** Asılı koltuk oturma yeri ölçüleri uygundur. (Kullanılacak ölçüm cihazı: Şerit metre)\n** Asılı koltukta herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Asılı koltukta iki noktalı emniyet kemeri vardır, çalışır durumdadır, üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n* Asılı koltukta tüm kontroller operatörün kolayca erişebileceği şekildedir.\n* Tutma sistemi emniyet tertibat ı kolayca takılıp çıkar ılabilirdir (alet vb. gerektirmeden) ve çalışır durumdadır.\n** Tutma sistemi uygun aralıklarla konulmuştur. (Kullanılacak ölçüm cihazı: Şerit metre vb. mesafe ölçerler)\n* Platform yukarı yönde hareket ederken tutma sistemi noktalarında otomatik olarak durmaktadır, hareketin devamı için bağlantı algılanmaktadır ve sistem çalışır durumdadır.\n* Tutma sistemi bağlantı elemanlarının düşmesi engellenmiştir.\n… (devamı Bakanlık kriter belgesinde)"},
        {"id": "ae5", "metin": "Kaldırma ve emniyet askı aksamları", "kilit": true, "std": "TS ISO 4309 standardında belirtilen iptal kriterleri göz önünde bulundurulabilir. · TS EN 1808:2015 8.11.1 – 8.11.2 – 8.11.3", "talimat": "** Kullanılan halatlar korozyona karşı dayanıklıdır.\n** Kaldırma askı halatlarının çapı belirlenen minimum değerin altında değildir. (Kullanılacak ölçüm cihazı: Kumpas ve/veya Mastar)\n** İkincil (emniyet) halatı çapı kaldırma askı halatlarının çapından daha düşük değildir. (Kullanılacak ölçüm cihazı: Kumpas ve/veya Mastar)\n** Halat sonlandırmaları uygun yöntemlerle yapılmıştır ve bağlantılarında çözülme yoktur.\n* Halat sonlandırmalarında herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Halatta/halatlarda deformasyon yoktur. (Kullanılacak ölçüm cihazı: Kumpas ve/veya Mastar)\nNot: Halat iptal kriterleri için üretici tarafından farklı bir bilgi beyan edilmediği durumlarda"},
        {"id": "ae6", "metin": "Fren sistemi/sistemleri", "kilit": true, "std": "TS EN 1808:2015 8.1.6.1 – 9.2.3 – 9.2.5.3 – 9.3.3", "talimat": "** Enerji kesintisinde (ana güç kaynağı, manuel kuvvet, kumanda tertibatını besleyen) kaldırma mekanizmaları için frenler devreye girmektedir.\n** Seyir hareketleri için fren sistemi vardır ve çalışır durumdadır.\n* Seyir hareketi için manuel ve güç tahrikli sistemleri beraber düzenlenmiş ve sistemler aynı hareket kısıtlamalarını kullanıyorlarsa sistemlerin aynı anda kullanılmaları engellenmiştir."},
        {"id": "ae7", "metin": "Mekanik hareket sınırlayıcı/sınırlayıcıları", "kilit": true, "std": "TS EN 1808:2015 9.2.2 – 9.2.8.3 – 9.2.10.1 – 9.2.11.2 – 9.3.1.4 (düşey, dönüş, yatay, çapraz, teleskopik vb.) sonunda mekanik sınır durdurucular vardır,", "talimat": "** Asma donanımı (yatay eksende yürünen kısım (ray, düz zemin vb.) hariç asılı platformun halat vb. aksamlarla asıldığı yapı ve/veya yürüme arabası) hareketlerinin deformasyon ve bağlantılarında çözülme yoktur.\n** Seyir hareketi sınırlama anahtarları çalışır durumdadır ve mekanik sınır durdurucularla temastan önce devreye girmektedir.\n* Seyir hareketi sınırlama anahtarlarında herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Seyir hareketi tahrik sistemi vida somun sisteminde somunların vidadan ayrılmasını engelleyen mekanik durdurucular vardır, üzerlerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Seyir hareketi tahrik sistemi h idrolik silindirlerin te leskopik hareketleri mekanik olarak sınırlandırılmıştır, herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Yük tutma amaçlı pnömatik silindirler kullanılmamıştır.\n** Seyir hareketi tahrik sisteminde yük tutan hidrolik silindirler de kontrolsüz hareketlere karşı koruma (yük tutma (kilit) valfi, patlak boru valfi vb.) vardır ve çalışır durumdadır.\n* Seyir hareketi tahrik sisteminde yük tutan hidrolik silindirlerde kontrolsüz hareketlere karşı koruma (yük tutma (kilit) valfi, patlak boru valfi vb.) valfleri silindire yekpare bağlanmıştır veya rijit borularla bağlanmıştır.\n** Tampon/tamponların montajı uygundur.\n** Tampon/tamponlarda deformasyon ve bağlantılarında çözülme yoktur."},
        {"id": "ae8", "metin": "Hareket sınırlama cihazı/cihazları", "kilit": true, "std": "TS EN 1808:2015 7.7.2.1 – 7.9.4 – 7.9.5 – 8.3.6 – 8.3.7 – 8.3.10 – 8.4.3 – 8.4.4 – 8.6.2 – 9.2.5.3.3 – 9.2.6.1", "talimat": "** Alt seviye sınırlama anahtarı platform tutma sisteminin en alt seviyedeki kılavuzlarından ayrılmadan devreye girmektedir.\n** Eğimli yüzeyde çalışan platformların kaldırma ve emniyet halatlarında gevşeme olması durumunda platform otomatik olarak durmaktadır.\n** Eğimli yüzeyde çalışan platformların eğim sonu sınır anahtarı çalışır durumdadır.\n** Kaldırma mekanizması asma donanımı (yatay eksende yürünen kısım (ray, düz zemin vb.) hariç asılı platformun halat vb. aksamlarla asıldığı yapı ve/veya yürüme arabası) üzerine monte edilmiş asılı platformlarda indirme (halat sonu) sınırlayıcı vardır, tambur üzerinde olması gereken en az sarım sayısından önce devreye girmektedir ve çalışır durumdadır.\n** Alt seviye (indirme) sınırlayıcı vardır (platformun halat vb. aksamlarla asıldığı yapı zemininde kurulan geçici asılı platformlarda zorunlu değildir) ve çalışır durumdadır.\n* Alt seviye (indirme) sınırlayıcı halat sonu sınırlayıcı anahtarından önce devreye girmektedir.\n** Üst seviye (kaldırma) sınırlama anahtarı vardır, üst seviye son sınırlama anahtarından önce devreye girmektedir ve çalışır durumdadır.\n** Üst seviye son sınırlama anahtarı vardır (platformun halat vb. aksamlarla asıldığı yapıya sabit olan geçici asılı platformlarda zorunlu değildir) ve çalışır durumdadır.\n* Üst seviye son sınırlama ve üst seviye (kaldırma) sınırlama anahtarları ayrı ve bağımsız kontrol cihazlarına sahiptir.\n* Üst seviye son sınırlama anahtarı çalıştıktan sonra asılı platforma yetkili bir kişi tarafından düzeltici faaliyet uygulanıncaya kadar kaldırma ve indirme hareketlerinin yapılması mümkün olmamaktadır.\n** Halatın düzensiz ve çok sayıda üst üste sarması durumunda kaldırma mekanizması otomatik durmaktadır.\n* Tahrik ünitesi çatıya monteli traks iyonel vinç olan asılı platformlarda askı ve emniyet halatların ın sarıldığı düzeneğin çalışmaması durumunda platform hareketi otomatik olarak durmaktadır.\n** Tahrik ünitesi çatıya monteli traksiyon el vinç olan asılı platformlarda halat sonu anahtarı vardır ve çalışır durumdadır.\n** Akü şarj ünitesine bağlı iken platformun tüm hareketleri engellenmiştir.\n** Yük kolunun teleskopik hareketlerinde tahrik sisteminde bir arıza olması durumunda teleskopik hareketin daha ileri konuma gelmesi engellenmektedir."},
        {"id": "ae9", "metin": "Kumandalar", "kilit": true, "std": "TS EN 1808:2015 8.2.1.1 – 8.2.1.2 –8.12 – 11.1 – 11.2 – 11.5", "talimat": "** Elle tahrik edilen kumanda /kumandalar (krank veya manivela kolu) çalışır durumdadır.\n** Elle tahrik kumanda larının (krank veya manivela kolu) kontrolsüz hareketi engellenmiştir.\n* Elle tahrik edilen kumandada/kumandalarda (krank veya manivela kolu) herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Acil durum durdurması etkinleştirildiğinde yardımcı kaldırm a mekanizması da durmaktadır.\n** Kumandalar bas bırak (serbest bırakıldıklarında nötr konuma dönen) kumandadır.\n* Tüm kumandalarda semboller vardır ve okunaklı durumdadır.\n** Tüm kumandalardaki semboller ile hareketler tutarlıdır.\n** Çatıda hareket eden yürüme arabasının, asma donanımının ve/veya hareket eden taşıma donanımlarında ki kaldırma mekanizmalarında acil durum durdurması vardır ve çalışır durumdadır.\n* Acil durum durdurmalarında herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Acil durumlar için asma donanımına (kaldırma mekanizmaları platform üzerinde olan ve asma donanımına erişimin sadece platformdan olanlar hariç) kumandalar yerleştirilmiştir.\n** Çok katlı platformlarda birincil kontroller üst kattaki platformda bulunan kumandadır.\n** Çok katlı platformlarda alt kattaki platformda da kumanda vardır.\n** Çok katlı platformlarda kaldırma ve indirme hareketi için her iki kattaki kumanda da etkinleştirilmektedir.\n* Tüm acil durum durdurma cihazları bağımsız şekilde durdurma özelliğine sahiptir.\n* Kablosuz kumandanın etkinleştirildiği kuma nda üzerinde anlaşılabilmektedir ve çalışır durumdadır.\n* Kablosuz kumanda kullanılan platformun herhangi bir nedenle hareketlerinin durmasından sonra operatör kablosuz kumandayı kapatıp açtıktan sonra komutları verebilmektedir.\n** Birden fazla kablosuz kumanda kullanılması durumunda kablosuz kumandalar arasında etkinleştirme için seçme anahtarı vardır, çalışır durumdadır ve iki kablosuz kumanda aynı anda çalışmamaktadır."},
        {"id": "ae10", "metin": "Göstergeler ve ikazlar", "kilit": true, "std": "TS EN 1808:2015 7.7.3 – 7.7. 4 – 9.2.5.3.1 – 9.3.3 – 11.5 – 8.3.5.7", "talimat": "* Platformun aşağı yönde hareketinde tutma sistemi bağlantısı için görülebilir ve/veya işitilebilir ikazlar vardır ve çalışır durumdadır.\n* Maksimum rüzgâr hızı aşımı işitilebilir ikazı çalışır durumdadır.\n* Seyir hareketi tahrik sistemi beslemesi akülü olan platformlarda kumanda panosunda akü seviye göstergesi vardır, çalışır durumdadır, üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n* Çatıda hareket eden yürüme arabasının hareketi sırasında çalışan işitilebilir ikaz vardır, çalışır durumdadır, üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n* Kablosuz kumanda kullanımında kişilerin ezilme ve sıkışma risklerinin bu lunduğu yerlerde kablosuz kumanda kullanıldığına dair kablosuz kumanda çalışırken görülebilir ikaz veya platformun çalışmaya başlamasından önce işitilebilir ikazı çalışır durumdadır.\n* Aşırı yük algılama cihazı görülebilir veya işitilebilir ikazı vardır ve çalışır durumdadır.\n* Kumanda/kumandalar üzerindeki gösterge ışıkları çalışır durumdadır."},
        {"id": "ae11", "metin": "Aşırı yük algılama cihazı", "kilit": true, "std": "TS EN 1808:2015 8.3.5.1 – 8.3.5.2 – 8.3.5.3 – 8.3.5.6", "talimat": "** Tüm kaldırma mekanizmalarında olacak şekilde aşırı yük algılama cihazı vardır.\n** Aşırı yük algılama cihazı çalışır durumdadır.\n** Aşırı yük algılama cihazı devredeyken aşağı yönde indirme hariç tüm hareketler engellenmiştir."},
        {"id": "ae12", "metin": "Düşmeyi engelleyici güvenlik tertibatları", "kilit": true, "std": "TS EN 1808:2015 8.9.1 – 8.9.2.1 – 8.9.2.3 – 8.9.2.4 – 8.9.2.5 – 8.9.2.6 – 8.9.3.2 – 8.9.3.5 – 8.9.3.6 – 8.9.3.7 – 9.2.6.1– 9.2.7 – 9.2.8.1 – 9.2.9.1", "talimat": "** Düşmeyi engellemek için güvenlik tertibatı vardır ve çalışır durumdadır.\n** Düşüş durdurma cihazı aşırı hız ve/veya sınır eği m değeri geçildiğinde devreye girmektedir ve platformu durdurmaktadır.\n** Düşüş durdurma cihazı mekanik olarak devreye girmektedir.\n** Düşüş durdurma cihazı test edilebilirdir ve gerekli devreye alma işlemi yapıldıktan sonra çalışmaya devam etmektedir.\n** Düşüş durdurma cihazı platformun kaldırma mekanizması tarafından kaldırılabilmesine izin vermektedir.\n** İkincil fren aşırı hız durumunda otomatik olarak devreye girmektedir.\n** İkincil fren mekanik olarak devreye girmektedir.\n** Güç tahrikli kaldırma mekanizmasına sahip asılı platformlarda ikincil fren devreye girdiğinde ana güç beslemesini kesmektedir.\n** İkincil fren test edilebilirdir ve gerekli devreye alma işlemi yapıldıktan sonra çalışmaya devam etmektedir.\n** İkincil fren devreye girdikten sonra platform eğimi sınır değerlerin in üzerine çıkmamaktadır.\n** Düşmeyi engellemek için kullanılan güvenlik tertibatla rında herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Teleskopik yük kollarının tahrik sisteminde bir arıza olması durumunda asılı platformun düşme riski olan platformlarda ikincil bir cihaz vardır ve çalışır durumdadır.\n** Seyir hareketi si steminin zincir tahrikinde arıza olması durumunda düşey hareketi sınırlayan cihaz/tertibat vardır, çalışır durumdadır, üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Seyir hareketi sisteminin vida somun tahrikinde arıza olması durumunda düşmeyi engelleyen cihaz/tertibat vardır, çalışır durumdadır, üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Seyir hareketi sistemi nin kremayer (çubuk) ve pinyon dişli tahrikinde arıza olması durumunda düşmeyi engelleyen cihaz/tertibat vardır, çalışır durumdadır, üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur."},
        {"id": "ae13", "metin": "Enerji kesintisinde elle indirme tertibatları", "kilit": true, "std": "TS EN 1808:2015 8.3.4.1 – 8.3.4.2 – 8.3.4.3", "talimat": "** Enerji kesintisi durumunda platformun aşağı yönde inişini sağlayacak manuel kumanda vardır, kolay erişilebilirdir ve çalışır durumdadır.\n** Enerji kesintisi durumunda platformun aşağı yönde inişini sağlayacak manuel kumanda bas bırak tiptedir.\n* Enerji kesintisi durumunda platformun aşağı yönde inişini sağlayacak manuel kumandada herhangi bir deformasyon ve bağlantılarında çözülme yoktur."},
        {"id": "ae14", "metin": "Boylamasına durumun korunması ve/veya engel algılama", "kilit": true, "std": "TS EN 1808:2015 8.3.4.4 – 8.3.8 – 8.3.9", "talimat": "** İki bağımsız tahri k sistemine sahip çatıya monte edilmiş asılı platform enerji kesintisi durumunda platformun aşağı yönde inişini sağlayacak manuel ku manda devredeyken boylamasına durumun korunması için eğim sınır değerini geçmemektedir. (Kullanılacak ölçüm cihazı: Eğim veya açı ölçer)\n** İki veya daha fazla bağımsız kaldırma mekanizmaları tarafından tahrik edilen asılı platformlarda boylamasına durumun korunması için maksimum eğim değerine ulaşıldığında platform eğimini otomatik olarak sınırlandıran (elektrikli veya mekanik) sistem vardır ve sistem çalışır durumdadır.\n** Engel algılama cihazı vardır, maksimum eğim değerine ulaşıldığında platform eğimini otomatik olarak sınırlandırmaktadır ve çalışır (indirme işlemini durdurma) durumdadır.\n** Baş üstü çarpma engelleyici çalışır durumdadır."},
        {"id": "ae15", "metin": "Asma donanımı", "kilit": true, "std": "TS EN 1808:2015 9.3.1.2 – 9.3.1.3 – 9.3.6 – 9.4.2 – 9.4.3 – 10.6", "talimat": "** Kalıcı asma donanımlarında yürüme arabasının kılavuzlarından ayrılması ve/veya devrilmesi engellenmiştir.\n* Kalıcı asma donanımlarında yürüme arabasının kılavuzlarından ayrılmasını ve/veya devrilmesini engelleyen tertibatlarda herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Kalıcı asma donanımlarında yürüme arabasının karşı ağırlıklarının parçalı olması durumunda ağırlıklar ancak kasıtlı müdahale ile çıkarılabilecek şekilde sabitlenmiştir.\n* Geçici asma donanımı karşı ağırlık kütleleri maksimum değerin üstünde değildir ve ağırlık değerleri üzerlerinde kalıcı olarak işaretlenmiştir.\n** Geçici asma donanımı karşı ağırlıkları kasıtlı müdahale ile çıkarılabilecek şekilde sabitlenmiştir.\n** Hidrolik silindirler, çelik borular ve hortumlarda sızıntı, deformasyon ve bağlantılarda çözülme yoktur.\n** Basınç sınırlayıcı/sınırlayıcıları çalışır durumdadır.\n* Hidrolik tankta en az ve en çok seviyeler tespit edilebilirdir.\n** Hidrolik tankta yağın en az ve en çok seviyeleri uygundur.\n** Hidrolik pompa çalışır durumdadır, koku ve aşırı ısınma vb. durumlar yoktur.\n* Hidrolik ana kapama vanası vardır, çalışır durumdadır, deformasyon ve bağlantılarında çözülme yoktur. Basınç sınırlayıcının devreye girme değeri kontrol kapsamında değildir."},
        {"id": "ae16", "metin": "Yapısal bileşenler ve bağlantılar", "kilit": true, "std": "TS EN 1808:2015 9.2.6.2 – 9.2.7 – 9.4.1 – 9.4.4", "talimat": "* Teleskopik yük kolunda/kollarında birden fazla halat veya zincir bağlanmışsa halat veya zincirlerin gerginliklerinin ayarlanması için tertibat vardır, çalışır durumdadı r ve üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Seyir hareketi tahrik sistemi zincir aksamlarında yuvarlak baklalı zincir kullanılmamıştır.\n* Geçici asma donanımlarında ankraj pimleri ve tespit klipsleri gibi parçalar ekipman üzerine kalıcı bağlantılarla tutturulmuştur.\n** Askı ve emniyet aksamlarının (halat vb.) bağlanması için ayrı asma noktaları vardır ve üzerlerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Asma donanımı ve parçaları güvenli ve emniyetli birleştirilmiştir, bağlantılarda çözülme yoktur, bağlantılarda kendiliğinden çözülmeye karşı tedbir alınmıştır ve deformasyon yoktur.\n** Tahrik mekanizması/mekanizmaları bağlantılarda çözülme yoktur, bağlantılarda kendiliğinden çözülmeye karşı tedbir alınmıştır ve deformasyon yoktur.\n** Çatı bağlantılarda çözülme yoktur, bağlantılarda kendiliğinden çözülmeye karşı tedbir alınmıştır ve deformasyon yoktur.\n** Asma donananımı yürüme yolunda herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Ekipmanın yükün gerilimi altındaki kısımları üzerinde tamir kaynağı vb. işlemler yetkili kişi/kuruluşlar tarafından gerekli prosedürlere göre yapılmıştır.\n** Ekipmanın tamir kaynağı yapılan bölgesinde yapılan tahribatsız muayene sonuçlarında herhangi bir çatlak vb. süreksizlik yoktur."},
        {"id": "ae17", "metin": "Yardımcı kaldırma mekanizmaları", "kilit": true, "std": "TS EN 1808:2015 8.12 – 13.2", "talimat": "* Yardımcı kaldırma mekanizması geçerli bir periyodik kontrol raporu olmadan kullanılmamaktadır.\n** Yardımcı kaldırma mekanizmasının kapasitesi 1000 kg ile sınırlandırılmıştır.\n** Yardımcı kaldırma mekanizmasında aşırı yük algılama cihazı vardır ve çalışır durumdadır.\n** Yardımcı kaldırma mekanizması aşırı yük algılama cihazı devreye girdiğinde platformun ve kaldırma mekanizmasının indirme dışındaki hareketlerini engellemektedir.\n* Yardımcı kaldırma mekanizması enerji kesintisinde yükü kontrollü olarak indirilmesini sağlayabilmektedir ve bu sistem asılı platform kullanılırken erişilebilirdir.\n* Kaldırma mekanizması asma donanımı (yatay e ksende yürünen kısım (ray, düz zemin vb.) hariç asılı platformun halat vb. aksamlarla asıldığı yapı ve/veya yürüme arabası) üzerine monte edilmiş yapı bakım ünitelerinde yardımcı kaldırma mekanizmasının maksimum kaldırma ve indirme hızı platform hızı ile aynıdır.\n* Kaldırma mekanizması asma donanımı (yatay eksende yürünen kısım (ray, düz zemin vb.) hariç asılı platformun halat vb. aksamlarla asıldığı yapı ve/veya yürüme arabası) üzerine monte edilmiş yapı bakım ünitelerinde yardımcı kaldırma mekanizması ile taşınan yükün korkuluk seviyesin e gelmesini önleyen ve düzelten kontrol cihazı vardır ve çalışır durumdadır.\n* Kaldırma mekanizmaları platform üzerinde bulunan yapı bakım üniteleri ve tüm geçici asılı platformlarda yardımcı kaldırma mekanizmasının taşıdığı yükün platforma düşmemesi için kılavuzlama sistemi vardır, sistemde herhangi bir deformasyon ve bağlantılarında çözülme yoktur. (Belirtilen türlerde yükün korkuluk seviyesine gelmesini önleyen ve düzelten kontrol cihazı yerine kullanılabilir.) Yardımcı kaldırma mekanizmasının (traksiyonel, tambur vinci vb.) periyodik kontrolü bu periyodik kontrol kriterleri kapsamında değildir. Bakanlık tarafından yayımlanmış ilgili Periyodik Kontrol Kriterlerine göre ayrıca kontrol edilmelidir."},
        {"id": "ae18", "metin": "Erişim", "kilit": true, "talimat": "* Üzerinde yürünen yerler ve merdiven basamakları kaymaz zemindir.\n** Korkuluk yapısı ve boyutları uygundur.\n* Yürüyüş yolları ve serbest duruş alanı genişlikleri uygundur.\n* Merdiven ve merdiven koruyucuları uygundur.\n** Tüm erişimlerde üç nokta desteği vardır.\n* Yerinden çıkarılabilir merdiven vb. erişim tertibatları güvenlik kontağı vb. ile unutulma riskine karşı korunmaktadır ve güvenlik kontağı çalışır durumdadır. --"},
        {"id": "ae19", "metin": "Elektromekanik uyum", "kilit": true, "std": "TS EN 1808:2015 10.1 – 10.2 – 10.3 – 10.4", "talimat": "** Tüm elektrikli emniyet terti batları çalıştığında, tahrik makinasının harekete geçmesi engellenmekte veya durma sürecini başlatmakta ve işlevsel frenleri harekete geçirmektedir.\n* Kumanda ve/veya enerji panolarında kanal/pano kapakları, kablo girişleri ve kablo muhafazaları uygundur. Ucu açıkta kablo yoktur.\n* Motorları aşırı yüke karşı tüm gerilimli iletkenlerin motora sağladığı enerjiyi keserek koruyan sistem (sigorta vb.) vardır ve çalışır durumdadır.\n* Aydınlatma ve priz devrelerini aşırı yüke karşı tüm gerilimli iletkenlerin aydınlatma ve priz devrelerine sağladığı enerjiyi keserek koruyan sistem (sigorta vb.) vardır ve çalışır durumdadır.\n* Motor sargılarının tamamı aşırı yüke karşı ayrı ayrı korunmaktadır.\n* Ana anahtar/anahtarlar kontrol ve bakım için gerekli olan priz çıkışlarına veya aydınlatmaya sağlanan enerjiyi kesmemektedir.\n** Ekipmanın yakınında ana anahtar vardır ve çalışır durumdadır.\n* Ana anahtar kilitlenebilir tiptedir.\n* Termik röle/röleler çalışır durumdadır.\n* PTC çalışır durumdadır.\n* Motor koruma (faz sıralı) rölesi vardır.\n* Motor koruma (faz sıralı) rölesi faz eksikliğinde devreye girerek motoru durdurmaktadır.\n* Motor koruma (faz sıralı) rölesi fazların yer değiştirmesinde devreye girerek motoru durdurmaktadır.\n* Kontaktörlerin açmama (yapışma) riskine karşı önlem alınmıştır.\n* Güç besleme devresinde seri şeklinde yer alan kontaklardaki besleme iki bağımsız kontaktör ile kesilmektedir.\n* Motor fren bobini seri iki kontaktörden enerjilendirilmektedir.\n** Ekipmanın bütün hareket aralığı boyunca sarkan her kablonun serbest ve güvenli hareketini sağlamak için önlem alınmıştır ve çalışır durumdadır.\n* Ekipmanın bütün hareket aralığı boyunca sarkan her kablonun serbest ve güvenli hareketini sağlayan sistem kısımlarında deformasyon ve bağlantılarında çözülme yoktur. Bu bölümde belirtilen kontroller sadece elektriksel donanımın mekanik risklerle ilgili olan kısımlarını ve ilişkisini kapsamaktadır. Bu bölümde belirtilen kontroller iş ekipmanının elektrik tesisatı, topraklama tesisatı vb. periyodik kontrollerini kapsamaz. TEST KRİTERLERİ"},
        {"id": "ae20", "metin": "Yüksüz test", "kilit": true, "talimat": "** Ekipman yüksüz durumda iken tüm fonksiyonları yerine getirilerek test gerçekleştirildi, frenler çalışır durumdadır, deformasyon ve bağlantılarda çözülme yoktur. Her periyodik kontrolde gerçekleştirilir. --"},
        {"id": "ae21", "metin": "Yüklü test", "kilit": true, "talimat": "** Ekipman tam kapasite ile yüklü iken tüm fonksiyonları yerine getirilerek test gerçekleştirildi, frenler çalışır durumdadır, deformasyon ve bağlantılarda çözülme yoktur. Her periyodik kontrolde gerçekleştirilir. --"},
        {"id": "ae22", "metin": "Dinamik test", "kilit": true, "std": "TS EN 1808:2015 12.4 – 12.5", "talimat": "** Yapı bakım ünitelerinde önemli bakım ve onarım faaliyetlerinden sonra ekipmanın tam kapasitesinin 1,1 katı yük ile test gerçekleştirildi, frenler çalışır durumdadır, deformasyon ve bağlantılarda çözülme yoktu.\n** Geçici asılı platformda ve asılı koltukta önemli bakım ve onarım faaliyetlerinden sonra ekipmanın tam kapasitesinin üreticinin belirmiş olduğu değer ile test gerçekleştirildi, frenler çalışır durumdadır, deformasyon ve bağlantılarda çözülme yoktu. Önemli bakım ve onarım faaliyeti yoksa dinamik test gerçekleştirilmez."},
        {"id": "ae23", "metin": "Statik test", "kilit": true, "std": "TS EN 1808:2015 12.4 – 12.5", "talimat": "** Yapı bakım ünitelerinde önemli bakım ve onarım faaliyetlerinden sonra ekipmanın tam kapasitesinin 1,5 katı yük ile test gerçekleştirildi, frenler çalışır durumdadır, deformasyon ve bağlantılarda çözülme yoktur.\n** Geçici asılı platformda ve asılı koltukta önemli bakım ve onarım faaliyetlerinden sonra ekipmanın tam kapasitesinin üreticinin belirmiş olduğu değer ile test gerçekleştirildi, frenler çalışır durumdadır, deformasyon ve bağlantılarda çözülme yoktu. Önemli bakım ve onarım faaliyeti yoksa statik test gerçekleştirilmez."},
        {"id": "ae24", "metin": "Düşmeyi engelleyici güvenlik tertibatı/tertibatları testi", "kilit": true, "talimat": "** Güvenlik mekanizması şahısların tehlikeye maruz bırakılmaması için, çalışma platformu uzaktan uzman bir kişi tarafından teste tabi tutulabilmektedir.\n** Üreticinin belirtmiş olduğu kapasite ve hız değerlerinde gerçekleştirildi, sistem devreye girdi, deformasyon ve bağlantılarda çözülme yoktur. Üreticinin belirtmiş olduğu aralıklarda gerçekleştirilir. --\nNot: Kusur derecesi “*” hafif kusurlu ve “**” ağır kusurlu anlamında kullanılmaktadır.\nNot: Statik ve dinamik test yapılan periyodik kontrolde ekipmanın tam kapasitesi ile yapılan yüklü testinin yapılmasına gerek yoktur.\nNot: Kontrol içeriğinde belirtilen kriterler ekipmanın kullanım yeri, kullanım amacı, tip, model ve imalat yıllarına vb. göre değişkenlik gösterebilmektedir. İlgili imalat mevzuatı ve/veya standardı baz alınarak ekipmanda belirtilen risklerin bulunmadığı durumda kontrol kriterleri aranmayacaktır. Kontrol içeriğinde belirtilen kriterin o ekipmanda aranıp aranmayacağı ile ilgili karar standart maddesi bölümünde atıf yapılan mevzuat ve/veya standart maddelerine göre verilmelidir. Kriterin kontrol içeriğinde bulunması her ekipman için zorunlu olarak aranacak kriter anlamına gelmemektedir.\nNot: Standart maddesi bölümünde belirtilen standart/standartlar metodun ve kriterlerin oluşturulması için referans olarak belirtil miştir. Üreticinin beyan etmiş olduğu farklı bir standart (farklı bir ülke standardı vb.) olması durumunda, üreticinin beyan etmiş olduğu standardın içerik bölümünde belirtilen kriteri karşılayan ilgili maddesi dikkate alınmalıdır."},
      ] }]),
    ...mekanikSon("Periyodik kontrol tarihi itibari ile yukarıda teknik özellikleri belirtilen iş ekipmanının mevcut şartlar altında kullanımı", HAFIF_SONRAKI, true),
  ],
};

/* ── LPG TANKI: etiket ve tespit alanları (ZPMR01 ve ZYDR01 ortak) ── */
const LPG_TANK = () => [
  bagli("e_marka", "İmalatçısı", "marka"), bagli("e_imal", "İmalat yılı", "imal"), bagli("e_seri", "Seri / Üretim no", "seri"), say("ps", "Azami basınç (PS)(bar)"),
  bagli("e_model", "Modeli / Tipi", "model"), say("hacim", "Hacim (L)"), yaz("tasarim", "Tasarım kodu"), say("test_basinc", "Test basıncı (bar)"),
];
const LPG_VALF = () => [
  yaz("v_imalatci", "Emniyet valfi imalatçısı"), yaz("v_imal", "Emniyet valfi imalat yılı"), say("v_ayar", "Emniyet valfi ayar basıncı (bar)"),
  yaz("v_model", "Emniyet valfi modeli / tipi"), yaz("v_sertifika", "Emniyet valfi sertifika tarihi ve no"), yaz("v_seri", "Emniyet valfi seri / üretim no"),
  yaz("v_kurulus", "Sertifikayı veren kuruluş"),
];
const LPG_DIPNOT_BASINC = "İşletme basıncı, kullanımda olan bir tank için firma yetkilisinin beyan ettiği, tankın yıl içinde çıktığı en yüksek basınçtır; kullanımda olmayan tankta tasarım basıncına eşit alınır.";

/* ── ZPMR01 · LPG TANKI PERİYODİK MUAYENE ── */
const ZPMR01: FormatGirdisi = {
  sema: 1,
  gorunum: {
    formKodu: "ZPMR01", baslik: "Sıvılaştırılmış Petrol Gazı (LPG) Tankı Periyodik Muayene Raporu", dayanak: [IS_EKIPMAN],
    talimat: [
      "Her tank ayrı muayene edilir; örnekleme yapılmaz (AA01). Kriterler: ZPMK01. " + KUSUR_ATIF,
      "Periyodik muayene yazılı plan hazırlandıktan sonra yapılır; yazılı planın 13 m³ ve altı tanklarda TS EN 12817, üstünde TS EN 12819'un 6, 7 ve 8. maddelerini karşıladığı kontrol edilir.",
      "Yeterliliğin yeniden değerlendirilmesi en fazla 10 yılda bir; emniyet valfi testi / değişimi en fazla 5 yılda bir; yer altı tanklarında katodik koruma izleme (standartta süre yoksa) en fazla 6 ayda bir.",
      "Emniyet valfi test değeri ve ölçüm aleti (manometre) yalnız valf için test seçeneği kullanıldıysa doldurulur.",
    ].join("\n"),
  },
  kurallar: DERECELI,
  bolumler: [
    firma(true),
    { id: "ekipman", ad: "Ekipman bilgileri", blok: "bilgi", kilit: true, tam: true, alanlar: [
      ...LPG_TANK(), ...LPG_VALF(),
      say("isletme", "İşletme basıncı (bar)"), sec("yerlesim", "Yerleşim türü", ["Yer altı", "Yer üstü"]), sec("tank_tipi", "Tank tipi", ["Küresel", "Silindirik"]),
      yaz("valf_sayi", "Emniyet valfi sayısı ve tipi"), yaz("seviye", "Seviye göstergesi sayısı ve tipi"), say("manometre", "Manometre skala büyüklüğü (bar)"),
      bagli("e_konum", "Kullanım yeri ve amacı", "konum"), say("aciklik", "Proje/Tank üzerindeki açıklık sayısı"),
      yaz("hyb_no", "Hizmet yeterlilik belgesi no"), gun("hyb_tarih", "Hizmet yeterlilik belgesi son geçerlilik tarihi"),
    ] },
    { id: "yazili_plan", ad: "Yazılı plan bilgileri", blok: "bilgi", kilit: true, numarasiz: true, alanlar: [
      yaz("plan_tarih", "Yazılı plan tarihi / revizyon no"), yaz("plan_hazirlayan", "Yazılı planı hazırlayan kişi / kurum"),
      yaz("kk_periyot", "Katodik koruma izleme · kontrol periyodu"), gun("kk_tarih", "Katodik koruma izleme · kontrol tarihi"),
      gun("kk_sonraki", "Katodik koruma izleme · sonraki kontrol tarihi"), yaz("kk_kurulus", "Katodik koruma izleme · kontrolü yapan kuruluş adı"),
      yaz("kk_kisi", "Katodik koruma izleme · yetkili kişi adı ve kayıt numarası"),
      yaz("ev_periyot", "Emniyet valfi testi / değişimi · kontrol periyodu"), gun("ev_tarih", "Emniyet valfi testi / değişimi · kontrol tarihi"),
      gun("ev_sonraki", "Emniyet valfi testi / değişimi · sonraki kontrol tarihi"),
      yaz("yd_kurulus", "Yeniden değerlendirmeyi yapan kuruluş adı"), yaz("yd_kisi", "Yeniden değerlendirme · yetkili kişi adı ve kayıt numarası"),
      yaz("yd_periyot", "Yeniden değerlendirme periyodu"), gun("yd_tarih", "Yeniden değerlendirme tarihi"), gun("yd_sonraki", "Sonraki yeniden değerlendirme tarihi"),
    ] },
    { id: "foto_tank", ad: "Fotoğraflar (tank / valf grubu genel görünüş · tankın üretici bilgi etiketi)", blok: "foto", kilit: true, numarasiz: true, enAz: 2, enCok: 20 },
    { id: "test_deger", ad: "Test değerleri", blok: "bilgi", kilit: true, alanlar: [say("valf_test", "Emniyet valfi test değeri (bar)")] },
    { id: "cihaz", ad: "Ölçüm aletleri bilgileri", blok: "cihaz", kilit: true },
    liste("kriter", "Muayene kriterleri ve kontroller", [{ id: "pm", ad: "Muayene kriterleri", maddeler: [
        {"id": "pm1", "metin": "Bilgi etiketi, sağlık ve güvenlik işaretleri", "kilit": true, "std": "TS EN 12817:2019 9.1 · TS EN 12819:2019 9.1 · TS 1446:1998 2.2.6.5 – 2.5.5 · TS EN 12542:2020 11 · TS EN 14129:2014 8 · TS EN 13445-5:2021 11.2", "talimat": "** Tank üzerinde tanka ait bilgi etiketi vardır veya tankın bilgilerine esas beyan tank üzerine iliştirilmiştir.\n* Tank bilgi etiketinde gerekli ve yeterli bilgi vardır.\n* Tank sahasında tankın barındırdığı risklere ait sağlık ve güvenlik işaretleri vardır.\n** Emniyet ve/veya basınç tahliye valflerinin bilgi etiketi /işaretlemesi vardır veya emniyet ve/veya basınç tahliye va lflerinin bilgilerine esas beyan emniyet valfi ve/vey a basınç tahliye valflerinin üzerine iliştirilmiştir.\n* Emniyet ve/veya basınç tahliye valflerinin bilgi etiketinde/işaretlemesinde gerekli ve yeterli bilgi vardır.\n* Su kapasitesi 10 m 3 veya daha büyük olan tanklarda, emniyet valfler i sıvı seviye göstergeleri ve manometreler hariç olmak üzere tankın giriş ve çıkış bağlantılarının tamamı etiketlenmiştir. Etiketlerde, bağlantıların sıvı veya gaz fazı ile temas halinde olup olmadığı yazılmıştır.\n* Esnek bağlantılarda kullanılan hortumların üzerinde akışkan türü ve işletme basıncı değeri işaretlemeleri vardır.\n* Bilgi etiketi ve tüm işaretlemeler anlaşılırdır, dikkat çekicidir, okunaklıdır, doğru renktedir ve kolay sökülemeyecek şekilde iliştirilmiştir."},
        {"id": "pm2", "metin": "Yazılı plan", "kilit": true, "std": "TS EN 12817:2019 5 · TS EN 12819:2019 5", "talimat": "** Yazılı plana göre tankın yeniden değerlendirme faaliyetinin gerçekleştirildiği ve sonucunun uygun olduğu görüldü.\n** Yazılı plan standartların ilgili bölümlerini kapsamaktadır.\n** Yazılı plan uygulama ile tutarlıdır.\n** Yazılı plan Bakanlığın yayımladığı dokümanın içeriğini karşılamaktadır."},
        {"id": "pm3", "metin": "Yerleşim", "kilit": true, "std": "TS 11939 4.1 · TS 1446:1998 2.1.1 – 2.1.2 – 2.1.3 – 2.1.4 – 2.1.8 – 2.1.9 – 2.1.10 – 2.2.6.3 – 2.5.6", "talimat": "** Tank en yakın tanka, binalara veya bina gruplarına, komşu arsa sınırına, ana trafik yollarına veya demir yollarına, enerji nakil hatlarına gerekli mesafededir. (Kullanılacak ölçüm cihazı: Mesafe ölçüm cihazları)\n** Tanklar üst üste yerleştirilmemiştir.\n* Tankların çevresinde gerekli mesafede kuru ot vb. bulunmamaktadır. (Kullanılacak ölçüm cihazı: Mesafe ölçüm cihazları)\n** Tanklar ve tesisatları (yer üstü, yer altı, kısmi yer altı vb.) dışarıdan gelebilecek mekanik darbe riskine (araç, endüstriyel araç vb.) karşı korunmuştur.\n** Tank donanımlarına işletme sürecinde rahatlıkla erişilebilmektedir.\n* Örtülü (kaplanmış) tanklarda örtü malzemesi toprak veya dere kumu veya ısıya dayanıklı özel malzemelerdir ve örtü malzemesi toprak veya dere kumu ise yüksekliği uygundur. (Kullanılacak ölçüm cihazı: Mesafe ölçüm cihazları)\n* Yer altı tankların üst yüzeyi zemin seviyesinden gerekli mesafede aşağı yerleştirilmiştir. (Kullanılacak ölçüm cihazı: Mesafe ölçüm cihazları)\nNot: TSE Hizmet Yeri Yeterlilik Belgesi olan işletmeler için yerleşim maddesi uygulanmayacaktır."},
        {"id": "pm4", "metin": "Tank yüzeyleri ve tank üzerinde işlemler", "kilit": true, "std": "TS EN 12817:2019 7.1 – Ek A.1 · TS EN 12819:2019 7.1 – Ek A.1 · TS 1446 2.1.2.1.5 – 2.1.2.1.6", "talimat": "** Gözle muayeneler için dış yüzeyler temiz, kuru ve yabancı maddelerden arındırılmıştır.\n** Kusurları gölge aracılığıyla göstermek üzere, tankın yüzeyi boyunca ışık yönlendirilmiştir.\n** Kusurların ölçüsünü belirleyebilmek için kusur yüzeyi boyunca mastar yerleştirilmiştir.\n** Korozyon, çentik ve oluk derinliği ölçülm üştür. (Kullanılacak ölçüm cihazı: Derinlik ölçme cihazı vb.)\n** Kusurların ayrıntılı incelenmesi için gerektiğinde büyüteç ve ayna kullanılmıştır.\n** Tankın basınçlı kısımları üzerinde tamir kaynağı işlemlerinin (ağız, manşon, takviye plakası, mapa vb.) olması durumunda yetkili kuruluşun onayı vardır.\n** Tankın basınçlı kısımları üzerinde dizayn projesi haricinde sonradan ilave edilmiş ek plaka kaynağı yoktur.\n** Dış yüzeylerde korozyon, çatlak, çöküntü, oluk, laminasyon, tümsek, eğilme vb. deformasyon yoktur.\n* Dış yüzeylerde boya dökülmesi veya çatlaması yoktur.\n** Dış yüzeylerde görülen deformasyonlar değerlendirilmiş, gerekirse ilave muayene teknikleri talep edilmiş ve sonuçlarının uygun olduğu görülmüştür.\n* Kaplamada herhangi bir deformasyon yoktur.\n** El, baş, adam vb. gözetleme açıklıklarında herhangi bir çözülme ve deformasyon yoktur.\nNot: Tanklarda pasif yangın önleme sistemi varsa, gözle muayene yöntemlerinin uygulanması uygun değildir.\nNot: Yer altı tanklarda kontrol sadece görülebilir yüzeyler için gerçekleştirilir."},
        {"id": "pm5", "metin": "Tank bağlantı parçaları", "kilit": true, "std": "TS EN 12817:2019 7.2 · TS EN 12819:2019 7.2 · TS 1446:1998 2.5.5 – 2.5.6 2.5.9.2", "talimat": "** Tank üzerindeki doldurma vanası /vanaları üzerinde korozyon, çatlak vb. deformasyon yoktur.\n** Tank üzerindeki doldurma vanası/vanaları dişlerinde ve bağlantılarında deformasyon yoktur.\n** Sıvı alma vanası/vanaları üzerinde korozyon, çatlak vb. deformasyon yoktur.\n** Sıvı alma vanası/vanaları dişlerinde ve bağlantılarında deformasyon yoktur.\n** Kapatma vanası/vanaları üzerinde korozyon, çatlak vb. deformasyon yoktur.\n** Kapatma vanası/vanaları dişlerinde ve bağlantılarında deformasyon yoktur.\n** Boşaltma vanası/vanaları üzerinde korozyon, çatlak vb. deformasyon yoktur.\n** Boşaltma vanası/vanaları dişlerinde ve bağlantılarında deformasyon yoktur.\n** Multi valf üzerinde korozyon, çatlak vb. deformasyon yoktur.\n** Tank üzerindeki flanş/flanşlarda korozyon, çatlak vb. deformasyon yoktur.\n* Tank üzerindeki flanş/flanşlar eş merkezlidir.\n* Tank üzerindeki flanş cıvataları eksik değildir.\n* Tank üzerindeki flanş cıvatalarında deformasyon yoktur.\nNot: Pul pul dökülme ve/veya yüzeyde çukurlaşma veya her ikisinin bir kombinasyonu nun görülmediği, yüzey oksidasyonunun silinerek temizlenebildiği başlangıç seviyesinde olan korozyon ile ilgili tespitlerde yukarıdaki kontrol kriterleri hafif kusur (*) olarak değerlendirilir."},
        {"id": "pm6", "metin": "Topraklama bağlantısı (Yer üstü tanklar için)", "kilit": true, "std": "TS EN 12817:2019 7.4.1 · TS EN 12819:2019 7.4.1 · TS EN 14570:2014 5.15", "talimat": "** Tank ile topraklama noktası arasındaki topraklama kablosunda kopukluk ve deformasyon yoktur, topraklama sürekliliği sağlanmaktadır."},
        {"id": "pm7", "metin": "Basınç ölçüm cihazı (manometre)", "kilit": true, "std": "TS EN 12817:2019 7.6 · TS EN 12819:2019 7.6 · TS 1446:1998 2.2.6.6 – 2.2.6.7", "talimat": "** Su kapasitesi 10 m 3’ten büyük tanklarda b asınç ölçüm cihazı (manometre /manometreler) vardır.\n* Manometre uygulamasının olması durumunda manometrenin/manometrelerin d oğru gösterdiği doğrulanmıştır veya yenilenmiştir.\n* Manometre uygulamasının olması durumunda manometrenin/manometrelerin s kala ve boyut büyüklüğü uygundur ve okunabilirdir.\n* Manometre uygulamasının olması durumunda manometrede/manometrelerde deformasyon yoktur.\n* Manometre uygulamasının olması durumunda manometre/manometreler ile t ank arasına kapatma valfi monte edilmiştir ve çalışır durumdadır."},
        {"id": "pm8", "metin": "Seviye göstergeleri", "kilit": true, "std": "TS EN 12817:2019 7.7 · TS EN 12819:2019 7.7", "talimat": "** Seviye göstergesi/göstergeleri çalışır durumdadır."},
        {"id": "pm9", "metin": "Kapatma vanaları", "kilit": true, "std": "TS EN 12819:2019 7.8 – 7.14 · TS 1446:1998 2.2.6.1.1 – 2.2.6.1.2", "talimat": "* Hidrolik kumandalı emniyet valfleri uygulamasının olması durumunda hidrolik kumandalı emniyet valfleri, kapatma vanaları ile tank arasına yerleştirilmiştir.\n* Mekanik kapatma vanaları tanka mümkün olduğu kadar yakın bir konumda yerleştirilmiştir ve ulaşılabilecek konumdadır."},
        {"id": "pm10", "metin": "Yer üstü tanklar için saplamalar, cıvatalar, somunlar ve pullar", "kilit": true, "std": "TS EN 12817:2019 7.9 · TS EN 12819:2019 7.9", "talimat": "* Saplamalarda korozyon, çatlak, eğilme vb. deformasyon yoktur.\n* Cıvatalarda korozyon, çatlak, eğilme vb. deformasyon yoktur.\n* Somunlarda korozyon, çatlak, eğilme vb. deformasyon yoktur.\n* Pullarda korozyon, çatlak, eğilme vb. deformasyon yoktur."},
        {"id": "pm11", "metin": "Yer üstü tanklar için ayaklar ve zeminler", "kilit": true, "std": "TS EN 12817:2019 7.11 · TS EN 12819:2019 7.16 · TS 1446:1998 2.1.3 – 2.1.4", "talimat": "** Ayaklarda korozyon, çatlak, eğilme vb. deformasyon yoktur.\n** Ayak bağlantılarında çözülme yoktur.\n** Tank kapasitesine ve türüne göre uygun (çelik veya beton) zemin ve ayak tipi kullanılmaktadır.\n** Zeminde çökme ve/veya dengesiz oturma yoktur."},
        {"id": "pm12", "metin": "Sıcaklık göstergesi", "kilit": true, "std": "TS EN 12819:2019 7.13", "talimat": "* Sıcaklık göstergesinde/göstergelerinde deformasyon ve bağlantılarında çözülme yoktur.\n* Sıcaklık göstergesi/göstergeleri okunaklıdır.\n* Sıcaklık göstergesi çalışır durumdadır.\n* Sıcaklık göstergesinin kalibrasyon veya doğrulama belgesi mevcuttur."},
      ] }, { id: "pk", ad: "Kontroller", maddeler: [
        {"id": "pk1", "metin": "Emniyet valfi/valfleri kontrolü, testi veya yeni/yenilenmiş bir valf ile değişimi", "kilit": true, "std": "TS EN 12817:2019 7.5.1 – 7.5.2 – 7.5.3 · TS EN 12819:2019 7.5.1 – 7.5.2 – 7.5.3 – 7.5.4 · TS 1446:1998 2.1.2.3-2.2", "talimat": "** Emniyet valfi/valfleri vardır.\n** Emniyet valfi/valfleri yayında korozyon vb. deformasyon yoktur. (Emniyet valfi için test seçeneğinin kullanılması durumunda)\n** Tanka doğrudan bağlıdır ve montajı doğrudur.\n** Gaz fazı ile temasta olacak şekilde tankın en üst seviyesindedir.\n** Emniyet valfi üzerinde korozyon, çatlak vb. deformasyon yoktur.\n** Emniyet valfinin en geç 5 yılda bir yeni bir valf ile değiştirildiği veya yenilendiği (sertifika tarihinin geçerli olduğu kontrol edilmiştir) veya test edildiği ve uygun olduğu görülmüştür.\n** Emniyet valfi/valfleri ayar basıncında tahliyeyi gerçekleştirmekte ve tam açma konumuna geçebilmektedir. (Emniyet valfi için test seçeneğinin kullanılması durumunda, Kullanılacak ölçüm cihazı: Manometre)\n** Tahliyenin gerçekleşmesinden sonra emniyet valfi/valfleri kapanmaktadır. (Emniyet valfi için test seçeneğinin kullanılması durumunda, Kullanılacak ölçüm cihazı: Manometre)\n** Tankla emniyet valfi/valfleri arasında kapanma ihtimali olan herhangi bir parça yoktur.\n* Boşaltma yolu temiz ve açıktır.\n* Boşaltma yolu nda korozyon yoktur. (Korozyon olması durumunda emniyet valfi korozyona karşı kontrol edilmelidir.)\n* Kapak (yağmur kepi) vardır ve üzerinde herhangi bir deformasyon yoktur.\n** Su kapasitesi, 120 m 3 veya daha yüksek olan tankların emniyet valfinin periyodik bakımı sırasında, tankı devre dışı bırakmamak için emniyet valfi çok ağızlı veya birden fazladır.\n** Çok ağızlı emniyet valfi mekanizmasında deformasyon ve bağlantılarında çözülme yoktur ve çalışır durumdadır.\n* Su kapasitesi 10 m 3'den fazla olan yerüstü tanklarının her birinde, emniyet valfi çıkışları, dikey konumda monte edilmiş ve atmosfere engelsiz durumda açılmıştır. Bu valflerin deşarj kısmının dikey doğrultusunda tankın üst kısmından uygun mes afede herhangi bir engel bulunmamaktadır. (Kullanılacak ölçüm cihazı: Mesafe ölçüm cihazları)\n* Su kapasitesi 10 m 3'den fazla olan yeraltı tanklarında, emniyet valfi ağzı, dikey doğrultuda ve zemin seviyesinden uygun yüksekliğe kadar uzatılmıştır ve dışarıdan gelebilecek mekanik darbe riskine karşı korunmuştur. (Kullanılacak ölçüm cihazı: Mesafe ölçüm cihazları)"},
        {"id": "pk2", "metin": "Sızıntı kontrolü", "kilit": true, "std": "TS EN 12817:2019 4.3 – 6.3.3 – 7.2 – 7.8 · TS EN 12819:2019 4.3 – 6.4 – 7.2 – 7.8", "talimat": "** Tank üzerindeki doldurma vanasında/vanalarında sızıntı yoktur.\n** Tank üzerindeki sıvı alma vanasında/vanalarında sızıntı yoktur.\n** Tank üzerindeki kapatma vanasında/vanalarında sızıntı yoktur.\n** Tank üzerindeki boşaltma vanasında/vanalarında sızıntı yoktur.\n** Tank üzerindeki multi valfte sızıntı yoktur.\n** Tank üzerindeki flanş/flanşlarda sızıntı yoktur.\n** Tank üzerindeki seviye göstergesinde/göstergelerinde deformasyon ve sızıntı yoktur.\n** Tank üzerindeki körlenmiş ve tapalı sıvı faz vanalarında sızıntı yoktur.\nNot: Kontrol içeriğinde belirtilen kriterler ekipmanın kullanım yeri, kullanım amacı, tip ve modellerine vb. göre değişkenlik gösterebilmektedir. İlgili imalat mevzuatı ve/veya standardı baz alınarak ekipmanda belirtilen risklerin bulunmadığı durumda kontrol k riterleri aranmayacaktır. Kontrol içeriğinde belirtilen kriterin o ekipmanda aranıp aranmayacağı ile ilgili karar standart maddesi bölümünde atıf yapılan mevzuat ve/veya standart ma ddelerine dikkat edilerek verilmelidir. Belirtilen kriterin ekipmanın hangi tipinde, modelinde, imal yılında vb. olması gerektiği mevzuat ve/veya standart maddelerine göre değerlendirilmelidir. Kriterin kontrol içeriğinde bulunması her ekipman için zorunlu olarak aranacak kriter anlamına gelmemektedir.\nNot: Bu doküman tanklara yönelik yangın söndürme sistemlerine ilişkin herhangi bir değerlendirme içermez.\nNot: Tek yıldız (*) hafif, iki yıldız (**) ağır kusuru ifade etmektedir. Hafif kusurlar bir sonraki periyodik kontrol tarihine kadar giderilir. Bir sonraki periyodik kontrol tarihinde düzeltilmemiş hafif kusurlar ağır kusur olarak değerlendirilir. Ağır kusur tespit edilen ekipmanlar ise tespit edil en kusurlar giderilmeden çalıştırılamaz."},
        {"id": "pk3", "metin": "Yer altı tankları için katodik koruma izleme", "kilit": true, "std": "TS EN 12817:2019 7.10 · TS EN 12819:2019 7.15 · TS 1446:1998 2.1.8.4 – 2.1.9.3 – 2.1.10.1", "talimat": "** Yazılı planda belirtilen katodik koruma izleme verileri kontrol edilmektedir ve gerektiğinde düzeltici faaliyetler yapılmıştır.\n** Katodik koruma izleme ölçümü periyodik kontrol yapmaya yetkili kişi tarafından yapılmıştır.\n** Katodik koruma izleme raporunda sarf (kurbanlık) anotla katodik koruma izlemesinin etkin olduğu ve anotların kalan ömür süresinin yeterli olduğunun belirtildiği görülmüştür.\n** Katodik koruma izleme raporunda dış akım kaynaklı katodik koruma izlenmesi için ölçülen değerlerin sınır değerler ile karşılaştırıldığı ve değerlendirildiği görülmüştür."},
      ] }]),
    ...mekanikSon("Periyodik muayene tarihi itibari ile yukarıda teknik özellikleri belirtilen sıvılaştırılmış petrol gazı depolama tankının mevcut şartlar altında kullanımı", [
      "Tespit edilen hafif kusurların bir sonraki periyodik muayene tarihine kadar giderilmesi gereklidir. (Sadece hafif kusur tespit edilmesi durumunda yazılacaktır.)",
      "Notlar: Katodik koruma izleme raporu vb. raporlar bu raporun ekidir. · TSE Hizmet Yeterlilik Belgesi olan işletmeler için yerleşim maddesi uygulanmamaktadır.",
      "Dipnotlar: 1. Sonraki yeniden değerlendirme tarihi yazılı plana göre ve yeniden değerlendirme faaliyetindeki testlerin en eski tarihlisine göre belirlenir. 2. " + LPG_DIPNOT_BASINC
        + " 3. Emniyet valfi test değeri, valf için test seçeneği kullanıldıysa doldurulur. 4. Ölçüm aleti bilgisi bu testte kullanılan manometreye aittir; katodik koruma izlemede kullanılan aletler kendi raporunda belirtilir.",
    ].join("\n"), false),
  ],
};

/* ── ZYDR01 · LPG TANKI YETERLİLİĞİN YENİDEN DEĞERLENDİRİLMESİ ── */
const ZYDR01: FormatGirdisi = {
  sema: 1,
  gorunum: {
    formKodu: "ZYDR01", baslik: "Sıvılaştırılmış Petrol Gazı (LPG) Tankı Yeterliliğin Yeniden Değerlendirilmesi Raporu", dayanak: [IS_EKIPMAN],
    talimat: [
      "Yeterliliğin yeniden değerlendirilmesi en fazla 10 yılda bir yapılır; her tank ayrı değerlendirilir, örnekleme yapılmaz (AA01). Kriterler: ZYDK01. " + KUSUR_ATIF,
      "Test grupları: 1 — gözle iç muayene, hidrostatik test, akustik emisyon, ultrasonik kalınlık; 2 — gözle dış muayene, katodik koruma izleme.",
      "Rapor tipi: kurulum tamamlanmadan kısmen yapılan testlerde “Ön”, sonunda “Nihai”. Ön rapora istinaden ekipman kullanıma alınamaz. Nihai rapor başka kuruluşça hazırlanırsa ön rapora notlarda atıf yapılır, ön rapor eke konur.",
    ].join("\n"),
  },
  kurallar: DERECELI,
  bolumler: [
    firma(true),
    { id: "ekipman", ad: "Ekipman bilgileri", blok: "bilgi", kilit: true, tam: true, alanlar: [
      sec("rapor_tipi", "Rapor tipi", ["Ön", "Nihai"]), ...LPG_TANK(), ...LPG_VALF(),
      say("isletme", "İşletme basıncı (bar)"), sec("yerlesim", "Yerleşim türü", ["Yer altı", "Yer üstü"]), sec("tank_tipi", "Tank tipi", ["Küresel", "Silindirik"]),
      sec("durumu", "Durumu", ["Kullanımda", "Servis alanında"]), bagli("e_konum", "Kullanım yeri ve amacı", "konum"), yaz("valf_sayi", "Emniyet valfi sayısı ve tipi"),
    ] },
    { id: "foto_tank", ad: "Fotoğraflar (tank / valf grubu genel görünüş · tankın üretici bilgi etiketi)", blok: "foto", kilit: true, numarasiz: true, enAz: 2, enCok: 20 },
    { id: "test_deger", ad: "Test değerleri", blok: "bilgi", kilit: true, alanlar: [
      say("hidro", "Hidrostatik test değeri (bar)"), say("valf_test", "Emniyet valfi test değeri (bar)"),
      gun("t_ic", "Gözle iç muayene · test tarihi"), gun("t_dis", "Gözle dış muayene · test tarihi"), gun("t_hidro", "Hidrostatik test · test tarihi"),
      gun("ae_tarih", "Akustik emisyon · test tarihi"), yaz("ae_kurulus", "Akustik emisyon · testi yapan kuruluş adı"),
      yaz("ae_kisi", "Akustik emisyon · testi yapan kişi adı ve NDT sertifika no / seviye"),
      gun("uk_tarih", "Ultrasonik kalınlık kontrolleri · test tarihi"), yaz("uk_kurulus", "Ultrasonik kalınlık kontrolleri · testi yapan kuruluş adı"),
      yaz("uk_kisi", "Ultrasonik kalınlık kontrolleri · testi yapan kişi adı ve NDT sertifika no / seviye"),
      gun("kk_tarih", "Katodik koruma izleme · test tarihi"), yaz("kk_kurulus", "Katodik koruma izleme · testi yapan kuruluş adı"),
      yaz("kk_kisi", "Katodik koruma izleme · yetkili kişi adı ve kayıt numarası"),
    ] },
    { id: "cihaz", ad: "Ölçüm aletleri bilgileri", blok: "cihaz", kilit: true },
    liste("kriter", "Yeniden değerlendirme test bilgileri ve kontroller", [{ id: "yk", ad: "Kontroller", maddeler: [
        {"id": "yk1", "metin": "Yer üstü tanklar için saplamalar, cıvatalar, somunlar ve pullar", "kilit": true, "std": "TS EN 12817:2019 7.9 · TS EN 12819:2019 7.9", "talimat": "** Saplamalarda korozyon, çatlak, eğilme vb. deformasyon yoktur.\n** Cıvatalarda korozyon, çatlak, eğilme vb. deformasyon yoktur.\n** Somunlarda korozyon, çatlak, eğilme vb. deformasyon yoktur.\n** Pullarda korozyon, çatlak, eğilme vb. deformasyon yoktur."},
        {"id": "yk2", "metin": "Emniyet valfi/valfleri testi veya yeni/yenilenmiş bir valf ile değişimi", "kilit": true, "std": "TS EN 12817:2019 6.3.1 – 6.3.2 – 7.5.1 · TS EN 12819:2019 6.3.1 – 6.3.2 – 7.5.1", "talimat": "** Emniyet valfinin en geç 5 yılda bir yeni bir valf ile değiştirildiği veya yenilendiği (sertifika tarihinin geçerli olduğu kontrol edilmiştir) veya test edildiği ve uygun olduğu görülmüştür.\n** Emniyet valfi için test seçeneğinin kullanılması durumunda; emniyet valfi/valfleri ayar basıncında tahliyeyi gerçekleştirmekte ve tam açma konumuna geçebilmektedir. (Kullanılacak ölçüm cihazı: Manometre)\n** Emniyet valfi için test seçeneğinin kullanılması durumunda; t ahliyenin gerçekleşmesinden sonra emniyet valfi /valfleri kapanmaktadır. (Kullanılacak ölçüm cihazı: Manometre)"},
      ] }, { id: "yt", ad: "Testler", maddeler: [
        {"id": "yt1", "metin": "Gözle iç muayene (test grubu 1)", "kilit": true, "std": "TS EN 12817:2019 6.3.1 – 6.3.2 – Ek A.1 – Ek A.2.2 · TS EN 12819:2019 6.3.1 – 6.3.2 – Ek A.1 – Ek A.2.2", "talimat": "** Gözle muayeneler için iç yüzeyler temiz, kuru ve yabancı maddelerden arındırılmıştır.\n** Kusurların tespiti için endoskop vb. görüntüleme cihazları kullanılmış ve tankın tüm iç yüzeyi görüntülenmiştir.\n** Kusurları gölge aracılığıyla göstermek üzere, tankın yüzeyi boyunca ışık yönlendirilmiştir. (Tank içerisine girilebiliyorsa)\n** Kusurların ölçüsünü belirleyebilmek için yüzey boyunca mastar yerleştirilmiştir. (Tank içerisine girilebiliyorsa)\n** Korozyon, çentik ve oluk derinliği ölçülmüştür. (Tank içerisine girilebiliyorsa, Kullanılacak ölçüm cihazı: Derinlik ölçme cihazı vb.)\n** Kusurların ayrıntılı incelenmesi için gerektiğinde büyüteç ve ayna kullanılmıştır. (Tank içerisine girilebiliyorsa)\n** İç yüzeylerde korozyon, çatlak, çöküntü, oluk, laminasyon, tümsek, eğilme vb. deformasyon yoktur.\n** İç yüzeylerde görülen deformasyonlar değerlendirilmiş ve gerekirse ilave muayene teknikleri talep edilmiştir."},
        {"id": "yt2", "metin": "Gözle dış muayene (test grubu 2)", "kilit": true, "std": "TS EN 12817:2019 6.3.1 – 6.3.2 – Ek A.1 – Ek A.2.1 · TS EN 12819:2019 6.3.1 – 6.3.2 – Ek A.1 – Ek A.2.1", "talimat": "** Gözle muayeneler için dış yüzeyler temiz, kuru ve yabancı maddelerden arındırılmıştır.\n** Kusurları gölge aracılığıyla göstermek üzere, tankın yüzeyi boyunca ışık yönlendirilmiştir.\n** Kusurların ölçüsünü belirleyebilmek için kusur yüzeyi boyunca mastar yerleştirilmiştir.\n** Korozyon, çentik ve oluk derinliği ölçülmüştür. (Kullanılacak ölçüm cihazı: Derinlik ölçme cihazı vb.)\n** Kusurların ayrıntılı incelenmesi için gerektiğinde büyüteç ve ayna kullanılmıştır.\n** Tankın basınçlı kısımları üzerinde tamir kaynağı işlemlerinin (ağız, manşon, takviye plakası, mapa vb.) olması durumunda yetkili kuruluşun onayı vardır.\n** Tankın basınçlı kısımları üzerinde dizayn projesi haricinde sonradan ilave edilmiş ek plaka kaynağı yoktur.\n** Dış yüzeylerde korozyon, çatlak, çöküntü, oluk, laminasyon, tümsek, eğilme vb. deformasyon yoktur.\n* Dış yüzeylerde boya dökülmesi veya çatlaması yoktur.\n** Dış yüzeylerde görülen deformasyonlar değerlendirilmiş, gerekirse ilave muayene teknikleri talep edilmiş ve sonuçlarının uygun olduğu görülmüştür.\n* Kaplamada herhangi bir deformasyon yoktur.\n** El, baş, adam vb. gözetleme açıklıklarında herhangi bir çözülme ve deformasyon yoktur.\nNot: Tanklarda pasif yangın önleme sistemi varsa, gözle muayene yöntemlerinin uygulanması uygun değildir.\nNot: Yer altı tanklarda kontrol sadece görülebilir yüzeyler için gerçekleştirilir."},
        {"id": "yt3", "metin": "Hidrostatik test (test grubu 1)", "kilit": true, "std": "TS EN 12817:2019 6.3.1 – 6.3.2 – Ek B · TS EN 12819:2019 6.3.1 – 6.3.2 – Ek B · TS 1446:1998 T4: Nisan 2011 2.7.2", "talimat": "** Tank üzerindeki tüm bağlantılar sökülmüş ve/veya körlenmiştir.\n** Test akışkanı olarak su veya üretici tarafından uygun görülen sıvı kullanılmıştır.\n** Test akışkanı sıcaklığı 7 ˚C’un altına düşmemiştir.\n** Tanka test basıncı uygulanmadan önce hava ceplerinin oluşumunu önlemek için tankın havası uygun bir şekilde alınmalıdır.\n** Tank içindeki basınç kademeli olarak tankın bilgi etiketinde belirtilen test basıncına kadar arttırılmış ve test pompasından ayrılmıştır. (Kullanılacak ölçüm cihazı: Manometre)\n** Test işlemi 10 dakikadan az olmayacak şekilde gerçekleştirilmiştir.\n** Yakın inceleme için tank basıncı izin verilen maksimum basınç veya altına düşürülmüştür.\n** Tankın üretici bilgi etiketi veya belgeleme üzerinde belirtilen basınç değerinde basınç uygulanarak gerçekleştirildi, kalıcı uzama, deformasyon ve sızıntı yoktur. (Kullanılacak ölçüm cihazları: Manometre ve Şerit metre)\nNot: Kontrol içeriğinde belirtilen kriterler ekipmanın kullanım yeri, kullanım amacı, tip ve modellerine vb. göre değişkenlik gösterebilmektedir. İlgili imalat mevzuatı ve/veya standardı baz alınarak ekipmanda belirtilen risklerin bulunmadığı durumda kontrol kriterleri aranmayacaktır. Kontrol içeriğinde belirtilen kriterin o ekipmanda aranıp aranmayacağı ile ilgili karar standart maddesi bölümünde atıf yapılan mevzuat ve/veya standart ma ddelerine dikkat edilerek verilmelidir. Belirtilen kriterin ekipmanın hangi tipinde, modelinde, imal yılında vb. ol ması gerektiği mevzuat ve/veya standart maddelerine göre değerlendirilmelidir. Kriterin kontrol içeriğinde bulunması her ekipman için zorunlu olarak aranacak kriter anlamına gelmemektedir.\nNot: Bu doküman tanklara yönelik yangın söndürme sistemlerine ilişkin herhangi bir değerlendirme içermez.\nNot: İki yıldız (**) ağır kusuru ifade etmektedir. Ağır kusur tespit edilen ekipmanlar tespit edilen kusurlar giderilmeden çalıştırılamaz."},
        {"id": "yt4", "metin": "Akustik emisyon (test grubu 1)", "kilit": true, "std": "TS EN 12817:2019 6.3.1 – 6.3.2 – Ek C · TS EN 12819:2019 6.3.1 – 6.3.2 – Ek C", "talimat": "** Akustik emisyon testini geçekleştiren ve sonuçları değerlendiren kişi TS EN ISO 9712’ye göre en az Akustik Test (AT) seviye 2’dir.\n** Akustik emisyon r aporunda akustik emisyon testinin TS EN 12817 veya TS EN 12819 Ek C’de belirtilen kriterlere göre gerçekleştirildiği beyan edilmiştir.\n** Akustik emisyon r aporunda tank kimlik bilgileri, test tarihi, test basıncı, basınçlandırma oranı, basınçlı kap derecelendirmesi (13 m 3 üstü tanklar için), değerlendirme katsayısı ve tanımlanmış yüksek akustik patlama sayılarının aşılması durumunda yüksek ve düşük tepe genlik değerlerinden yüksek olan akustik emisyon olaylarının sayısı vardır.\n** Akustik emisyon r aporunda tankın basınçlandırma değerinin, son hizmet süresi içinde ulaşılan en yüksek işletme basıncının en az %10 daha fazlası olduğu görülmüştür.\n** Akustik emisyon raporunda sensörlerin tankın boyutlarına, kaplama durumuna vb. dikkat edilerek gerekli sayıda ve mesafede yerleştirilmiş olduğu bilgisi (yazılı veya görsel) vardır.\n** Akustik emisyon r aporunda akustik emisyon kaynaklarının sınıflandırılmasında aktif veya çok aktif kaynağın olmadığı, sadece minör kaynakların olduğu görülmelidir."},
        {"id": "yt5", "metin": "Ultrasonik kalınlık kontrolleri (test grubu 1)", "kilit": true, "std": "TS EN 12817:2019 6.3.1 – 6.3.2 – Ek D · TS EN 12819:2019 6.3.1 – 6.3.2 – Ek D", "talimat": "** Ultrasonik kalınlık ölçümünü geçekleştiren ve sonuçları değerlendiren kişi TS EN ISO 9712’ye göre en az Ultrasonik Kalınlık Ölçümü seviye 2’dir.\n** Ultrasonik kalınlık ölçüm r aporunda ultrasonik kalınlık ölçümünün TS EN 128 17 veya TS EN 12819 Ek D’de belirtilen kriterlere göre gerçekleştirildiği beyan edilmiştir.\n** Ultrasonik kalınlık ölçüm raporunda gövde ve bombeler üzerinde gerekli sayıda ve mesafede ölçümlerin alınmış, bu ölçümlerin tank üzerinde hangi noktalardan alındığı raporda şematik bir çizim ile belirtilmiş ve kontrol ölçüm değerleri yazılmıştır.\n** Ultrasonik kalınlık ölçüm raporunda yer alan minimum gövde ve bombe kalınlıkları tankın tasarım değerlerinde belirtilen değerlerden (korozyon payı vb.) yüksektir.\n** Ultrasonik kalınlık ölçüm raporunda t ankın imalatındaki kalınlık ile mevcut minimum kalınlığı değerlendirilerek bulunan korozyon hızına göre ileriki yeterliliğin yeniden değerlendirme süresine yönelik tavsiye verilmiştir."},
        {"id": "yt6", "metin": "Yer altı tankları için katodik koruma izleme (test grubu 2)", "kilit": true, "std": "TS EN 12817:2019 6.3.2 – 7.10 – Ek G – Ek H · TS EN 12819:2019 6.3.2 – 7.15 – Ek E – Ek F", "talimat": "** Yazılı planda belirtilen katodik koruma izleme verileri kontrol edilmektedir ve gerektiğinde düzeltici faaliyetler yapılmıştır.\n** Katodik koruma izleme ölçümü periyodik kontrol yapmaya yetkili kişi tarafından yapılmıştır.\n** Katodik koruma izleme raporunda sarf (kurbanlık) anotla katodik koruma izlemesinin etkin olduğu ve anotların kalan ömür süresinin yeterli olduğunun belirtildiği görülmüştür.\n** Katodik koruma izleme raporunda dış akım kaynaklı katodik koruma izlenmesi için ölçülen değerlerin sınır değerler ile karşılaştırıldığı ve değerlendirildiği görülmüştür."},
      ] }]),
    ...mekanikSon("Yukarıda teknik özellikleri belirtilen sıvılaştırılmış petrol gazı depolama tankının yeniden değerlendirme sonucu", [
      "Ön rapor sonuç cümlesi: “Yukarıda teknik özellikleri belirtilen sıvılaştırılmış petrol gazı depolama tankının kısmen gerçekleştirilen test sonuçlarının uygun olduğu, testlere tankın kurulumu tamamlandıktan sonra devam edilmesi gerektiği firma yetkilisine bildirilmiştir/uygun olmadığı firma yetkilisine bildirilmiştir. Ön rapor sonucuna istinaden iş ekipmanı kullanıma alınamaz.”",
      "Notlar: Akustik emisyon testi, ultrasonik kalınlık kontrolleri, katodik koruma izleme vb. raporlar bu raporun ekidir. · Yeterliliğin yeniden değerlendirilmesi sonrası tankın ilk defa kullanılmadan önce İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği gereğince muayenesi gerçekleştirilmelidir. · Bu rapor seri olarak imal edilen basınçlı kapların örnekleme yolu ile yeniden değerlendirilmesini kapsamaz. · 13 m³ üstü tanklarda TS EN 12819'un 7.10 Acil durum valfleri ve 7.11 Contalar maddeleri bu kontrol sürecinin parçası olmayıp tankı işleten firmanın sorumluluğundadır.",
      "Dipnotlar: 1. Nihai rapor ön raporu hazırlayan kuruluştan başka bir kuruluşça hazırlanırsa ön rapora notlarda atıf yapılır ve rapor eke iliştirilir. 2. " + LPG_DIPNOT_BASINC
        + " 3. Test değerleri, hidrostatik test ve/veya emniyet valfi için test seçeneği kullanıldıysa doldurulur. 4. Ölçüm aleti bilgisi bu testlerde kullanılan manometreye aittir; akustik emisyon, ultrasonik kalınlık ve katodik koruma izlemede kullanılan aletler kendi raporlarında belirtilir.",
    ].join("\n"), false),
  ],
};

export interface SablonKaydi {
  ad: string; tanim: FormatTanimi; bakanlik: boolean; kriter: string | null;
  tur: { ad: string; kod: string; grup: string; periyot: number };
}
const elektrik = (ad: string, kod: string) => ({ ad, kod, grup: "elektrik", periyot: 12 });
/** kitaplık: anahtar → şablon */
export const SABLONLAR: Readonly<Record<string, SablonKaydi>> = Object.freeze({
  ZPKR01: { ad: "AG topraklama (ZPKR01, Bakanlık)", tanim: FormatTanimi.parse(ZPKR01), bakanlik: true, kriter: "ZPKK01", tur: elektrik("Alçak gerilim topraklama tesisatı", "AGT") },
  ZPKR02: { ad: "Elektrik iç tesisatı (ZPKR02, Bakanlık)", tanim: FormatTanimi.parse(ZPKR02), bakanlik: true, kriter: "ZPKK02", tur: elektrik("Elektrik iç tesisatı", "EIT") },
  ZPKR03: { ad: "Yıldırımdan korunma tesisatı (ZPKR03, Bakanlık)", tanim: FormatTanimi.parse(ZPKR03), bakanlik: true, kriter: "ZPKK03", tur: elektrik("Yıldırımdan korunma tesisatı", "YKT") },
  ZPKR04: { ad: "Yangın algılama ve uyarı sistemi (ZPKR04, Bakanlık)", tanim: FormatTanimi.parse(ZPKR04), bakanlik: true, kriter: "ZPKK04", tur: elektrik("Yangın algılama ve uyarı sistemi", "YAS") },
  ZPKR05: { ad: "Trafo (ZPKR05, Bakanlık)", tanim: FormatTanimi.parse(ZPKR05), bakanlik: true, kriter: "ZPKK05", tur: elektrik("Trafo", "TRF") },
  ZPKR06: { ad: "Kule kren (ZPKR06, Bakanlık)", tanim: FormatTanimi.parse(ZPKR06), bakanlik: true, kriter: "ZPKK06", tur: { ad: "Kule kren", kod: "KKR", grup: "kaldirma", periyot: 12 } },
  ZPKR07: { ad: "Asılı erişim donanımı (ZPKR07, Bakanlık)", tanim: FormatTanimi.parse(ZPKR07), bakanlik: true, kriter: "ZPKK07", tur: { ad: "Asılı erişim donanımı", kod: "AED", grup: "kaldirma", periyot: 12 } },
  ZPMR01: { ad: "LPG tankı periyodik muayene (ZPMR01, Bakanlık)", tanim: FormatTanimi.parse(ZPMR01), bakanlik: true, kriter: "ZPMK01", tur: { ad: "LPG tankı", kod: "LPG", grup: "basincli", periyot: 12 } },
  ZYDR01: { ad: "LPG tankı yeterliliğin yeniden değerlendirilmesi (ZYDR01, Bakanlık)", tanim: FormatTanimi.parse(ZYDR01), bakanlik: true, kriter: "ZYDK01",
    tur: { ad: "LPG tankı yeniden değerlendirme", kod: "LPY", grup: "basincli", periyot: 120 } },
  KOMPRESOR: { ad: "Kompresör (genel)", tanim: FormatTanimi.parse(KOMPRESOR), bakanlik: false, kriter: null, tur: { ad: "Kompresör", kod: "KMP", grup: "basincli", periyot: 12 } },
});

/** 437 · SIFIRDAN (reisim 2026-10-09: "RAPOR ŞABLONUNDA SIFIRDAN RAPOR ŞABLONU OLUŞTURMAK YOK") — kitaplıkta değil, boş iskelet: firma ve ekipman
    bilgileri (460: tam ekipman bölümü — ekipman kaydına bağlı alanlar), ölçüm cihazları, kontrol maddeleri (boş grup — Format kurucuda eklenir),
    fotoğraf, kusur, not, sonuç, imza. Kilit yok. */
export const bosFormat = (baslik: string): FormatTanimi => FormatTanimi.parse({
  sema: 1,
  gorunum: { formKodu: "", baslik: baslik.slice(0, 200), dayanak: [] },
  kurallar: { foto: false, derece: false, oneri: true },
  bolumler: [
    firma(false),
    { id: "ekipman", ad: "Ekipman bilgileri", blok: "bilgi", tam: true, alanlar: bagliAlanlar() },
    { id: "cihaz", ad: "Ölçüm cihazları", blok: "cihaz" },
    { id: "kontrol", ad: "Kontrol maddeleri", blok: "liste", cevaplar: CEVAP, gruplar: [{ id: "k", ad: "", maddeler: [] }] },
    ...sonBolumler(false, "Periyodik kontrol tarihi itibarıyla yukarıda teknik özellikleri belirtilen ekipmanın muayenesi sonrasında mevcut şartlar altında kullanımı", true),
  ],
} satisfies FormatGirdisi);

/* ── 450 · YENİ TÜRÜN HAZIR FORMATI (reisim 2026-10-09: "standart olarak pdf formatı yükleyin diyor hala yeni tür ekleyince, default olarak makette
   yaptıklarımız gibi olacak") — maketteki gibi (maket-veri.js MV.formatTanim + MV.KRITER / MV.TESTLER): yeni tür eklenince Ek-III grubuna göre
   kurulmuş format kendiliğinden YAYINDA gelir, rapor hemen açılır; belge Bakanlık rapor görünümünde (src/belge) çizilir. Firma Format kurucuda
   değiştirir. Kriterler grubun genel maddeleri; ekipmana bağlı sınırlar (yük deneyi, deney basıncı) sabit sayı değil, not olarak yazılır. Kilit yok. */
const GRUP_KRITER: Record<string, readonly string[]> = {
  kaldirma: ["Taşıyıcı konstrüksiyon: çatlak, deformasyon, korozyon", "Kaldırma elemanları (zincir, halat, çatal): aşınma ve uzama", "Kanca ve emniyet mandalı",
    "Frenler: fonksiyon deneyi", "Sınır anahtarları ve acil durdurma", "Yük diyagramı, etiket ve uyarı işaretleri", "Yük deneyi (dinamik ve statik)"],
  basincli: ["Gövde ve kaynaklar: gözle muayene (korozyon, ezik)", "Emniyet ventili: ayar basıncı ve fonksiyon", "Manometre: okunabilirlik ve kalibrasyon işareti",
    "Tahliye düzeni", "Etiket plakası ve izlenebilirlik", "Hidrostatik deney (deney basıncı)"],
  elektrik: ["Koruma iletkeni sürekliliği", "Topraklama direnci ölçümü", "Kaçak akım koruma: açma akımı ve süresi", "Yalıtım direnci ölçümü",
    "Pano: işaretleme, kapak, kilit, kablo girişleri", "Çevrim (döngü) empedansı"],
  iskele: ["Taban plakaları ve zemin", "Dikme, yatay ve çapraz bağlantılar", "Korkuluk ve topuk levhası", "Ankraj ve duvar bağlantıları", "Erişim merdivenleri"],
  diger: ["Koruyucular ve kilitleme düzenleri", "Acil durdurma", "Kumanda elemanları ve işaretler", "Elektrik donanımı: gözle muayene"],
};
type DegerG = { id: string; ad: string; birim?: string; op?: "<=" | ">="; sinir?: number; not?: string };
const GRUP_TEST: Record<string, readonly DegerG[]> = {
  kaldirma: [{ id: "dinamik", ad: "Dinamik yük deneyi", birim: "kg", not: "anma yükünün %110'u" }, { id: "statik", ad: "Statik yük deneyi", birim: "kg", not: "anma yükünün %125'i" }],
  basincli: [{ id: "hidro", ad: "Hidrostatik deney basıncı", birim: "bar", not: "çalışma basıncının 1,5 katı" },
    { id: "ventil", ad: "Emniyet ventili açma basıncı", birim: "bar", not: "çalışma basıncını aşmaz" }],
  elektrik: [{ id: "topraklama", ad: "Topraklama direnci", birim: "Ω" }, { id: "yalitim", ad: "Yalıtım direnci", birim: "MΩ", op: ">=", sinir: 1 },
    { id: "rcd", ad: "Kaçak akım rölesi açma süresi (IΔn)", birim: "ms", op: "<=", sinir: 300 }],
  iskele: [{ id: "duseylik", ad: "Dikme düşeylik sapması", birim: "mm/m" }],
  diger: [{ id: "acil", ad: "Acil durdurma tepki süresi", birim: "s" }],
};
const GRUP_EK: Record<string, readonly AlanG[]> = {
  kaldirma: [{ id: "kapasite", ad: "Kaldırma kapasitesi", tur: "sayi", birim: "kg", zorunlu: true }],
  basincli: [{ id: "calisma", ad: "Çalışma basıncı", tur: "sayi", birim: "bar", zorunlu: true }, { id: "hacim", ad: "Hacim", tur: "sayi", birim: "L" }],
};

/** Ek-III grubuna göre yeni türün formatı (grup anahtarı tanınmazsa "diğer") */
export function grupFormati(tur: { ad: string; grup: string }): FormatTanimi {
  const g = GRUP_KRITER[tur.grup] ? tur.grup : "diger";
  return FormatTanimi.parse({
    sema: 1,
    gorunum: { formKodu: "", baslik: `${tur.ad} Periyodik Kontrol Raporu`.slice(0, 200), dayanak: [] },
    kurallar: { foto: false, derece: false, oneri: true },
    bolumler: [
      firma(false),
      /* 460: tam ekipman bölümü — ekipman kaydına bağlı alanlar + grubun kendi alanları (yangın dolabı gibi farklı türde firma değiştirir) */
      { id: "ekipman", ad: "Ekipman bilgileri", blok: "bilgi", tam: true, alanlar: [...bagliAlanlar(), ...(GRUP_EK[g] ?? [])] },
      { id: "cihaz", ad: "Ölçüm cihazları", blok: "cihaz" },
      { id: "kriter", ad: "Muayene kriterleri", blok: "liste", cevaplar: CEVAP, gruplar: [{ id: "k", ad: "",
        maddeler: GRUP_KRITER[g].map((metin, i) => ({ id: `k${i + 1}`, metin })) }] },
      { id: "test", ad: "Test değerleri", blok: "test", degerler: GRUP_TEST[g].map((d) => ({ ...d })) },
      ...sonBolumler(false, "Periyodik kontrol tarihi itibarıyla yukarıda teknik özellikleri belirtilen ekipmanın muayenesi sonrasında mevcut şartlar altında kullanımı", true),
    ],
  } satisfies FormatGirdisi);
}
