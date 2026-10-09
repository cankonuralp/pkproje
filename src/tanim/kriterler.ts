/* KONTROL KRİTERLERİ — Bakanlığın periyodik kontrol kriterleri belgeleri (maket standartlar.html #/kriterler; reisim 2026-09-27: "kriterler de
   sistem de muhafaza edilecek … bunlar ilgili ekipmanın muayenesi ile alakalı tariflerdir"). Belgeler KODDA tutulur, site içinde düzenlenmez
   (yayımlanmış mevzuat metni; firma verisi değil). Maketteki veriden bir kez aktarıldı (docs/assets/maket-veri.js KONTROL_BELGELERI).
   427 (2026-10-09): ZPKK03 yıldırımdan korunma, ZPKK04 yangın algılama, ZPKK05 trafo — Bakanlığın 18.07.2025 tarihli belgelerinden özet. */
import type { FormatTanimi } from "../format/tanim.ts";

export interface KriterMaddesi { no: string; baslik: string; icerik: string; kaynak: string }
/** 442: brans — Dökümanlar › Muayene kriterleri'nin Mekanik / Elektrik alt sekmesi (rapor formatının türüyle aynı — tests/bakanlik.test.ts) */
export interface KriterBelgesi { kod: string; ad: string; tur: string; rapor: string; brans: "m" | "e"; yayim: string; yururluk: string; kapsam: string; maddeler: KriterMaddesi[]; notlar: string[] }

export const KRITER_BELGELERI: readonly KriterBelgesi[] = [
  {
    "kod": "ZPKK01",
    "ad": "Alçak Gerilim Topraklama Tesisatı Periyodik Kontrol Kriterleri",
    "tur": "AT",
    "rapor": "ZPKR01",
    "brans": "e",
    "yayim": "2025-07-18",
    "yururluk": "2025-09-01",
    "kapsam": "Elektrik İç Tesisleri Yönetmeliği kapsamındaki tesislerde bulunan ekipmanların periyodik kontrolleri. Elektrik İç Tesisatı Gözle Kontrol ve Fonksiyon Testleri Periyodik Kontrol Raporu bu raporun tamamlayıcısıdır; tek başına uygunluk değerlendirmesi yapılamaz. Rapor her ekipman (pano) için ayrı düzenlenir; grup panolarda tek rapor, bulgular pano numarasıyla notlarda.",
    "maddeler": [
      {
        "no": "0",
        "baslik": "Hazırlık",
        "icerik": "Ölçüm tarihi, hava durumu, toprak durumu gibi genel bilgiler kontrol edildikten sonra tesisat bilgileri; tesise ait topraklama projesi olup olmadığı sorgulanır.",
        "kaynak": "Elektrik Tesislerinde Topraklamalar Yönetmeliği · TS HD 60364-5-53"
      },
      {
        "no": "1",
        "baslik": "Ölçüm noktası",
        "icerik": "Dokunma gerilimi <1000 V ve >50 V olan tüm noktalardan ölçüm alınır. Enerji altındaki ekipmanlarla 2,5 m ulaşma mesafesindeki enerjisiz metal ekipmanlar arasında potansiyel dengeleme kontrol edilip süreklilik testi yapılır. TN sistemlerde son tüketim noktalarından ayrı ayrı çevrim empedansı (Zx); IT sistemlerde ilk hata için eşpotansiyel toprak barası topraklama direnci (Ra), ikinci hata için bağlantı tipine göre Zx ya da Ra ölçülür.",
        "kaynak": "Elektrik Tesislerinde Topraklamalar Yönetmeliği Madde 10 · TS HD 60364-5-53"
      },
      {
        "no": "2",
        "baslik": "Koruma kesiti (mm²)",
        "icerik": "Koruma iletkeninin kesiti yazılır. Uygunluğu 63 A'dan küçük devrelerde faz kesitine göre tablodan, 63 A'dan büyük devrelerde ısınma kontrolüne göre denetlenir.",
        "kaynak": "Elektrik Tesislerinde Topraklamalar Yönetmeliği Çizelge 4-a ve 4-b · TS HD 60364-5-53"
      },
      {
        "no": "3",
        "baslik": "Koruma elemanı değerleri",
        "icerik": "In (A) · açma eğrisi tipi veya modeli · açma akımı Ia (A) · hesaplanan toprak kısa devre akımı. Hesaplar koruma ekipmanının anma akımı ve açma eğrisi tipine göre yapılır; toprak kısa devre akımı 230 V'un ölçülen çevrim empedansına bölünmesiyle bulunur (ör. 2 Ω için Ik = 115 A).",
        "kaynak": "Elektrik Tesislerinde Topraklamalar Yönetmeliği Çizelge-10 · TS HD 60364-5-53"
      },
      {
        "no": "4",
        "baslik": "Topraklama ölçülen değerler ve sınır değerler",
        "icerik": "Çevrim empedansı, üç uçlu karşılaştırma ya da pens yöntemiyle ölçülen değer Zx (Rx) alanına; topraklama tipine göre koruma elemanının açma akımı üzerinden hesaplanan sınır Zs (Rs) alanına yazılır. Sınırın üstündeki değerde notlara göre uygunluk yazılır. Süreler ETTY Madde 8'de.",
        "kaynak": "Elektrik Tesislerinde Topraklamalar Yönetmeliği Çizelge-10 · TS HD 60364-5-53"
      },
      {
        "no": "5",
        "baslik": "RCD testleri",
        "icerik": "Devresinde RCD bulunan ekipmanlarda RCD açma akımı ve açma zamanı testleri yapılıp yazılır.",
        "kaynak": "Elektrik Tesislerinde Topraklamalar Yönetmeliği Madde 8 · TS HD 60364-5-53"
      },
      {
        "no": "6",
        "baslik": "30 mA RCD kullanma zorunluluğu",
        "icerik": "TT veya TN (TN-S veya TN-CS'nin S bölümü) şebekelerde 32 A'e kadar genel kullanım priz tesisatlarında ve 32 A'e kadar seyyar cihaz prizlerinde 30 mA RCD zorunludur. 32 A üzerindeki devrelerde doğal kaçak akımlar kaçınılmazsa uygun seçilmiş RCD diğer önlemlerle birlikte kullanılır; doğal kaçakların teknik detayı raporda belirtilir.",
        "kaynak": "Elektrik Tesislerinde Topraklamalar Yönetmeliği Madde 8 · TS HD 60364-4-41"
      },
      {
        "no": "7",
        "baslik": "RCD performans testleri",
        "icerik": "Açma akımı cihaz etiketindeki beyan açma akımını, açma zamanı 200 ms'yi geçmemelidir. 1000 mA üzerindeki toroidal akım trafolu RCD'ler test butonuyla denetlenir.",
        "kaynak": "TS HD 60364-6 · TS EN 61008-1 · TS EN 61009-1 · Elektrik Tesislerinde Topraklamalar Yönetmeliği · TS EN 62423 · TS EN IEC 60947-2"
      },
      {
        "no": "8",
        "baslik": "Notlar",
        "icerik": "Korozyon, kopma, kesit sorunları notlara yazılır ve öneride bulunulur. Sınıf II cihazda toprak bağlantısı olmadığı; izolasyon trafosunun sekonderinde toprak bağlantısı olmadığı ölçülerek doğrulanır. Düşük gerilimli tüketim noktalarında gerilimin a.a. 50 V'u, d.a. 42 V'u geçmediği doğrulanır. Projeyi hazırlayan ve onaylayanların bilgileri eklenir.",
        "kaynak": "Elektrik Tesislerinde Topraklamalar Yönetmeliği · TS HD 60364-5-53"
      }
    ],
    "notlar": [
      "Kusur derecesi “*” hafif kusurlu ve “**” kusurlu anlamında kullanılır.",
      "Kriterler ekipmanın kullanım yeri, amacı, tipi ve modeline göre değişebilir; ilgili imalat mevzuatı / standardına göre riskin bulunmadığı durumda kriter aranmaz. Kriterin listede bulunması her ekipmanda zorunlu olarak aranacağı anlamına gelmez.",
      "Pano dışındaki topraklama kontrollerinde (kablo tavası, buat, yapı bağlantı kutusu, armatür bağlantısı vb.) ölçüm noktası numaralandırılır; mümkünse vaziyet planında işaretlenir.",
      "Isınma ve bağlantı noktası kontrollerinde termal kamera kullanıldığında Bakanlıkça aksi belirtilmedikçe ek eğitim şartı aranmaz."
    ]
  },
  {
    "kod": "ZPKK02",
    "ad": "Elektrik İç Tesisatı Gözle Kontrol ve Fonksiyon Testleri Periyodik Kontrol Kriterleri",
    "tur": "ET",
    "rapor": "ZPKR02",
    "brans": "e",
    "yayim": "2025-07-18",
    "yururluk": "2025-09-01",
    "kapsam": "Elektrik İç Tesisleri Yönetmeliği kapsamındaki tesislerde bulunan ekipmanların periyodik kontrolleri. Alçak Gerilim Topraklama Tesisatı Periyodik Kontrol Raporu bu raporun tamamlayıcısıdır; tek başına uygunluk değerlendirmesi yapılamaz. Rapor her ekipman (pano) için ayrı; pano dışındaki priz, kablo tavası, buat, eşpotansiyel bara, motor, regülatör gibi ekipmanlar notlarda.",
    "maddeler": [
      {
        "no": "0",
        "baslik": "Hazırlık",
        "icerik": "İş güvenliği tedbirlerinden sonra mevcut durumun fotoğrafı çekilir; elektrik pano listesi (numara, tanım, göz sayısı, bölüm/yer) oluşturulur, numarası olmayan panoya numara verilir. Havuz, karavan, güneş enerjisi gibi özel tesisatlar TS HD 60364-7 serisine göre kontrol edilir.",
        "kaynak": "TS HD 60364-4-41 · TS HD 60364-6 · TS HD 60364-7 serisi"
      },
      {
        "no": "1",
        "baslik": "Panonun 3 faz simetrik kısa devre akımı (Ik) < şalter kısa devre kesme kapasitesi (Icu)",
        "icerik": "Projeden kontrol edilir: panodaki tüm devre kesicilerin Icu'su panonun 3 faz simetrik kısa devre akımından büyük olmalıdır.",
        "kaynak": "TS HD 60364-6 · TS HD 60364-5-53:2001 Madde 536 · Elektrik İç Tesisleri Yönetmeliği Madde 57 b-2"
      },
      {
        "no": "2",
        "baslik": "Tasarım (yük) akımı (Ib)",
        "icerik": "Normal işletmede devreden geçmesi öngörülen akım; projeden kontrol edilir, en yüksek yükte ölçülebilir.",
        "kaynak": "TS HD 60364-6 · TS HD 60364-5-52:2009 Madde 523"
      },
      {
        "no": "3",
        "baslik": "Devre kesici açma eğrisi tipi / kategori (B=5x C=10x D=15x)",
        "icerik": "Koruma süresindeki açma eğrisine göre tip yazılır; bilinmiyorsa üretici kataloğu ya da TS IEC 61439.",
        "kaynak": "TS HD 60364-6 · TS HD 60364-5-53:2001 Madde 536"
      },
      {
        "no": "4",
        "baslik": "Faz kesiti (mm²)",
        "icerik": "Ölçülerek yazılır; tasarım akımıyla kesitin akım taşıma kapasitesi tahkik edilir.",
        "kaynak": "TS HD 60364-6 · TS HD 60364-5-52:2009 Madde 523"
      },
      {
        "no": "5",
        "baslik": "Devre kesici nominal akımı (In)",
        "icerik": "Kesicilerin nominal akımları yazılarak tasarım yük akımına göre tahkik yapılır.",
        "kaynak": "TS HD 60364-6 · TS HD 60364-5-53:2001 Madde 536"
      },
      {
        "no": "6",
        "baslik": "Akım taşıma kapasitesi — ortam sıcaklığına göre r1",
        "icerik": "Ortam sıcaklığına göre TS HD 60364-5-52 tablosundan seçilen katsayı.",
        "kaynak": "TS HD 60364-6 · TS HD 60364-4-43"
      },
      {
        "no": "7",
        "baslik": "Akım taşıma kapasitesi — döşeme şekline göre r2",
        "icerik": "İletkenin döşenme şekline göre TS HD 60364-5-52 tablosundan seçilen katsayı.",
        "kaynak": "TS HD 60364-6 · TS HD 60364-4-43"
      },
      {
        "no": "8",
        "baslik": "Akım taşıma kapasitesi Iz (A)",
        "icerik": "Döşenme şekli ve sıcaklığa göre tablodan hesaplanan akım.",
        "kaynak": "TS HD 60364-6 · TS HD 60364-4-43"
      },
      {
        "no": "9",
        "baslik": "Akım taşıma kapasitesi r1·r2·Iz (A)",
        "icerik": "Katsayılarla düzeltilmiş akım taşıma kapasitesi.",
        "kaynak": "TS HD 60364-6 · TS HD 60364-4-43"
      },
      {
        "no": "10",
        "baslik": "Nötr kesiti kontrolü",
        "icerik": "Nötr, faz kesitine göre tahkik edilir; harmonikli devrelerde ve TN-C / TN-CS'de PEN kesiti faz kesitiyle aynı. PEN kesiti 10 mm²'den küçük olamaz, faz kesitine eşit olmalı (EİTY Md. 57), yangın tehlikeli yerlerden geçirilmez (EİTY Md. 64), patlama tehlikeli Zone-0/1'den geçirilmez; tehlikeli alanda TN-S.",
        "kaynak": "TS HD 60364-6 · TS EN 60079-14 Madde 6.2.1 · Elektrik İç Tesisleri Yönetmeliği Madde 36"
      },
      {
        "no": "11",
        "baslik": "Koruma iletkeni kesiti (PE)",
        "icerik": "Faz kesitine göre belirlenir; 63 A'e kadar tablodan, daha büyük devrelerde hesapla (ETTY Md. 9-e).",
        "kaynak": "TS HD 60364-6 · TS HD 60364-5-51:2005 Madde 514.3 · Elektrik Tesislerinde Topraklamalar Yönetmeliği Madde 9-e"
      },
      {
        "no": "12",
        "baslik": "Ek potansiyel dengeleme iletkeni kesiti (PD)",
        "icerik": "Yük ve kısa devre akımına göre ETTY'deki en küçük kesitlerde mi bakılır (en az 6 mm², en fazla 25 mm²).",
        "kaynak": "TS HD 60364-6 · TS HD 60364-5-51:2005 Madde 514.3"
      },
      {
        "no": "13",
        "baslik": "İletken boyu (m)",
        "icerik": "Projeden belirlenebiliyorsa yazılır; belirlenemiyorsa linye 20 m alınabilir.",
        "kaynak": "TS HD 60364-6 · TS HD 60364-5-51:2005 Madde 514.3"
      },
      {
        "no": "14",
        "baslik": "Kablo şalter koordinasyonu Ib < In < Iz",
        "icerik": "Her devre kesici için ayrı karşılaştırılır; kablo akım taşıma kapasitesinden büyük şaltere uygunsuzluk verilir.",
        "kaynak": "TS HD 60364-6 · TS HD 60364-4-43 · TS HD 60364-5-53:2001 Madde 536"
      },
      {
        "no": "15",
        "baslik": "Yapılacak testler",
        "icerik": "Süreklilik (R1+R2) ve R2 · izolasyon direnci faz-faz / faz-toprak (MΩ; periyodik kontrolde yapılmaz) · topraklama çevrim empedansı Zx ve sınır Zs · RCD açma zamanı ve akımı · aşırı gerilim koruma kategorisi ve dayanma akımı. Tava, hava kanalı gibi metal ekipmanlarda eşpotansiyel baraya süreklilik Rc < 0,1 Ω.",
        "kaynak": "TS HD 60364-6 Madde 6.4.3 · TS HD 60364-4-41"
      },
      {
        "no": "16",
        "baslik": "Muayenenin sonuçlandırılması",
        "icerik": "Muayene edilen öğe teslim alındığı gibi bırakılır ve alandan ayrılmadan önce fotoğraf çekilir. Projeyi onaylayanların bilgileri eklenir.",
        "kaynak": "TS HD 60364-6"
      }
    ],
    "notlar": [
      "Kusur derecesi “*” hafif kusurlu ve “**” kusurlu anlamında kullanılır.",
      "Kriterler ekipmanın kullanım yeri, amacı, tipi ve modeline göre değişebilir; riskin bulunmadığı durumda kriter aranmaz. Kriterin listede bulunması her ekipmanda zorunlu olarak aranacağı anlamına gelmez.",
      "Fonksiyon testlerindeki yalıtım direnci ölçümleri yalnız doğrulama kontrollerinde yapılır; periyodik kontrollerde yapılmaz.",
      "Toroid artık akım anahtarlarının testleri test butonuyla yapılabilir.",
      "Toprak çevrim empedansı ölçümlerindeki yalıtım hatasından kaynaklanan belirsizlikler Topraklama Tesisatı Raporunda belirtilir.",
      "Isınma ve bağlantı noktası kontrollerinde termal kamera isteğe bağlıdır; gözle kontrol formunda belirtilmesi yeterlidir; ek eğitim şartı aranmaz."
    ]
  },
  {
    "kod": "ZPKK03",
    "ad": "Yıldırımdan Korunma Tesisatı Periyodik Kontrol Kriterleri",
    "tur": "YK",
    "rapor": "ZPKR03",
    "brans": "e",
    "yayim": "2025-07-18",
    "yururluk": "2025-09-01",
    "kapsam": "Tesislerde bulunan yıldırımdan korunma ekipmanlarının periyodik kontrolleri. Kontrol raporu her ekipman (ESE paratoner, yakalama ucu, Faraday kafesi gibi) için ayrı düzenlenir; uygunsuzluk bulguları raporun ekinde fotoğrafla gösterilebilir.",
    "maddeler": [
      {
        "no": "0",
        "baslik": "Hazırlık",
        "icerik": "Ölçüm tarihi, hava ve toprak durumu, tesisat bilgileri kontrol edilir; topraklama projesi olup olmadığı ve korunma tipinin ESE (aktif, radyoaktif), Franklin çubuğu ya da Faraday kafesi olduğu belirlenir. Binadaki doğal bileşenlerin (betonarme donatı, çelik konstrüksiyon) sistemde kullanılıp kullanılmadığı belirtilir. Radyoaktif olduğu düşünülen paratonerde radyoaktif uyarı işareti aranır; tespit edilirse uygunsuzluk yazılır.",
        "kaynak": "TS EN 62305"
      },
      {
        "no": "1",
        "baslik": "Koruma yapılan kapsama alanı bağlamında uygunluk",
        "icerik": "Risk analizi işverenden istenir, koruma seviyesi tespit edilir. Koruma seviyesindeki koruma açısına ve bina yüksekliğine göre oluşan kapsama alanı kontrol edilir; afaki koruma yarıçapı durumunda uygunsuzluk verilir.",
        "kaynak": "TS EN 62305-2 Madde 5"
      },
      {
        "no": "2",
        "baslik": "Tesisatın (yakalama, indirme, topraklama) fiziki uygunluğu",
        "icerik": "Korunma tipine göre kontroller yapılır: ESE (erken akım yayan) tip, Franklin çubuğu, Faraday kafesi veya doğal bileşenler.",
        "kaynak": "TS EN 62305-3 Madde 5"
      },
      {
        "no": "3–10",
        "baslik": "Koruma borusu",
        "icerik": "Koruma borusunun (test klemensi ile toprak arasında topraklama iletkenlerini koruyan boru) olup olmadığı; paslanmaya karşı galvanizli olup olmadığı, oksitlenme, çapın uygunluğu (31,75 mm veya 1 ¼\"), duvara tutturulması, ağzının yalıtkan malzemeyle kaplanması, iletkenlerin PVC hortum içinde olması ve uzunluğunun ortalama 2,5 m'den fazla olması kontrol edilir.",
        "kaynak": "TS EN 62305-3 Madde 5.3"
      },
      {
        "no": "11–16",
        "baslik": "ESE / yakalama ucu tipi için indirme iletkenleri",
        "icerik": "İndirme iletkenlerinin bakır (2x50 mm²) veya eşdeğer kesitte olduğu, tespit kroşelerinin kızıl döküm olduğu, oksitlenme, köşelerde “S” yapıp yapmadığı ve kroşeler arası mesafenin ortalama 0,5-0,7 m olduğu kontrol edilir.",
        "kaynak": "TS EN 62305-3 Madde 5.3"
      },
      {
        "no": "17–20",
        "baslik": "Muayene klemensi",
        "icerik": "Muayene klemensinin olup olmadığı, oksitlenmeye karşı korunup korunmadığı kaydedilir; zeminden en az 270 cm yukarıda olduğu ve koruma borusuna mesafesinin 20 cm olduğu kontrol edilir. Klemens yer altında veya kuyuda olabilir; global topraklama ve Faraday kafesi sistemlerinde bulunmayabilir, bu durum not edilir.",
        "kaynak": "TS EN 62305-3 Madde 5.3"
      },
      {
        "no": "21–24",
        "baslik": "Çatı direği",
        "icerik": "Çatı direğinin boyu ve çapı kontrol edilir, direk bağlantı klemensinin varlığı not edilir; sağlam tutturulduğundan ve iniş iletkenlerinin uygun irtibatlandırıldığından emin olunur. Yanıcı, parlayıcı, patlayıcı madde bulunan binalarda düşey yakalama çubuğunun bulunmadığı veya tehlikeli bölge dışında olduğu kontrol edilir.",
        "kaynak": "TS EN 62305-3 Madde 5.3"
      },
      {
        "no": "25–26",
        "baslik": "İndirme iletkenlerinin topraklamaya bağlantısı",
        "icerik": "İndirme iletkenlerinin topraklama elektrotlarına uygun tutturulduğu, koruma borusundan sonra zemin üzerinde olduğu ve topraklama hattının tesis edildiği kontrol edilir. Çatı direği çelik dübellerle bina betonuna bağlıysa topraklamanın bina ile eşpotansiyel olduğu denetlenir.",
        "kaynak": "TS EN 62305-3 Madde 5.3"
      },
      {
        "no": "27–29",
        "baslik": "Faraday kafesi: yatay yakalama sistemi (ağ) ve indiriciler",
        "icerik": "Ağın standarttaki kesitlere ve risk analizindeki genişliğe uygunluğu, varsa düşey yakalama çubukları kontrol edilir. Bina çevresi boyunca en az 20 m'de 1 indirici gerekir; doğal metal yapılar indirici olarak kullanılıyorsa çatı ağı ile eşpotansiyel bara arasındaki süreklilikte Rc < 0,2 Ω olmalıdır. Eşpotansiyel oluşturulamayan binalarda kıvılcım aralığı hesabıyla S > d olduğu kontrol edilir (d = ki · kc · l / km).",
        "kaynak": "TS EN 62305-3 Madde 5.3"
      },
      {
        "no": "30–31",
        "baslik": "Franklin çubuğu",
        "icerik": "Çubuk / direk boyu kontrol edilir. Metal direklerde ve yapılarda ayrıca indirici iletken gerekmez; metal direğin veya yapının etkili topraklanması yeterlidir. İndirme iletkenlerinin kesiti, kroşeler, oksitlenme ve köşelerde “S” kontrol edilir.",
        "kaynak": "TS EN 62305-3 Madde 5.3"
      },
      {
        "no": "32",
        "baslik": "Topraklamaların birleştirilmesi",
        "icerik": "Yıldırıma karşı koruma topraklamasına 2 m'den yakın başka topraklayıcılar varsa birbirine bağlandığı, 2–20 m arasındakilerin de bağlandığı, toprak özdirenci 500 Ω.m'den yüksekse 20 m'den uzaktakilerin de bağlandığı kontrol edilir.",
        "kaynak": "Elektrik Tesislerinde Topraklamalar Yönetmeliği Madde 25"
      },
      {
        "no": "33–34",
        "baslik": "Topraklama hattı",
        "icerik": "ESE tipte topraklama hattının tesis edildiği; Faraday ve Franklin tipte indirme iletkenlerinin topraklama elektrotlarına ve temel topraklamasına uygun tutturulduğu kontrol edilir. Doğal metal yapılar indirici olarak kullanıldıysa çatı ağının doğal bileşenlere bağlantı noktaları kontrol edilir. Sandviç panel kaplı yapılarda yalıtım malzemesi taş yünü değilse risk analizinde yanıcı sayıldığı kontrol edilir.",
        "kaynak": "TS EN 62305-3 Madde 5.3"
      },
      {
        "no": "35",
        "baslik": "Topraklama tesisi direnci",
        "icerik": "Topraklama geçiş direnci tesisin şekline uygun yöntemle (çevrim empedansı, üç uçlu karşılaştırma veya pensli ölçüm) ölçülür; 10 Ω'dan küçükse uygundur. Toprak özgül direnci 3000 Ω.m'den yüksekse ek topraklama önerilebilir. Toprak iletkenleri en az bakır 50 mm², çelik 90 mm².",
        "kaynak": "TS EN 62305-3 Madde 5.4.1"
      },
      {
        "no": "36",
        "baslik": "Parafudr (iç yıldırımlık)",
        "icerik": "Kullanıldığı yere göre uygun dayanım akımı ve parafudr tipi kontrol edilir.",
        "kaynak": "TS EN 62305-3 Madde 6 · TS EN 62561 · TS EN 61643-11"
      }
    ],
    "notlar": [
      "Kusur derecesi “*” hafif kusurlu ve “**” kusurlu anlamında kullanılır.",
      "Kriterler ekipmanın kullanım yeri, amacı, tipi ve modeline göre değişebilir; riskin bulunmadığı durumda kriter aranmaz. Kriterin listede bulunması her ekipmanda zorunlu olarak aranacağı anlamına gelmez.",
      "Radyoaktif paratonerlerin kullanımı yasaklandığından bu paratonerlerin kontrolü yapılmadan söktürülmesi talep edilir.",
      "Güncel standartta ESE tip paratonerlerin montaj prensip şeması yoktur; bu tipler düşey yakalama ucu olarak değerlendirilir ve kapsama alanı risk analizindeki koruma açısına göre hesaplanır.",
      "Projeyi onaylayanların ad soyadı, imzası, meslek unvanı, diploma numarası, tarih ve sayı, proje onay geçerlilik süresi eklenir."
    ]
  },
  {
    "kod": "ZPKK04",
    "ad": "Yangın Algılama ve Uyarı Sistemi Periyodik Kontrol Kriterleri",
    "tur": "YA",
    "rapor": "ZPKR04",
    "brans": "e",
    "yayim": "2025-07-18",
    "yururluk": "2025-09-01",
    "kapsam": "Binaların Yangından Korunması Hakkında Yönetmelik kapsamındaki yapıların yangın algılama ve uyarı, acil aydınlatma ve yönlendirme sistemi ekipmanlarının periyodik kontrolleri. Kontrol raporu her yangın kontrol paneli bölgesi için ayrı düzenlenir; uygunsuzluklar fotoğrafla gösterilebilir.",
    "maddeler": [
      {
        "no": "0",
        "baslik": "Hazırlık",
        "icerik": "Ölçüm tarihi, sistem detay ve bina bilgileri kontrol edildikten sonra tesise ait proje olup olmadığı sorgulanır. Panelin özelliklerini bilen deneyimli personel yoksa, testler sırasında bakım firmasından bir personelin bulunması işverenden istenir.",
        "kaynak": "TS CEN/TS 54-14 · Binaların Yangından Korunması Hakkında Yönetmelik · Elektrik İç Tesisleri Yönetmeliği"
      },
      {
        "no": "1–2",
        "baslik": "Yetkili personel ve yangın güvenliği sorumluları",
        "icerik": "Tesiste sistemi tanıyan, alarmda ne yapacağını bilen yetkili ve eğitimli kişi bulunmalı; binanın her katı, bölümü veya tamamı için yangın güvenliği sorumluları seçilmelidir.",
        "kaynak": "Binaların Yangından Korunması Hakkında Yönetmelik Md-125, Md-129"
      },
      {
        "no": "3–4",
        "baslik": "Panel durumu ve acil anons",
        "icerik": "Binada otomatik algılama ve uyarı sistemi zorunluluğu Yönetmelik Ek-7 tablosuna göre tespit edilir; gerekiyorsa panelin durumu, ekranı ve tuşları gözle kontrol edilir. Acil durum anons sisteminin gerekliliği Md-81-(7)'ye göre belirlenir.",
        "kaynak": "Binaların Yangından Korunması Hakkında Yönetmelik Md-75, Ek-7, Md-81"
      },
      {
        "no": "5–6",
        "baslik": "Bakım kayıtları ve sistem kütüğü",
        "icerik": "Sistemin bakımı belirli periyotlarla düzenli yapılmalı ve kayıtları tutulmalıdır; sistemi etkileyen bütün olaylar sistem kütüğüne kaydedilmelidir.",
        "kaynak": "Binaların Yangından Korunması Hakkında Yönetmelik Md-84"
      },
      {
        "no": "7–10",
        "baslik": "Panel yerleşimi, izlenebilirlik, adresleme, paralel ihbar",
        "icerik": "Ana ve tekrarlayıcı paneller rahatça görülebilecek yerlerde olmalı ve sürekli izlenebilmelidir. Dedektör ve butonlar onaylı projeye uygun bir plan üzerinde adreslenerek gösterilmeli, sonradan yapılan ilaveler plana işlenmelidir. Görülemeyen hacimlerdeki dedektörler için paralel uyarı lambaları tesis edilmelidir.",
        "kaynak": "TS CEN/TS 54-14 · Binaların Yangından Korunması Hakkında Yönetmelik"
      },
      {
        "no": "11–16",
        "baslik": "Çevrim koruması, kullanma talimatı, akü, dedektörler, uyarılar, kablolar",
        "icerik": "Her çevrimde kısa devre ve açık devre koruması olmalı, hatalar panelde sinyal lambasıyla uyarılmalıdır. Üretici kullanma talimatı ulaşılabilir yerde olmalıdır. Akü kapasitesi kontrol edilir; gerilim test butonuyla ya da ölçü aletiyle ölçülür. Kablolar TSE standartlarına uygun, halojenden arındırılmış ve yangına en az 60 dakika dayanıklı olmalıdır.",
        "kaynak": "Binaların Yangından Korunması Hakkında Yönetmelik Md-83"
      },
      {
        "no": "17–18",
        "baslik": "Acil durum aydınlatma ve yönlendirme",
        "icerik": "Kaçış yolları, asansör holleri, toplanma alanları, elektrik / jeneratör odaları, pompa istasyonları, kapalı otoparklar gibi yerlerde normal aydınlatma kesilince en az 60 dakika yanacak acil aydınlatma ve yönlendirme işaretleri bulunmalıdır.",
        "kaynak": "Binaların Yangından Korunması Hakkında Yönetmelik Md-71, Md-72, Md-73 · TS EN 12464-1"
      },
      {
        "no": "19–28",
        "baslik": "Yangın anında diğer sistemlerle entegrasyon",
        "icerik": "Duman damperlerinin konum bilgileri izlenebilmeli; iklimlendirme ve duman egzoz sinyalleri kontrol edilir. Alarm sistemi otomatik söndürme sistemini harekete geçirecek sinyali vermeli, bina otomasyonuyla haberleşmelidir. Asansörler yangın uyarısında acil çıkış katına dönmeli; basınçlandırma, geçiş kontrol, elektromanyetik tutucu ve patlayıcı gaz dağıtım sistemleri kontrol edilir.",
        "kaynak": "Binaların Yangından Korunması Hakkında Yönetmelik Md-62, Md-63, Md-82, Md-85–Md-90"
      },
      {
        "no": "29",
        "baslik": "Güvenlik devre ayrılması",
        "icerik": "CCTV, yangın algılama ve uyarı gibi sistem kabloları Bant I (zayıf akım) ve Bant II (kuvvetli akım) kablolarından ayrı yollardan çekilmeli ya da aralarında separatör olmalıdır.",
        "kaynak": "TS HD 60364-5-52 · Binaların Yangından Korunması Hakkında Yönetmelik Md-83-(4)"
      },
      {
        "no": "30",
        "baslik": "Testler",
        "icerik": "Bölüm adı ve tanımı yapılarak her çevrimdeki ekipmanların hepsi test edilir, projedeki kodu veya tanımıyla rapordaki tabloya işlenir. Duman dedektörleri duman spreyiyle, ısı dedektörleri fön cihazıyla test edilebilir; testler sırasında uyarı amaçlı kullanılan sirenler de denenir.",
        "kaynak": "Binaların Yangından Korunması Hakkında Yönetmelik Md-84"
      }
    ],
    "notlar": [
      "Algılama, uyarı, acil aydınlatma ve yönlendirme sistemindeki bütün ekipmanlar (tüm dedektörler, tüm butonlar …) örnekleme yapılmadan kontrol ve teste tabi tutulur, sonuçları raporda belirtilir.",
      "Normal koşullarda kullanılan elektrik tesisatının yangın anında ek riske neden olmadığı (kesicilerin çalışması, yedek enerji kaynakları ve otomatik devreye girme) değerlendirilir.",
      "Kusur derecesi: (*) hafif kusurlu ve (**) ağır kusurlu anlamında kullanılır.",
      "Bir ekipmanın imalat mevzuatı veya standardı bir kriterin uygulanmasına izin vermiyorsa yalnız o ekipmanda kriter uygulanmaz; ilgili mevzuat / standart numarasına atıf yapılır.",
      "Projeyi onaylayanların ad soyadı, imzası, meslek unvanı, diploma numarası, tarih ve sayı, proje onay geçerlilik süresi eklenir."
    ]
  },
  {
    "kod": "ZPKK05",
    "ad": "Trafo Periyodik Kontrol Kriterleri",
    "tur": "TR",
    "rapor": "ZPKR05",
    "brans": "e",
    "yayim": "2025-07-18",
    "yururluk": "2025-09-01",
    "kapsam": "Elektrik Kuvvetli Akım Tesisleri Yönetmeliği kapsamındaki 1–36 kV arası tesislerde bulunan ekipmanların periyodik kontrolleri. Kontrol raporu her ekipman (trafo, kesici, hücre) için ayrı düzenlenir; uygunsuzluklar fotoğrafla gösterilebilir.",
    "maddeler": [
      {
        "no": "G1",
        "baslik": "Uyarı levhaları ve işaretler",
        "icerik": "Güvenliği etkileyen kontrol cihazları açıkça görülebilir ve tanınabilir olmalı; güç akımı cihazları, ölçü trafoları, ölçü aletleri ve sigortalar üzerinde silinmez, görünür işaretler bulunmalıdır. Plastik zincir, kilit ve güvenlik bariyerleri kontrol edilir.",
        "kaynak": "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği Ek-I 2.1.1 · Elektrik Kuvvetli Akım Tesisleri Yönetmeliği Madde 19"
      },
      {
        "no": "G2",
        "baslik": "Kesici, ayırıcı, koruma röleleri, ölçü trafoları",
        "icerik": "Her dağıtım trafosunun AG çıkışında termik-manyetik devre kesici bulunmalıdır. Aşırı yük koruma röleleri sekonder tarafta olmalı. Enerji ölçümü için akım trafoları Sınıf 0.5, gerilim trafoları Sınıf 1; koruma için en az Sınıf 3.",
        "kaynak": "Elektrik Kuvvetli Akım Tesisleri Yönetmeliği Madde 19, 38, 39"
      },
      {
        "no": "G3",
        "baslik": "Bara ve topraklama bağlantıları",
        "icerik": "Aktif bölümler kazara dokunmayı önleyecek şekilde erişilemez olmalı, güvenlik mesafeleri sağlanmalıdır. Metal gövdeli tüm yüksek akım ekipmanları ve koruyucu muhafazalar topraklama iletkenlerine bağlanmalıdır.",
        "kaynak": "Elektrik Kuvvetli Akım Tesisleri Yönetmeliği Madde 5, 18"
      },
      {
        "no": "G4",
        "baslik": "Trafo gövdesi, yağ, sıcaklık, Buchholz, basınç tahliye",
        "icerik": "Yağ seviye göstergesi zorunludur; yağ seviyesi radyatör girişinin üzerinde tutulur. Sıcaklık göstergeleri kadranlı, alarm / açma için kontaklı olmalıdır. 500–750 kVA üzeri yağlı trafolarda Buchholz rölesi zorunludur; iç basınca karşı basınç tahliye valfi gerekir.",
        "kaynak": "Elektrik Kuvvetli Akım Tesisleri Yönetmeliği Madde 37, 40"
      },
      {
        "no": "G5",
        "baslik": "Soğutma, aydınlatma, yıldız noktası topraklaması",
        "icerik": "Trafolar yeterli havalandırmaya sahip olmalıdır. YG hücreleri ve AG pano odaları en az 250 lux, trafo odaları en az 150 lux aydınlatılmalı; bölmelerde akülü acil aydınlatma bulunmalıdır. Trafolar hem koruma hem işletme topraklaması gerektirir.",
        "kaynak": "Elektrik Kuvvetli Akım Tesisleri Yönetmeliği Madde 37 · Elektrik Tesislerinde Topraklamalar Yönetmeliği Madde 4"
      },
      {
        "no": "G6",
        "baslik": "İş güvenliği malzemeleri",
        "icerik": "İstanka, izole sehpa, izole halı ve eldivenler gerilim seviyesine uygun sınıfta olmalı, hasarsız bulunmalı ve periyodik olarak test edilmelidir. Uygun sınıf yangın söndürücüler ve ilk yardım malzemeleri bulundurulmalıdır.",
        "kaynak": "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği Madde 9 · Elektrik Kuvvetli Akım Tesisleri Yönetmeliği Madde 25, 26"
      },
      {
        "no": "T0–T1",
        "baslik": "Topraklama ölçümü: hazırlık ve ölçüm noktası",
        "icerik": "Ölçüm trafo işletme sorumlusunun bilgisi ve refakatinde yapılır; elektromanyetik etkileşimin çok olduğu alanlarda enerjisiz ölçülür. Koruma topraklaması YG hücrelerini dolaşan şerit lamadan, işletme topraklaması ana dağıtım panosunun ana nötr barasından ölçülür.",
        "kaynak": "Elektrik Tesislerinde Topraklamalar Yönetmeliği · TS EN 50522"
      },
      {
        "no": "T2",
        "baslik": "Koruma kesiti",
        "icerik": "Koruma iletkeni kesitinin uygunluğu toprak kısa devre akımına göre belirlenir.",
        "kaynak": "Elektrik Tesislerinde Topraklamalar Yönetmeliği Ek-C"
      },
      {
        "no": "T3",
        "baslik": "Ayrık düzende topraklama geriliminin uygunluğu",
        "icerik": "tE kesicinin mevcut açma ayarından, UTP bu süreye göre ETTY Şekil 6'dan alınır; IE, 154 kV / 34,5 kV trafonun sekonderindeki RN direncine göre hesaplanır; UE = IE · RE. UE < 2·UTP ise uygun; UE < 4·UTP ise Ek-M önlemleri kontrol edilerek uygun. Ek önlemlerde aynı sınamalar USTP ile yapılır.",
        "kaynak": "Elektrik Tesislerinde Topraklamalar Yönetmeliği Ek-C Şekil 6, Ek-M"
      },
      {
        "no": "T4",
        "baslik": "Birleşik düzende topraklama geriliminin uygunluğu",
        "icerik": "AG tarafı TN ve PEN tek noktada topraklı ise UE < UTP; çok noktada topraklı ise UE < 2·UTP; AG tarafı TT ise U2 = UE + 0,23 kV < 1,2 kV.",
        "kaynak": "Elektrik Tesislerinde Topraklamalar Yönetmeliği Ek-M"
      }
    ],
    "notlar": [
      "Topraklama tesisatında görülen korozyon, kopma, kesit sorunları notlara yazılır ve öneride bulunulur; tesis kusur durumuna göre değerlendirilir.",
      "Kusur derecesi “*” hafif kusurlu ve “**” kusurlu anlamında kullanılır.",
      "Kriterler ekipmanın kullanım yeri, amacı, tipi ve modeline göre değişebilir; riskin bulunmadığı durumda kriter aranmaz.",
      "Isınma ve bağlantı noktası kontrollerinde termal kamera kullanıldığında Bakanlıkça aksi belirtilmedikçe ek eğitim şartı aranmaz.",
      "Projeyi onaylayanların ad soyadı, imzası, meslek unvanı, diploma numarası, tarih ve sayı, proje onay geçerlilik süresi eklenir."
    ]
  },
  {
    "kod": "ZPKK06",
    "ad": "Kule Kren Periyodik Kontrol Kriterleri",
    "tur": "KK",
    "rapor": "ZPKR06",
    "brans": "m",
    "yayim": "2025-09-05",
    "yururluk": "2026-01-01",
    "kapsam": "Güç tahrikli, en az bir kaldırma tertibatına sahip, yarı çap değiştirerek indirme ve kaldırma yapabilen, tamamı dönebilen ve/veya yürüyebilen, kulenin tepesine yerleştirilmiş kollu kule krenler. Kontrol, kriter tablosundaki içerikle yapılır; kusurlar bu tanımlamalara göre (madde numarasıyla) yazılır, tanımların dışına çıkılmaz. * hafif, ** ağır kusurdur.",
    "maddeler": [
      {
        "no": "1",
        "baslik": "Operatör talimatları ve işaretlemeler",
        "icerik": "** Yarı çapa göre kapasite bilgisi için göstergesi bulunmayan krenlerde yük kolu (bom) üzerinde kapasite ve mesafe levhaları vardır.\n* Kumanda yerlerinde kapasite diyagramı vardır.\n* Uzaktan kumanda üzerinde veya uzaktan kumandaya bağlı bir levha üzerinde kapasite diyagramı vardır.\n* Kullanım talimatları bulunmaktadır.\n* Kullanım talimatlarının içeriği kren ile tutarlıdır.\n** Kren üzerinde gerekli bilgilerin bulunduğu bilgi etiketi vardır.\n* Kren üzerinde bulunan risklere ait ikaz işaretleri vardır.\n* Kren erişim yerinde “yetkisiz kişiler çıkamaz” uyarı yazısı vardır.\n* Yük kolunu serbest bırakılması ile ilgili uyarı yazısı vardır.\n** Kaldırma tertibatına takılı platform üzerinde platforma nasıl erişileceği, müsaade edilen yük değeri, müsaade edilen kişi sayısı ve kalıcı risklere karşı uyarılar vardır.\n* Bilgi etiketi ve tüm işaretlemeler anlaşılırdır, dikkat çekicidir, okunaklıdır, doğru renktedir ve kolay sökülemeyecek şekilde iliştirilmiştir.",
        "kaynak": "TS EN 14439+A2 5.4.2.5.2 – 5.4.4.5.4 – 7.2.1 – 7.3.1 – 7.3.2"
      },
      {
        "no": "2",
        "baslik": "Kumanda yeri ve görüş",
        "icerik": "* Duruş konumlarına (ayakta duruş vb.) göre uygun boyutlar dadır. (Kullanılacak ölçüm cihazı: Şerit Metre)\n** Yükseltilebilen kumanda yeri olması durumunda kontrolsüz harekete karşı korunmaktadır ve sistem çalışır durumdadır.\n* Kaymaz zemindir.\n* Takılma riski yoktur.\n* Keskin kenar yoktur.\n** Acil (alternatif) çıkış vardır ve aktiftir.\n** Operatör fonksiyonlara rahat erişebilmektedir.\n* Isıtma ve havalandırma sistemleri çalışır durumdadır.\n* Kumanda yerine giriş ve çıkış için uygun boyutlarda kapı, kapak vb. araçlar sağlanmıştır. (Kullanılacak ölçüm cihazı: Şerit Metre)\n* Kapılar istemli bir şekilde açılabilmektedir ve açılma yönü uygundur.\n* Kapı kilitleri dışarıdan kilitlenebilmektedir ve içeriden her zaman açılabilmektedir.\n* Döşeme kapağı aşağı yönde açılmamaktadır.\n* Koltuk ayar mekanizmaları kilitlenebilirdir.\n* Koltuk ayar mekanizmaları çalışır durumdadır.\n* Kumanda yerinin tüm kısımlarında deformasyon yoktur.\n** Kumanda yeri b ağlantılarında çözülme yoktur ve titreşimden dolayı kendiliğinden çözülmesine karşı önlem alınmıştır.\n** Döşeme penceresi camı uygun özelliktedir veya ızgara ile donatılmıştır.\n** Döşeme penceresi açılabildiğinde düşme riskine karşı önlem alınmıştır.\n* Cam duvar bileşenleri uygun şekilde korunmaktadır.\n** Kabinin yük ile çarpışmas ı engellenmiştir veya kabi n kor uyucu bariyerlerle donatılmıştır.\n* Kabini koruyan bariyerlerde deformasyon yoktur.\n** Görüş alanı açıktır ve operatörün kren ve yük hareketini izlemesine imkan vermektedir.\n* Pencerelerin dış yüzeylerinin (ön kabin camı) temizlenmesi için araçlar bulunmaktadır ve çalışır durumdadır.\n* Pencerelerin iç taraflarını b uğu ve donmaya karşı muhafaza edecek araçlar bulunmaktadır ve çalışır durumdadır.\n* Göz kamaşması engellenmektedir.\n* Görsel ekranlar çalışır durumdadır.",
        "kaynak": "TS EN 14439+A2 5.4.1.1 – 5.4.1.3 – 5.4.1.4 – 5.4.1.5 – 5.4.1.6 – 5.4.1.7 – 5.4.1.8"
      },
      {
        "no": "3",
        "baslik": "Çalışma alanları ve kumanda yerine erişim",
        "icerik": "* İlk merdivenin yüksekliği en fazla 10 m’dir.\n** Her 6 m’de bir dinlenme platformu vardır. (Kendinden kurulan tiplerde 10 m)\n* Kumanda yerine (kabin vb.) kalıcı erişim vardır.\n* Zemin seviyesinde hareket eden krenlerde, her iki yönde kren tekerlekleri veya bojiler, ray süpürücüleri ve esnek temaslı koruma ile donatılmıştır.\n* Üzerinde yürünen yerler ve merdiven basamakları kaymaz zemindir.\n** Korkuluk yapısı ve boyutları uygundur. (Kullanılacak ölçüm cihazı: Şerit Metre)\n* Yürüyüş yolları, serbest duruş alanı genişlikleri ve adam giriş delikleri ölçüleri uygundur. (Kullanılacak ölçüm cihazı: Şerit Metre)\n* Merdiven ve merdiven koruyucuları uygun ölçülerdedir. (Kullanılacak ölçüm cihazı: Şerit Metre)\n** Merdiven ve merdiven koruyucularında deformasyon ve bağlantılarında çözülme yoktur.\n** Tüm erişimlerde üç nokta desteği vardır.\n* Kapak açıklıkları en az 0,4 m ila 0,5 m arasındadır.\n* Yük kollarına (bom) erişim için kaldırma tertibatı arabasına takılı platform veya kol üzerinde yürüme yolu (korkuluklu veya kişisel koruyucu donanımlı) vardır.\n* Yük kolları (bom) yürüyüş yolu üzerinde serbest yükseklik en az 1,8 m’dir.\n* Yük kolları (bom) yürüyüş yolu üzerinde ki ayak dayamalarının yüksekliği en az 0,03 m’dir.\n* Kaldırma tertibatını takılı platformun boyutları en 0,5 m X 0,35 m’dir. Kren üzerindeki bakım, onarım ve muayene faaliyetleri için tercih edilen erişim standartlara göre yapılan risk değerlendirmesi sonucuna göre belirlenmelidir. Kumanda yerine erişim personel asansörü ile sağlanıyorsa kumanda yerine erişim ilgili Periyodik Kontrol İçeriği ve Kriterlere göre kontrol edilir.",
        "kaynak": "TS EN 14439+A2 5.4.4.1 – 5.4.4.2 – 5.4.4.3 – 5.4.4.4 – 5.4.4.5.1 – 5.4.4.5.2 – 5.4.4.5.2"
      },
      {
        "no": "4",
        "baslik": "Yangın söndürücüler",
        "icerik": "* Kren üzerinde yangın söndürücü vardır.\n* Kontrol tarihi uygundur.\n* Basınç göstergesinin ibresi uygun alandadır.",
        "kaynak": "TS EN 14439+A2 5.4.1.1"
      },
      {
        "no": "5",
        "baslik": "Kumanda tertibatları",
        "icerik": "** Tüm kumandaların istem dışı çalışması engellenmiştir.\n* Kumanda butonları üzerinde veya yakınında semboller vardır ve okunaklı durumdadır.\n** Kumanda sembolleri ile hareketler tutarlıdır.\n** Kumanda fonksiyonları çalışır durumdadır.\n** Acil durum durdurmasının/durdurmalarının yapısı uygundur.\n** Acil durum durdurmasının/durdurmalarının istem dışı çalışması engellenmiştir.\n** Acil durum durdurması/durdurmaları çalışır durumdadır.\n** Acil durum durdurması/durdurmalarının konumu uygundur.\n** Kablosuz kumanda üzerinde ki acil durum durdurması çalışır durumdadır.\n** Kumandalar bas bırak (serbest bırakıldıklarında nötr konuma dönmesi) kumandadır.\n** Tüm kumandalarda özellikle iletkenlerle temas riski oluşturacak deformasyon yoktur.\n** Kablolu asılı kumandalar, operatörün kendisini tehlike bölgesinin dışına çıkarabilecek şekilde (yeterli uzunluk ve hareket kabiliyeti) tasarımlanmıştır.\n* Kablo arabası ve takozlarda deformasyon ve bağlantılarında çözülme yoktur.\n* Kablo arabası ve takozların hareket kabiliyeti engellenmemiştir.\n** Kablosuz kumanda da yetkisiz kullanı mı önleyecek araçlar faal iken veri ileticisi veri iletmemektedir.\n** Kablosuz kumandanın enerjisi bittiğinde devam eden komutlar durmaktadır.\n** Kablosuz kumanda fonksiyonları çalışır durumdadır.\n** Birden fazla kumanda bulunması durumunda acil durdurma h ariç tüm fonksiyonlar aynı anda çalışmamaktadır.\n** Birden fazla kumanda bulunması durumunda düzenleme seçme anahtarı çalışır durumdadır.",
        "kaynak": "TS EN 14439+A2 5.4.1.1 – 5.4.1.2 – 5.4.1.3"
      },
      {
        "no": "6",
        "baslik": "Ekipman yük bileşenlerinin mekanik dayanımı",
        "icerik": "** Bağlantılarda deformasyon ve çözülme yoktur.\n* Bağlantılarda titreşimden dolayı çözülmeye karşı önlem alınmıştır.\n** Yük bileşenlerinde (k ule, yük kolu, raylar, şasi, redük tör, kaldırma tertibatı arabası, bağlantılar, dişliler vb.) deformasyon yoktur.\n** Ekipmanın yükün gerilimi altındaki kısımları üzerinde tamir kaynağı vb. işlemler\n** Ekipmanın tamir k aynağı yapılan bölgesinde yapılan tahribatsız muayene sonuçlarında herhangi bir çatlak vb. süreksizlik yoktur.",
        "kaynak": "TS EN 14439+A2 5.2 yetkili kişi/kuruluşlar tarafından gerekli prosedürlere göre yapılmıştır."
      },
      {
        "no": "7",
        "baslik": "Tambur",
        "icerik": "* Halat sarımı düzenlidir.\n* Halat tambur sınırlarını aşmamaktadır.\n** Tamburda deformasyon ve bağlantılarında çözülme yoktur.\n** İndirme sınırlayıcısı devreye girdiğinde tambur üzerinde en az iki halat sarımı kalmaktadır.",
        "kaynak": "TS EN 14439+A2 5.3.2.1 – 5.3.2.2"
      },
      {
        "no": "8",
        "baslik": "Makara/makaralar",
        "icerik": "* Halat makaraları halat çapı ile uyumludur. (Kullanılacak ölçüm cihazı: Kumpas ve Şerit Metre)\n* Kanca bloğu makaraları halat çapı ile uyumludur. (Kullanılacak ölçüm cihazı: Kumpas ve Şerit Metre)\n** Kule kren yürüme rayı makaralarında deformasyon yoktur.\n** Tüm makaralarda deformasyon yoktur.\n** Tüm makaralarda dönüş uygundur.",
        "kaynak": "TS EN 14439+A2 5.3.2.1 – 5.3.2.2 – 5.3.2.4"
      },
      {
        "no": "9",
        "baslik": "Koruma tertibatları",
        "icerik": "* Sıcak yüzeylerin oluşturacakları risklere karşı koruma vardır ve deformasyon yoktur.\n* Açık dişliler ve benzeri güç iletimleri çalışanlara zarar vermeyecek şekilde kapatılmıştır.\n* Hareketli parçaların oluşturacakları risklere karşı korumalar vardır ve deformasyon yoktur.\n* Kaldırma aksamları (halat veya zincir) ve kasnak ve/veya makaralar arasına yabancı madde veya uzuv sıkışma riskine karşı koruma vardır ve deformasyon yoktur.\n** Kaldırma aksamlarının (halat veya zincir) kasnaklarından ve/veya makaralarından çıkma riskine koruma vardır ve deformasyon yoktur.\n* Yürüyüş yolu ve yürüyüş aksamları arasına yabancı cisim ve uzuv sıkışması riskine karşı önlemler vardır ve deformasyon yoktur.\n* Kişilere zarar verebilecek tüm kasnak vb. koruyucularla kapatılmıştır.\n* Kumanda yerinde basınçlı aksamların oluşturacakları risklere karşı koruma vardır ve deformasyon yoktur.",
        "kaynak": "TS EN 14439+A2 5.3.2.1 – 5.4.3.1"
      },
      {
        "no": "10",
        "baslik": "Sınırlama ve gösterge cihazları",
        "icerik": "** Nominal kapasite sınırlayıcı vardır ve çalışır durumdadır.\n** Nominal kapasite sınırlayıcı en az iki adettir.\n** Rüzgâr hızı göstergesi çalışır durumdadır.\n* Rüzgâr hızı göstergesinde deformasyon yoktur.\n** Tüm hareket sınırlayıcıları sınırladıkları hareketin tersine izin vermektedirler.\n** Kaldırma sınırlayıcı vardır.\n** Kaldırma sınırlayıcı çalışır durumdadır.\n** Kaldırma sınırlayıcı mesafesi uygundur. (Kullanılacak ölçüm cihazı: Şerit Metre)\n** İndirme sınırlayıcı vardır.\n** İndirme sınırlayıcı çalışır durumdadır.\n* Kaldırma tertibatı arabası hareketi sonundaki sınırlayıcılar vardır ve çalışır durumdadır.\n** Yük kolu (bom) kaldırma sınırlayıcısı çalışır durumdadır.\n** Yük kolu (bom) indirme sınırlayıcısı çalışır durumdadır.\n** Dönüş sınırlayıcısı çalışır durumdadır.\n** Kumanda yeri (kabin vb.) konum sınırlayıcısı çalışır durumdadır.\n* Çalışma yükü göstergesi çalışır durumdadır.\n* Yük kolu (bom) açısı göstergesi çalışır durumdadır.\n* Dönme aralığı göstergesi çalışır durumdadır.\n** Kren yürüyüş sınırlandırıcısı vardır ve çalışır durumdadır.\n* Çalışma alanı sınırlayıcısı çalışır durumdadır.\n* Çarpışma önleyici sınırlayıcı çalışır durumdadır.\n** Şasi konum sınırlayıcılar vardır ve deformasyon yoktur.\n** Raydan çıkmaya karşı koruma tedbirleri vardır.\n* Raydan çıkmaya karşı koruma tedbirlerinde deformasyon yoktur.\n** Ray tekerleklerinde deformasyon ve bağlantılarında çözülme yoktur.\n** Yönlendirme sistemi komutları yürüyüş sistemi ile tutarlıdır.\n** Tüm seyir hareket raylarının sonunda mekanik durdurucular vardır.\n* Tüm seyir hareket raylarının sonunda ki mekanik durdurucularda deformasyon ve bağlantılarında çözülme yoktur.\n* Tüm seyir hareket raylarının sonunda ki mekanik durdurucularda tampon vardır ve deformasyon yoktur.\n** Tüm seyir raylarının sonunda ki mekanik durduruculara temas aynı anda\n** Dönüş dişlilerinde ve yataklarında deformasyon yoktur.\n** Tüm hareket sınırlayıcıları devre dışı bırakma tertibatının kumandası bas bırak tiptedir ve çalışır durumdadır.\n** Kaldırma tertibatı arabası halatlarının kopması durumunda kaldırma tertibatı arabası durmaktadır.\n** Hizmet dışı durumda olumsuz rüzgâr şartlarında kontrolsüz hareketler engellenmektedir.\n** Hizmet dışı durumda olumsuz rüzgâr şartlarında kontrolsüz hareketleri engelleme tertibatlarında deformasyon yoktur ve çalışır durumdadırlar. Sınırlayıcıların ve göstergelerin uygulama zorunluluğu kren türlerine göre değerlendirilmelidir.",
        "kaynak": "TS EN 14439+A2 5.2.2.5 – 5.4.2.1 – 5.4.2.3 – 5.4.2.4 – 5.4.2.5 – 5.4.2.6.1 – 5.4.2.6.2 – 5.4.2.7 – 5.4.2.8 – 5.4.2.9 – 5.4.2.10 gerçekleşmektedir."
      },
      {
        "no": "11",
        "baslik": "Fren sistemi/sistemleri",
        "icerik": "** Enerji kesintisinde tüm hareketleri (kaldırma tertibatı arabası, dönüş, kaldırma ve indirme) durduran frenler devreye girmektedir.\n** Kren hareketleri (kaldırma tertibatı arabası ve dönüş) uygun şekilde durmaktadır.\n** Kaldırma ve indirme frenleri çalışır durumdadır.\n** Yük kolu (bom) kaldırma ve indirme frenleri çalışır durumdadır.\n** Dönme hareketi uygun şekilde durmaktadır. Bu bölümdeki kontroller yüksüz durumda mekanik dayanım (fonksiyon testi) ve yük diyagramına göre yüklü mekanik dayanım (yük testi) testleri ile birlikte değerlendirilmelidir. Yavaşlama ivme değerleri kontrol kapsamında değildir.",
        "kaynak": "TS EN 14439+A2 5.3.2.1 – 5.3.2.2"
      },
      {
        "no": "12",
        "baslik": "Halatlar",
        "icerik": "** Halat sonlandırmaları uygun yöntemlerle yapılmıştır ve bağlantılarında çözülme yoktur.\n** Halatta/halatlarda deformasyon yoktur. (Kullanılacak ölçüm cihazı: Kumpas ve/veya Mastar)",
        "kaynak": "TS EN 14439+A2 5.3.2.3 · TS ISO 4309 5 – 6"
      },
      {
        "no": "13",
        "baslik": "Kanca/kancalar",
        "icerik": "** Kanca ağız açıklığı ölçüsü uygundur. (Kullanılacak ölçüm cihazı: Kumpas ve/veya Mastar)\n** Kanca gövde kesiti ölçüsü uygundur. (Kullanılacak ölçüm cihazı: Kumpas ve/veya Mastar)\n** Kırılma, parça kopması vb. deformasyon yoktur.\n* Kancanın kendi etrafında serbest dönüş hareketi uygundur.\n** Kanca üzerinde kaynak işlemi yoktur.\n** Yükün kontrolsüz hareketi engellenmiştir. (Güvenlik mandalı, kanca şekli vb.)",
        "kaynak": "TS EN 14439+A2 5.3.2.1 – 5.3.2.2"
      },
      {
        "no": "14",
        "baslik": "Sesli ve/veya görsel ikazlar",
        "icerik": "** Nominal kapasit e sınırlayıcı görülebilir veya işitilebilir ikazı vardır ve çalışır durumdadır.\n* Nominal kapasite sınırlayıcı ikazı nominal kapasitenin % 90 ila % 95 atasında bir değerde yaklaşma ikazı vermektedir.\n** Uzaktan kumanda ile çalışan kule krende nominal kapasite sınırlayıcı ikazı görülebilir ikazdır.\n* Kablosuz kumanda üzerinde yeşil renkli görülebilir ikaz vardır.\n** Kablosuz kumanda üzerinde nominal kapasite ikazı görülebilirdir veya kren üzerinde sarı renkli görülebilir ikaz vardır.\n* Rüzgâr hızı göstergesi ikaz seviyesi için yanıp sönen (çakar) sarı ve alarm seviyesi için yanıp sönen (çakar) kırmızı renkli görsel ve sesli ikazı vardır ve çalışır durumdadır.\n* Var olan görsel ikazlar çalışır durumdadır.\n** Var olan sesli ikazlar çalışır durumdadır.\n** Kumanda yeri (kabin vb.) olduğunda operatör kontrollü sesli ikaz (korna vb.) vardır ve çalışır durumdadır.\n* Çarpışma önleyicinin devre dışı bırakılması durumunda iş sahasındaki kişilerin uyarılması için yanıp sönen (çakar) beyaz renkli ikaz vardır ve çalışır durumdadır.\n* Hizmet dışı durumda olumsuz rüzgâr şartlarına karşı serbest bırakma tertibatı için yanıp sönen (çakar) yeşil renkli görsel ikaz vardır ve çalışır durumdadır. Rüzgâr hızı göstergesi, çarpışmayı önleme tertibatının devre dışı bırakılması v e hizmet dışı durumda rüzgar şartlarına karşı serbest bırakma tertibatı dış taraf görsel ikazları yerel idarenin zorunlu kılması durumunda olmalıdır.",
        "kaynak": "TS EN 14439+A2 5.4.1.1 – 5.4.2.5.1 – Ek B B.4.1 – Ek B B.4.2 – 5.4.2.10 – 5.4.6.1 – Ek C C.1 – C.2 – C.3"
      },
      {
        "no": "15",
        "baslik": "Aydınlatma",
        "icerik": "* Kumanda yeri aydınlatması vardır, çalışır durumdadır ve yeterli seviyede aydınlatma şiddetine sahiptir. (Kullanılacak ölçüm cihazı: Aydınlık ölçer)\n* Kumanda yeri aydınlatma armatürü ve anahtarında deformasyon ve bağlantılarında çözülme yoktur.\n* Erişim yolları aydınlatması vardır ve çalışır durumdadır.\n** Acil veya acil çıkış aydınlatması vardır ve çalışır durumdadır.",
        "kaynak": "TS EN 14439+A2 5.4.5"
      },
      {
        "no": "16",
        "baslik": "Elektromekanik",
        "icerik": "* Tüm elektrikli emniyet tertibatları çalıştığında, tahrik makinasının harekete geçmesi engellenmekte veya durma sürecini başlatmakta ve işlevsel frenleri harekete geçirmektedir.\n* Kumanda ve/veya enerji panolarında kanal /pano kapakları, kablo girişleri ve kablo muhafazaları uygundur. Ucu açıkta kablo yoktur.\n* Motorları aşı rı yüke karşı tüm gerilimli iletkenlerin motora sağladığı enerjiyi keserek koruyan sistem (sigorta vb.) vardır ve çalışır durumdadır.\n* Aydınlatma ve priz devrelerini aşırı yüke karşı tüm gerilimli iletkenlerin aydınlatma ve priz devrelerine sağladığı ener jiyi keserek koruyan sistem (sigorta vb.) vardır ve çalışır durumdadır.\n* Motor sargılarının tamamı aşırı yüke karşı ayrı ayrı korunmaktadır.\n* Ana anahtar kontrol ve bakım için gerekli olan priz çıkışlarına veya aydınlatmaya sağlanan enerjiyi kesmemektedir.\n** Ekipmanın yakınında ana anahtar vardır ve çalışır durumdadır.\n* Ana anahtar kilitlenebilir tiptedir.\n* Termik röle/röleler çalışır durumdadır.\n* PTC çalışır durumdadır.\n* Motor koruma (faz sıralı) rölesi vardır.\n* Motor koruma (faz sıralı) rölesi faz eksikliğinde devreye girerek motoru durdurmaktadır.\n* Motor koruma (faz sıralı) rölesi fazların yer değiştirmesinde devreye girerek motoru durdurmaktadır.\n* Kontaktörlerin açmama (yapışma) riskine karşı önlem alınmıştır.\n* Güç besleme devresinde seri şeklinde yer alan kontaklardaki besleme iki bağımsız kontaktör ile kesilmektedir.\n* Motor fren bobini seri iki kontaktörden enerjilendirilmektedir. Bu bölümde belirtilen kontroller sadece elektriksel donanımın mekanik risklerle ilgili olan kısımlarını ve ilişkisini kapsamaktadır. Bu bölümde belirtilen kontroller iş ekipmanının elektrik tesisatı, topraklama tesisatı vb. periyodik kontrollerini kapsamaz.",
        "kaynak": "TS EN 14439+A2 5.3.1"
      },
      {
        "no": "17",
        "baslik": "Yüksüz test",
        "icerik": "** Ekipman yüksüz durumda iken tüm fonksiyonları yerine getirilerek test gerçekleştirildi, frenler çalışır durumdadır, bağlantılarda çözülme ve deformasyon yoktur. Her periyodik kontrolde gerçekleştirilir.",
        "kaynak": "TS EN 14439+A2 5.3.2.1 – 5.3.2.2 · TS ISO 9927-1 6.4"
      },
      {
        "no": "18",
        "baslik": "Yüklü test",
        "icerik": "** Ekipman nominal kapasite ile yüklü iken tüm fonksiyonları yerine getirilerek test gerçekleştirildi, frenler çalışır durumdadır, bağlantılarda çözülme ve deformasyon yoktur. Her periyodik kontrolde gerçekleştirilir.",
        "kaynak": "TS EN 14439+A2 5.3.2.1 – 5.3.2.2 · TS ISO 9927-1 6.5"
      },
      {
        "no": "19",
        "baslik": "Statik test",
        "icerik": "** Önemli bakım onarım faaliyetlerinden sonra e kipmanın kapasitesinin ve/veya yük diyagramı içinde kalan bir değerin 1,25 katı yüklü durumda iken test gerçekleştirildi, frenler çalışır durumdadır, bağlantılarda çözülme ve deformasyon yoktur. (Kullanılacak ölçüm cihazı: Şerit Metre) Önemli bakım ve onarım faaliyeti yoksa statik test gerçekleştirilmez.",
        "kaynak": "TS EN 14439+A2 Ek D D.3.3.2 · TS ISO 9927-1 6.6 · TS 10116 5.3.2"
      },
      {
        "no": "20",
        "baslik": "Dinamik test",
        "icerik": "** Önemli bakım onarım faaliyetlerinden sonra e kipmanın kapasitesinin ve/veya yük diyagramı içinde kalan bir değerin 1,1 katı yüklü durumda iken test gerçekleştirildi, frenler çalışır durumdadır, bağlantılarda çözülme ve deformasyon yoktur. Önemli bakım ve onarım faaliyeti yoksa dinamik test gerçekleştirilmez.\nNot: Kusur derecesi “*” hafif kusurlu ve “**” ağır kusurlu anlamında kullanılmaktadır.\nNot: Statik ve dinamik test yapılan periyodik kontrolde ekipmanın tam kapasitesi ile yapılan yüklü testinin yapılmasına gerek yoktur.\nNot: Tanımlar Bu dokümanda geçen; Kren: Köprü, kiriş, kaldırma tertibatı (vinç bloğu), yürüme grupları, yük kolu (bom) vb. kısımları barındıran sistemin tümünü, Kaldırma tertibatı: Kanca, halat, tambur, motor vb. kısımları barındıran kaldırma ve indirme işlemini gerçekleştiren kren sisteminin bir parçası nı (vinç bloğu vb.), Nominal kapasite: Yükün konumu ve krenin konfirigasyonuna göre normal çalışma sırasında krenin kaldırmak üzere tasarımlandığı maksimum yük. Mast: Birbirine monte edilerek kuleyi oluşturan parçasını, ifade eder.\nNot: Kontrol içeriğinde belirtilen kriterler ekipmanın kullanım yeri, kullanım amacı, tip, model ve imalat yıllarına vb. göre değişkenlik gösterebilmektedir. İlgili imalat mevzuatı ve/veya standardı baz alınarak ekipmanda belirtilen risklerin bulunmadığı durumda kontrol kriterleri a ranmayacaktır. Kontrol içeriğinde belirtilen kriterin o e kipmanda aranıp aranmayacağı ile ilgili karar, standart maddesi bölümünde atıf yapılan mevzuat ve/veya standart maddelerine göre verilmelidir. Kriterin kontrol içeriğinde bulunması her ekipman için zorunlu olarak aranacak kriter anlamına gelmemektedir.\nNot: Standart maddesi bölümünde belirtilen standart/standartlar metodun ve kriterlerin oluşturulması için referans olarak belirtil miştir. Üreticinin beyan etmiş olduğu farklı bir standart (farklı bir ülke standardı vb.) olması durumunda, üreticinin beyan etmiş olduğu standardın içerik bölümünde belirtilen kriteri karşılayan ilgili maddesi dikkate alınmalıdır.",
        "kaynak": "TS EN 14439+A2 Ek D D.3.3.3 · TS ISO 9927-1 6.6 · TS 10116 5.3.3"
      }
    ],
    "notlar": [
      "Kusurlar madde numarası ve tanımıyla ilişkilendirilir; ör. “12.2 - ** Halatta/halatlarda deformasyon yoktur.” kriteri için açıklamalı kusur (AA03).",
      "Hafif kusurlar bir sonraki periyodik kontrol başlangıç tarihine kadar giderilir (Ek-III 1.9.1); işveren giderildiğini gösteren belgeyi sunar.",
      "Bir sonraki periyodik kontrol başlangıç tarihi = başlangıç tarihi + işverenin Ek-III 1.4 ve 1.10'a göre belirlediği aralık."
    ]
  },
  {
    "kod": "ZPKK07",
    "ad": "Asılı Erişim Donanımı Periyodik Kontrol Kriterleri",
    "tur": "AE",
    "rapor": "ZPKR07",
    "brans": "m",
    "yayim": "2025-09-26",
    "yururluk": "2026-02-01",
    "kapsam": "Yapı bakım üniteleri, geçici asılı erişim donanımları ve asılı koltuklar. Kontrol, kriter tablosundaki içerikle yapılır; kusurlar bu tanımlamalara göre (madde numarasıyla) yazılır. * hafif, ** ağır kusurdur.",
    "maddeler": [
      {
        "no": "1",
        "baslik": "Operatör talimatları ve işaretlemeler",
        "icerik": "* Yardımcı kaldırma mekanizmasının kancası yardımcı kaldırma mekanizmasının kapasitesi ve kişilerin kaldırılmasının yasak olduğuna dair bilgi ile işaretlenmiştir.\n* Platform üzerinde yardımcı kaldırma mekanizmasının kapasitesi belirtilmiştir.\n* Geçici karşı ağırlıklı kiriş asma donanımları talimatları kiriş üzerine sabitlenmiştir ve okunaklıdır.\n* Kablosuz kumanda kullanımında kişilerin ezilme ve sıkışma risklerinin bulunduğu yerlerde kablosuz kumanda kullanıldığına dair bir uyarı ve kablosuz kumanda çalışırken görülebilir i kaz/platformun çalışmaya başlamasından önce işitilebilir ikaz vardır.\n* Geçici asılı platform larda türüne bağlı olarak üzerinde platformun tanımlaması, geçici asılı platformun imalatçısının veya yetkili temsilcisinin ticari adı ve açık adresi, asılı platformun üreticisinin ve tedarikçisinin adı ve adresi, seri veya tipin tanımı, seri numarası (varsa), nominal kapasite ve platform boyutlarına göre maksimum kişi sayısı tablosu, konsollu çıkmaların uzunluğu ve maksimum çalışma yükü, farklı platform konfigürasyonlarını gösteren şematik gösterim, ayrı bileşenler için ana bileşen üzerinde izlenebilirlik, emniyet kemeri takma noktası (varsa) bilgilerinin olduğu etiket/etiketler vardır.\n* Yapı bakım ünitelerinde türüne bağlı olarak üzerinde platformun tanımlaması, yapı bakım ünitesinin imalatçısının veya yetkili temsilcisinin ticari adı ve açık adresi, asılı platformun üreticisinin ve tedarikçisinin adı ve adresi, seri veya tipin tanımı, seri numarası (varsa), kendi ağırlığı, nominal kapasite ve maksimum kişi sayısı, yardımcı kaldırma mekanizması nominal kapasitesi (varsa), sökülebilir hareketli asma donanımının olduğu durumlarda asma donanımının maksimum yük kapasitesi, emniyet kemeri takma noktası (varsa) bilgilerinin olduğu etiket/etiketler vardır.\n* Manuel kaldır ma mekanizmalarının üzerinde maksimum çalışma kapasitesi, halat çapı ve halatın özellikleri bilgilerinin olduğu etiket vardır.\n* Güç tahrikli kaldırma mekanizmalarının üzerinde maksimum çalışma kapasitesi, nominal kaldırma hızı, halat çapı ve halatın özellikleri bilgilerinin olduğu etiket vardır.\n** İkincil güvenlik cihazları üzerinde maksimum çalışma kapasitesi, halat çapı, tetikleme hızı (varsa) bilgilerinin olduğu etiket vardır.\n* Geçici asılı platformun dengesinin karşı ağırlıklarla sağlanması durumunda asma donanımının üzerinde kaldırma mekanizmasının maksimum çalışma yükü, yük kolunun iç ve dış kısmının uzunluğu bilgilerinin olduğu etiket vardır.\n* Parapet kıskacıyla bağlanan geçici asılı platformlarda asma donanımının üzerinde kaldırma mekanizmasının maksimum çalışma yükü, yük kolunun dış kısmının uzunluğu ve destekler arası uzunluk bilgilerinin olduğu etiket vardır.\n* Bilgi etiketi ve tüm işaretlemeler anlaşılırdır, dikkat çekicidir, okunaklıdır, doğru renktedir ve kolay sökülemeyecek şekilde iliştirilmiştir.",
        "kaynak": "TS EN 1808:2015 8.12 – 9.4.3 – 11.5 – 13.1.2 – 13.1.3 – 13.1.4"
      },
      {
        "no": "2",
        "baslik": "Yetkisiz kullanıma ve müdahaleye karşı koruma",
        "icerik": "* Aşırı yük algılama cihazı ayar mekanizması yetkisiz müdahaleye karşı korunmuştur.\n* İkincil fren yetkisiz sıfırlamaya karşı korunmuştur.\n** Geçici asma donanımı karşı ağırlıkları yetkisiz müdahaleye karşı kilitlenebilirdir.\n* Asma donanımı kumandaları yetkisiz müdahaleye karşı kilitlenebilirdir.",
        "kaynak": "TS EN 1808:2015 8.3.5.8 – 8.9.3.8 – 9.4.3 – 11.1.8"
      },
      {
        "no": "3",
        "baslik": "Koruma tertibatları",
        "icerik": "* Motorlar ve servis frenleri dış ortam, atmosferik vb. etkilere karşı korunmaktadır.\n** Kaldırma aksamlarının (halat vb.) kasnaklarından ve/veya makaralarından çıkma riskine karşı koruma vardır.\n* Kaldırma aksamlarının (halat, zincir vb.) kasnaklarından ve/veya makaralarından çıkma riskine karşı koruma tertibatlarında deformasyon ve bağlantılarında çözülme yoktur.\n* Tahrik kasnaklarında/tamburlarında sarım düzenlidir.\n* Tahrik kasnaklarında/tambur larında sarım düzeni sağlayan sistem çalışır durumdadır, üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n* Halat depolama tamburlarında halatın dışa çıkması engellenmiştir.\n* Tahrik ünitesi çatıya monteli traksiyon el vinç ise askı ve e mniyet halatları tambur vb. üzerine sarılmalıdır.\n* Kaldırma aksamları (halat vb.) ve kasnak ve/veya makaralar arasına yabancı madde veya uzuv sıkışma riskine karşı koruma vardır, deformasyon ve bağlantılarında çözülme yoktur.\n* Seyir hareketi tahrik sisteminin zincir ve zincir bağlantılarının koruma kapakları görsel inceleme yapmaya müsaade etmektedir.\n** Seyir hareketi tahrik sistemin zincirinin çarklarından çıkma riskine karşı koruma vardır.\n* Seyir hareketi tahrik sisteminin yük taşıma ve emniyet somununun aşınma durumu kolay gözlemlenebilirdir.\n* Seyir hareketi tahrik sisteminin kremayer (çubuk) ve pinyon dişlileri ve bağlantılarının koruma kapakları görsel inceleme yapmaya müsaade etmektedir.\n* Çatıda seyreden yürüme arabasının arkası ile herhangi bir bitişik sabit yapı arasında sıkışma ve ezilme riskini önlemek için gerekli açıklıklar vardır veya önlemler alınmıştır. (Kullanılacak ölçüm cihazı: Şerit metre)\n* Çatıda seyreden yürüme arabasının tekerleri ile yürüme yolu arasında ayak sıkışmasını engelleyecek tertibatlar vardır, üzerlerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n* Kalıcı asma donanımlarının hareketli parçalarıyla temas riskini önlemek için kapak vb. korumalar vardır, çıkarıldıklarında ekipman üzerinde kala bilmektedir, üzerlerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.",
        "kaynak": "TS EN 1808:2015 8.1.6.5 – 8.4.1.1 – 8.4.1.2 – 8.4.3 – 8.6.1 – 8.6.2 – 8.7.2 – 8.10.1 – 8.10.6 – 9.2.7 – 9.2.8.2 – 9.2.9.3 – 9.3.2 – 9.3.3 – 9.3.7"
      },
      {
        "no": "4",
        "baslik": "Asılı platform veya koltuk",
        "icerik": "** En küçük geçiş genişliği uygun ölçüdedir. (Kullanılacak ölçüm cihazı: Şerit metre)\n** Çalışma yüzeyi alanı uygun ölçüdedir. (Kullanılacak ölçüm cihazı: Şerit metre)\n* Zemin kaymaz malzemeden yapılmıştır.\n* Zemin malzemesi (uzatmalar da dahil) zemine sabitlenmiştir ve maksatlı müdahale (alet gerektiren vb.) ile çıkartılabilirdir.\n* Zemin kolay temizlenebilmekte ve sıvı dökülmeleri kolay boşalabilmektedir.\n** Zeminde bulunan açıklıklar uygun ölçüdedir. (Kullanılacak ölçüm cihazı: Şerit metre)\n* Zeminde deformasyon yoktur.\n** Tüm kenarlarda üst korkuluk, ara korkuluk ve süpürgelik (tekmelik) vardır.\n** Üst korkuluk, ara korkuluk ve süpürgelik (tekmelik) ölçüleri uygundur. (Kullanılacak ölçüm cihazı: Şerit metre)\n** Üst korkuluk, ara korkuluk ve süpürgelikte (tekmelik) deformasyon ve bağlantılarında çözülme yoktur.\n** Platform bileşenlerinde (üst korkuluk, ara korkuluk, tekmelik ve zemin) yaralanmalara neden olacak keskin kenar ve köşe yoktur.\n** Çatısı bulunan platformlarda platform çatısında deformasyon ve bağlantılarında çözülme yoktur ve koruma sağlamaktadır.\n** Platform üzerinde veya asma donanımı üzerinde kişisel koruyucu donanım bağlantı noktası olan platformlarda bağlantı noktasında herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Modüller platformlarda platformu oluşturan parçalar yanlış monte edilmemiştir ve yanlış monte edilemeyecek şekildedir.\n** Modüller platformlarda platformu oluşturan parçalar uyumludur.\n* Modüler platformlarda platformu oluşturan parçaların bağlantıları görünürdür.\n* Kaldırma mekanizması platform üzerinde olan yapı bakım ünitelerinde askı aksamları (halat vb.) ve güvenlik halatları tambur vb. donanımlara sarılmaktadır, bu donanımlar çalışır durumdadı r, herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Yapı bakım ünitesi platformunun tüm kenarlarındaki korkuluklar tam kapalıdır. Açıklıklı bir yapı ise açıklıkların boyutu uygun ölçüdedir. (Kullanılacak ölçüm cihazı: Kumpas ve/veya Şerit metre)\n** Giriş kapısı/kapıları kayar tiptir veya içe doğru açılmaktadır.\n** Giriş kapısı/kapıları istem dışı açılmamaktadır ve kilit vb. mekanizmaları çalışır durumdadır.\n* Giriş k apısında/kapılarında ve kilit mekanizmalarında deformasyon ve bağlantılarında çözülme yoktur.\n** Giriş kap ısı/kapıları ya kendiliğinden kapanabilmektedir veya elektriksel olarak kontrol edilmektedir.\n** Katlı platformlarda platformlar arası güvenli geçişi sağlayan merdiven ve geçiş kapağı vardır.\n* Platformlar arası geçişi sağlayan merdiven ve kapakta deformasyon ve bağlantılarında çözülme yoktur.\n** Platformlar arası geçişi sağlayan kapak yukarı doğru açılmaktadır, merdiveni engellememektedir ve açık konumda kalmayacak şekilde tasarımlanmıştır.\n* Katlı platformlarda platformlar arasındaki ölçü uygundur. (Kullanılacak ölçüm cihazı: Şerit metre)\n** Platformlar arasındaki merdivende gerektiğinde çemberli koruyucu vardır.\n* Platformlar arasındaki merdivenin çemberli koruyucusu uygun ölçüdedir ve herhangi bir deformasyon ve bağlantılarında çözülme yoktur. (Kullanılacak ölçüm cihazı: Şerit metre)\n** Asılı koltuk oturma yeri ölçüleri uygundur. (Kullanılacak ölçüm cihazı: Şerit metre)\n** Asılı koltukta herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Asılı koltukta iki noktalı emniyet kemeri vardır, çalışır durumdadır, üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n* Asılı koltukta tüm kontroller operatörün kolayca erişebileceği şekildedir.\n* Tutma sistemi emniyet tertibat ı kolayca takılıp çıkar ılabilirdir (alet vb. gerektirmeden) ve çalışır durumdadır.\n** Tutma sistemi uygun aralıklarla konulmuştur. (Kullanılacak ölçüm cihazı: Şerit metre vb. mesafe ölçerler)\n* Platform yukarı yönde hareket ederken tutma sistemi noktalarında otomatik olarak durmaktadır, hareketin devamı için bağlantı algılanmaktadır ve sistem çalışır durumdadır.\n* Tutma sistemi bağlantı elemanlarının düşmesi engellenmiştir.\n* Tutma sistemini n bağlantıları operatörün bağlantı ları yapabilmesi için uygun mesafededir. (Kullanılacak ölçüm cihazı: Şerit metre vb. mesafe ölçerler)\n* Tutma sistemi ve tüm bağlantı elemanlarında herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Platform tampon destekleri (tekerlek, şerit vb.) vardır ve üzerlerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Eğimli yüzeyde çalışan platformlar tekerleklerle donatılmıştır.\n* Eğimli yüzeyde çalışan platformların tekerleklerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n* Platformların tekerleklerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.",
        "kaynak": "TS EN 1808:2015 7.1.1 – 7.1.2 – 7.1.3 – 7.1.4 – 7.1.5 – 7.1.6 – 7.1.8 – 7.2 – 7.3 – 7.4 – 7.5 – 7.6 – 7.7.2.2 – 7.7.3 – 7.7.4 – 7.8 – 7.9.2"
      },
      {
        "no": "5",
        "baslik": "Kaldırma ve emniyet askı aksamları",
        "icerik": "** Kullanılan halatlar korozyona karşı dayanıklıdır.\n** Kaldırma askı halatlarının çapı belirlenen minimum değerin altında değildir. (Kullanılacak ölçüm cihazı: Kumpas ve/veya Mastar)\n** İkincil (emniyet) halatı çapı kaldırma askı halatlarının çapından daha düşük değildir. (Kullanılacak ölçüm cihazı: Kumpas ve/veya Mastar)\n** Halat sonlandırmaları uygun yöntemlerle yapılmıştır ve bağlantılarında çözülme yoktur.\n* Halat sonlandırmalarında herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Halatta/halatlarda deformasyon yoktur. (Kullanılacak ölçüm cihazı: Kumpas ve/veya Mastar)\nNot: Halat iptal kriterleri için üretici tarafından farklı bir bilgi beyan edilmediği durumlarda",
        "kaynak": "TS ISO 4309 standardında belirtilen iptal kriterleri göz önünde bulundurulabilir. · TS EN 1808:2015 8.11.1 – 8.11.2 – 8.11.3"
      },
      {
        "no": "6",
        "baslik": "Fren sistemi/sistemleri",
        "icerik": "** Enerji kesintisinde (ana güç kaynağı, manuel kuvvet, kumanda tertibatını besleyen) kaldırma mekanizmaları için frenler devreye girmektedir.\n** Seyir hareketleri için fren sistemi vardır ve çalışır durumdadır.\n* Seyir hareketi için manuel ve güç tahrikli sistemleri beraber düzenlenmiş ve sistemler aynı hareket kısıtlamalarını kullanıyorlarsa sistemlerin aynı anda kullanılmaları engellenmiştir.",
        "kaynak": "TS EN 1808:2015 8.1.6.1 – 9.2.3 – 9.2.5.3 – 9.3.3"
      },
      {
        "no": "7",
        "baslik": "Mekanik hareket sınırlayıcı/sınırlayıcıları",
        "icerik": "** Asma donanımı (yatay eksende yürünen kısım (ray, düz zemin vb.) hariç asılı platformun halat vb. aksamlarla asıldığı yapı ve/veya yürüme arabası) hareketlerinin deformasyon ve bağlantılarında çözülme yoktur.\n** Seyir hareketi sınırlama anahtarları çalışır durumdadır ve mekanik sınır durdurucularla temastan önce devreye girmektedir.\n* Seyir hareketi sınırlama anahtarlarında herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Seyir hareketi tahrik sistemi vida somun sisteminde somunların vidadan ayrılmasını engelleyen mekanik durdurucular vardır, üzerlerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Seyir hareketi tahrik sistemi h idrolik silindirlerin te leskopik hareketleri mekanik olarak sınırlandırılmıştır, herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Yük tutma amaçlı pnömatik silindirler kullanılmamıştır.\n** Seyir hareketi tahrik sisteminde yük tutan hidrolik silindirler de kontrolsüz hareketlere karşı koruma (yük tutma (kilit) valfi, patlak boru valfi vb.) vardır ve çalışır durumdadır.\n* Seyir hareketi tahrik sisteminde yük tutan hidrolik silindirlerde kontrolsüz hareketlere karşı koruma (yük tutma (kilit) valfi, patlak boru valfi vb.) valfleri silindire yekpare bağlanmıştır veya rijit borularla bağlanmıştır.\n** Tampon/tamponların montajı uygundur.\n** Tampon/tamponlarda deformasyon ve bağlantılarında çözülme yoktur.",
        "kaynak": "TS EN 1808:2015 9.2.2 – 9.2.8.3 – 9.2.10.1 – 9.2.11.2 – 9.3.1.4 (düşey, dönüş, yatay, çapraz, teleskopik vb.) sonunda mekanik sınır durdurucular vardır,"
      },
      {
        "no": "8",
        "baslik": "Hareket sınırlama cihazı/cihazları",
        "icerik": "** Alt seviye sınırlama anahtarı platform tutma sisteminin en alt seviyedeki kılavuzlarından ayrılmadan devreye girmektedir.\n** Eğimli yüzeyde çalışan platformların kaldırma ve emniyet halatlarında gevşeme olması durumunda platform otomatik olarak durmaktadır.\n** Eğimli yüzeyde çalışan platformların eğim sonu sınır anahtarı çalışır durumdadır.\n** Kaldırma mekanizması asma donanımı (yatay eksende yürünen kısım (ray, düz zemin vb.) hariç asılı platformun halat vb. aksamlarla asıldığı yapı ve/veya yürüme arabası) üzerine monte edilmiş asılı platformlarda indirme (halat sonu) sınırlayıcı vardır, tambur üzerinde olması gereken en az sarım sayısından önce devreye girmektedir ve çalışır durumdadır.\n** Alt seviye (indirme) sınırlayıcı vardır (platformun halat vb. aksamlarla asıldığı yapı zemininde kurulan geçici asılı platformlarda zorunlu değildir) ve çalışır durumdadır.\n* Alt seviye (indirme) sınırlayıcı halat sonu sınırlayıcı anahtarından önce devreye girmektedir.\n** Üst seviye (kaldırma) sınırlama anahtarı vardır, üst seviye son sınırlama anahtarından önce devreye girmektedir ve çalışır durumdadır.\n** Üst seviye son sınırlama anahtarı vardır (platformun halat vb. aksamlarla asıldığı yapıya sabit olan geçici asılı platformlarda zorunlu değildir) ve çalışır durumdadır.\n* Üst seviye son sınırlama ve üst seviye (kaldırma) sınırlama anahtarları ayrı ve bağımsız kontrol cihazlarına sahiptir.\n* Üst seviye son sınırlama anahtarı çalıştıktan sonra asılı platforma yetkili bir kişi tarafından düzeltici faaliyet uygulanıncaya kadar kaldırma ve indirme hareketlerinin yapılması mümkün olmamaktadır.\n** Halatın düzensiz ve çok sayıda üst üste sarması durumunda kaldırma mekanizması otomatik durmaktadır.\n* Tahrik ünitesi çatıya monteli traks iyonel vinç olan asılı platformlarda askı ve emniyet halatların ın sarıldığı düzeneğin çalışmaması durumunda platform hareketi otomatik olarak durmaktadır.\n** Tahrik ünitesi çatıya monteli traksiyon el vinç olan asılı platformlarda halat sonu anahtarı vardır ve çalışır durumdadır.\n** Akü şarj ünitesine bağlı iken platformun tüm hareketleri engellenmiştir.\n** Yük kolunun teleskopik hareketlerinde tahrik sisteminde bir arıza olması durumunda teleskopik hareketin daha ileri konuma gelmesi engellenmektedir.",
        "kaynak": "TS EN 1808:2015 7.7.2.1 – 7.9.4 – 7.9.5 – 8.3.6 – 8.3.7 – 8.3.10 – 8.4.3 – 8.4.4 – 8.6.2 – 9.2.5.3.3 – 9.2.6.1"
      },
      {
        "no": "9",
        "baslik": "Kumandalar",
        "icerik": "** Elle tahrik edilen kumanda /kumandalar (krank veya manivela kolu) çalışır durumdadır.\n** Elle tahrik kumanda larının (krank veya manivela kolu) kontrolsüz hareketi engellenmiştir.\n* Elle tahrik edilen kumandada/kumandalarda (krank veya manivela kolu) herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Acil durum durdurması etkinleştirildiğinde yardımcı kaldırm a mekanizması da durmaktadır.\n** Kumandalar bas bırak (serbest bırakıldıklarında nötr konuma dönen) kumandadır.\n* Tüm kumandalarda semboller vardır ve okunaklı durumdadır.\n** Tüm kumandalardaki semboller ile hareketler tutarlıdır.\n** Çatıda hareket eden yürüme arabasının, asma donanımının ve/veya hareket eden taşıma donanımlarında ki kaldırma mekanizmalarında acil durum durdurması vardır ve çalışır durumdadır.\n* Acil durum durdurmalarında herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Acil durumlar için asma donanımına (kaldırma mekanizmaları platform üzerinde olan ve asma donanımına erişimin sadece platformdan olanlar hariç) kumandalar yerleştirilmiştir.\n** Çok katlı platformlarda birincil kontroller üst kattaki platformda bulunan kumandadır.\n** Çok katlı platformlarda alt kattaki platformda da kumanda vardır.\n** Çok katlı platformlarda kaldırma ve indirme hareketi için her iki kattaki kumanda da etkinleştirilmektedir.\n* Tüm acil durum durdurma cihazları bağımsız şekilde durdurma özelliğine sahiptir.\n* Kablosuz kumandanın etkinleştirildiği kuma nda üzerinde anlaşılabilmektedir ve çalışır durumdadır.\n* Kablosuz kumanda kullanılan platformun herhangi bir nedenle hareketlerinin durmasından sonra operatör kablosuz kumandayı kapatıp açtıktan sonra komutları verebilmektedir.\n** Birden fazla kablosuz kumanda kullanılması durumunda kablosuz kumandalar arasında etkinleştirme için seçme anahtarı vardır, çalışır durumdadır ve iki kablosuz kumanda aynı anda çalışmamaktadır.",
        "kaynak": "TS EN 1808:2015 8.2.1.1 – 8.2.1.2 –8.12 – 11.1 – 11.2 – 11.5"
      },
      {
        "no": "10",
        "baslik": "Göstergeler ve ikazlar",
        "icerik": "* Platformun aşağı yönde hareketinde tutma sistemi bağlantısı için görülebilir ve/veya işitilebilir ikazlar vardır ve çalışır durumdadır.\n* Maksimum rüzgâr hızı aşımı işitilebilir ikazı çalışır durumdadır.\n* Seyir hareketi tahrik sistemi beslemesi akülü olan platformlarda kumanda panosunda akü seviye göstergesi vardır, çalışır durumdadır, üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n* Çatıda hareket eden yürüme arabasının hareketi sırasında çalışan işitilebilir ikaz vardır, çalışır durumdadır, üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n* Kablosuz kumanda kullanımında kişilerin ezilme ve sıkışma risklerinin bu lunduğu yerlerde kablosuz kumanda kullanıldığına dair kablosuz kumanda çalışırken görülebilir ikaz veya platformun çalışmaya başlamasından önce işitilebilir ikazı çalışır durumdadır.\n* Aşırı yük algılama cihazı görülebilir veya işitilebilir ikazı vardır ve çalışır durumdadır.\n* Kumanda/kumandalar üzerindeki gösterge ışıkları çalışır durumdadır.",
        "kaynak": "TS EN 1808:2015 7.7.3 – 7.7. 4 – 9.2.5.3.1 – 9.3.3 – 11.5 – 8.3.5.7"
      },
      {
        "no": "11",
        "baslik": "Aşırı yük algılama cihazı",
        "icerik": "** Tüm kaldırma mekanizmalarında olacak şekilde aşırı yük algılama cihazı vardır.\n** Aşırı yük algılama cihazı çalışır durumdadır.\n** Aşırı yük algılama cihazı devredeyken aşağı yönde indirme hariç tüm hareketler engellenmiştir.",
        "kaynak": "TS EN 1808:2015 8.3.5.1 – 8.3.5.2 – 8.3.5.3 – 8.3.5.6"
      },
      {
        "no": "12",
        "baslik": "Düşmeyi engelleyici güvenlik tertibatları",
        "icerik": "** Düşmeyi engellemek için güvenlik tertibatı vardır ve çalışır durumdadır.\n** Düşüş durdurma cihazı aşırı hız ve/veya sınır eği m değeri geçildiğinde devreye girmektedir ve platformu durdurmaktadır.\n** Düşüş durdurma cihazı mekanik olarak devreye girmektedir.\n** Düşüş durdurma cihazı test edilebilirdir ve gerekli devreye alma işlemi yapıldıktan sonra çalışmaya devam etmektedir.\n** Düşüş durdurma cihazı platformun kaldırma mekanizması tarafından kaldırılabilmesine izin vermektedir.\n** İkincil fren aşırı hız durumunda otomatik olarak devreye girmektedir.\n** İkincil fren mekanik olarak devreye girmektedir.\n** Güç tahrikli kaldırma mekanizmasına sahip asılı platformlarda ikincil fren devreye girdiğinde ana güç beslemesini kesmektedir.\n** İkincil fren test edilebilirdir ve gerekli devreye alma işlemi yapıldıktan sonra çalışmaya devam etmektedir.\n** İkincil fren devreye girdikten sonra platform eğimi sınır değerlerin in üzerine çıkmamaktadır.\n** Düşmeyi engellemek için kullanılan güvenlik tertibatla rında herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Teleskopik yük kollarının tahrik sisteminde bir arıza olması durumunda asılı platformun düşme riski olan platformlarda ikincil bir cihaz vardır ve çalışır durumdadır.\n** Seyir hareketi si steminin zincir tahrikinde arıza olması durumunda düşey hareketi sınırlayan cihaz/tertibat vardır, çalışır durumdadır, üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Seyir hareketi sisteminin vida somun tahrikinde arıza olması durumunda düşmeyi engelleyen cihaz/tertibat vardır, çalışır durumdadır, üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Seyir hareketi sistemi nin kremayer (çubuk) ve pinyon dişli tahrikinde arıza olması durumunda düşmeyi engelleyen cihaz/tertibat vardır, çalışır durumdadır, üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.",
        "kaynak": "TS EN 1808:2015 8.9.1 – 8.9.2.1 – 8.9.2.3 – 8.9.2.4 – 8.9.2.5 – 8.9.2.6 – 8.9.3.2 – 8.9.3.5 – 8.9.3.6 – 8.9.3.7 – 9.2.6.1– 9.2.7 – 9.2.8.1 – 9.2.9.1"
      },
      {
        "no": "13",
        "baslik": "Enerji kesintisinde elle indirme tertibatları",
        "icerik": "** Enerji kesintisi durumunda platformun aşağı yönde inişini sağlayacak manuel kumanda vardır, kolay erişilebilirdir ve çalışır durumdadır.\n** Enerji kesintisi durumunda platformun aşağı yönde inişini sağlayacak manuel kumanda bas bırak tiptedir.\n* Enerji kesintisi durumunda platformun aşağı yönde inişini sağlayacak manuel kumandada herhangi bir deformasyon ve bağlantılarında çözülme yoktur.",
        "kaynak": "TS EN 1808:2015 8.3.4.1 – 8.3.4.2 – 8.3.4.3"
      },
      {
        "no": "14",
        "baslik": "Boylamasına durumun korunması ve/veya engel algılama",
        "icerik": "** İki bağımsız tahri k sistemine sahip çatıya monte edilmiş asılı platform enerji kesintisi durumunda platformun aşağı yönde inişini sağlayacak manuel ku manda devredeyken boylamasına durumun korunması için eğim sınır değerini geçmemektedir. (Kullanılacak ölçüm cihazı: Eğim veya açı ölçer)\n** İki veya daha fazla bağımsız kaldırma mekanizmaları tarafından tahrik edilen asılı platformlarda boylamasına durumun korunması için maksimum eğim değerine ulaşıldığında platform eğimini otomatik olarak sınırlandıran (elektrikli veya mekanik) sistem vardır ve sistem çalışır durumdadır.\n** Engel algılama cihazı vardır, maksimum eğim değerine ulaşıldığında platform eğimini otomatik olarak sınırlandırmaktadır ve çalışır (indirme işlemini durdurma) durumdadır.\n** Baş üstü çarpma engelleyici çalışır durumdadır.",
        "kaynak": "TS EN 1808:2015 8.3.4.4 – 8.3.8 – 8.3.9"
      },
      {
        "no": "15",
        "baslik": "Asma donanımı",
        "icerik": "** Kalıcı asma donanımlarında yürüme arabasının kılavuzlarından ayrılması ve/veya devrilmesi engellenmiştir.\n* Kalıcı asma donanımlarında yürüme arabasının kılavuzlarından ayrılmasını ve/veya devrilmesini engelleyen tertibatlarda herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Kalıcı asma donanımlarında yürüme arabasının karşı ağırlıklarının parçalı olması durumunda ağırlıklar ancak kasıtlı müdahale ile çıkarılabilecek şekilde sabitlenmiştir.\n* Geçici asma donanımı karşı ağırlık kütleleri maksimum değerin üstünde değildir ve ağırlık değerleri üzerlerinde kalıcı olarak işaretlenmiştir.\n** Geçici asma donanımı karşı ağırlıkları kasıtlı müdahale ile çıkarılabilecek şekilde sabitlenmiştir.\n** Hidrolik silindirler, çelik borular ve hortumlarda sızıntı, deformasyon ve bağlantılarda çözülme yoktur.\n** Basınç sınırlayıcı/sınırlayıcıları çalışır durumdadır.\n* Hidrolik tankta en az ve en çok seviyeler tespit edilebilirdir.\n** Hidrolik tankta yağın en az ve en çok seviyeleri uygundur.\n** Hidrolik pompa çalışır durumdadır, koku ve aşırı ısınma vb. durumlar yoktur.\n* Hidrolik ana kapama vanası vardır, çalışır durumdadır, deformasyon ve bağlantılarında çözülme yoktur. Basınç sınırlayıcının devreye girme değeri kontrol kapsamında değildir.",
        "kaynak": "TS EN 1808:2015 9.3.1.2 – 9.3.1.3 – 9.3.6 – 9.4.2 – 9.4.3 – 10.6"
      },
      {
        "no": "16",
        "baslik": "Yapısal bileşenler ve bağlantılar",
        "icerik": "* Teleskopik yük kolunda/kollarında birden fazla halat veya zincir bağlanmışsa halat veya zincirlerin gerginliklerinin ayarlanması için tertibat vardır, çalışır durumdadı r ve üzerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Seyir hareketi tahrik sistemi zincir aksamlarında yuvarlak baklalı zincir kullanılmamıştır.\n* Geçici asma donanımlarında ankraj pimleri ve tespit klipsleri gibi parçalar ekipman üzerine kalıcı bağlantılarla tutturulmuştur.\n** Askı ve emniyet aksamlarının (halat vb.) bağlanması için ayrı asma noktaları vardır ve üzerlerinde herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Asma donanımı ve parçaları güvenli ve emniyetli birleştirilmiştir, bağlantılarda çözülme yoktur, bağlantılarda kendiliğinden çözülmeye karşı tedbir alınmıştır ve deformasyon yoktur.\n** Tahrik mekanizması/mekanizmaları bağlantılarda çözülme yoktur, bağlantılarda kendiliğinden çözülmeye karşı tedbir alınmıştır ve deformasyon yoktur.\n** Çatı bağlantılarda çözülme yoktur, bağlantılarda kendiliğinden çözülmeye karşı tedbir alınmıştır ve deformasyon yoktur.\n** Asma donananımı yürüme yolunda herhangi bir deformasyon ve bağlantılarında çözülme yoktur.\n** Ekipmanın yükün gerilimi altındaki kısımları üzerinde tamir kaynağı vb. işlemler yetkili kişi/kuruluşlar tarafından gerekli prosedürlere göre yapılmıştır.\n** Ekipmanın tamir kaynağı yapılan bölgesinde yapılan tahribatsız muayene sonuçlarında herhangi bir çatlak vb. süreksizlik yoktur.",
        "kaynak": "TS EN 1808:2015 9.2.6.2 – 9.2.7 – 9.4.1 – 9.4.4"
      },
      {
        "no": "17",
        "baslik": "Yardımcı kaldırma mekanizmaları",
        "icerik": "* Yardımcı kaldırma mekanizması geçerli bir periyodik kontrol raporu olmadan kullanılmamaktadır.\n** Yardımcı kaldırma mekanizmasının kapasitesi 1000 kg ile sınırlandırılmıştır.\n** Yardımcı kaldırma mekanizmasında aşırı yük algılama cihazı vardır ve çalışır durumdadır.\n** Yardımcı kaldırma mekanizması aşırı yük algılama cihazı devreye girdiğinde platformun ve kaldırma mekanizmasının indirme dışındaki hareketlerini engellemektedir.\n* Yardımcı kaldırma mekanizması enerji kesintisinde yükü kontrollü olarak indirilmesini sağlayabilmektedir ve bu sistem asılı platform kullanılırken erişilebilirdir.\n* Kaldırma mekanizması asma donanımı (yatay e ksende yürünen kısım (ray, düz zemin vb.) hariç asılı platformun halat vb. aksamlarla asıldığı yapı ve/veya yürüme arabası) üzerine monte edilmiş yapı bakım ünitelerinde yardımcı kaldırma mekanizmasının maksimum kaldırma ve indirme hızı platform hızı ile aynıdır.\n* Kaldırma mekanizması asma donanımı (yatay eksende yürünen kısım (ray, düz zemin vb.) hariç asılı platformun halat vb. aksamlarla asıldığı yapı ve/veya yürüme arabası) üzerine monte edilmiş yapı bakım ünitelerinde yardımcı kaldırma mekanizması ile taşınan yükün korkuluk seviyesin e gelmesini önleyen ve düzelten kontrol cihazı vardır ve çalışır durumdadır.\n* Kaldırma mekanizmaları platform üzerinde bulunan yapı bakım üniteleri ve tüm geçici asılı platformlarda yardımcı kaldırma mekanizmasının taşıdığı yükün platforma düşmemesi için kılavuzlama sistemi vardır, sistemde herhangi bir deformasyon ve bağlantılarında çözülme yoktur. (Belirtilen türlerde yükün korkuluk seviyesine gelmesini önleyen ve düzelten kontrol cihazı yerine kullanılabilir.) Yardımcı kaldırma mekanizmasının (traksiyonel, tambur vinci vb.) periyodik kontrolü bu periyodik kontrol kriterleri kapsamında değildir. Bakanlık tarafından yayımlanmış ilgili Periyodik Kontrol Kriterlerine göre ayrıca kontrol edilmelidir.",
        "kaynak": "TS EN 1808:2015 8.12 – 13.2"
      },
      {
        "no": "18",
        "baslik": "Erişim",
        "icerik": "* Üzerinde yürünen yerler ve merdiven basamakları kaymaz zemindir.\n** Korkuluk yapısı ve boyutları uygundur.\n* Yürüyüş yolları ve serbest duruş alanı genişlikleri uygundur.\n* Merdiven ve merdiven koruyucuları uygundur.\n** Tüm erişimlerde üç nokta desteği vardır.\n* Yerinden çıkarılabilir merdiven vb. erişim tertibatları güvenlik kontağı vb. ile unutulma riskine karşı korunmaktadır ve güvenlik kontağı çalışır durumdadır. --",
        "kaynak": ""
      },
      {
        "no": "19",
        "baslik": "Elektromekanik uyum",
        "icerik": "** Tüm elektrikli emniyet terti batları çalıştığında, tahrik makinasının harekete geçmesi engellenmekte veya durma sürecini başlatmakta ve işlevsel frenleri harekete geçirmektedir.\n* Kumanda ve/veya enerji panolarında kanal/pano kapakları, kablo girişleri ve kablo muhafazaları uygundur. Ucu açıkta kablo yoktur.\n* Motorları aşırı yüke karşı tüm gerilimli iletkenlerin motora sağladığı enerjiyi keserek koruyan sistem (sigorta vb.) vardır ve çalışır durumdadır.\n* Aydınlatma ve priz devrelerini aşırı yüke karşı tüm gerilimli iletkenlerin aydınlatma ve priz devrelerine sağladığı enerjiyi keserek koruyan sistem (sigorta vb.) vardır ve çalışır durumdadır.\n* Motor sargılarının tamamı aşırı yüke karşı ayrı ayrı korunmaktadır.\n* Ana anahtar/anahtarlar kontrol ve bakım için gerekli olan priz çıkışlarına veya aydınlatmaya sağlanan enerjiyi kesmemektedir.\n** Ekipmanın yakınında ana anahtar vardır ve çalışır durumdadır.\n* Ana anahtar kilitlenebilir tiptedir.\n* Termik röle/röleler çalışır durumdadır.\n* PTC çalışır durumdadır.\n* Motor koruma (faz sıralı) rölesi vardır.\n* Motor koruma (faz sıralı) rölesi faz eksikliğinde devreye girerek motoru durdurmaktadır.\n* Motor koruma (faz sıralı) rölesi fazların yer değiştirmesinde devreye girerek motoru durdurmaktadır.\n* Kontaktörlerin açmama (yapışma) riskine karşı önlem alınmıştır.\n* Güç besleme devresinde seri şeklinde yer alan kontaklardaki besleme iki bağımsız kontaktör ile kesilmektedir.\n* Motor fren bobini seri iki kontaktörden enerjilendirilmektedir.\n** Ekipmanın bütün hareket aralığı boyunca sarkan her kablonun serbest ve güvenli hareketini sağlamak için önlem alınmıştır ve çalışır durumdadır.\n* Ekipmanın bütün hareket aralığı boyunca sarkan her kablonun serbest ve güvenli hareketini sağlayan sistem kısımlarında deformasyon ve bağlantılarında çözülme yoktur. Bu bölümde belirtilen kontroller sadece elektriksel donanımın mekanik risklerle ilgili olan kısımlarını ve ilişkisini kapsamaktadır. Bu bölümde belirtilen kontroller iş ekipmanının elektrik tesisatı, topraklama tesisatı vb. periyodik kontrollerini kapsamaz. TEST KRİTERLERİ",
        "kaynak": "TS EN 1808:2015 10.1 – 10.2 – 10.3 – 10.4"
      },
      {
        "no": "20",
        "baslik": "Yüksüz test",
        "icerik": "** Ekipman yüksüz durumda iken tüm fonksiyonları yerine getirilerek test gerçekleştirildi, frenler çalışır durumdadır, deformasyon ve bağlantılarda çözülme yoktur. Her periyodik kontrolde gerçekleştirilir. --",
        "kaynak": ""
      },
      {
        "no": "21",
        "baslik": "Yüklü test",
        "icerik": "** Ekipman tam kapasite ile yüklü iken tüm fonksiyonları yerine getirilerek test gerçekleştirildi, frenler çalışır durumdadır, deformasyon ve bağlantılarda çözülme yoktur. Her periyodik kontrolde gerçekleştirilir. --",
        "kaynak": ""
      },
      {
        "no": "22",
        "baslik": "Dinamik test",
        "icerik": "** Yapı bakım ünitelerinde önemli bakım ve onarım faaliyetlerinden sonra ekipmanın tam kapasitesinin 1,1 katı yük ile test gerçekleştirildi, frenler çalışır durumdadır, deformasyon ve bağlantılarda çözülme yoktu.\n** Geçici asılı platformda ve asılı koltukta önemli bakım ve onarım faaliyetlerinden sonra ekipmanın tam kapasitesinin üreticinin belirmiş olduğu değer ile test gerçekleştirildi, frenler çalışır durumdadır, deformasyon ve bağlantılarda çözülme yoktu. Önemli bakım ve onarım faaliyeti yoksa dinamik test gerçekleştirilmez.",
        "kaynak": "TS EN 1808:2015 12.4 – 12.5"
      },
      {
        "no": "23",
        "baslik": "Statik test",
        "icerik": "** Yapı bakım ünitelerinde önemli bakım ve onarım faaliyetlerinden sonra ekipmanın tam kapasitesinin 1,5 katı yük ile test gerçekleştirildi, frenler çalışır durumdadır, deformasyon ve bağlantılarda çözülme yoktur.\n** Geçici asılı platformda ve asılı koltukta önemli bakım ve onarım faaliyetlerinden sonra ekipmanın tam kapasitesinin üreticinin belirmiş olduğu değer ile test gerçekleştirildi, frenler çalışır durumdadır, deformasyon ve bağlantılarda çözülme yoktu. Önemli bakım ve onarım faaliyeti yoksa statik test gerçekleştirilmez.",
        "kaynak": "TS EN 1808:2015 12.4 – 12.5"
      },
      {
        "no": "24",
        "baslik": "Düşmeyi engelleyici güvenlik tertibatı/tertibatları testi",
        "icerik": "** Güvenlik mekanizması şahısların tehlikeye maruz bırakılmaması için, çalışma platformu uzaktan uzman bir kişi tarafından teste tabi tutulabilmektedir.\n** Üreticinin belirtmiş olduğu kapasite ve hız değerlerinde gerçekleştirildi, sistem devreye girdi, deformasyon ve bağlantılarda çözülme yoktur. Üreticinin belirtmiş olduğu aralıklarda gerçekleştirilir. --\nNot: Kusur derecesi “*” hafif kusurlu ve “**” ağır kusurlu anlamında kullanılmaktadır.\nNot: Statik ve dinamik test yapılan periyodik kontrolde ekipmanın tam kapasitesi ile yapılan yüklü testinin yapılmasına gerek yoktur.\nNot: Kontrol içeriğinde belirtilen kriterler ekipmanın kullanım yeri, kullanım amacı, tip, model ve imalat yıllarına vb. göre değişkenlik gösterebilmektedir. İlgili imalat mevzuatı ve/veya standardı baz alınarak ekipmanda belirtilen risklerin bulunmadığı durumda kontrol kriterleri aranmayacaktır. Kontrol içeriğinde belirtilen kriterin o ekipmanda aranıp aranmayacağı ile ilgili karar standart maddesi bölümünde atıf yapılan mevzuat ve/veya standart maddelerine göre verilmelidir. Kriterin kontrol içeriğinde bulunması her ekipman için zorunlu olarak aranacak kriter anlamına gelmemektedir.\nNot: Standart maddesi bölümünde belirtilen standart/standartlar metodun ve kriterlerin oluşturulması için referans olarak belirtil miştir. Üreticinin beyan etmiş olduğu farklı bir standart (farklı bir ülke standardı vb.) olması durumunda, üreticinin beyan etmiş olduğu standardın içerik bölümünde belirtilen kriteri karşılayan ilgili maddesi dikkate alınmalıdır.",
        "kaynak": ""
      }
    ],
    "notlar": [
      "Kusurlar madde numarası ve tanımıyla ilişkilendirilir (AA04).",
      "Hafif kusurlar bir sonraki periyodik kontrol başlangıç tarihine kadar giderilir (Ek-III 1.9.1)."
    ]
  },
  {
    "kod": "ZPMK01",
    "ad": "Sıvılaştırılmış Petrol Gazı (LPG) Tankı Periyodik Muayene Kriterleri",
    "tur": "LPG",
    "rapor": "ZPMR01",
    "brans": "m",
    "yayim": "2025-04-09",
    "yururluk": "2025-07-18",
    "kapsam": "Sıvılaştırılmış petrol gazı depolamak için kullanılan basınçlı ekipmanların periyodik muayeneleri. Her tank ayrı muayene edilir; örnekleme yapılmaz (AA01). * hafif, ** ağır kusurdur.",
    "maddeler": [
      {
        "no": "1",
        "baslik": "Bilgi etiketi, sağlık ve güvenlik işaretleri",
        "icerik": "** Tank üzerinde tanka ait bilgi etiketi vardır veya tankın bilgilerine esas beyan tank üzerine iliştirilmiştir.\n* Tank bilgi etiketinde gerekli ve yeterli bilgi vardır.\n* Tank sahasında tankın barındırdığı risklere ait sağlık ve güvenlik işaretleri vardır.\n** Emniyet ve/veya basınç tahliye valflerinin bilgi etiketi /işaretlemesi vardır veya emniyet ve/veya basınç tahliye va lflerinin bilgilerine esas beyan emniyet valfi ve/vey a basınç tahliye valflerinin üzerine iliştirilmiştir.\n* Emniyet ve/veya basınç tahliye valflerinin bilgi etiketinde/işaretlemesinde gerekli ve yeterli bilgi vardır.\n* Su kapasitesi 10 m 3 veya daha büyük olan tanklarda, emniyet valfler i sıvı seviye göstergeleri ve manometreler hariç olmak üzere tankın giriş ve çıkış bağlantılarının tamamı etiketlenmiştir. Etiketlerde, bağlantıların sıvı veya gaz fazı ile temas halinde olup olmadığı yazılmıştır.\n* Esnek bağlantılarda kullanılan hortumların üzerinde akışkan türü ve işletme basıncı değeri işaretlemeleri vardır.\n* Bilgi etiketi ve tüm işaretlemeler anlaşılırdır, dikkat çekicidir, okunaklıdır, doğru renktedir ve kolay sökülemeyecek şekilde iliştirilmiştir.",
        "kaynak": "TS EN 12817:2019 9.1 · TS EN 12819:2019 9.1 · TS 1446:1998 2.2.6.5 – 2.5.5 · TS EN 12542:2020 11 · TS EN 14129:2014 8 · TS EN 13445-5:2021 11.2"
      },
      {
        "no": "2",
        "baslik": "Yazılı plan",
        "icerik": "** Yazılı plana göre tankın yeniden değerlendirme faaliyetinin gerçekleştirildiği ve sonucunun uygun olduğu görüldü.\n** Yazılı plan standartların ilgili bölümlerini kapsamaktadır.\n** Yazılı plan uygulama ile tutarlıdır.\n** Yazılı plan Bakanlığın yayımladığı dokümanın içeriğini karşılamaktadır.",
        "kaynak": "TS EN 12817:2019 5 · TS EN 12819:2019 5"
      },
      {
        "no": "3",
        "baslik": "Yerleşim",
        "icerik": "** Tank en yakın tanka, binalara veya bina gruplarına, komşu arsa sınırına, ana trafik yollarına veya demir yollarına, enerji nakil hatlarına gerekli mesafededir. (Kullanılacak ölçüm cihazı: Mesafe ölçüm cihazları)\n** Tanklar üst üste yerleştirilmemiştir.\n* Tankların çevresinde gerekli mesafede kuru ot vb. bulunmamaktadır. (Kullanılacak ölçüm cihazı: Mesafe ölçüm cihazları)\n** Tanklar ve tesisatları (yer üstü, yer altı, kısmi yer altı vb.) dışarıdan gelebilecek mekanik darbe riskine (araç, endüstriyel araç vb.) karşı korunmuştur.\n** Tank donanımlarına işletme sürecinde rahatlıkla erişilebilmektedir.\n* Örtülü (kaplanmış) tanklarda örtü malzemesi toprak veya dere kumu veya ısıya dayanıklı özel malzemelerdir ve örtü malzemesi toprak veya dere kumu ise yüksekliği uygundur. (Kullanılacak ölçüm cihazı: Mesafe ölçüm cihazları)\n* Yer altı tankların üst yüzeyi zemin seviyesinden gerekli mesafede aşağı yerleştirilmiştir. (Kullanılacak ölçüm cihazı: Mesafe ölçüm cihazları)\nNot: TSE Hizmet Yeri Yeterlilik Belgesi olan işletmeler için yerleşim maddesi uygulanmayacaktır.",
        "kaynak": "TS 11939 4.1 · TS 1446:1998 2.1.1 – 2.1.2 – 2.1.3 – 2.1.4 – 2.1.8 – 2.1.9 – 2.1.10 – 2.2.6.3 – 2.5.6"
      },
      {
        "no": "4",
        "baslik": "Tank yüzeyleri ve tank üzerinde işlemler",
        "icerik": "** Gözle muayeneler için dış yüzeyler temiz, kuru ve yabancı maddelerden arındırılmıştır.\n** Kusurları gölge aracılığıyla göstermek üzere, tankın yüzeyi boyunca ışık yönlendirilmiştir.\n** Kusurların ölçüsünü belirleyebilmek için kusur yüzeyi boyunca mastar yerleştirilmiştir.\n** Korozyon, çentik ve oluk derinliği ölçülm üştür. (Kullanılacak ölçüm cihazı: Derinlik ölçme cihazı vb.)\n** Kusurların ayrıntılı incelenmesi için gerektiğinde büyüteç ve ayna kullanılmıştır.\n** Tankın basınçlı kısımları üzerinde tamir kaynağı işlemlerinin (ağız, manşon, takviye plakası, mapa vb.) olması durumunda yetkili kuruluşun onayı vardır.\n** Tankın basınçlı kısımları üzerinde dizayn projesi haricinde sonradan ilave edilmiş ek plaka kaynağı yoktur.\n** Dış yüzeylerde korozyon, çatlak, çöküntü, oluk, laminasyon, tümsek, eğilme vb. deformasyon yoktur.\n* Dış yüzeylerde boya dökülmesi veya çatlaması yoktur.\n** Dış yüzeylerde görülen deformasyonlar değerlendirilmiş, gerekirse ilave muayene teknikleri talep edilmiş ve sonuçlarının uygun olduğu görülmüştür.\n* Kaplamada herhangi bir deformasyon yoktur.\n** El, baş, adam vb. gözetleme açıklıklarında herhangi bir çözülme ve deformasyon yoktur.\nNot: Tanklarda pasif yangın önleme sistemi varsa, gözle muayene yöntemlerinin uygulanması uygun değildir.\nNot: Yer altı tanklarda kontrol sadece görülebilir yüzeyler için gerçekleştirilir.",
        "kaynak": "TS EN 12817:2019 7.1 – Ek A.1 · TS EN 12819:2019 7.1 – Ek A.1 · TS 1446 2.1.2.1.5 – 2.1.2.1.6"
      },
      {
        "no": "5",
        "baslik": "Tank bağlantı parçaları",
        "icerik": "** Tank üzerindeki doldurma vanası /vanaları üzerinde korozyon, çatlak vb. deformasyon yoktur.\n** Tank üzerindeki doldurma vanası/vanaları dişlerinde ve bağlantılarında deformasyon yoktur.\n** Sıvı alma vanası/vanaları üzerinde korozyon, çatlak vb. deformasyon yoktur.\n** Sıvı alma vanası/vanaları dişlerinde ve bağlantılarında deformasyon yoktur.\n** Kapatma vanası/vanaları üzerinde korozyon, çatlak vb. deformasyon yoktur.\n** Kapatma vanası/vanaları dişlerinde ve bağlantılarında deformasyon yoktur.\n** Boşaltma vanası/vanaları üzerinde korozyon, çatlak vb. deformasyon yoktur.\n** Boşaltma vanası/vanaları dişlerinde ve bağlantılarında deformasyon yoktur.\n** Multi valf üzerinde korozyon, çatlak vb. deformasyon yoktur.\n** Tank üzerindeki flanş/flanşlarda korozyon, çatlak vb. deformasyon yoktur.\n* Tank üzerindeki flanş/flanşlar eş merkezlidir.\n* Tank üzerindeki flanş cıvataları eksik değildir.\n* Tank üzerindeki flanş cıvatalarında deformasyon yoktur.\nNot: Pul pul dökülme ve/veya yüzeyde çukurlaşma veya her ikisinin bir kombinasyonu nun görülmediği, yüzey oksidasyonunun silinerek temizlenebildiği başlangıç seviyesinde olan korozyon ile ilgili tespitlerde yukarıdaki kontrol kriterleri hafif kusur (*) olarak değerlendirilir.",
        "kaynak": "TS EN 12817:2019 7.2 · TS EN 12819:2019 7.2 · TS 1446:1998 2.5.5 – 2.5.6 2.5.9.2"
      },
      {
        "no": "6",
        "baslik": "Topraklama bağlantısı (Yer üstü tanklar için)",
        "icerik": "** Tank ile topraklama noktası arasındaki topraklama kablosunda kopukluk ve deformasyon yoktur, topraklama sürekliliği sağlanmaktadır.",
        "kaynak": "TS EN 12817:2019 7.4.1 · TS EN 12819:2019 7.4.1 · TS EN 14570:2014 5.15"
      },
      {
        "no": "7",
        "baslik": "Emniyet valfi/valfleri kontrolü, testi veya yeni/yenilenmiş bir valf ile değişimi",
        "icerik": "** Emniyet valfi/valfleri vardır.\n** Emniyet valfi/valfleri yayında korozyon vb. deformasyon yoktur. (Emniyet valfi için test seçeneğinin kullanılması durumunda)\n** Tanka doğrudan bağlıdır ve montajı doğrudur.\n** Gaz fazı ile temasta olacak şekilde tankın en üst seviyesindedir.\n** Emniyet valfi üzerinde korozyon, çatlak vb. deformasyon yoktur.\n** Emniyet valfinin en geç 5 yılda bir yeni bir valf ile değiştirildiği veya yenilendiği (sertifika tarihinin geçerli olduğu kontrol edilmiştir) veya test edildiği ve uygun olduğu görülmüştür.\n** Emniyet valfi/valfleri ayar basıncında tahliyeyi gerçekleştirmekte ve tam açma konumuna geçebilmektedir. (Emniyet valfi için test seçeneğinin kullanılması durumunda, Kullanılacak ölçüm cihazı: Manometre)\n** Tahliyenin gerçekleşmesinden sonra emniyet valfi/valfleri kapanmaktadır. (Emniyet valfi için test seçeneğinin kullanılması durumunda, Kullanılacak ölçüm cihazı: Manometre)\n** Tankla emniyet valfi/valfleri arasında kapanma ihtimali olan herhangi bir parça yoktur.\n* Boşaltma yolu temiz ve açıktır.\n* Boşaltma yolu nda korozyon yoktur. (Korozyon olması durumunda emniyet valfi korozyona karşı kontrol edilmelidir.)\n* Kapak (yağmur kepi) vardır ve üzerinde herhangi bir deformasyon yoktur.\n** Su kapasitesi, 120 m 3 veya daha yüksek olan tankların emniyet valfinin periyodik bakımı sırasında, tankı devre dışı bırakmamak için emniyet valfi çok ağızlı veya birden fazladır.\n** Çok ağızlı emniyet valfi mekanizmasında deformasyon ve bağlantılarında çözülme yoktur ve çalışır durumdadır.\n* Su kapasitesi 10 m 3'den fazla olan yerüstü tanklarının her birinde, emniyet valfi çıkışları, dikey konumda monte edilmiş ve atmosfere engelsiz durumda açılmıştır. Bu valflerin deşarj kısmının dikey doğrultusunda tankın üst kısmından uygun mes afede herhangi bir engel bulunmamaktadır. (Kullanılacak ölçüm cihazı: Mesafe ölçüm cihazları)\n* Su kapasitesi 10 m 3'den fazla olan yeraltı tanklarında, emniyet valfi ağzı, dikey doğrultuda ve zemin seviyesinden uygun yüksekliğe kadar uzatılmıştır ve dışarıdan gelebilecek mekanik darbe riskine karşı korunmuştur. (Kullanılacak ölçüm cihazı: Mesafe ölçüm cihazları)",
        "kaynak": "TS EN 12817:2019 7.5.1 – 7.5.2 – 7.5.3 · TS EN 12819:2019 7.5.1 – 7.5.2 – 7.5.3 – 7.5.4 · TS 1446:1998 2.1.2.3-2.2"
      },
      {
        "no": "8",
        "baslik": "Basınç ölçüm cihazı (manometre)",
        "icerik": "** Su kapasitesi 10 m 3’ten büyük tanklarda b asınç ölçüm cihazı (manometre /manometreler) vardır.\n* Manometre uygulamasının olması durumunda manometrenin/manometrelerin d oğru gösterdiği doğrulanmıştır veya yenilenmiştir.\n* Manometre uygulamasının olması durumunda manometrenin/manometrelerin s kala ve boyut büyüklüğü uygundur ve okunabilirdir.\n* Manometre uygulamasının olması durumunda manometrede/manometrelerde deformasyon yoktur.\n* Manometre uygulamasının olması durumunda manometre/manometreler ile t ank arasına kapatma valfi monte edilmiştir ve çalışır durumdadır.",
        "kaynak": "TS EN 12817:2019 7.6 · TS EN 12819:2019 7.6 · TS 1446:1998 2.2.6.6 – 2.2.6.7"
      },
      {
        "no": "9",
        "baslik": "Seviye göstergeleri",
        "icerik": "** Seviye göstergesi/göstergeleri çalışır durumdadır.",
        "kaynak": "TS EN 12817:2019 7.7 · TS EN 12819:2019 7.7"
      },
      {
        "no": "10",
        "baslik": "Kapatma vanaları",
        "icerik": "* Hidrolik kumandalı emniyet valfleri uygulamasının olması durumunda hidrolik kumandalı emniyet valfleri, kapatma vanaları ile tank arasına yerleştirilmiştir.\n* Mekanik kapatma vanaları tanka mümkün olduğu kadar yakın bir konumda yerleştirilmiştir ve ulaşılabilecek konumdadır.",
        "kaynak": "TS EN 12819:2019 7.8 – 7.14 · TS 1446:1998 2.2.6.1.1 – 2.2.6.1.2"
      },
      {
        "no": "11",
        "baslik": "Yer üstü tanklar için saplamalar, cıvatalar, somunlar ve pullar",
        "icerik": "* Saplamalarda korozyon, çatlak, eğilme vb. deformasyon yoktur.\n* Cıvatalarda korozyon, çatlak, eğilme vb. deformasyon yoktur.\n* Somunlarda korozyon, çatlak, eğilme vb. deformasyon yoktur.\n* Pullarda korozyon, çatlak, eğilme vb. deformasyon yoktur.",
        "kaynak": "TS EN 12817:2019 7.9 · TS EN 12819:2019 7.9"
      },
      {
        "no": "12",
        "baslik": "Yer altı tankları için katodik koruma izleme",
        "icerik": "** Yazılı planda belirtilen katodik koruma izleme verileri kontrol edilmektedir ve gerektiğinde düzeltici faaliyetler yapılmıştır.\n** Katodik koruma izleme ölçümü periyodik kontrol yapmaya yetkili kişi tarafından yapılmıştır.\n** Katodik koruma izleme raporunda sarf (kurbanlık) anotla katodik koruma izlemesinin etkin olduğu ve anotların kalan ömür süresinin yeterli olduğunun belirtildiği görülmüştür.\n** Katodik koruma izleme raporunda dış akım kaynaklı katodik koruma izlenmesi için ölçülen değerlerin sınır değerler ile karşılaştırıldığı ve değerlendirildiği görülmüştür.",
        "kaynak": "TS EN 12817:2019 7.10 · TS EN 12819:2019 7.15 · TS 1446:1998 2.1.8.4 – 2.1.9.3 – 2.1.10.1"
      },
      {
        "no": "13",
        "baslik": "Yer üstü tanklar için ayaklar ve zeminler",
        "icerik": "** Ayaklarda korozyon, çatlak, eğilme vb. deformasyon yoktur.\n** Ayak bağlantılarında çözülme yoktur.\n** Tank kapasitesine ve türüne göre uygun (çelik veya beton) zemin ve ayak tipi kullanılmaktadır.\n** Zeminde çökme ve/veya dengesiz oturma yoktur.",
        "kaynak": "TS EN 12817:2019 7.11 · TS EN 12819:2019 7.16 · TS 1446:1998 2.1.3 – 2.1.4"
      },
      {
        "no": "14",
        "baslik": "Sıcaklık göstergesi",
        "icerik": "* Sıcaklık göstergesinde/göstergelerinde deformasyon ve bağlantılarında çözülme yoktur.\n* Sıcaklık göstergesi/göstergeleri okunaklıdır.\n* Sıcaklık göstergesi çalışır durumdadır.\n* Sıcaklık göstergesinin kalibrasyon veya doğrulama belgesi mevcuttur.",
        "kaynak": "TS EN 12819:2019 7.13"
      },
      {
        "no": "15",
        "baslik": "Sızıntı kontrolü",
        "icerik": "** Tank üzerindeki doldurma vanasında/vanalarında sızıntı yoktur.\n** Tank üzerindeki sıvı alma vanasında/vanalarında sızıntı yoktur.\n** Tank üzerindeki kapatma vanasında/vanalarında sızıntı yoktur.\n** Tank üzerindeki boşaltma vanasında/vanalarında sızıntı yoktur.\n** Tank üzerindeki multi valfte sızıntı yoktur.\n** Tank üzerindeki flanş/flanşlarda sızıntı yoktur.\n** Tank üzerindeki seviye göstergesinde/göstergelerinde deformasyon ve sızıntı yoktur.\n** Tank üzerindeki körlenmiş ve tapalı sıvı faz vanalarında sızıntı yoktur.\nNot: Kontrol içeriğinde belirtilen kriterler ekipmanın kullanım yeri, kullanım amacı, tip ve modellerine vb. göre değişkenlik gösterebilmektedir. İlgili imalat mevzuatı ve/veya standardı baz alınarak ekipmanda belirtilen risklerin bulunmadığı durumda kontrol k riterleri aranmayacaktır. Kontrol içeriğinde belirtilen kriterin o ekipmanda aranıp aranmayacağı ile ilgili karar standart maddesi bölümünde atıf yapılan mevzuat ve/veya standart ma ddelerine dikkat edilerek verilmelidir. Belirtilen kriterin ekipmanın hangi tipinde, modelinde, imal yılında vb. olması gerektiği mevzuat ve/veya standart maddelerine göre değerlendirilmelidir. Kriterin kontrol içeriğinde bulunması her ekipman için zorunlu olarak aranacak kriter anlamına gelmemektedir.\nNot: Bu doküman tanklara yönelik yangın söndürme sistemlerine ilişkin herhangi bir değerlendirme içermez.\nNot: Tek yıldız (*) hafif, iki yıldız (**) ağır kusuru ifade etmektedir. Hafif kusurlar bir sonraki periyodik kontrol tarihine kadar giderilir. Bir sonraki periyodik kontrol tarihinde düzeltilmemiş hafif kusurlar ağır kusur olarak değerlendirilir. Ağır kusur tespit edilen ekipmanlar ise tespit edil en kusurlar giderilmeden çalıştırılamaz.",
        "kaynak": "TS EN 12817:2019 4.3 – 6.3.3 – 7.2 – 7.8 · TS EN 12819:2019 4.3 – 6.4 – 7.2 – 7.8"
      }
    ],
    "notlar": [
      "Yazılı plan 13 m³ ve altı tanklar için TS EN 12817, 13 m³ üstü tanklar için TS EN 12819'un 6, 7 ve 8. maddelerini karşılamalıdır (AA01).",
      "Yeterliliğin yeniden değerlendirilmesi en fazla 10 yılda bir; emniyet valfi testi en fazla 5 yılda bir; yer altı tanklarında katodik koruma izleme (standartta süre yoksa) en fazla 6 ayda bir (AA01).",
      "TSE Hizmet Yeterlilik Belgesi olan işletmeler için yerleşim maddesi uygulanmaz."
    ]
  },
  {
    "kod": "ZYDK01",
    "ad": "Sıvılaştırılmış Petrol Gazı (LPG) Tankı Yeterliliğin Yeniden Değerlendirilmesi Kriterleri",
    "tur": "LPGY",
    "rapor": "ZYDR01",
    "brans": "m",
    "yayim": "2025-04-09",
    "yururluk": "2025-07-18",
    "kapsam": "Sıvılaştırılmış petrol gazı depolamak için kullanılan basınçlı ekipmanların yeterliliğinin yeniden değerlendirilmesi (en fazla 10 yılda bir). Test grupları: 1 — gözle iç muayene, hidrostatik test, akustik emisyon, ultrasonik kalınlık; 2 — gözle dış muayene, katodik koruma izleme. * hafif, ** ağır kusurdur.",
    "maddeler": [
      {
        "no": "1",
        "baslik": "Yer üstü tanklar için saplamalar, cıvatalar, somunlar ve pullar",
        "icerik": "** Saplamalarda korozyon, çatlak, eğilme vb. deformasyon yoktur.\n** Cıvatalarda korozyon, çatlak, eğilme vb. deformasyon yoktur.\n** Somunlarda korozyon, çatlak, eğilme vb. deformasyon yoktur.\n** Pullarda korozyon, çatlak, eğilme vb. deformasyon yoktur.",
        "kaynak": "TS EN 12817:2019 7.9 · TS EN 12819:2019 7.9"
      },
      {
        "no": "2",
        "baslik": "Gözle iç muayene",
        "icerik": "** Gözle muayeneler için iç yüzeyler temiz, kuru ve yabancı maddelerden arındırılmıştır.\n** Kusurların tespiti için endoskop vb. görüntüleme cihazları kullanılmış ve tankın tüm iç yüzeyi görüntülenmiştir.\n** Kusurları gölge aracılığıyla göstermek üzere, tankın yüzeyi boyunca ışık yönlendirilmiştir. (Tank içerisine girilebiliyorsa)\n** Kusurların ölçüsünü belirleyebilmek için yüzey boyunca mastar yerleştirilmiştir. (Tank içerisine girilebiliyorsa)\n** Korozyon, çentik ve oluk derinliği ölçülmüştür. (Tank içerisine girilebiliyorsa, Kullanılacak ölçüm cihazı: Derinlik ölçme cihazı vb.)\n** Kusurların ayrıntılı incelenmesi için gerektiğinde büyüteç ve ayna kullanılmıştır. (Tank içerisine girilebiliyorsa)\n** İç yüzeylerde korozyon, çatlak, çöküntü, oluk, laminasyon, tümsek, eğilme vb. deformasyon yoktur.\n** İç yüzeylerde görülen deformasyonlar değerlendirilmiş ve gerekirse ilave muayene teknikleri talep edilmiştir.",
        "kaynak": "TS EN 12817:2019 6.3.1 – 6.3.2 – Ek A.1 – Ek A.2.2 · TS EN 12819:2019 6.3.1 – 6.3.2 – Ek A.1 – Ek A.2.2"
      },
      {
        "no": "3",
        "baslik": "Gözle dış muayene",
        "icerik": "** Gözle muayeneler için dış yüzeyler temiz, kuru ve yabancı maddelerden arındırılmıştır.\n** Kusurları gölge aracılığıyla göstermek üzere, tankın yüzeyi boyunca ışık yönlendirilmiştir.\n** Kusurların ölçüsünü belirleyebilmek için kusur yüzeyi boyunca mastar yerleştirilmiştir.\n** Korozyon, çentik ve oluk derinliği ölçülmüştür. (Kullanılacak ölçüm cihazı: Derinlik ölçme cihazı vb.)\n** Kusurların ayrıntılı incelenmesi için gerektiğinde büyüteç ve ayna kullanılmıştır.\n** Tankın basınçlı kısımları üzerinde tamir kaynağı işlemlerinin (ağız, manşon, takviye plakası, mapa vb.) olması durumunda yetkili kuruluşun onayı vardır.\n** Tankın basınçlı kısımları üzerinde dizayn projesi haricinde sonradan ilave edilmiş ek plaka kaynağı yoktur.\n** Dış yüzeylerde korozyon, çatlak, çöküntü, oluk, laminasyon, tümsek, eğilme vb. deformasyon yoktur.\n* Dış yüzeylerde boya dökülmesi veya çatlaması yoktur.\n** Dış yüzeylerde görülen deformasyonlar değerlendirilmiş, gerekirse ilave muayene teknikleri talep edilmiş ve sonuçlarının uygun olduğu görülmüştür.\n* Kaplamada herhangi bir deformasyon yoktur.\n** El, baş, adam vb. gözetleme açıklıklarında herhangi bir çözülme ve deformasyon yoktur.\nNot: Tanklarda pasif yangın önleme sistemi varsa, gözle muayene yöntemlerinin uygulanması uygun değildir.\nNot: Yer altı tanklarda kontrol sadece görülebilir yüzeyler için gerçekleştirilir.",
        "kaynak": "TS EN 12817:2019 6.3.1 – 6.3.2 – Ek A.1 – Ek A.2.1 · TS EN 12819:2019 6.3.1 – 6.3.2 – Ek A.1 – Ek A.2.1"
      },
      {
        "no": "4",
        "baslik": "Hidrostatik test",
        "icerik": "** Tank üzerindeki tüm bağlantılar sökülmüş ve/veya körlenmiştir.\n** Test akışkanı olarak su veya üretici tarafından uygun görülen sıvı kullanılmıştır.\n** Test akışkanı sıcaklığı 7 ˚C’un altına düşmemiştir.\n** Tanka test basıncı uygulanmadan önce hava ceplerinin oluşumunu önlemek için tankın havası uygun bir şekilde alınmalıdır.\n** Tank içindeki basınç kademeli olarak tankın bilgi etiketinde belirtilen test basıncına kadar arttırılmış ve test pompasından ayrılmıştır. (Kullanılacak ölçüm cihazı: Manometre)\n** Test işlemi 10 dakikadan az olmayacak şekilde gerçekleştirilmiştir.\n** Yakın inceleme için tank basıncı izin verilen maksimum basınç veya altına düşürülmüştür.\n** Tankın üretici bilgi etiketi veya belgeleme üzerinde belirtilen basınç değerinde basınç uygulanarak gerçekleştirildi, kalıcı uzama, deformasyon ve sızıntı yoktur. (Kullanılacak ölçüm cihazları: Manometre ve Şerit metre)\nNot: Kontrol içeriğinde belirtilen kriterler ekipmanın kullanım yeri, kullanım amacı, tip ve modellerine vb. göre değişkenlik gösterebilmektedir. İlgili imalat mevzuatı ve/veya standardı baz alınarak ekipmanda belirtilen risklerin bulunmadığı durumda kontrol kriterleri aranmayacaktır. Kontrol içeriğinde belirtilen kriterin o ekipmanda aranıp aranmayacağı ile ilgili karar standart maddesi bölümünde atıf yapılan mevzuat ve/veya standart ma ddelerine dikkat edilerek verilmelidir. Belirtilen kriterin ekipmanın hangi tipinde, modelinde, imal yılında vb. ol ması gerektiği mevzuat ve/veya standart maddelerine göre değerlendirilmelidir. Kriterin kontrol içeriğinde bulunması her ekipman için zorunlu olarak aranacak kriter anlamına gelmemektedir.\nNot: Bu doküman tanklara yönelik yangın söndürme sistemlerine ilişkin herhangi bir değerlendirme içermez.\nNot: İki yıldız (**) ağır kusuru ifade etmektedir. Ağır kusur tespit edilen ekipmanlar tespit edilen kusurlar giderilmeden çalıştırılamaz.",
        "kaynak": "TS EN 12817:2019 6.3.1 – 6.3.2 – Ek B · TS EN 12819:2019 6.3.1 – 6.3.2 – Ek B · TS 1446:1998 T4: Nisan 2011 2.7.2"
      },
      {
        "no": "5",
        "baslik": "Akustik emisyon",
        "icerik": "** Akustik emisyon testini geçekleştiren ve sonuçları değerlendiren kişi TS EN ISO 9712’ye göre en az Akustik Test (AT) seviye 2’dir.\n** Akustik emisyon r aporunda akustik emisyon testinin TS EN 12817 veya TS EN 12819 Ek C’de belirtilen kriterlere göre gerçekleştirildiği beyan edilmiştir.\n** Akustik emisyon r aporunda tank kimlik bilgileri, test tarihi, test basıncı, basınçlandırma oranı, basınçlı kap derecelendirmesi (13 m 3 üstü tanklar için), değerlendirme katsayısı ve tanımlanmış yüksek akustik patlama sayılarının aşılması durumunda yüksek ve düşük tepe genlik değerlerinden yüksek olan akustik emisyon olaylarının sayısı vardır.\n** Akustik emisyon r aporunda tankın basınçlandırma değerinin, son hizmet süresi içinde ulaşılan en yüksek işletme basıncının en az %10 daha fazlası olduğu görülmüştür.\n** Akustik emisyon raporunda sensörlerin tankın boyutlarına, kaplama durumuna vb. dikkat edilerek gerekli sayıda ve mesafede yerleştirilmiş olduğu bilgisi (yazılı veya görsel) vardır.\n** Akustik emisyon r aporunda akustik emisyon kaynaklarının sınıflandırılmasında aktif veya çok aktif kaynağın olmadığı, sadece minör kaynakların olduğu görülmelidir.",
        "kaynak": "TS EN 12817:2019 6.3.1 – 6.3.2 – Ek C · TS EN 12819:2019 6.3.1 – 6.3.2 – Ek C"
      },
      {
        "no": "6",
        "baslik": "Ultrasonik kalınlık kontrolleri",
        "icerik": "** Ultrasonik kalınlık ölçümünü geçekleştiren ve sonuçları değerlendiren kişi TS EN ISO 9712’ye göre en az Ultrasonik Kalınlık Ölçümü seviye 2’dir.\n** Ultrasonik kalınlık ölçüm r aporunda ultrasonik kalınlık ölçümünün TS EN 128 17 veya TS EN 12819 Ek D’de belirtilen kriterlere göre gerçekleştirildiği beyan edilmiştir.\n** Ultrasonik kalınlık ölçüm raporunda gövde ve bombeler üzerinde gerekli sayıda ve mesafede ölçümlerin alınmış, bu ölçümlerin tank üzerinde hangi noktalardan alındığı raporda şematik bir çizim ile belirtilmiş ve kontrol ölçüm değerleri yazılmıştır.\n** Ultrasonik kalınlık ölçüm raporunda yer alan minimum gövde ve bombe kalınlıkları tankın tasarım değerlerinde belirtilen değerlerden (korozyon payı vb.) yüksektir.\n** Ultrasonik kalınlık ölçüm raporunda t ankın imalatındaki kalınlık ile mevcut minimum kalınlığı değerlendirilerek bulunan korozyon hızına göre ileriki yeterliliğin yeniden değerlendirme süresine yönelik tavsiye verilmiştir.",
        "kaynak": "TS EN 12817:2019 6.3.1 – 6.3.2 – Ek D · TS EN 12819:2019 6.3.1 – 6.3.2 – Ek D"
      },
      {
        "no": "7",
        "baslik": "Yer altı tankları için katodik koruma izleme",
        "icerik": "** Yazılı planda belirtilen katodik koruma izleme verileri kontrol edilmektedir ve gerektiğinde düzeltici faaliyetler yapılmıştır.\n** Katodik koruma izleme ölçümü periyodik kontrol yapmaya yetkili kişi tarafından yapılmıştır.\n** Katodik koruma izleme raporunda sarf (kurbanlık) anotla katodik koruma izlemesinin etkin olduğu ve anotların kalan ömür süresinin yeterli olduğunun belirtildiği görülmüştür.\n** Katodik koruma izleme raporunda dış akım kaynaklı katodik koruma izlenmesi için ölçülen değerlerin sınır değerler ile karşılaştırıldığı ve değerlendirildiği görülmüştür.",
        "kaynak": "TS EN 12817:2019 6.3.2 – 7.10 – Ek G – Ek H · TS EN 12819:2019 6.3.2 – 7.15 – Ek E – Ek F"
      },
      {
        "no": "8",
        "baslik": "Emniyet valfi/valfleri testi veya yeni/yenilenmiş bir valf ile değişimi",
        "icerik": "** Emniyet valfinin en geç 5 yılda bir yeni bir valf ile değiştirildiği veya yenilendiği (sertifika tarihinin geçerli olduğu kontrol edilmiştir) veya test edildiği ve uygun olduğu görülmüştür.\n** Emniyet valfi için test seçeneğinin kullanılması durumunda; emniyet valfi/valfleri ayar basıncında tahliyeyi gerçekleştirmekte ve tam açma konumuna geçebilmektedir. (Kullanılacak ölçüm cihazı: Manometre)\n** Emniyet valfi için test seçeneğinin kullanılması durumunda; t ahliyenin gerçekleşmesinden sonra emniyet valfi /valfleri kapanmaktadır. (Kullanılacak ölçüm cihazı: Manometre)",
        "kaynak": "TS EN 12817:2019 6.3.1 – 6.3.2 – 7.5.1 · TS EN 12819:2019 6.3.1 – 6.3.2 – 7.5.1"
      }
    ],
    "notlar": [
      "Akustik emisyon, ultrasonik kalınlık ve katodik koruma izleme raporları bu raporun ekidir.",
      "Seri imal basınçlı kapların örnekleme yoluyla yeniden değerlendirilmesini kapsamaz."
    ]
  }
];

export const kriterBelgesi = (kod: string) => KRITER_BELGELERI.find((x) => x.kod === kod) ?? null;

/** 428: formatın atıf yaptığı kriter belgeleri — madde standardındaki ZPKKnn ve formatın Bakanlık form kodu (ZPKR03 → ZPKK03); saha raporunun
    standart penceresi bunları metniyle açar */
export function formatKriterleri(t: FormatTanimi): KriterBelgesi[] {
  const kodlar = new Set<string>();
  for (const b of t.bolumler) if (b.blok === "liste") for (const g of b.gruplar) for (const m of g.maddeler) {
    const k = /\bZPKK\d{2}\b/i.exec(m.std ?? "")?.[0].toUpperCase();
    if (k) kodlar.add(k);
  }
  return KRITER_BELGELERI.filter((x) => kodlar.has(x.kod) || (!!t.gorunum.formKodu && x.rapor === t.gorunum.formKodu));
}
