/* KONTROL KRİTERLERİ — Bakanlığın periyodik kontrol kriterleri belgeleri (maket standartlar.html #/kriterler; reisim 2026-09-27: "kriterler de
   sistem de muhafaza edilecek … bunlar ilgili ekipmanın muayenesi ile alakalı tariflerdir"). Belgeler KODDA tutulur, site içinde düzenlenmez
   (yayımlanmış mevzuat metni; firma verisi değil). Maketteki veriden bir kez aktarıldı (docs/assets/maket-veri.js KONTROL_BELGELERI). */
export interface KriterMaddesi { no: string; baslik: string; icerik: string; kaynak: string }
export interface KriterBelgesi { kod: string; ad: string; tur: string; rapor: string; yayim: string; yururluk: string; kapsam: string; maddeler: KriterMaddesi[]; notlar: string[] }

export const KRITER_BELGELERI: readonly KriterBelgesi[] = [
  {
    "kod": "ZPKK01",
    "ad": "Alçak Gerilim Topraklama Tesisatı Periyodik Kontrol Kriterleri",
    "tur": "AT",
    "rapor": "ZPKR01",
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
  }
];

export const kriterBelgesi = (kod: string) => KRITER_BELGELERI.find((x) => x.kod === kod) ?? null;
