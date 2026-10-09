/* BAKANLIK FORMATLARININ STANDARTLARI (437; reisim 2026-10-09: "BAKANLIK RAPOR FORMATLARI İLGİLİ STANDARTLAR VS DEFAULT GELSİN STANDART İÇİN
   YÜKLEME TUŞU OLSUN YÜKLENİNCE GÖRÜNTÜLEYE DÖNÜŞLSÜN") — Bakanlığın zorunlu rapor formatlarının (ZPKR01–05; src/format/sablonlar.ts) ve kontrol
   kriterlerinin (ZPKK01–05; src/tanim/kriterler.ts) dayandığı standartlar. Standart metinleri TSE'nin telifli yayınıdır: probata metni vermez,
   listeyi verir — Dökümanlar › Standartlar'da her firmada hazır görünür, firma kendi satın aldığı kopyayı "Yükle"r, yüklenince "Görüntüle" olur.
   Bakanlık türleri kurulurken (rapor-format/server/kurulum.ts) türün kontrol metodu standartları da bu listeden gelir.
   No yazımı şablonlardaki madde atıflarıyla aynı (dokumanlar/eslestir.ts standardı atıftan bulur); konu en çok 120 karakter (yükleme formu).
   440: branş — beş format da elektrik (Ek-III elektrik tesisatları); Standartlar'ın Elektrik sekmesinde (tests/bakanlik.test.ts şablonun türüyle
   karşılaştırır). 467: mekanik formatlar (ZPKR06 kule kren, ZPKR07 asılı erişim, ZPMR01 / ZYDR01 LPG tankı) — standartları kriter belgelerinin
   "Standart Maddesi" sütunundan; branş Mekanik. Tadil (ör. 14439+A2) numarada değil, yüklenen sürümde. */

export interface HazirStandart { no: string; konu: string; formatlar: readonly string[]; brans: "m" | "e" }

const LISTE: readonly (Omit<HazirStandart, "brans"> & { brans?: "m" })[] = [
  { no: "TS HD 60364-4-41", konu: "Alçak gerilim elektrik tesisleri – Bölüm 4-41: Güvenlik için koruma – Elektrik çarpmasına karşı koruma", formatlar: ["ZPKR01", "ZPKR02"] },
  { no: "TS HD 60364-4-43", konu: "Alçak gerilim elektrik tesisatları – Bölüm 4-43: Güvenlik için koruma – Aşırı akıma karşı koruma", formatlar: ["ZPKR02"] },
  { no: "TS HD 60364-5-51", konu: "Alçak gerilim elektrik tesisatları – Bölüm 5-51: Elektrik donanımının seçimi ve tesisi – Genel kurallar", formatlar: ["ZPKR02"] },
  { no: "TS HD 60364-5-52", konu: "Alçak gerilim elektrik tesisatları – Bölüm 5-52: Elektrik donanımının seçimi ve tesisi – Kablo sistemleri", formatlar: ["ZPKR02", "ZPKR04"] },
  { no: "TS HD 60364-5-53", konu: "Alçak gerilim elektrik tesisatları – Bölüm 5-53: Koruma, ayırma, anahtarlama ve kontrol düzenleri", formatlar: ["ZPKR01", "ZPKR02"] },
  { no: "TS HD 60364-6", konu: "Alçak gerilim elektrik tesisatları – Bölüm 6: Doğrulama", formatlar: ["ZPKR01", "ZPKR02"] },
  { no: "TS HD 60364-7", konu: "Alçak gerilim elektrik tesisatları – Bölüm 7: Özel tesisler veya yerler için kurallar", formatlar: ["ZPKR02"] },
  { no: "TS IEC 61439", konu: "Alçak gerilim anahtarlama ve kontrol düzeni panoları", formatlar: ["ZPKR02"] },
  { no: "TS EN 60079-14", konu: "Patlayıcı ortamlar – Bölüm 14: Elektrik tesislerinin tasarımı, seçimi ve kurulumu", formatlar: ["ZPKR02"] },
  { no: "TS EN 61008-1", konu: "Aşırı akım korumasız artık akımla çalışan devre kesiciler (RCCB) – Bölüm 1: Genel kurallar", formatlar: ["ZPKR01"] },
  { no: "TS EN 61009-1", konu: "Aşırı akım korumalı artık akımla çalışan devre kesiciler (RCBO) – Bölüm 1: Genel kurallar", formatlar: ["ZPKR01"] },
  { no: "TS EN 62423", konu: "B tipi ve F tipi artık akımla çalışan devre kesiciler", formatlar: ["ZPKR01"] },
  { no: "TS EN IEC 60947-2", konu: "Alçak gerilim anahtarlama ve kontrol düzenleri – Bölüm 2: Devre kesiciler", formatlar: ["ZPKR01"] },
  { no: "TS 622", konu: "Yıldırımlık tesisatı yapım kuralları", formatlar: ["ZPKR03"] },
  { no: "TS EN 62305-1", konu: "Yıldırımdan korunma – Bölüm 1: Genel prensipler", formatlar: ["ZPKR03"] },
  { no: "TS EN 62305-2", konu: "Yıldırımdan korunma – Bölüm 2: Risk yönetimi", formatlar: ["ZPKR03"] },
  { no: "TS EN 62305-3", konu: "Yıldırımdan korunma – Bölüm 3: Yapılarda fiziksel hasar ve hayati tehlike", formatlar: ["ZPKR03"] },
  { no: "TS EN 62305-4", konu: "Yıldırımdan korunma – Bölüm 4: Yapılarda elektrik ve elektronik sistemler", formatlar: ["ZPKR03"] },
  { no: "TS EN 62561", konu: "Yıldırımdan korunma sistemi bileşenleri (LPSC)", formatlar: ["ZPKR03"] },
  { no: "TS EN 61643-11", konu: "Alçak gerilim aşırı gerilim koruma cihazları – Bölüm 11: Alçak gerilim güç sistemlerine bağlı cihazlar", formatlar: ["ZPKR03"] },
  { no: "TS CEN/TS 54-14", konu: "Yangın algılama ve yangın alarm sistemleri – Bölüm 14: Planlama, tasarım, kurulum, devreye alma, kullanım ve bakım", formatlar: ["ZPKR04"] },
  { no: "TS EN 12464-1", konu: "Işık ve aydınlatma – Çalışma yerlerinin aydınlatılması – Bölüm 1: Kapalı çalışma alanları", formatlar: ["ZPKR04"] },
  { no: "TS EN 50522", konu: "1 kV AC üzerindeki güç tesislerinin topraklanması", formatlar: ["ZPKR05"] },
  /* 467 · mekanik */
  { no: "TS EN 14439", konu: "Krenler – Güvenlik – Kule krenler", formatlar: ["ZPKR06"], brans: "m" },
  { no: "TS ISO 9927-1", konu: "Krenler – Muayeneler – Bölüm 1: Genel", formatlar: ["ZPKR06"], brans: "m" },
  { no: "TS ISO 4309", konu: "Krenler – Tel halatlar – Bakım, muayene ve iptal", formatlar: ["ZPKR06", "ZPKR07"], brans: "m" },
  { no: "TS 10116", konu: "Krenlerin statik ve dinamik deneyleri (ZPKK06 statik / dinamik test atfı)", formatlar: ["ZPKR06"], brans: "m" },
  { no: "TS EN 1808", konu: "Asılı erişim donanımı için güvenlik kuralları – Tasarım, kararlılık, yapım – Muayeneler ve deneyler", formatlar: ["ZPKR07"], brans: "m" },
  { no: "TS EN 12817", konu: "LPG donanımı ve aksesuarları – 13 m³'e kadar LPG depolama tanklarının muayenesi ve yeniden değerlendirilmesi", formatlar: ["ZPMR01", "ZYDR01"], brans: "m" },
  { no: "TS EN 12819", konu: "LPG donanımı ve aksesuarları – 13 m³'ten büyük LPG depolama tanklarının muayenesi ve yeniden değerlendirilmesi", formatlar: ["ZPMR01", "ZYDR01"], brans: "m" },
  { no: "TS 1446", konu: "Sıvılaştırılmış petrol gazları (LPG) depolama tesisleri – Güvenlik kuralları", formatlar: ["ZPMR01", "ZYDR01"], brans: "m" },
  { no: "TS 11939", konu: "LPG tanklarının yerleşimi (ZPMK01 yerleşim atfı)", formatlar: ["ZPMR01"], brans: "m" },
  { no: "TS EN 12542", konu: "LPG donanımı ve aksesuarları – 13 m³'e kadar yer üstü silindirik çelik LPG tankları – Tasarım ve imalat", formatlar: ["ZPMR01"], brans: "m" },
  { no: "TS EN 14129", konu: "LPG donanımı ve aksesuarları – LPG tankları için basınç tahliye valfleri", formatlar: ["ZPMR01"], brans: "m" },
  { no: "TS EN 13445-5", konu: "Alevle temas etmeyen basınçlı kaplar – Bölüm 5: Muayene ve deney", formatlar: ["ZPMR01"], brans: "m" },
  { no: "TS EN 14570", konu: "LPG donanımı ve aksesuarları – Yer üstü ve yer altı LPG tanklarının donatılması", formatlar: ["ZPMR01"], brans: "m" },
];
export const BAKANLIK_STANDARTLARI: readonly HazirStandart[] = LISTE.map((s) => ({ ...s, brans: s.brans ?? ("e" as const) }));

/** formatın (ZPKR…) standart numaraları — kurulan türün kontrol metodu standartları */
export const formatStandartlari = (formKodu: string): string[] => BAKANLIK_STANDARTLARI.filter((s) => s.formatlar.includes(formKodu)).map((s) => s.no);

/* 440 (reisim 2026-10-09: "KULLANILACAK ÖLÇÜM CİHAZLARINI DA EKLE") — Bakanlık formatının ölçümleri için ŞART olan ölçüm cihazı türleri: kurulan ve
   Bakanlık şablonlu türün "Kullanılacak ölçüm cihazları"na girer (raporda her birinden kalibrasyonu geçerli cihaz istenir — ENGEL 2; firma
   "Metot ve cihazlar"dan değiştirir). Formlar cihaz türü adı vermez ("Ölçüm aletleri bilgileri": ad, seri no, kalibrasyon); türler formun ölçüm
   yöntemlerinden: ZPKR01 / ZPKR02 çevrim empedansı, RCD, süreklilik, zemin izolasyonu → tesisat test cihazı · ZPKR03 / ZPKR05 topraklama direnci
   (çevrim, 3 uçlu ya da pens yöntemi) → topraklama ölçer · ZPKR04 acil aydınlatmanın aydınlık seviyesi (ağır kusur) → lüksmetre. Termal kamera
   Bakanlıkça isteğe bağlı (ZPKK02 / ZPKK05 Not 4), akü gerilimi panelin test tuşuyla da ölçülür — şart konmaz. */
export const CIHAZ_TESISAT = "Tesisat test cihazı (çevrim empedansı / RCD)";
export const CIHAZ_TOPRAKLAMA = "Topraklama ölçer (3 uçlu / pens)";
export const CIHAZ_LUKSMETRE = "Lüksmetre";
/* 467: mekanik formatların kriter belgelerindeki "Kullanılacak ölçüm cihazı" — kule kren: şerit metre, kumpas, aydınlık ölçer · asılı erişim:
   şerit metre, kumpas, eğim / açı ölçer · LPG muayene: mesafe ölçer · LPG yeniden değerlendirme: hidrostatik test manometresi */
export const CIHAZ_SERIT = "Şerit metre / mesafe ölçer";
export const CIHAZ_KUMPAS = "Kumpas";
export const CIHAZ_EGIM = "Eğim / açı ölçer";
export const CIHAZ_MANOMETRE = "Manometre";
const CIHAZLAR: Readonly<Record<string, readonly string[]>> = {
  ZPKR01: [CIHAZ_TESISAT], ZPKR02: [CIHAZ_TESISAT], ZPKR03: [CIHAZ_TOPRAKLAMA], ZPKR04: [CIHAZ_LUKSMETRE], ZPKR05: [CIHAZ_TOPRAKLAMA],
  ZPKR06: [CIHAZ_SERIT, CIHAZ_KUMPAS, CIHAZ_LUKSMETRE], ZPKR07: [CIHAZ_SERIT, CIHAZ_KUMPAS, CIHAZ_EGIM], ZPMR01: [CIHAZ_SERIT], ZYDR01: [CIHAZ_MANOMETRE],
};
/** formatın (ZPKR…) ölçüm cihazı türlerinin adları (Bakanlık formatı değilse boş) */
export const formatCihazTurleri = (formKodu: string): string[] => [...(Object.hasOwn(CIHAZLAR, formKodu) ? CIHAZLAR[formKodu] : [])];
