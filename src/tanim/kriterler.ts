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
